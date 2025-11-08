'use client'

import { useState, useCallback } from 'react'
import { DisasterMap } from './disaster-map'
import { DisasterPanel } from './disaster-panel'
import { DisasterThreat, PreventionAction, PreventionActionType, PREVENTION_ACTIONS } from '@/lib/map/dummy-data'
import { DUMMY_DISASTERS } from '@/lib/map/dummy-data'

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

  const handleDisasterClick = useCallback((disaster: DisasterThreat) => {
    setSelectedDisaster(disaster)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedDisaster(null)
  }, [])

  const handleActionDrop = useCallback(
    (actionType: PreventionActionType, location: { lat: number; lng: number }) => {
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
        location,
        cost: actionInfo.defaultCost,
        effectiveness: actionInfo.defaultEffectiveness,
        description: actionInfo.name,
      }
      setPanelActions((prev) => [...prev, panelAction])
    },
    []
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
      if (onContactAuthority) {
        onContactAuthority(disaster)
      }
    },
    [onContactAuthority]
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
      />
      {selectedDisaster && (
        <DisasterPanel
          disaster={selectedDisaster}
          onClose={handleClosePanel}
          onSave={handleSave}
          onContactAuthority={handleContact}
          onActionDrop={handleActionDrop}
          actions={panelActions}
        />
      )}
    </div>
  )
}

