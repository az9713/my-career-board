import prisma from '@/lib/prisma/client'

/**
 * Team roles
 */
export const TeamRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const

export type TeamRoleValue = typeof TeamRole[keyof typeof TeamRole]

export interface Team {
  id: string
  name: string
  description?: string | null
  createdAt: Date
  updatedAt: Date
  members?: TeamMember[]
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: string
  joinedAt: Date
  user?: {
    id: string
    name?: string | null
    email: string
  }
  team?: Team
}

export interface TeamInvite {
  id: string
  teamId: string
  email: string
  invitedById: string
  status: string
  team?: Team
  invitedBy?: { name?: string | null }
}

export interface PeerFeedback {
  id: string
  teamId: string
  fromUserId: string
  toUserId: string
  type: string
  content: string
  createdAt: Date
  fromUser?: { name?: string | null }
}

export interface CreateTeamData {
  name: string
  description?: string
}

export interface FeedbackData {
  type: string
  content: string
}

/**
 * Create a new team with the creator as owner
 */
export async function createTeam(userId: string, data: CreateTeamData): Promise<Team> {
  if (!data.name || data.name.trim() === '') {
    throw new Error('Team name is required')
  }

  const team = await prisma.team.create({
    data: {
      name: data.name.trim(),
      description: data.description || null,
    },
  })

  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId,
      role: TeamRole.OWNER,
    },
  })

  return team as Team
}

/**
 * Get all teams for a user
 */
export async function getTeams(userId: string): Promise<TeamMember[]> {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: true,
    },
  })

  return memberships as TeamMember[]
}

/**
 * Get team by ID (only if user is a member)
 */
export async function getTeamById(userId: string, teamId: string): Promise<Team | null> {
  // Check if user is a member
  const membership = await prisma.teamMember.findFirst({
    where: { userId, teamId },
  })

  if (!membership) {
    return null
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  return team as Team | null
}

/**
 * Invite someone to a team
 */
export async function inviteToTeam(
  inviterId: string,
  teamId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  // Check if inviter is owner or admin
  const inviterMembership = await prisma.teamMember.findFirst({
    where: { userId: inviterId, teamId },
  })

  if (!inviterMembership || inviterMembership.role === TeamRole.MEMBER) {
    return { success: false, error: 'No permission to invite members' }
  }

  // Check for existing invite
  const existingInvites = await prisma.teamInvite.findMany({
    where: { teamId, email, status: 'pending' },
  })

  if (existingInvites.length > 0) {
    return { success: false, error: 'User already invited' }
  }

  await prisma.teamInvite.create({
    data: {
      teamId,
      email,
      invitedById: inviterId,
      status: 'pending',
    },
  })

  return { success: true }
}

/**
 * Accept a team invite
 */
export async function acceptInvite(
  userId: string,
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  const invite = await prisma.teamInvite.findUnique({
    where: { id: inviteId },
  })

  if (!invite || invite.status !== 'pending') {
    return { success: false, error: 'Invalid or expired invite' }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user || user.email !== invite.email) {
    return { success: false, error: 'You are not authorized to accept this invite' }
  }

  // Add user to team
  await prisma.teamMember.create({
    data: {
      teamId: invite.teamId,
      userId,
      role: TeamRole.MEMBER,
    },
  })

  // Update invite status
  await prisma.teamInvite.update({
    where: { id: inviteId },
    data: { status: 'accepted' },
  })

  return { success: true }
}

/**
 * Decline a team invite
 */
export async function declineInvite(
  userId: string,
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  const invite = await prisma.teamInvite.findUnique({
    where: { id: inviteId },
  })

  if (!invite || invite.status !== 'pending') {
    return { success: false, error: 'Invalid or expired invite' }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user || user.email !== invite.email) {
    return { success: false, error: 'You are not authorized to decline this invite' }
  }

  await prisma.teamInvite.update({
    where: { id: inviteId },
    data: { status: 'declined' },
  })

  return { success: true }
}

/**
 * Get pending invites for a user
 */
export async function getPendingInvites(userId: string): Promise<TeamInvite[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return []
  }

  const invites = await prisma.teamInvite.findMany({
    where: {
      email: user.email,
      status: 'pending',
    },
    include: {
      team: true,
      invitedBy: {
        select: { name: true },
      },
    },
  })

  return invites as TeamInvite[]
}

/**
 * Remove a member from a team (owner only)
 */
export async function removeTeamMember(
  requesterId: string,
  teamId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  // Check if requester is owner
  const requesterMembership = await prisma.teamMember.findFirst({
    where: { userId: requesterId, teamId },
  })

  if (!requesterMembership || requesterMembership.role !== TeamRole.OWNER) {
    return { success: false, error: 'Only owners can remove members' }
  }

  // Get member to remove
  const memberToRemove = await prisma.teamMember.findFirst({
    where: { userId: memberId, teamId },
  })

  if (!memberToRemove) {
    return { success: false, error: 'Member not found' }
  }

  if (memberToRemove.role === TeamRole.OWNER) {
    return { success: false, error: 'You cannot remove owner' }
  }

  await prisma.teamMember.delete({
    where: { id: memberToRemove.id },
  })

  return { success: true }
}

/**
 * Leave a team
 */
export async function leaveTeam(
  userId: string,
  teamId: string
): Promise<{ success: boolean; error?: string }> {
  const membership = await prisma.teamMember.findFirst({
    where: { userId, teamId },
  })

  if (!membership) {
    return { success: false, error: 'Not a member of this team' }
  }

  if (membership.role === TeamRole.OWNER) {
    return { success: false, error: 'Owner must transfer ownership before leaving' }
  }

  await prisma.teamMember.delete({
    where: { id: membership.id },
  })

  return { success: true }
}

/**
 * Give peer feedback to a team member
 */
export async function givePeerFeedback(
  fromUserId: string,
  toUserId: string,
  teamId: string,
  data: FeedbackData
): Promise<PeerFeedback> {
  // Check both users are team members
  const fromMember = await prisma.teamMember.findFirst({
    where: { userId: fromUserId, teamId },
  })

  const toMember = await prisma.teamMember.findFirst({
    where: { userId: toUserId, teamId },
  })

  if (!fromMember || !toMember) {
    throw new Error('Both users must be team members')
  }

  const feedback = await prisma.peerFeedback.create({
    data: {
      teamId,
      fromUserId,
      toUserId,
      type: data.type,
      content: data.content,
    },
  })

  return feedback as PeerFeedback
}

/**
 * Get peer feedback received by a user
 */
export async function getPeerFeedback(userId: string, teamId: string): Promise<PeerFeedback[]> {
  const feedback = await prisma.peerFeedback.findMany({
    where: {
      toUserId: userId,
      teamId,
    },
    include: {
      fromUser: {
        select: { name: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return feedback as PeerFeedback[]
}

/**
 * Get team progress/leaderboard
 */
export async function getTeamProgress(userId: string, teamId: string) {
  // Verify user is a member
  const membership = await prisma.teamMember.findFirst({
    where: { userId, teamId },
  })

  if (!membership) {
    return null
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              bets: {
                where: { status: 'resolved' },
                select: { outcome: true },
              },
              boardSessions: {
                where: { status: 'completed' },
                select: { completedAt: true },
              },
            },
          },
        },
      },
    },
  })

  if (!team) {
    return null
  }

  const members = team.members.map((member) => {
    const bets = member.user.bets || []
    const hits = bets.filter((b) => b.outcome === 'hit').length
    const total = bets.length

    return {
      userId: member.user.id,
      name: member.user.name || 'Unknown',
      betsHit: hits,
      betsTotal: total,
      accuracy: total > 0 ? hits / total : 0,
      sessionsCompleted: member.user.boardSessions?.length || 0,
    }
  })

  const totalBets = members.reduce((sum, m) => sum + m.betsTotal, 0)
  const totalHits = members.reduce((sum, m) => sum + m.betsHit, 0)

  return {
    members,
    teamStats: {
      totalBets,
      avgAccuracy: totalBets > 0 ? totalHits / totalBets : 0,
    },
  }
}
