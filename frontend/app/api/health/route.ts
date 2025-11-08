/**
 * Next.js API route to proxy health check from backend.
 * This can be used to test the connection.
 */
import { NextResponse } from 'next/server';
import { api } from '@/lib/api/client';

export async function GET() {
  try {
    const health = await api.get<{ status: string; timestamp: string }>('/api/health');
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Backend connection failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}

