'use client'

import * as React from 'react'
import { useState } from 'react'
import { X, AlertTriangle, MapPin, Clock, Users, Save, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DisasterThreat, PreventionAction, PreventionActionType, PREVENTION_ACTIONS } from '@/lib/map/dummy-data'
import { PreventionActionCard } from './prevention-action-card'
import { ParameterControls } from './parameter-controls'
import { cn } from '@/lib/utils'

interface DisasterPanelProps {
  disaster: DisasterThreat | null
  onClose: () => void
  onSave?: (disaster: DisasterThreat, actions: PreventionAction[]) => void
  onContactAuthority?: (disaster: DisasterThreat) => void
  onActionDrop?: (actionType: PreventionActionType, location: { lat: number; lng: number }) => void
  actions?: PreventionAction[]
  onNavigateToLocation?: (disaster: DisasterThreat) => void
}

export function DisasterPanel({
  disaster,
  onClose,
  onSave,
  onContactAuthority,
  onActionDrop,
  actions: externalActions,
  onNavigateToLocation,
}: DisasterPanelProps) {
  const [internalActions, setInternalActions] = useState<PreventionAction[]>([])
  const [draggingAction, setDraggingAction] = useState<PreventionActionType | null>(null)
  
  // Use external actions if provided, otherwise use internal state
  const actions = externalActions || internalActions

  if (!disaster) return null

  const handleDragStart = (type: PreventionActionType) => {
    setDraggingAction(type)
  }

  const handleDragEnd = () => {
    setDraggingAction(null)
  }

  const handleAddAction = (type: PreventionActionType, location: { lat: number; lng: number }) => {
    if (externalActions) {
      // If external actions are provided, notify parent instead
      onActionDrop?.(type, location)
      return
    }
    
    const actionInfo = PREVENTION_ACTIONS[type]
    const newAction: PreventionAction = {
      type,
      location: {
        latitude: location.lat,
        longitude: location.lng,
      },
      cost: actionInfo.defaultCost,
      effectiveness: actionInfo.defaultEffectiveness,
      description: actionInfo.name,
    }
    setInternalActions([...internalActions, newAction])
  }

  // Handle action drop from map - this is called by the map component
  React.useEffect(() => {
    if (onActionDrop) {
      // Store the callback to be used when action is dropped
      // The map-view component will handle the actual drop coordination
    }
  }, [onActionDrop])

  const handleSave = () => {
    if (onSave) {
      onSave(disaster, actions)
    }
  }

  const handleContact = () => {
    if (onContactAuthority) {
      onContactAuthority(disaster)
    }
  }

  const getDisasterTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  }

  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <h2 className="font-semibold">{getDisasterTypeLabel(disaster.type)}</h2>
            <p className="text-sm text-muted-foreground">{disaster.location.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Disaster Details */}
        <Card>
          <CardHeader>
            <CardTitle>Disaster Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Location:</span>
                <span>{disaster.location.name}</span>
              </div>
              {onNavigateToLocation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigateToLocation(disaster)}
                  className="h-7 text-xs"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  View on Map
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground pl-6">
              {disaster.location.latitude.toFixed(4)}, {disaster.location.longitude.toFixed(4)}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-muted-foreground">Risk Level:</span>
              <span className="font-semibold text-destructive">{disaster.risk_percentage}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Time Window:</span>
              <span>{disaster.time_window_hours} hours</span>
            </div>
            {disaster.satellite_data?.population_at_risk && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Population at Risk:</span>
                <span>{disaster.satellite_data.population_at_risk.toLocaleString()}</span>
              </div>
            )}
            {disaster.area_at_risk_hectares && (
              <div className="text-sm">
                <span className="text-muted-foreground">Area at Risk:</span>{' '}
                <span>{disaster.area_at_risk_hectares.toLocaleString()} hectares</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Satellite Data */}
        {disaster.satellite_data && (
          <Card>
            <CardHeader>
              <CardTitle>Satellite Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {disaster.satellite_data.fuel_dryness !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fuel Dryness:</span>
                  <span>{disaster.satellite_data.fuel_dryness}%</span>
                </div>
              )}
              {disaster.satellite_data.temperature_anomaly !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temperature Anomaly:</span>
                  <span>+{disaster.satellite_data.temperature_anomaly}°C</span>
                </div>
              )}
              {disaster.satellite_data.wind_speed !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wind Speed:</span>
                  <span>{disaster.satellite_data.wind_speed} km/h</span>
                </div>
              )}
              {disaster.satellite_data.rain_forecast !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rain Forecast:</span>
                  <span>{disaster.satellite_data.rain_forecast} mm</span>
                </div>
              )}
              {disaster.satellite_data.soil_moisture !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Soil Moisture:</span>
                  <span>{disaster.satellite_data.soil_moisture}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Prevention Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Prevention Actions</CardTitle>
            <CardDescription>Drag actions onto the map to deploy them</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PREVENTION_ACTIONS) as PreventionActionType[]).map((type) => (
                <PreventionActionCard
                  key={type}
                  type={type}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  isDragging={draggingAction === type}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Parameter Controls */}
        {actions.length > 0 && (
          <ParameterControls disaster={disaster} actions={actions} />
        )}

        {/* Active Actions */}
        {actions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Actions ({actions.length})</CardTitle>
              <CardDescription>Click on map to deploy actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {actions.map((action, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-2 bg-muted rounded text-sm hover:bg-muted/80 transition-all",
                      index === actions.length - 1 && "animate-pulse bg-green-500/20 border-2 border-green-500/50"
                    )}
                    style={{
                      animation: index === actions.length - 1 ? 'highlightNew 1s ease-out' : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{PREVENTION_ACTIONS[action.type].icon}</span>
                      <div>
                        <div className="font-medium">{PREVENTION_ACTIONS[action.type].name}</div>
                        <div className="text-xs text-muted-foreground">
                          {action.location.latitude.toFixed(4)}, {action.location.longitude.toFixed(4)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">${action.cost.toLocaleString()}</span>
                      <span className="text-xs text-green-600 font-medium">
                        {action.effectiveness}% effective
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t space-y-2">
        <Button className="w-full" onClick={handleSave} disabled={actions.length === 0}>
          <Save className="h-4 w-4 mr-2" />
          Save Solution
        </Button>
        <Button variant="outline" className="w-full" onClick={handleContact}>
          <Phone className="h-4 w-4 mr-2" />
          Contact Authority
        </Button>
      </div>
    </div>
  )
}

