import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  generateSessionTranscript,
  formatTranscriptAsMarkdown,
  formatReportAsJSON,
  ExportFormat,
} from '@/lib/export/service'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'markdown') as ExportFormat
    const download = searchParams.get('download') === 'true'

    const transcript = await generateSessionTranscript(session.user.id, sessionId)

    if (!transcript) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    let content: string
    let contentType: string
    let extension: string

    if (format === 'json') {
      content = formatReportAsJSON(transcript)
      contentType = 'application/json'
      extension = 'json'
    } else {
      content = formatTranscriptAsMarkdown(transcript)
      contentType = 'text/markdown'
      extension = 'md'
    }

    const headers: Record<string, string> = {
      'Content-Type': contentType,
    }

    if (download) {
      const date = transcript.session.startedAt.toISOString().split('T')[0]
      headers['Content-Disposition'] = `attachment; filename="session-${date}.${extension}"`
    }

    return new NextResponse(content, { headers })
  } catch (error) {
    console.error('Error exporting session transcript:', error)
    return NextResponse.json(
      { error: 'Failed to export session' },
      { status: 500 }
    )
  }
}
