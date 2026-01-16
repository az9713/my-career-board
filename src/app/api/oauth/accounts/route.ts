import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getLinkedAccounts, unlinkOAuthAccount, OAuthProvider } from '@/lib/oauth/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await getLinkedAccounts(session.user.id)

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Error fetching linked accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') as OAuthProvider

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider parameter is required' },
        { status: 400 }
      )
    }

    const result = await unlinkOAuthAccount(session.user.id, provider)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unlinking account:', error)
    return NextResponse.json(
      { error: 'Failed to unlink account' },
      { status: 500 }
    )
  }
}
