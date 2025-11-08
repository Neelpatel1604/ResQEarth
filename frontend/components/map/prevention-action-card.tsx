'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PreventionActionType, PREVENTION_ACTIONS } from '@/lib/map/dummy-data'
import { cn } from '@/lib/utils'

interface PreventionActionCardProps {
  type: PreventionActionType
  onDragStart?: (type: PreventionActionType, event: React.DragEvent) => void
  onDragEnd?: () => void
  isDragging?: boolean
}

export function PreventionActionCard({
  type,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: PreventionActionCardProps) {
  const action = PREVENTION_ACTIONS[type]
  const [isDragged, setIsDragged] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragged(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('actionType', type)
    // Store in window for map click handler
    ;(window as any).__draggedAction = type
    onDragStart?.(type, e)
  }

  const handleDragEnd = () => {
    setIsDragged(false)
    // Clear dragged action after a delay (in case drop happens)
    setTimeout(() => {
      delete (window as any).__draggedAction
    }, 100)
    onDragEnd?.()
  }

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-all hover:shadow-lg',
        (isDragging || isDragged) && 'opacity-50 scale-95',
        'hover:border-primary'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="text-2xl">{action.icon}</div>
          <CardTitle className="text-sm">{action.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>Cost: ${action.defaultCost.toLocaleString()}</div>
          <div>Effectiveness: {action.defaultEffectiveness}%</div>
        </div>
      </CardContent>
    </Card>
  )
}

