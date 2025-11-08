'use client'

import { createContext, useEffect, useState, type ReactNode } from 'react'
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

  // Check if environment variables are available
  const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let supabase: ReturnType<typeof createClient> | null = null
  try {
    if (hasEnvVars) {
      supabase = createClient()
    }
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
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

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not available')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string): Promise<SignUpResult> => {
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
