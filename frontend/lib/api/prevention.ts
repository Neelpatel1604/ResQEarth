/**
 * Prevention API client.
 */
import { api } from './client';
import { PreventionAction, DisasterThreat } from '@/lib/map/dummy-data';

export interface PreventionPlan {
  threat_id: string;
  initial_risk: number;
  final_risk: number;
  risk_reduction: number;
  total_cost: number;
  actions: PreventionAction[];
  calculation_time: number;
  success: boolean;
}

export interface PreventionPlanRequest {
  threat_id: string;
  actions: PreventionAction[];
  budget_limit?: number;
}

/**
 * Calculate a prevention plan.
 */
export async function calculatePreventionPlan(
  request: PreventionPlanRequest
): Promise<PreventionPlan> {
  return api.post<PreventionPlan>('/api/prevention/calculate', request);
}

