import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  generateBetHistoryData,
  formatReportAsCSV,
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
    const format = (searchParams.get('format') || 'csv') as ExportFormat
    const quarter = searchParams.get('quarter') || undefined
    const status = searchParams.get('status') || undefined
    const download = searchParams.get('download') === 'true'

    const data = await generateBetHistoryData(session.user.id, { quarter, status })

    let content: string
    let contentType: string
    let extension: string

    if (format === 'json') {
      content = formatReportAsJSON(data)
      contentType = 'application/json'
      extension = 'json'
    } else {
      content = formatReportAsCSV(
        data.bets.map((b) => ({
          content: b.content,
          quarter: b.quarter,
          outcome: b.outcome,
          deadline: b.deadline,
        }))
      )
      contentType = 'text/csv'
      extension = 'csv'
    }

    const headers: Record<string, string> = {
      'Content-Type': contentType,
    }

    if (download) {
      const filename = quarter
        ? `bet-history-${quarter}.${extension}`
        : `bet-history.${extension}`
      headers['Content-Disposition'] = `attachment; filename="${filename}"`
    }

    return new NextResponse(content, { headers })
  } catch (error) {
    console.error('Error exporting bet history:', error)
    return NextResponse.json(
      { error: 'Failed to export bet history' },
      { status: 500 }
    )
  }
}
