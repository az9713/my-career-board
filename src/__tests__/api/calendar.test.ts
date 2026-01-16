/**
 * @jest-environment node
 */

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock calendar service
jest.mock('@/lib/calendar/service', () => ({
  createCalendarEvent: jest.fn(),
  getUpcomingEvents: jest.fn(),
  deleteCalendarEvent: jest.fn(),
  generateICSFile: jest.fn(),
  syncWithExternalCalendar: jest.fn(),
  getCalendarSyncStatus: jest.fn(),
  CalendarEventType: {
    QUARTERLY_REVIEW: 'quarterly_review',
    WEEKLY_CHECKIN: 'weekly_checkin',
    BET_DEADLINE: 'bet_deadline',
    CUSTOM: 'custom',
  },
}))

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import {
  createCalendarEvent,
  getUpcomingEvents,
  deleteCalendarEvent,
  generateICSFile,
  syncWithExternalCalendar,
  getCalendarSyncStatus,
} from '@/lib/calendar/service'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockCreateEvent = createCalendarEvent as jest.MockedFunction<typeof createCalendarEvent>
const mockGetEvents = getUpcomingEvents as jest.MockedFunction<typeof getUpcomingEvents>
const mockDeleteEvent = deleteCalendarEvent as jest.MockedFunction<typeof deleteCalendarEvent>
const mockGenerateICS = generateICSFile as jest.MockedFunction<typeof generateICSFile>
const mockSync = syncWithExternalCalendar as jest.MockedFunction<typeof syncWithExternalCalendar>
const mockGetStatus = getCalendarSyncStatus as jest.MockedFunction<typeof getCalendarSyncStatus>

// Import route handlers
import { GET, POST, DELETE } from '@/app/api/calendar/events/route'
import { GET as ExportGET } from '@/app/api/calendar/export/route'
import { POST as SyncPOST, GET as SyncGET } from '@/app/api/calendar/sync/route'

describe('Calendar Events API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any)
  })

  describe('GET /api/calendar/events', () => {
    it('should return upcoming events', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Q1 Review',
          startTime: new Date('2025-04-01T10:00:00Z'),
          endTime: new Date('2025-04-01T11:00:00Z'),
          type: 'quarterly_review',
        },
      ]

      mockGetEvents.mockResolvedValue(mockEvents as any)

      const request = new NextRequest('http://localhost/api/calendar/events')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toHaveLength(1)
      expect(data.events[0].title).toBe('Q1 Review')
    })

    it('should filter by date range', async () => {
      mockGetEvents.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost/api/calendar/events?startDate=2025-01-01&endDate=2025-03-31'
      )
      await GET(request)

      expect(mockGetEvents).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      )
    })

    it('should filter by event type', async () => {
      mockGetEvents.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost/api/calendar/events?type=quarterly_review'
      )
      await GET(request)

      expect(mockGetEvents).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          type: 'quarterly_review',
        })
      )
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/calendar/events')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/calendar/events', () => {
    it('should create a new calendar event', async () => {
      const eventData = {
        title: 'Q1 Board Meeting',
        type: 'quarterly_review',
        startTime: '2025-04-01T10:00:00Z',
        endTime: '2025-04-01T11:00:00Z',
        description: 'Quarterly review',
      }

      mockCreateEvent.mockResolvedValue({
        id: 'new-event',
        userId: 'user-123',
        ...eventData,
        startTime: new Date(eventData.startTime),
        endTime: new Date(eventData.endTime),
      } as any)

      const request = new NextRequest('http://localhost/api/calendar/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.event.id).toBe('new-event')
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost/api/calendar/events', {
        method: 'POST',
        body: JSON.stringify({ title: 'Missing fields' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/calendar/events', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  describe('DELETE /api/calendar/events', () => {
    it('should delete an event', async () => {
      mockDeleteEvent.mockResolvedValue({ success: true })

      const request = new NextRequest(
        'http://localhost/api/calendar/events?eventId=event-123'
      )

      const response = await DELETE(request)

      expect(response.status).toBe(200)
      expect(mockDeleteEvent).toHaveBeenCalledWith('user-123', 'event-123')
    })

    it('should return 400 when eventId is missing', async () => {
      const request = new NextRequest('http://localhost/api/calendar/events')

      const response = await DELETE(request)

      expect(response.status).toBe(400)
    })

    it('should return 404 when event not found', async () => {
      mockDeleteEvent.mockResolvedValue({
        success: false,
        error: 'Event not found or unauthorized',
      })

      const request = new NextRequest(
        'http://localhost/api/calendar/events?eventId=non-existent'
      )

      const response = await DELETE(request)

      expect(response.status).toBe(404)
    })
  })
})

describe('Calendar Export API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any)
  })

  describe('GET /api/calendar/export', () => {
    it('should export events as ICS file', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Board Meeting',
          startTime: new Date('2025-04-01T10:00:00Z'),
          endTime: new Date('2025-04-01T11:00:00Z'),
        },
      ]

      mockGetEvents.mockResolvedValue(mockEvents as any)
      mockGenerateICS.mockReturnValue('BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR')

      const request = new NextRequest('http://localhost/api/calendar/export')
      const response = await ExportGET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/calendar')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
    })

    it('should include filename in Content-Disposition', async () => {
      mockGetEvents.mockResolvedValue([])
      mockGenerateICS.mockReturnValue('BEGIN:VCALENDAR\nEND:VCALENDAR')

      const request = new NextRequest('http://localhost/api/calendar/export')
      const response = await ExportGET(request)

      expect(response.headers.get('Content-Disposition')).toContain('my-career-board')
      expect(response.headers.get('Content-Disposition')).toContain('.ics')
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/calendar/export')
      const response = await ExportGET(request)

      expect(response.status).toBe(401)
    })
  })
})

describe('Calendar Sync API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any)
  })

  describe('GET /api/calendar/sync', () => {
    it('should return sync status', async () => {
      mockGetStatus.mockResolvedValue({
        connected: true,
        provider: 'google',
        lastSync: new Date('2025-01-15T10:00:00Z'),
      })

      const request = new NextRequest('http://localhost/api/calendar/sync')
      const response = await SyncGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.connected).toBe(true)
      expect(data.provider).toBe('google')
    })

    it('should return disconnected status when not synced', async () => {
      mockGetStatus.mockResolvedValue({
        connected: false,
        provider: null,
      })

      const request = new NextRequest('http://localhost/api/calendar/sync')
      const response = await SyncGET(request)
      const data = await response.json()

      expect(data.connected).toBe(false)
    })
  })

  describe('POST /api/calendar/sync', () => {
    it('should trigger calendar sync', async () => {
      mockSync.mockResolvedValue({
        success: true,
        syncedCount: 5,
      })

      const request = new NextRequest('http://localhost/api/calendar/sync', {
        method: 'POST',
        body: JSON.stringify({ provider: 'google' }),
      })

      const response = await SyncPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.syncedCount).toBe(5)
    })

    it('should return error when sync fails', async () => {
      mockSync.mockResolvedValue({
        success: false,
        error: 'Calendar not connected',
      })

      const request = new NextRequest('http://localhost/api/calendar/sync', {
        method: 'POST',
        body: JSON.stringify({ provider: 'google' }),
      })

      const response = await SyncPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('not connected')
    })

    it('should require provider parameter', async () => {
      const request = new NextRequest('http://localhost/api/calendar/sync', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await SyncPOST(request)

      expect(response.status).toBe(400)
    })
  })
})
