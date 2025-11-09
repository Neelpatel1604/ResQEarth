'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, BookOpen, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getMoorchehAnswer } from '@/lib/api/moorcheh'

export default function KnowledgeBasePage() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) {
      setError('Please enter a question')
      return
    }

    setLoading(true)
    setError(null)
    setAnswer(null)

    try {
      const response = await getMoorchehAnswer({
        query: query.trim(),
        top_k: 3,
        temperature: 0.7,
      })

      if (response.error) {
        setError(response.error)
      } else if (response.answer) {
        setAnswer(response.answer)
      } else {
        setError('No answer received from the AI')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="pb-8">
      <div className="container mx-auto px-4 max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Knowledge Base</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Get expert guidance on disaster evacuation and emergency preparedness
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Ask a Question</CardTitle>
              <CardDescription>
                Ask about evacuation procedures, safety protocols, or emergency preparedness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g., How do I evacuate during an earthquake?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading || !query.trim()}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Ask
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Answer Display */}
          {answer && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <CardTitle>Answer</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                  {answer.split('\n').map((line, index) => {
                    // Check if line is a heading (starts with # or **)
                    if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                      return (
                        <h3 key={index} className="font-bold text-lg mt-4 mb-2">
                          {line.replace(/\*\*/g, '')}
                        </h3>
                      )
                    }
                    // Check if line starts with a number (ordered list)
                    if (/^\d+\.\s/.test(line.trim())) {
                      return (
                        <p key={index} className="ml-4 mb-2">
                          {line}
                        </p>
                      )
                    }
                    // Check if line starts with - or * (unordered list)
                    if (/^[-*]\s/.test(line.trim())) {
                      return (
                        <p key={index} className="ml-4 mb-2">
                          {line}
                        </p>
                      )
                    }
                    // Regular paragraph
                    if (line.trim()) {
                      return (
                        <p key={index} className="mb-2">
                          {line}
                        </p>
                      )
                    }
                    // Empty line
                    return <br key={index} />
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Section */}
          <Card className="mt-6 bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-2">
                  <p className="font-semibold">Important Notice</p>
                  <p className="text-sm text-muted-foreground">
                    This knowledge base provides general guidance based on disaster response documentation. 
                    Always follow instructions from local emergency services and authorities. 
                    In case of immediate danger, call emergency services (911 or your local emergency number) immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}

