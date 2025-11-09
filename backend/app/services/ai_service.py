"""AI service for genetic algorithm optimization using DEAP."""
import random
import time
from typing import List, Tuple, Dict
from deap import base, creator, tools
from app.models.schemas import PreventionAction, PreventionActionType
import logging

logger = logging.getLogger(__name__)

# Default effectiveness values for each action type
ACTION_EFFECTIVENESS: Dict[PreventionActionType, float] = {
    PreventionActionType.GOATS: 15.0,
    PreventionActionType.CONTROLLED_BURN: 25.0,
    PreventionActionType.WATER_BOMBER: 30.0,
    PreventionActionType.DRONE_SEED_BOMB: 10.0,
    PreventionActionType.COMMUNITY_ALERT: 5.0,
    PreventionActionType.RETASK_SATELLITE: 8.0,
    PreventionActionType.AI_KILL_SWITCH: 50.0,
}

# Synergy multipliers when actions are combined
SYNERGY_MULTIPLIERS = {
    (PreventionActionType.CONTROLLED_BURN, PreventionActionType.WATER_BOMBER): 1.15,
    (PreventionActionType.GOATS, PreventionActionType.DRONE_SEED_BOMB): 1.10,
    (PreventionActionType.COMMUNITY_ALERT, PreventionActionType.RETASK_SATELLITE): 1.08,
}


def _calculate_action_effectiveness(action: PreventionAction) -> float:
    """Calculate the effectiveness of a single action."""
    base_effectiveness = ACTION_EFFECTIVENESS.get(action.type, 5.0)
    
    # Scale by quantity if applicable
    quantity_multiplier = 1.0 + (action.quantity or 1) * 0.1
    
    # Use provided effectiveness if available, otherwise calculate
    if action.effectiveness is not None:
        effectiveness = action.effectiveness * quantity_multiplier
    else:
        effectiveness = base_effectiveness * quantity_multiplier
    
    return min(effectiveness, 100.0)


def calculate_risk_reduction(selected_actions: List[PreventionAction], initial_risk: float) -> float:
    """Calculate total risk reduction from selected actions with synergy effects."""
    if not selected_actions:
        return 0.0
    
    # Calculate base effectiveness
    total_effectiveness = sum(_calculate_action_effectiveness(action) for action in selected_actions)
    
    # Apply synergy bonuses
    synergy_bonus = 1.0
    action_types = [action.type for action in selected_actions]
    
    for (type1, type2), multiplier in SYNERGY_MULTIPLIERS.items():
        if type1 in action_types and type2 in action_types:
            synergy_bonus *= multiplier
    
    # Apply diminishing returns (each additional action is slightly less effective)
    diminishing_factor = 1.0 - (len(selected_actions) - 1) * 0.05
    
    total_effectiveness = total_effectiveness * synergy_bonus * diminishing_factor
    
    # Cap risk reduction to not exceed initial risk
    risk_reduction = min(total_effectiveness, initial_risk)
    
    return risk_reduction


def calculate_total_cost(selected_actions: List[PreventionAction]) -> float:
    """Calculate total cost of selected actions."""
    return sum(action.cost for action in selected_actions)


def _evaluate_fitness(
    individual: List[int],
    available_actions: List[PreventionAction],
    budget_limit: float,
    initial_risk: float,
) -> Tuple[float, float, float]:
    """
    Evaluate fitness of an individual (action combination).
    
    Returns:
        Tuple of (risk_reduction, cost, fitness_score)
        Higher fitness_score is better (risk_reduction / cost ratio)
    """
    # Decode individual (binary list) to selected actions
    selected_actions = [
        available_actions[i] for i, bit in enumerate(individual) if bit == 1
    ]
    
    # Check budget constraint
    total_cost = _calculate_total_cost(selected_actions)
    
    if total_cost > budget_limit:
        # Penalize solutions that exceed budget
        return (-1000.0, total_cost, -1000.0)
    
    # Calculate risk reduction
    risk_reduction = calculate_risk_reduction(selected_actions, initial_risk)
    
    # Fitness: maximize risk reduction per dollar spent
    # Add small epsilon to avoid division by zero
    if total_cost > 0:
        fitness_score = risk_reduction / (total_cost + 1.0)
    else:
        fitness_score = 0.0
    
    # Multi-objective: also consider absolute risk reduction
    # Weight: 70% efficiency, 30% absolute reduction
    weighted_fitness = 0.7 * fitness_score + 0.3 * (risk_reduction / 100.0)
    
    return (risk_reduction, total_cost, weighted_fitness)


def _create_individual(available_actions: List[PreventionAction], budget_limit: float) -> List[int]:
    """Create a random individual (action combination) that respects budget."""
    individual = [0] * len(available_actions)
    
    # Randomly select actions until budget is reached
    available_indices = list(range(len(available_actions)))
    random.shuffle(available_indices)
    
    total_cost = 0.0
    for idx in available_indices:
        action = available_actions[idx]
        if total_cost + action.cost <= budget_limit:
            individual[idx] = 1
            total_cost += action.cost
        else:
            # Try with 30% probability even if it exceeds budget slightly
            if random.random() < 0.3 and total_cost + action.cost <= budget_limit * 1.1:
                individual[idx] = 1
                total_cost += action.cost
    
    return individual


def _mutate_individual(
    individual: List[int],
    available_actions: List[PreventionAction],
    budget_limit: float,
    indpb: float = 0.1
) -> Tuple[List[int]]:
    """Mutate an individual by flipping bits with probability indpb."""
    for i in range(len(individual)):
        if random.random() < indpb:
            individual[i] = 1 - individual[i]
    
    # Ensure budget constraint is maintained
    selected_actions = [
        available_actions[i] for i, bit in enumerate(individual) if bit == 1
    ]
    total_cost = calculate_total_cost(selected_actions)
    
    # If budget exceeded, remove random actions until within budget
    while total_cost > budget_limit and selected_actions:
        remove_idx = random.randint(0, len(selected_actions) - 1)
        removed_action = selected_actions.pop(remove_idx)
        total_cost -= removed_action.cost
        
        # Update individual
        action_idx = available_actions.index(removed_action)
        individual[action_idx] = 0
    
    return (individual,)


def _cx_two_point(ind1: List[int], ind2: List[int]) -> Tuple[List[int], List[int]]:
    """Two-point crossover between two individuals."""
    size = min(len(ind1), len(ind2))
    cxpoint1 = random.randint(1, size)
    cxpoint2 = random.randint(1, size - 1)
    
    if cxpoint2 >= cxpoint1:
        cxpoint2 += 1
    else:
        cxpoint1, cxpoint2 = cxpoint2, cxpoint1
    
    ind1[cxpoint1:cxpoint2], ind2[cxpoint1:cxpoint2] = (
        ind2[cxpoint1:cxpoint2],
        ind1[cxpoint1:cxpoint2],
    )
    
    return (ind1, ind2)


def optimize_prevention_plan(
    actions: List[PreventionAction],
    budget_limit: float,
    initial_risk: float,
    population_size: int = 50,
    generations: int = 30,
    crossover_prob: float = 0.7,
    mutation_prob: float = 0.2,
) -> List[PreventionAction]:
    """
    Optimize prevention plan using genetic algorithm.
    
    Uses DEAP library to evolve optimal action combinations that:
    - Maximize risk reduction per dollar spent
    - Stay within budget constraints
    - Consider action synergies
    
    Args:
        actions: List of available prevention actions
        budget_limit: Maximum budget in USD
        initial_risk: Initial disaster risk percentage
        population_size: Size of genetic algorithm population
        generations: Number of generations to evolve
        crossover_prob: Probability of crossover
        mutation_prob: Probability of mutation
        
    Returns:
        Optimized list of prevention actions
    """
    if not actions:
        return []
    
    if budget_limit <= 0:
        return []
    
    start_time = time.time()
    
    # Setup DEAP (check if already created to avoid errors)
    if not hasattr(creator, "FitnessMax"):
        creator.create("FitnessMax", base.Fitness, weights=(1.0,))
    if not hasattr(creator, "Individual"):
        creator.create("Individual", list, fitness=creator.FitnessMax)
    
    toolbox = base.Toolbox()
    
    # Register functions
    toolbox.register(
        "individual",
        lambda: creator.Individual(_create_individual(actions, budget_limit))
    )
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)
    toolbox.register(
        "evaluate",
        lambda ind: _evaluate_fitness(ind, actions, budget_limit, initial_risk)[2]
    )
    toolbox.register("mate", _cx_two_point)
    toolbox.register(
        "mutate",
        lambda ind: _mutate_individual(ind, actions, budget_limit, indpb=0.1)
    )
    toolbox.register("select", tools.selTournament, tournsize=3)
    
    # Create initial population
    population = toolbox.population(n=population_size)
    
    # Evaluate initial population
    fitnesses = list(map(toolbox.evaluate, population))
    for ind, fit in zip(population, fitnesses):
        ind.fitness.values = (fit,)
    
    # Evolve population
    for generation in range(generations):
        # Select next generation
        offspring = toolbox.select(population, len(population))
        offspring = list(map(toolbox.clone, offspring))
        
        # Apply crossover
        for child1, child2 in zip(offspring[::2], offspring[1::2]):
            if random.random() < crossover_prob:
                toolbox.mate(child1, child2)
                del child1.fitness.values
                del child2.fitness.values
        
        # Apply mutation
        for mutant in offspring:
            if random.random() < mutation_prob:
                toolbox.mutate(mutant)
                del mutant.fitness.values
        
        # Evaluate individuals with invalid fitness
        invalid_ind = [ind for ind in offspring if not ind.fitness.valid]
        fitnesses = list(map(toolbox.evaluate, invalid_ind))
        for ind, fit in zip(invalid_ind, fitnesses):
            ind.fitness.values = (fit,)
        
        # Replace population
        population[:] = offspring
    
    # Get best individual
    best_individual = tools.selBest(population, 1)[0]
    
    # Decode to action list
    optimized_actions = [
        actions[i] for i, bit in enumerate(best_individual) if bit == 1
    ]
    
    # Sort by effectiveness/cost ratio for better ordering
    optimized_actions.sort(
        key=lambda a: _calculate_action_effectiveness(a) / (a.cost + 1.0),
        reverse=True
    )
    
    calculation_time = time.time() - start_time
    logger.info(
        f"Genetic algorithm completed in {calculation_time:.2f}s. "
        f"Selected {len(optimized_actions)} actions with "
        f"risk reduction: {calculate_risk_reduction(optimized_actions, initial_risk):.2f}%"
    )
    
    return optimized_actions

