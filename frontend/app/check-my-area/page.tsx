'use client'

import { useState, useEffect, useCallback } from 'react'
import { DisasterMap } from '@/components/map/disaster-map'
import { DisasterPanel } from '@/components/map/disaster-panel'
import { DisasterThreat, PreventionAction, PreventionActionType, PREVENTION_ACTIONS, DUMMY_DISASTERS } from '@/lib/map/dummy-data'
import { checkMyArea, getAllDisasters, getDisasters } from '@/lib/api/disasters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { MapPin, Search, AlertCircle, Flame, AlertTriangle, Settings, X, Navigation } from 'lucide-react'
import Link from 'next/link'

export default function CheckMyAreaPage() {
  const [disasters, setDisasters] = useState<DisasterThreat[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterThreat | null>(null)
  const [preventionActions, setPreventionActions] = useState<
    Array<{ id: string; type: string; location: { lat: number; lng: number } }>
  >([])
  const [panelActions, setPanelActions] = useState<PreventionAction[]>([])
  const [navigateToLocation, setNavigateToLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Location input state
  const [lat, setLat] = useState<string>('')
  const [lng, setLng] = useState<string>('')
  const [searchMode, setSearchMode] = useState<'location' | 'global'>('location')
  const [disasterTypeFilter, setDisasterTypeFilter] = useState<string>('all')
  const [minRisk, setMinRisk] = useState<string>('0')
  const [showAllDisasters, setShowAllDisasters] = useState(true) // Toggle: false = fire only, true = all disasters

  // Make PREVENTION_ACTIONS available globally for map markers
  useEffect(() => {
    ;(window as any).__PREVENTION_ACTIONS = PREVENTION_ACTIONS
    return () => {
      delete (window as any).__PREVENTION_ACTIONS
    }
  }, [])

  // Try to get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6)
          const lng = position.coords.longitude.toFixed(6)
          setLat(lat)
          setLng(lng)
          // Also set user location for the pin
          setUserLocation({
            lat: parseFloat(lat),
            lng: parseFloat(lng),
          })
        },
        (err) => {
          console.log('Geolocation error:', err)
        }
      )
    }
  }, [])

  const fetchDisasters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let response
      if (showAllDisasters) {
        // Use new endpoints for all disasters
        if (searchMode === 'location' && lat && lng) {
          // Check specific area using new endpoint
          const params: any = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            limit: 50, // Ambee API max limit is 50
          }
          if (disasterTypeFilter !== 'all') {
            params.disaster_type = disasterTypeFilter
          }
          if (minRisk !== '0') {
            params.min_risk = parseFloat(minRisk)
          }
          response = await checkMyArea(params)
        } else {
          // Get all disasters globally using new endpoint
          const params: any = {
            limit: 50, // Ambee API max limit is 50
          }
          if (disasterTypeFilter !== 'all') {
            params.disaster_type = disasterTypeFilter
          }
          if (minRisk !== '0') {
            params.min_risk = parseFloat(minRisk)
          }
          response = await getAllDisasters(params)
        }
      } else {
        // Use existing endpoint for fire only
        const params: any = {
          use_firms: true,
          days: 1,
          limit: 50,
        }
        if (disasterTypeFilter !== 'all' && disasterTypeFilter === 'wildfire') {
          params.disaster_type = 'wildfire'
        }
        if (minRisk !== '0') {
          params.min_risk = parseFloat(minRisk)
        }
        response = await getDisasters(params)
      }

      console.log(`Received ${response.disasters.length} disasters from API`)
      setDisasters(response.disasters)

      // Navigate to location if provided
      if (lat && lng && searchMode === 'location') {
        setNavigateToLocation({
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        })
      }
    } catch (err) {
      console.error('Failed to fetch disasters:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load disaster data'
      
      // Use dummy data as fallback for testing
      if (errorMessage.includes('Failed to connect') || errorMessage.includes('backend') || errorMessage.includes('fetch')) {
        console.log('Backend not available, using dummy data for testing')
        // Filter dummy data based on toggle state and filters
        let filteredDummyData = showAllDisasters ? DUMMY_DISASTERS : DUMMY_DISASTERS.filter(d => d.type === 'wildfire')
        
        // Apply disaster type filter if set
        if (disasterTypeFilter !== 'all') {
          filteredDummyData = filteredDummyData.filter(d => d.type === disasterTypeFilter)
        }
        
        // Apply min risk filter if set
        if (minRisk !== '0') {
          const minRiskValue = parseFloat(minRisk)
          filteredDummyData = filteredDummyData.filter(d => d.risk_percentage >= minRiskValue)
        }
        
        setDisasters(filteredDummyData)
        setError(null) // Don't show error when using dummy data
      } else {
        setError(errorMessage)
        setDisasters([])
      }
    } finally {
      setLoading(false)
    }
  }, [lat, lng, searchMode, disasterTypeFilter, minRisk, showAllDisasters])

  const handleLocateMe = async () => {
    if (navigator.geolocation) {
      setLoading(true)
      setError(null)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLat = position.coords.latitude.toFixed(6)
          const userLng = position.coords.longitude.toFixed(6)
          const location = {
            lat: parseFloat(userLat),
            lng: parseFloat(userLng),
          }
          
          setLat(userLat)
          setLng(userLng)
          setUserLocation(location) // Set user location for the pin FIRST
          setSearchMode('location')
          
          // Small delay to ensure map updates with user location
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Fetch disasters with the new location
          try {
            setLoading(true)
            setError(null)

            let response
            if (showAllDisasters) {
              // Check specific area using new endpoint
              const params: any = {
                lat: location.lat,
                lng: location.lng,
                limit: 50,
              }
              if (disasterTypeFilter !== 'all') {
                params.disaster_type = disasterTypeFilter
              }
              if (minRisk !== '0') {
                params.min_risk = parseFloat(minRisk)
              }
              response = await checkMyArea(params)
            } else {
              // Use existing endpoint for fire only
              const params: any = {
                use_firms: true,
                days: 1,
                limit: 50,
              }
              if (disasterTypeFilter !== 'all' && disasterTypeFilter === 'wildfire') {
                params.disaster_type = 'wildfire'
              }
              if (minRisk !== '0') {
                params.min_risk = parseFloat(minRisk)
              }
              response = await getDisasters(params)
            }

            console.log(`Received ${response.disasters.length} disasters from API`)
            setDisasters(response.disasters)

            // Don't set navigateToLocation here - let userLocation handle the centering
            // setNavigateToLocation(location)
          } catch (err) {
            console.error('Failed to fetch disasters:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to load disaster data'
            
            // Use dummy data as fallback for testing
            if (errorMessage.includes('Failed to connect') || errorMessage.includes('backend') || errorMessage.includes('fetch')) {
              console.log('Backend not available, using dummy data for testing')
              // Filter dummy data based on toggle state and filters
              let filteredDummyData = showAllDisasters ? DUMMY_DISASTERS : DUMMY_DISASTERS.filter(d => d.type === 'wildfire')
              
              // Apply disaster type filter if set
              if (disasterTypeFilter !== 'all') {
                filteredDummyData = filteredDummyData.filter(d => d.type === disasterTypeFilter)
              }
              
              // Apply min risk filter if set
              if (minRisk !== '0') {
                const minRiskValue = parseFloat(minRisk)
                filteredDummyData = filteredDummyData.filter(d => d.risk_percentage >= minRiskValue)
              }
              
              setDisasters(filteredDummyData)
              setError(null) // Don't show error when using dummy data
            } else {
              setError(errorMessage)
              setDisasters([])
            }
          } finally {
            setLoading(false)
          }
        },
        (err) => {
          setLoading(false)
          setError('Unable to get your location. Please enter coordinates manually.')
          console.error('Geolocation error:', err)
        }
      )
    } else {
      setError('Geolocation is not supported by your browser. Please enter coordinates manually.')
    }
  }

  const handleSearch = () => {
    if (searchMode === 'location' && (!lat || !lng)) {
      setError('Please enter both latitude and longitude')
      return
    }
    fetchDisasters()
  }

  const handleDisasterClick = useCallback((disaster: DisasterThreat) => {
    if (selectedDisaster?.id !== disaster.id) {
      setPreventionActions([])
      setPanelActions([])
    }
    setSelectedDisaster(disaster)
  }, [selectedDisaster])

  const handleActionDrop = useCallback(
    (actionType: PreventionActionType, location: { lat: number; lng: number }) => {
      if (!selectedDisaster) {
        console.warn('No disaster selected. Please select a disaster first.')
        return
      }

      const newAction = {
        id: `action-${Date.now()}-${Math.random()}`,
        type: actionType,
        location,
      }
      setPreventionActions((prev) => [...prev, newAction])
      
      const actionInfo = PREVENTION_ACTIONS[actionType]
      const panelAction: PreventionAction = {
        type: actionType,
        location: {
          latitude: location.lat,
          longitude: location.lng,
        },
        cost: actionInfo.defaultCost,
        effectiveness: actionInfo.defaultEffectiveness,
        description: actionInfo.name,
      }
      setPanelActions((prev) => [...prev, panelAction])
    },
    [selectedDisaster]
  )

  const handleNavigateToLocation = useCallback((disaster: DisasterThreat) => {
    setNavigateToLocation({
      lat: disaster.location.latitude,
      lng: disaster.location.longitude,
    })
    setSelectedDisaster(disaster)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedDisaster(null)
  }, [])

  const mapActions = preventionActions.map((action) => ({
    id: action.id,
    type: action.type,
    location: { lat: action.location.lat, lng: action.location.lng },
  }))

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r bg-background flex flex-col`}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="font-semibold">Configuration</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Toggle between All Disasters and Fire Only */}


          {/* Search Mode */}
          <div>
            <label className="text-sm font-medium mb-2 block">Search Mode</label>
            <div className="flex gap-2">
              <Button
                variant={searchMode === 'location' ? 'default' : 'outline'}
                onClick={() => setSearchMode('location')}
                className="flex-1"
                size="sm"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Location
              </Button>
              <Button
                variant={searchMode === 'global' ? 'default' : 'outline'}
                onClick={() => setSearchMode('global')}
                className="flex-1"
                size="sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Global
              </Button>
            </div>
          </div>

          {/* Location Input */}
          {searchMode === 'location' && (
            <div className="space-y-2">
              <Button
                onClick={handleLocateMe}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                <Navigation className="h-4 w-4" />
                {loading ? 'Locating...' : 'Locate Me'}
              </Button>
              <div>
                <label className="text-sm font-medium mb-1 block">Latitude</label>
                <Input
                  type="number"
                  placeholder="e.g., 40.7128"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  step="any"
                  min="-90"
                  max="90"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Longitude</label>
                <Input
                  type="number"
                  placeholder="e.g., -74.0060"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  step="any"
                  min="-180"
                  max="180"
                />
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Disaster Type</label>
              <Select value={disasterTypeFilter} onValueChange={setDisasterTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="wildfire">Wildfire</SelectItem>
                  <SelectItem value="flood">Flood</SelectItem>
                  <SelectItem value="earthquake">Earthquake</SelectItem>
                  <SelectItem value="tropical_cyclone">Tropical Cyclone</SelectItem>
                  <SelectItem value="volcano">Volcano</SelectItem>
                  <SelectItem value="drought">Drought</SelectItem>
                  <SelectItem value="extreme_temperature">Extreme Temperature</SelectItem>
                  <SelectItem value="severe_storm">Severe Storm</SelectItem>
                  <SelectItem value="tsunami">Tsunami</SelectItem>
                  <SelectItem value="landslide">Landslide</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Min Risk %</label>
              <Input
                type="number"
                placeholder="0"
                value={minRisk}
                onChange={(e) => setMinRisk(e.target.value)}
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Search Button */}
          <Button onClick={handleSearch} className="w-full" disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Searching...' : 'Search Disasters'}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Summary */}
          {!loading && disasters.length > 0 && (
            <div className="bg-muted p-3 rounded-md">
              <div className="text-sm font-semibold">
                {showAllDisasters ? (
                  <>🌍 {disasters.length} Disaster{disasters.length !== 1 ? 's' : ''} Found</>
                ) : (
                  <>🔥 {disasters.length} Wildfire{disasters.length !== 1 ? 's' : ''} Found</>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {showAllDisasters ? (
                  <>Data from Ambee Natural Disasters API • Cached for 10 min</>
                ) : (
                  <>Data from NASA FIRMS (with Ambee fallback)</>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Map */}
      <div className="flex-1 relative flex flex-col">
        {/* Header */}
        <div className="bg-background border-b px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Home
            </Link>
            <h1 className="text-xl font-semibold">Check My Area</h1>
          </div>
        </div>

        {/* Map View */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading disaster data...</p>
              </div>
            </div>
          )}

          {!loading && disasters.length > 0 && (
            <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg z-50">
              <div className="text-sm font-semibold">
                {showAllDisasters ? (
                  <>🌍 {disasters.length} Disaster{disasters.length !== 1 ? 's' : ''} Found</>
                ) : (
                  <>🔥 {disasters.length} Wildfire{disasters.length !== 1 ? 's' : ''} Found</>
                )}
              </div>
              <div className="text-xs text-gray-300 mt-1">
                {showAllDisasters ? (
                  <>Data from Ambee Natural Disasters API • Cached for 10 minutes</>
                ) : (
                  <>Data from NASA FIRMS (with Ambee fallback)</>
                )}
              </div>
            </div>
          )}

          {!loading && disasters.length === 0 && !error && (
            <div className="absolute top-4 left-4 bg-blue-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50">
              <div className="text-sm font-semibold">
                {showAllDisasters ? (
                  <>ℹ️ No active disasters detected</>
                ) : (
                  <>ℹ️ No active wildfires detected</>
                )}
              </div>
              <div className="text-xs text-blue-100 mt-1">
                {showAllDisasters ? (
                  <>Checking Ambee Natural Disasters API</>
                ) : (
                  <>Checking NASA FIRMS and Ambee Fire API</>
                )}
              </div>
            </div>
          )}

          <DisasterMap
            disasters={disasters}
            onDisasterClick={handleDisasterClick}
            selectedDisasterId={selectedDisaster?.id || null}
            preventionActions={mapActions}
            onActionDrop={(actionType, location) => {
              handleActionDrop(actionType as PreventionActionType, location)
            }}
            navigateToLocation={navigateToLocation}
            userLocation={userLocation}
          />

          {selectedDisaster && (
            <DisasterPanel
              disaster={selectedDisaster}
              onClose={handleClosePanel}
              onSave={() => {
                console.log('Save disaster solution')
              }}
              onContactAuthority={() => {
                console.log('Contact authority')
              }}
              onActionDrop={handleActionDrop}
              actions={panelActions}
              onNavigateToLocation={handleNavigateToLocation}
            />
          )}
        </div>
      </div>
    </div>
  )
}
