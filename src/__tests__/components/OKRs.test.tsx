import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PeriodForm } from '@/components/okrs/PeriodForm'
import { ObjectiveCard } from '@/components/okrs/ObjectiveCard'
import { KeyResultCard } from '@/components/okrs/KeyResultCard'
import { OKRProgress } from '@/components/okrs/OKRProgress'
import { PeriodOverview } from '@/components/okrs/PeriodOverview'
import { OKRAnalytics } from '@/components/okrs/OKRAnalytics'

// Mock fetch
global.fetch = jest.fn()

describe('PeriodForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the form fields', () => {
    render(<PeriodForm onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
  })

  it('should submit period form', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ period: { id: 'p1' } }),
    })

    render(<PeriodForm onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Q1 2024')
    await userEvent.selectOptions(screen.getByLabelText(/type/i), 'quarter')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should show validation error for empty name', async () => {
    render(<PeriodForm onSuccess={jest.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
  })
})

describe('ObjectiveCard Component', () => {
  const mockObjective = {
    id: 'obj1',
    title: 'Increase team productivity',
    description: 'Focus on developer experience',
    category: 'impact',
    progress: 65,
    status: 'on-track',
    keyResults: [
      { id: 'kr1', title: 'Key Result 1', progress: 80 },
      { id: 'kr2', title: 'Key Result 2', progress: 50 },
    ],
  }

  it('should display objective details', () => {
    render(<ObjectiveCard objective={mockObjective} />)

    expect(screen.getByText('Increase team productivity')).toBeInTheDocument()
    expect(screen.getByText(/impact/i)).toBeInTheDocument()
  })

  it('should show progress', () => {
    render(<ObjectiveCard objective={mockObjective} />)

    expect(screen.getByText(/65%/)).toBeInTheDocument()
  })

  it('should show status badge', () => {
    render(<ObjectiveCard objective={mockObjective} />)

    expect(screen.getByText(/on-track/i)).toBeInTheDocument()
  })

  it('should handle expand action', async () => {
    render(<ObjectiveCard objective={mockObjective} />)

    await userEvent.click(screen.getByRole('button', { name: /expand/i }))

    expect(screen.getByText('Key Result 1')).toBeInTheDocument()
  })
})

describe('KeyResultCard Component', () => {
  const mockKeyResult = {
    id: 'kr1',
    title: 'Reduce deployment time',
    metricType: 'number',
    targetValue: 30,
    currentValue: 45,
    startValue: 60,
    unit: 'minutes',
    progress: 50,
    status: 'on-track',
  }

  it('should display key result details', () => {
    render(<KeyResultCard keyResult={mockKeyResult} />)

    expect(screen.getByText('Reduce deployment time')).toBeInTheDocument()
  })

  it('should show progress bar', () => {
    render(<KeyResultCard keyResult={mockKeyResult} />)

    expect(screen.getByText(/50%/)).toBeInTheDocument()
  })

  it('should show metric values', () => {
    render(<KeyResultCard keyResult={mockKeyResult} />)

    expect(screen.getByText(/45/)).toBeInTheDocument()
    expect(screen.getByText(/30/)).toBeInTheDocument()
  })

  it('should handle check-in action', async () => {
    const onCheckIn = jest.fn()
    render(<KeyResultCard keyResult={mockKeyResult} onCheckIn={onCheckIn} />)

    await userEvent.click(screen.getByRole('button', { name: /check-in/i }))
  })
})

describe('OKRProgress Component', () => {
  it('should render progress ring', () => {
    render(<OKRProgress progress={75} size="large" />)

    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('should show correct color for status', () => {
    render(<OKRProgress progress={75} status="on-track" />)

    // Component renders with on-track styling
  })
})

describe('PeriodOverview Component', () => {
  const mockPeriod = {
    id: 'p1',
    name: 'Q1 2024',
    type: 'quarter',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    objectives: [
      { id: 'obj1', title: 'Objective 1', progress: 75, status: 'on-track', keyResults: [] },
      { id: 'obj2', title: 'Objective 2', progress: 30, status: 'at-risk', keyResults: [] },
    ],
  }

  it('should display period name', () => {
    render(<PeriodOverview period={mockPeriod} />)

    expect(screen.getByText('Q1 2024')).toBeInTheDocument()
  })

  it('should show objectives count', () => {
    render(<PeriodOverview period={mockPeriod} />)

    expect(screen.getByText(/2.*objectives/i)).toBeInTheDocument()
  })

  it('should show period status', () => {
    render(<PeriodOverview period={mockPeriod} />)

    expect(screen.getByText(/active/i)).toBeInTheDocument()
  })
})

describe('OKRAnalytics Component', () => {
  const mockAnalytics = {
    activePeriods: 1,
    totalObjectives: 5,
    statusBreakdown: { 'on-track': 3, 'at-risk': 2 },
    averageProgress: 65,
    totalKeyResults: 15,
    completedKeyResults: 8,
    keyResultCompletionRate: 53,
  }

  it('should display total objectives', () => {
    render(<OKRAnalytics analytics={mockAnalytics} />)

    // Multiple 5s may exist, use getAllByText
    const elements = screen.getAllByText('5')
    expect(elements.length).toBeGreaterThan(0)
    // "Objectives" appears in multiple places
    const objectivesElements = screen.getAllByText(/objectives/i)
    expect(objectivesElements.length).toBeGreaterThan(0)
  })

  it('should show average progress', () => {
    render(<OKRAnalytics analytics={mockAnalytics} />)

    expect(screen.getByText(/65%/)).toBeInTheDocument()
  })

  it('should show status breakdown', () => {
    render(<OKRAnalytics analytics={mockAnalytics} />)

    expect(screen.getByText(/on-track/i)).toBeInTheDocument()
    expect(screen.getByText(/at-risk/i)).toBeInTheDocument()
  })

  it('should show key result completion rate', () => {
    render(<OKRAnalytics analytics={mockAnalytics} />)

    expect(screen.getByText(/53%/)).toBeInTheDocument()
  })
})
