/**
 * Client-side API functions for Moorcheh AI integration
 */

// Use relative URL for Next.js API routes
const API_BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3000'

export interface MoorchehAnswerRequest {
  query: string
  top_k?: number
  temperature?: number
}

export interface MoorchehAnswerResponse {
  answer?: string
  sources?: Array<{
    id: string
    text: string
    score?: number
  }>
  error?: string
}

/**
 * Get an AI-generated answer from Moorcheh based on disaster evacuation queries
 */
export async function getMoorchehAnswer(
  request: MoorchehAnswerRequest
): Promise<MoorchehAnswerResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/moorcheh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP error! status: ${response.status}`,
      }))
      throw new Error(errorData.error || `Request failed with status ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        'Cannot connect to the API. Please ensure the server is running and try again.'
      )
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching the answer')
  }
}

