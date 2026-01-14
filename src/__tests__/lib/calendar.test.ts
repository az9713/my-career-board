// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    calendarEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import {
  createCalendarEvent,
  getUpcomingEvents,
  deleteCalendarEvent,
  generateICSFile,
  parseICSFile,
  CalendarEventType,
  syncWithExternalCalendar,
  getCalendarSyncStatus,
} from '@/lib/calendar/service'
import prisma from '@/lib/prisma/client'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Calendar Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createCalendarEvent', () => {
    it('should create a quarterly review event', async () => {
      const userId = 'user-123'
      const eventData = {
        title: 'Q1 2025 Board Review',
        type: CalendarEventType.QUARTERLY_REVIEW,
        startTime: new Date('2025-04-01T10:00:00Z'),
        endTime: new Date('2025-04-01T11:00:00Z'),
        description: 'Quarterly accountability review with AI board',
      }

      mockPrisma.calendarEvent.create.mockResolvedValue({
        id: 'event-1',
        userId,
        ...eventData,
        reminders: '[]',
        externalId: null,
        externalProvider: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await createCalendarEvent(userId, eventData)

      expect(mockPrisma.calendarEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          title: eventData.title,
          type: eventData.type,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
        }),
      })
      expect(result.id).toBe('event-1')
    })

    it('should create a weekly check-in event', async () => {
      const userId = 'user-123'
      const eventData = {
        title: 'Weekly Check-in',
        type: CalendarEventType.WEEKLY_CHECKIN,
        startTime: new Date('2025-01-20T09:00:00Z'),
        endTime: new Date('2025-01-20T09:30:00Z'),
      }

      mockPrisma.calendarEvent.create.mockResolvedValue({
        id: 'event-2',
        userId,
        ...eventData,
        description: null,
        reminders: '[]',
        externalId: null,
        externalProvider: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await createCalendarEvent(userId, eventData)

      expect(result.type).toBe(CalendarEventType.WEEKLY_CHECKIN)
    })

    it('should include reminders when specified', async () => {
      const userId = 'user-123'
      const eventData = {
        title: 'Board Meeting',
        type: CalendarEventType.QUARTERLY_REVIEW,
        startTime: new Date('2025-04-01T10:00:00Z'),
        endTime: new Date('2025-04-01T11:00:00Z'),
        reminders: [15, 60, 1440], // 15 min, 1 hour, 1 day before
      }

      mockPrisma.calendarEvent.create.mockResolvedValue({
        id: 'event-3',
        userId,
        ...eventData,
        reminders: JSON.stringify(eventData.reminders),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await createCalendarEvent(userId, eventData)

      expect(mockPrisma.calendarEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reminders: JSON.stringify(eventData.reminders),
        }),
      })
    })
  })

  describe('getUpcomingEvents', () => {
    it('should return events in chronological order', async () => {
      const userId = 'user-123'
      const now = new Date()

      mockPrisma.calendarEvent.findMany.mockResolvedValue([
        {
          id: 'event-1',
          title: 'First Event',
          startTime: new Date(now.getTime() + 86400000), // Tomorrow
        },
        {
          id: 'event-2',
          title: 'Second Event',
          startTime: new Date(now.getTime() + 172800000), // Day after
        },
      ] as any)

      const events = await getUpcomingEvents(userId)

      expect(events.length).toBe(2)
      expect(mockPrisma.calendarEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
          }),
          orderBy: {
            startTime: 'asc',
          },
        })
      )
    })

    it('should filter by date range', async () => {
      const userId = 'user-123'
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-03-31')

      mockPrisma.calendarEvent.findMany.mockResolvedValue([])

      await getUpcomingEvents(userId, { startDate, endDate })

      expect(mockPrisma.calendarEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      )
    })

    it('should filter by event type', async () => {
      const userId = 'user-123'

      mockPrisma.calendarEvent.findMany.mockResolvedValue([])

      await getUpcomingEvents(userId, { type: CalendarEventType.QUARTERLY_REVIEW })

      expect(mockPrisma.calendarEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: CalendarEventType.QUARTERLY_REVIEW,
          }),
        })
      )
    })

    it('should limit results when specified', async () => {
      const userId = 'user-123'

      mockPrisma.calendarEvent.findMany.mockResolvedValue([])

      await getUpcomingEvents(userId, { limit: 5 })

      expect(mockPrisma.calendarEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      )
    })
  })

  describe('deleteCalendarEvent', () => {
    it('should delete event by id', async () => {
      const userId = 'user-123'
      const eventId = 'event-1'

      mockPrisma.calendarEvent.findUnique.mockResolvedValue({
        id: eventId,
        userId,
      } as any)
      mockPrisma.calendarEvent.delete.mockResolvedValue({ id: eventId } as any)

      const result = await deleteCalendarEvent(userId, eventId)

      expect(result.success).toBe(true)
      expect(mockPrisma.calendarEvent.delete).toHaveBeenCalledWith({
        where: { id: eventId },
      })
    })

    it('should prevent deletion of events owned by other users', async () => {
      const userId = 'user-123'
      const eventId = 'event-1'

      mockPrisma.calendarEvent.findUnique.mockResolvedValue({
        id: eventId,
        userId: 'other-user',
      } as any)

      const result = await deleteCalendarEvent(userId, eventId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Event not found or unauthorized')
      expect(mockPrisma.calendarEvent.delete).not.toHaveBeenCalled()
    })

    it('should return error for non-existent events', async () => {
      const userId = 'user-123'
      const eventId = 'non-existent'

      mockPrisma.calendarEvent.findUnique.mockResolvedValue(null)

      const result = await deleteCalendarEvent(userId, eventId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Event not found or unauthorized')
    })
  })

  describe('generateICSFile', () => {
    it('should generate valid ICS format for single event', () => {
      const event = {
        id: 'event-1',
        title: 'Q1 Board Review',
        description: 'Quarterly review meeting',
        startTime: new Date('2025-04-01T10:00:00Z'),
        endTime: new Date('2025-04-01T11:00:00Z'),
        type: CalendarEventType.QUARTERLY_REVIEW,
      }

      const ics = generateICSFile([event])

      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('VERSION:2.0')
      expect(ics).toContain('BEGIN:VEVENT')
      expect(ics).toContain('SUMMARY:Q1 Board Review')
      expect(ics).toContain('DESCRIPTION:Quarterly review meeting')
      expect(ics).toContain('DTSTART:20250401T100000Z')
      expect(ics).toContain('DTEND:20250401T110000Z')
      expect(ics).toContain('END:VEVENT')
      expect(ics).toContain('END:VCALENDAR')
    })

    it('should generate ICS with multiple events', () => {
      const events = [
        {
          id: 'event-1',
          title: 'Event 1',
          startTime: new Date('2025-04-01T10:00:00Z'),
          endTime: new Date('2025-04-01T11:00:00Z'),
          type: CalendarEventType.QUARTERLY_REVIEW,
        },
        {
          id: 'event-2',
          title: 'Event 2',
          startTime: new Date('2025-04-08T10:00:00Z'),
          endTime: new Date('2025-04-08T11:00:00Z'),
          type: CalendarEventType.WEEKLY_CHECKIN,
        },
      ]

      const ics = generateICSFile(events)

      const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length
      expect(eventCount).toBe(2)
    })

    it('should include UID for each event', () => {
      const event = {
        id: 'event-123',
        title: 'Test Event',
        startTime: new Date('2025-04-01T10:00:00Z'),
        endTime: new Date('2025-04-01T11:00:00Z'),
        type: CalendarEventType.QUARTERLY_REVIEW,
      }

      const ics = generateICSFile([event])

      expect(ics).toContain('UID:event-123@my-career-board')
    })

    it('should escape special characters in description', () => {
      const event = {
        id: 'event-1',
        title: 'Test Event',
        description: 'Line 1\nLine 2\nWith, commas; and semicolons',
        startTime: new Date('2025-04-01T10:00:00Z'),
        endTime: new Date('2025-04-01T11:00:00Z'),
        type: CalendarEventType.QUARTERLY_REVIEW,
      }

      const ics = generateICSFile([event])

      // ICS uses \\n for newlines
      expect(ics).toContain('\\n')
    })
  })

  describe('parseICSFile', () => {
    it('should parse valid ICS content', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//My Career Board//EN
BEGIN:VEVENT
UID:event-1@my-career-board
SUMMARY:Board Meeting
DTSTART:20250401T100000Z
DTEND:20250401T110000Z
DESCRIPTION:Quarterly review
END:VEVENT
END:VCALENDAR`

      const events = parseICSFile(icsContent)

      expect(events.length).toBe(1)
      expect(events[0].title).toBe('Board Meeting')
      expect(events[0].description).toBe('Quarterly review')
    })

    it('should handle multiple events in ICS', () => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Event 1
DTSTART:20250401T100000Z
DTEND:20250401T110000Z
END:VEVENT
BEGIN:VEVENT
SUMMARY:Event 2
DTSTART:20250408T100000Z
DTEND:20250408T110000Z
END:VEVENT
END:VCALENDAR`

      const events = parseICSFile(icsContent)

      expect(events.length).toBe(2)
    })

    it('should return empty array for invalid ICS', () => {
      const events = parseICSFile('not valid ics content')

      expect(events).toEqual([])
    })
  })

  describe('syncWithExternalCalendar', () => {
    it('should sync events with Google Calendar', async () => {
      const userId = 'user-123'
      const provider = 'google'

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        settings: JSON.stringify({
          calendarSync: {
            provider: 'google',
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
          },
        }),
      } as any)

      mockPrisma.calendarEvent.findMany.mockResolvedValue([
        {
          id: 'event-1',
          title: 'Test Event',
          startTime: new Date('2025-04-01T10:00:00Z'),
          endTime: new Date('2025-04-01T11:00:00Z'),
          externalId: null,
        },
      ] as any)

      mockPrisma.calendarEvent.update.mockResolvedValue({} as any)

      const result = await syncWithExternalCalendar(userId, provider)

      expect(result.success).toBe(true)
      expect(result.syncedCount).toBeGreaterThanOrEqual(0)
    })

    it('should fail if no calendar connection exists', async () => {
      const userId = 'user-123'
      const provider = 'google'

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        settings: JSON.stringify({}),
      } as any)

      const result = await syncWithExternalCalendar(userId, provider)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not connected')
    })
  })

  describe('getCalendarSyncStatus', () => {
    it('should return connected status when synced', async () => {
      const userId = 'user-123'

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        settings: JSON.stringify({
          calendarSync: {
            provider: 'google',
            accessToken: 'mock-token',
            lastSync: new Date().toISOString(),
          },
        }),
      } as any)

      const status = await getCalendarSyncStatus(userId)

      expect(status.connected).toBe(true)
      expect(status.provider).toBe('google')
      expect(status.lastSync).toBeDefined()
    })

    it('should return disconnected status when not synced', async () => {
      const userId = 'user-123'

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        settings: JSON.stringify({}),
      } as any)

      const status = await getCalendarSyncStatus(userId)

      expect(status.connected).toBe(false)
      expect(status.provider).toBeNull()
    })
  })
})

describe('Calendar Event Types', () => {
  it('should define all event types', () => {
    expect(CalendarEventType.QUARTERLY_REVIEW).toBe('quarterly_review')
    expect(CalendarEventType.WEEKLY_CHECKIN).toBe('weekly_checkin')
    expect(CalendarEventType.BET_DEADLINE).toBe('bet_deadline')
    expect(CalendarEventType.CUSTOM).toBe('custom')
  })
})
