import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CareerTimeline } from '@/components/timeline/CareerTimeline'
import { TimelineEvent } from '@/components/timeline/TimelineEvent'
import { PhaseMarker } from '@/components/timeline/PhaseMarker'
import { InflectionPointHighlight } from '@/components/timeline/InflectionPointHighlight'
import { TimelineFilter } from '@/components/timeline/TimelineFilter'
import { AddEventForm } from '@/components/timeline/AddEventForm'

// Mock fetch
global.fetch = jest.fn()

describe('CareerTimeline Component', () => {
  const mockEvents = [
    {
      id: 'e1',
      title: 'Started at Company X',
      type: 'job',
      date: '2024-01-15T10:00:00Z',
      importance: 5,
      inflectionPoint: null,
    },
    {
      id: 'e2',
      title: 'Promoted to Senior',
      type: 'milestone',
      date: '2024-06-01T10:00:00Z',
      importance: 4,
      inflectionPoint: { impact: 'Major career shift' },
    },
  ]

  const mockPhases = [
    {
      id: 'p1',
      title: 'Growth Phase',
      startDate: '2024-01-01T00:00:00Z',
      endDate: null,
      color: '#3B82F6',
    },
  ]

  it('should render timeline with events', () => {
    render(<CareerTimeline events={mockEvents} phases={mockPhases} />)

    expect(screen.getByText('Started at Company X')).toBeInTheDocument()
    expect(screen.getByText('Promoted to Senior')).toBeInTheDocument()
  })

  it('should show empty state', () => {
    render(<CareerTimeline events={[]} phases={[]} />)

    expect(screen.getByText(/no events yet/i)).toBeInTheDocument()
  })

  it('should highlight inflection points', () => {
    render(<CareerTimeline events={mockEvents} phases={mockPhases} />)

    // The event with inflection point should have a visual indicator
    expect(screen.getByTestId('inflection-point-e2')).toBeInTheDocument()
  })

  it('should show phases as background sections', () => {
    render(<CareerTimeline events={mockEvents} phases={mockPhases} />)

    expect(screen.getByText('Growth Phase')).toBeInTheDocument()
  })

  it('should handle event click', async () => {
    const onEventClick = jest.fn()
    render(
      <CareerTimeline
        events={mockEvents}
        phases={mockPhases}
        onEventClick={onEventClick}
      />
    )

    await userEvent.click(screen.getByText('Started at Company X'))

    expect(onEventClick).toHaveBeenCalledWith(mockEvents[0])
  })
})

describe('TimelineEvent Component', () => {
  const mockEvent = {
    id: 'e1',
    title: 'Started new role',
    type: 'job',
    description: 'Joined the engineering team',
    date: '2024-01-15T10:00:00Z',
    importance: 5,
    inflectionPoint: null,
  }

  it('should render event details', () => {
    render(<TimelineEvent event={mockEvent} />)

    expect(screen.getByText('Started new role')).toBeInTheDocument()
    expect(screen.getByText(/engineering team/i)).toBeInTheDocument()
  })

  it('should display event type badge', () => {
    render(<TimelineEvent event={mockEvent} />)

    expect(screen.getByText(/job/i)).toBeInTheDocument()
  })

  it('should show formatted date', () => {
    render(<TimelineEvent event={mockEvent} />)

    expect(screen.getByText(/jan.*15.*2024/i)).toBeInTheDocument()
  })

  it('should indicate importance level', () => {
    render(<TimelineEvent event={mockEvent} />)

    // Should show importance indicator
    expect(screen.getByTestId('importance-indicator')).toBeInTheDocument()
  })
})

describe('PhaseMarker Component', () => {
  const mockPhase = {
    id: 'p1',
    title: 'Early Career',
    description: 'Learning the ropes',
    startDate: '2020-01-01T00:00:00Z',
    endDate: '2022-12-31T00:00:00Z',
    color: '#3B82F6',
  }

  it('should render phase information', () => {
    render(<PhaseMarker phase={mockPhase} />)

    expect(screen.getByText('Early Career')).toBeInTheDocument()
  })

  it('should show date range', () => {
    render(<PhaseMarker phase={mockPhase} />)

    expect(screen.getByText(/2020.*2022/i)).toBeInTheDocument()
  })

  it('should handle ongoing phase', () => {
    const ongoingPhase = { ...mockPhase, endDate: null }
    render(<PhaseMarker phase={ongoingPhase} />)

    expect(screen.getByText(/present/i)).toBeInTheDocument()
  })

  it('should apply custom color', () => {
    render(<PhaseMarker phase={mockPhase} />)

    const element = screen.getByTestId('phase-marker')
    expect(element).toHaveStyle({ borderColor: '#3B82F6' })
  })
})

describe('InflectionPointHighlight Component', () => {
  const mockInflectionPoint = {
    impact: 'Changed career trajectory',
    beforeState: 'Individual contributor',
    afterState: 'Team lead',
  }

  it('should display impact description', () => {
    render(<InflectionPointHighlight inflectionPoint={mockInflectionPoint} />)

    expect(screen.getByText('Changed career trajectory')).toBeInTheDocument()
  })

  it('should show before and after states', () => {
    render(<InflectionPointHighlight inflectionPoint={mockInflectionPoint} />)

    expect(screen.getByText(/individual contributor/i)).toBeInTheDocument()
    expect(screen.getByText(/team lead/i)).toBeInTheDocument()
  })

  it('should have visual highlight indicator', () => {
    render(<InflectionPointHighlight inflectionPoint={mockInflectionPoint} />)

    expect(screen.getByTestId('inflection-highlight')).toBeInTheDocument()
  })
})

describe('TimelineFilter Component', () => {
  it('should render filter options', () => {
    render(<TimelineFilter onFilterChange={jest.fn()} />)

    expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
  })

  it('should call onFilterChange when filter changes', async () => {
    const onFilterChange = jest.fn()
    render(<TimelineFilter onFilterChange={onFilterChange} />)

    await userEvent.selectOptions(screen.getByLabelText(/type/i), 'job')

    expect(onFilterChange).toHaveBeenCalledWith({ type: 'job' })
  })

  it('should support date range filter', async () => {
    const onFilterChange = jest.fn()
    render(<TimelineFilter onFilterChange={onFilterChange} showDateRange />)

    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
  })
})

describe('AddEventForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render form fields', () => {
    render(<AddEventForm onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
  })

  it('should submit new event', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ event: { id: 'e1' } }),
    })

    render(<AddEventForm onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText(/title/i), 'New milestone')
    await userEvent.selectOptions(screen.getByLabelText(/type/i), 'milestone')
    await userEvent.type(screen.getByLabelText(/date/i), '2024-03-15')
    await userEvent.click(screen.getByRole('button', { name: /add event/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should show validation error for missing fields', async () => {
    render(<AddEventForm onSuccess={jest.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /add event/i }))

    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
  })

  it('should allow setting importance', () => {
    render(<AddEventForm onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/importance/i)).toBeInTheDocument()
  })
})
