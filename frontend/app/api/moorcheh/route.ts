import { NextRequest, NextResponse } from 'next/server'

const MOORCHEH_API_URL = 'https://api.moorcheh.ai/v1/answer'
const MOORCHEH_API_KEY = process.env.NEXT_PUBLIC_MOORCHEH_API_KEY

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!MOORCHEH_API_KEY) {
      return NextResponse.json(
        { error: 'Moorcheh API key is not configured. Please set NEXT_PUBLIC_MOORCHEH_API_KEY in your environment variables.' },
        { status: 500 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { query, top_k = 3, temperature = 0.7 } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    // Prepare the request to Moorcheh API
    const moorchehPayload = {
      namespace: 'ResQEarth',
      query: query,
      type: 'text',
      top_k: top_k,
      aiModel: 'anthropic.claude-sonnet-4-20250514-v1:0',
      temperature: temperature,
      headerPrompt: `You are a specialized disaster evacuation and emergency response assistant for ResQEarth. Your primary goal is to provide clear, actionable, and life-saving guidance to help people safely evacuate from natural disasters and emergency situations. 

You have access to comprehensive disaster response documentation, evacuation procedures, safety protocols, and emergency preparedness information. Your responses should be:

1. **Safety-First**: Prioritize immediate safety and life preservation above all else
2. **Clear and Actionable**: Provide step-by-step instructions that are easy to follow during high-stress situations
3. **Specific to Disaster Type**: Tailor your guidance based on the type of disaster (earthquake, flood, wildfire, hurricane, tsunami, etc.)
4. **Time-Sensitive**: Consider urgency and provide immediate actions first, followed by secondary steps
5. **Location-Aware**: When possible, consider geographic and environmental factors
6. **Accessible**: Use simple language that can be understood quickly, even under stress

Always emphasize:
- Immediate evacuation routes and safe zones
- Essential items to take (if time permits)
- What NOT to do during the disaster
- How to stay informed and connected
- Post-evacuation safety measures`,
      footerPrompt: `Provide your response in a clear, structured format:

1. **Immediate Actions** (What to do RIGHT NOW)
2. **Evacuation Steps** (Step-by-step evacuation process)
3. **Safety Checklist** (Essential items and precautions)
4. **Important Warnings** (What to avoid)
5. **Stay Informed** (How to get updates and help)

Format your response with clear headings and bullet points for easy scanning. If the situation is critical, emphasize the most urgent actions first. Always remind users to follow local emergency services instructions and evacuate immediately if ordered to do so.`
    }

    // Make request to Moorcheh API
    const response = await fetch(MOORCHEH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MOORCHEH_API_KEY,
      },
      body: JSON.stringify(moorchehPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Moorcheh API error:', errorText)
      return NextResponse.json(
        { error: `Moorcheh API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error calling Moorcheh API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    )
  }
}

