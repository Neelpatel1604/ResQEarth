"""Ambee Fire API service for fetching wildfire data as fallback."""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any

import requests
from app.config import settings
from app.models.schemas import DisasterThreat, DisasterType, Location, SatelliteData

logger = logging.getLogger(__name__)

# Ambee Fire API base URL
AMBEE_API_BASE = "https://api.ambeedata.com/fire"

# Key fire-prone regions to monitor (lat, lng)
# These are major fire-prone areas around the world
FIRE_PRONE_REGIONS = [
    # California, USA
    {"lat": 36.7783, "lng": -119.4179, "name": "California, USA"},
    # Australia
    {"lat": -25.2744, "lng": 133.7751, "name": "Australia"},
    # Mediterranean (Greece, Spain, Italy)
    {"lat": 39.0742, "lng": 21.8243, "name": "Mediterranean"},
    # Amazon Basin
    {"lat": -3.4653, "lng": -62.2159, "name": "Amazon Basin"},
    # Siberia
    {"lat": 61.5240, "lng": 105.3188, "name": "Siberia"},
    # Canada (British Columbia, Alberta)
    {"lat": 56.1304, "lng": -106.3468, "name": "Canada"},
    # Portugal/Spain
    {"lat": 39.3999, "lng": -8.2245, "name": "Iberian Peninsula"},
    # Indonesia
    {"lat": -0.7893, "lng": 113.9213, "name": "Indonesia"},
    # South Africa
    {"lat": -30.5595, "lng": 22.9375, "name": "South Africa"},
    # Chile
    {"lat": -35.6751, "lng": -71.5430, "name": "Chile"},
]


class AmbeeService:
    """Service for interacting with Ambee Fire API as fallback."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Ambee service.
        
        Args:
            api_key: Ambee API key. If None, uses AMBEE_API_KEY from settings.
        """
        self.api_key = api_key or settings.AMBEE_API_KEY
        if not self.api_key:
            logger.warning("AMBEE_API_KEY not configured. Ambee API calls will fail.")
    
    def fetch_wildfire_data(
        self,
        regions: Optional[List[Dict[str, Any]]] = None,
        use_cache: bool = True
    ) -> List[DisasterThreat]:
        """
        Fetch wildfire data from Ambee Fire API for specific regions.
        
        Note: No filtering applied - returns all fires from Ambee API.
        
        Args:
            regions: List of region dicts with 'lat', 'lng', 'name'. 
                     If None, uses default FIRE_PRONE_REGIONS.
            use_cache: Whether to use cached data if available (not implemented yet)
        
        Returns:
            List of DisasterThreat objects representing wildfire hotspots
        """
        if not self.api_key:
            logger.error("AMBEE_API_KEY not configured")
            return []
        
        # Use default regions if none provided
        if regions is None:
            regions = FIRE_PRONE_REGIONS
        
        all_fires = []
        
        # Fetch fire data for each region
        for region in regions:
            try:
                lat = region.get('lat')
                lng = region.get('lng')
                region_name = region.get('name', f"{lat},{lng}")
                
                if lat is None or lng is None:
                    logger.warning(f"Invalid region data: {region}. Skipping.")
                    continue
                
                # Ambee Fire API endpoint: /fire/latest/by-lat-lng
                # API key goes in query parameter, not header
                url = f"{AMBEE_API_BASE}/latest/by-lat-lng"
                params = {
                    "lat": lat,
                    "lng": lng,
                    "x-api-key": self.api_key
                }
                headers = {
                    "Content-type": "application/json"
                }
                
                logger.info(f"Fetching Ambee fire data for region: {region_name} ({lat}, {lng})")
                
                # Make API request with timeout
                response = requests.get(url, params=params, headers=headers, timeout=30)
                
                # Check for errors
                if response.status_code == 401:
                    logger.error("Ambee API authentication failed. Check API key.")
                    continue
                elif response.status_code == 429:
                    logger.warning("Ambee API rate limit exceeded. Skipping region.")
                    continue
                elif response.status_code >= 400:
                    logger.warning(f"Ambee API error {response.status_code} for region {region_name}: {response.text}")
                    continue
                
                response.raise_for_status()
                
                # Parse JSON response
                data = response.json()
                
                # Log the response structure for debugging
                logger.debug(f"Ambee API response structure for {region_name}: {type(data)}, keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
                
                # Ambee API returns: {"message":"success","data":[...]}
                fires = []
                if isinstance(data, dict):
                    if 'data' in data:
                        # Ambee returns data in 'data' field
                        fires = data['data'] if isinstance(data['data'], list) else [data['data']]
                    elif 'message' in data and isinstance(data.get('message'), list):
                        # Fallback: check message field
                        fires = data['message']
                elif isinstance(data, list):
                    fires = data
                
                if fires:
                    logger.info(f"Found {len(fires)} fires in region {region_name}")
                    # Log first fire structure for debugging
                    if len(fires) > 0:
                        logger.debug(f"Sample fire data structure: {list(fires[0].keys()) if isinstance(fires[0], dict) else 'Not a dict'}")
                    all_fires.extend(fires)
                else:
                    logger.info(f"No fires found in region {region_name}")
                    
            except requests.exceptions.RequestException as e:
                logger.warning(f"Error fetching Ambee data for region {region.get('name', 'unknown')}: {e}")
                continue
            except Exception as e:
                logger.warning(f"Unexpected error processing Ambee data for region {region.get('name', 'unknown')}: {e}")
                continue
        
        # Transform fires to DisasterThreat objects
        # No filtering applied - return all fires from Ambee
        disaster_threats = self.transform_to_disaster_threat(all_fires)
        
        logger.info(f"Transformed {len(disaster_threats)} Ambee fires to disaster threats (no filtering applied)")
        
        return disaster_threats
    
    def transform_to_disaster_threat(self, fires: List[Dict[str, Any]]) -> List[DisasterThreat]:
        """
        Transform Ambee fire data to DisasterThreat objects.
        
        Args:
            fires: List of fire dictionaries from Ambee API
        
        Returns:
            List of DisasterThreat objects
        """
        disaster_threats = []
        
        for fire in fires:
            try:
                # Extract coordinates - Ambee API uses 'lat' and 'lng'
                latitude = None
                longitude = None
                
                # Ambee API format: {"lat": 19.79212, "lng": -155.36777, ...}
                if 'lat' in fire:
                    try:
                        latitude = float(fire['lat'])
                    except (ValueError, TypeError):
                        pass
                
                if 'lng' in fire:
                    try:
                        longitude = float(fire['lng'])
                    except (ValueError, TypeError):
                        pass
                
                if latitude is None or longitude is None:
                    logger.warning(f"Could not extract coordinates from fire: {list(fire.keys())[:5]}")
                    continue
                
                # Validate coordinates
                if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
                    logger.warning(f"Invalid coordinates: {latitude}, {longitude}. Skipping.")
                    continue
                
                # Parse timestamp - Ambee uses 'detectedAt' field
                predicted_time = datetime.now(timezone.utc)
                if 'detectedAt' in fire:
                    try:
                        detected_at = fire['detectedAt']
                        if isinstance(detected_at, str):
                            # ISO format: "2025-11-08T13:14:00.000Z"
                            # Parse as timezone-aware
                            if detected_at.endswith('Z'):
                                predicted_time = datetime.fromisoformat(detected_at.replace('Z', '+00:00'))
                            else:
                                predicted_time = datetime.fromisoformat(detected_at)
                            # Ensure it's timezone-aware
                            if predicted_time.tzinfo is None:
                                predicted_time = predicted_time.replace(tzinfo=timezone.utc)
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Error parsing detectedAt: {e}. Using current time.")
                        predicted_time = datetime.now(timezone.utc)
                elif 'timestamp' in fire:
                    try:
                        ts = fire['timestamp']
                        if isinstance(ts, (int, float)):
                            # Unix timestamp - create timezone-aware datetime
                            predicted_time = datetime.fromtimestamp(ts, tz=timezone.utc)
                        elif isinstance(ts, str):
                            # ISO format string
                            if ts.endswith('Z'):
                                predicted_time = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                            else:
                                predicted_time = datetime.fromisoformat(ts)
                            if predicted_time.tzinfo is None:
                                predicted_time = predicted_time.replace(tzinfo=timezone.utc)
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Error parsing timestamp: {e}. Using current time.")
                        predicted_time = datetime.now(timezone.utc)
                
                # Calculate time window - both must be timezone-aware
                current_time = datetime.now(timezone.utc)
                time_window_hours = max(0, int((current_time - predicted_time).total_seconds() / 3600))
                
                # Extract risk/confidence indicators from Ambee API
                # Ambee format: {"confidence": "nominal"|"high"|"low", "frp": 22.19, "fwi": 0.91}
                confidence_map = {
                    'nominal': 30.0,
                    'low': 50.0,
                    'medium': 70.0,
                    'high': 90.0,
                }
                
                confidence = 70.0  # Default
                if 'confidence' in fire:
                    conf_val = fire['confidence']
                    if isinstance(conf_val, str):
                        confidence = confidence_map.get(conf_val.lower(), 70.0)
                    elif isinstance(conf_val, (int, float)):
                        confidence = float(conf_val)
                
                # Use FRP (Fire Radiative Power) to calculate risk percentage
                # FRP typically ranges from 0-1000+ MW
                risk_percentage = 50.0  # Default
                if 'frp' in fire:
                    try:
                        frp = float(fire['frp'])
                        # Map FRP to risk percentage (0-100)
                        # FRP > 50 = high risk, FRP > 20 = medium risk
                        if frp > 50:
                            risk_percentage = min(100, 70 + (frp - 50) / 5)  # Scale 50-100+
                        elif frp > 20:
                            risk_percentage = 50 + (frp - 20) / 3  # Scale 20-50
                        else:
                            risk_percentage = 30 + (frp / 20) * 20  # Scale 0-20
                    except (ValueError, TypeError):
                        pass
                
                # Extract location name (Ambee doesn't provide this, use coordinates)
                location_name = fire.get('name') or fire.get('location_name') or fire.get('region') or None
                
                # Create location
                location = Location(
                    latitude=latitude,
                    longitude=longitude,
                    name=location_name
                )
                
                # Extract satellite data from Ambee API
                # Ambee provides: frp (Fire Radiative Power), fwi (Fire Weather Index)
                temperature_anomaly = None
                fuel_dryness = None
                
                # Use FWI (Fire Weather Index) as fuel dryness indicator
                # FWI typically ranges from 0-100+
                if 'fwi' in fire:
                    try:
                        fwi = float(fire['fwi'])
                        # Map FWI to fuel dryness (higher FWI = drier fuel)
                        fuel_dryness = min(100, max(0, fwi * 10))  # Scale FWI to 0-100
                    except (ValueError, TypeError):
                        pass
                
                # Use FRP as temperature anomaly indicator
                if 'frp' in fire:
                    try:
                        frp = float(fire['frp'])
                        # Higher FRP indicates higher temperature
                        temperature_anomaly = frp / 100.0  # Normalize FRP
                    except (ValueError, TypeError):
                        pass
                
                satellite_data = SatelliteData(
                    temperature_anomaly=temperature_anomaly,
                    fuel_dryness=fuel_dryness,
                )
                
                # Generate unique ID
                threat_id = f"ambee_{latitude:.4f}_{longitude:.4f}_{predicted_time.strftime('%Y%m%d%H%M')}"
                
                # Create DisasterThreat
                disaster_threat = DisasterThreat(
                    id=threat_id,
                    type=DisasterType.WILDFIRE,
                    location=location,
                    risk_percentage=round(risk_percentage, 1),
                    time_window_hours=time_window_hours,
                    predicted_time=predicted_time,
                    confidence=round(confidence, 1),
                    satellite_data=satellite_data,
                )
                
                disaster_threats.append(disaster_threat)
            
            except (KeyError, ValueError, TypeError) as e:
                logger.warning(f"Error transforming fire: {e}. Skipping.")
                continue
        
        return disaster_threats


# Global service instance
_ambee_service: Optional[AmbeeService] = None


def get_ambee_service() -> AmbeeService:
    """Get or create global AmbeeService instance."""
    global _ambee_service
    if _ambee_service is None:
        _ambee_service = AmbeeService()
    return _ambee_service

