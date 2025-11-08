'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { DisasterThreat } from '@/lib/map/dummy-data'
import { AlertTriangle, Flame, Droplets, Cloud, Thermometer } from 'lucide-react'

interface DisasterMapProps {
  disasters: DisasterThreat[]
  onDisasterClick?: (disaster: DisasterThreat) => void
  selectedDisasterId?: string | null
  preventionActions?: Array<{
    id: string
    type: string
    location: { lat: number; lng: number }
  }>
  onActionDrop?: (actionType: string, location: { lat: number; lng: number }) => void
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

// Disaster type icons mapping
const getDisasterIcon = (type: string) => {
  switch (type) {
    case 'wildfire':
      return Flame
    case 'flood':
      return Droplets
    case 'thunderstorm':
      return Cloud
    case 'heatwave':
      return Thermometer
    default:
      return AlertTriangle
  }
}

// Disaster type colors
const getDisasterColor = (type: string, risk: number) => {
  const baseColors: Record<string, string> = {
    wildfire: '#ff6b35',
    flood: '#4a90e2',
    thunderstorm: '#8b5cf6',
    heatwave: '#f59e0b',
    volcanic_ash: '#6b7280',
  }
  
  const color = baseColors[type] || '#ef4444'
  
  // Adjust opacity based on risk
  if (risk >= 80) return color
  if (risk >= 60) return color + 'cc'
  return color + '99'
}

export function DisasterMap({
  disasters,
  onDisasterClick,
  selectedDisasterId,
  preventionActions = [],
  onActionDrop,
}: DisasterMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const actionMarkersRef = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token is not configured')
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 20],
      zoom: 2,
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    // Handle map click for dropping actions
    if (onActionDrop) {
      map.current.on('click', (e) => {
        // Check if there's a dragged action (this would be set by the drag event)
        const draggedAction = (window as any).__draggedAction
        if (draggedAction) {
          onActionDrop(draggedAction, {
            lat: e.lngLat.lat,
            lng: e.lngLat.lng,
          })
          // Clear the dragged action
          delete (window as any).__draggedAction
        }
      })
    }
  }, [onActionDrop])

  // Update disaster markers
  useEffect(() => {
    if (!map.current) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Create markers for each disaster
    disasters.forEach((disaster) => {
      if (!map.current) return

      const IconComponent = getDisasterIcon(disaster.type)
      const color = getDisasterColor(disaster.type, disaster.risk_percentage)
      const isSelected = selectedDisasterId === disaster.id

      // Create custom marker element
      const el = document.createElement('div')
      el.className = 'disaster-marker'
      el.style.width = isSelected ? '48px' : '40px'
      el.style.height = isSelected ? '48px' : '40px'
      el.style.cursor = 'pointer'
      el.style.transition = 'all 0.2s ease'
      el.style.zIndex = isSelected ? '1000' : '1'

      // Create icon element
      const iconEl = document.createElement('div')
      iconEl.style.width = '100%'
      iconEl.style.height = '100%'
      iconEl.style.borderRadius = '50%'
      iconEl.style.backgroundColor = color
      iconEl.style.border = isSelected ? '3px solid #fff' : '2px solid #fff'
      iconEl.style.display = 'flex'
      iconEl.style.alignItems = 'center'
      iconEl.style.justifyContent = 'center'
      iconEl.style.boxShadow = isSelected
        ? '0 0 0 4px rgba(255, 255, 255, 0.3)'
        : '0 2px 8px rgba(0, 0, 0, 0.3)'

      // Create SVG icon (simplified)
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '24')
      svg.setAttribute('height', '24')
      svg.setAttribute('viewBox', '0 0 24 24')
      svg.setAttribute('fill', 'white')
      svg.style.width = '60%'
      svg.style.height = '60%'

      // Simple icon based on type
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      if (disaster.type === 'wildfire') {
        path.setAttribute(
          'd',
          'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z'
        )
      } else if (disaster.type === 'flood') {
        path.setAttribute(
          'd',
          'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
        )
      } else {
        path.setAttribute(
          'd',
          'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
        )
      }
      svg.appendChild(path)
      iconEl.appendChild(svg)
      el.appendChild(iconEl)

      // Add risk percentage badge
      const badge = document.createElement('div')
      badge.style.position = 'absolute'
      badge.style.top = '-8px'
      badge.style.right = '-8px'
      badge.style.backgroundColor = '#ef4444'
      badge.style.color = 'white'
      badge.style.borderRadius = '50%'
      badge.style.width = '20px'
      badge.style.height = '20px'
      badge.style.fontSize = '10px'
      badge.style.fontWeight = 'bold'
      badge.style.display = 'flex'
      badge.style.alignItems = 'center'
      badge.style.justifyContent = 'center'
      badge.style.border = '2px solid white'
      badge.textContent = Math.round(disaster.risk_percentage).toString()
      el.appendChild(badge)

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([disaster.location.longitude, disaster.location.latitude])
        .addTo(map.current)

      // Add click handler
      el.addEventListener('click', () => {
        onDisasterClick?.(disaster)
      })

      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)'
      })
      el.addEventListener('mouseleave', () => {
        if (!isSelected) {
          el.style.transform = 'scale(1)'
        }
      })

      markersRef.current.push(marker)
    })
  }, [disasters, selectedDisasterId, onDisasterClick])

  // Update prevention action markers
  useEffect(() => {
    if (!map.current) return

    // Clear existing action markers
    actionMarkersRef.current.forEach((marker) => marker.remove())
    actionMarkersRef.current = []

    // Create markers for prevention actions
    preventionActions.forEach((action) => {
      if (!map.current) return

      const el = document.createElement('div')
      el.className = 'prevention-action-marker'
      el.style.width = '32px'
      el.style.height = '32px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = '#10b981'
      el.style.border = '2px solid white'
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)'
      el.style.cursor = 'pointer'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.fontSize = '18px'

      // Simple icon
      el.textContent = '✓'

      const marker = new mapboxgl.Marker(el)
        .setLngLat([action.location.lng, action.location.lat])
        .addTo(map.current)

      actionMarkersRef.current.push(marker)
    })
  }, [preventionActions])

  // Fit map to show all disasters
  useEffect(() => {
    if (!map.current || disasters.length === 0) return

    const bounds = new mapboxgl.LngLatBounds()

    disasters.forEach((disaster) => {
      bounds.extend([disaster.location.longitude, disaster.location.latitude])
    })

    if (bounds.isEmpty()) return

    map.current.fitBounds(bounds, {
      padding: 100,
      maxZoom: 10,
    })
  }, [disasters])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-50">
          <div className="bg-background p-6 rounded-lg border shadow-lg">
            <p className="text-sm text-muted-foreground">
              Mapbox token is not configured. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

