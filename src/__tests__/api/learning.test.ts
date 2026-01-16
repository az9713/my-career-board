/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(() => Promise.resolve({ user: { id: 'user1' } })),
}))

// Mock service
jest.mock('@/lib/learning/service', () => ({
  createLearningResource: jest.fn(),
  getLearningResourceById: jest.fn(),
  getUserLearningResources: jest.fn(),
  updateLearningResource: jest.fn(),
  deleteLearningResource: jest.fn(),
  createCertification: jest.fn(),
  getCertificationById: jest.fn(),
  getUserCertifications: jest.fn(),
  updateCertification: jest.fn(),
  createLearningGoal: jest.fn(),
  getLearningGoalById: jest.fn(),
  getUserLearningGoals: jest.fn(),
  updateLearningGoal: jest.fn(),
  getLearningAnalytics: jest.fn(),
  getExpiringCertifications: jest.fn(),
}))

import { GET as getResources, POST as createResource } from '@/app/api/learning/resources/route'
import { GET as getResource, PUT as updateResource, DELETE as deleteResource } from '@/app/api/learning/resources/[id]/route'
import { GET as getCerts, POST as createCert } from '@/app/api/learning/certifications/route'
import { GET as getCert, PUT as updateCert } from '@/app/api/learning/certifications/[id]/route'
import { GET as getGoals, POST as createGoal } from '@/app/api/learning/goals/route'
import { GET as getGoal, PUT as updateGoal } from '@/app/api/learning/goals/[id]/route'
import { GET as getAnalytics } from '@/app/api/learning/analytics/route'
import * as learningService from '@/lib/learning/service'

describe('Learning Resources API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/learning/resources', () => {
    it('should return user learning resources', async () => {
      const mockResources = [
        { id: 'lr1', title: 'TypeScript Course', status: 'in_progress' },
        { id: 'lr2', title: 'React Book', status: 'completed' },
      ]
      ;(learningService.getUserLearningResources as jest.Mock).mockResolvedValue(mockResources)

      const request = new NextRequest('http://localhost/api/learning/resources')
      const response = await getResources(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
    })

    it('should filter by status', async () => {
      ;(learningService.getUserLearningResources as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/learning/resources?status=completed')
      await getResources(request)

      expect(learningService.getUserLearningResources).toHaveBeenCalledWith(
        'user1',
        { status: 'completed' }
      )
    })
  })

  describe('POST /api/learning/resources', () => {
    it('should create a learning resource', async () => {
      const mockResource = { id: 'lr1', title: 'TypeScript Course' }
      ;(learningService.createLearningResource as jest.Mock).mockResolvedValue(mockResource)

      const request = new NextRequest('http://localhost/api/learning/resources', {
        method: 'POST',
        body: JSON.stringify({
          title: 'TypeScript Course',
          type: 'course',
          provider: 'Udemy',
        }),
      })

      const response = await createResource(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('lr1')
    })

    it('should return 400 for missing fields', async () => {
      const request = new NextRequest('http://localhost/api/learning/resources', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      })

      const response = await createResource(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/learning/resources/[id]', () => {
    it('should return a learning resource', async () => {
      const mockResource = { id: 'lr1', title: 'TypeScript Course' }
      ;(learningService.getLearningResourceById as jest.Mock).mockResolvedValue(mockResource)

      const request = new NextRequest('http://localhost/api/learning/resources/lr1')
      const response = await getResource(request, { params: Promise.resolve({ id: 'lr1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('lr1')
    })

    it('should return 404 for non-existent resource', async () => {
      ;(learningService.getLearningResourceById as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/learning/resources/notfound')
      const response = await getResource(request, { params: Promise.resolve({ id: 'notfound' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/learning/resources/[id]', () => {
    it('should update a learning resource', async () => {
      const mockResource = { id: 'lr1', progress: 75 }
      ;(learningService.updateLearningResource as jest.Mock).mockResolvedValue(mockResource)

      const request = new NextRequest('http://localhost/api/learning/resources/lr1', {
        method: 'PUT',
        body: JSON.stringify({ progress: 75 }),
      })

      const response = await updateResource(request, { params: Promise.resolve({ id: 'lr1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.progress).toBe(75)
    })
  })

  describe('DELETE /api/learning/resources/[id]', () => {
    it('should delete a learning resource', async () => {
      ;(learningService.deleteLearningResource as jest.Mock).mockResolvedValue({ id: 'lr1' })

      const request = new NextRequest('http://localhost/api/learning/resources/lr1', {
        method: 'DELETE',
      })

      const response = await deleteResource(request, { params: Promise.resolve({ id: 'lr1' }) })

      expect(response.status).toBe(204)
    })
  })
})

describe('Certifications API', () => {
  describe('GET /api/learning/certifications', () => {
    it('should return user certifications', async () => {
      const mockCerts = [
        { id: 'c1', name: 'AWS', status: 'active' },
        { id: 'c2', name: 'GCP', status: 'active' },
      ]
      ;(learningService.getUserCertifications as jest.Mock).mockResolvedValue(mockCerts)

      const request = new NextRequest('http://localhost/api/learning/certifications')
      const response = await getCerts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
    })
  })

  describe('POST /api/learning/certifications', () => {
    it('should create a certification', async () => {
      const mockCert = { id: 'c1', name: 'AWS Solutions Architect' }
      ;(learningService.createCertification as jest.Mock).mockResolvedValue(mockCert)

      const request = new NextRequest('http://localhost/api/learning/certifications', {
        method: 'POST',
        body: JSON.stringify({
          name: 'AWS Solutions Architect',
          issuer: 'Amazon',
          earnedAt: '2024-01-01',
        }),
      })

      const response = await createCert(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('c1')
    })
  })

  describe('GET /api/learning/certifications/[id]', () => {
    it('should return a certification', async () => {
      const mockCert = { id: 'c1', name: 'AWS' }
      ;(learningService.getCertificationById as jest.Mock).mockResolvedValue(mockCert)

      const request = new NextRequest('http://localhost/api/learning/certifications/c1')
      const response = await getCert(request, { params: Promise.resolve({ id: 'c1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('c1')
    })
  })

  describe('PUT /api/learning/certifications/[id]', () => {
    it('should update a certification', async () => {
      const mockCert = { id: 'c1', status: 'expired' }
      ;(learningService.updateCertification as jest.Mock).mockResolvedValue(mockCert)

      const request = new NextRequest('http://localhost/api/learning/certifications/c1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'expired' }),
      })

      const response = await updateCert(request, { params: Promise.resolve({ id: 'c1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('expired')
    })
  })
})

describe('Learning Goals API', () => {
  describe('GET /api/learning/goals', () => {
    it('should return user learning goals', async () => {
      const mockGoals = [
        { id: 'g1', title: 'Master TypeScript', progress: 50 },
        { id: 'g2', title: 'Learn React', progress: 25 },
      ]
      ;(learningService.getUserLearningGoals as jest.Mock).mockResolvedValue(mockGoals)

      const request = new NextRequest('http://localhost/api/learning/goals')
      const response = await getGoals(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
    })
  })

  describe('POST /api/learning/goals', () => {
    it('should create a learning goal', async () => {
      const mockGoal = { id: 'g1', title: 'Master TypeScript' }
      ;(learningService.createLearningGoal as jest.Mock).mockResolvedValue(mockGoal)

      const request = new NextRequest('http://localhost/api/learning/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Master TypeScript',
          targetDate: '2024-12-31',
        }),
      })

      const response = await createGoal(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('g1')
    })
  })

  describe('GET /api/learning/goals/[id]', () => {
    it('should return a learning goal', async () => {
      const mockGoal = { id: 'g1', title: 'Master TypeScript' }
      ;(learningService.getLearningGoalById as jest.Mock).mockResolvedValue(mockGoal)

      const request = new NextRequest('http://localhost/api/learning/goals/g1')
      const response = await getGoal(request, { params: Promise.resolve({ id: 'g1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('g1')
    })
  })

  describe('PUT /api/learning/goals/[id]', () => {
    it('should update a learning goal', async () => {
      const mockGoal = { id: 'g1', progress: 75 }
      ;(learningService.updateLearningGoal as jest.Mock).mockResolvedValue(mockGoal)

      const request = new NextRequest('http://localhost/api/learning/goals/g1', {
        method: 'PUT',
        body: JSON.stringify({ progress: 75 }),
      })

      const response = await updateGoal(request, { params: Promise.resolve({ id: 'g1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.progress).toBe(75)
    })
  })
})

describe('Analytics API', () => {
  describe('GET /api/learning/analytics', () => {
    it('should return learning analytics', async () => {
      const mockAnalytics = {
        totalResources: 10,
        completedResources: 5,
        activeCertifications: 3,
      }
      ;(learningService.getLearningAnalytics as jest.Mock).mockResolvedValue(mockAnalytics)

      const request = new NextRequest('http://localhost/api/learning/analytics')
      const response = await getAnalytics(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.totalResources).toBe(10)
    })
  })
})
