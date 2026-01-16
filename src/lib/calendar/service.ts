import prisma from '@/lib/prisma/client'

/**
 * Calendar event types
 */
export const CalendarEventType = {
  QUARTERLY_REVIEW: 'quarterly_review',
  WEEKLY_CHECKIN: 'weekly_checkin',
  BET_DEADLINE: 'bet_deadline',
  CUSTOM: 'custom',
} as const

export type CalendarEventTypeValue = typeof CalendarEventType[keyof typeof CalendarEventType]

export interface CalendarEvent {
  id: string
  userId: string
  title: string
  description?: string | null
  type: string
  startTime: Date
  endTime: Date
  reminders?: string | null
  externalId?: string | null
  externalProvider?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateEventData {
  title: string
  type: CalendarEventTypeValue
  startTime: Date
  endTime: Date
  description?: string
  reminders?: number[]
}

export interface GetEventsOptions {
  startDate?: Date
  endDate?: Date
  type?: CalendarEventTypeValue
  limit?: number
}

export interface CalendarSyncStatus {
  connected: boolean
  provider: string | null
  lastSync?: Date | null
}

export interface SyncResult {
  success: boolean
  syncedCount?: number
  error?: string
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(
  userId: string,
  data: CreateEventData
): Promise<CalendarEvent> {
  const event = await prisma.calendarEvent.create({
    data: {
      userId,
      title: data.title,
      type: data.type,
      startTime: data.startTime,
      endTime: data.endTime,
      description: data.description || null,
      reminders: data.reminders ? JSON.stringify(data.reminders) : null,
    },
  })

  return event as CalendarEvent
}

/**
 * Get upcoming calendar events for a user
 */
export async function getUpcomingEvents(
  userId: string,
  options: GetEventsOptions = {}
): Promise<CalendarEvent[]> {
  const { startDate, endDate, type, limit } = options

  const where: any = {
    userId,
  }

  if (startDate || endDate) {
    where.startTime = {}
    if (startDate) where.startTime.gte = startDate
    if (endDate) where.startTime.lte = endDate
  } else {
    // Default to future events
    where.startTime = {
      gte: new Date(),
    }
  }

  if (type) {
    where.type = type
  }

  const events = await prisma.calendarEvent.findMany({
    where,
    orderBy: {
      startTime: 'asc',
    },
    take: limit,
  })

  return events as CalendarEvent[]
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  userId: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  // Check ownership
  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
  })

  if (!event || event.userId !== userId) {
    return { success: false, error: 'Event not found or unauthorized' }
  }

  await prisma.calendarEvent.delete({
    where: { id: eventId },
  })

  return { success: true }
}

/**
 * Format date for ICS
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * Escape special characters for ICS
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Generate ICS file content from events
 */
export function generateICSFile(events: Partial<CalendarEvent>[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//My Career Board//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const event of events) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.id}@my-career-board`)
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`)
    lines.push(`DTSTART:${formatICSDate(event.startTime!)}`)
    lines.push(`DTEND:${formatICSDate(event.endTime!)}`)
    lines.push(`SUMMARY:${escapeICS(event.title || '')}`)

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICS(event.description)}`)
    }

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

/**
 * Parse ICS file content to events
 */
export function parseICSFile(icsContent: string): Partial<CalendarEvent>[] {
  if (!icsContent.includes('BEGIN:VCALENDAR')) {
    return []
  }

  const events: Partial<CalendarEvent>[] = []
  const eventBlocks = icsContent.split('BEGIN:VEVENT').slice(1)

  for (const block of eventBlocks) {
    const endIndex = block.indexOf('END:VEVENT')
    if (endIndex === -1) continue

    const eventContent = block.substring(0, endIndex)
    const event: Partial<CalendarEvent> = {}

    // Parse SUMMARY
    const summaryMatch = eventContent.match(/SUMMARY:(.+)/m)
    if (summaryMatch) {
      event.title = summaryMatch[1].trim()
    }

    // Parse DESCRIPTION
    const descMatch = eventContent.match(/DESCRIPTION:(.+)/m)
    if (descMatch) {
      event.description = descMatch[1].trim().replace(/\\n/g, '\n')
    }

    // Parse DTSTART
    const startMatch = eventContent.match(/DTSTART:(\d{8}T\d{6}Z?)/m)
    if (startMatch) {
      event.startTime = parseICSDate(startMatch[1])
    }

    // Parse DTEND
    const endMatch = eventContent.match(/DTEND:(\d{8}T\d{6}Z?)/m)
    if (endMatch) {
      event.endTime = parseICSDate(endMatch[1])
    }

    if (event.title) {
      events.push(event)
    }
  }

  return events
}

/**
 * Parse ICS date format to Date object
 */
function parseICSDate(icsDate: string): Date {
  const year = parseInt(icsDate.substring(0, 4))
  const month = parseInt(icsDate.substring(4, 6)) - 1
  const day = parseInt(icsDate.substring(6, 8))
  const hour = parseInt(icsDate.substring(9, 11))
  const minute = parseInt(icsDate.substring(11, 13))
  const second = parseInt(icsDate.substring(13, 15))

  return new Date(Date.UTC(year, month, day, hour, minute, second))
}

/**
 * Sync events with external calendar provider
 */
export async function syncWithExternalCalendar(
  userId: string,
  provider: string
): Promise<SyncResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { settings: true },
  })

  if (!user) {
    return { success: false, error: 'User not found' }
  }

  let settings: any = {}
  try {
    settings = JSON.parse(user.settings)
  } catch {
    settings = {}
  }

  if (!settings.calendarSync?.accessToken) {
    return { success: false, error: `Calendar ${provider} not connected` }
  }

  // Get events that haven't been synced
  const events = await prisma.calendarEvent.findMany({
    where: {
      userId,
      externalId: null,
    },
  })

  // In production, this would make API calls to Google Calendar
  // For now, we simulate the sync
  let syncedCount = 0
  for (const event of events) {
    // Simulate creating event in external calendar
    const externalId = `ext-${event.id}`

    await prisma.calendarEvent.update({
      where: { id: event.id },
      data: {
        externalId,
        externalProvider: provider,
      },
    })
    syncedCount++
  }

  // Update last sync time
  settings.calendarSync.lastSync = new Date().toISOString()
  await prisma.user.update({
    where: { id: userId },
    data: {
      settings: JSON.stringify(settings),
    },
  })

  return { success: true, syncedCount }
}

/**
 * Get calendar sync status for a user
 */
export async function getCalendarSyncStatus(userId: string): Promise<CalendarSyncStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { settings: true },
  })

  if (!user) {
    return { connected: false, provider: null }
  }

  let settings: any = {}
  try {
    settings = JSON.parse(user.settings)
  } catch {
    settings = {}
  }

  if (!settings.calendarSync?.accessToken) {
    return { connected: false, provider: null }
  }

  return {
    connected: true,
    provider: settings.calendarSync.provider || null,
    lastSync: settings.calendarSync.lastSync
      ? new Date(settings.calendarSync.lastSync)
      : null,
  }
}
