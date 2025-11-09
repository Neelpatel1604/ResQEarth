'use client'

import { useState, useCallback, useEffect } from 'react'
import { DisasterMap } from './disaster-map'
import { DisasterPanel } from './disaster-panel'
import { ContactAuthorityModal } from '@/components/contact/contact-authority-modal'
import { DisasterThreat, PreventionAction, PreventionActionType, PREVENTION_ACTIONS, DUMMY_DISASTERS } from '@/lib/map/dummy-data'
import { Authority } from '@/lib/services/authority-service'
import { getDisasters, getAllDisasters } from '@/lib/api/disasters'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Flame, AlertTriangle, Navigation, Loader2 } from 'lucide-react'

interface MapViewProps {
  onSaveSolution?: (disaster: DisasterThreat, actions: PreventionAction[]) => void
  onContactAuthority?: (disaster: DisasterThreat) => void
  onToggleChange?: (showAllDisasters: boolean) => void
}

export function MapView({ onSaveSolution, onContactAuthority, onToggleChange }: MapViewProps) {
  const [disasters, setDisasters] = useState<DisasterThreat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterThreat | null>(null)
  const [showAllDisasters, setShowAllDisasters] = useState(false) // Toggle: false = fire only, true = all disasters
  const [preventionActions, setPreventionActions] = useState<
    Array<{ id: string; type: string; location: { lat: number; lng: number } }>
  >([])
  const [panelActions, setPanelActions] = useState<PreventionAction[]>([])
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [navigateToLocation, setNavigateToLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [dropFeedback, setDropFeedback] = useState<{ 
    message: string
    timestamp: number
    details?: {
      location: string
      cost: string
      effectiveness: string
    }
  } | null>(null)

  // Make PREVENTION_ACTIONS available globally for map markers
  useEffect(() => {
    ;(window as any).__PREVENTION_ACTIONS = PREVENTION_ACTIONS
    return () => {
      delete (window as any).__PREVENTION_ACTIONS
    }
  }, [])

  // Fetch disasters from API with auto-refresh
  useEffect(() => {
    const fetchDisasters = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let response
        if (showAllDisasters) {
          // Use new endpoint for all disasters
          response = await getAllDisasters({
            limit: 50, // Ambee API max limit is 50
          })
          console.log(`Received ${response.disasters.length} disasters from All Disasters API`)
        } else {
          // Use existing endpoint for fire only
          response = await getDisasters({
            disaster_type: 'wildfire',
            limit: 50,
          })
          console.log(`Received ${response.disasters.length} disasters from Fire API`)
        }
        
        // Empty array is valid - means no disasters found
        if (response.disasters.length === 0) {
          console.log('No disasters found.')
          setDisasters([])
          // Don't show error for empty results - this is valid
        } else {
          const sample = response.disasters[0]
          console.log('Sample disaster:', {
            id: sample.id,
            type: sample.type,
            lat: sample.location?.latitude,
            lng: sample.location?.longitude,
            risk: sample.risk_percentage,
          })
          setDisasters(response.disasters)
        }
      } catch (err) {
        console.error('Failed to fetch disasters:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load disaster data'
        
        // Use dummy data as fallback for testing
        if (errorMessage.includes('Failed to connect') || errorMessage.includes('backend') || errorMessage.includes('fetch')) {
          console.log('Backend not available, using dummy data for testing')
          // Filter dummy data based on toggle state
          const filteredDummyData = showAllDisasters 
            ? DUMMY_DISASTERS 
            : DUMMY_DISASTERS.filter(d => d.type === 'wildfire')
          setDisasters(filteredDummyData)
          setError(null) // Don't show error when using dummy data
        } else {
          setError(null) // Don't show error for empty results
          setDisasters([])
        }
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchDisasters()

    // Auto-refresh every 10 minutes (600000 ms)
    const interval = setInterval(fetchDisasters, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [showAllDisasters])
  const handleDisasterClick = useCallback((disaster: DisasterThreat) => {
    console.log('✅ handleDisasterClick called with:', disaster.id, disaster.type, disaster.location.name)
    // If clicking a different disaster, clear previous actions
    if (selectedDisaster?.id !== disaster.id) {
      setPreventionActions([])
      setPanelActions([])
    }
    console.log('🎯 Setting selectedDisaster to:', disaster.id)
    setSelectedDisaster(disaster)
    console.log('📱 Sidebar should now open!')
  }, [selectedDisaster])

  const handleNavigateToLocation = useCallback((disaster: DisasterThreat) => {
    // Set the location to navigate to
    setNavigateToLocation({
      lat: disaster.location.latitude,
      lng: disaster.location.longitude,
    })
    // Also ensure the disaster is selected
    setSelectedDisaster(disaster)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedDisaster(null)
  }, [])

  const handleActionDrop = useCallback(
    (actionType: PreventionActionType, location: { lat: number; lng: number }) => {
      // Only allow dropping actions if a disaster is selected
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
      
      // Also add to panel actions
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
      
      // Show visual feedback with more details
      setDropFeedback({
        message: `✅ Successfully Deployed ${actionInfo.icon} ${actionInfo.name}`,
        timestamp: Date.now(),
        details: {
          location: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
          cost: `$${actionInfo.defaultCost.toLocaleString()}`,
          effectiveness: `${actionInfo.defaultEffectiveness}%`,
        },
      })
      
      // Clear feedback after 5 seconds (longer for better visibility)
      setTimeout(() => {
        setDropFeedback(null)
      }, 5000)
      
      console.log(`✅ Deployed ${actionInfo.name} at ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`)
    },
    [selectedDisaster]
  )

  const handleSave = useCallback(
    (disaster: DisasterThreat, actions: PreventionAction[]) => {
      if (onSaveSolution) {
        onSaveSolution(disaster, actions)
      }
      // Reset after save
      setPreventionActions([])
      setPanelActions([])
    },
    [onSaveSolution]
  )

  const handleContact = useCallback(
    (disaster: DisasterThreat) => {
      setSelectedDisaster(disaster)
      setContactModalOpen(true)
    },
    []
  )

  const handleSendMessage = useCallback(
    async (authority: Authority, message: string) => {
      if (onContactAuthority && selectedDisaster) {
        // In production, this would send via Twilio or email API
        console.log('Sending message to authority:', { authority, message, disaster: selectedDisaster })
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
        onContactAuthority(selectedDisaster)
      }
    },
    [onContactAuthority, selectedDisaster]
  )

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(location)
        setNavigateToLocation(location)
        setIsLocating(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setIsLocating(false)
        alert(`Unable to get your location: ${error.message}`)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  // Convert prevention actions to format expected by map
  const mapActions = preventionActions.map((action) => ({
    id: action.id,
    type: action.type,
    location: { lat: action.location.lat, lng: action.location.lng },
  }))

  return (
    <div className="relative w-full h-screen">
      {/* Locate Me Button */}
      <div className="absolute top-20 left-4 z-50">
        <Button
          onClick={handleLocateMe}
          disabled={isLocating}
          variant="default"
          size="sm"
          className="bg-background/90 backdrop-blur-sm border shadow-lg"
        >
          {isLocating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Locating...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              Locate Me
            </>
          )}
        </Button>
      </div>

      {/* Toggle between All Disasters and Fire Only */}
      <div className="absolute top-4 right-4 z-50 bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg p-3 min-w-[280px]">
        <div className="flex items-center gap-3">
          <div 
            className={`flex items-center gap-2 transition-colors ${
              !showAllDisasters 
                ? 'text-foreground font-semibold' 
                : 'text-muted-foreground'
            }`}
            onClick={() => {
              setShowAllDisasters(false)
              onToggleChange?.(false)
            }}
          >
            <Flame className={`h-4 w-4 ${!showAllDisasters ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <Label htmlFor="disaster-toggle" className="text-sm cursor-pointer">
              Fire Only
            </Label>
          </div>
          <Switch
            id="disaster-toggle"
            checked={showAllDisasters}
            onCheckedChange={(checked) => {
              setShowAllDisasters(checked)
              onToggleChange?.(checked)
            }}
          />
          <div 
            className={`flex items-center gap-2 transition-colors ${
              showAllDisasters 
                ? 'text-foreground font-semibold' 
                : 'text-muted-foreground'
            }`}
            onClick={() => {
              setShowAllDisasters(true)
              onToggleChange?.(true)
            }}
          >
            <AlertTriangle className={`h-4 w-4 ${showAllDisasters ? 'text-primary' : 'text-muted-foreground'}`} />
            <Label htmlFor="disaster-toggle" className="text-sm cursor-pointer">
              All Disasters
            </Label>
          </div>
        </div>
        {/* Dynamic description based on toggle state */}
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
          {showAllDisasters ? (
            <span>Showing all disaster types: earthquakes, floods, cyclones, volcanoes, and more</span>
          ) : (
            <span>Showing only wildfire data from NASA FIRMS and Ambee Fire API</span>
          )}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {showAllDisasters ? 'Loading all disasters...' : 'Loading wildfire data...'}
            </p>
          </div>
        </div>
      )}
      {error && !loading && (
        <div className="absolute top-4 right-4 bg-yellow-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-md">
          <p className="text-sm">{error}</p>
        </div>
      )}
      {!loading && disasters.length > 0 && (
        <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="text-sm font-semibold">
            {showAllDisasters ? (
              <>🌍 {disasters.length.toLocaleString()} Active Disasters</>
            ) : (
              <>🔥 {disasters.length.toLocaleString()} Active Wildfires (Last 24 Hours)</>
            )}
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {showAllDisasters ? (
              <>Data from Ambee Natural Disasters API • Cached for 10 min • Auto-refreshes every 10 min</>
            ) : (
              <>Data from NASA FIRMS (with Ambee fallback) • Auto-refreshes every 10 min</>
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
              <>Checking Ambee Natural Disasters API • Auto-refreshes every 10 min</>
            ) : (
              <>Checking NASA FIRMS and Ambee Fire API • Auto-refreshes every 10 min</>
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
      {/* Enhanced Drop feedback toast */}
      {dropFeedback && (
        <div
          className="fixed top-4 right-4 z-[10000] bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-green-400 animate-in slide-in-from-top-5"
          style={{
            animation: 'slideInFromTop 0.4s ease-out, pulse 2s ease-in-out infinite',
            minWidth: '320px',
            maxWidth: '400px',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl animate-bounce">✅</div>
            <div className="flex-1">
              <div className="font-bold text-lg mb-1">{dropFeedback.message}</div>
              {dropFeedback.details && (
                <div className="text-sm text-green-100 space-y-1 mt-2 pt-2 border-t border-green-400/30">
                  <div className="flex justify-between">
                    <span className="opacity-90">Location:</span>
                    <span className="font-mono text-xs">{dropFeedback.details.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-90">Cost:</span>
                    <span className="font-semibold">{dropFeedback.details.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-90">Effectiveness:</span>
                    <span className="font-semibold">{dropFeedback.details.effectiveness}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {selectedDisaster && (
        <>
          {console.log('🎨 Rendering DisasterPanel for:', selectedDisaster.id)}
          <DisasterPanel
            disaster={selectedDisaster}
            onClose={handleClosePanel}
            onSave={handleSave}
            onContactAuthority={handleContact}
            onActionDrop={handleActionDrop}
            actions={panelActions}
            onNavigateToLocation={handleNavigateToLocation}
          />
          <ContactAuthorityModal
            open={contactModalOpen}
            onOpenChange={setContactModalOpen}
            disaster={selectedDisaster}
            onSend={handleSendMessage}
          />
        </>
      )}
    </div>
  )
}

