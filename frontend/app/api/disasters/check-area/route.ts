import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    
    // Validate required parameters
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude (lat) and longitude (lng) are required' },
        { status: 400 }
      )
    }
    
    // Build the backend URL
    const backendUrl = `${BACKEND_URL}/api/disasters/check-area?${queryString}`
    
    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data from backend
    })

    if (!response.ok) {
      // Try to get error details from backend
      const errorData = await response.json().catch(() => ({
        detail: `Backend error: ${response.status}`,
      }))
      
      return NextResponse.json(
        { error: errorData.detail || 'Failed to check area' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Ensure the response has the correct structure
    if (!data.disasters) {
      return NextResponse.json({
        disasters: [],
        total: 0,
        timestamp: data.timestamp || new Date().toISOString(),
      })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying request to backend:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 500 }
    )
  }
}

