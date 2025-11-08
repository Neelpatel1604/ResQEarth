'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api/client'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface HealthStatus {
  status: string
  timestamp: string
  service: string
}

export function BackendConnection() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiUrl, setApiUrl] = useState<string>('')

  useEffect(() => {
    // Get API URL from environment
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    setApiUrl(url)
  }, [])

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    setHealth(null)

    try {
      const data = await api.get<HealthStatus>('/api/health')
      setHealth(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  // Auto-test on mount
  useEffect(() => {
    testConnection()
  }, [])

  const isConnected = health?.status === 'healthy'

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Backend Connection
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {!loading && isConnected && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {!loading && !isConnected && error && <XCircle className="h-4 w-4 text-red-500" />}
        </CardTitle>
        <CardDescription>
          Test connection to FastAPI backend server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <div className="font-mono text-xs bg-muted p-2 rounded mb-2">
            API URL: {apiUrl || 'Not configured'}
          </div>
        </div>

        {health && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <span className={`text-sm font-mono ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {health.status}
              </span>
            </div>
            {health.timestamp && (
              <div className="text-xs text-muted-foreground">
                Last checked: {new Date(health.timestamp).toLocaleString()}
              </div>
            )}
            {health.service && (
              <div className="text-xs text-muted-foreground">
                Service: {health.service}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
            <div className="font-medium mb-1">Connection Error:</div>
            <div className="font-mono text-xs">{error}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Make sure the backend is running on {apiUrl}
            </div>
          </div>
        )}

        <Button 
          onClick={testConnection} 
          disabled={loading}
          variant={isConnected ? "outline" : "default"}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </Button>

        {!apiUrl && (
          <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
            <div className="font-medium mb-1">⚠️ Configuration Required:</div>
            <div className="font-mono">
              Add NEXT_PUBLIC_API_URL to your .env.local file
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

