import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  generateQuarterlyReportData,
  formatReportAsMarkdown,
  formatReportAsJSON,
  ExportFormat,
} from '@/lib/export/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const quarter = searchParams.get('quarter')
    const format = (searchParams.get('format') || 'markdown') as ExportFormat
    const download = searchParams.get('download') === 'true'

    if (!quarter) {
      return NextResponse.json(
        { error: 'Quarter parameter is required' },
        { status: 400 }
      )
    }

    const data = await generateQuarterlyReportData(session.user.id, quarter)

    let content: string
    let contentType: string
    let extension: string

    if (format === 'json') {
      content = formatReportAsJSON(data)
      contentType = 'application/json'
      extension = 'json'
    } else {
      content = formatReportAsMarkdown(data)
      contentType = 'text/markdown'
      extension = 'md'
    }

    const headers: Record<string, string> = {
      'Content-Type': contentType,
    }

    if (download) {
      headers['Content-Disposition'] = `attachment; filename="quarterly-report-${quarter}.${extension}"`
    }

    return new NextResponse(content, { headers })
  } catch (error) {
    console.error('Error exporting quarterly report:', error)
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    )
  }
}
