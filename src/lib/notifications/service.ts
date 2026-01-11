import prisma from '@/lib/prisma/client'

/**
 * Notification types enum
 */
export const NotificationType = {
  QUARTERLY_REVIEW: 'quarterly_review',
  WEEKLY_CHECKIN: 'weekly_checkin',
  AVOIDANCE_ALERT: 'avoidance_alert',
  STREAK_MILESTONE: 'streak_milestone',
} as const

export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType]

export interface ScheduleReminderOptions {
  respectTimezone?: boolean
  metadata?: Record<string, unknown>
}

export interface Reminder {
  id: string
  userId: string
  type: string
  scheduledFor: Date
  sent: boolean
  sentAt?: Date | null
  metadata?: string | null
  user?: {
    email: string
    name?: string | null
    timezone?: string
    notificationPreferences?: string | null
  }
}

export interface AvoidanceAlert {
  type: 'avoidance_pattern'
  details: {
    pattern: string
    frequency: number
    examples: string[]
  }
}

export interface StreakResult {
  current: number
  longest: number
  lastCheckIn?: Date
}

/**
 * Schedule a reminder for a user
 */
export async function scheduleReminder(
  userId: string,
  type: NotificationTypeValue,
  scheduledFor: Date,
  options: ScheduleReminderOptions = {}
): Promise<Reminder> {
  // Check for existing reminder to prevent duplicates
  const existingReminder = await prisma.reminder.findFirst({
    where: {
      userId,
      type,
      scheduledFor,
      sent: false,
    },
  })

  if (existingReminder) {
    return existingReminder as Reminder
  }

  // Get user timezone if respecting timezone
  let metadata = options.metadata || {}
  if (options.respectTimezone) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    })
    if (user?.timezone) {
      metadata = { ...metadata, timezone: user.timezone }
    }
  }

  const reminder = await prisma.reminder.create({
    data: {
      userId,
      type,
      scheduledFor,
      sent: false,
      metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
    },
  })

  return reminder as Reminder
}

/**
 * Detect avoidance patterns in user's session messages
 */
export async function detectAvoidanceAlert(
  userId: string,
  options: { cooldownHours?: number } = {}
): Promise<AvoidanceAlert | null> {
  const { cooldownHours = 24 } = options

  // Check for recent alert (cooldown)
  const recentAlert = await prisma.reminder.findFirst({
    where: {
      userId,
      type: NotificationType.AVOIDANCE_ALERT,
      sent: true,
      sentAt: {
        gte: new Date(Date.now() - cooldownHours * 60 * 60 * 1000),
      },
    },
  })

  if (recentAlert) {
    return null
  }

  // Get recent session messages
  const messages = await prisma.sessionMessage.findMany({
    where: {
      session: {
        userId,
      },
      speaker: 'user',
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    select: {
      content: true,
      metadata: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  })

  if (messages.length < 3) {
    return null
  }

  // Simple pattern detection - look for repeated keywords related to avoidance
  const avoidanceKeywords = [
    'avoiding',
    'putting off',
    'should have',
    'need to',
    'been meaning to',
    'keep delaying',
    'procrastinating',
    'haven\'t started',
  ]

  const messageTexts = messages.map(m => m.content.toLowerCase())
  const matches: { keyword: string; count: number; examples: string[] }[] = []

  for (const keyword of avoidanceKeywords) {
    const matchingMessages = messageTexts.filter(text => text.includes(keyword))
    if (matchingMessages.length >= 2) {
      matches.push({
        keyword,
        count: matchingMessages.length,
        examples: matchingMessages.slice(0, 3),
      })
    }
  }

  if (matches.length === 0) {
    return null
  }

  // Find the most frequent pattern
  const topMatch = matches.sort((a, b) => b.count - a.count)[0]

  return {
    type: 'avoidance_pattern',
    details: {
      pattern: topMatch.keyword,
      frequency: topMatch.count,
      examples: topMatch.examples,
    },
  }
}

/**
 * Calculate user's check-in streak
 */
export async function calculateStreak(
  userId: string,
  options: { timezone?: string } = {}
): Promise<StreakResult> {
  // Get all sessions ordered by date
  const sessions = await prisma.boardSession.findMany({
    where: {
      userId,
      status: 'completed',
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (sessions.length === 0) {
    return { current: 0, longest: 0 }
  }

  // Get week number for a date
  const getWeekNumber = (date: Date): number => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  // Get year-week key
  const getYearWeek = (date: Date): string => {
    const year = date.getFullYear()
    const week = getWeekNumber(date)
    return `${year}-${week}`
  }

  // Get unique weeks with sessions
  const weeksWithSessions = new Set(sessions.map(s => getYearWeek(s.createdAt)))
  const sortedWeeks = Array.from(weeksWithSessions).sort().reverse()

  // Calculate current streak
  let currentStreak = 0
  const now = new Date()
  let expectedWeek = getYearWeek(now)

  for (const week of sortedWeeks) {
    if (week === expectedWeek) {
      currentStreak++
      // Calculate previous week
      const [year, weekNum] = expectedWeek.split('-').map(Number)
      if (weekNum === 1) {
        expectedWeek = `${year - 1}-52`
      } else {
        expectedWeek = `${year}-${weekNum - 1}`
      }
    } else if (currentStreak === 0) {
      // Check if we're still in the current week's grace period
      const lastWeek = getYearWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
      if (week === lastWeek) {
        currentStreak++
        const [year, weekNum] = lastWeek.split('-').map(Number)
        if (weekNum === 1) {
          expectedWeek = `${year - 1}-52`
        } else {
          expectedWeek = `${year}-${weekNum - 1}`
        }
      } else {
        break
      }
    } else {
      break
    }
  }

  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 0
  let prevWeek: string | null = null

  for (const week of Array.from(weeksWithSessions).sort()) {
    if (!prevWeek) {
      tempStreak = 1
    } else {
      const [prevYear, prevWeekNum] = prevWeek.split('-').map(Number)
      const [currYear, currWeekNum] = week.split('-').map(Number)

      const isConsecutive =
        (currYear === prevYear && currWeekNum === prevWeekNum + 1) ||
        (currYear === prevYear + 1 && prevWeekNum === 52 && currWeekNum === 1)

      if (isConsecutive) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    prevWeek = week
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  return {
    current: currentStreak,
    longest: longestStreak,
    lastCheckIn: sessions[0]?.createdAt,
  }
}

/**
 * Get all reminders that are due to be sent
 */
export async function getDueReminders(): Promise<Reminder[]> {
  const reminders = await prisma.reminder.findMany({
    where: {
      sent: false,
      scheduledFor: {
        lte: new Date(),
      },
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
          timezone: true,
          notificationPreferences: true,
        },
      },
    },
  })

  return reminders as Reminder[]
}

/**
 * Mark a reminder as sent
 */
export async function markReminderSent(reminderId: string): Promise<void> {
  await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      sent: true,
      sentAt: new Date(),
    },
  })
}

/**
 * Get default notification preferences
 */
export function getDefaultPreferences() {
  return {
    emailEnabled: true,
    quarterlyReminders: true,
    weeklyCheckins: true,
    avoidanceAlerts: true,
    streakNotifications: true,
  }
}

/**
 * Parse notification preferences from JSON string
 */
export function parsePreferences(prefsJson: string | null | undefined) {
  if (!prefsJson) {
    return getDefaultPreferences()
  }
  try {
    return { ...getDefaultPreferences(), ...JSON.parse(prefsJson) }
  } catch {
    return getDefaultPreferences()
  }
}
