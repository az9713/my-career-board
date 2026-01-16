import prisma from '@/lib/prisma/client'

export interface CreateTimelineEventData {
  userId: string
  type: string
  title: string
  description?: string
  date: Date
  endDate?: Date
  metadata?: string
  sourceId?: string
  sourceType?: string
  importance?: number
}

export interface UpdateTimelineEventData {
  type?: string
  title?: string
  description?: string
  date?: Date
  endDate?: Date
  metadata?: string
  importance?: number
}

export interface TimelineFilter {
  type?: string
  startDate?: Date
  endDate?: Date
}

export interface CreateCareerPhaseData {
  userId: string
  title: string
  description?: string
  startDate: Date
  endDate?: Date
  color?: string
}

export interface UpdateCareerPhaseData {
  title?: string
  description?: string
  startDate?: Date
  endDate?: Date
  color?: string
}

export interface MarkInflectionPointData {
  eventId: string
  impact: string
  beforeState?: string
  afterState?: string
}

/**
 * Create a new timeline event
 */
export async function createTimelineEvent(data: CreateTimelineEventData) {
  return prisma.timelineEvent.create({
    data,
  })
}

/**
 * Get timeline event by ID
 */
export async function getTimelineEventById(id: string) {
  return prisma.timelineEvent.findUnique({
    where: { id },
    include: { inflectionPoint: true },
  })
}

/**
 * Get user's timeline events
 */
export async function getUserTimeline(userId: string, filters: TimelineFilter = {}) {
  const where: any = { userId }

  if (filters.type) {
    where.type = filters.type
  }

  if (filters.startDate || filters.endDate) {
    where.date = {}
    if (filters.startDate) {
      where.date.gte = filters.startDate
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate
    }
  }

  return prisma.timelineEvent.findMany({
    where,
    include: { inflectionPoint: true },
    orderBy: { date: 'desc' },
  })
}

/**
 * Update a timeline event
 */
export async function updateTimelineEvent(id: string, data: UpdateTimelineEventData) {
  return prisma.timelineEvent.update({
    where: { id },
    data,
    include: { inflectionPoint: true },
  })
}

/**
 * Delete a timeline event
 */
export async function deleteTimelineEvent(id: string) {
  return prisma.timelineEvent.delete({
    where: { id },
  })
}

/**
 * Create a career phase
 */
export async function createCareerPhase(data: CreateCareerPhaseData) {
  return prisma.careerPhase.create({
    data,
  })
}

/**
 * Get user's career phases
 */
export async function getUserCareerPhases(userId: string) {
  return prisma.careerPhase.findMany({
    where: { userId },
    orderBy: { startDate: 'asc' },
  })
}

/**
 * Update a career phase
 */
export async function updateCareerPhase(id: string, data: UpdateCareerPhaseData) {
  return prisma.careerPhase.update({
    where: { id },
    data,
  })
}

/**
 * Delete a career phase
 */
export async function deleteCareerPhase(id: string) {
  return prisma.careerPhase.delete({
    where: { id },
  })
}

/**
 * Mark an event as an inflection point
 */
export async function markAsInflectionPoint(data: MarkInflectionPointData) {
  return prisma.inflectionPoint.create({
    data,
  })
}

/**
 * Remove inflection point from an event
 */
export async function removeInflectionPoint(eventId: string) {
  return prisma.inflectionPoint.delete({
    where: { eventId },
  })
}

/**
 * Get timeline with career phases overlaid
 */
export async function getTimelineWithPhases(userId: string) {
  const [events, phases] = await Promise.all([
    prisma.timelineEvent.findMany({
      where: { userId },
      include: { inflectionPoint: true },
      orderBy: { date: 'desc' },
    }),
    prisma.careerPhase.findMany({
      where: { userId },
      orderBy: { startDate: 'asc' },
    }),
  ])

  return { events, phases }
}

/**
 * Get all inflection points for a user
 */
export async function getInflectionPoints(userId: string) {
  return prisma.timelineEvent.findMany({
    where: {
      userId,
      inflectionPoint: { isNot: null },
    },
    include: { inflectionPoint: true },
    orderBy: { date: 'desc' },
  })
}
