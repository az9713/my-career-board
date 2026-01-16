import prisma from '@/lib/prisma/client'

export interface CreateCheckinData {
  userId: string
  promptId: string
  response: string
  mood?: number
}

export interface CheckinHistoryOptions {
  startDate?: Date
  endDate?: Date
  limit?: number
}

export interface GetTodayPromptOptions {
  rotate?: boolean
}

export interface CreatePromptData {
  category: string
  question: string
  frequency: string
}

export interface GetPromptsOptions {
  category?: string
}

export interface CheckinInsights {
  totalCheckins: number
  averageMood: number | null
  moodTrend: 'improving' | 'declining' | 'stable' | 'unknown'
  checkinsByDay: Record<string, number>
}

/**
 * Create a new check-in
 */
export async function createCheckin(data: CreateCheckinData) {
  return prisma.microCheckin.create({
    data,
  })
}

/**
 * Get check-in history for a user
 */
export async function getCheckinHistory(
  userId: string,
  options: CheckinHistoryOptions = {}
) {
  const where: any = { userId }

  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) {
      where.createdAt.gte = options.startDate
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate
    }
  }

  return prisma.microCheckin.findMany({
    where,
    include: { prompt: true },
    orderBy: { createdAt: 'desc' },
    take: options.limit || 30,
  })
}

/**
 * Get today's prompt for a user
 */
export async function getTodayPrompt(
  userId: string,
  options: GetTodayPromptOptions = {}
) {
  if (options.rotate) {
    // Get all active prompts and rotate based on day
    const prompts = await prisma.checkinPrompt.findMany({
      where: {
        isActive: true,
        frequency: 'daily',
      },
    })

    if (prompts.length === 0) return null

    // Use day of year to rotate
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    const index = dayOfYear % prompts.length

    return prompts[index]
  }

  return prisma.checkinPrompt.findFirst({
    where: {
      isActive: true,
      frequency: 'daily',
    },
  })
}

/**
 * Get user's streak
 */
export async function getStreak(userId: string) {
  return prisma.checkinStreak.findUnique({
    where: { userId },
  })
}

/**
 * Update user's streak after a check-in
 */
export async function updateStreak(userId: string) {
  const existingStreak = await prisma.checkinStreak.findUnique({
    where: { userId },
  })

  const now = new Date()
  let currentStreak = 1
  let longestStreak = 1

  if (existingStreak) {
    const lastCheckin = existingStreak.lastCheckinAt
    if (lastCheckin) {
      const daysSinceLastCheckin = Math.floor(
        (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLastCheckin <= 1) {
        // Consecutive day - increment streak
        currentStreak = existingStreak.currentStreak + 1
      }
      // else: streak resets to 1
    }

    longestStreak = Math.max(currentStreak, existingStreak.longestStreak)
  }

  return prisma.checkinStreak.upsert({
    where: { userId },
    create: {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastCheckinAt: now,
    },
    update: {
      currentStreak,
      longestStreak,
      lastCheckinAt: now,
    },
  })
}

/**
 * Get insights from check-in history
 */
export async function getCheckinInsights(userId: string): Promise<CheckinInsights> {
  const checkins = await prisma.microCheckin.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })

  const totalCheckins = await prisma.microCheckin.count({
    where: { userId },
  })

  // Calculate average mood
  const checkinsWithMood = checkins.filter((c) => c.mood !== null)
  const averageMood =
    checkinsWithMood.length > 0
      ? checkinsWithMood.reduce((sum, c) => sum + (c.mood || 0), 0) /
        checkinsWithMood.length
      : null

  // Determine mood trend
  let moodTrend: CheckinInsights['moodTrend'] = 'unknown'
  if (checkinsWithMood.length >= 4) {
    const recentHalf = checkinsWithMood.slice(-Math.floor(checkinsWithMood.length / 2))
    const olderHalf = checkinsWithMood.slice(0, Math.floor(checkinsWithMood.length / 2))

    const recentAvg =
      recentHalf.reduce((sum, c) => sum + (c.mood || 0), 0) / recentHalf.length
    const olderAvg =
      olderHalf.reduce((sum, c) => sum + (c.mood || 0), 0) / olderHalf.length

    if (recentAvg > olderAvg + 0.5) {
      moodTrend = 'improving'
    } else if (recentAvg < olderAvg - 0.5) {
      moodTrend = 'declining'
    } else {
      moodTrend = 'stable'
    }
  }

  // Group by day
  const checkinsByDay: Record<string, number> = {}
  for (const checkin of checkins) {
    const day = checkin.createdAt.toISOString().split('T')[0]
    checkinsByDay[day] = (checkinsByDay[day] || 0) + 1
  }

  return {
    totalCheckins,
    averageMood,
    moodTrend,
    checkinsByDay,
  }
}

/**
 * Create a new prompt
 */
export async function createPrompt(data: CreatePromptData) {
  return prisma.checkinPrompt.create({
    data: {
      ...data,
      isActive: true,
    },
  })
}

/**
 * Get prompts
 */
export async function getPrompts(options: GetPromptsOptions = {}) {
  const where: any = { isActive: true }

  if (options.category) {
    where.category = options.category
  }

  return prisma.checkinPrompt.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}
