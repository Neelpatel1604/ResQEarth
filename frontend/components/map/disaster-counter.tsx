'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { apiClient } from '@/lib/api/client'

interface DisasterCounterProps {
  className?: string
}

export function DisasterCounter({ className }: DisasterCounterProps) {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const backendAvailableRef = useRef(false)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await apiClient.get<{ total: number; timestamp: string }>(
          '/disasters/count/total'
        )
        setCount(response.total)
        backendAvailableRef.current = true
      } catch (error) {
        // Silently fallback to dummy count if API fails (backend not running or network error)
        // Only log if it's not a network error (which is expected in prototype mode)
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // Network error - backend probably not running, use fallback
          setCount(5842)
          backendAvailableRef.current = false
        } else {
          // Other errors - log but still use fallback
          console.warn('Error fetching disaster count, using fallback:', error)
          setCount(5842)
          backendAvailableRef.current = false
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCount()

    // Poll every 30 seconds for updates (only if backend is available)
    const interval = setInterval(() => {
      if (backendAvailableRef.current) {
        fetchCount()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Badge variant="outline" className={className}>
        <AlertTriangle className="h-3 w-3 mr-1" />
        Loading...
      </Badge>
    )
  }

  return (
    <Badge variant="destructive" className={className}>
      <AlertTriangle className="h-3 w-3 mr-1" />
      {count?.toLocaleString() || '0'} preventable disasters right now
    </Badge>
  )
}

