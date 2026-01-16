import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createLearningResource,
  getUserLearningResources,
} from '@/lib/learning/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const options: any = {}
    if (status) options.status = status
    if (type) options.type = type

    const resources = await getUserLearningResources(
      session.user.id,
      Object.keys(options).length > 0 ? options : undefined
    )

    return NextResponse.json(resources)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, type, provider, url, skillId, cost, notes } = body

    if (!title || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const resource = await createLearningResource({
      userId: session.user.id,
      title,
      type,
      provider,
      url,
      skillId,
      cost,
      notes,
    })

    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
  }
}
