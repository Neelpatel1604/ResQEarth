import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    
    // Build the backend URL
    const backendUrl = `${BACKEND_URL}/api/disasters${queryString ? `?${queryString}` : ''}`
    
    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data from backend
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        detail: `Backend error: ${response.status}`,
      }))
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch disasters' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying request to backend:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 500 }
    )
  }
}

