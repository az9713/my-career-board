import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'
import {
  parseResumeText,
  extractSkills,
  summarizeContext,
  ContextType,
} from '@/lib/context/service'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/json',
]
const ALLOWED_EXTENSIONS = ['.txt', '.pdf', '.doc', '.docx', '.json', '.md']

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as ContextType) || 'document'
    const name = formData.get('name') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(fileExtension) && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: txt, pdf, doc, docx, json, md' },
        { status: 400 }
      )
    }

    // Read file content
    const content = await file.text()

    // Parse content
    let parsedData: Record<string, unknown> = {}

    if (type === 'resume' || file.name.toLowerCase().includes('resume') || file.name.toLowerCase().includes('cv')) {
      parsedData = parseResumeText(content)
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
        name: name || file.name,
        rawText: content,
        parsedData: JSON.stringify(parsedData),
        summary,
        metadata: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({ context }, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
