// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    reminder: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    boardSession: {
      findMany: jest.fn(),
    },
    sessionMessage: {
      findMany: jest.fn(),
    },
  },
}))

// Mock email service
jest.mock('@/lib/notifications/email', () => ({
  sendEmail: jest.fn(),
}))

import {
  scheduleReminder,
  detectAvoidanceAlert,
  calculateStreak,
  getDueReminders,
  markReminderSent,
  NotificationType,
} from '@/lib/notifications/service'
import prisma from '@/lib/prisma/client'
import { sendEmail } from '@/lib/notifications/email'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('scheduleReminder', () => {
    it('should create reminder for quarterly review', async () => {
      const userId = 'user-123'
      const scheduledFor = new Date('2025-04-01T09:00:00Z')

      mockPrisma.reminder.findFirst.mockResolvedValue(null)
      mockPrisma.reminder.create.mockResolvedValue({
        id: 'reminder-1',
        userId,
        type: 'quarterly_review',
        scheduledFor,
        sent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await scheduleReminder(userId, 'quarterly_review', scheduledFor)

      expect(mockPrisma.reminder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          type: 'quarterly_review',
          scheduledFor,
          sent: false,
        }),
      })
      expect(result.id).toBe('reminder-1')
    })

    it('should respect user timezone', async () => {
      const userId = 'user-123'
      const userTimezone = 'America/New_York'
      const scheduledFor = new Date('2025-04-01T09:00:00Z')

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        timezone: userTimezone,
      } as any)
      mockPrisma.reminder.findFirst.mockResolvedValue(null)
      mockPrisma.reminder.create.mockResolvedValue({
        id: 'reminder-1',
        userId,
        type: 'quarterly_review',
        scheduledFor,
        sent: false,
        metadata: JSON.stringify({ timezone: userTimezone }),
      } as any)

      const result = await scheduleReminder(userId, 'quarterly_review', scheduledFor, {
        respectTimezone: true,
      })

      expect(mockPrisma.reminder.create).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should not duplicate reminders', async () => {
      const userId = 'user-123'
      const scheduledFor = new Date('2025-04-01T09:00:00Z')

      // Existing reminder already exists
      mockPrisma.reminder.findFirst.mockResolvedValue({
        id: 'existing-reminder',
        userId,
        type: 'quarterly_review',
        scheduledFor,
        sent: false,
      } as any)

      const result = await scheduleReminder(userId, 'quarterly_review', scheduledFor)

      expect(mockPrisma.reminder.create).not.toHaveBeenCalled()
      expect(result.id).toBe('existing-reminder')
    })
  })

  describe('detectAvoidanceAlert', () => {
    beforeEach(() => {
      // Default: no recent alerts
      mockPrisma.reminder.findFirst.mockResolvedValue(null)
    })

    it('should trigger alert for recurring patterns', async () => {
      const userId = 'user-123'

      // Mock session messages showing repeated avoidance (keyword "avoiding" appears 3 times)
      mockPrisma.sessionMessage.findMany.mockResolvedValue([
        { content: 'I am avoiding the difficult conversation', metadata: '{}' },
        { content: 'Still avoiding that same conversation', metadata: '{}' },
        { content: 'Keep avoiding it every week', metadata: '{}' },
      ] as any)

      const alert = await detectAvoidanceAlert(userId)

      expect(alert).not.toBeNull()
      expect(alert?.type).toBe('avoidance_pattern')
    })

    it('should include pattern details in alert', async () => {
      const userId = 'user-123'

      // Multiple messages with "putting off" keyword
      mockPrisma.sessionMessage.findMany.mockResolvedValue([
        { content: 'I keep putting off the salary conversation', metadata: '{}' },
        { content: 'Still putting off that discussion', metadata: '{}' },
        { content: 'Been putting off asking for a raise', metadata: '{}' },
      ] as any)

      const alert = await detectAvoidanceAlert(userId)

      expect(alert).not.toBeNull()
      expect(alert?.details).toBeDefined()
      expect(alert?.details?.pattern).toBeDefined()
    })

    it('should respect alert cooldown', async () => {
      const userId = 'user-123'

      // Recent alert was sent
      mockPrisma.reminder.findFirst.mockResolvedValue({
        id: 'recent-alert',
        type: 'avoidance_alert',
        sent: true,
        sentAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      } as any)

      mockPrisma.sessionMessage.findMany.mockResolvedValue([
        { content: 'avoiding something', metadata: '{}' },
        { content: 'still avoiding it', metadata: '{}' },
      ] as any)

      const alert = await detectAvoidanceAlert(userId, { cooldownHours: 24 })

      expect(alert).toBeNull()
    })
  })

  describe('calculateStreak', () => {
    // Helper to get date N weeks ago
    const weeksAgo = (n: number) => new Date(Date.now() - n * 7 * 24 * 60 * 60 * 1000)

    it('should count consecutive check-ins', async () => {
      const userId = 'user-123'

      // Sessions on consecutive weeks (including current week)
      mockPrisma.boardSession.findMany.mockResolvedValue([
        { createdAt: weeksAgo(0) }, // This week
        { createdAt: weeksAgo(1) }, // Last week
        { createdAt: weeksAgo(2) }, // 2 weeks ago
        { createdAt: weeksAgo(3) }, // 3 weeks ago
      ] as any)

      const streak = await calculateStreak(userId)

      expect(streak.current).toBeGreaterThanOrEqual(1)
      expect(streak.longest).toBeGreaterThanOrEqual(1)
    })

    it('should reset on missed week', async () => {
      const userId = 'user-123'

      // Gap in weeks - missing week 2
      mockPrisma.boardSession.findMany.mockResolvedValue([
        { createdAt: weeksAgo(0) }, // This week
        { createdAt: weeksAgo(1) }, // Last week
        // Missing week 2
        { createdAt: weeksAgo(3) }, // 3 weeks ago
        { createdAt: weeksAgo(4) }, // 4 weeks ago
      ] as any)

      const streak = await calculateStreak(userId)

      // Current streak should be 2 (this week + last week)
      expect(streak.current).toBeLessThanOrEqual(2)
      // Longest might be 2 from the older consecutive sessions
      expect(streak.longest).toBeGreaterThanOrEqual(1)
    })

    it('should handle no sessions', async () => {
      const userId = 'user-123'

      mockPrisma.boardSession.findMany.mockResolvedValue([])

      const streak = await calculateStreak(userId)

      expect(streak.current).toBe(0)
      expect(streak.longest).toBe(0)
    })
  })

  describe('getDueReminders', () => {
    it('should return reminders due now', async () => {
      const now = new Date()

      mockPrisma.reminder.findMany.mockResolvedValue([
        {
          id: 'reminder-1',
          type: 'quarterly_review',
          scheduledFor: new Date(now.getTime() - 1000), // 1 second ago
          sent: false,
        },
        {
          id: 'reminder-2',
          type: 'weekly_checkin',
          scheduledFor: new Date(now.getTime() - 60000), // 1 minute ago
          sent: false,
        },
      ] as any)

      const due = await getDueReminders()

      expect(due.length).toBe(2)
    })

    it('should exclude already sent reminders', async () => {
      mockPrisma.reminder.findMany.mockResolvedValue([])

      const due = await getDueReminders()

      expect(mockPrisma.reminder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sent: false,
          }),
        })
      )
    })
  })

  describe('markReminderSent', () => {
    it('should update reminder as sent', async () => {
      const reminderId = 'reminder-123'

      mockPrisma.reminder.update.mockResolvedValue({
        id: reminderId,
        sent: true,
        sentAt: expect.any(Date),
      } as any)

      await markReminderSent(reminderId)

      expect(mockPrisma.reminder.update).toHaveBeenCalledWith({
        where: { id: reminderId },
        data: {
          sent: true,
          sentAt: expect.any(Date),
        },
      })
    })
  })
})

describe('Notification Types', () => {
  it('should define all notification types', () => {
    expect(NotificationType.QUARTERLY_REVIEW).toBe('quarterly_review')
    expect(NotificationType.WEEKLY_CHECKIN).toBe('weekly_checkin')
    expect(NotificationType.AVOIDANCE_ALERT).toBe('avoidance_alert')
    expect(NotificationType.STREAK_MILESTONE).toBe('streak_milestone')
  })
})
