import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackRequestForm } from '@/components/feedback360/FeedbackRequestForm'
import { FeedbackResults } from '@/components/feedback360/FeedbackResults'
import { SelfAssessmentForm } from '@/components/feedback360/SelfAssessmentForm'
import { FeedbackComparison } from '@/components/feedback360/FeedbackComparison'
import { FeedbackResponseForm } from '@/components/feedback360/FeedbackResponseForm'
import { FeedbackRequestCard } from '@/components/feedback360/FeedbackRequestCard'

// Mock fetch
global.fetch = jest.fn()

describe('FeedbackRequestForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the form fields', () => {
    render(<FeedbackRequestForm onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByText(/add question/i)).toBeInTheDocument()
    expect(screen.getByText(/add recipient/i)).toBeInTheDocument()
  })

  it('should submit feedback request', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ request: { id: 'req1' } }),
    })

    render(<FeedbackRequestForm onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText(/title/i), 'Q1 Feedback')
    await userEvent.click(screen.getByRole('button', { name: /create request/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should show validation error for empty title', async () => {
    render(<FeedbackRequestForm onSuccess={jest.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /create request/i }))

    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
  })
})

describe('FeedbackResults Component', () => {
  const mockResults = {
    totalResponses: 5,
    byCategory: {
      leadership: { average: 4.2, count: 5 },
      communication: { average: 3.8, count: 5 },
    },
    byRelationship: {
      peer: { leadership: { average: 4.0 } },
      manager: { leadership: { average: 4.5 } },
    },
  }

  it('should display total responses', () => {
    render(<FeedbackResults results={mockResults} />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText(/responses/i)).toBeInTheDocument()
  })

  it('should display category averages', () => {
    render(<FeedbackResults results={mockResults} />)

    // Leadership appears in multiple sections, so use getAllByText
    const leadershipElements = screen.getAllByText(/leadership/i)
    expect(leadershipElements.length).toBeGreaterThan(0)
    expect(screen.getByText(/4.2/)).toBeInTheDocument()
  })

  it('should show empty state when no responses', () => {
    render(<FeedbackResults results={{ totalResponses: 0, byCategory: {}, byRelationship: {} }} />)

    expect(screen.getByText(/no responses yet/i)).toBeInTheDocument()
  })
})

describe('SelfAssessmentForm Component', () => {
  it('should render assessment categories', () => {
    render(<SelfAssessmentForm onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/area/i)).toBeInTheDocument()
    expect(screen.getByText(/rating/i)).toBeInTheDocument()
  })

  it('should submit self assessment', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ assessment: { id: 'sa1' } }),
    })

    render(<SelfAssessmentForm onSuccess={onSuccess} />)

    await userEvent.selectOptions(screen.getByLabelText(/category/i), 'leadership')
    await userEvent.type(screen.getByLabelText(/area/i), 'Decision making')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})

describe('FeedbackComparison Component', () => {
  const mockComparison = {
    comparisons: [
      { category: 'leadership', selfRating: 4, peerAverage: 3.5, gap: 0.5, insight: 'overestimating' },
      { category: 'communication', selfRating: 3, peerAverage: 4, gap: -1, insight: 'underestimating' },
    ],
    summary: {
      overestimatedAreas: 1,
      underestimatedAreas: 1,
      alignedAreas: 0,
    },
  }

  it('should display comparison data', () => {
    render(<FeedbackComparison comparison={mockComparison} />)

    // Leadership and other categories appear multiple times
    const leadershipElements = screen.getAllByText(/leadership/i)
    expect(leadershipElements.length).toBeGreaterThan(0)
    // "overestimating" appears in summary and detail sections
    const overestimatingElements = screen.getAllByText(/overestimating/i)
    expect(overestimatingElements.length).toBeGreaterThan(0)
  })

  it('should show insight indicators', () => {
    render(<FeedbackComparison comparison={mockComparison} />)

    // "underestimating" appears in detail section
    const underestimatingElements = screen.getAllByText(/underestimating/i)
    expect(underestimatingElements.length).toBeGreaterThan(0)
  })

  it('should display summary stats', () => {
    render(<FeedbackComparison comparison={mockComparison} />)

    // Summary stats are rendered - check for "Aligned" which appears only in summary
    expect(screen.getByText(/aligned/i)).toBeInTheDocument()
  })
})

describe('FeedbackResponseForm Component', () => {
  const mockQuestions = [
    { id: 'q1', question: 'Rate leadership skills', category: 'leadership', type: 'scale' },
    { id: 'q2', question: 'Any comments?', category: 'general', type: 'text' },
  ]

  it('should render questions', () => {
    render(<FeedbackResponseForm questions={mockQuestions} token="abc123" onSuccess={jest.fn()} />)

    expect(screen.getByText(/rate leadership skills/i)).toBeInTheDocument()
    expect(screen.getByText(/any comments/i)).toBeInTheDocument()
  })

  it('should submit responses', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ response: { id: 'resp1' } }),
    })

    render(<FeedbackResponseForm questions={mockQuestions} token="abc123" onSuccess={onSuccess} />)

    await userEvent.click(screen.getByRole('button', { name: /submit feedback/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})

describe('FeedbackRequestCard Component', () => {
  const mockRequest = {
    id: 'req1',
    title: 'Q1 2024 Feedback',
    status: 'open',
    createdAt: '2024-03-01T10:00:00Z',
    responses: [{ id: 'r1' }, { id: 'r2' }],
    recipients: [{ id: 'rec1' }, { id: 'rec2' }, { id: 'rec3' }],
  }

  it('should display request details', () => {
    render(<FeedbackRequestCard request={mockRequest} />)

    expect(screen.getByText('Q1 2024 Feedback')).toBeInTheDocument()
    expect(screen.getByText(/open/i)).toBeInTheDocument()
  })

  it('should show response count', () => {
    render(<FeedbackRequestCard request={mockRequest} />)

    expect(screen.getByText(/2.*3/)).toBeInTheDocument() // 2 of 3 responses
  })

  it('should handle view click', async () => {
    const onView = jest.fn()
    render(<FeedbackRequestCard request={mockRequest} onView={onView} />)

    await userEvent.click(screen.getByRole('button', { name: /view/i }))

    expect(onView).toHaveBeenCalledWith(mockRequest)
  })
})
