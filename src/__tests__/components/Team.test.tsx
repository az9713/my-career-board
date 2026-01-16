import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: 'user-123', email: 'test@example.com' } },
    status: 'authenticated',
  })),
}))

import { TeamList } from '@/components/team/TeamList'
import { CreateTeamForm } from '@/components/team/CreateTeamForm'
import { TeamInvites } from '@/components/team/TeamInvites'
import { TeamMembers } from '@/components/team/TeamMembers'
import { PeerFeedbackForm } from '@/components/team/PeerFeedbackForm'
import { TeamProgress } from '@/components/team/TeamProgress'

describe('TeamList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<TeamList />)

    expect(screen.getByTestId('teams-loading')).toBeInTheDocument()
  })

  it('should display user teams', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          teams: [
            { id: 'membership-1', role: 'owner', team: { id: 'team-1', name: 'Engineering' } },
            { id: 'membership-2', role: 'member', team: { id: 'team-2', name: 'Design' } },
          ],
        }),
    } as any)

    render(<TeamList />)

    await waitFor(() => {
      expect(screen.getByText('Engineering')).toBeInTheDocument()
      expect(screen.getByText('Design')).toBeInTheDocument()
    })
  })

  it('should display empty state when no teams', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ teams: [] }),
    } as any)

    render(<TeamList />)

    await waitFor(() => {
      expect(screen.getByText(/no teams yet/i)).toBeInTheDocument()
    })
  })

  it('should show role badge for each team', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          teams: [
            { id: 'membership-1', role: 'owner', team: { id: 'team-1', name: 'My Team' } },
          ],
        }),
    } as any)

    render(<TeamList />)

    await waitFor(() => {
      expect(screen.getByText(/owner/i)).toBeInTheDocument()
    })
  })
})

describe('CreateTeamForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render form fields', () => {
    render(<CreateTeamForm onCreated={jest.fn()} />)

    expect(screen.getByLabelText(/team name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create team/i })).toBeInTheDocument()
  })

  it('should submit form and create team', async () => {
    const onCreated = jest.fn()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ team: { id: 'team-new', name: 'New Team' } }),
    } as any)

    render(<CreateTeamForm onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText(/team name/i), {
      target: { value: 'New Team' },
    })
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'A great team' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create team/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/teams',
        expect.objectContaining({ method: 'POST' })
      )
      expect(onCreated).toHaveBeenCalled()
    })
  })

  it('should show validation error for empty name', async () => {
    render(<CreateTeamForm onCreated={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /create team/i }))

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    })
  })
})

describe('TeamInvites Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display pending invites', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          invites: [
            { id: 'invite-1', team: { name: 'Cool Team' }, invitedBy: { name: 'Alice' } },
          ],
        }),
    } as any)

    render(<TeamInvites />)

    await waitFor(() => {
      expect(screen.getByText('Cool Team')).toBeInTheDocument()
      expect(screen.getByText(/alice/i)).toBeInTheDocument()
    })
  })

  it('should show accept and decline buttons', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          invites: [
            { id: 'invite-1', team: { name: 'Team A' }, invitedBy: { name: 'Bob' } },
          ],
        }),
    } as any)

    render(<TeamInvites />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument()
    })
  })

  it('should handle accept invite', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            invites: [{ id: 'invite-1', team: { name: 'Team A' }, invitedBy: { name: 'Bob' } }],
          }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as any)

    render(<TeamInvites />)

    await waitFor(() => {
      expect(screen.getByText('Team A')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /accept/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/teams/invites',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('accept'),
        })
      )
    })
  })

  it('should show empty state when no invites', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ invites: [] }),
    } as any)

    render(<TeamInvites />)

    await waitFor(() => {
      expect(screen.getByText(/no pending invites/i)).toBeInTheDocument()
    })
  })
})

describe('TeamMembers Component', () => {
  const teamId = 'team-1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display team members', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          team: {
            members: [
              { userId: 'user-1', role: 'owner', user: { name: 'Alice', email: 'alice@example.com' } },
              { userId: 'user-2', role: 'member', user: { name: 'Bob', email: 'bob@example.com' } },
            ],
          },
        }),
    } as any)

    render(<TeamMembers teamId={teamId} />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })
  })

  it('should show invite button for owners', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          team: {
            members: [
              { userId: 'user-123', role: 'owner', user: { name: 'Me' } },
            ],
          },
        }),
    } as any)

    render(<TeamMembers teamId={teamId} isOwner={true} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /invite/i })).toBeInTheDocument()
    })
  })
})

describe('PeerFeedbackForm Component', () => {
  const teamId = 'team-1'
  const toUserId = 'user-456'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render feedback form', () => {
    render(<PeerFeedbackForm teamId={teamId} toUserId={toUserId} toUserName="Bob" />)

    expect(screen.getByText(/feedback for bob/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send feedback/i })).toBeInTheDocument()
  })

  it('should show feedback type options', () => {
    render(<PeerFeedbackForm teamId={teamId} toUserId={toUserId} toUserName="Bob" />)

    expect(screen.getByText(/encouragement/i)).toBeInTheDocument()
    expect(screen.getByText(/suggestion/i)).toBeInTheDocument()
  })

  it('should submit feedback', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ feedback: { id: 'feedback-1' } }),
    } as any)

    const onSent = jest.fn()
    render(<PeerFeedbackForm teamId={teamId} toUserId={toUserId} toUserName="Bob" onSent={onSent} />)

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Great progress!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send feedback/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/teams/${teamId}/feedback`,
        expect.objectContaining({ method: 'POST' })
      )
      expect(onSent).toHaveBeenCalled()
    })
  })
})

describe('TeamProgress Component', () => {
  const teamId = 'team-1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display team progress', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          members: [
            { userId: 'user-1', name: 'Alice', betsHit: 5, betsTotal: 7, streak: 3 },
            { userId: 'user-2', name: 'Bob', betsHit: 3, betsTotal: 5, streak: 1 },
          ],
          teamStats: { avgAccuracy: 0.72, totalBets: 12 },
        }),
    } as any)

    render(<TeamProgress teamId={teamId} />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText(/72%/)).toBeInTheDocument()
    })
  })

  it('should show streak badges', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          members: [
            { userId: 'user-1', name: 'Alice', betsHit: 5, betsTotal: 7, streak: 5 },
          ],
          teamStats: { avgAccuracy: 0.71, totalBets: 7 },
        }),
    } as any)

    render(<TeamProgress teamId={teamId} />)

    await waitFor(() => {
      expect(screen.getByText(/5 week streak/i)).toBeInTheDocument()
    })
  })

  it('should show leaderboard ranking', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          members: [
            { userId: 'user-1', name: 'Alice', betsHit: 8, betsTotal: 10, streak: 4 },
            { userId: 'user-2', name: 'Bob', betsHit: 6, betsTotal: 10, streak: 2 },
            { userId: 'user-3', name: 'Carol', betsHit: 4, betsTotal: 10, streak: 1 },
          ],
          teamStats: { avgAccuracy: 0.6, totalBets: 30 },
        }),
    } as any)

    render(<TeamProgress teamId={teamId} />)

    await waitFor(() => {
      // First place should be shown
      expect(screen.getByText(/1st/i)).toBeInTheDocument()
    })
  })
})
