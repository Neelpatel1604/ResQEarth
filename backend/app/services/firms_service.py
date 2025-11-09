"""NASA FIRMS API service for fetching wildfire hotspot data."""
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from io import StringIO

import pandas as pd
import requests
from app.config import settings
from app.models.schemas import DisasterThreat, DisasterType, Location, SatelliteData

logger = logging.getLogger(__name__)

# FIRMS API base URL
FIRMS_API_BASE = "https://firms.modaps.eosdis.nasa.gov/api"

# Cache storage (in-memory)
_cache: Dict[str, tuple[List[DisasterThreat], datetime]] = {}
CACHE_TTL_MINUTES = 7


class FirmsService:
    """Service for interacting with NASA FIRMS API."""
    
    def __init__(self, map_key: Optional[str] = None):
        """
        Initialize FIRMS service.
        
        Args:
            map_key: FIRMS MAP_KEY. If None, uses FIRMS_MAP_KEY from settings.
        """
        self.map_key = map_key or settings.FIRMS_MAP_KEY
        if not self.map_key:
            logger.warning("FIRMS_MAP_KEY not configured. FIRMS API calls will fail.")
    
    def _get_cache_key(self, days: int, bbox: Optional[str] = None) -> str:
        """Generate cache key from parameters."""
        key_str = f"firms_{days}_{bbox or 'global'}"
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def _is_cache_valid(self, cache_entry: tuple[List[DisasterThreat], datetime]) -> bool:
        """Check if cache entry is still valid."""
        _, cached_time = cache_entry
        age = datetime.utcnow() - cached_time
        return age < timedelta(minutes=CACHE_TTL_MINUTES)
    
    def _parse_bbox(self, bbox: Optional[str]) -> str:
        """
        Parse bounding box string to FIRMS format.
        
        Args:
            bbox: Bounding box as "lat1,lon1,lat2,lon2" or None for global
        
        Returns:
            Bounding box string in FIRMS format
        """
        if not bbox:
            # Global bounding box
            return "-90,-180,90,180"
        
        try:
            parts = bbox.split(',')
            if len(parts) != 4:
                raise ValueError("Bounding box must have 4 values: lat1,lon1,lat2,lon2")
            
            lat1, lon1, lat2, lon2 = [float(p.strip()) for p in parts]
            
            # Validate ranges
            if not (-90 <= lat1 <= 90 and -90 <= lat2 <= 90):
                raise ValueError("Latitude must be between -90 and 90")
            if not (-180 <= lon1 <= 180 and -180 <= lon2 <= 180):
                raise ValueError("Longitude must be between -180 and 180")
            
            return f"{lat1},{lon1},{lat2},{lon2}"
        except (ValueError, AttributeError) as e:
            logger.warning(f"Invalid bounding box format '{bbox}': {e}. Using global bounds.")
            return "-90,-180,90,180"
    
    def fetch_wildfire_data(
        self,
        days: int = 7,
        bbox: Optional[str] = None,
        use_cache: bool = True
    ) -> List[DisasterThreat]:
        """
        Fetch wildfire hotspot data from FIRMS API.
        
        Args:
            days: Number of days to fetch (default: 7, max: 10)
            bbox: Bounding box as "lat1,lon1,lat2,lon2" or None for global
            use_cache: Whether to use cached data if available
        
        Returns:
            List of DisasterThreat objects representing wildfire hotspots
        """
        if not self.map_key:
            logger.error("FIRMS_MAP_KEY not configured")
            return []
        
        # Limit days to 10 (FIRMS API limit)
        days = min(max(days, 1), 10)
        
        # Check cache
        if use_cache:
            cache_key = self._get_cache_key(days, bbox)
            if cache_key in _cache:
                cached_data, cached_time = _cache[cache_key]
                if self._is_cache_valid((cached_data, cached_time)):
                    logger.info(f"Returning cached FIRMS data (age: {datetime.utcnow() - cached_time})")
                    return cached_data
                else:
                    # Remove expired cache
                    del _cache[cache_key]
        
        # Limit days to 10 (FIRMS API limit)
        days = min(max(days, 1), 10)
        
        # Determine area - use 'world' for global, or handle bounding box if needed
        if bbox:
            # For bounding box, we'll use 'world' and filter later
            # Note: FIRMS API format doesn't support bounding box directly in this endpoint
            area = 'world'
            logger.info(f"Bounding box specified, but using 'world' area (filtering will be done after fetch)")
        else:
            area = 'world'
        
        all_hotspots = []
        
        try:
            # Build FIRMS API URL using the working format
            # Format: /area/csv/{MAP_KEY}/{SENSOR}/{AREA}/{DAYS}
            url = f"{FIRMS_API_BASE}/area/csv/{self.map_key}/VIIRS_SNPP_NRT/{area}/{days}"
            
            logger.info(f"Fetching FIRMS data for last {days} days (area: {area})")
            
            # Make API request with timeout
            response = requests.get(url, timeout=30)
            
            # Check for 500 errors and stop retrying immediately
            if response.status_code == 500:
                logger.error(f"Server error (500). FIRMS API returned 500 - likely no data available or API issue.")
                return []
            
            response.raise_for_status()
            
            # Parse CSV response
            if response.text.strip():
                df = pd.read_csv(StringIO(response.text))
                
                # Strip whitespace from column names (FIRMS CSV might have spaces)
                df.columns = df.columns.str.strip()
                
                # Log column names for debugging
                logger.info(f"FIRMS CSV columns: {list(df.columns)}")
                logger.info(f"FIRMS CSV shape: {df.shape}")
                
                # Log sample data to see what we're working with
                if not df.empty:
                    logger.info(f"Sample row: {df.iloc[0].to_dict()}")
                
                if not df.empty:
                    # Filter for high-risk fires only
                    # High confidence (h), high brightness (>345K), strong energy release (frp > 10)
                    try:
                        # Build filter conditions
                        confidence_filter = df['confidence'].str.lower() == 'h'
                        brightness_filter = pd.to_numeric(df['bright_ti4'], errors='coerce') > 345
                        
                        # FRP might not always be present, so handle it gracefully
                        if 'frp' in df.columns:
                            frp_filter = pd.to_numeric(df['frp'], errors='coerce') > 10
                            high_risk_mask = confidence_filter & brightness_filter & frp_filter
                        else:
                            # If no FRP column, just use confidence and brightness
                            high_risk_mask = confidence_filter & brightness_filter
                            logger.info("FRP column not found, filtering by confidence and brightness only")
                        
                        # Apply filter
                        filtered_df = df[high_risk_mask]
                        
                        if not filtered_df.empty:
                            # Convert DataFrame to list of dicts
                            hotspots = filtered_df.to_dict('records')
                            all_hotspots.extend(hotspots)
                            logger.info(f"Fetched {len(hotspots)} high-risk hotspots (filtered from {len(df)} total) for last {days} days")
                        else:
                            logger.info(f"No high-risk hotspots found (filtered from {len(df)} total) for last {days} days")
                    except Exception as e:
                        logger.warning(f"Error filtering high-risk fires: {e}. Using all hotspots.")
                        # Fallback: use all hotspots if filtering fails
                        hotspots = df.to_dict('records')
                        all_hotspots.extend(hotspots)
                        logger.info(f"Fetched {len(hotspots)} hotspots (no filtering applied) for last {days} days")
                    
                    # If bounding box was specified, filter the results
                    if bbox:
                        try:
                            bbox_parts = bbox.split(',')
                            if len(bbox_parts) == 4:
                                lat1, lon1, lat2, lon2 = [float(p.strip()) for p in bbox_parts]
                                # Filter hotspots within bounding box
                                filtered_hotspots = []
                                for hotspot in all_hotspots:
                                    lat = float(hotspot.get('latitude', 0))
                                    lon = float(hotspot.get('longitude', 0))
                                    if lat1 <= lat <= lat2 and lon1 <= lon <= lon2:
                                        filtered_hotspots.append(hotspot)
                                all_hotspots = filtered_hotspots
                                logger.info(f"Filtered to {len(all_hotspots)} hotspots within bounding box")
                        except (ValueError, KeyError) as e:
                            logger.warning(f"Error filtering by bounding box: {e}. Using all hotspots.")
                else:
                    logger.info(f"No hotspots found for last {days} days")
            else:
                logger.info(f"Empty response from FIRMS API")
        
        except requests.exceptions.HTTPError as e:
            if e.response and e.response.status_code == 500:
                logger.error(f"Server error (500): {e}. FIRMS API returned 500 - stopping immediately.")
                return []
            else:
                logger.error(f"HTTP error fetching FIRMS data: {e}")
                return []
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching FIRMS data: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error processing FIRMS data: {e}")
            return []
        
        # Transform hotspots to DisasterThreat objects
        disaster_threats = self.transform_to_disaster_threat(all_hotspots)
        
        # Cache the results
        if use_cache:
            cache_key = self._get_cache_key(days, bbox)
            _cache[cache_key] = (disaster_threats, datetime.utcnow())
            logger.info(f"Cached {len(disaster_threats)} disaster threats")
        
        return disaster_threats
    
    def transform_to_disaster_threat(self, hotspots: List[Dict[str, Any]]) -> List[DisasterThreat]:
        """
        Transform FIRMS hotspot data to DisasterThreat objects.
        
        Args:
            hotspots: List of hotspot dictionaries from FIRMS CSV
        
        Returns:
            List of DisasterThreat objects
        """
        disaster_threats = []
        
        for hotspot in hotspots:
            try:
                # Extract required fields - FIRMS CSV uses lowercase 'latitude' and 'longitude'
                # Based on test.py, columns are: latitude, longitude, bright_ti4, acq_date, confidence
                try:
                    latitude = float(hotspot.get('latitude', hotspot.get('Latitude', hotspot.get('LATITUDE', 0))))
                    longitude = float(hotspot.get('longitude', hotspot.get('Longitude', hotspot.get('LONGITUDE', 0))))
                except (ValueError, TypeError, KeyError) as e:
                    # If still not found, log the available keys
                    logger.warning(f"Could not extract coordinates from hotspot. Error: {e}")
                    logger.warning(f"Available keys: {list(hotspot.keys())[:10]}")
                    logger.warning(f"Hotspot sample: {dict(list(hotspot.items())[:5])}")
                    continue
                
                # Check if coordinates are valid (not 0,0 which is default)
                if latitude == 0 and longitude == 0:
                    logger.warning(f"Coordinates are 0,0 (default). Skipping hotspot.")
                    continue
                
                # Validate coordinates
                if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
                    logger.warning(f"Invalid coordinates: {latitude}, {longitude}. Skipping.")
                    continue
                
                # Log first few successful extractions for debugging
                if len(disaster_threats) < 3:
                    logger.info(f"Successfully extracted coordinates: lat={latitude}, lon={longitude} for hotspot {hotspot.get('acq_date', 'unknown')}")
                
                # Parse acquisition date and time
                acq_date = str(hotspot.get('acq_date', '')).strip()
                acq_time = hotspot.get('acq_time', '0000')
                
                # Convert to datetime
                try:
                    # Parse date (YYYY-MM-DD or YYYY/MM/DD)
                    if not acq_date:
                        raise ValueError("Missing acq_date")
                    
                    # Try different date formats
                    date_parts = None
                    if '-' in acq_date:
                        date_parts = acq_date.split('-')
                    elif '/' in acq_date:
                        date_parts = acq_date.split('/')
                    
                    if date_parts and len(date_parts) == 3:
                        year, month, day = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])
                        
                        # Parse time (HHMM format, HH:MM format, or minutes since midnight)
                        acq_time_str = str(acq_time).strip()
                        if ':' in acq_time_str:
                            # HH:MM format
                            time_parts = acq_time_str.split(':')
                            hour = int(time_parts[0])
                            minute = int(time_parts[1])
                        elif len(acq_time_str) <= 3:
                            # Minutes since midnight (e.g., 26 = 00:26, 1440 = 24:00)
                            minutes_since_midnight = int(acq_time_str)
                            hour = minutes_since_midnight // 60
                            minute = minutes_since_midnight % 60
                            # Handle overflow (e.g., 1440 = 24:00 = 00:00 next day)
                            if hour >= 24:
                                hour = hour % 24
                        else:
                            # HHMM format (4 digits)
                            acq_time_str = acq_time_str.zfill(4)
                            hour = int(acq_time_str[:2])
                            minute = int(acq_time_str[2:4])
                        
                        # Validate time values
                        if not (0 <= hour <= 23 and 0 <= minute <= 59):
                            raise ValueError(f"Invalid time: {hour}:{minute}")
                        
                        predicted_time = datetime(year, month, day, hour, minute)
                    else:
                        raise ValueError(f"Invalid date format: {acq_date}")
                except (ValueError, AttributeError, IndexError, TypeError) as e:
                    logger.warning(f"Error parsing date/time (date: {acq_date}, time: {acq_time}): {e}. Using current time.")
                    predicted_time = datetime.utcnow()
                
                # Calculate time window (hours since acquisition)
                time_window_hours = max(0, int((datetime.utcnow() - predicted_time).total_seconds() / 3600))
                
                # Extract brightness and confidence
                # FIRMS CSV uses 'bright_ti4' for brightness
                brightness_raw = hotspot.get('bright_ti4') or hotspot.get('brightness', 0)
                try:
                    brightness = float(brightness_raw) if brightness_raw else 0.0
                except (ValueError, TypeError):
                    brightness = 0.0
                
                confidence = str(hotspot.get('confidence', 'n')).lower().strip()
                
                # Map confidence to numeric value
                confidence_map = {
                    'n': 30.0,  # nominal
                    'l': 50.0,  # low
                    'm': 70.0,  # medium
                    'h': 90.0,  # high
                }
                confidence_value = confidence_map.get(confidence, 50.0)
                
                # Calculate risk percentage from brightness
                # Brightness typically ranges from ~300-500K for VIIRS
                # Normalize to 0-100 scale
                min_brightness = 300.0
                max_brightness = 500.0
                
                if brightness <= 0:
                    normalized_brightness = 0.0
                elif brightness < min_brightness:
                    # Below minimum, scale from 0 to 30
                    normalized_brightness = (brightness / min_brightness) * 30.0
                elif brightness > max_brightness:
                    # Above maximum, cap at 100
                    normalized_brightness = 100.0
                else:
                    # Normal range
                    normalized_brightness = 30.0 + ((brightness - min_brightness) / (max_brightness - min_brightness)) * 70.0
                
                # Use brightness as base risk, adjusted by confidence
                risk_percentage = min(100, max(0, normalized_brightness * (confidence_value / 100)))
                
                # Generate unique ID
                threat_id = f"firms_{latitude:.4f}_{longitude:.4f}_{predicted_time.strftime('%Y%m%d%H%M')}"
                
                # Create location (try to get country/region name if available)
                location_name = None
                if 'country_id' in hotspot:
                    location_name = hotspot.get('country_id', '')
                
                location = Location(
                    latitude=latitude,
                    longitude=longitude,
                    name=location_name
                )
                
                # Create satellite data
                satellite_data = SatelliteData(
                    temperature_anomaly=brightness / 100.0,  # Approximate temperature from brightness
                    fuel_dryness=min(100, brightness / 5.0),  # Estimate fuel dryness
                )
                
                # Create DisasterThreat
                disaster_threat = DisasterThreat(
                    id=threat_id,
                    type=DisasterType.WILDFIRE,
                    location=location,
                    risk_percentage=round(risk_percentage, 1),
                    time_window_hours=time_window_hours,
                    predicted_time=predicted_time,
                    confidence=round(confidence_value, 1),
                    satellite_data=satellite_data,
                )
                
                disaster_threats.append(disaster_threat)
            
            except (KeyError, ValueError, TypeError) as e:
                logger.warning(f"Error transforming hotspot: {e}. Skipping.")
                continue
        
        logger.info(f"Transformed {len(disaster_threats)} hotspots to disaster threats")
        
        # Log sample of first disaster threat to verify coordinates
        if disaster_threats:
            sample = disaster_threats[0]
            logger.info(f"Sample disaster threat: id={sample.id}, lat={sample.location.latitude}, lon={sample.location.longitude}, type={sample.type}")
        
        return disaster_threats


# Global service instance
_firms_service: Optional[FirmsService] = None


def get_firms_service() -> FirmsService:
    """Get or create global FirmsService instance."""
    global _firms_service
    if _firms_service is None:
        _firms_service = FirmsService()
    return _firms_service

