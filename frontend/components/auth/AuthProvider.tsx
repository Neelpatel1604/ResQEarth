'use client'

import { createContext, useEffect, useState, useRef, type ReactNode } from 'react'
import { type User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export type SignUpResult = {
  success: boolean
  needsEmailConfirmation: boolean
  message?: string
}

export type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  // Check if environment variables are available
  const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  useEffect(() => {
    // Create Supabase client inside useEffect to avoid dependency issues
    if (!hasEnvVars) {
      setLoading(false)
      return
    }

    let supabase: ReturnType<typeof createClient> | null = null

    try {
      supabase = createClient()
      supabaseRef.current = supabase
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      setLoading(false)
      return
    }

    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Failed to get session:', error)
        } else {
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Failed to get session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [hasEnvVars])

  const signIn = async (email: string, password: string) => {
    const supabase = supabaseRef.current
    if (!supabase) throw new Error('Supabase client not available')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string): Promise<SignUpResult> => {
    const supabase = supabaseRef.current
    if (!supabase) throw new Error('Supabase client not available')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      return {
        success: false,
        needsEmailConfirmation: false,
        message: error.message,
      }
    }

    // Check if email confirmation is required
    const needsEmailConfirmation = Boolean(data.user && !data.session)

    return {
      success: true,
      needsEmailConfirmation,
      message: needsEmailConfirmation
        ? 'Please check your email to confirm your account before signing in.'
        : 'Account created successfully!',
    }
  }

  const signOut = async () => {
    const supabase = supabaseRef.current
    if (!supabase) throw new Error('Supabase client not available')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
