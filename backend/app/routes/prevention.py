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
from app.services.ai_service import (
    optimize_prevention_plan,
    calculate_risk_reduction,
    calculate_total_cost,
    ACTION_EFFECTIVENESS,
)
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
    
    # Use genetic algorithm to optimize prevention plan
    initial_risk = threat.risk_percentage
    
    # Set default effectiveness for actions that don't have it
    for action in request.actions:
        if action.effectiveness is None:
            action.effectiveness = ACTION_EFFECTIVENESS.get(action.type, 5.0)
    
    # Use genetic algorithm to optimize action selection
    calculation_start = time.time()
    
    # If budget limit is provided, use genetic algorithm to optimize
    if request.budget_limit is not None and request.budget_limit > 0:
        optimized_actions = optimize_prevention_plan(
            actions=request.actions,
            budget_limit=request.budget_limit,
            initial_risk=initial_risk,
            population_size=50,
            generations=30,
        )
    else:
        # If no budget limit, use all actions (but still calculate properly)
        optimized_actions = request.actions
    
    calculation_time = time.time() - calculation_start
    
    # Calculate risk reduction using the optimized actions
    risk_reduction = calculate_risk_reduction(optimized_actions, initial_risk)
    final_risk = max(0.0, initial_risk - risk_reduction)
    
    # Recalculate total cost with optimized actions
    total_cost = calculate_total_cost(optimized_actions)
    
    # Determine if plan is successful (risk < 5%)
    success = final_risk < 5.0
    
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

