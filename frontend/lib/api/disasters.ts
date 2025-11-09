/**
 * Disaster API service
 */

import { apiClient } from './client'
import { DisasterThreat } from '@/lib/map/data'

export interface DisasterListParams {
  disaster_type?: string
  min_risk?: number
  limit?: number
}

export interface DisasterListResponse {
  disasters: DisasterThreat[]
  total: number
}

export async function getDisasters(params?: DisasterListParams): Promise<DisasterListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.disaster_type) queryParams.append('disaster_type', params.disaster_type)
  if (params?.min_risk !== undefined) queryParams.append('min_risk', params.min_risk.toString())
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString())

  const queryString = queryParams.toString()
  const endpoint = `/api/disasters${queryString ? `?${queryString}` : ''}`

  try {
    return await apiClient.get<DisasterListResponse>(endpoint)
  } catch (error) {
    console.error('Failed to fetch disasters:', error)
    throw error
  }
}

export async function getDisasterById(id: string): Promise<DisasterThreat> {
  try {
    return await apiClient.get<DisasterThreat>(`/api/disasters/${id}`)
  } catch (error) {
    console.error(`Failed to fetch disaster ${id}:`, error)
    throw error
  }
}

export interface AllDisastersParams {
  lat?: number
  lng?: number
  event_type?: string
  limit?: number
  page?: number
  disaster_type?: string
  min_risk?: number
}

export async function getAllDisasters(params?: AllDisastersParams): Promise<DisasterListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.lat !== undefined) queryParams.append('lat', params.lat.toString())
  if (params?.lng !== undefined) queryParams.append('lng', params.lng.toString())
  if (params?.event_type) queryParams.append('event_type', params.event_type)
  // Ensure limit doesn't exceed Ambee API maximum of 50
  const limit = params?.limit ? Math.min(params.limit, 50) : 50
  queryParams.append('limit', limit.toString())
  if (params?.page !== undefined) queryParams.append('page', params.page.toString())
  if (params?.disaster_type) queryParams.append('disaster_type', params.disaster_type)
  if (params?.min_risk !== undefined) queryParams.append('min_risk', params.min_risk.toString())

  const queryString = queryParams.toString()
  const endpoint = `/api/disasters/all${queryString ? `?${queryString}` : ''}`

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
    console.error('Failed to fetch all disasters:', error)
    throw error
  }
}

export interface CheckAreaParams {
  lat: number
  lng: number
  event_type?: string
  limit?: number
  disaster_type?: string
  min_risk?: number
}

export async function checkMyArea(params: CheckAreaParams): Promise<DisasterListResponse> {
  const queryParams = new URLSearchParams()
  queryParams.append('lat', params.lat.toString())
  queryParams.append('lng', params.lng.toString())
  if (params?.event_type) queryParams.append('event_type', params.event_type)
  // Ensure limit doesn't exceed Ambee API maximum of 50
  const limit = params?.limit ? Math.min(params.limit, 50) : 50
  queryParams.append('limit', limit.toString())
  if (params?.disaster_type) queryParams.append('disaster_type', params.disaster_type)
  if (params?.min_risk !== undefined) queryParams.append('min_risk', params.min_risk.toString())

  const queryString = queryParams.toString()
  const endpoint = `/api/disasters/check-area?${queryString}`

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
    console.error('Failed to check area:', error)
    throw error
  }
}

