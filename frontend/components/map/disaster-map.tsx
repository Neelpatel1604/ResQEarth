'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { DisasterThreat } from '@/lib/map/dummy-data'
import { 
  AlertTriangle, 
  Flame, 
  Droplets, 
  Cloud, 
  Thermometer,
  Activity,
  Wind,
  Mountain,
  Sun,
  CloudLightning,
  Snowflake,
  Waves,
  AlertCircle,
  DropletOff
} from 'lucide-react'

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
  userLocation?: { lat: number; lng: number } | null
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

// Disaster type icons mapping
const getDisasterIcon = (type: string) => {
  switch (type) {
    // Existing types
    case 'wildfire':
      return Flame
    case 'flood':
      return Droplets
    case 'thunderstorm':
      return Cloud
    case 'heatwave':
      return Thermometer
    case 'volcanic_ash':
      return Mountain
    // Ambeedata Natural Disasters API types
    case 'earthquake':
      return Activity
    case 'tropical_cyclone':
      return Wind
    case 'volcano':
      return Mountain
    case 'drought':
      return DropletOff
    case 'extreme_temperature':
      return Thermometer
    case 'severe_storm':
      return CloudLightning
    case 'sea_ice':
      return Snowflake
    case 'landslide':
      return Mountain
    case 'tsunami':
      return Waves
    case 'miscellaneous':
      return AlertCircle
    default:
      return AlertTriangle
  }
}

// Disaster type colors
const getDisasterColor = (type: string, risk: number) => {
  const baseColors: Record<string, string> = {
    // Existing types
    wildfire: '#ff6b35',
    flood: '#4a90e2',
    thunderstorm: '#8b5cf6',
    heatwave: '#f59e0b',
    volcanic_ash: '#6b7280',
    // Ambeedata Natural Disasters API types
    earthquake: '#dc2626',        // Red
    tropical_cyclone: '#0ea5e9',   // Sky blue
    volcano: '#7c2d12',            // Dark brown
    drought: '#fbbf24',            // Amber
    extreme_temperature: '#f97316', // Orange
    severe_storm: '#6366f1',        // Indigo
    sea_ice: '#06b6d4',            // Cyan
    landslide: '#78716c',          // Stone
    tsunami: '#0284c7',            // Blue
    miscellaneous: '#6b7280',      // Gray
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
  userLocation,
}: DisasterMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const actionMarkersRef = useRef<mapboxgl.Marker[]>([])
  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const disastersRef = useRef(disasters)
  const onDisasterClickRef = useRef(onDisasterClick)
  const sourceId = 'disasters-source'
  const clusterLayerId = 'disasters-cluster'
  const clusterCountLayerId = 'disasters-cluster-count'
  const unclusteredPointLayerId = 'disasters-unclustered-point'
  
  // Keep refs updated
  useEffect(() => {
    disastersRef.current = disasters
    onDisasterClickRef.current = onDisasterClick
  }, [disasters, onDisasterClick])

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
        
        // Listen for data events to ensure source is ready
        const source = map.current.getSource(sourceId) as mapboxgl.GeoJSONSource
        if (source) {
          source.on('data', () => {
            console.log('Source data event fired')
          })
        }

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
              'wildfire', '#ff6b35',
              'flood', '#4a90e2',
              'thunderstorm', '#8b5cf6',
              'heatwave', '#f59e0b',
              'volcanic_ash', '#6b7280',
              'earthquake', '#dc2626',
              'tropical_cyclone', '#0ea5e9',
              'volcano', '#7c2d12',
              'drought', '#fbbf24',
              'extreme_temperature', '#f97316',
              'severe_storm', '#6366f1',
              'sea_ice', '#06b6d4',
              'landslide', '#78716c',
              'tsunami', '#0284c7',
              'miscellaneous', '#6b7280',
              '#ef4444',
            ],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'risk'],
              0,
              12,
              50,
              16,
              100,
              20,
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

        // Add click handler for unclustered points directly when layer is created
        // Use refs to always access latest disasters and callback
        const handleUnclusteredClick = (e: mapboxgl.MapMouseEvent) => {
          if (!map.current) return
          
          console.log('🖱️ Direct click handler triggered!')
          
          // Close any open popup (hover tooltip) first
          if (popupRef.current) {
            popupRef.current.remove()
            popupRef.current = null
          }
          
          const features = map.current.queryRenderedFeatures(e.point, {
            layers: [unclusteredPointLayerId],
          })
          
          console.log('📍 Direct handler - Features found:', features.length)
          
          if (features[0]?.properties) {
            const disasterId = features[0].properties.id as string
            console.log('🔍 Direct handler - Disaster ID:', disasterId)
            
            // Use ref to get latest disasters
            const currentDisasters = disastersRef.current
            console.log('📊 Current disasters in ref:', currentDisasters.length, 'Looking for ID:', disasterId)
            console.log('📋 Available disaster IDs:', currentDisasters.map(d => d.id))
            
            // Try to find disaster in current disasters array
            let disaster = currentDisasters.find((d) => d.id === disasterId)
            
            // ALWAYS try to reconstruct from feature properties if not found
            if (!disaster && features[0]) {
              const props = features[0].properties
              const geometry = features[0].geometry
              console.log('⚠️ Disaster not in array, trying to reconstruct from feature')
              console.log('📦 Feature properties:', props)
              console.log('📍 Feature geometry:', geometry)
              
              // Get coordinates from properties first, then geometry as fallback
              let featureLat: number | undefined = props?.lat as number
              let featureLng: number | undefined = props?.lng as number
              
              // Fallback to geometry if not in properties
              if ((!featureLat || !featureLng) && geometry?.type === 'Point' && geometry?.coordinates) {
                featureLng = geometry.coordinates[0]
                featureLat = geometry.coordinates[1]
                console.log('📍 Using geometry coordinates:', featureLat, featureLng)
              }
              
              // Try to find by matching coordinates in current disasters
              if (featureLat && featureLng && currentDisasters.length > 0) {
                disaster = currentDisasters.find((d) => 
                  d.location &&
                  Math.abs(d.location.latitude - featureLat!) < 0.001 && 
                  Math.abs(d.location.longitude - featureLng!) < 0.001
                )
                if (disaster) {
                  console.log('✅ Found disaster by coordinate match:', disaster.id)
                }
              }
              
              // If still not found, create disaster object from properties
              if (!disaster && featureLat && featureLng) {
                console.log('⚠️ Creating disaster from feature properties')
                disaster = {
                  id: disasterId,
                  type: (props?.type as string) || 'wildfire',
                  location: {
                    latitude: featureLat,
                    longitude: featureLng,
                    name: (props?.name as string) || 'Unknown Location',
                  },
                  risk_percentage: (props?.risk as number) || 50,
                  time_window_hours: 24,
                  predicted_time: new Date().toISOString(),
                  confidence: (props?.confidence as number) || 50,
                } as any
                console.log('✅ Created disaster object:', disaster)
              }
            }
            
            console.log('🔍 Direct handler - Final disaster:', disaster?.id, disaster?.type, disaster?.location?.name)
            
            if (disaster && onDisasterClickRef.current) {
              console.log('📞 Direct handler - Calling onDisasterClick')
              // Open the sidebar with disaster details
              onDisasterClickRef.current(disaster)
              
              // Fly to location after a brief delay
              setTimeout(() => {
                if (map.current) {
                  map.current.flyTo({
                    center: [disaster.location.longitude, disaster.location.latitude],
                    zoom: 10,
                    duration: 1500,
                  })
                }
              }, 100)
            }
          }
        }
        
        map.current.on('click', unclusteredPointLayerId, handleUnclusteredClick)

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
        map.current.on('mouseenter', unclusteredPointLayerId, (e) => {
          if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer'
          }
        })
        map.current.on('mouseleave', unclusteredPointLayerId, () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = ''
            // Close popup on mouse leave
            if (popupRef.current) {
              popupRef.current.remove()
              popupRef.current = null
            }
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

  // Update disaster markers
  useEffect(() => {
    if (!map.current) return

    const updateDisasterData = () => {
      if (!map.current) return
      
      const source = map.current.getSource(sourceId) as mapboxgl.GeoJSONSource
      if (!source) {
        console.log('Source not found')
        return
      }

      // Convert disasters to GeoJSON features
      console.log(`Processing ${disasters.length} disasters for map`)
      
      const features = disasters
        .filter((disaster) => {
          // Validate coordinates
          const lat = disaster.location?.latitude
          const lng = disaster.location?.longitude
          
          // Log first few disasters to see their structure
          if (disasters.indexOf(disaster) < 3) {
            console.log(`Disaster ${disasters.indexOf(disaster)}:`, {
              id: disaster.id,
              hasLocation: !!disaster.location,
              lat: lat,
              lng: lng,
              locationObj: disaster.location,
            })
          }
          
          const isValid = 
            disaster.location &&
            typeof lat === 'number' &&
            typeof lng === 'number' &&
            !isNaN(lat) &&
            !isNaN(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180 &&
            lat !== 0 &&
            lng !== 0  // Exclude 0,0 coordinates
          
          if (!isValid) {
            console.warn(`Invalid coordinates for disaster ${disaster.id}:`, {
              lat,
              lng,
              hasLocation: !!disaster.location,
            })
          }
          return isValid
        })
        .map((disaster) => ({
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
            // Store location name for easier reconstruction
            name: disaster.location?.name || 'Unknown Location',
            lat: disaster.location?.latitude,
            lng: disaster.location?.longitude,
          },
        }))

      console.log(`Updating map with ${features.length} disaster features (from ${disasters.length} total disasters)`)
      
      if (features.length === 0) {
        console.warn('No valid features to display on map')
        return
      }

      // Log first few features for debugging
      if (features.length > 0) {
        console.log('Sample features:', features.slice(0, 3).map(f => ({
          id: f.properties.id,
          coords: f.geometry.coordinates,
          type: f.properties.type,
          risk: f.properties.risk
        })))
      }

      // Update source data
      try {
        source.setData({
          type: 'FeatureCollection',
          features,
        })
        console.log(`✅ Map source updated successfully with ${features.length} features`)
      } catch (error) {
        console.error('❌ Error updating map source:', error)
      }

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
          12,
          50,
          16,
          100,
          20,
        ],
      ])
      }
    }

    // Wait for map to be ready
    if (!map.current.isStyleLoaded()) {
      console.log('Map style not loaded yet, waiting...')
      const waitForStyle = () => {
        if (map.current?.isStyleLoaded()) {
          setTimeout(() => {
            const source = map.current?.getSource(sourceId) as mapboxgl.GeoJSONSource
            if (source) {
              updateDisasterData()
            }
          }, 100)
        } else {
          setTimeout(waitForStyle, 100)
        }
      }
      waitForStyle()
      return
    }

    // Try to update immediately
    const source = map.current.getSource(sourceId) as mapboxgl.GeoJSONSource
    if (!source) {
      console.log('Source not found, waiting...')
      // Wait for source to be added (it's added in the 'load' event)
      const waitForSource = () => {
        if (map.current) {
          const retrySource = map.current.getSource(sourceId) as mapboxgl.GeoJSONSource
          if (retrySource) {
            console.log('Source found, updating data')
            updateDisasterData()
          } else {
            setTimeout(waitForSource, 100)
          }
        }
      }
      waitForSource()
      return
    }

    // Source exists, update immediately
    console.log('Source exists, updating data immediately')
    updateDisasterData()
  }, [disasters, selectedDisasterId])

  // Handle clicks on unclustered points
  useEffect(() => {
    if (!map.current) return

    const handleClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!map.current) return
      
      console.log('🖱️ Disaster marker clicked!')
      
      // Close any open popup (hover tooltip) first
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: [unclusteredPointLayerId],
      })
      console.log('📍 Features found:', features.length)
      
      if (features[0]?.properties) {
        const disasterId = features[0].properties.id as string
        console.log('📊 useEffect handler - Current disasters:', disasters.length, 'Looking for ID:', disasterId)
        console.log('📋 useEffect handler - Available IDs:', disasters.map(d => d.id))
        const disaster = disasters.find((d) => d.id === disasterId)
        console.log('🔍 Found disaster:', disaster?.id, disaster?.type, disaster?.location.name)
        
        if (disaster) {
          console.log('📞 Calling onDisasterClick with disaster:', disaster.id)
          // Open the sidebar with disaster details
          onDisasterClick?.(disaster)
          
          // Fly to location after a brief delay to ensure sidebar opens first
          setTimeout(() => {
            if (map.current) {
              map.current.flyTo({
                center: [disaster.location.longitude, disaster.location.latitude],
                zoom: 10,
                duration: 1500,
              })
            }
          }, 100)
        }
      } else {
        console.log('❌ No features found at click point')
      }
    }

    // Add general map click handler to debug
    const generalClickHandler = (e: mapboxgl.MapMouseEvent) => {
      console.log('🗺️ Map clicked at:', e.lngLat)
      const features = map.current?.queryRenderedFeatures(e.point)
      console.log('🎯 All features at click point:', features?.length, features?.map(f => f.layer?.id))
    }
    
    // Wait for the layer to be available before attaching handlers
    const attachClickHandlers = () => {
      if (!map.current) return
      
      // Check if layer exists
      const layer = map.current.getLayer(unclusteredPointLayerId)
      if (!layer) {
        console.log('⏳ Layer not ready yet, waiting...')
        setTimeout(attachClickHandlers, 100)
        return
      }
      
      console.log('✅ Attaching click handlers to layer:', unclusteredPointLayerId)
      map.current.on('click', generalClickHandler)
      map.current.on('click', unclusteredPointLayerId, handleClick)
    }

    // Attach handlers when map is ready
    if (map.current.isStyleLoaded()) {
      attachClickHandlers()
    } else {
      map.current.once('styledata', attachClickHandlers)
    }

    return () => {
      if (map.current) {
        map.current.off('click', generalClickHandler)
        map.current.off('click', unclusteredPointLayerId, handleClick)
      }
    }
  }, [disasters, onDisasterClick])

  // Handle hover tooltips on unclustered points
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return

    const handleMouseEnter = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!map.current) return
      
      // Close any existing popup
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }

      const features = map.current.queryRenderedFeatures(e.point, {
        layers: [unclusteredPointLayerId],
      })
      
      if (features[0]?.properties) {
        const props = features[0].properties
        const disasterId = props.id as string
        const disaster = disasters.find((d) => d.id === disasterId)
        
        if (disaster) {
          // Extract country/region from location name
          const getCountryFromLocation = (locationName: string): string | null => {
            const location = locationName.toLowerCase()
            if (location.includes('thailand') || location.includes('bangkok') || 
                location.includes('chiang mai') || location.includes('prachuap') ||
                location.includes('nakhon')) {
              return 'Thailand'
            }
            if (location.includes('usa') || location.includes('united states') || 
                location.includes('los angeles') || location.includes('new york') ||
                location.includes('california') || location.includes('alaska')) {
              return 'United States'
            }
            if (location.includes('japan') || location.includes('tokyo')) {
              return 'Japan'
            }
            if (location.includes('india') || location.includes('delhi')) {
              return 'India'
            }
            if (location.includes('indonesia') || location.includes('jakarta') || 
                location.includes('bali') || location.includes('java')) {
              return 'Indonesia'
            }
            if (location.includes('china') || location.includes('hong kong') || 
                location.includes('taipei')) {
              return 'China/Taiwan'
            }
            if (location.includes('brazil') || location.includes('amazon')) {
              return 'Brazil'
            }
            if (location.includes('greece') || location.includes('crete')) {
              return 'Greece'
            }
            if (location.includes('mexico')) {
              return 'Mexico'
            }
            if (location.includes('nepal') || location.includes('kathmandu')) {
              return 'Nepal'
            }
            if (location.includes('south africa') || location.includes('johannesburg')) {
              return 'South Africa'
            }
            if (location.includes('uk') || location.includes('london')) {
              return 'United Kingdom'
            }
            if (location.includes('france') || location.includes('paris')) {
              return 'France'
            }
            if (location.includes('norway') || location.includes('svalbard')) {
              return 'Norway'
            }
            if (location.includes('uae') || location.includes('dubai')) {
              return 'United Arab Emirates'
            }
            if (location.includes('peru') || location.includes('southern peru')) {
              return 'Peru'
            }
            return null
          }

          // Get disaster type name
          const getDisasterTypeName = (type: string): string => {
            const typeMap: Record<string, string> = {
              'tsunami': 'Tsunami',
              'earthquake': 'Earthquake',
              'tropical_cyclone': 'Tropical Cyclone',
              'wildfire': 'Wildfire',
              'flood': 'Flood',
              'extreme_temperature': 'Extreme Temperature',
              'drought': 'Drought',
              'severe_storm': 'Severe Storm',
              'sea_ice': 'Sea Ice',
              'volcano': 'Volcano',
              'landslide': 'Landslide',
              'miscellaneous': 'Miscellaneous',
              'thunderstorm': 'Thunderstorm',
              'heatwave': 'Heatwave',
              'volcanic_ash': 'Volcanic Ash',
            }
            return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
          }

          // Get disaster type description
          const getDisasterTypeDescription = (type: string): string => {
            const descMap: Record<string, string> = {
              'tsunami': 'Tsunamis and related sea waves',
              'earthquake': 'Earthquakes and related seismic activities',
              'tropical_cyclone': 'Tropical cyclones including hurricanes, typhoons & cyclones',
              'wildfire': 'Wildfires and fire related events',
              'flood': 'Floods including flash floods and general flooding',
              'extreme_temperature': 'Extreme temperature events including heat waves, cold waves',
              'drought': 'Droughts and prolonged dry conditions',
              'severe_storm': 'Severe storms, thunderstorms & related weather phenomena',
              'sea_ice': 'Sea ice conditions',
              'volcano': 'Volcanic activities and eruptions',
              'landslide': 'Landslides, avalanches and related ground movement',
              'miscellaneous': 'Miscellaneous events including unique imagery & technical disasters',
            }
            return descMap[type] || 'Natural disaster event'
          }

          const disasterTypeName = getDisasterTypeName(disaster.type)
          const disasterTypeDesc = getDisasterTypeDescription(disaster.type)
          const locationName = disaster.location?.name || 'Unknown Location'
          const country = getCountryFromLocation(locationName)
          const riskPercentage = disaster.risk_percentage || 0
          const coordinates = e.lngLat

          // Get animated icon SVG for disaster type
          const getAnimatedIcon = (type: string): string => {
            const iconMap: Record<string, { svg: string; animation: string }> = {
              'wildfire': {
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: ${type === 'wildfire' ? 'pulse 1.5s ease-in-out infinite' : 'none'};">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.5-1.5-4-1.5-4S8 10.5 8 12a2.5 2.5 0 0 0 .5 2.5Z" fill="#ff6b35"/>
                  <path d="M14.5 10.5c1.5 0 2.5-1 2.5-2.5 0-2-2-5-2-5s-1 3-1 4.5c0 1 .5 2.5 1 3Z" fill="#ff6b35"/>
                  <path d="M12 16c2 0 4-1.5 4-4 0-3-3-7-3-7s-2 4-2 6c0 1.5 1 5 1 5Z" fill="#ff6b35"/>
                </svg>`,
                animation: 'pulse 1.5s ease-in-out infinite'
              },
              'earthquake': {
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: shake 0.5s ease-in-out infinite;">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#dc2626"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#dc2626" stroke-width="2" fill="none"/>
                </svg>`,
                animation: 'shake 0.5s ease-in-out infinite'
              },
              'flood': {
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: wave 2s ease-in-out infinite;">
                  <path d="M2 18c2 0 4-2 6-2s4 2 6 2 4-2 6-2 4 2 6 2" stroke="#4a90e2" stroke-width="2" fill="none"/>
                  <path d="M2 14c2 0 4-2 6-2s4 2 6 2 4-2 6-2 4 2 6 2" stroke="#4a90e2" stroke-width="2" fill="none"/>
                </svg>`,
                animation: 'wave 2s ease-in-out infinite'
              },
              'tropical_cyclone': {
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: rotate 3s linear infinite;">
                  <circle cx="12" cy="12" r="8" stroke="#0ea5e9" stroke-width="2" fill="none"/>
                  <path d="M12 4 L12 12 L16 12" stroke="#0ea5e9" stroke-width="2" fill="none"/>
                </svg>`,
                animation: 'rotate 3s linear infinite'
              },
              'volcano': {
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: pulse 2s ease-in-out infinite;">
                  <path d="M12 20 L6 12 L12 4 L18 12 Z" fill="#7c2d12"/>
                  <circle cx="12" cy="8" r="2" fill="#dc2626" style="animation: pulse 1s ease-in-out infinite;"/>
                </svg>`,
                animation: 'pulse 2s ease-in-out infinite'
              },
              'tsunami': {
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: wave 1.5s ease-in-out infinite;">
                  <path d="M2 12c4 0 6-4 8-4s4 4 8 4 6-4 8-4" stroke="#0284c7" stroke-width="2" fill="none"/>
                  <path d="M2 16c4 0 6-4 8-4s4 4 8 4 6-4 8-4" stroke="#0284c7" stroke-width="2" fill="none"/>
                </svg>`,
                animation: 'wave 1.5s ease-in-out infinite'
              },
              'severe_storm': {
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: flash 1s ease-in-out infinite;">
                  <path d="M12 2 L8 10 L16 10 L12 2 Z" fill="#6366f1"/>
                  <path d="M8 10 L4 18 L12 18 L8 10 Z" fill="#6366f1"/>
                </svg>`,
                animation: 'flash 1s ease-in-out infinite'
              },
              'drought': {
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: fade 2s ease-in-out infinite;">
                  <circle cx="12" cy="12" r="8" stroke="#fbbf24" stroke-width="2" fill="none"/>
                  <path d="M12 4 L12 20" stroke="#fbbf24" stroke-width="2"/>
                </svg>`,
                animation: 'fade 2s ease-in-out infinite'
              },
              'extreme_temperature': {
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: pulse 1.5s ease-in-out infinite;">
                  <rect x="8" y="4" width="8" height="16" rx="4" fill="#f97316"/>
                  <circle cx="12" cy="8" r="2" fill="#fff"/>
                </svg>`,
                animation: 'pulse 1.5s ease-in-out infinite'
              },
              'landslide': {
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: shake 0.8s ease-in-out infinite;">
                  <path d="M4 20 L8 12 L12 16 L16 8 L20 12 L20 20 Z" fill="#78716c"/>
                </svg>`,
                animation: 'shake 0.8s ease-in-out infinite'
              },
              'sea_ice': {
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: rotate 4s linear infinite;">
                  <path d="M12 2 L6 8 L12 14 L18 8 Z" fill="#06b6d4"/>
                  <circle cx="12" cy="12" r="3" fill="#fff"/>
                </svg>`,
                animation: 'rotate 4s linear infinite'
              },
              'miscellaneous': {
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: pulse 2s ease-in-out infinite;">
                  <circle cx="12" cy="12" r="10" stroke="#6b7280" stroke-width="2" fill="none"/>
                  <path d="M12 6 L12 18 M6 12 L18 12" stroke="#6b7280" stroke-width="2"/>
                </svg>`,
                animation: 'pulse 2s ease-in-out infinite'
              },
            }
            const icon = iconMap[type] || iconMap['miscellaneous']
            return icon.svg
          }

          // Create popup HTML with animated icon and disaster name
          const popupHTML = `
            <style>
              @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.1); }
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-2px) rotate(-1deg); }
                75% { transform: translateX(2px) rotate(1deg); }
              }
              @keyframes wave {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
              }
              @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes flash {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
              @keyframes fade {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
              }
            </style>
            <div style="padding: 12px; min-width: 220px; max-width: 320px;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0;">
                  ${getAnimatedIcon(disaster.type)}
                </div>
                <div style="flex: 1;">
                  <div style="font-weight: bold; font-size: 15px; color: #1f2937; margin-bottom: 2px;">
                    ${locationName}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 6px;">
                    ${disasterTypeName}
                    ${country ? `<span style="background: ${country === 'Thailand' ? '#ef4444' : '#3b82f6'}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-left: 4px;">${country === 'Thailand' ? '🇹🇭 Thai Event' : country}</span>` : ''}
                  </div>
                </div>
              </div>
              <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; padding-left: 42px;">
                ${disasterTypeDesc}
              </div>
              <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #4b5563; margin-bottom: 4px;">
                  <strong>Risk Level:</strong>
                  <span style="color: ${riskPercentage >= 70 ? '#dc2626' : riskPercentage >= 40 ? '#f59e0b' : '#10b981'}; font-weight: bold; font-size: 12px;">${riskPercentage.toFixed(1)}%</span>
                </div>
                ${disaster.confidence ? `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #4b5563;">
                  <strong>Confidence:</strong>
                  <span style="font-weight: bold;">${disaster.confidence.toFixed(1)}%</span>
                </div>
                ` : ''}
              </div>
            </div>
          `

          // Create and show popup
          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            closeOnMove: false,
            anchor: 'bottom',
            offset: [0, -10],
            className: 'disaster-hover-popup',
          })
            .setLngLat(coordinates)
            .setHTML(popupHTML)
            .addTo(map.current)

          popupRef.current = popup
        }
      }
    }

    const handleMouseLeave = () => {
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
    }

    map.current.on('mouseenter', unclusteredPointLayerId, handleMouseEnter)
    map.current.on('mouseleave', unclusteredPointLayerId, handleMouseLeave)

    return () => {
      if (map.current) {
        map.current.off('mouseenter', unclusteredPointLayerId, handleMouseEnter)
        map.current.off('mouseleave', unclusteredPointLayerId, handleMouseLeave)
      }
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
    }
  }, [disasters])

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

  // Navigate to specific location when requested (but don't override user location)
  useEffect(() => {
    if (!map.current || !navigateToLocation || userLocation) return

    map.current.flyTo({
      center: [navigateToLocation.lng, navigateToLocation.lat],
      zoom: 10,
      duration: 1500,
      essential: true,
    })
  }, [navigateToLocation, userLocation])

  // Add user location marker
  useEffect(() => {
    if (!map.current || !userLocation) {
      console.log('User location marker: map or location not ready', { 
        hasMap: !!map.current, 
        hasLocation: !!userLocation 
      })
      return
    }

    console.log('Adding user location marker at:', userLocation)

    // Remove existing user location marker
    if (userLocationMarkerRef.current) {
      console.log('Removing existing user location marker')
      userLocationMarkerRef.current.remove()
      userLocationMarkerRef.current = null
    }

    // Wait for map to be fully loaded if needed
    if (!map.current.isStyleLoaded()) {
      console.log('Map style not loaded yet, waiting...')
      const onLoad = () => {
        addUserLocationMarker()
        map.current?.off('style.load', onLoad)
      }
      map.current.on('style.load', onLoad)
      return
    }

    addUserLocationMarker()

    function addUserLocationMarker() {
      if (!map.current || !userLocation) return

      // Create a custom HTML element for the user location pin (RED PIN)
      const el = document.createElement('div')
      el.className = 'user-location-marker'
      el.style.width = '40px'
      el.style.height = '40px'
      el.style.cursor = 'pointer'
      el.style.zIndex = '10000'
      el.style.position = 'relative'
      
      // Create red pin shape (teardrop/pin shape)
      const pinSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      pinSvg.setAttribute('width', '40')
      pinSvg.setAttribute('height', '40')
      pinSvg.setAttribute('viewBox', '0 0 40 40')
      pinSvg.style.position = 'absolute'
      pinSvg.style.top = '0'
      pinSvg.style.left = '0'
      
      // Red pin body (teardrop shape)
      const pinPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      pinPath.setAttribute('d', 'M20 2C12.27 2 6 8.27 6 16c0 10 14 22 14 22s14-12 14-22C34 8.27 27.73 2 20 2z')
      pinPath.setAttribute('fill', '#ef4444')
      pinPath.setAttribute('stroke', '#ffffff')
      pinPath.setAttribute('stroke-width', '2')
      pinSvg.appendChild(pinPath)
      
      // White center dot
      const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      centerDot.setAttribute('cx', '20')
      centerDot.setAttribute('cy', '16')
      centerDot.setAttribute('r', '6')
      centerDot.setAttribute('fill', '#ffffff')
      pinSvg.appendChild(centerDot)
      
      el.appendChild(pinSvg)
      
      // Add pulsing animation ring
      const pulseRing = document.createElement('div')
      pulseRing.style.width = '40px'
      pulseRing.style.height = '40px'
      pulseRing.style.borderRadius = '50%'
      pulseRing.style.border = '3px solid #ef4444'
      pulseRing.style.position = 'absolute'
      pulseRing.style.top = '0'
      pulseRing.style.left = '0'
      pulseRing.style.animation = 'pulse-ring 2s infinite'
      pulseRing.style.opacity = '0.6'
      el.appendChild(pulseRing)
      
      // Add CSS animations if not already added
      if (!document.getElementById('user-location-animation')) {
        const style = document.createElement('style')
        style.id = 'user-location-animation'
        style.textContent = `
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.9;
            }
          }
          @keyframes pulse-ring {
            0% {
              transform: scale(1);
              opacity: 0.6;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }
        `
        document.head.appendChild(style)
      }
      
      // Add pulsing animation to the pin
      pinSvg.style.animation = 'pulse 2s infinite'

      try {
        // Create marker
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([userLocation.lng, userLocation.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25, closeOnClick: false })
              .setHTML('<div style="padding: 8px;"><strong>Your Location</strong><br/>' +
                `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}</div>`)
          )
          .addTo(map.current)

        userLocationMarkerRef.current = marker
        console.log('User location marker added successfully at:', [userLocation.lng, userLocation.lat])

        // Center map on user location with a slight delay to ensure marker is visible
        setTimeout(() => {
          if (map.current) {
            map.current.flyTo({
              center: [userLocation.lng, userLocation.lat],
              zoom: 14,
              duration: 1500,
              essential: true,
            })
          }
        }, 100)
      } catch (error) {
        console.error('Error adding user location marker:', error)
      }
    }

    // Cleanup function
    return () => {
      if (userLocationMarkerRef.current) {
        console.log('Cleaning up user location marker')
        userLocationMarkerRef.current.remove()
        userLocationMarkerRef.current = null
      }
    }
  }, [userLocation])

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


