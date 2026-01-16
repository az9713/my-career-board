import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EvidenceCapture } from '@/components/evidence/EvidenceCapture'
import { EvidenceList } from '@/components/evidence/EvidenceList'
import { EvidenceCard } from '@/components/evidence/EvidenceCard'
import { EvidenceSummary } from '@/components/evidence/EvidenceSummary'
import { QuickWinButton } from '@/components/evidence/QuickWinButton'
import { EvidenceTimeline } from '@/components/evidence/EvidenceTimeline'

// Mock fetch
global.fetch = jest.fn()

describe('EvidenceCapture Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the capture form', () => {
    render(<EvidenceCapture onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('should submit evidence', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ evidence: { id: 'e1' } }),
    })

    render(<EvidenceCapture onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText(/title/i), 'Shipped new feature')
    await userEvent.selectOptions(screen.getByLabelText(/type/i), 'win')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/evidence', expect.any(Object))
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should show validation error for empty title', async () => {
    render(<EvidenceCapture onSuccess={jest.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
  })

  it('should support optional description and impact fields', () => {
    render(<EvidenceCapture onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/impact/i)).toBeInTheDocument()
  })
})

describe('EvidenceList Component', () => {
  const mockEvidence = [
    {
      id: 'e1',
      title: 'Shipped dashboard',
      type: 'win',
      date: '2024-03-15T10:00:00Z',
      description: 'Led the development',
    },
    {
      id: 'e2',
      title: 'Great feedback from manager',
      type: 'feedback',
      date: '2024-03-10T10:00:00Z',
      source: 'manager',
    },
  ]

  it('should render list of evidence', () => {
    render(<EvidenceList evidence={mockEvidence} />)

    expect(screen.getByText('Shipped dashboard')).toBeInTheDocument()
    expect(screen.getByText('Great feedback from manager')).toBeInTheDocument()
  })

  it('should show empty state when no evidence', () => {
    render(<EvidenceList evidence={[]} />)

    expect(screen.getByText(/no evidence yet/i)).toBeInTheDocument()
  })

  it('should filter by type', async () => {
    const onFilterChange = jest.fn()
    render(
      <EvidenceList
        evidence={mockEvidence}
        onFilterChange={onFilterChange}
        showFilters
      />
    )

    await userEvent.selectOptions(screen.getByLabelText(/filter by type/i), 'win')

    expect(onFilterChange).toHaveBeenCalledWith({ type: 'win' })
  })

  it('should support search', async () => {
    const onSearch = jest.fn()
    render(
      <EvidenceList
        evidence={mockEvidence}
        onSearch={onSearch}
        showSearch
      />
    )

    await userEvent.type(screen.getByPlaceholderText(/search/i), 'dashboard')

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('dashboard')
    })
  })
})

describe('EvidenceCard Component', () => {
  const mockEvidence = {
    id: 'e1',
    title: 'Shipped new feature',
    type: 'win',
    description: 'Led the dashboard development',
    impact: '25% engagement increase',
    date: '2024-03-15T10:00:00Z',
    source: 'self',
  }

  it('should render evidence details', () => {
    render(<EvidenceCard evidence={mockEvidence} />)

    expect(screen.getByText('Shipped new feature')).toBeInTheDocument()
    expect(screen.getByText(/led the dashboard development/i)).toBeInTheDocument()
    expect(screen.getByText(/25% engagement increase/i)).toBeInTheDocument()
  })

  it('should display type badge', () => {
    render(<EvidenceCard evidence={mockEvidence} />)

    expect(screen.getByText(/win/i)).toBeInTheDocument()
  })

  it('should handle edit action', async () => {
    const onEdit = jest.fn()
    render(<EvidenceCard evidence={mockEvidence} onEdit={onEdit} />)

    await userEvent.click(screen.getByRole('button', { name: /edit/i }))

    expect(onEdit).toHaveBeenCalledWith(mockEvidence)
  })

  it('should handle delete action', async () => {
    const onDelete = jest.fn()
    render(<EvidenceCard evidence={mockEvidence} onDelete={onDelete} />)

    await userEvent.click(screen.getByRole('button', { name: /delete/i }))

    expect(onDelete).toHaveBeenCalledWith(mockEvidence.id)
  })

  it('should show date formatted', () => {
    render(<EvidenceCard evidence={mockEvidence} />)

    // Should show formatted date
    expect(screen.getByText(/mar.*15.*2024/i)).toBeInTheDocument()
  })
})

describe('EvidenceSummary Component', () => {
  const mockSummary = {
    totalCount: 15,
    byType: {
      win: 8,
      feedback: 4,
      metric: 3,
    },
    bySource: {
      self: 10,
      manager: 3,
      peer: 2,
    },
    recentEvidence: [
      { id: 'e1', title: 'Recent win', type: 'win' },
    ],
  }

  it('should render summary stats', () => {
    render(<EvidenceSummary summary={mockSummary} />)

    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText(/total evidence/i)).toBeInTheDocument()
  })

  it('should show breakdown by type', () => {
    render(<EvidenceSummary summary={mockSummary} />)

    expect(screen.getByText(/8.*wins/i)).toBeInTheDocument()
    expect(screen.getByText(/4.*feedback/i)).toBeInTheDocument()
  })

  it('should show recent evidence', () => {
    render(<EvidenceSummary summary={mockSummary} />)

    expect(screen.getByText('Recent win')).toBeInTheDocument()
  })

  it('should handle empty summary', () => {
    const emptySummary = {
      totalCount: 0,
      byType: {},
      bySource: {},
      recentEvidence: [],
    }
    render(<EvidenceSummary summary={emptySummary} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })
})

describe('QuickWinButton Component', () => {
  it('should render floating action button', () => {
    render(<QuickWinButton onCapture={jest.fn()} />)

    expect(screen.getByRole('button', { name: /add win/i })).toBeInTheDocument()
  })

  it('should open quick capture modal on click', async () => {
    render(<QuickWinButton onCapture={jest.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /add win/i }))

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
  })

  it('should submit quick win', async () => {
    const onCapture = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ evidence: { id: 'e1' } }),
    })

    render(<QuickWinButton onCapture={onCapture} />)

    await userEvent.click(screen.getByRole('button', { name: /add win/i }))
    await userEvent.type(screen.getByLabelText(/title/i), 'Quick win')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onCapture).toHaveBeenCalled()
    })
  })
})

describe('EvidenceTimeline Component', () => {
  const mockEvidence = [
    {
      id: 'e1',
      title: 'Event 1',
      type: 'win',
      date: '2024-03-15T10:00:00Z',
    },
    {
      id: 'e2',
      title: 'Event 2',
      type: 'feedback',
      date: '2024-02-20T10:00:00Z',
    },
    {
      id: 'e3',
      title: 'Event 3',
      type: 'milestone',
      date: '2024-01-10T10:00:00Z',
    },
  ]

  it('should render timeline with events', () => {
    render(<EvidenceTimeline evidence={mockEvidence} />)

    expect(screen.getByText('Event 1')).toBeInTheDocument()
    expect(screen.getByText('Event 2')).toBeInTheDocument()
    expect(screen.getByText('Event 3')).toBeInTheDocument()
  })

  it('should display events in chronological order', () => {
    render(<EvidenceTimeline evidence={mockEvidence} />)

    const events = screen.getAllByTestId('timeline-event')
    expect(events).toHaveLength(3)
  })

  it('should show empty state', () => {
    render(<EvidenceTimeline evidence={[]} />)

    expect(screen.getByText(/no evidence to display/i)).toBeInTheDocument()
  })

  it('should handle event click', async () => {
    const onEventClick = jest.fn()
    render(<EvidenceTimeline evidence={mockEvidence} onEventClick={onEventClick} />)

    await userEvent.click(screen.getByText('Event 1'))

    expect(onEventClick).toHaveBeenCalledWith(mockEvidence[0])
  })
})
