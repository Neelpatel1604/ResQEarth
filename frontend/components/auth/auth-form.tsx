'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Mail, AlertCircle } from 'lucide-react'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validate password confirmation for signup
    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long')
        setLoading(false)
        return
      }
    }

    try {
      if (isSignUp) {
        const result = await signUp(email, password)
        if (result.success) {
          setSuccess(result.message || 'Account created successfully!')
          if (result.needsEmailConfirmation) {
            // Clear form after successful signup
            setEmail('')
            setPassword('')
            setConfirmPassword('')
          }
        } else {
          setError(result.message || 'Failed to create account')
        }
      } else {
        await signIn(email, password)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchMode = () => {
    setIsSignUp(!isSignUp)
    setError(null)
    setSuccess(null)
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </CardTitle>
        <CardDescription className="text-center">
          {isSignUp
            ? 'Enter your details to create your account'
            : 'Enter your credentials to access your account'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || !!success}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || !!success}
              minLength={6}
            />
          </div>
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || !!success}
                minLength={6}
              />
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex flex-col gap-2 p-4 rounded-md bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 text-sm text-primary">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">Success!</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">{success}</p>
              {success.includes('email') && (
                <div className="flex items-center gap-2 mt-2 p-2 rounded bg-background/50 border border-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Check your inbox for the confirmation email
                  </span>
                </div>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading || !!success}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={handleSwitchMode}
            className="text-primary hover:underline"
            disabled={loading || !!success}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"
            }
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
