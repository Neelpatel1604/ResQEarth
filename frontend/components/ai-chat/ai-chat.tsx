'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { sendChatMessage, ChatMessage } from '@/lib/api/chat'
import { DisasterThreat } from '@/lib/map/data'
import { cn } from '@/lib/utils'

interface AIChatProps {
  disaster?: DisasterThreat | null
  preventionPlanId?: string
  onClose?: () => void
  className?: string
  embedded?: boolean
}

export function AIChat({ disaster, preventionPlanId, onClose, className, embedded = false }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: disaster
        ? `Hello! I'm your AI assistant for disaster prevention. I can help you understand the ${disaster.type} risk at ${disaster.location.name}, analyze prevention strategies, and answer questions about satellite data. What would you like to know?`
        : "Hello! I'm your AI assistant for disaster prevention. I can help you understand disaster risks, prevention strategies, and answer questions. What would you like to know?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    }

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Send to API
      const response = await sendChatMessage({
        query: userMessage.content,
        threat_id: disaster?.id,
        prevention_plan_id: preventionPlanId,
        chat_history: messages,
      })

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.response,
        },
      ])
    } catch (error) {
      console.error('Error sending chat message:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred'
      
      // Check if it's a connection error
      const isConnectionError = errorMessage.includes('Cannot connect to backend') || 
                                 errorMessage.includes('Failed to fetch')
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isConnectionError
            ? `⚠️ Connection Error: ${errorMessage}\n\nPlease ensure:\n1. The backend server is running (http://localhost:8000)\n2. CORS is properly configured\n3. The API URL is correct in your .env.local file`
            : `Sorry, I encountered an error: ${errorMessage}\n\nPlease try again or check your connection.`,
        },
      ])
    } finally {
      setIsLoading(false)
      // Focus input after sending
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={cn('flex flex-col h-full', embedded ? '' : 'bg-background border rounded-lg', className)}>
      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-2',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about disaster risks, prevention strategies..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Ask about risks, prevention actions, satellite data, or get recommendations.
        </p>
      </div>
    </div>
  )
}

