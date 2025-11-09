"""Disaster prediction endpoints."""
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from app.models.schemas import (
    DisasterThreat,
    DisasterType,
    Location,
    SatelliteData,
    DisasterListResponse,
)
from app.services.firms_service import get_firms_service
from app.services.ambee_service import get_ambee_service
from app.services.ambee_natural_disasters_service import get_natural_disasters_service
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/disasters/all", response_model=DisasterListResponse)
async def list_all_disasters(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    event_type: Optional[str] = None,
    limit: int = 50,
    page: int = 1,
    disaster_type: Optional[DisasterType] = None,
    min_risk: Optional[float] = None,
):
    """
    Get list of all disaster types from Ambee Natural Disasters API.
    
    This endpoint fetches all disaster types (earthquakes, cyclones, floods, volcanoes, etc.)
    from the Ambee Natural Disasters API with 10-minute caching.
    
    - **lat**: Latitude for location-based search (optional)
    - **lng**: Longitude for location-based search (optional)
    - **event_type**: Filter by Ambeedata event type code (EQ, TC, WF, FL, ET, DR, SW, SI, VO, LS, TN, Misc)
    - **limit**: Maximum number of results per page (default: 50, max: 50)
    - **page**: Page number for pagination (default: 1)
    - **disaster_type**: Filter by disaster type enum
    - **min_risk**: Filter by minimum risk percentage
    """
    try:
        # Ensure limit doesn't exceed Ambee API maximum of 50
        limit = min(limit, 50)
        
        natural_disasters_service = get_natural_disasters_service()
        disasters = natural_disasters_service.fetch_all_disasters(
            lat=lat,
            lng=lng,
            event_type=event_type,
            limit=limit,
            page=page,
        )
        logger.info(f"Fetched {len(disasters)} disasters from Ambee Natural Disasters API")
        
        # Apply filters
        if disaster_type:
            disasters = [d for d in disasters if d.type == disaster_type]
        
        if min_risk is not None:
            disasters = [d for d in disasters if d.risk_percentage >= min_risk]
        
        # Apply limit
        if limit > 0:
            disasters = disasters[:limit]
        
        return DisasterListResponse(
            disasters=disasters,
            total=len(disasters),
        )
    except Exception as e:
        logger.error(f"Error fetching all disasters: {e}")
        return DisasterListResponse(
            disasters=[],
            total=0,
        )


@router.get("/disasters/check-area", response_model=DisasterListResponse)
async def check_area_disasters(
    lat: float,
    lng: float,
    event_type: Optional[str] = None,
    limit: int = 50,
    disaster_type: Optional[DisasterType] = None,
    min_risk: Optional[float] = None,
):
    """
    Check disasters in a specific area (optimized for "Check My Area" feature).
    
    This endpoint fetches disasters near a specific location using the Ambee Natural Disasters API.
    Results are cached for 10 minutes to respect rate limits.
    
    - **lat**: Latitude (required)
    - **lng**: Longitude (required)
    - **event_type**: Filter by Ambeedata event type code (EQ, TC, WF, FL, ET, DR, SW, SI, VO, LS, TN, Misc)
    - **limit**: Maximum number of results (default: 50, max: 50)
    - **disaster_type**: Filter by disaster type enum
    - **min_risk**: Filter by minimum risk percentage
    """
    try:
        # Validate coordinates
        if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            raise HTTPException(
                status_code=400,
                detail="Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180."
            )
        
        # Ensure limit doesn't exceed Ambee API maximum of 50
        limit = min(limit, 50)
        
        natural_disasters_service = get_natural_disasters_service()
        disasters = natural_disasters_service.fetch_by_location(
            lat=lat,
            lng=lng,
            event_type=event_type,
            limit=limit,
        )
        logger.info(f"Fetched {len(disasters)} disasters for area ({lat}, {lng}) from Ambee Natural Disasters API")
        
        # Apply filters
        if disaster_type:
            disasters = [d for d in disasters if d.type == disaster_type]
        
        if min_risk is not None:
            disasters = [d for d in disasters if d.risk_percentage >= min_risk]
        
        # Apply limit
        if limit > 0:
            disasters = disasters[:limit]
        
        return DisasterListResponse(
            disasters=disasters,
            total=len(disasters),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking area disasters: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching disasters for area: {str(e)}"
        )


@router.get("/disasters", response_model=DisasterListResponse)
async def list_disasters(
    disaster_type: Optional[DisasterType] = None,
    min_risk: Optional[float] = None,
    limit: Optional[int] = None,
    use_firms: bool = True,
    days: int = 7,
    bbox: Optional[str] = None,
):
    """
    Get list of active disaster threats.
    
    - **disaster_type**: Filter by disaster type
    - **min_risk**: Filter by minimum risk percentage
    - **limit**: Limit number of results
    - **use_firms**: Use FIRMS API data (default: True)
    - **days**: Number of days to fetch from FIRMS (default: 7, max: 10)
    - **bbox**: Bounding box as "lat1,lon1,lat2,lon2" for geographic filtering (default: global)
    """
    disasters: List[DisasterThreat] = []
    
    # Fetch data from FIRMS API (primary source)
    if use_firms:
        try:
            firms_service = get_firms_service()
            disasters = firms_service.fetch_wildfire_data(days=days, bbox=bbox)
            logger.info(f"Fetched {len(disasters)} disasters from FIRMS API")
            
            # If FIRMS returns 0 elements (empty list), fallback to Ambee
            if len(disasters) == 0:
                logger.warning("FIRMS API returned 0 elements. Falling back to Ambee Fire API.")
                try:
                    ambee_service = get_ambee_service()
                    # No filters applied to Ambee - returns all fires
                    disasters = ambee_service.fetch_wildfire_data()
                    if len(disasters) > 0:
                        logger.info(f"Successfully fetched {len(disasters)} disasters from Ambee Fire API (fallback)")
                    else:
                        logger.warning("Ambee Fire API also returned 0 elements after filtering.")
                except Exception as ambee_error:
                    logger.error(f"Error fetching Ambee fallback data: {ambee_error}")
                    disasters = []
        except Exception as e:
            logger.error(f"Error fetching FIRMS data: {e}. Falling back to Ambee Fire API.")
            # Try Ambee as fallback when FIRMS fails
            try:
                ambee_service = get_ambee_service()
                # No filters applied to Ambee - returns all fires
                disasters = ambee_service.fetch_wildfire_data()
                logger.info(f"Fetched {len(disasters)} disasters from Ambee Fire API (fallback)")
            except Exception as ambee_error:
                logger.error(f"Error fetching Ambee fallback data: {ambee_error}")
                disasters = []
    else:
        # If FIRMS is disabled, try Ambee directly
        logger.info("FIRMS API is disabled. Using Ambee Fire API.")
        try:
            ambee_service = get_ambee_service()
            # No filters applied to Ambee - returns all fires
            disasters = ambee_service.fetch_wildfire_data()
            logger.info(f"Fetched {len(disasters)} disasters from Ambee Fire API")
        except Exception as ambee_error:
            logger.error(f"Error fetching Ambee data: {ambee_error}")
            disasters = []
    
    # Apply filters
    if disaster_type:
        disasters = [d for d in disasters if d.type == disaster_type]
    
    if min_risk is not None:
        disasters = [d for d in disasters if d.risk_percentage >= min_risk]
    
    # Apply limit
    if limit is not None and limit > 0:
        disasters = disasters[:limit]
    
    return DisasterListResponse(
        disasters=disasters,
        total=len(disasters),
    )


@router.get("/disasters/{threat_id}", response_model=DisasterThreat)
async def get_disaster(threat_id: str):
    """
    Get specific disaster threat details by ID.
    
    - **threat_id**: Unique threat identifier
    """
    # Fetch from FIRMS API and find the matching disaster
    disasters = []
    try:
        firms_service = get_firms_service()
        disasters = firms_service.fetch_wildfire_data(days=10)  # Fetch last 10 days to find the threat
        
        # If FIRMS returns 0 elements, try Ambee fallback
        if len(disasters) == 0:
            logger.warning("FIRMS API returned 0 elements. Trying Ambee Fire API fallback.")
            try:
                ambee_service = get_ambee_service()
                # No filters applied to Ambee - returns all fires
                disasters = ambee_service.fetch_wildfire_data()
                if len(disasters) > 0:
                    logger.info(f"Successfully fetched {len(disasters)} disasters from Ambee Fire API (fallback)")
            except Exception as ambee_error:
                logger.error(f"Error fetching Ambee fallback data: {ambee_error}")
        
        disaster = next((d for d in disasters if d.id == threat_id), None)
        
        if not disaster:
            raise HTTPException(
                status_code=404,
                detail=f"Disaster threat with ID '{threat_id}' not found"
            )
        
        return disaster
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching disaster {threat_id}: {e}")
        # Try Ambee as last resort
        if not disasters:
            try:
                ambee_service = get_ambee_service()
                # No filters applied to Ambee - returns all fires
                disasters = ambee_service.fetch_wildfire_data()
                disaster = next((d for d in disasters if d.id == threat_id), None)
                if disaster:
                    return disaster
            except Exception:
                pass
        
        raise HTTPException(
            status_code=404,
            detail=f"Disaster threat with ID '{threat_id}' not found"
        )


@router.get("/disasters/count/total")
async def get_total_disaster_count(
    all_disasters: bool = False
):
    """
    Get total count of active disaster threats.
    
    - **all_disasters**: If True, count all disaster types from Ambee Natural Disasters API.
                       If False (default), count only wildfires from FIRMS/Ambee Fire API.
    """
    disasters = []
    try:
        if all_disasters:
            # Count all disaster types from Ambee Natural Disasters API
            try:
                natural_disasters_service = get_natural_disasters_service()
                disasters = natural_disasters_service.fetch_all_disasters(limit=50)
                logger.info(f"Fetched {len(disasters)} total disasters from Ambee Natural Disasters API")
            except Exception as e:
                logger.error(f"Error fetching all disasters count: {e}")
                disasters = []
        else:
            # Count only wildfires from FIRMS API (with Ambee fallback)
            firms_service = get_firms_service()
            disasters = firms_service.fetch_wildfire_data(days=1)  # Last 24 hours
            
            # If FIRMS returns 0 elements, try Ambee fallback
            if len(disasters) == 0:
                logger.warning("FIRMS API returned 0 elements. Trying Ambee Fire API fallback.")
                try:
                    ambee_service = get_ambee_service()
                    disasters = ambee_service.fetch_wildfire_data()
                    if len(disasters) > 0:
                        logger.info(f"Successfully fetched {len(disasters)} disasters from Ambee Fire API (fallback)")
                except Exception as ambee_error:
                    logger.error(f"Error fetching Ambee fallback data: {ambee_error}")
        
        return {
            "total": len(disasters),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error fetching disaster count: {e}")
        # Try Ambee as last resort (for fire only)
        if not all_disasters:
            try:
                ambee_service = get_ambee_service()
                disasters = ambee_service.fetch_wildfire_data()
                return {
                    "total": len(disasters),
                    "timestamp": datetime.utcnow().isoformat(),
                }
            except Exception:
                pass
        
        return {
            "total": 0,
            "timestamp": datetime.utcnow().isoformat(),
        }

