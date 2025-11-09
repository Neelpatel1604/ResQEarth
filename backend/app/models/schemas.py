"""Pydantic models for API request/response schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DisasterType(str, Enum):
    """Types of disasters that can be predicted."""
    # Existing types
    WILDFIRE = "wildfire"
    FLOOD = "flood"
    THUNDERSTORM = "thunderstorm"
    HEATWAVE = "heatwave"
    VOLCANIC_ASH = "volcanic_ash"
    # Ambeedata Natural Disasters API types
    EARTHQUAKE = "earthquake"  # EQ
    TROPICAL_CYCLONE = "tropical_cyclone"  # TC
    EXTREME_TEMPERATURE = "extreme_temperature"  # ET
    DROUGHT = "drought"  # DR
    SEVERE_STORM = "severe_storm"  # SW
    SEA_ICE = "sea_ice"  # SI
    VOLCANO = "volcano"  # VO
    LANDSLIDE = "landslide"  # LS
    TSUNAMI = "tsunami"  # TN
    MISCELLANEOUS = "miscellaneous"  # Misc


class PreventionActionType(str, Enum):
    """Types of prevention actions."""
    GOATS = "goats"
    CONTROLLED_BURN = "controlled_burn"
    WATER_BOMBER = "water_bomber"
    DRONE_SEED_BOMB = "drone_seed_bomb"
    COMMUNITY_ALERT = "community_alert"
    RETASK_SATELLITE = "retask_satellite"
    AI_KILL_SWITCH = "ai_kill_switch"


class Location(BaseModel):
    """Geographic location."""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in degrees")
    name: Optional[str] = Field(None, description="Location name")


class SatelliteData(BaseModel):
    """Satellite data sources."""
    fuel_dryness: Optional[float] = Field(None, ge=0, le=100, description="Fuel dryness percentage")
    temperature_anomaly: Optional[float] = Field(None, description="Temperature anomaly in Celsius")
    wind_speed: Optional[float] = Field(None, ge=0, description="Wind speed in km/h")
    wind_direction: Optional[float] = Field(None, ge=0, le=360, description="Wind direction in degrees")
    rain_forecast: Optional[float] = Field(None, ge=0, description="Rain forecast in mm")
    soil_moisture: Optional[float] = Field(None, ge=0, le=100, description="Soil moisture percentage")
    lightning_density: Optional[float] = Field(None, ge=0, description="Lightning density")
    population_at_risk: Optional[int] = Field(None, ge=0, description="Population at risk")


class DisasterThreat(BaseModel):
    """Disaster threat prediction."""
    id: str = Field(..., description="Unique threat identifier")
    type: DisasterType = Field(..., description="Type of disaster")
    location: Location = Field(..., description="Threat location")
    risk_percentage: float = Field(..., ge=0, le=100, description="Risk percentage (0-100)")
    time_window_hours: int = Field(..., ge=0, description="Time window in hours until disaster")
    predicted_time: Optional[datetime] = Field(None, description="Predicted disaster time")
    area_at_risk_hectares: Optional[float] = Field(None, ge=0, description="Area at risk in hectares")
    satellite_data: Optional[SatelliteData] = Field(None, description="Satellite prediction data")
    confidence: Optional[float] = Field(None, ge=0, le=100, description="Prediction confidence percentage")


class PreventionAction(BaseModel):
    """Prevention action to reduce disaster risk."""
    type: PreventionActionType = Field(..., description="Type of prevention action")
    location: Location = Field(..., description="Action location")
    quantity: Optional[int] = Field(None, ge=0, description="Quantity (e.g., number of goats)")
    cost: float = Field(..., ge=0, description="Cost in USD")
    effectiveness: Optional[float] = Field(None, ge=0, le=100, description="Effectiveness percentage")
    description: Optional[str] = Field(None, description="Action description")


class PreventionPlanRequest(BaseModel):
    """Request to calculate a prevention plan."""
    threat_id: str = Field(..., description="Disaster threat ID")
    actions: List[PreventionAction] = Field(..., description="List of prevention actions")
    budget_limit: Optional[float] = Field(None, ge=0, description="Budget limit in USD")


class PreventionPlan(BaseModel):
    """Calculated prevention plan."""
    threat_id: str = Field(..., description="Disaster threat ID")
    initial_risk: float = Field(..., ge=0, le=100, description="Initial risk percentage")
    final_risk: float = Field(..., ge=0, le=100, description="Final risk percentage after actions")
    risk_reduction: float = Field(..., ge=0, le=100, description="Risk reduction percentage")
    total_cost: float = Field(..., ge=0, description="Total cost in USD")
    actions: List[PreventionAction] = Field(..., description="Optimized prevention actions")
    calculation_time: float = Field(..., ge=0, description="Calculation time in seconds")
    success: bool = Field(..., description="Whether prevention plan is successful (risk < 5%)")


class SimulationRequest(BaseModel):
    """Request to run 72-hour simulation."""
    threat_id: str = Field(..., description="Disaster threat ID")
    prevention_plan: PreventionPlan = Field(..., description="Prevention plan to simulate")


class SimulationResult(BaseModel):
    """72-hour simulation result."""
    threat_id: str = Field(..., description="Disaster threat ID")
    disaster_prevented: bool = Field(..., description="Whether disaster was prevented")
    simulation_hours: int = Field(default=72, description="Simulation duration in hours")
    risk_over_time: List[float] = Field(..., description="Risk percentage at each hour")
    fire_spread_hectares: Optional[float] = Field(None, ge=0, description="Fire spread in hectares (if not prevented)")
    damage_avoided_usd: Optional[float] = Field(None, ge=0, description="Damage avoided in USD")
    hectares_saved: Optional[float] = Field(None, ge=0, description="Hectares saved")


class DisasterListResponse(BaseModel):
    """Response containing list of disaster threats."""
    disasters: List[DisasterThreat] = Field(..., description="List of disaster threats")
    total: int = Field(..., description="Total number of threats")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")

