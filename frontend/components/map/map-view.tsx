'use client'

import { useState, useCallback, useEffect } from 'react'
import { DisasterMap } from './disaster-map'
import { DisasterPanel } from './disaster-panel'
import { ContactAuthorityModal } from '@/components/contact/contact-authority-modal'
import { DisasterThreat, PreventionAction, PreventionActionType, PREVENTION_ACTIONS } from '@/lib/map/dummy-data'
import { DUMMY_DISASTERS } from '@/lib/map/dummy-data'
import { Authority } from '@/lib/services/authority-service'

interface MapViewProps {
  onSaveSolution?: (disaster: DisasterThreat, actions: PreventionAction[]) => void
  onContactAuthority?: (disaster: DisasterThreat) => void
}

export function MapView({ onSaveSolution, onContactAuthority }: MapViewProps) {
  const [disasters] = useState<DisasterThreat[]>(DUMMY_DISASTERS)
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterThreat | null>(null)
  const [preventionActions, setPreventionActions] = useState<
    Array<{ id: string; type: string; location: { lat: number; lng: number } }>
  >([])
  const [panelActions, setPanelActions] = useState<PreventionAction[]>([])
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [navigateToLocation, setNavigateToLocation] = useState<{ lat: number; lng: number } | null>(null)
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

  const handleDisasterClick = useCallback((disaster: DisasterThreat) => {
    // If clicking a different disaster, clear previous actions
    if (selectedDisaster?.id !== disaster.id) {
      setPreventionActions([])
      setPanelActions([])
    }
    setSelectedDisaster(disaster)
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

  // Convert prevention actions to format expected by map
  const mapActions = preventionActions.map((action) => ({
    id: action.id,
    type: action.type,
    location: { lat: action.location.lat, lng: action.location.lng },
  }))

  return (
    <div className="relative w-full h-screen">
      <DisasterMap
        disasters={disasters}
        onDisasterClick={handleDisasterClick}
        selectedDisasterId={selectedDisaster?.id || null}
        preventionActions={mapActions}
        onActionDrop={(actionType, location) => {
          handleActionDrop(actionType as PreventionActionType, location)
        }}
        navigateToLocation={navigateToLocation}
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

