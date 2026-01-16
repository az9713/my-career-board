/**
 * @jest-environment node
 */

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock skills service
jest.mock('@/lib/skills/service', () => ({
  createSkill: jest.fn(),
  getSkillById: jest.fn(),
  getUserSkills: jest.fn(),
  updateSkill: jest.fn(),
  deleteSkill: jest.fn(),
  createSkillGap: jest.fn(),
  getUserSkillGaps: jest.fn(),
  updateSkillGap: jest.fn(),
  createSkillGoal: jest.fn(),
  getUserSkillGoals: jest.fn(),
  updateSkillGoalProgress: jest.fn(),
  analyzeSkillGaps: jest.fn(),
  getSkillsAnalytics: jest.fn(),
}))

import { auth } from '@/auth'
import * as skillsService from '@/lib/skills/service'
import { GET, POST } from '@/app/api/skills/route'
import { GET as getById, PUT, DELETE } from '@/app/api/skills/[id]/route'
import { GET as getGaps, POST as createGap } from '@/app/api/skills/gaps/route'
import { GET as getGoals, POST as createGoal } from '@/app/api/skills/goals/route'
import { PUT as updateGoal } from '@/app/api/skills/goals/[id]/route'
import { GET as getAnalysis } from '@/app/api/skills/analyze/route'
import { GET as getAnalytics } from '@/app/api/skills/analytics/route'

const mockAuth = auth as jest.Mock

describe('Skills API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/skills', () => {
    it('should return user skills', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockSkills = [
        { id: 'skill1', name: 'TypeScript', proficiency: 4 },
        { id: 'skill2', name: 'React', proficiency: 5 },
      ]
      ;(skillsService.getUserSkills as jest.Mock).mockResolvedValue(mockSkills)

      const request = new Request('http://localhost/api/skills')
      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.skills).toEqual(mockSkills)
    })

    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new Request('http://localhost/api/skills')
      const response = await GET(request as any)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/skills', () => {
    it('should create a skill', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockSkill = { id: 'skill1', name: 'TypeScript', proficiency: 4 }
      ;(skillsService.createSkill as jest.Mock).mockResolvedValue(mockSkill)

      const request = new Request('http://localhost/api/skills', {
        method: 'POST',
        body: JSON.stringify({
          name: 'TypeScript',
          category: 'technical',
          proficiency: 4,
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.skill).toEqual(mockSkill)
    })
  })

  describe('GET /api/skills/[id]', () => {
    it('should return skill by id', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockSkill = { id: 'skill1', name: 'TypeScript', userId: 'user1' }
      ;(skillsService.getSkillById as jest.Mock).mockResolvedValue(mockSkill)

      const request = new Request('http://localhost/api/skills/skill1')
      const response = await getById(request as any, { params: Promise.resolve({ id: 'skill1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.skill).toEqual(mockSkill)
    })

    it('should return 404 if not found', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      ;(skillsService.getSkillById as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/skills/invalid')
      const response = await getById(request as any, { params: Promise.resolve({ id: 'invalid' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/skills/[id]', () => {
    it('should update skill', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockSkill = { id: 'skill1', proficiency: 5, userId: 'user1' }
      ;(skillsService.getSkillById as jest.Mock).mockResolvedValue({ id: 'skill1', userId: 'user1' })
      ;(skillsService.updateSkill as jest.Mock).mockResolvedValue(mockSkill)

      const request = new Request('http://localhost/api/skills/skill1', {
        method: 'PUT',
        body: JSON.stringify({ proficiency: 5 }),
      })

      const response = await PUT(request as any, { params: Promise.resolve({ id: 'skill1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.skill.proficiency).toBe(5)
    })
  })

  describe('DELETE /api/skills/[id]', () => {
    it('should delete skill', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      ;(skillsService.getSkillById as jest.Mock).mockResolvedValue({ id: 'skill1', userId: 'user1' })
      ;(skillsService.deleteSkill as jest.Mock).mockResolvedValue({ id: 'skill1' })

      const request = new Request('http://localhost/api/skills/skill1', { method: 'DELETE' })
      const response = await DELETE(request as any, { params: Promise.resolve({ id: 'skill1' }) })

      expect(response.status).toBe(200)
    })
  })

  describe('Skill Gaps API', () => {
    it('should get skill gaps', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockGaps = [
        { id: 'gap1', skillName: 'ML', gapSize: 2 },
      ]
      ;(skillsService.getUserSkillGaps as jest.Mock).mockResolvedValue(mockGaps)

      const request = new Request('http://localhost/api/skills/gaps')
      const response = await getGaps(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.gaps).toEqual(mockGaps)
    })

    it('should create skill gap', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockGap = { id: 'gap1', skillName: 'ML', gapSize: 2 }
      ;(skillsService.createSkillGap as jest.Mock).mockResolvedValue(mockGap)

      const request = new Request('http://localhost/api/skills/gaps', {
        method: 'POST',
        body: JSON.stringify({
          skillName: 'ML',
          currentLevel: 2,
          requiredLevel: 4,
          priority: 'high',
          source: 'market-demand',
        }),
      })

      const response = await createGap(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.gap).toEqual(mockGap)
    })
  })

  describe('Skill Goals API', () => {
    it('should get skill goals', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockGoals = [
        { id: 'goal1', skillName: 'Rust', progress: 25 },
      ]
      ;(skillsService.getUserSkillGoals as jest.Mock).mockResolvedValue(mockGoals)

      const request = new Request('http://localhost/api/skills/goals')
      const response = await getGoals(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.goals).toEqual(mockGoals)
    })

    it('should create skill goal', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockGoal = { id: 'goal1', skillName: 'Rust', targetLevel: 4 }
      ;(skillsService.createSkillGoal as jest.Mock).mockResolvedValue(mockGoal)

      const request = new Request('http://localhost/api/skills/goals', {
        method: 'POST',
        body: JSON.stringify({
          skillName: 'Rust',
          targetLevel: 4,
          reason: 'Career growth',
        }),
      })

      const response = await createGoal(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.goal).toEqual(mockGoal)
    })

    it('should update skill goal progress', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockGoal = { id: 'goal1', progress: 75 }
      ;(skillsService.updateSkillGoalProgress as jest.Mock).mockResolvedValue(mockGoal)

      const request = new Request('http://localhost/api/skills/goals/goal1', {
        method: 'PUT',
        body: JSON.stringify({ progress: 75 }),
      })

      const response = await updateGoal(request as any, { params: Promise.resolve({ id: 'goal1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.goal.progress).toBe(75)
    })
  })

  describe('GET /api/skills/analyze', () => {
    it('should return skill gap analysis', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockAnalysis = {
        gaps: [{ skillName: 'ML', gapSize: 2 }],
        recommendations: [{ type: 'acquire', skillName: 'ML' }],
        summary: { totalGaps: 1 },
      }
      ;(skillsService.analyzeSkillGaps as jest.Mock).mockResolvedValue(mockAnalysis)

      const request = new Request('http://localhost/api/skills/analyze')
      const response = await getAnalysis(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analysis.gaps).toBeDefined()
      expect(data.analysis.recommendations).toBeDefined()
    })
  })

  describe('GET /api/skills/analytics', () => {
    it('should return skills analytics', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockAnalytics = {
        totalSkills: 10,
        averageProficiency: 3.5,
        openGaps: 3,
      }
      ;(skillsService.getSkillsAnalytics as jest.Mock).mockResolvedValue(mockAnalytics)

      const request = new Request('http://localhost/api/skills/analytics')
      const response = await getAnalytics(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics.totalSkills).toBe(10)
    })
  })
})
