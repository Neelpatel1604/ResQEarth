'use client'

import { useAuth } from "@/hooks/useAuth"
import { AuthForm } from "@/components/auth/auth-form"
import { UserMenu } from "@/components/auth/user-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Satellite, AlertTriangle, Users, MapPin } from "lucide-react"
import { MapView } from "@/components/map/map-view"

export default function Home() {
  const { user, loading } = useAuth()

  // Check if Supabase is configured
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!hasSupabase) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <Satellite className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>ResQ Earth</CardTitle>
            <CardDescription>
              Space-themed disaster response platform
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-destructive text-sm">
              ⚠️ Supabase configuration required
            </div>
            <p className="text-sm text-muted-foreground">
              Please add your Supabase URL and API key to the .env.local file to enable authentication.
            </p>
            <div className="text-xs bg-muted p-3 rounded text-left font-mono">
              NEXT_PUBLIC_SUPABASE_URL=your_url_here<br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                ResQ Earth
              </h1>
              <p className="text-xl text-muted-foreground">
                Advanced space-based disaster response platform
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <Satellite className="h-8 w-8 text-primary" />
                  <CardTitle className="text-sm">Real-time Monitoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Satellite imagery and AI-powered disaster detection
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <CardTitle className="text-sm">Early Warning</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Predictive analytics for disaster prevention
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <Users className="h-8 w-8 text-primary" />
                  <CardTitle className="text-sm">Response Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Coordinated emergency response coordination
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <MapPin className="h-8 w-8 text-primary" />
                  <CardTitle className="text-sm">Global Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Worldwide disaster monitoring and response
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Auth Form */}
          <div className="flex justify-center">
            <AuthForm />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation Header */}
      <header className="border-b z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Satellite className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">ResQ Earth</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Map View */}
      <main className="flex-1 relative">
        <MapView
          onSaveSolution={async (disaster, actions) => {
            try {
              const { saveSolution, createSolutionFromData } = await import('@/lib/supabase/solutions')
              const solutionData = createSolutionFromData(disaster, actions)
              await saveSolution(solutionData)
              alert('Solution saved successfully!')
            } catch (error) {
              console.error('Error saving solution:', error)
              alert('Failed to save solution. Please try again.')
            }
          }}
          onContactAuthority={(disaster) => {
            // Open contact authority modal or redirect
            const contactInfo = `Contact emergency authorities for ${disaster.location.name || 'this location'}`
            alert(contactInfo)
            // TODO: Implement proper contact authority flow
          }}
        />
      </main>
    </div>
  )
}
