import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DecisionForm } from '@/components/decisions/DecisionForm'
import { DecisionCard } from '@/components/decisions/DecisionCard'
import { DecisionTimeline } from '@/components/decisions/DecisionTimeline'
import { OutcomeRecorder } from '@/components/decisions/OutcomeRecorder'
import { DecisionAnalytics } from '@/components/decisions/DecisionAnalytics'
import { RetrospectivePrompt } from '@/components/decisions/RetrospectivePrompt'

// Mock fetch
global.fetch = jest.fn()

describe('DecisionForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the form fields', () => {
    render(<DecisionForm onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
  })

  it('should submit decision', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ decision: { id: 'd1' } }),
    })

    render(<DecisionForm onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText(/title/i), 'Accept job offer')
    await userEvent.selectOptions(screen.getByLabelText(/category/i), 'role-change')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should show validation error for empty title', async () => {
    render(<DecisionForm onSuccess={jest.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
  })

  it('should allow adding options', async () => {
    render(<DecisionForm onSuccess={jest.fn()} />)

    const addOptionBtn = screen.getByRole('button', { name: /add option/i })
    await userEvent.click(addOptionBtn)

    const optionInputs = screen.getAllByPlaceholderText(/option/i)
    expect(optionInputs.length).toBeGreaterThanOrEqual(1)
  })
})

describe('DecisionCard Component', () => {
  const mockDecision = {
    id: 'd1',
    title: 'Accept new role',
    description: 'Deciding on senior position',
    status: 'pending',
    category: 'role-change',
    options: '["Accept", "Decline", "Negotiate"]',
    prediction: 'Will accelerate career',
    confidence: 4,
    createdAt: '2024-03-01T10:00:00Z',
    tags: [{ tag: 'career' }],
    outcome: null,
  }

  it('should render decision details', () => {
    render(<DecisionCard decision={mockDecision} />)

    expect(screen.getByText('Accept new role')).toBeInTheDocument()
    expect(screen.getByText(/senior position/i)).toBeInTheDocument()
    expect(screen.getByText(/pending/i)).toBeInTheDocument()
  })

  it('should display options', () => {
    render(<DecisionCard decision={mockDecision} />)

    // Check options are displayed (be specific to avoid matching title)
    expect(screen.getByText('Accept')).toBeInTheDocument()
    expect(screen.getByText('Decline')).toBeInTheDocument()
  })

  it('should show confidence level', () => {
    render(<DecisionCard decision={mockDecision} />)

    expect(screen.getByText(/4.*5/i)).toBeInTheDocument()
  })

  it('should handle edit action', async () => {
    const onEdit = jest.fn()
    render(<DecisionCard decision={mockDecision} onEdit={onEdit} />)

    await userEvent.click(screen.getByRole('button', { name: /edit/i }))

    expect(onEdit).toHaveBeenCalledWith(mockDecision)
  })

  it('should show tags', () => {
    render(<DecisionCard decision={mockDecision} />)

    expect(screen.getByText('career')).toBeInTheDocument()
  })
})

describe('DecisionTimeline Component', () => {
  const mockDecisions = [
    {
      id: 'd1',
      title: 'Decision 1',
      status: 'closed',
      createdAt: '2024-03-01T10:00:00Z',
      outcome: { accuracy: 5 },
    },
    {
      id: 'd2',
      title: 'Decision 2',
      status: 'pending',
      createdAt: '2024-02-15T10:00:00Z',
      outcome: null,
    },
  ]

  it('should render decisions in timeline', () => {
    render(<DecisionTimeline decisions={mockDecisions} />)

    expect(screen.getByText('Decision 1')).toBeInTheDocument()
    expect(screen.getByText('Decision 2')).toBeInTheDocument()
  })

  it('should show empty state', () => {
    render(<DecisionTimeline decisions={[]} />)

    expect(screen.getByText(/no decisions yet/i)).toBeInTheDocument()
  })

  it('should handle decision click', async () => {
    const onDecisionClick = jest.fn()
    render(<DecisionTimeline decisions={mockDecisions} onDecisionClick={onDecisionClick} />)

    await userEvent.click(screen.getByText('Decision 1'))

    expect(onDecisionClick).toHaveBeenCalledWith(mockDecisions[0])
  })
})

describe('OutcomeRecorder Component', () => {
  const mockDecision = {
    id: 'd1',
    title: 'Accept new role',
    prediction: 'Will accelerate career',
  }

  it('should render outcome form', () => {
    render(<OutcomeRecorder decision={mockDecision} onSuccess={jest.fn()} />)

    expect(screen.getByLabelText('What happened?')).toBeInTheDocument()
    expect(screen.getByText(/accuracy/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/lessons/i)).toBeInTheDocument()
  })

  it('should show original prediction', () => {
    render(<OutcomeRecorder decision={mockDecision} onSuccess={jest.fn()} />)

    expect(screen.getByText(/will accelerate career/i)).toBeInTheDocument()
  })

  it('should submit outcome', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ outcome: { id: 'o1' } }),
    })

    render(<OutcomeRecorder decision={mockDecision} onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText('What happened?'), 'Great decision!')
    await userEvent.click(screen.getByLabelText('Accuracy 5'))
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})

describe('DecisionAnalytics Component', () => {
  const mockAnalytics = {
    totalDecisions: 25,
    averageAccuracy: 3.8,
    decisionsByStatus: { pending: 5, decided: 10, closed: 10 },
    decisionsByCategory: { 'role-change': 8, compensation: 7, project: 10 },
    recentDecisions: [],
  }

  it('should display total decisions', () => {
    render(<DecisionAnalytics analytics={mockAnalytics} />)

    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText(/total decisions/i)).toBeInTheDocument()
  })

  it('should display average accuracy', () => {
    render(<DecisionAnalytics analytics={mockAnalytics} />)

    expect(screen.getByText(/3.8/)).toBeInTheDocument()
  })

  it('should show status breakdown', () => {
    render(<DecisionAnalytics analytics={mockAnalytics} />)

    // Status labels and counts are in separate elements
    expect(screen.getByText(/pending/i)).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText(/closed/i)).toBeInTheDocument()
  })

  it('should handle null accuracy', () => {
    const analyticsNoAccuracy = { ...mockAnalytics, averageAccuracy: null }
    render(<DecisionAnalytics analytics={analyticsNoAccuracy} />)

    expect(screen.getByText(/no data yet/i)).toBeInTheDocument()
  })
})

describe('RetrospectivePrompt Component', () => {
  const mockDecision = {
    id: 'd1',
    title: 'Career move',
    decidedAt: '2024-01-15T10:00:00Z',
    prediction: 'Expected growth',
  }

  it('should render retrospective prompts', () => {
    render(<RetrospectivePrompt decision={mockDecision} onComplete={jest.fn()} />)

    expect(screen.getByText(/time to reflect/i)).toBeInTheDocument()
    expect(screen.getByText('Career move')).toBeInTheDocument()
  })

  it('should show how long ago decision was made', () => {
    render(<RetrospectivePrompt decision={mockDecision} onComplete={jest.fn()} />)

    // Should show time elapsed
    expect(screen.getByText(/ago/i)).toBeInTheDocument()
  })

  it('should have complete button', async () => {
    const onComplete = jest.fn()
    render(<RetrospectivePrompt decision={mockDecision} onComplete={onComplete} />)

    await userEvent.click(screen.getByRole('button', { name: /record outcome/i }))

    expect(onComplete).toHaveBeenCalled()
  })
})
