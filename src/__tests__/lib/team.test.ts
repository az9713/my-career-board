// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    team: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    teamMember: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    teamInvite: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    peerFeedback: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

import {
  createTeam,
  getTeams,
  getTeamById,
  inviteToTeam,
  acceptInvite,
  declineInvite,
  getPendingInvites,
  removeTeamMember,
  leaveTeam,
  givePeerFeedback,
  getPeerFeedback,
  getTeamProgress,
  TeamRole,
} from '@/lib/team/service'
import prisma from '@/lib/prisma/client'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Team Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTeam', () => {
    it('should create a new team with creator as owner', async () => {
      const userId = 'user-123'
      const teamData = {
        name: 'Engineering Team',
        description: 'Our engineering accountability group',
      }

      mockPrisma.team.create.mockResolvedValue({
        id: 'team-1',
        ...teamData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      mockPrisma.teamMember.create.mockResolvedValue({
        id: 'member-1',
        teamId: 'team-1',
        userId,
        role: 'owner',
      } as any)

      const result = await createTeam(userId, teamData)

      expect(mockPrisma.team.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: teamData.name,
          description: teamData.description,
        }),
      })
      expect(mockPrisma.teamMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          role: 'owner',
        }),
      })
      expect(result.id).toBe('team-1')
    })

    it('should require team name', async () => {
      const userId = 'user-123'

      await expect(createTeam(userId, { name: '' })).rejects.toThrow('Team name is required')
    })
  })

  describe('getTeams', () => {
    it('should return all teams for a user', async () => {
      const userId = 'user-123'

      mockPrisma.teamMember.findMany.mockResolvedValue([
        {
          teamId: 'team-1',
          role: 'owner',
          team: { id: 'team-1', name: 'Team A' },
        },
        {
          teamId: 'team-2',
          role: 'member',
          team: { id: 'team-2', name: 'Team B' },
        },
      ] as any)

      const teams = await getTeams(userId)

      expect(teams).toHaveLength(2)
      expect(mockPrisma.teamMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        })
      )
    })

    it('should return empty array if user has no teams', async () => {
      const userId = 'user-123'

      mockPrisma.teamMember.findMany.mockResolvedValue([])

      const teams = await getTeams(userId)

      expect(teams).toEqual([])
    })
  })

  describe('getTeamById', () => {
    it('should return team with members', async () => {
      const teamId = 'team-1'
      const userId = 'user-123'

      mockPrisma.teamMember.findFirst.mockResolvedValue({
        teamId,
        userId,
        role: 'member',
      } as any)

      mockPrisma.team.findUnique.mockResolvedValue({
        id: teamId,
        name: 'Test Team',
        members: [
          { userId: 'user-123', role: 'owner', user: { name: 'Alice' } },
          { userId: 'user-456', role: 'member', user: { name: 'Bob' } },
        ],
      } as any)

      const team = await getTeamById(userId, teamId)

      expect(team).not.toBeNull()
      expect(team?.name).toBe('Test Team')
    })

    it('should return null if user is not a member', async () => {
      const teamId = 'team-1'
      const userId = 'user-123'

      mockPrisma.teamMember.findFirst.mockResolvedValue(null)

      const team = await getTeamById(userId, teamId)

      expect(team).toBeNull()
    })
  })

  describe('inviteToTeam', () => {
    it('should create invite for email', async () => {
      const teamId = 'team-1'
      const inviterId = 'user-123'
      const email = 'newmember@example.com'

      mockPrisma.teamMember.findFirst.mockResolvedValue({
        role: 'owner',
      } as any)

      mockPrisma.teamInvite.findMany.mockResolvedValue([])

      mockPrisma.teamInvite.create.mockResolvedValue({
        id: 'invite-1',
        teamId,
        email,
        invitedBy: inviterId,
        status: 'pending',
      } as any)

      const result = await inviteToTeam(inviterId, teamId, email)

      expect(result.success).toBe(true)
      expect(mockPrisma.teamInvite.create).toHaveBeenCalled()
    })

    it('should prevent non-owners from inviting', async () => {
      const teamId = 'team-1'
      const inviterId = 'user-123'
      const email = 'newmember@example.com'

      mockPrisma.teamMember.findFirst.mockResolvedValue({
        role: 'member',
      } as any)

      const result = await inviteToTeam(inviterId, teamId, email)

      expect(result.success).toBe(false)
      expect(result.error).toContain('permission')
    })

    it('should prevent duplicate invites', async () => {
      const teamId = 'team-1'
      const inviterId = 'user-123'
      const email = 'existing@example.com'

      mockPrisma.teamMember.findFirst.mockResolvedValue({
        role: 'owner',
      } as any)

      mockPrisma.teamInvite.findMany.mockResolvedValue([
        { email, status: 'pending' },
      ] as any)

      const result = await inviteToTeam(inviterId, teamId, email)

      expect(result.success).toBe(false)
      expect(result.error).toContain('already invited')
    })
  })

  describe('acceptInvite', () => {
    it('should add user to team and mark invite accepted', async () => {
      const inviteId = 'invite-1'
      const userId = 'user-456'

      mockPrisma.teamInvite.findUnique.mockResolvedValue({
        id: inviteId,
        teamId: 'team-1',
        email: 'user@example.com',
        status: 'pending',
      } as any)

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
      } as any)

      mockPrisma.teamMember.create.mockResolvedValue({} as any)
      mockPrisma.teamInvite.update.mockResolvedValue({} as any)

      const result = await acceptInvite(userId, inviteId)

      expect(result.success).toBe(true)
      expect(mockPrisma.teamMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          teamId: 'team-1',
          userId,
          role: 'member',
        }),
      })
    })

    it('should reject if invite email does not match user', async () => {
      const inviteId = 'invite-1'
      const userId = 'user-456'

      mockPrisma.teamInvite.findUnique.mockResolvedValue({
        id: inviteId,
        email: 'other@example.com',
        status: 'pending',
      } as any)

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
      } as any)

      const result = await acceptInvite(userId, inviteId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not authorized')
    })
  })

  describe('declineInvite', () => {
    it('should mark invite as declined', async () => {
      const inviteId = 'invite-1'
      const userId = 'user-456'

      mockPrisma.teamInvite.findUnique.mockResolvedValue({
        id: inviteId,
        email: 'user@example.com',
        status: 'pending',
      } as any)

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
      } as any)

      mockPrisma.teamInvite.update.mockResolvedValue({} as any)

      const result = await declineInvite(userId, inviteId)

      expect(result.success).toBe(true)
      expect(mockPrisma.teamInvite.update).toHaveBeenCalledWith({
        where: { id: inviteId },
        data: { status: 'declined' },
      })
    })
  })

  describe('getPendingInvites', () => {
    it('should return pending invites for user email', async () => {
      const userId = 'user-123'

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
      } as any)

      mockPrisma.teamInvite.findMany.mockResolvedValue([
        { id: 'invite-1', teamId: 'team-1', team: { name: 'Team A' } },
        { id: 'invite-2', teamId: 'team-2', team: { name: 'Team B' } },
      ] as any)

      const invites = await getPendingInvites(userId)

      expect(invites).toHaveLength(2)
    })
  })

  describe('removeTeamMember', () => {
    it('should allow owner to remove members', async () => {
      const ownerId = 'user-123'
      const memberId = 'user-456'
      const teamId = 'team-1'

      mockPrisma.teamMember.findFirst
        .mockResolvedValueOnce({ role: 'owner' } as any) // Owner check
        .mockResolvedValueOnce({ id: 'membership-1', userId: memberId } as any) // Member to remove

      mockPrisma.teamMember.delete.mockResolvedValue({} as any)

      const result = await removeTeamMember(ownerId, teamId, memberId)

      expect(result.success).toBe(true)
    })

    it('should prevent removing the owner', async () => {
      const ownerId = 'user-123'
      const teamId = 'team-1'

      mockPrisma.teamMember.findFirst
        .mockResolvedValueOnce({ role: 'owner' } as any)
        .mockResolvedValueOnce({ id: 'membership-1', userId: ownerId, role: 'owner' } as any)

      const result = await removeTeamMember(ownerId, teamId, ownerId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('cannot remove owner')
    })
  })

  describe('leaveTeam', () => {
    it('should allow member to leave team', async () => {
      const userId = 'user-456'
      const teamId = 'team-1'

      mockPrisma.teamMember.findFirst.mockResolvedValue({
        id: 'membership-1',
        userId,
        role: 'member',
      } as any)

      mockPrisma.teamMember.delete.mockResolvedValue({} as any)

      const result = await leaveTeam(userId, teamId)

      expect(result.success).toBe(true)
    })

    it('should prevent owner from leaving without transferring ownership', async () => {
      const userId = 'user-123'
      const teamId = 'team-1'

      mockPrisma.teamMember.findFirst.mockResolvedValue({
        id: 'membership-1',
        userId,
        role: 'owner',
      } as any)

      const result = await leaveTeam(userId, teamId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('transfer ownership')
    })
  })

  describe('givePeerFeedback', () => {
    it('should create peer feedback', async () => {
      const fromUserId = 'user-123'
      const toUserId = 'user-456'
      const teamId = 'team-1'
      const feedback = {
        type: 'encouragement',
        content: 'Great progress on your bets this quarter!',
      }

      mockPrisma.teamMember.findFirst
        .mockResolvedValueOnce({ userId: fromUserId } as any)
        .mockResolvedValueOnce({ userId: toUserId } as any)

      mockPrisma.peerFeedback.create.mockResolvedValue({
        id: 'feedback-1',
        ...feedback,
        fromUserId,
        toUserId,
        teamId,
      } as any)

      const result = await givePeerFeedback(fromUserId, toUserId, teamId, feedback)

      expect(result.id).toBe('feedback-1')
      expect(mockPrisma.peerFeedback.create).toHaveBeenCalled()
    })

    it('should require both users to be team members', async () => {
      const fromUserId = 'user-123'
      const toUserId = 'user-456'
      const teamId = 'team-1'

      mockPrisma.teamMember.findFirst
        .mockResolvedValueOnce({ userId: fromUserId } as any)
        .mockResolvedValueOnce(null) // toUser not in team

      await expect(
        givePeerFeedback(fromUserId, toUserId, teamId, { type: 'encouragement', content: 'test' })
      ).rejects.toThrow('Both users must be team members')
    })
  })

  describe('getPeerFeedback', () => {
    it('should return feedback received by user', async () => {
      const userId = 'user-123'
      const teamId = 'team-1'

      mockPrisma.peerFeedback.findMany.mockResolvedValue([
        {
          id: 'feedback-1',
          content: 'Great work!',
          fromUser: { name: 'Alice' },
          createdAt: new Date(),
        },
      ] as any)

      const feedback = await getPeerFeedback(userId, teamId)

      expect(feedback).toHaveLength(1)
      expect(mockPrisma.peerFeedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { toUserId: userId, teamId },
        })
      )
    })
  })

  describe('getTeamProgress', () => {
    it('should return aggregated team progress', async () => {
      const teamId = 'team-1'
      const userId = 'user-123'

      mockPrisma.teamMember.findFirst.mockResolvedValue({
        userId,
        role: 'member',
      } as any)

      mockPrisma.team.findUnique.mockResolvedValue({
        id: teamId,
        members: [
          {
            user: {
              id: 'user-1',
              name: 'Alice',
              bets: [{ status: 'resolved', outcome: 'hit' }],
              boardSessions: [{ completedAt: new Date() }],
            },
          },
          {
            user: {
              id: 'user-2',
              name: 'Bob',
              bets: [{ status: 'resolved', outcome: 'miss' }],
              boardSessions: [],
            },
          },
        ],
      } as any)

      const progress = await getTeamProgress(userId, teamId)

      expect(progress).toBeDefined()
      expect(progress.members).toHaveLength(2)
    })
  })
})

describe('Team Roles', () => {
  it('should define all team roles', () => {
    expect(TeamRole.OWNER).toBe('owner')
    expect(TeamRole.ADMIN).toBe('admin')
    expect(TeamRole.MEMBER).toBe('member')
  })
})
