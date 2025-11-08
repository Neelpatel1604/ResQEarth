/**
 * Authority service for finding and contacting emergency authorities
 */

import { Location } from '@/lib/map/dummy-data'

export interface Authority {
  id: string
  name: string
  type: 'fire_department' | 'police' | 'emergency_services' | 'local_government' | 'forest_service'
  phone: string
  email?: string
  address?: string
  location: Location
  distance?: number // in kilometers
}

// Dummy authority data - in production, this would come from a geolocation API
export function findNearestAuthorities(
  location: Location,
  radiusKm: number = 50
): Authority[] {
  // Dummy authorities near common disaster locations
  const allAuthorities: Authority[] = [
    {
      id: 'auth-001',
      name: 'Crete Fire Department',
      type: 'fire_department',
      phone: '+30 2810 123456',
      email: 'fire@crete.gov.gr',
      address: 'Heraklion, Crete, Greece',
      location: {
        latitude: 35.3083,
        longitude: 25.0814,
        name: 'Heraklion, Crete',
      },
    },
    {
      id: 'auth-002',
      name: 'Greek Forest Service',
      type: 'forest_service',
      phone: '+30 210 1234567',
      email: 'forest@agriculture.gr',
      address: 'Athens, Greece',
      location: {
        latitude: 37.9838,
        longitude: 23.7275,
        name: 'Athens, Greece',
      },
    },
    {
      id: 'auth-003',
      name: 'Amazon Emergency Services',
      type: 'emergency_services',
      phone: '+55 11 190',
      email: 'emergency@amazon.gov.br',
      address: 'Manaus, Brazil',
      location: {
        latitude: -3.1190,
        longitude: -60.0217,
        name: 'Manaus, Brazil',
      },
    },
    {
      id: 'auth-004',
      name: 'Delhi Emergency Services',
      type: 'emergency_services',
      phone: '+91 11 100',
      email: 'emergency@delhi.gov.in',
      address: 'New Delhi, India',
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        name: 'New Delhi, India',
      },
    },
    {
      id: 'auth-005',
      name: 'Los Angeles Fire Department',
      type: 'fire_department',
      phone: '+1 213 485-6000',
      email: 'lafd@lacity.org',
      address: 'Los Angeles, CA, USA',
      location: {
        latitude: 34.0522,
        longitude: -118.2437,
        name: 'Los Angeles, USA',
      },
    },
  ]

  // Calculate distances and filter by radius
  const authoritiesWithDistance = allAuthorities.map((auth) => {
    const distance = calculateDistance(location, auth.location)
    return { ...auth, distance }
  })

  // Filter by radius and sort by distance
  return authoritiesWithDistance
    .filter((auth) => auth.distance <= radiusKm)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
}

function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(loc2.latitude - loc1.latitude)
  const dLon = toRadians(loc2.longitude - loc1.longitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(loc1.latitude)) *
      Math.cos(toRadians(loc2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function getAuthorityTypeLabel(type: Authority['type']): string {
  const labels: Record<Authority['type'], string> = {
    fire_department: 'Fire Department',
    police: 'Police',
    emergency_services: 'Emergency Services',
    local_government: 'Local Government',
    forest_service: 'Forest Service',
  }
  return labels[type] || type
}

