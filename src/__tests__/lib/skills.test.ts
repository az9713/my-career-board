import {
  createSkill,
  getSkillById,
  getUserSkills,
  updateSkill,
  deleteSkill,
  createSkillGap,
  getUserSkillGaps,
  updateSkillGap,
  createSkillGoal,
  getUserSkillGoals,
  updateSkillGoalProgress,
  getMarketDemandData,
  analyzeSkillGaps,
  getSkillsAnalytics,
} from '@/lib/skills/service'

// Mock Prisma client
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    skill: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    skillGap: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    skillGoal: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    marketSkillDemand: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

import prisma from '@/lib/prisma/client'

describe('Skills Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createSkill', () => {
    it('should create a new skill', async () => {
      const mockSkill = {
        id: 'skill1',
        userId: 'user1',
        name: 'TypeScript',
        category: 'technical',
        proficiency: 4,
        targetLevel: 5,
      }
      ;(prisma.skill.create as jest.Mock).mockResolvedValue(mockSkill)

      const result = await createSkill({
        userId: 'user1',
        name: 'TypeScript',
        category: 'technical',
        proficiency: 4,
        targetLevel: 5,
      })

      expect(result).toEqual(mockSkill)
      expect(prisma.skill.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user1',
          name: 'TypeScript',
          category: 'technical',
          proficiency: 4,
        }),
      })
    })
  })

  describe('getSkillById', () => {
    it('should get skill with market demand', async () => {
      const mockSkill = {
        id: 'skill1',
        name: 'TypeScript',
        marketDemands: [
          { marketDemand: { demandLevel: 5, growthTrend: 'rising' } },
        ],
      }
      ;(prisma.skill.findUnique as jest.Mock).mockResolvedValue(mockSkill)

      const result = await getSkillById('skill1')

      expect(result).toEqual(mockSkill)
    })

    it('should return null for non-existent skill', async () => {
      ;(prisma.skill.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getSkillById('invalid')

      expect(result).toBeNull()
    })
  })

  describe('getUserSkills', () => {
    it('should get all skills for a user', async () => {
      const mockSkills = [
        { id: 'skill1', name: 'TypeScript', proficiency: 4 },
        { id: 'skill2', name: 'React', proficiency: 5 },
      ]
      ;(prisma.skill.findMany as jest.Mock).mockResolvedValue(mockSkills)

      const result = await getUserSkills('user1')

      expect(result).toEqual(mockSkills)
      expect(prisma.skill.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      })
    })

    it('should filter by category', async () => {
      const mockSkills = [{ id: 'skill1', name: 'TypeScript', category: 'technical' }]
      ;(prisma.skill.findMany as jest.Mock).mockResolvedValue(mockSkills)

      const result = await getUserSkills('user1', 'technical')

      expect(result).toEqual(mockSkills)
      expect(prisma.skill.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1', category: 'technical' },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      })
    })
  })

  describe('updateSkill', () => {
    it('should update skill proficiency', async () => {
      const mockSkill = { id: 'skill1', proficiency: 5 }
      ;(prisma.skill.update as jest.Mock).mockResolvedValue(mockSkill)

      const result = await updateSkill('skill1', { proficiency: 5 })

      expect(result.proficiency).toBe(5)
    })
  })

  describe('deleteSkill', () => {
    it('should delete a skill', async () => {
      const mockSkill = { id: 'skill1' }
      ;(prisma.skill.delete as jest.Mock).mockResolvedValue(mockSkill)

      const result = await deleteSkill('skill1')

      expect(result).toEqual(mockSkill)
      expect(prisma.skill.delete).toHaveBeenCalledWith({
        where: { id: 'skill1' },
      })
    })
  })

  describe('createSkillGap', () => {
    it('should create a skill gap', async () => {
      const mockGap = {
        id: 'gap1',
        userId: 'user1',
        skillName: 'Machine Learning',
        currentLevel: 2,
        requiredLevel: 4,
        gapSize: 2,
        priority: 'high',
        source: 'market-demand',
      }
      ;(prisma.skillGap.create as jest.Mock).mockResolvedValue(mockGap)

      const result = await createSkillGap({
        userId: 'user1',
        skillName: 'Machine Learning',
        currentLevel: 2,
        requiredLevel: 4,
        priority: 'high',
        source: 'market-demand',
      })

      expect(result).toEqual(mockGap)
      expect(result.gapSize).toBe(2)
    })
  })

  describe('getUserSkillGaps', () => {
    it('should get all skill gaps for a user', async () => {
      const mockGaps = [
        { id: 'gap1', skillName: 'ML', gapSize: 2, priority: 'high' },
        { id: 'gap2', skillName: 'DevOps', gapSize: 1, priority: 'medium' },
      ]
      ;(prisma.skillGap.findMany as jest.Mock).mockResolvedValue(mockGaps)

      const result = await getUserSkillGaps('user1')

      expect(result).toEqual(mockGaps)
    })

    it('should filter by priority', async () => {
      const mockGaps = [{ id: 'gap1', priority: 'critical' }]
      ;(prisma.skillGap.findMany as jest.Mock).mockResolvedValue(mockGaps)

      const result = await getUserSkillGaps('user1', { priority: 'critical' })

      expect(result).toEqual(mockGaps)
    })
  })

  describe('updateSkillGap', () => {
    it('should update skill gap status', async () => {
      const mockGap = { id: 'gap1', status: 'in-progress' }
      ;(prisma.skillGap.update as jest.Mock).mockResolvedValue(mockGap)

      const result = await updateSkillGap('gap1', { status: 'in-progress' })

      expect(result.status).toBe('in-progress')
    })
  })

  describe('SkillGoal', () => {
    it('should create a skill goal', async () => {
      const mockGoal = {
        id: 'goal1',
        userId: 'user1',
        skillName: 'Rust',
        targetLevel: 4,
        deadline: new Date('2024-12-31'),
        progress: 0,
      }
      ;(prisma.skillGoal.create as jest.Mock).mockResolvedValue(mockGoal)

      const result = await createSkillGoal({
        userId: 'user1',
        skillName: 'Rust',
        targetLevel: 4,
        deadline: new Date('2024-12-31'),
        reason: 'Career growth',
      })

      expect(result).toEqual(mockGoal)
    })

    it('should get all skill goals for a user', async () => {
      const mockGoals = [
        { id: 'goal1', skillName: 'Rust', progress: 25 },
        { id: 'goal2', skillName: 'Go', progress: 50 },
      ]
      ;(prisma.skillGoal.findMany as jest.Mock).mockResolvedValue(mockGoals)

      const result = await getUserSkillGoals('user1')

      expect(result).toEqual(mockGoals)
    })

    it('should update skill goal progress', async () => {
      const mockGoal = { id: 'goal1', progress: 75 }
      ;(prisma.skillGoal.update as jest.Mock).mockResolvedValue(mockGoal)

      const result = await updateSkillGoalProgress('goal1', 75)

      expect(result.progress).toBe(75)
    })
  })

  describe('getMarketDemandData', () => {
    it('should get market demand for a skill', async () => {
      const mockDemand = {
        id: 'md1',
        skillName: 'TypeScript',
        demandLevel: 5,
        growthTrend: 'rising',
        salaryImpact: 'high',
      }
      ;(prisma.marketSkillDemand.findFirst as jest.Mock).mockResolvedValue(mockDemand)

      const result = await getMarketDemandData('TypeScript')

      expect(result).toEqual(mockDemand)
    })
  })

  describe('analyzeSkillGaps', () => {
    it('should analyze gaps between current skills and market demand', async () => {
      const mockSkills = [
        { id: 'skill1', name: 'TypeScript', proficiency: 4 },
        { id: 'skill2', name: 'React', proficiency: 3 },
      ]
      const mockDemand = [
        { skillName: 'TypeScript', demandLevel: 5 },
        { skillName: 'Machine Learning', demandLevel: 5 },
      ]
      ;(prisma.skill.findMany as jest.Mock).mockResolvedValue(mockSkills)
      ;(prisma.marketSkillDemand.findMany as jest.Mock).mockResolvedValue(mockDemand)

      const result = await analyzeSkillGaps('user1')

      expect(result).toBeDefined()
      expect(result.gaps).toBeDefined()
      expect(result.recommendations).toBeDefined()
    })
  })

  describe('getSkillsAnalytics', () => {
    it('should return skills analytics', async () => {
      const mockSkills = [
        { id: 'skill1', category: 'technical', proficiency: 4 },
        { id: 'skill2', category: 'technical', proficiency: 5 },
        { id: 'skill3', category: 'soft-skill', proficiency: 3 },
      ]
      const mockGaps = [
        { id: 'gap1', priority: 'high', status: 'open' },
        { id: 'gap2', priority: 'medium', status: 'closed' },
      ]
      const mockGoals = [
        { id: 'goal1', status: 'active', progress: 50 },
        { id: 'goal2', status: 'completed', progress: 100 },
      ]
      ;(prisma.skill.findMany as jest.Mock).mockResolvedValue(mockSkills)
      ;(prisma.skillGap.findMany as jest.Mock).mockResolvedValue(mockGaps)
      ;(prisma.skillGoal.findMany as jest.Mock).mockResolvedValue(mockGoals)

      const result = await getSkillsAnalytics('user1')

      expect(result.totalSkills).toBe(3)
      expect(result.byCategory).toBeDefined()
      expect(result.averageProficiency).toBeDefined()
      expect(result.openGaps).toBe(1)
      expect(result.activeGoals).toBe(1)
    })
  })
})
