/**
 * Disaster API service
 * 
 * This service calls Next.js API routes which proxy requests to the backend.
 */

import { DisasterThreat, DisasterListResponse } from '@/lib/map/dummy-data'

export interface DisasterListParams {
  disaster_type?: string
  min_risk?: number
  limit?: number
  use_firms?: boolean
  days?: number
  bbox?: string
}

export async function getDisasters(params?: DisasterListParams): Promise<DisasterListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.disaster_type) queryParams.append('disaster_type', params.disaster_type)
  if (params?.min_risk !== undefined) queryParams.append('min_risk', params.min_risk.toString())
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString())
  if (params?.use_firms !== undefined) queryParams.append('use_firms', params.use_firms.toString())
  if (params?.days !== undefined) queryParams.append('days', params.days.toString())
  if (params?.bbox) queryParams.append('bbox', params.bbox)

  const queryString = queryParams.toString()
  const endpoint = `/api/disasters${queryString ? `?${queryString}` : ''}`

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP error! status: ${response.status}`,
      }))
      throw new Error(errorData.error || `Request failed with status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch disasters:', error)
    throw error
  }
}

export async function getDisasterById(id: string): Promise<DisasterThreat> {
  try {
    const response = await fetch(`/api/disasters/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP error! status: ${response.status}`,
      }))
      throw new Error(errorData.error || `Request failed with status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch disaster ${id}:`, error)
    throw error
  }
}

