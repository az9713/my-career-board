/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET as getQuarterlyReport } from '@/app/api/export/quarterly/route'
import { GET as getBetHistory } from '@/app/api/export/bets/route'
import { GET as getSessionTranscript } from '@/app/api/export/session/[sessionId]/route'

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    boardSession: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    sessionMessage: {
      findMany: jest.fn(),
    },
    bet: {
      findMany: jest.fn(),
    },
    quarterlyReport: {
      findMany: jest.fn(),
    },
  },
}))

// Mock export service
jest.mock('@/lib/export/service', () => ({
  generateQuarterlyReportData: jest.fn().mockResolvedValue({
    quarter: 'Q1-2025',
    reports: [],
    bets: [],
    stats: { totalBets: 0, hits: 0, misses: 0, accuracy: 0 },
  }),
  generateBetHistoryData: jest.fn().mockResolvedValue({
    bets: [],
    byQuarter: {},
    summary: { total: 0, resolved: 0, pending: 0, accuracy: 0 },
  }),
  generateSessionTranscript: jest.fn().mockResolvedValue({
    session: { id: 'session-1', startedAt: new Date() },
    messages: [],
    duration: 60,
  }),
  formatReportAsMarkdown: jest.fn().mockReturnValue('# Report'),
  formatTranscriptAsMarkdown: jest.fn().mockReturnValue('# Transcript'),
  formatReportAsCSV: jest.fn().mockReturnValue('header\ndata'),
  formatReportAsJSON: jest.fn().mockReturnValue('{}'),
}))

describe('Export API', () => {
  const mockSession = {
    user: { id: 'user-123', email: 'test@example.com' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const { auth } = require('@/auth')
    auth.mockResolvedValue(mockSession)
  })

  describe('GET /api/export/quarterly', () => {
    it('should return quarterly report as markdown by default', async () => {
      const request = new NextRequest(
        'http://localhost/api/export/quarterly?quarter=Q1-2025'
      )

      const response = await getQuarterlyReport(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('text/markdown')
    })

    it('should return quarterly report as JSON when format=json', async () => {
      const request = new NextRequest(
        'http://localhost/api/export/quarterly?quarter=Q1-2025&format=json'
      )

      const response = await getQuarterlyReport(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('application/json')
    })

    it('should require quarter parameter', async () => {
      const request = new NextRequest('http://localhost/api/export/quarterly')

      const response = await getQuarterlyReport(request)

      expect(response.status).toBe(400)
    })

    it('should return 401 if not authenticated', async () => {
      const { auth } = require('@/auth')
      auth.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost/api/export/quarterly?quarter=Q1-2025'
      )

      const response = await getQuarterlyReport(request)

      expect(response.status).toBe(401)
    })

    it('should set Content-Disposition header for download', async () => {
      const request = new NextRequest(
        'http://localhost/api/export/quarterly?quarter=Q1-2025&download=true'
      )

      const response = await getQuarterlyReport(request)

      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('Q1-2025')
    })
  })

  describe('GET /api/export/bets', () => {
    it('should return bet history as CSV by default', async () => {
      const request = new NextRequest('http://localhost/api/export/bets')

      const response = await getBetHistory(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('text/csv')
    })

    it('should return bet history as JSON when format=json', async () => {
      const request = new NextRequest(
        'http://localhost/api/export/bets?format=json'
      )

      const response = await getBetHistory(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('application/json')
    })

    it('should filter by quarter if provided', async () => {
      const { generateBetHistoryData } = require('@/lib/export/service')

      const request = new NextRequest(
        'http://localhost/api/export/bets?quarter=Q1-2025'
      )

      await getBetHistory(request)

      expect(generateBetHistoryData).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ quarter: 'Q1-2025' })
      )
    })

    it('should filter by status if provided', async () => {
      const { generateBetHistoryData } = require('@/lib/export/service')

      const request = new NextRequest(
        'http://localhost/api/export/bets?status=resolved'
      )

      await getBetHistory(request)

      expect(generateBetHistoryData).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ status: 'resolved' })
      )
    })

    it('should return 401 if not authenticated', async () => {
      const { auth } = require('@/auth')
      auth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/export/bets')

      const response = await getBetHistory(request)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/export/session/[sessionId]', () => {
    it('should return session transcript as markdown', async () => {
      const request = new NextRequest(
        'http://localhost/api/export/session/session-123'
      )

      const response = await getSessionTranscript(request, {
        params: Promise.resolve({ sessionId: 'session-123' }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('text/markdown')
    })

    it('should return session transcript as JSON when format=json', async () => {
      const request = new NextRequest(
        'http://localhost/api/export/session/session-123?format=json'
      )

      const response = await getSessionTranscript(request, {
        params: Promise.resolve({ sessionId: 'session-123' }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('application/json')
    })

    it('should return 404 for non-existent session', async () => {
      const { generateSessionTranscript } = require('@/lib/export/service')
      generateSessionTranscript.mockResolvedValueOnce(null)

      const request = new NextRequest(
        'http://localhost/api/export/session/invalid'
      )

      const response = await getSessionTranscript(request, {
        params: Promise.resolve({ sessionId: 'invalid' }),
      })

      expect(response.status).toBe(404)
    })

    it('should return 401 if not authenticated', async () => {
      const { auth } = require('@/auth')
      auth.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost/api/export/session/session-123'
      )

      const response = await getSessionTranscript(request, {
        params: Promise.resolve({ sessionId: 'session-123' }),
      })

      expect(response.status).toBe(401)
    })
  })
})
