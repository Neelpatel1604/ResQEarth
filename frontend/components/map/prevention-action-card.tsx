'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PreventionActionType, PREVENTION_ACTIONS } from '@/lib/map/data'
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
  const [isHovered, setIsHovered] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragged(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('actionType', type)
    e.dataTransfer.setData('text/plain', type) // For better compatibility
    e.dataTransfer.dropEffect = 'move'
    
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.opacity = '0.8'
    dragImage.style.transform = 'rotate(5deg)'
    document.body.appendChild(dragImage)
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
    
    // Store in window for map click handler
    ;(window as any).__draggedAction = type
    ;(window as any).__isDragging = true
    
    // Add visual feedback to map
    document.body.style.cursor = 'crosshair'
    const canvas = document.querySelector('.mapboxgl-canvas') as HTMLElement
    if (canvas) {
      canvas.style.cursor = 'crosshair'
      // Add a class to indicate dragging mode
      canvas.classList.add('action-dropping')
    }
    
    // Add a visual indicator
    const indicator = document.createElement('div')
    indicator.id = 'action-drop-indicator'
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(16, 185, 129, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: none;
    `
    indicator.textContent = `Click on the map to deploy ${action.name}`
    document.body.appendChild(indicator)
    
    onDragStart?.(type, e)
  }

  const handleDragEnd = () => {
    setIsDragged(false)
    // Don't clear immediately - wait for drop or timeout
    // The map click handler will clear it when action is dropped
    // If no drop happens within 5 seconds, clear it
    setTimeout(() => {
      // Only clear if still exists (wasn't cleared by drop)
      if ((window as any).__draggedAction === type) {
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
      }
    }, 5000) // Give 5 seconds for user to click on map
    onDragEnd?.()
  }

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-all',
        'hover:shadow-lg hover:border-primary hover:scale-105',
        (isDragging || isDragged) && 'opacity-50 scale-95',
        isHovered && !isDragged && 'ring-2 ring-primary ring-offset-2'
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
        <div className="mt-2 text-xs text-primary font-medium">
          Drag to map →
        </div>
      </CardContent>
    </Card>
  )
}

