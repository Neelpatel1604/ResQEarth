/**
 * Disaster API service
 */

import { apiClient } from './client'
import { DisasterThreat, DisasterListResponse } from '@/lib/map/dummy-data'

export interface DisasterListParams {
  disaster_type?: string
  min_risk?: number
  limit?: number
}

export async function getDisasters(params?: DisasterListParams): Promise<DisasterListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.disaster_type) queryParams.append('disaster_type', params.disaster_type)
  if (params?.min_risk !== undefined) queryParams.append('min_risk', params.min_risk.toString())
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString())

  const queryString = queryParams.toString()
  const endpoint = `/disasters${queryString ? `?${queryString}` : ''}`

  try {
    return await apiClient.get<DisasterListResponse>(endpoint)
  } catch (error) {
    console.error('Failed to fetch disasters:', error)
    throw error
  }
}

export async function getDisasterById(id: string): Promise<DisasterThreat> {
  try {
    return await apiClient.get<DisasterThreat>(`/disasters/${id}`)
  } catch (error) {
    console.error(`Failed to fetch disaster ${id}:`, error)
    throw error
  }
}

