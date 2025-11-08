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
  const sourceId = 'disasters-source'
  const clusterLayerId = 'disasters-cluster'
  const clusterCountLayerId = 'disasters-cluster-count'
  const unclusteredPointLayerId = 'disasters-unclustered-point'

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token is not configured')
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    // Initialize map with satellite style to show terrain/landscape
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12', // Shows satellite imagery with street labels
      center: [0, 20],
      zoom: 2,
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    // Wait for map to load before adding sources
    map.current.on('load', () => {
      if (!map.current) return

      // Add source for disasters (will be populated when disasters change)
      if (!map.current.getSource(sourceId)) {
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        })

        // Add cluster circles layer
        map.current.addLayer({
          id: clusterLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#ff6b35',
              10,
              '#ff4500',
              50,
              '#ff0000',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              10,
              30,
              50,
              40,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        })

        // Add cluster count labels
        map.current.addLayer({
          id: clusterCountLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: {
            'text-color': '#fff',
          },
        })

        // Add unclustered points layer
        map.current.addLayer({
          id: unclusteredPointLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'match',
              ['get', 'type'],
              'wildfire',
              '#ff6b35',
              'flood',
              '#4a90e2',
              'thunderstorm',
              '#8b5cf6',
              'heatwave',
              '#f59e0b',
              '#ef4444',
            ],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'risk'],
              0,
              8,
              50,
              12,
              100,
              16,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
            'circle-opacity': [
              'interpolate',
              ['linear'],
              ['get', 'risk'],
              0,
              0.6,
              50,
              0.8,
              100,
              1.0,
            ],
          },
        })

        // Add click handler for clusters
        map.current.on('click', clusterLayerId, (e) => {
          if (!map.current) return
          const features = map.current.queryRenderedFeatures(e.point, {
            layers: [clusterLayerId],
          })
          const clusterId = features[0]?.properties?.cluster_id
          const source = map.current.getSource(sourceId) as mapboxgl.GeoJSONSource
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || !map.current || zoom === null || zoom === undefined) return
            map.current.easeTo({
              center: (e.lngLat as any),
              zoom: zoom,
            })
          })
        })

        // Add click handler for unclustered points
        // Note: We'll handle this in a separate effect to access current disasters

        // Change cursor on hover
        map.current.on('mouseenter', clusterLayerId, () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer'
          }
        })
        map.current.on('mouseleave', clusterLayerId, () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = ''
          }
        })
        map.current.on('mouseenter', unclusteredPointLayerId, () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer'
          }
        })
        map.current.on('mouseleave', unclusteredPointLayerId, () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = ''
          }
        })
      }
    })

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

  // Update disaster markers using Mapbox GL layers for better performance
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return

    const source = map.current.getSource(sourceId) as mapboxgl.GeoJSONSource
    if (!source) return

    // Convert disasters to GeoJSON features
    const features = disasters.map((disaster) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [disaster.location.longitude, disaster.location.latitude],
      },
      properties: {
        id: disaster.id,
        type: disaster.type,
        risk: disaster.risk_percentage,
        confidence: disaster.confidence || 0,
        selected: selectedDisasterId === disaster.id,
      },
    }))

    // Update source data
    source.setData({
      type: 'FeatureCollection',
      features,
    })

    // Update layer styles for selected disaster
    if (map.current.getLayer(unclusteredPointLayerId)) {
      map.current.setPaintProperty(unclusteredPointLayerId, 'circle-stroke-width', [
        'case',
        ['get', 'selected'],
        4,
        2,
      ])
      map.current.setPaintProperty(unclusteredPointLayerId, 'circle-radius', [
        'case',
        ['get', 'selected'],
        [
          'interpolate',
          ['linear'],
          ['get', 'risk'],
          0,
          14,
          50,
          18,
          100,
          22,
        ],
        [
          'interpolate',
          ['linear'],
          ['get', 'risk'],
          0,
          8,
          50,
          12,
          100,
          16,
        ],
      ])
    }
  }, [disasters, selectedDisasterId])

  // Handle clicks on unclustered points
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return

    const handleClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!map.current) return
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: [unclusteredPointLayerId],
      })
      if (features[0]?.properties) {
        const disasterId = features[0].properties.id as string
        const disaster = disasters.find((d) => d.id === disasterId)
        if (disaster) {
          map.current.flyTo({
            center: [disaster.location.longitude, disaster.location.latitude],
            zoom: 10,
            duration: 1500,
          })
          onDisasterClick?.(disaster)
        }
      }
    }

    map.current.on('click', unclusteredPointLayerId, handleClick)

    return () => {
      if (map.current) {
        map.current.off('click', unclusteredPointLayerId, handleClick)
      }
    }
  }, [disasters, onDisasterClick])

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

