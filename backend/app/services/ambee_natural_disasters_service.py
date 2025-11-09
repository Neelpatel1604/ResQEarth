"""Ambee Natural Disasters API service for fetching all disaster types."""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Tuple
import hashlib
import json

import requests
from app.config import settings
from app.models.schemas import DisasterThreat, DisasterType, Location, SatelliteData

logger = logging.getLogger(__name__)

# Ambee Natural Disasters API base URL
AMBEE_NATURAL_DISASTERS_API_BASE = "https://api.ambeedata.com/disasters"

# Map Ambeedata event types to our DisasterType enum
EVENT_TYPE_MAP = {
    "EQ": DisasterType.EARTHQUAKE,
    "TC": DisasterType.TROPICAL_CYCLONE,
    "WF": DisasterType.WILDFIRE,
    "FL": DisasterType.FLOOD,
    "ET": DisasterType.EXTREME_TEMPERATURE,
    "DR": DisasterType.DROUGHT,
    "SW": DisasterType.SEVERE_STORM,
    "SI": DisasterType.SEA_ICE,
    "VO": DisasterType.VOLCANO,
    "LS": DisasterType.LANDSLIDE,
    "TN": DisasterType.TSUNAMI,
    "Misc": DisasterType.MISCELLANEOUS,
}

# Reverse map for lookup
DISASTER_TYPE_TO_EVENT_CODE = {v: k for k, v in EVENT_TYPE_MAP.items()}

# Disaster type labels and descriptions
DISASTER_TYPE_LABELS = {
    "TN": {"name": "Tsunamis", "description": "Tsunamis and related sea waves"},
    "EQ": {"name": "Earthquake", "description": "Earthquakes and related seismic activities"},
    "TC": {"name": "Tropical Cyclones", "description": "Tropical cyclones including hurricanes, typhoons & cyclones"},
    "WF": {"name": "Wildfires", "description": "Wildfires and fire related events which includes widlfires, burn off, bushfire, fires, pre fire alerts, structure fire."},
    "FL": {"name": "Floods", "description": "Floods including flash floods and general flooding"},
    "ET": {"name": "Extreme Temperature", "description": "Extreme temperature events including heat waves, cold waves, hot day conditions, etc."},
    "DR": {"name": "Droughts", "description": "Droughts and prolonged dry conditions"},
    "SW": {"name": "Severe storms", "description": "Severe storms, thunderstorms & related weather phenomena which includes lightning, gusty winds, thunder shower, violent wind, storm surge, hailstorm, heavy rain and light rain"},
    "SI": {"name": "Sea Ice", "description": "Sea ice conditions"},
    "VO": {"name": "Volcano", "description": "Volcanic activities and eruptions"},
    "LS": {"name": "Landslides", "description": "Landslides, avalanches and related ground movement"},
    "Misc": {"name": "Miscellaneous", "description": "Miscellaneous events including unique imagery & technical disasters."},
}

# Key regions to monitor globally (lat, lng)
MONITORING_REGIONS = [
    # North America
    {"lat": 40.7128, "lng": -74.0060, "name": "New York, USA"},
    {"lat": 34.0522, "lng": -118.2437, "name": "Los Angeles, USA"},
    {"lat": 45.5017, "lng": -73.5673, "name": "Montreal, Canada"},
    # South America
    {"lat": -23.5505, "lng": -46.6333, "name": "São Paulo, Brazil"},
    {"lat": -34.6037, "lng": -58.3816, "name": "Buenos Aires, Argentina"},
    # Europe
    {"lat": 51.5074, "lng": -0.1278, "name": "London, UK"},
    {"lat": 48.8566, "lng": 2.3522, "name": "Paris, France"},
    {"lat": 52.5200, "lng": 13.4050, "name": "Berlin, Germany"},
    # Asia
    {"lat": 35.6762, "lng": 139.6503, "name": "Tokyo, Japan"},
    {"lat": 28.6139, "lng": 77.2090, "name": "New Delhi, India"},
    {"lat": 39.9042, "lng": 116.4074, "name": "Beijing, China"},
    {"lat": -6.2088, "lng": 106.8456, "name": "Jakarta, Indonesia"},
    # Africa
    {"lat": -26.2041, "lng": 28.0473, "name": "Johannesburg, South Africa"},
    {"lat": 30.0444, "lng": 31.2357, "name": "Cairo, Egypt"},
    # Oceania
    {"lat": -33.8688, "lng": 151.2093, "name": "Sydney, Australia"},
    {"lat": -36.8485, "lng": 174.7633, "name": "Auckland, New Zealand"},
]


class AmbeeNaturalDisastersService:
    """Service for interacting with Ambee Natural Disasters API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Ambee Natural Disasters service.
        
        Args:
            api_key: Ambee API key. If None, uses AMBEE_API_KEY from settings.
        """
        self.api_key = api_key or settings.AMBEE_API_KEY
        if not self.api_key:
            logger.warning("AMBEE_API_KEY not configured. Ambee Natural Disasters API calls will fail.")
        
        # In-memory cache: {cache_key: (data, timestamp)}
        self._cache: Dict[str, Tuple[List[DisasterThreat], datetime]] = {}
        self.cache_ttl = settings.NATURAL_DISASTERS_CACHE_TTL
    
    def _generate_cache_key(self, **kwargs) -> str:
        """Generate a cache key from request parameters."""
        # Sort kwargs for consistent key generation
        sorted_params = sorted(kwargs.items())
        param_str = json.dumps(sorted_params, sort_keys=True)
        return hashlib.md5(param_str.encode()).hexdigest()
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid (within TTL)."""
        if cache_key not in self._cache:
            return False
        
        _, timestamp = self._cache[cache_key]
        age = (datetime.now(timezone.utc) - timestamp).total_seconds()
        return age < self.cache_ttl
    
    def _get_cached_data(self, cache_key: str) -> Optional[List[DisasterThreat]]:
        """Get cached data if valid."""
        if self._is_cache_valid(cache_key):
            data, _ = self._cache[cache_key]
            logger.debug(f"Returning cached data for key: {cache_key[:8]}...")
            return data
        return None
    
    def _set_cache_data(self, cache_key: str, data: List[DisasterThreat]):
        """Store data in cache with current timestamp."""
        self._cache[cache_key] = (data, datetime.now(timezone.utc))
        logger.debug(f"Cached data for key: {cache_key[:8]}...")
    
    def _clear_expired_cache(self):
        """Remove expired cache entries."""
        now = datetime.now(timezone.utc)
        expired_keys = [
            key for key, (_, timestamp) in self._cache.items()
            if (now - timestamp).total_seconds() >= self.cache_ttl
        ]
        for key in expired_keys:
            del self._cache[key]
        if expired_keys:
            logger.debug(f"Cleared {len(expired_keys)} expired cache entries")
    
    def fetch_all_disasters(
        self,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        event_type: Optional[str] = None,
        limit: int = 50,
        page: int = 1,
        regions: Optional[List[Dict[str, Any]]] = None,
    ) -> List[DisasterThreat]:
        """
        Fetch all disaster types from Ambee Natural Disasters API.
        
        Args:
            lat: Latitude for location-based search
            lng: Longitude for location-based search
            event_type: Filter by event type (EQ, TC, WF, FL, etc.)
            limit: Maximum number of results per page (max: 50 for Ambee API)
            page: Page number for pagination
            regions: List of region dicts with 'lat', 'lng', 'name'.
                    If None and lat/lng not provided, uses default MONITORING_REGIONS.
        
        Returns:
            List of DisasterThreat objects representing all disaster types
        """
        if not self.api_key:
            logger.error("AMBEE_API_KEY not configured")
            return []
        
        # Ensure limit doesn't exceed Ambee API maximum of 50
        limit = min(limit, 50)
        
        # Generate cache key
        cache_key = self._generate_cache_key(
            lat=lat, lng=lng, event_type=event_type, limit=limit, page=page
        )
        
        # Check cache first
        cached_data = self._get_cached_data(cache_key)
        if cached_data is not None:
            return cached_data
        
        # Clear expired cache entries
        self._clear_expired_cache()
        
        all_disasters = []
        
        # If specific lat/lng provided, use that
        if lat is not None and lng is not None:
            disasters = self._fetch_by_lat_lng(lat, lng, event_type, limit, page)
            all_disasters.extend(disasters)
        else:
            # Use monitoring regions
            if regions is None:
                regions = MONITORING_REGIONS
            
            # Fetch disasters for each region
            for region in regions:
                try:
                    region_lat = region.get('lat')
                    region_lng = region.get('lng')
                    region_name = region.get('name', f"{region_lat},{region_lng}")
                    
                    if region_lat is None or region_lng is None:
                        logger.warning(f"Invalid region data: {region}. Skipping.")
                        continue
                    
                    logger.info(f"Fetching disasters for region: {region_name} ({region_lat}, {region_lng})")
                    disasters = self._fetch_by_lat_lng(region_lat, region_lng, event_type, limit, page)
                    all_disasters.extend(disasters)
                    
                    # Small delay between region requests to avoid rate limiting
                    import time
                    time.sleep(0.5)
                    
                except Exception as e:
                    logger.warning(f"Error fetching disasters for region {region.get('name', 'unknown')}: {e}")
                    continue
        
        # Remove duplicates based on event ID
        seen_ids = set()
        unique_disasters = []
        for disaster in all_disasters:
            if disaster.id not in seen_ids:
                seen_ids.add(disaster.id)
                unique_disasters.append(disaster)
        
        # Cache the results
        self._set_cache_data(cache_key, unique_disasters)
        
        logger.info(f"Fetched {len(unique_disasters)} unique disasters from Ambee Natural Disasters API")
        return unique_disasters
    
    def _fetch_by_lat_lng(
        self,
        lat: float,
        lng: float,
        event_type: Optional[str] = None,
        limit: int = 50,
        page: int = 1,
    ) -> List[DisasterThreat]:
        """Fetch disasters by latitude and longitude."""
        # Ensure limit doesn't exceed Ambee API maximum of 50
        limit = min(limit, 50)
        
        url = f"{AMBEE_NATURAL_DISASTERS_API_BASE}/latest/by-lat-lng"
        params = {
            "lat": lat,
            "lng": lng,
            "limit": limit,
            "page": page,
        }
        if event_type:
            params["eventType"] = event_type
        
        headers = {
            "x-api-key": self.api_key,
            "Content-type": "application/json",
        }
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=30)
            
            if response.status_code == 401:
                logger.error("Ambee API authentication failed. Check API key.")
                return []
            elif response.status_code == 429:
                logger.warning("Ambee API rate limit exceeded.")
                return []
            elif response.status_code >= 400:
                logger.warning(f"Ambee API error {response.status_code}: {response.text}")
                return []
            
            response.raise_for_status()
            data = response.json()
            
            # Parse response - Ambee API returns data in 'result' field
            disasters_data = []
            if isinstance(data, dict):
                if 'result' in data:
                    # New format: result array
                    disasters_data = data['result'] if isinstance(data['result'], list) else [data['result']]
                elif 'data' in data:
                    # Fallback: data field
                    disasters_data = data['data'] if isinstance(data['data'], list) else [data['data']]
                elif 'message' in data and isinstance(data.get('message'), list):
                    # Fallback: message field
                    disasters_data = data['message']
            elif isinstance(data, list):
                disasters_data = data
            
            # Transform to DisasterThreat objects
            disaster_threats = self.transform_to_disaster_threat(disasters_data)
            
            return disaster_threats
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"Error fetching Ambee Natural Disasters data: {e}")
            return []
        except Exception as e:
            logger.warning(f"Unexpected error processing Ambee data: {e}")
            return []
    
    def fetch_by_location(
        self,
        lat: float,
        lng: float,
        event_type: Optional[str] = None,
        limit: int = 50,
    ) -> List[DisasterThreat]:
        """
        Fetch disasters for a specific location (optimized for Check My Area).
        
        Args:
            lat: Latitude
            lng: Longitude
            event_type: Optional event type filter
            limit: Maximum number of results
        
        Returns:
            List of DisasterThreat objects
        """
        return self.fetch_all_disasters(lat=lat, lng=lng, event_type=event_type, limit=limit)
    
    def transform_to_disaster_threat(self, disasters: List[Dict[str, Any]]) -> List[DisasterThreat]:
        """
        Transform Ambee Natural Disasters API data to DisasterThreat objects.
        
        Args:
            disasters: List of disaster dictionaries from Ambee API
        
        Returns:
            List of DisasterThreat objects
        """
        disaster_threats = []
        
        for disaster in disasters:
            try:
                # Extract event type and map to our enum - new format uses 'event_type'
                event_type_code = disaster.get('event_type', disaster.get('eventType', ''))
                disaster_type = EVENT_TYPE_MAP.get(event_type_code, DisasterType.MISCELLANEOUS)
                
                # Extract coordinates - new format has lat/lng as direct fields
                latitude = None
                longitude = None
                
                # Try direct lat/lng fields first (new format)
                if 'lat' in disaster:
                    try:
                        latitude = float(disaster['lat'])
                    except (ValueError, TypeError):
                        pass
                if 'lng' in disaster:
                    try:
                        longitude = float(disaster['lng'])
                    except (ValueError, TypeError):
                        pass
                
                # Fallback: Extract from lat_lon string (format: "lat,lng")
                if latitude is None or longitude is None:
                    lat_lon_str = disaster.get('lat_lon', '')
                    if lat_lon_str:
                        try:
                            parts = lat_lon_str.split(',')
                            if len(parts) >= 2:
                                latitude = float(parts[0].strip())
                                longitude = float(parts[1].strip())
                        except (ValueError, IndexError):
                            pass
                
                # Fallback: check if lat/lng are in details
                if latitude is None or longitude is None:
                    details = disaster.get('details', {})
                    if 'lat' in details:
                        latitude = float(details['lat'])
                    if 'lng' in details:
                        longitude = float(details['lng'])
                
                if latitude is None or longitude is None:
                    logger.warning(f"Could not extract coordinates from disaster: {disaster.get('event_id', disaster.get('eventId', 'unknown'))}")
                    continue
                
                # Validate coordinates
                if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
                    logger.warning(f"Invalid coordinates: {latitude}, {longitude}. Skipping.")
                    continue
                
                # Parse event date - new format uses 'date' field
                predicted_time = datetime.now(timezone.utc)
                event_date = disaster.get('date', disaster.get('eventDate'))
                if event_date:
                    try:
                        # Try parsing ISO format or "YYYY-MM-DD HH:MM:SS" format
                        if isinstance(event_date, str):
                            # Try ISO format first
                            try:
                                if event_date.endswith('Z'):
                                    predicted_time = datetime.fromisoformat(event_date.replace('Z', '+00:00'))
                                else:
                                    predicted_time = datetime.fromisoformat(event_date)
                            except ValueError:
                                # Try "YYYY-MM-DD HH:MM:SS" format
                                try:
                                    predicted_time = datetime.strptime(event_date, "%Y-%m-%d %H:%M:%S")
                                except ValueError:
                                    # Try "YYYY-MM-DD" format
                                    predicted_time = datetime.strptime(event_date, "%Y-%m-%d")
                            
                            if predicted_time.tzinfo is None:
                                predicted_time = predicted_time.replace(tzinfo=timezone.utc)
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Error parsing date: {e}. Using current time.")
                        predicted_time = datetime.now(timezone.utc)
                
                # Calculate time window
                current_time = datetime.now(timezone.utc)
                time_window_hours = max(0, int((current_time - predicted_time).total_seconds() / 3600))
                
                # Extract details
                details = disaster.get('details', {})
                
                # Calculate risk percentage from severity and alert level
                risk_percentage = 50.0  # Default
                severity = details.get('severity', '').lower()
                alert_level = details.get('alert_level', '').lower()
                episode_alert_score = details.get('episode_alert_score', 0)
                
                # Map severity to risk
                severity_map = {
                    'low': 30.0,
                    'moderate': 50.0,
                    'high': 70.0,
                    'extreme': 90.0,
                }
                if severity in severity_map:
                    risk_percentage = severity_map[severity]
                
                # Adjust based on alert score (0-10 scale)
                if episode_alert_score:
                    try:
                        score = float(episode_alert_score)
                        risk_percentage = min(100, risk_percentage + (score * 3))
                    except (ValueError, TypeError):
                        pass
                
                # Calculate confidence from certainty
                confidence = 70.0  # Default
                certainty = details.get('certainty', '').lower()
                certainty_map = {
                    'unlikely': 30.0,
                    'possible': 50.0,
                    'likely': 70.0,
                    'observed': 90.0,
                }
                if certainty in certainty_map:
                    confidence = certainty_map[certainty]
                
                # Extract location name - new format uses 'event_name'
                location_name = disaster.get('event_name', disaster.get('eventName', disaster.get('eventPlace')))
                
                # Create location
                location = Location(
                    latitude=latitude,
                    longitude=longitude,
                    name=location_name
                )
                
                # Extract satellite/environmental data
                satellite_data = SatelliteData(
                    temperature_anomaly=details.get('temperature_anomaly'),
                    wind_speed=details.get('wind_speed'),
                    wind_direction=details.get('wind_direction'),
                    rain_forecast=details.get('rain_forecast'),
                    soil_moisture=details.get('soil_moisture'),
                    population_at_risk=details.get('exposed_population') or details.get('people_affected'),
                )
                
                # Generate unique ID - new format uses 'event_id'
                event_id = disaster.get('event_id', disaster.get('eventId', ''))
                if event_id:
                    threat_id = f"ambee_{event_id}"
                else:
                    # Fallback to source_event_id if available
                    source_event_id = disaster.get('source_event_id', '')
                    if source_event_id:
                        threat_id = f"ambee_{source_event_id}"
                    else:
                        threat_id = f"ambee_{latitude:.4f}_{longitude:.4f}_{predicted_time.strftime('%Y%m%d%H%M')}"
                
                # Extract area at risk (if available)
                area_at_risk = None
                if 'burned_area' in details:  # Wildfires
                    area_at_risk = details['burned_area']
                elif 'affected_area' in details:
                    area_at_risk = details['affected_area']
                
                # Create DisasterThreat
                disaster_threat = DisasterThreat(
                    id=threat_id,
                    type=disaster_type,
                    location=location,
                    risk_percentage=round(risk_percentage, 1),
                    time_window_hours=time_window_hours,
                    predicted_time=predicted_time,
                    confidence=round(confidence, 1),
                    satellite_data=satellite_data,
                    area_at_risk_hectares=area_at_risk,
                )
                
                disaster_threats.append(disaster_threat)
            
            except (KeyError, ValueError, TypeError) as e:
                logger.warning(f"Error transforming disaster: {e}. Skipping.")
                continue
        
        return disaster_threats


# Global service instance
_natural_disasters_service: Optional[AmbeeNaturalDisastersService] = None


def get_natural_disasters_service() -> AmbeeNaturalDisastersService:
    """Get or create global AmbeeNaturalDisastersService instance."""
    global _natural_disasters_service
    if _natural_disasters_service is None:
        _natural_disasters_service = AmbeeNaturalDisastersService()
    return _natural_disasters_service

