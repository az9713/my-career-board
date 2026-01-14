/**
 * @jest-environment node
 */

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock team service
jest.mock('@/lib/team/service', () => ({
  createTeam: jest.fn(),
  getTeams: jest.fn(),
  getTeamById: jest.fn(),
  inviteToTeam: jest.fn(),
  acceptInvite: jest.fn(),
  declineInvite: jest.fn(),
  getPendingInvites: jest.fn(),
  removeTeamMember: jest.fn(),
  leaveTeam: jest.fn(),
  givePeerFeedback: jest.fn(),
  getPeerFeedback: jest.fn(),
  getTeamProgress: jest.fn(),
  TeamRole: {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
  },
}))

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
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
} from '@/lib/team/service'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockCreateTeam = createTeam as jest.MockedFunction<typeof createTeam>
const mockGetTeams = getTeams as jest.MockedFunction<typeof getTeams>
const mockGetTeamById = getTeamById as jest.MockedFunction<typeof getTeamById>
const mockInviteToTeam = inviteToTeam as jest.MockedFunction<typeof inviteToTeam>
const mockAcceptInvite = acceptInvite as jest.MockedFunction<typeof acceptInvite>
const mockDeclineInvite = declineInvite as jest.MockedFunction<typeof declineInvite>
const mockGetPendingInvites = getPendingInvites as jest.MockedFunction<typeof getPendingInvites>
const mockRemoveMember = removeTeamMember as jest.MockedFunction<typeof removeTeamMember>
const mockLeaveTeam = leaveTeam as jest.MockedFunction<typeof leaveTeam>
const mockGiveFeedback = givePeerFeedback as jest.MockedFunction<typeof givePeerFeedback>
const mockGetFeedback = getPeerFeedback as jest.MockedFunction<typeof getPeerFeedback>
const mockGetProgress = getTeamProgress as jest.MockedFunction<typeof getTeamProgress>

// Import route handlers
import { GET, POST } from '@/app/api/teams/route'
import { GET as GetTeam, DELETE as DeleteTeam } from '@/app/api/teams/[teamId]/route'
import { POST as InvitePost } from '@/app/api/teams/[teamId]/invite/route'
import { GET as GetInvites, POST as RespondInvite } from '@/app/api/teams/invites/route'
import { POST as FeedbackPost, GET as FeedbackGet } from '@/app/api/teams/[teamId]/feedback/route'
import { GET as ProgressGet } from '@/app/api/teams/[teamId]/progress/route'

describe('Teams API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any)
  })

  describe('GET /api/teams', () => {
    it('should return user teams', async () => {
      mockGetTeams.mockResolvedValue([
        { id: 'team-1', name: 'Team A', role: 'owner' },
        { id: 'team-2', name: 'Team B', role: 'member' },
      ] as any)

      const request = new NextRequest('http://localhost/api/teams')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.teams).toHaveLength(2)
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/teams')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/teams', () => {
    it('should create a new team', async () => {
      mockCreateTeam.mockResolvedValue({
        id: 'team-new',
        name: 'New Team',
      } as any)

      const request = new NextRequest('http://localhost/api/teams', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Team', description: 'A new team' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.team.id).toBe('team-new')
    })

    it('should return 400 when name is missing', async () => {
      const request = new NextRequest('http://localhost/api/teams', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/teams/[teamId]', () => {
    it('should return team details', async () => {
      mockGetTeamById.mockResolvedValue({
        id: 'team-1',
        name: 'Test Team',
        members: [],
      } as any)

      const request = new NextRequest('http://localhost/api/teams/team-1')
      const response = await GetTeam(request, { params: Promise.resolve({ teamId: 'team-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.team.name).toBe('Test Team')
    })

    it('should return 404 when team not found', async () => {
      mockGetTeamById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/teams/invalid')
      const response = await GetTeam(request, { params: Promise.resolve({ teamId: 'invalid' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/teams/[teamId]', () => {
    it('should allow leaving a team', async () => {
      mockLeaveTeam.mockResolvedValue({ success: true })

      const request = new NextRequest('http://localhost/api/teams/team-1', {
        method: 'DELETE',
      })

      const response = await DeleteTeam(request, { params: Promise.resolve({ teamId: 'team-1' }) })

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/teams/[teamId]/invite', () => {
    it('should send team invite', async () => {
      mockInviteToTeam.mockResolvedValue({ success: true })

      const request = new NextRequest('http://localhost/api/teams/team-1/invite', {
        method: 'POST',
        body: JSON.stringify({ email: 'newmember@example.com' }),
      })

      const response = await InvitePost(request, { params: Promise.resolve({ teamId: 'team-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return error when invite fails', async () => {
      mockInviteToTeam.mockResolvedValue({
        success: false,
        error: 'User already invited',
      })

      const request = new NextRequest('http://localhost/api/teams/team-1/invite', {
        method: 'POST',
        body: JSON.stringify({ email: 'existing@example.com' }),
      })

      const response = await InvitePost(request, { params: Promise.resolve({ teamId: 'team-1' }) })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/teams/invites', () => {
    it('should return pending invites', async () => {
      mockGetPendingInvites.mockResolvedValue([
        { id: 'invite-1', team: { name: 'Team A' } },
      ] as any)

      const request = new NextRequest('http://localhost/api/teams/invites')
      const response = await GetInvites(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.invites).toHaveLength(1)
    })
  })

  describe('POST /api/teams/invites', () => {
    it('should accept invite', async () => {
      mockAcceptInvite.mockResolvedValue({ success: true })

      const request = new NextRequest('http://localhost/api/teams/invites', {
        method: 'POST',
        body: JSON.stringify({ inviteId: 'invite-1', action: 'accept' }),
      })

      const response = await RespondInvite(request)

      expect(response.status).toBe(200)
      expect(mockAcceptInvite).toHaveBeenCalledWith('user-123', 'invite-1')
    })

    it('should decline invite', async () => {
      mockDeclineInvite.mockResolvedValue({ success: true })

      const request = new NextRequest('http://localhost/api/teams/invites', {
        method: 'POST',
        body: JSON.stringify({ inviteId: 'invite-1', action: 'decline' }),
      })

      const response = await RespondInvite(request)

      expect(response.status).toBe(200)
      expect(mockDeclineInvite).toHaveBeenCalledWith('user-123', 'invite-1')
    })
  })

  describe('POST /api/teams/[teamId]/feedback', () => {
    it('should submit peer feedback', async () => {
      mockGiveFeedback.mockResolvedValue({
        id: 'feedback-1',
        content: 'Great work!',
      } as any)

      const request = new NextRequest('http://localhost/api/teams/team-1/feedback', {
        method: 'POST',
        body: JSON.stringify({
          toUserId: 'user-456',
          type: 'encouragement',
          content: 'Great work!',
        }),
      })

      const response = await FeedbackPost(request, { params: Promise.resolve({ teamId: 'team-1' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.feedback.content).toBe('Great work!')
    })
  })

  describe('GET /api/teams/[teamId]/feedback', () => {
    it('should return peer feedback', async () => {
      mockGetFeedback.mockResolvedValue([
        { id: 'feedback-1', content: 'Nice job!', fromUser: { name: 'Alice' } },
      ] as any)

      const request = new NextRequest('http://localhost/api/teams/team-1/feedback')
      const response = await FeedbackGet(request, { params: Promise.resolve({ teamId: 'team-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.feedback).toHaveLength(1)
    })
  })

  describe('GET /api/teams/[teamId]/progress', () => {
    it('should return team progress', async () => {
      mockGetProgress.mockResolvedValue({
        members: [
          { userId: 'user-1', name: 'Alice', betsHit: 3, streak: 5 },
          { userId: 'user-2', name: 'Bob', betsHit: 2, streak: 2 },
        ],
        teamStats: { totalBets: 10, avgAccuracy: 0.75 },
      } as any)

      const request = new NextRequest('http://localhost/api/teams/team-1/progress')
      const response = await ProgressGet(request, { params: Promise.resolve({ teamId: 'team-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.members).toHaveLength(2)
    })
  })
})
