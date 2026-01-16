import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactForm } from '@/components/network/ContactForm'
import { ContactCard } from '@/components/network/ContactCard'
import { NetworkMap } from '@/components/network/NetworkMap'
import { InteractionLog } from '@/components/network/InteractionLog'
import { FollowUpList } from '@/components/network/FollowUpList'
import { NetworkAnalytics } from '@/components/network/NetworkAnalytics'

// Mock fetch
global.fetch = jest.fn()

describe('ContactForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the form fields', () => {
    render(<ContactForm onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/relationship/i)).toBeInTheDocument()
  })

  it('should submit contact form', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ contact: { id: 'c1' } }),
    })

    render(<ContactForm onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Jane Smith')
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await userEvent.selectOptions(screen.getByLabelText(/relationship/i), 'mentor')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should show validation error for empty name', async () => {
    render(<ContactForm onSuccess={jest.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
  })
})

describe('ContactCard Component', () => {
  const mockContact = {
    id: 'c1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    company: 'Tech Corp',
    title: 'VP Engineering',
    relationship: 'mentor',
    strength: 4,
    lastContactAt: '2024-03-01T10:00:00Z',
  }

  it('should display contact details', () => {
    render(<ContactCard contact={mockContact} />)

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText(/tech corp/i)).toBeInTheDocument()
    expect(screen.getByText(/mentor/i)).toBeInTheDocument()
  })

  it('should show relationship strength', () => {
    render(<ContactCard contact={mockContact} />)

    expect(screen.getByText(/4.*5/)).toBeInTheDocument()
  })

  it('should handle view action', async () => {
    const onView = jest.fn()
    render(<ContactCard contact={mockContact} onView={onView} />)

    await userEvent.click(screen.getByRole('button', { name: /view/i }))

    expect(onView).toHaveBeenCalledWith(mockContact)
  })
})

describe('NetworkMap Component', () => {
  const mockContacts = [
    { id: 'c1', name: 'Mentor 1', relationship: 'mentor', strength: 5 },
    { id: 'c2', name: 'Peer 1', relationship: 'peer', strength: 4 },
    { id: 'c3', name: 'Mentee 1', relationship: 'mentee', strength: 3 },
  ]

  it('should render contacts grouped by relationship', () => {
    render(<NetworkMap contacts={mockContacts} />)

    expect(screen.getByText('Mentor 1')).toBeInTheDocument()
    expect(screen.getByText('Peer 1')).toBeInTheDocument()
    expect(screen.getByText('Mentee 1')).toBeInTheDocument()
  })

  it('should show relationship categories', () => {
    render(<NetworkMap contacts={mockContacts} />)

    const mentorElements = screen.getAllByText(/mentor/i)
    expect(mentorElements.length).toBeGreaterThan(0)
  })

  it('should show empty state', () => {
    render(<NetworkMap contacts={[]} />)

    expect(screen.getByText(/no contacts yet/i)).toBeInTheDocument()
  })
})

describe('InteractionLog Component', () => {
  const mockInteractions = [
    { id: 'i1', type: 'meeting', date: '2024-03-01', summary: 'Career discussion' },
    { id: 'i2', type: 'email', date: '2024-02-15', summary: 'Follow-up' },
  ]

  it('should render interactions', () => {
    render(<InteractionLog interactions={mockInteractions} contactId="c1" />)

    expect(screen.getByText(/career discussion/i)).toBeInTheDocument()
    expect(screen.getByText(/follow-up/i)).toBeInTheDocument()
  })

  it('should show interaction types', () => {
    render(<InteractionLog interactions={mockInteractions} contactId="c1" />)

    expect(screen.getByText(/meeting/i)).toBeInTheDocument()
    expect(screen.getByText(/email/i)).toBeInTheDocument()
  })
})

describe('FollowUpList Component', () => {
  const mockFollowUps = [
    { id: 'c1', name: 'Jane Smith', nextFollowUp: '2024-03-15T00:00:00Z' },
    { id: 'c2', name: 'John Doe', nextFollowUp: '2024-03-20T00:00:00Z' },
  ]

  it('should render upcoming follow-ups', () => {
    render(<FollowUpList followUps={mockFollowUps} />)

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('should show empty state', () => {
    render(<FollowUpList followUps={[]} />)

    expect(screen.getByText(/no follow-ups/i)).toBeInTheDocument()
  })
})

describe('NetworkAnalytics Component', () => {
  const mockAnalytics = {
    totalContacts: 25,
    byRelationship: { mentor: 5, peer: 15, mentee: 5 },
    totalInteractions: 50,
    staleContacts: [{ id: 'c1', name: 'Stale Contact' }],
  }

  it('should display total contacts', () => {
    render(<NetworkAnalytics analytics={mockAnalytics} />)

    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText(/total contacts/i)).toBeInTheDocument()
  })

  it('should show relationship breakdown', () => {
    render(<NetworkAnalytics analytics={mockAnalytics} />)

    const mentorElements = screen.getAllByText(/mentor/i)
    expect(mentorElements.length).toBeGreaterThan(0)
    // Multiple 5s exist (mentor and mentee both have 5 contacts)
    const fiveElements = screen.getAllByText('5')
    expect(fiveElements.length).toBeGreaterThan(0)
  })

  it('should show stale contacts warning', () => {
    render(<NetworkAnalytics analytics={mockAnalytics} />)

    // "Stale" appears in section title and individual contact
    const staleElements = screen.getAllByText(/stale/i)
    expect(staleElements.length).toBeGreaterThan(0)
  })
})
