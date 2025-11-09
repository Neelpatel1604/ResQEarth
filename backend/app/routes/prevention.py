"""Prevention planning endpoints."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    PreventionPlanRequest,
    PreventionPlan,
    SimulationRequest,
    SimulationResult,
    PreventionAction,
    PreventionActionType,
)
from app.services.firms_service import get_firms_service
from datetime import datetime
import time
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/prevention/calculate", response_model=PreventionPlan)
async def calculate_prevention_plan(request: PreventionPlanRequest):
    """
    Calculate optimal prevention plan.
    
    This endpoint:
    - Validates the threat exists
    - Calculates risk reduction based on actions
    - Optimizes action placement (placeholder for genetic algorithm)
    - Returns prevention plan with risk reduction
    """
    # Find the threat from FIRMS API
    try:
        firms_service = get_firms_service()
        disasters = firms_service.fetch_wildfire_data(days=10)  # Fetch last 10 days to find the threat
        threat = next((d for d in disasters if d.id == request.threat_id), None)
        
        if not threat:
            raise HTTPException(
                status_code=404,
                detail=f"Disaster threat with ID '{request.threat_id}' not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching disaster {request.threat_id}: {e}")
        raise HTTPException(
            status_code=404,
            detail=f"Disaster threat with ID '{request.threat_id}' not found"
        )
    
    # Calculate total cost
    total_cost = sum(action.cost for action in request.actions)
    
    # Check budget limit
    if request.budget_limit is not None and total_cost > request.budget_limit:
        raise HTTPException(
            status_code=400,
            detail=f"Total cost ${total_cost:,.2f} exceeds budget limit ${request.budget_limit:,.2f}"
        )
    
    # Calculate risk reduction based on actions
    # This is a simplified calculation - in production, this would use the genetic algorithm
    initial_risk = threat.risk_percentage
    
    # Calculate effectiveness of each action type
    action_effectiveness = {
        PreventionActionType.GOATS: 15.0,
        PreventionActionType.CONTROLLED_BURN: 25.0,
        PreventionActionType.WATER_BOMBER: 30.0,
        PreventionActionType.DRONE_SEED_BOMB: 10.0,
        PreventionActionType.COMMUNITY_ALERT: 5.0,
        PreventionActionType.RETASK_SATELLITE: 8.0,
        PreventionActionType.AI_KILL_SWITCH: 50.0,  # Auto-solve
    }
    
    # Calculate cumulative risk reduction
    risk_reduction = 0.0
    for action in request.actions:
        base_effectiveness = action_effectiveness.get(action.type, 5.0)
        # Scale by quantity if applicable
        quantity_multiplier = 1.0 + (action.quantity or 1) * 0.1
        effectiveness = min(base_effectiveness * quantity_multiplier, 100.0)
        risk_reduction += effectiveness
    
    # Cap risk reduction to not exceed initial risk
    risk_reduction = min(risk_reduction, initial_risk)
    final_risk = max(0.0, initial_risk - risk_reduction)
    
    # Simulate AI calculation time (1.2 seconds as mentioned in README)
    calculation_start = time.time()
    time.sleep(0.1)  # Simulate processing (reduced for faster response)
    calculation_time = time.time() - calculation_start
    
    # Determine if plan is successful (risk < 5%)
    success = final_risk < 5.0
    
    # Update actions with calculated effectiveness
    optimized_actions = []
    for action in request.actions:
        action.effectiveness = action_effectiveness.get(action.type, 5.0)
        optimized_actions.append(action)
    
    return PreventionPlan(
        threat_id=request.threat_id,
        initial_risk=initial_risk,
        final_risk=final_risk,
        risk_reduction=risk_reduction,
        total_cost=total_cost,
        actions=optimized_actions,
        calculation_time=calculation_time,
        success=success,
    )


@router.post("/prevention/simulate", response_model=SimulationResult)
async def simulate_prevention(request: SimulationRequest):
    """
    Run 72-hour simulation of prevention plan.
    
    This endpoint:
    - Simulates the disaster progression over 72 hours
    - Shows how prevention actions affect risk over time
    - Returns whether disaster was prevented
    """
    # Find the threat from FIRMS API
    try:
        firms_service = get_firms_service()
        disasters = firms_service.fetch_wildfire_data(days=10)  # Fetch last 10 days to find the threat
        threat = next((d for d in disasters if d.id == request.threat_id), None)
        
        if not threat:
            raise HTTPException(
                status_code=404,
                detail=f"Disaster threat with ID '{request.threat_id}' not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching disaster {request.threat_id}: {e}")
        raise HTTPException(
            status_code=404,
            detail=f"Disaster threat with ID '{request.threat_id}' not found"
        )
    
    # Simulate risk over 72 hours
    simulation_hours = 72
    risk_over_time = []
    
    initial_risk = request.prevention_plan.initial_risk
    final_risk = request.prevention_plan.final_risk
    
    # Generate risk curve (decreasing if prevention is effective)
    for hour in range(simulation_hours + 1):
        # Linear interpolation from initial to final risk
        progress = hour / simulation_hours
        current_risk = initial_risk - (initial_risk - final_risk) * progress
        # Add some noise for realism
        noise = (hash(f"{request.threat_id}-{hour}") % 5) - 2
        current_risk = max(0.0, min(100.0, current_risk + noise))
        risk_over_time.append(current_risk)
    
    # Determine if disaster was prevented
    disaster_prevented = request.prevention_plan.success
    
    # Calculate damage avoided and hectares saved
    damage_avoided_usd = None
    hectares_saved = None
    
    if disaster_prevented and threat.area_at_risk_hectares:
        # Estimate damage: ~$3,400 per hectare (based on wildfire averages)
        hectares_saved = threat.area_at_risk_hectares
        damage_avoided_usd = hectares_saved * 3400.0
    
    # If not prevented, calculate fire spread
    fire_spread_hectares = None
    if not disaster_prevented and threat.type.value == "wildfire":
        # Estimate fire spread if not prevented
        fire_spread_hectares = threat.area_at_risk_hectares * 0.75 if threat.area_at_risk_hectares else None
    
    return SimulationResult(
        threat_id=request.threat_id,
        disaster_prevented=disaster_prevented,
        simulation_hours=simulation_hours,
        risk_over_time=risk_over_time,
        fire_spread_hectares=fire_spread_hectares,
        damage_avoided_usd=damage_avoided_usd,
        hectares_saved=hectares_saved,
    )

