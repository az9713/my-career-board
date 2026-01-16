/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET as getPeriods, POST as createPeriod } from '@/app/api/okrs/periods/route'
import { GET as getPeriod, PUT as updatePeriod } from '@/app/api/okrs/periods/[id]/route'
import { GET as getObjectives, POST as createObjective } from '@/app/api/okrs/objectives/route'
import { GET as getObjective, PUT as updateObjective, DELETE as deleteObjective } from '@/app/api/okrs/objectives/[id]/route'
import { POST as createKeyResult } from '@/app/api/okrs/key-results/route'
import { PUT as updateKeyResult, POST as checkIn } from '@/app/api/okrs/key-results/[id]/route'
import { GET as getAnalytics } from '@/app/api/okrs/analytics/route'

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(() => Promise.resolve({ user: { id: 'user1' } })),
}))

// Mock service
jest.mock('@/lib/okrs/service', () => ({
  createOKRPeriod: jest.fn(),
  getOKRPeriodById: jest.fn(),
  getUserOKRPeriods: jest.fn(),
  updateOKRPeriod: jest.fn(),
  createObjective: jest.fn(),
  getObjectiveById: jest.fn(),
  getPeriodObjectives: jest.fn(),
  updateObjective: jest.fn(),
  deleteObjective: jest.fn(),
  createKeyResult: jest.fn(),
  getKeyResultById: jest.fn(),
  updateKeyResult: jest.fn(),
  checkInKeyResult: jest.fn(),
  calculateObjectiveProgress: jest.fn(),
  getOKRAnalytics: jest.fn(),
}))

import * as okrsService from '@/lib/okrs/service'

describe('OKRs API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/okrs/periods', () => {
    it('should return user OKR periods', async () => {
      const mockPeriods = [
        { id: 'p1', name: 'Q1 2024', status: 'active' },
        { id: 'p2', name: 'Q4 2023', status: 'completed' },
      ]
      ;(okrsService.getUserOKRPeriods as jest.Mock).mockResolvedValue(mockPeriods)

      const request = new NextRequest('http://localhost/api/okrs/periods')
      const response = await getPeriods(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.periods).toHaveLength(2)
    })
  })

  describe('POST /api/okrs/periods', () => {
    it('should create an OKR period', async () => {
      const mockPeriod = { id: 'p1', name: 'Q1 2024', type: 'quarter' }
      ;(okrsService.createOKRPeriod as jest.Mock).mockResolvedValue(mockPeriod)

      const request = new NextRequest('http://localhost/api/okrs/periods', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Q1 2024',
          type: 'quarter',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
        }),
      })
      const response = await createPeriod(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.period.name).toBe('Q1 2024')
    })
  })

  describe('GET /api/okrs/periods/[id]', () => {
    it('should return a period with objectives', async () => {
      const mockPeriod = {
        id: 'p1',
        name: 'Q1 2024',
        objectives: [{ id: 'obj1', title: 'Objective 1' }],
      }
      ;(okrsService.getOKRPeriodById as jest.Mock).mockResolvedValue(mockPeriod)

      const request = new NextRequest('http://localhost/api/okrs/periods/p1')
      const response = await getPeriod(request, { params: Promise.resolve({ id: 'p1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.period.objectives).toHaveLength(1)
    })

    it('should return 404 for non-existent period', async () => {
      ;(okrsService.getOKRPeriodById as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/okrs/periods/invalid')
      const response = await getPeriod(request, { params: Promise.resolve({ id: 'invalid' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/okrs/periods/[id]', () => {
    it('should update a period', async () => {
      const mockPeriod = { id: 'p1', status: 'completed' }
      ;(okrsService.updateOKRPeriod as jest.Mock).mockResolvedValue(mockPeriod)

      const request = new NextRequest('http://localhost/api/okrs/periods/p1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' }),
      })
      const response = await updatePeriod(request, { params: Promise.resolve({ id: 'p1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.period.status).toBe('completed')
    })
  })

  describe('GET /api/okrs/objectives', () => {
    it('should return objectives for a period', async () => {
      const mockObjectives = [
        { id: 'obj1', title: 'Objective 1' },
        { id: 'obj2', title: 'Objective 2' },
      ]
      ;(okrsService.getPeriodObjectives as jest.Mock).mockResolvedValue(mockObjectives)

      const request = new NextRequest('http://localhost/api/okrs/objectives?periodId=p1')
      const response = await getObjectives(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.objectives).toHaveLength(2)
    })
  })

  describe('POST /api/okrs/objectives', () => {
    it('should create an objective', async () => {
      const mockObjective = { id: 'obj1', title: 'Increase productivity', category: 'impact' }
      ;(okrsService.createObjective as jest.Mock).mockResolvedValue(mockObjective)

      const request = new NextRequest('http://localhost/api/okrs/objectives', {
        method: 'POST',
        body: JSON.stringify({
          periodId: 'p1',
          title: 'Increase productivity',
          category: 'impact',
        }),
      })
      const response = await createObjective(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.objective.title).toBe('Increase productivity')
    })
  })

  describe('GET /api/okrs/objectives/[id]', () => {
    it('should return an objective with key results', async () => {
      const mockObjective = {
        id: 'obj1',
        title: 'Objective 1',
        keyResults: [{ id: 'kr1', title: 'Key Result 1' }],
      }
      ;(okrsService.getObjectiveById as jest.Mock).mockResolvedValue(mockObjective)

      const request = new NextRequest('http://localhost/api/okrs/objectives/obj1')
      const response = await getObjective(request, { params: Promise.resolve({ id: 'obj1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.objective.keyResults).toHaveLength(1)
    })
  })

  describe('PUT /api/okrs/objectives/[id]', () => {
    it('should update an objective', async () => {
      const mockObjective = { id: 'obj1', status: 'at-risk' }
      ;(okrsService.updateObjective as jest.Mock).mockResolvedValue(mockObjective)

      const request = new NextRequest('http://localhost/api/okrs/objectives/obj1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'at-risk' }),
      })
      const response = await updateObjective(request, { params: Promise.resolve({ id: 'obj1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.objective.status).toBe('at-risk')
    })
  })

  describe('DELETE /api/okrs/objectives/[id]', () => {
    it('should delete an objective', async () => {
      ;(okrsService.deleteObjective as jest.Mock).mockResolvedValue({ id: 'obj1' })

      const request = new NextRequest('http://localhost/api/okrs/objectives/obj1', {
        method: 'DELETE',
      })
      const response = await deleteObjective(request, { params: Promise.resolve({ id: 'obj1' }) })

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/okrs/key-results', () => {
    it('should create a key result', async () => {
      const mockKeyResult = {
        id: 'kr1',
        title: 'Reduce deployment time',
        metricType: 'number',
        targetValue: 30,
      }
      ;(okrsService.createKeyResult as jest.Mock).mockResolvedValue(mockKeyResult)

      const request = new NextRequest('http://localhost/api/okrs/key-results', {
        method: 'POST',
        body: JSON.stringify({
          objectiveId: 'obj1',
          title: 'Reduce deployment time',
          metricType: 'number',
          targetValue: 30,
        }),
      })
      const response = await createKeyResult(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.keyResult.title).toBe('Reduce deployment time')
    })
  })

  describe('PUT /api/okrs/key-results/[id]', () => {
    it('should update a key result', async () => {
      const mockKeyResult = { id: 'kr1', currentValue: 45, progress: 50 }
      ;(okrsService.updateKeyResult as jest.Mock).mockResolvedValue(mockKeyResult)

      const request = new NextRequest('http://localhost/api/okrs/key-results/kr1', {
        method: 'PUT',
        body: JSON.stringify({ currentValue: 45 }),
      })
      const response = await updateKeyResult(request, { params: Promise.resolve({ id: 'kr1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.keyResult.progress).toBe(50)
    })
  })

  describe('POST /api/okrs/key-results/[id] (check-in)', () => {
    it('should create a check-in for a key result', async () => {
      const mockCheckIn = { id: 'ci1', value: 45, previousValue: 50 }
      ;(okrsService.checkInKeyResult as jest.Mock).mockResolvedValue(mockCheckIn)
      ;(okrsService.calculateObjectiveProgress as jest.Mock).mockResolvedValue(50)

      const request = new NextRequest('http://localhost/api/okrs/key-results/kr1', {
        method: 'POST',
        body: JSON.stringify({ value: 45, notes: 'Good progress' }),
      })
      const response = await checkIn(request, { params: Promise.resolve({ id: 'kr1' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.checkIn.value).toBe(45)
    })
  })

  describe('GET /api/okrs/analytics', () => {
    it('should return OKR analytics', async () => {
      const mockAnalytics = {
        totalObjectives: 5,
        statusBreakdown: { 'on-track': 3, 'at-risk': 2 },
        averageProgress: 65,
      }
      ;(okrsService.getOKRAnalytics as jest.Mock).mockResolvedValue(mockAnalytics)

      const request = new NextRequest('http://localhost/api/okrs/analytics')
      const response = await getAnalytics(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics.totalObjectives).toBe(5)
    })
  })
})
