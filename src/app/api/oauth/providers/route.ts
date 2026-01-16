import { NextRequest, NextResponse } from 'next/server'
import { getOAuthProviders } from '@/lib/oauth/service'

export async function GET(request: NextRequest) {
  try {
    const providers = getOAuthProviders()

    return NextResponse.json({ providers })
  } catch (error) {
    console.error('Error fetching OAuth providers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    )
  }
}
