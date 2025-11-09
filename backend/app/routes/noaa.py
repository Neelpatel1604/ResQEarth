"""NOAA Water API endpoints for flood prediction."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
from app.services.noaa_service import noaa_service

router = APIRouter()


@router.get("/noaa/locations")
async def get_noaa_locations(
    state: Optional[str] = Query(None, description="Filter by state code (e.g., CA, TX)"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of results")
):
    """
    Get available NOAA forecast locations.
    
    - **state**: Optional state code filter
    - **limit**: Maximum number of results (1-500)
    """
    locations = await noaa_service.get_forecast_locations(state=state, limit=limit)
    
    return {
        "locations": locations,
        "count": len(locations)
    }


@router.get("/noaa/forecast/{location_id}")
async def get_noaa_forecast(
    location_id: str,
    forecast_date: Optional[str] = Query(None, description="Forecast date (YYYY-MM-DD)")
):
    """
    Get streamflow forecast for a specific location.
    
    - **location_id**: NOAA location identifier
    - **forecast_date**: Optional date in YYYY-MM-DD format
    """
    forecast = await noaa_service.get_streamflow_forecast(
        location_id=location_id,
        forecast_date=forecast_date
    )
    
    if not forecast:
        raise HTTPException(
            status_code=404,
            detail=f"No forecast data found for location '{location_id}'"
        )
    
    return forecast


@router.get("/noaa/thresholds/{location_id}")
async def get_flood_thresholds(location_id: str):
    """
    Get flood stage thresholds for a location.
    
    - **location_id**: NOAA location identifier
    """
    thresholds = await noaa_service.get_flood_thresholds(location_id)
    
    if not thresholds:
        raise HTTPException(
            status_code=404,
            detail=f"No threshold data found for location '{location_id}'"
        )
    
    return thresholds


@router.get("/noaa/flood-risk/{location_id}")
async def analyze_flood_risk(location_id: str):
    """
    Analyze flood risk by comparing forecast to thresholds.
    
    Returns probability of minor, moderate, and major flooding.
    
    - **location_id**: NOAA location identifier
    """
    risk_analysis = await noaa_service.analyze_flood_risk(location_id)
    
    if risk_analysis.get("error"):
        raise HTTPException(
            status_code=500,
            detail=risk_analysis["error"]
        )
    
    return risk_analysis



@router.get("/noaa/flood-risks/all")
async def get_all_flood_risks(
    state: Optional[str] = Query(None, description="Filter by state code"),
    min_risk: float = Query(10.0, ge=0, le=100, description="Minimum risk percentage"),
    max_concurrent: int = Query(10, ge=1, le=50, description="Max concurrent requests")
):
    """
    Get flood risk analysis for all locations (mass pull).
    
    This endpoint fetches flood risk data for all available locations
    and returns only those with significant risk.
    
    - **state**: Optional state code filter (e.g., CA, TX)
    - **min_risk**: Minimum risk percentage to include (0-100)
    - **max_concurrent**: Maximum concurrent API requests (1-50)
    
    Note: This may take 30-60 seconds depending on the number of locations.
    """
    flood_risks = await noaa_service.get_all_flood_risks(
        state=state,
        min_risk_threshold=min_risk,
        max_concurrent=max_concurrent
    )
    
    return {
        "flood_risks": flood_risks,
        "count": len(flood_risks),
        "filter": {
            "state": state,
            "min_risk_percentage": min_risk
        }
    }


@router.get("/noaa/flood-risks/high-risk")
async def get_high_risk_locations(
    min_probability: float = Query(30.0, ge=0, le=100, description="Min major flood probability"),
    limit: int = Query(50, ge=1, le=200, description="Maximum results")
):
    """
    Get locations with high risk of major flooding.
    
    Optimized endpoint that returns only the highest-risk locations.
    
    - **min_probability**: Minimum probability for major flooding (0-100)
    - **limit**: Maximum number of results (1-200)
    """
    high_risk = await noaa_service.get_high_risk_locations(
        min_major_flood_probability=min_probability,
        limit=limit
    )
    
    return {
        "high_risk_locations": high_risk,
        "count": len(high_risk),
        "threshold": {
            "major_flood_probability": min_probability
        }
    }



@router.post("/noaa/cache/clear")
async def clear_cache():
    """
    Clear the NOAA data cache.
    
    Use this to force fresh data from the API.
    """
    from app.services.cache_service import cache_service
    await cache_service.clear()
    
    return {
        "message": "Cache cleared successfully",
        "timestamp": datetime.utcnow().isoformat()
    }
