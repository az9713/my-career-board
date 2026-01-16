/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    timelineEvent: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    careerPhase: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    inflectionPoint: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import {
  createTimelineEvent,
  getTimelineEventById,
  getUserTimeline,
  updateTimelineEvent,
  deleteTimelineEvent,
  createCareerPhase,
  getUserCareerPhases,
  updateCareerPhase,
  deleteCareerPhase,
  markAsInflectionPoint,
  removeInflectionPoint,
  getTimelineWithPhases,
  getInflectionPoints,
} from '@/lib/timeline/service'
import prisma from '@/lib/prisma/client'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Timeline Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTimelineEvent', () => {
    it('should create a new timeline event', async () => {
      const eventData = {
        userId: 'user-1',
        type: 'job',
        title: 'Started at Company X',
        description: 'Joined as Senior Engineer',
        date: new Date('2024-01-15'),
        importance: 5,
      }

      const mockEvent = {
        id: 'event-1',
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(mockPrisma.timelineEvent.create as jest.Mock).mockResolvedValue(mockEvent)

      const result = await createTimelineEvent(eventData)

      expect(mockPrisma.timelineEvent.create).toHaveBeenCalledWith({
        data: eventData,
      })
      expect(result).toEqual(mockEvent)
    })

    it('should create event with source reference', async () => {
      const eventData = {
        userId: 'user-1',
        type: 'decision',
        title: 'Accepted job offer',
        date: new Date(),
        sourceId: 'decision-1',
        sourceType: 'decision',
      }

      ;(mockPrisma.timelineEvent.create as jest.Mock).mockResolvedValue({
        id: 'event-1',
        ...eventData,
      })

      await createTimelineEvent(eventData)

      expect(mockPrisma.timelineEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceId: 'decision-1',
          sourceType: 'decision',
        }),
      })
    })
  })

  describe('getTimelineEventById', () => {
    it('should retrieve event with inflection point', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Big moment',
        inflectionPoint: { impact: 'Changed career trajectory' },
      }

      ;(mockPrisma.timelineEvent.findUnique as jest.Mock).mockResolvedValue(mockEvent)

      const result = await getTimelineEventById('event-1')

      expect(mockPrisma.timelineEvent.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        include: { inflectionPoint: true },
      })
      expect(result).toEqual(mockEvent)
    })
  })

  describe('getUserTimeline', () => {
    it('should retrieve all timeline events for a user', async () => {
      const mockEvents = [
        { id: 'e1', title: 'Event 1', date: new Date('2024-01-01') },
        { id: 'e2', title: 'Event 2', date: new Date('2024-02-01') },
      ]

      ;(mockPrisma.timelineEvent.findMany as jest.Mock).mockResolvedValue(mockEvents)

      const result = await getUserTimeline('user-1')

      expect(mockPrisma.timelineEvent.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { inflectionPoint: true },
        orderBy: { date: 'desc' },
      })
      expect(result).toHaveLength(2)
    })

    it('should filter by type', async () => {
      ;(mockPrisma.timelineEvent.findMany as jest.Mock).mockResolvedValue([])

      await getUserTimeline('user-1', { type: 'job' })

      expect(mockPrisma.timelineEvent.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', type: 'job' },
        include: { inflectionPoint: true },
        orderBy: { date: 'desc' },
      })
    })

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')

      ;(mockPrisma.timelineEvent.findMany as jest.Mock).mockResolvedValue([])

      await getUserTimeline('user-1', { startDate, endDate })

      expect(mockPrisma.timelineEvent.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          date: { gte: startDate, lte: endDate },
        },
        include: { inflectionPoint: true },
        orderBy: { date: 'desc' },
      })
    })
  })

  describe('updateTimelineEvent', () => {
    it('should update event fields', async () => {
      const updates = {
        title: 'Updated title',
        importance: 4,
      }

      const mockUpdated = {
        id: 'event-1',
        ...updates,
      }

      ;(mockPrisma.timelineEvent.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await updateTimelineEvent('event-1', updates)

      expect(mockPrisma.timelineEvent.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: updates,
        include: { inflectionPoint: true },
      })
      expect(result.title).toBe('Updated title')
    })
  })

  describe('deleteTimelineEvent', () => {
    it('should delete an event', async () => {
      ;(mockPrisma.timelineEvent.delete as jest.Mock).mockResolvedValue({ id: 'event-1' })

      await deleteTimelineEvent('event-1')

      expect(mockPrisma.timelineEvent.delete).toHaveBeenCalledWith({
        where: { id: 'event-1' },
      })
    })
  })

  describe('createCareerPhase', () => {
    it('should create a career phase', async () => {
      const phaseData = {
        userId: 'user-1',
        title: 'Early Career',
        description: 'Learning the ropes',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2022-12-31'),
        color: '#3B82F6',
      }

      const mockPhase = {
        id: 'phase-1',
        ...phaseData,
      }

      ;(mockPrisma.careerPhase.create as jest.Mock).mockResolvedValue(mockPhase)

      const result = await createCareerPhase(phaseData)

      expect(mockPrisma.careerPhase.create).toHaveBeenCalledWith({
        data: phaseData,
      })
      expect(result).toEqual(mockPhase)
    })
  })

  describe('getUserCareerPhases', () => {
    it('should retrieve career phases', async () => {
      const mockPhases = [
        { id: 'p1', title: 'Phase 1', startDate: new Date('2020-01-01') },
        { id: 'p2', title: 'Phase 2', startDate: new Date('2023-01-01') },
      ]

      ;(mockPrisma.careerPhase.findMany as jest.Mock).mockResolvedValue(mockPhases)

      const result = await getUserCareerPhases('user-1')

      expect(mockPrisma.careerPhase.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { startDate: 'asc' },
      })
      expect(result).toHaveLength(2)
    })
  })

  describe('updateCareerPhase', () => {
    it('should update a career phase', async () => {
      const updates = { title: 'New Phase Title' }

      ;(mockPrisma.careerPhase.update as jest.Mock).mockResolvedValue({
        id: 'phase-1',
        ...updates,
      })

      const result = await updateCareerPhase('phase-1', updates)

      expect(result.title).toBe('New Phase Title')
    })
  })

  describe('deleteCareerPhase', () => {
    it('should delete a career phase', async () => {
      ;(mockPrisma.careerPhase.delete as jest.Mock).mockResolvedValue({ id: 'phase-1' })

      await deleteCareerPhase('phase-1')

      expect(mockPrisma.careerPhase.delete).toHaveBeenCalledWith({
        where: { id: 'phase-1' },
      })
    })
  })

  describe('markAsInflectionPoint', () => {
    it('should mark an event as an inflection point', async () => {
      const data = {
        eventId: 'event-1',
        impact: 'Major career shift',
        beforeState: 'Individual contributor',
        afterState: 'Team lead',
      }

      const mockInflection = {
        id: 'inflection-1',
        ...data,
      }

      ;(mockPrisma.inflectionPoint.create as jest.Mock).mockResolvedValue(mockInflection)

      const result = await markAsInflectionPoint(data)

      expect(mockPrisma.inflectionPoint.create).toHaveBeenCalledWith({
        data,
      })
      expect(result).toEqual(mockInflection)
    })
  })

  describe('removeInflectionPoint', () => {
    it('should remove inflection point from an event', async () => {
      ;(mockPrisma.inflectionPoint.delete as jest.Mock).mockResolvedValue({})

      await removeInflectionPoint('event-1')

      expect(mockPrisma.inflectionPoint.delete).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
      })
    })
  })

  describe('getTimelineWithPhases', () => {
    it('should return timeline with career phases overlaid', async () => {
      const mockEvents = [
        { id: 'e1', date: new Date('2021-06-01'), type: 'job' },
        { id: 'e2', date: new Date('2023-06-01'), type: 'milestone' },
      ]

      const mockPhases = [
        { id: 'p1', title: 'Phase 1', startDate: new Date('2020-01-01'), endDate: new Date('2022-12-31') },
        { id: 'p2', title: 'Phase 2', startDate: new Date('2023-01-01'), endDate: null },
      ]

      ;(mockPrisma.timelineEvent.findMany as jest.Mock).mockResolvedValue(mockEvents)
      ;(mockPrisma.careerPhase.findMany as jest.Mock).mockResolvedValue(mockPhases)

      const result = await getTimelineWithPhases('user-1')

      expect(result).toHaveProperty('events')
      expect(result).toHaveProperty('phases')
      expect(result.events).toHaveLength(2)
      expect(result.phases).toHaveLength(2)
    })
  })

  describe('getInflectionPoints', () => {
    it('should return all inflection points for a user', async () => {
      const mockEvents = [
        {
          id: 'e1',
          title: 'Big moment',
          inflectionPoint: { impact: 'Changed everything' },
        },
      ]

      ;(mockPrisma.timelineEvent.findMany as jest.Mock).mockResolvedValue(mockEvents)

      const result = await getInflectionPoints('user-1')

      expect(mockPrisma.timelineEvent.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          inflectionPoint: { isNot: null },
        },
        include: { inflectionPoint: true },
        orderBy: { date: 'desc' },
      })
      expect(result).toHaveLength(1)
    })
  })
})
