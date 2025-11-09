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
  navigateToLocation?: { lat: number; lng: number } | null
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
  navigateToLocation,
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
      // Handle click to drop action
      const clickHandler = (e: mapboxgl.MapMouseEvent) => {
        // Check if there's a dragged action (this would be set by the drag event)
        const draggedAction = (window as any).__draggedAction
        if (draggedAction) {
          // Prevent default map behavior
          if (e.originalEvent) {
            e.originalEvent.preventDefault()
            e.originalEvent.stopPropagation()
          }
          onActionDrop(draggedAction, {
            lat: e.lngLat.lat,
            lng: e.lngLat.lng,
          })
          // Clear the dragged action
          delete (window as any).__draggedAction
          ;(window as any).__isDragging = false
          document.body.style.cursor = ''
          const canvas = document.querySelector('.mapboxgl-canvas') as HTMLElement
          if (canvas) {
            canvas.style.cursor = ''
            canvas.classList.remove('action-dropping')
          }
          // Remove visual indicator
          const indicator = document.getElementById('action-drop-indicator')
          if (indicator) {
            indicator.remove()
          }
          if (map.current?.getCanvasContainer()) {
            map.current.getCanvasContainer().style.cursor = ''
          }
        }
      }
      map.current.on('click', clickHandler)
      
      // Also handle mousedown to prevent map panning when dropping
      const mousedownHandler = (e: mapboxgl.MapMouseEvent) => {
        if ((window as any).__isDragging) {
          // Prevent map panning when dropping action
          e.preventDefault()
        }
      }
      map.current.on('mousedown', mousedownHandler)

      // Add visual feedback when dragging over map
      map.current.on('mouseenter', () => {
        if ((window as any).__isDragging) {
          if (map.current?.getCanvasContainer()) {
            map.current.getCanvasContainer().style.cursor = 'crosshair'
          }
        }
      })

      map.current.on('mouseleave', () => {
        if ((window as any).__isDragging) {
          if (map.current?.getCanvasContainer()) {
            map.current.getCanvasContainer().style.cursor = 'not-allowed'
          }
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
      el.style.cssText = `
        position: relative;
        width: ${isSelected ? '48px' : '40px'};
        height: ${isSelected ? '48px' : '40px'};
        cursor: pointer;
        transition: filter 0.2s ease;
        z-index: ${isSelected ? '1000' : '1'};
        pointer-events: auto;
      `

      // Create icon element (circular background)
      const iconEl = document.createElement('div')
      iconEl.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: ${color};
        border: ${isSelected ? '3px' : '2px'} solid #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${isSelected
          ? '0 0 0 4px rgba(255, 255, 255, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.3)'};
      `

      // Create SVG icon (simplified)
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '24')
      svg.setAttribute('height', '24')
      svg.setAttribute('viewBox', '0 0 24 24')
      svg.setAttribute('fill', 'white')
      svg.style.cssText = 'width: 60%; height: 60%;'

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
      const riskPercent = Math.round(disaster.risk_percentage)
      const badge = document.createElement('div')
      badge.className = 'disaster-risk-badge'
      badge.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background-color: #ef4444;
        color: white;
        border-radius: 50%;
        min-width: 22px;
        height: 22px;
        font-size: 11px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        padding: 0 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        line-height: 1;
        z-index: 10;
        pointer-events: none;
        white-space: nowrap;
        box-sizing: border-box;
      `
      // Create span for text to ensure it's properly contained
      const badgeText = document.createElement('span')
      badgeText.textContent = riskPercent.toString()
      badgeText.style.cssText = `
        display: inline-block;
        line-height: 1;
      `
      badge.appendChild(badgeText)
      el.appendChild(badge)

      // Create marker with proper anchor point
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center', // Anchor at center to prevent movement
      })
        .setLngLat([disaster.location.longitude, disaster.location.latitude])
        .addTo(map.current)

      // Add click handler
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        // Fly to the disaster location
        if (map.current) {
          map.current.flyTo({
            center: [disaster.location.longitude, disaster.location.latitude],
            zoom: 8,
            duration: 1500,
            essential: true,
          })
        }
        onDisasterClick?.(disaster)
      })

      // Add hover effect - use filter/opacity instead of scale to prevent movement
      el.addEventListener('mouseenter', () => {
        if (!isSelected) {
          el.style.filter = 'brightness(1.2) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))'
          el.style.zIndex = '1000'
        }
      })
      el.addEventListener('mouseleave', () => {
        if (!isSelected) {
          el.style.filter = 'none'
          el.style.zIndex = '1'
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

      // Get action icon from PREVENTION_ACTIONS
      const actionInfo = (window as any).__PREVENTION_ACTIONS?.[action.type]
      const icon = actionInfo?.icon || '✓'
      // Use green for all prevention actions
      const color = '#10b981'

      const el = document.createElement('div')
      el.className = 'prevention-action-marker'
      el.style.cssText = `
        position: relative;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        transition: all 0.2s ease;
        z-index: 500;
        animation: markerAppear 0.5s ease-out, markerPulse 2s ease-in-out 0.5s 3;
      `

      // Add icon
      el.innerHTML = icon

      // Add CSS animation for marker appearance
      if (!document.getElementById('marker-animations')) {
        const style = document.createElement('style')
        style.id = 'marker-animations'
        style.textContent = `
          @keyframes markerAppear {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.3);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes markerPulse {
            0%, 100% {
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            50% {
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 10px rgba(16, 185, 129, 0);
            }
          }
        `
        document.head.appendChild(style)
      }

      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)'
        el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)'
        el.style.zIndex = '1000'
      })
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)'
        el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)'
        el.style.zIndex = '500'
      })

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([action.location.lng, action.location.lat])
        .addTo(map.current)

      actionMarkersRef.current.push(marker)
    })
  }, [preventionActions])

  // Navigate to specific location when requested
  useEffect(() => {
    if (!map.current || !navigateToLocation) return

    map.current.flyTo({
      center: [navigateToLocation.lng, navigateToLocation.lat],
      zoom: 10,
      duration: 1500,
      essential: true,
    })
  }, [navigateToLocation])

  // Fit map to show all disasters (only on initial load)
  useEffect(() => {
    if (!map.current || disasters.length === 0) return

    // Only fit bounds if no specific location is being navigated to
    if (navigateToLocation) return

    const bounds = new mapboxgl.LngLatBounds()

    disasters.forEach((disaster) => {
      bounds.extend([disaster.location.longitude, disaster.location.latitude])
    })

    if (bounds.isEmpty()) return

    map.current.fitBounds(bounds, {
      padding: 100,
      maxZoom: 10,
    })
  }, [disasters, navigateToLocation])

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

