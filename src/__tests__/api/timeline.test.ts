/**
 * @jest-environment node
 */

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock timeline service
jest.mock('@/lib/timeline/service', () => ({
  createTimelineEvent: jest.fn(),
  getTimelineEventById: jest.fn(),
  getUserTimeline: jest.fn(),
  updateTimelineEvent: jest.fn(),
  deleteTimelineEvent: jest.fn(),
  createCareerPhase: jest.fn(),
  getUserCareerPhases: jest.fn(),
  updateCareerPhase: jest.fn(),
  deleteCareerPhase: jest.fn(),
  getTimelineWithPhases: jest.fn(),
  getInflectionPoints: jest.fn(),
  markAsInflectionPoint: jest.fn(),
}))

import { auth } from '@/auth'
import {
  createTimelineEvent,
  getTimelineEventById,
  getUserTimeline,
  updateTimelineEvent,
  deleteTimelineEvent,
  getTimelineWithPhases,
  getInflectionPoints,
} from '@/lib/timeline/service'
import { GET, POST } from '@/app/api/timeline/route'
import { GET as getById, PUT, DELETE } from '@/app/api/timeline/[id]/route'
import { GET as getWithPhases } from '@/app/api/timeline/full/route'
import { GET as getInflections } from '@/app/api/timeline/inflection-points/route'

const mockAuth = auth as jest.Mock

describe('Timeline API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/timeline', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new Request('http://localhost/api/timeline')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return user timeline', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockEvents = [
        { id: 'e1', title: 'Event 1', type: 'job' },
        { id: 'e2', title: 'Event 2', type: 'milestone' },
      ]
      ;(getUserTimeline as jest.Mock).mockResolvedValue(mockEvents)

      const request = new Request('http://localhost/api/timeline')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toHaveLength(2)
    })

    it('should filter by type', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
      ;(getUserTimeline as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost/api/timeline?type=job')
      await GET(request)

      expect(getUserTimeline).toHaveBeenCalledWith('user-1', { type: 'job' })
    })
  })

  describe('POST /api/timeline', () => {
    it('should create a new timeline event', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const eventData = {
        type: 'job',
        title: 'Started at Company X',
        date: '2024-01-15',
        importance: 5,
      }

      const mockEvent = { id: 'e1', ...eventData, userId: 'user-1' }
      ;(createTimelineEvent as jest.Mock).mockResolvedValue(mockEvent)

      const request = new Request('http://localhost/api/timeline', {
        method: 'POST',
        body: JSON.stringify(eventData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.event.id).toBe('e1')
    })

    it('should return 400 for missing required fields', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const request = new Request('http://localhost/api/timeline', {
        method: 'POST',
        body: JSON.stringify({ description: 'No title or date' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/timeline/[id]', () => {
    it('should return event by id', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockEvent = { id: 'e1', userId: 'user-1', title: 'Event' }
      ;(getTimelineEventById as jest.Mock).mockResolvedValue(mockEvent)

      const request = new Request('http://localhost/api/timeline/e1')
      const response = await getById(request, { params: Promise.resolve({ id: 'e1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.event.id).toBe('e1')
    })

    it('should return 404 for non-existent event', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
      ;(getTimelineEventById as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/timeline/non-existent')
      const response = await getById(request, { params: Promise.resolve({ id: 'non-existent' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/timeline/[id]', () => {
    it('should update a timeline event', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockEvent = { id: 'e1', userId: 'user-1', title: 'Event' }
      ;(getTimelineEventById as jest.Mock).mockResolvedValue(mockEvent)

      const mockUpdated = { ...mockEvent, title: 'Updated Event' }
      ;(updateTimelineEvent as jest.Mock).mockResolvedValue(mockUpdated)

      const request = new Request('http://localhost/api/timeline/e1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Event' }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'e1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.event.title).toBe('Updated Event')
    })
  })

  describe('DELETE /api/timeline/[id]', () => {
    it('should delete a timeline event', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockEvent = { id: 'e1', userId: 'user-1', title: 'Event' }
      ;(getTimelineEventById as jest.Mock).mockResolvedValue(mockEvent)
      ;(deleteTimelineEvent as jest.Mock).mockResolvedValue(mockEvent)

      const request = new Request('http://localhost/api/timeline/e1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'e1' }) })

      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/timeline/full', () => {
    it('should return timeline with phases', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockData = {
        events: [{ id: 'e1', title: 'Event' }],
        phases: [{ id: 'p1', title: 'Phase 1' }],
      }
      ;(getTimelineWithPhases as jest.Mock).mockResolvedValue(mockData)

      const request = new Request('http://localhost/api/timeline/full')
      const response = await getWithPhases(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toHaveLength(1)
      expect(data.phases).toHaveLength(1)
    })
  })

  describe('GET /api/timeline/inflection-points', () => {
    it('should return inflection points', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockEvents = [
        { id: 'e1', title: 'Big moment', inflectionPoint: { impact: 'Changed everything' } },
      ]
      ;(getInflectionPoints as jest.Mock).mockResolvedValue(mockEvents)

      const request = new Request('http://localhost/api/timeline/inflection-points')
      const response = await getInflections(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.inflectionPoints).toHaveLength(1)
    })
  })
})
