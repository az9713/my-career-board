import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DailyCheckinCard } from '@/components/checkins/DailyCheckinCard'
import { MoodSelector } from '@/components/checkins/MoodSelector'
import { StreakDisplay } from '@/components/checkins/StreakDisplay'
import { CheckinHistory } from '@/components/checkins/CheckinHistory'
import { CheckinInsights } from '@/components/checkins/CheckinInsights'
import { CheckinReminder } from '@/components/checkins/CheckinReminder'

// Mock fetch
global.fetch = jest.fn()

describe('DailyCheckinCard Component', () => {
  const mockPrompt = {
    id: 'prompt-1',
    question: 'What progress did you make today?',
    category: 'progress',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the prompt question', () => {
    render(<DailyCheckinCard prompt={mockPrompt} onSubmit={jest.fn()} />)

    expect(screen.getByText('What progress did you make today?')).toBeInTheDocument()
  })

  it('should have a text area for response', () => {
    render(<DailyCheckinCard prompt={mockPrompt} onSubmit={jest.fn()} />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should submit check-in', async () => {
    const onSubmit = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ checkin: { id: 'c1' }, streak: { currentStreak: 1 } }),
    })

    render(<DailyCheckinCard prompt={mockPrompt} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByRole('textbox'), 'Made good progress')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      expect(onSubmit).toHaveBeenCalled()
    })
  })

  it('should include mood in submission', async () => {
    const onSubmit = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ checkin: { id: 'c1' }, streak: { currentStreak: 1 } }),
    })

    render(<DailyCheckinCard prompt={mockPrompt} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByRole('textbox'), 'Feeling great')
    await userEvent.click(screen.getByLabelText(/mood 4/i))
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/checkins',
        expect.objectContaining({
          body: expect.stringContaining('"mood":4'),
        })
      )
    })
  })

  it('should show validation error for empty response', async () => {
    render(<DailyCheckinCard prompt={mockPrompt} onSubmit={jest.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    expect(screen.getByText(/please enter a response/i)).toBeInTheDocument()
  })
})

describe('MoodSelector Component', () => {
  it('should render 5 mood options', () => {
    render(<MoodSelector value={null} onChange={jest.fn()} />)

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByLabelText(new RegExp(`mood ${i}`, 'i'))).toBeInTheDocument()
    }
  })

  it('should call onChange when mood is selected', async () => {
    const onChange = jest.fn()
    render(<MoodSelector value={null} onChange={onChange} />)

    await userEvent.click(screen.getByLabelText(/mood 4/i))

    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('should highlight selected mood', () => {
    render(<MoodSelector value={3} onChange={jest.fn()} />)

    const selectedButton = screen.getByLabelText(/mood 3/i)
    expect(selectedButton).toHaveClass('ring-2')
  })
})

describe('StreakDisplay Component', () => {
  it('should display current streak', () => {
    render(<StreakDisplay currentStreak={7} longestStreak={14} />)

    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText(/day streak/i)).toBeInTheDocument()
  })

  it('should display longest streak', () => {
    render(<StreakDisplay currentStreak={7} longestStreak={14} />)

    expect(screen.getByText(/best.*14/i)).toBeInTheDocument()
  })

  it('should handle zero streak', () => {
    render(<StreakDisplay currentStreak={0} longestStreak={5} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should show fire emoji for active streak', () => {
    render(<StreakDisplay currentStreak={3} longestStreak={5} />)

    expect(screen.getByText(/🔥/)).toBeInTheDocument()
  })

  it('should show milestone celebration', () => {
    render(<StreakDisplay currentStreak={7} longestStreak={14} showMilestone />)

    expect(screen.getByText(/week streak/i)).toBeInTheDocument()
  })
})

describe('CheckinHistory Component', () => {
  const mockCheckins = [
    {
      id: 'c1',
      response: 'Made progress on feature',
      mood: 4,
      createdAt: '2024-03-15T10:00:00Z',
      prompt: { question: 'What progress?' },
    },
    {
      id: 'c2',
      response: 'Fixed bugs',
      mood: 3,
      createdAt: '2024-03-14T10:00:00Z',
      prompt: { question: 'What did you work on?' },
    },
  ]

  it('should render list of check-ins', () => {
    render(<CheckinHistory checkins={mockCheckins} />)

    expect(screen.getByText('Made progress on feature')).toBeInTheDocument()
    expect(screen.getByText('Fixed bugs')).toBeInTheDocument()
  })

  it('should show empty state', () => {
    render(<CheckinHistory checkins={[]} />)

    expect(screen.getByText(/no check-ins yet/i)).toBeInTheDocument()
  })

  it('should display mood for each check-in', () => {
    render(<CheckinHistory checkins={mockCheckins} />)

    // Check that mood indicators are present
    const moodIndicators = screen.getAllByTestId('mood-indicator')
    expect(moodIndicators).toHaveLength(2)
  })

  it('should show formatted dates', () => {
    render(<CheckinHistory checkins={mockCheckins} />)

    expect(screen.getByText(/mar.*15/i)).toBeInTheDocument()
  })
})

describe('CheckinInsights Component', () => {
  const mockInsights = {
    totalCheckins: 30,
    averageMood: 3.8,
    moodTrend: 'improving' as const,
    checkinsByDay: {
      '2024-03-15': 1,
      '2024-03-14': 1,
      '2024-03-13': 1,
    },
  }

  it('should display total check-ins', () => {
    render(<CheckinInsights insights={mockInsights} />)

    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText(/total check-ins/i)).toBeInTheDocument()
  })

  it('should display average mood', () => {
    render(<CheckinInsights insights={mockInsights} />)

    expect(screen.getByText(/3.8/)).toBeInTheDocument()
  })

  it('should show mood trend', () => {
    render(<CheckinInsights insights={mockInsights} />)

    expect(screen.getByText(/improving/i)).toBeInTheDocument()
  })

  it('should handle null average mood', () => {
    const insightsNoMood = {
      ...mockInsights,
      averageMood: null,
    }
    render(<CheckinInsights insights={insightsNoMood} />)

    expect(screen.getByText(/no mood data/i)).toBeInTheDocument()
  })
})

describe('CheckinReminder Component', () => {
  it('should render reminder message', () => {
    render(<CheckinReminder />)

    expect(screen.getByText(/time for your daily check-in/i)).toBeInTheDocument()
  })

  it('should have action button', () => {
    render(<CheckinReminder onStart={jest.fn()} />)

    expect(screen.getByRole('button', { name: /check in now/i })).toBeInTheDocument()
  })

  it('should call onStart when clicked', async () => {
    const onStart = jest.fn()
    render(<CheckinReminder onStart={onStart} />)

    await userEvent.click(screen.getByRole('button', { name: /check in now/i }))

    expect(onStart).toHaveBeenCalled()
  })

  it('should be dismissible', async () => {
    const onDismiss = jest.fn()
    render(<CheckinReminder onDismiss={onDismiss} />)

    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))

    expect(onDismiss).toHaveBeenCalled()
  })
})
