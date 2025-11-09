/**
 * Solutions service for saving disaster prevention solutions to Supabase
 */

import { createClient } from './client'
import { DisasterThreat, PreventionAction } from '@/lib/map/data'

export interface Solution {
  id?: string
  user_id: string
  disaster_id: string
  disaster_type: string
  disaster_location: {
    latitude: number
    longitude: number
    name?: string
  }
  initial_risk: number
  final_risk: number
  risk_reduction: number
  total_cost: number
  actions: PreventionAction[]
  created_at?: string
  updated_at?: string
}

export async function saveSolution(solution: Omit<Solution, 'id' | 'created_at' | 'updated_at'>): Promise<Solution | null> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.warn('User not authenticated - cannot save solution')
      return null
    }

    const solutionData = {
      user_id: user.id,
      ...solution,
    }

    const { data, error } = await supabase
      .from('solutions')
      .insert(solutionData)
      .select()
      .single()

    if (error) {
      // If table doesn't exist, log warning but don't throw
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.warn('Solutions table does not exist. Please create it in Supabase.')
        return null
      }
      console.error('Error saving solution:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in saveSolution:', error)
    throw error
  }
}

export async function getSolutions(userId?: string): Promise<Solution[]> {
  try {
    const supabase = createClient()
    
    let query = supabase.from('solutions').select('*').order('created_at', { ascending: false })
    
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      // If table doesn't exist or other Supabase error, return empty array
      // This allows the app to work in prototype mode
      if (error.code === 'PGRST116' || error.code === '42P01') {
        // Table doesn't exist - return empty array
        return []
      }
      // Log other errors but don't throw - return empty array for graceful degradation
      console.warn('Error fetching solutions (returning empty array):', error.message || error)
      return []
    }

    return data || []
  } catch (error) {
    // Catch any other errors (network, auth, etc.) and return empty array
    console.warn('Error in getSolutions (returning empty array):', error)
    return []
  }
}

export async function getSolutionById(id: string): Promise<Solution | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('solutions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    console.error('Error fetching solution:', error)
    throw error
  }

  return data
}

export async function deleteSolution(id: string): Promise<void> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.from('solutions').delete().eq('id', id)

    if (error) {
      // If table doesn't exist, just log warning
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.warn('Solutions table does not exist.')
        return
      }
      console.error('Error deleting solution:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteSolution:', error)
    throw error
  }
}

export function createSolutionFromData(
  disaster: DisasterThreat,
  actions: PreventionAction[]
): Omit<Solution, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  const totalCost = actions.reduce((sum, action) => sum + action.cost, 0)
  const totalEffectiveness = Math.min(
    actions.reduce((sum, action) => sum + (action.effectiveness || 0), 0),
    100
  )
  const riskReduction = (totalEffectiveness / 100) * disaster.risk_percentage
  const finalRisk = Math.max(0, disaster.risk_percentage - riskReduction)

  return {
    disaster_id: disaster.id,
    disaster_type: disaster.type,
    disaster_location: {
      latitude: disaster.location.latitude,
      longitude: disaster.location.longitude,
      name: disaster.location.name,
    },
    initial_risk: disaster.risk_percentage,
    final_risk,
    risk_reduction: riskReduction,
    total_cost: totalCost,
    actions,
  }
}

