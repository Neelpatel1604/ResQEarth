"""Disaster prediction endpoints."""
from fastapi import APIRouter, HTTPException
from typing import Optional
from app.models.schemas import (
    DisasterThreat,
    DisasterType,
    Location,
    SatelliteData,
    DisasterListResponse,
)
from datetime import datetime, timedelta
import random

router = APIRouter()


# Mock data store (in production, this would come from Supabase/database)
MOCK_DISASTERS = [
    DisasterThreat(
        id="threat-001",
        type=DisasterType.WILDFIRE,
        location=Location(
            latitude=35.2401,
            longitude=24.8093,
            name="Crete, Greece"
        ),
        risk_percentage=94.0,
        time_window_hours=54,
        predicted_time=datetime.utcnow() + timedelta(hours=54),
        area_at_risk_hectares=12400.0,
        confidence=94.0,
        satellite_data=SatelliteData(
            fuel_dryness=87.5,
            temperature_anomaly=4.2,
            wind_speed=68.0,
            wind_direction=315.0,
            rain_forecast=0.0,
            soil_moisture=12.3,
            population_at_risk=42000,
        ),
    ),
    DisasterThreat(
        id="threat-002",
        type=DisasterType.WILDFIRE,
        location=Location(
            latitude=-3.4653,
            longitude=-62.2159,
            name="Amazon Rainforest, Brazil"
        ),
        risk_percentage=89.0,
        time_window_hours=34,
        predicted_time=datetime.utcnow() + timedelta(hours=34),
        area_at_risk_hectares=45000.0,
        confidence=89.0,
        satellite_data=SatelliteData(
            fuel_dryness=92.1,
            temperature_anomaly=5.8,
            wind_speed=45.0,
            wind_direction=180.0,
            rain_forecast=0.0,
            soil_moisture=8.7,
            population_at_risk=125000,
        ),
    ),
    DisasterThreat(
        id="threat-003",
        type=DisasterType.FLOOD,
        location=Location(
            latitude=28.6139,
            longitude=77.2090,
            name="Delhi, India"
        ),
        risk_percentage=76.0,
        time_window_hours=48,
        predicted_time=datetime.utcnow() + timedelta(hours=48),
        area_at_risk_hectares=8500.0,
        confidence=76.0,
        satellite_data=SatelliteData(
            soil_moisture=95.2,
            rain_forecast=250.0,
            temperature_anomaly=2.1,
            population_at_risk=280000,
        ),
    ),
]


@router.get("/disasters", response_model=DisasterListResponse)
async def list_disasters(
    disaster_type: Optional[DisasterType] = None,
    min_risk: Optional[float] = None,
    limit: Optional[int] = None,
):
    """
    Get list of active disaster threats.
    
    - **disaster_type**: Filter by disaster type
    - **min_risk**: Filter by minimum risk percentage
    - **limit**: Limit number of results
    """
    disasters = MOCK_DISASTERS.copy()
    
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
    disaster = next((d for d in MOCK_DISASTERS if d.id == threat_id), None)
    
    if not disaster:
        raise HTTPException(
            status_code=404,
            detail=f"Disaster threat with ID '{threat_id}' not found"
        )
    
    return disaster


@router.get("/disasters/count/total")
async def get_total_disaster_count():
    """Get total count of active disaster threats."""
    # In production, this would query the database
    # For now, return a mock count that matches the README
    return {
        "total": 5842,
        "timestamp": datetime.utcnow().isoformat(),
    }

