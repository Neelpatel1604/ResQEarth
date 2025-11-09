'use client'

import { useState } from 'react'
import { useAuth } from "@/hooks/useAuth"
import { AuthForm } from "@/components/auth/auth-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Satellite } from "lucide-react"
import { MapView } from "@/components/map/map-view"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

export default function Home() {
  const { user, loading } = useAuth()
  const [showAllDisasters, setShowAllDisasters] = useState(false)

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
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-16">
        {/* Map View */}
        <div className="flex-1 relative">
          <MapView
            onToggleChange={setShowAllDisasters}
            onSaveSolution={async (disaster, actions) => {
              try {
                const { saveSolution, createSolutionFromData } = await import('@/lib/supabase/solutions')
                const solutionData = createSolutionFromData(disaster, actions)
                const saved = await saveSolution({ ...solutionData, user_id: user.id })
                if (saved) {
                  alert('Solution saved successfully!')
                } else {
                  // Table might not exist - show helpful message
                  alert('Solution saved locally. Note: Supabase table may need to be created.')
                }
              } catch (error) {
                console.error('Error saving solution:', error)
                alert('Failed to save solution. Please check your Supabase configuration.')
              }
            }}
            onContactAuthority={(disaster) => {
              // Open contact authority modal or redirect
              const contactInfo = `Contact emergency authorities for ${disaster.location.name || 'this location'}`
              alert(contactInfo)
              // TODO: Implement proper contact authority flow
            }}
            />
        </div>
      </main>
      <Footer />
    </div>
  )
}
