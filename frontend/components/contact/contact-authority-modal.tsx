'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Phone, Mail, MapPin, Send, Loader2 } from 'lucide-react'
import { DisasterThreat } from '@/lib/map/dummy-data'
import { findNearestAuthorities, getAuthorityTypeLabel, Authority } from '@/lib/services/authority-service'
import { cn } from '@/lib/utils'

interface ContactAuthorityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  disaster: DisasterThreat | null
  onSend?: (authority: Authority, message: string) => Promise<void>
}

export function ContactAuthorityModal({
  open,
  onOpenChange,
  disaster,
  onSend,
}: ContactAuthorityModalProps) {
  const [authorities, setAuthorities] = useState<Authority[]>([])
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(null)
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (disaster && open) {
      const nearest = findNearestAuthorities(disaster.location, 100)
      setAuthorities(nearest)
      if (nearest.length > 0) {
        setSelectedAuthority(nearest[0])
      }
    }
  }, [disaster, open])

  useEffect(() => {
    if (disaster && selectedAuthority) {
      // Auto-generate message
      const autoMessage = `URGENT: Disaster Prevention Plan

Disaster Type: ${disaster.type.charAt(0).toUpperCase() + disaster.type.slice(1)}
Location: ${disaster.location.name || `${disaster.location.latitude}, ${disaster.location.longitude}`}
Risk Level: ${disaster.risk_percentage}%
Time Window: ${disaster.time_window_hours} hours

We have developed a prevention plan to reduce the risk from ${disaster.risk_percentage}% to a safer level. Please review the attached prevention report for details.

This is an automated notification from ResQ Earth PREVENT system.`
      setMessage(autoMessage)
    }
  }, [disaster, selectedAuthority])

  const handleSend = async () => {
    if (!selectedAuthority || !message.trim()) return

    setIsSending(true)
    try {
      if (onSend) {
        await onSend(selectedAuthority, message)
      } else {
        // Placeholder - in production, this would send via Twilio or email API
        console.log('Sending message:', { authority: selectedAuthority, message })
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      }
      alert('Message sent successfully!')
      onOpenChange(false)
      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  if (!disaster) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Contact Emergency Authorities</DialogTitle>
          <DialogDescription>
            Select an authority and send them the prevention plan for{' '}
            {disaster.location.name || 'this location'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Authorities List */}
          <div className="w-1/3 border-r pr-4">
            <h3 className="text-sm font-semibold mb-2">Nearest Authorities</h3>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {authorities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No authorities found nearby</p>
                ) : (
                  authorities.map((authority) => (
                    <Card
                      key={authority.id}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-md',
                        selectedAuthority?.id === authority.id && 'border-primary shadow-md'
                      )}
                      onClick={() => setSelectedAuthority(authority)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm">{authority.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {getAuthorityTypeLabel(authority.type)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-1 text-xs text-muted-foreground">
                        {authority.distance !== undefined && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{authority.distance.toFixed(1)} km away</span>
                          </div>
                        )}
                        {authority.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{authority.phone}</span>
                          </div>
                        )}
                        {authority.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{authority.email}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Message Form */}
          <div className="flex-1 flex flex-col">
            {selectedAuthority ? (
              <>
                <div className="space-y-4 mb-4">
                  <div>
                    <Label htmlFor="authority">Selected Authority</Label>
                    <div className="mt-1 p-2 bg-muted rounded-md">
                      <p className="text-sm font-medium">{selectedAuthority.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getAuthorityTypeLabel(selectedAuthority.type)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter your message..."
                      className="mt-1 min-h-[200px]"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Select an authority to send a message</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedAuthority || !message.trim() || isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

