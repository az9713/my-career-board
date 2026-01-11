/**
 * @jest-environment node
 */

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    reminder: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock notification service
jest.mock('@/lib/notifications/service', () => ({
  getDueReminders: jest.fn(),
  markReminderSent: jest.fn(),
  scheduleReminder: jest.fn(),
  calculateStreak: jest.fn().mockResolvedValue({ current: 5, longest: 10 }),
  parsePreferences: jest.fn().mockReturnValue({
    emailEnabled: true,
    quarterlyReminders: true,
    weeklyCheckins: true,
    avoidanceAlerts: true,
    streakNotifications: true,
  }),
  getDefaultPreferences: jest.fn().mockReturnValue({
    emailEnabled: true,
    quarterlyReminders: true,
    weeklyCheckins: true,
    avoidanceAlerts: true,
    streakNotifications: true,
  }),
}))

// Mock email service
jest.mock('@/lib/notifications/email', () => ({
  sendEmail: jest.fn(),
  emailTemplates: {
    quarterlyReview: jest.fn().mockReturnValue({
      subject: 'Quarterly Review',
      html: '<p>Test</p>',
      text: 'Test',
    }),
    weeklyCheckin: jest.fn().mockReturnValue({
      subject: 'Weekly Check-in',
      html: '<p>Test</p>',
      text: 'Test',
    }),
    avoidanceAlert: jest.fn().mockReturnValue({
      subject: 'Avoidance Alert',
      html: '<p>Test</p>',
      text: 'Test',
    }),
    streakMilestone: jest.fn().mockReturnValue({
      subject: 'Streak Milestone',
      html: '<p>Test</p>',
      text: 'Test',
    }),
  },
}))

import { GET as getPreferences, PATCH as updatePreferences } from '@/app/api/notifications/preferences/route'
import { POST as sendReminders } from '@/app/api/cron/send-reminders/route'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'
import { getDueReminders, markReminderSent } from '@/lib/notifications/service'
import { sendEmail } from '@/lib/notifications/email'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetDueReminders = getDueReminders as jest.MockedFunction<typeof getDueReminders>
const mockMarkReminderSent = markReminderSent as jest.MockedFunction<typeof markReminderSent>
const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>

describe('GET /api/notifications/preferences', () => {
  const mockUserId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return user notification preferences', async () => {
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    } as any)

    mockPrisma.user.findUnique.mockResolvedValue({
      id: mockUserId,
      email: 'test@example.com',
      notificationPreferences: JSON.stringify({
        emailEnabled: true,
        quarterlyReminders: true,
        weeklyCheckins: true,
        avoidanceAlerts: true,
        streakNotifications: true,
      }),
    } as any)

    const request = new Request('http://localhost/api/notifications/preferences')
    const response = await getPreferences(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.emailEnabled).toBe(true)
    expect(data.quarterlyReminders).toBe(true)
  })

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost/api/notifications/preferences')
    const response = await getPreferences(request)

    expect(response.status).toBe(401)
  })

  it('should return default preferences if none set', async () => {
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    } as any)

    mockPrisma.user.findUnique.mockResolvedValue({
      id: mockUserId,
      email: 'test@example.com',
      notificationPreferences: null,
    } as any)

    const request = new Request('http://localhost/api/notifications/preferences')
    const response = await getPreferences(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.emailEnabled).toBe(true) // Default
  })
})

describe('PATCH /api/notifications/preferences', () => {
  const mockUserId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update user notification preferences', async () => {
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    } as any)

    mockPrisma.user.update.mockResolvedValue({
      id: mockUserId,
      notificationPreferences: JSON.stringify({
        emailEnabled: false,
        quarterlyReminders: true,
        weeklyCheckins: false,
        avoidanceAlerts: true,
        streakNotifications: false,
      }),
    } as any)

    const request = new Request('http://localhost/api/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify({
        emailEnabled: false,
        weeklyCheckins: false,
        streakNotifications: false,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await updatePreferences(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockPrisma.user.update).toHaveBeenCalled()
  })

  it('should validate email format when provided', async () => {
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    } as any)

    const request = new Request('http://localhost/api/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify({
        notificationEmail: 'invalid-email',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await updatePreferences(request)

    expect(response.status).toBe(400)
  })

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost/api/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ emailEnabled: false }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await updatePreferences(request)

    expect(response.status).toBe(401)
  })
})

describe('POST /api/cron/send-reminders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should send due reminders', async () => {
    mockGetDueReminders.mockResolvedValue([
      {
        id: 'reminder-1',
        userId: 'user-1',
        type: 'quarterly_review',
        scheduledFor: new Date(),
        user: { email: 'user1@example.com', name: 'User 1' },
      },
      {
        id: 'reminder-2',
        userId: 'user-2',
        type: 'weekly_checkin',
        scheduledFor: new Date(),
        user: { email: 'user2@example.com', name: 'User 2' },
      },
    ] as any)

    mockSendEmail.mockResolvedValue({ success: true })
    mockMarkReminderSent.mockResolvedValue(undefined)

    const request = new Request('http://localhost/api/cron/send-reminders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
      },
    })

    const response = await sendReminders(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.sent).toBe(2)
    expect(mockSendEmail).toHaveBeenCalledTimes(2)
    expect(mockMarkReminderSent).toHaveBeenCalledTimes(2)
  })

  it('should mark reminders as sent', async () => {
    mockGetDueReminders.mockResolvedValue([
      {
        id: 'reminder-1',
        userId: 'user-1',
        type: 'quarterly_review',
        scheduledFor: new Date(),
        user: { email: 'user1@example.com', name: 'User 1' },
      },
    ] as any)

    mockSendEmail.mockResolvedValue({ success: true })
    mockMarkReminderSent.mockResolvedValue(undefined)

    const request = new Request('http://localhost/api/cron/send-reminders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
      },
    })

    await sendReminders(request)

    expect(mockMarkReminderSent).toHaveBeenCalledWith('reminder-1')
  })

  it('should handle email failures gracefully', async () => {
    mockGetDueReminders.mockResolvedValue([
      {
        id: 'reminder-1',
        userId: 'user-1',
        type: 'quarterly_review',
        scheduledFor: new Date(),
        user: { email: 'user1@example.com', name: 'User 1' },
      },
      {
        id: 'reminder-2',
        userId: 'user-2',
        type: 'weekly_checkin',
        scheduledFor: new Date(),
        user: { email: 'user2@example.com', name: 'User 2' },
      },
    ] as any)

    // First email fails, second succeeds
    mockSendEmail
      .mockRejectedValueOnce(new Error('Email failed'))
      .mockResolvedValueOnce({ success: true })
    mockMarkReminderSent.mockResolvedValue(undefined)

    const request = new Request('http://localhost/api/cron/send-reminders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
      },
    })

    const response = await sendReminders(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.sent).toBe(1)
    expect(data.failed).toBe(1)
  })

  it('should require authorization', async () => {
    const request = new Request('http://localhost/api/cron/send-reminders', {
      method: 'POST',
      // No auth header
    })

    const response = await sendReminders(request)

    expect(response.status).toBe(401)
  })
})
