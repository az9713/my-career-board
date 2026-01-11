import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'
import {
  parseResumeText,
  parseLinkedInProfile,
  extractSkills,
  summarizeContext,
  ContextType,
} from '@/lib/context/service'

const VALID_TYPES: ContextType[] = ['resume', 'linkedin', 'document', 'notes']

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ContextType | null

    const contexts = await prisma.userContext.findMany({
      where: {
        userId: session.user.id,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        name: true,
        summary: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ contexts })
  } catch (error) {
    console.error('Error fetching contexts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contexts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, name, content } = body

    // Validate required fields
    if (!content || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: type and content are required' },
        { status: 400 }
      )
    }

    // Validate context type
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid context type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Parse content based on type
    let parsedData: Record<string, unknown> = {}

    if (type === 'resume') {
      parsedData = parseResumeText(content)
    } else if (type === 'linkedin') {
      try {
        const jsonData = JSON.parse(content)
        parsedData = parseLinkedInProfile(jsonData)
      } catch {
        parsedData = { rawContent: content }
      }
    } else {
      parsedData = { skills: extractSkills(content) }
    }

    // Generate summary
    const summary = await summarizeContext({
      type,
      rawText: content,
      parsedData,
    })

    const context = await prisma.userContext.create({
      data: {
        userId: session.user.id,
        type,
        name: name || `${type} - ${new Date().toLocaleDateString()}`,
        rawText: content,
        parsedData: JSON.stringify(parsedData),
        summary,
      },
    })

    return NextResponse.json({ context }, { status: 201 })
  } catch (error) {
    console.error('Error creating context:', error)
    return NextResponse.json(
      { error: 'Failed to create context' },
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Context ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const context = await prisma.userContext.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 })
    }

    await prisma.userContext.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting context:', error)
    return NextResponse.json(
      { error: 'Failed to delete context' },
      { status: 500 }
    )
  }
}
