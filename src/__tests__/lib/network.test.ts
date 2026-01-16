import {
  createContact,
  getContactById,
  getUserContacts,
  updateContact,
  deleteContact,
  logInteraction,
  getContactInteractions,
  getUpcomingFollowUps,
  createNetworkingGoal,
  getUserNetworkingGoals,
  updateNetworkingGoalProgress,
  getNetworkAnalytics,
} from '@/lib/network/service'

// Mock Prisma client
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    contact: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    interaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    networkingGoal: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import prisma from '@/lib/prisma/client'

describe('Network Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createContact', () => {
    it('should create a new contact', async () => {
      const mockContact = {
        id: 'contact1',
        userId: 'user1',
        name: 'Jane Smith',
        email: 'jane@example.com',
        company: 'Tech Corp',
        title: 'VP Engineering',
        relationship: 'mentor',
        strength: 4,
        notes: 'Met at conference',
        linkedinUrl: 'https://linkedin.com/in/janesmith',
        lastContactAt: null,
        nextFollowUp: null,
        tags: '["tech", "leadership"]',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.contact.create as jest.Mock).mockResolvedValue(mockContact)

      const result = await createContact({
        userId: 'user1',
        name: 'Jane Smith',
        email: 'jane@example.com',
        company: 'Tech Corp',
        title: 'VP Engineering',
        relationship: 'mentor',
        strength: 4,
        notes: 'Met at conference',
        linkedinUrl: 'https://linkedin.com/in/janesmith',
        tags: ['tech', 'leadership'],
      })

      expect(result).toEqual(mockContact)
      expect(prisma.contact.create).toHaveBeenCalled()
    })
  })

  describe('getContactById', () => {
    it('should return a contact with interactions', async () => {
      const mockContact = {
        id: 'contact1',
        userId: 'user1',
        name: 'Jane Smith',
        email: 'jane@example.com',
        company: 'Tech Corp',
        title: 'VP Engineering',
        relationship: 'mentor',
        strength: 4,
        notes: null,
        linkedinUrl: null,
        lastContactAt: null,
        nextFollowUp: null,
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        interactions: [
          { id: 'int1', type: 'meeting', date: new Date(), summary: 'Career discussion' },
        ],
      }

      ;(prisma.contact.findUnique as jest.Mock).mockResolvedValue(mockContact)

      const result = await getContactById('contact1')

      expect(result).toEqual(mockContact)
      expect(prisma.contact.findUnique).toHaveBeenCalledWith({
        where: { id: 'contact1' },
        include: { interactions: { orderBy: { date: 'desc' }, take: 10 } },
      })
    })
  })

  describe('getUserContacts', () => {
    it('should return contacts filtered by relationship', async () => {
      const mockContacts = [
        { id: 'c1', name: 'Mentor 1', relationship: 'mentor', strength: 5 },
        { id: 'c2', name: 'Mentor 2', relationship: 'mentor', strength: 4 },
      ]

      ;(prisma.contact.findMany as jest.Mock).mockResolvedValue(mockContacts)

      const result = await getUserContacts('user1', { relationship: 'mentor' })

      expect(result).toEqual(mockContacts)
      expect(prisma.contact.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1', relationship: 'mentor' },
        orderBy: { strength: 'desc' },
      })
    })

    it('should return all contacts when no filter', async () => {
      const mockContacts = [
        { id: 'c1', name: 'Contact 1', relationship: 'mentor' },
        { id: 'c2', name: 'Contact 2', relationship: 'peer' },
      ]

      ;(prisma.contact.findMany as jest.Mock).mockResolvedValue(mockContacts)

      const result = await getUserContacts('user1')

      expect(result).toEqual(mockContacts)
    })
  })

  describe('updateContact', () => {
    it('should update contact details', async () => {
      const mockContact = {
        id: 'contact1',
        name: 'Jane Smith',
        strength: 5,
        notes: 'Updated notes',
      }

      ;(prisma.contact.update as jest.Mock).mockResolvedValue(mockContact)

      const result = await updateContact('contact1', {
        strength: 5,
        notes: 'Updated notes',
      })

      expect(result.strength).toBe(5)
      expect(prisma.contact.update).toHaveBeenCalled()
    })
  })

  describe('deleteContact', () => {
    it('should delete a contact', async () => {
      ;(prisma.contact.delete as jest.Mock).mockResolvedValue({ id: 'contact1' })

      await deleteContact('contact1')

      expect(prisma.contact.delete).toHaveBeenCalledWith({
        where: { id: 'contact1' },
      })
    })
  })

  describe('logInteraction', () => {
    it('should log an interaction and update last contact date', async () => {
      const interactionDate = new Date()
      const mockInteraction = {
        id: 'int1',
        contactId: 'contact1',
        type: 'coffee',
        date: interactionDate,
        summary: 'Career advice session',
        notes: 'Discussed promotion path',
        followUpNeeded: true,
        followUpDate: new Date('2024-04-01'),
        sentiment: 'positive',
        createdAt: new Date(),
      }

      ;(prisma.interaction.create as jest.Mock).mockResolvedValue(mockInteraction)
      ;(prisma.contact.update as jest.Mock).mockResolvedValue({})

      const result = await logInteraction({
        contactId: 'contact1',
        type: 'coffee',
        date: interactionDate,
        summary: 'Career advice session',
        notes: 'Discussed promotion path',
        followUpNeeded: true,
        followUpDate: new Date('2024-04-01'),
        sentiment: 'positive',
      })

      expect(result).toEqual(mockInteraction)
      expect(prisma.interaction.create).toHaveBeenCalled()
      expect(prisma.contact.update).toHaveBeenCalledWith({
        where: { id: 'contact1' },
        data: { lastContactAt: interactionDate },
      })
    })
  })

  describe('getContactInteractions', () => {
    it('should return interactions for a contact', async () => {
      const mockInteractions = [
        { id: 'int1', type: 'meeting', date: new Date('2024-03-01') },
        { id: 'int2', type: 'email', date: new Date('2024-02-15') },
      ]

      ;(prisma.interaction.findMany as jest.Mock).mockResolvedValue(mockInteractions)

      const result = await getContactInteractions('contact1')

      expect(result).toEqual(mockInteractions)
      expect(prisma.interaction.findMany).toHaveBeenCalledWith({
        where: { contactId: 'contact1' },
        orderBy: { date: 'desc' },
      })
    })
  })

  describe('getUpcomingFollowUps', () => {
    it('should return contacts needing follow-up', async () => {
      const mockContacts = [
        { id: 'c1', name: 'Contact 1', nextFollowUp: new Date('2024-03-15') },
        { id: 'c2', name: 'Contact 2', nextFollowUp: new Date('2024-03-20') },
      ]

      ;(prisma.contact.findMany as jest.Mock).mockResolvedValue(mockContacts)

      const result = await getUpcomingFollowUps('user1', 7)

      expect(result).toHaveLength(2)
      expect(prisma.contact.findMany).toHaveBeenCalled()
    })
  })

  describe('createNetworkingGoal', () => {
    it('should create a networking goal', async () => {
      const mockGoal = {
        id: 'goal1',
        userId: 'user1',
        title: 'Expand mentor network',
        description: 'Find 3 new mentors in tech',
        targetCount: 3,
        currentCount: 0,
        category: 'find-mentor',
        deadline: new Date('2024-06-30'),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.networkingGoal.create as jest.Mock).mockResolvedValue(mockGoal)

      const result = await createNetworkingGoal({
        userId: 'user1',
        title: 'Expand mentor network',
        description: 'Find 3 new mentors in tech',
        targetCount: 3,
        category: 'find-mentor',
        deadline: new Date('2024-06-30'),
      })

      expect(result).toEqual(mockGoal)
    })
  })

  describe('getUserNetworkingGoals', () => {
    it('should return active networking goals', async () => {
      const mockGoals = [
        { id: 'g1', title: 'Goal 1', status: 'active' },
        { id: 'g2', title: 'Goal 2', status: 'active' },
      ]

      ;(prisma.networkingGoal.findMany as jest.Mock).mockResolvedValue(mockGoals)

      const result = await getUserNetworkingGoals('user1', 'active')

      expect(result).toEqual(mockGoals)
    })
  })

  describe('updateNetworkingGoalProgress', () => {
    it('should update goal progress and mark complete when target reached', async () => {
      const mockGoal = {
        id: 'goal1',
        targetCount: 3,
        currentCount: 3,
        status: 'completed',
      }

      ;(prisma.networkingGoal.update as jest.Mock).mockResolvedValue(mockGoal)
      ;(prisma.networkingGoal.findUnique as jest.Mock).mockResolvedValue({
        targetCount: 3,
      })

      const result = await updateNetworkingGoalProgress('goal1', 3)

      expect(result.status).toBe('completed')
    })
  })

  describe('getNetworkAnalytics', () => {
    it('should return network analytics', async () => {
      ;(prisma.contact.count as jest.Mock).mockResolvedValue(25)
      ;(prisma.contact.groupBy as jest.Mock).mockResolvedValue([
        { relationship: 'mentor', _count: { id: 5 } },
        { relationship: 'peer', _count: { id: 15 } },
        { relationship: 'mentee', _count: { id: 5 } },
      ])
      ;(prisma.interaction.count as jest.Mock).mockResolvedValue(50)
      ;(prisma.contact.findMany as jest.Mock).mockResolvedValue([
        { id: 'c1', name: 'Stale Contact', lastContactAt: new Date('2023-01-01') },
      ])

      const result = await getNetworkAnalytics('user1')

      expect(result.totalContacts).toBe(25)
      expect(result.byRelationship).toBeDefined()
      expect(result.totalInteractions).toBe(50)
      expect(result.staleContacts).toHaveLength(1)
    })
  })
})
