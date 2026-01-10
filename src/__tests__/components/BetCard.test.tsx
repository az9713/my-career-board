import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BetCard } from '@/components/bets/BetCard'
import { BetAccuracyWidget } from '@/components/bets/BetAccuracyWidget'

describe('BetCard', () => {
  const pendingBet = {
    id: 'bet-123',
    content: 'I will ship the new feature by end of Q1',
    falsifiableCriteria: 'Feature is deployed to production',
    deadline: new Date('2024-03-31'),
    quarter: 'Q1-2024',
    status: 'pending' as const,
    outcome: null,
    evidence: null,
    reflection: null,
    createdAt: new Date('2024-01-15'),
  }

  const resolvedBet = {
    ...pendingBet,
    id: 'bet-456',
    status: 'resolved' as const,
    outcome: 'hit' as const,
    evidence: 'Shipped on March 15th, PR #123',
    resolvedAt: new Date('2024-03-15'),
  }

  it('should display bet content and deadline', () => {
    render(<BetCard bet={pendingBet} />)

    expect(screen.getByText(/ship the new feature/i)).toBeInTheDocument()
    expect(screen.getByText(/Mar 31, 2024/i)).toBeInTheDocument()
  })

  it('should show pending status badge', () => {
    render(<BetCard bet={pendingBet} />)

    expect(screen.getByText(/pending/i)).toBeInTheDocument()
    expect(screen.getByText(/pending/i)).toHaveClass('bg-amber-900')
  })

  it('should enable resolve actions for pending bets', () => {
    const onResolve = jest.fn()
    render(<BetCard bet={pendingBet} onResolve={onResolve} />)

    const resolveButton = screen.getByRole('button', { name: /resolve/i })
    expect(resolveButton).toBeEnabled()

    fireEvent.click(resolveButton)
    expect(onResolve).toHaveBeenCalledWith(pendingBet.id)
  })

  it('should display outcome for resolved bets', () => {
    render(<BetCard bet={resolvedBet} />)

    expect(screen.getByText(/hit/i)).toBeInTheDocument()
    expect(screen.getByText(/Shipped on March 15th/i)).toBeInTheDocument()
  })

  it('should show hit badge with green color', () => {
    render(<BetCard bet={resolvedBet} />)

    const hitBadge = screen.getByText(/hit/i)
    expect(hitBadge).toHaveClass('bg-green-900')
  })

  it('should show miss badge with red color', () => {
    const missBet = {
      ...resolvedBet,
      outcome: 'miss' as const,
      evidence: null,
      reflection: 'Got distracted by other priorities',
    }

    render(<BetCard bet={missBet} />)

    const missBadge = screen.getByText(/miss/i)
    expect(missBadge).toHaveClass('bg-red-900')
  })

  it('should not show resolve button for resolved bets', () => {
    render(<BetCard bet={resolvedBet} />)

    expect(screen.queryByRole('button', { name: /resolve/i })).not.toBeInTheDocument()
  })

  it('should display falsifiable criteria', () => {
    render(<BetCard bet={pendingBet} />)

    expect(screen.getByText(/Feature is deployed to production/i)).toBeInTheDocument()
  })
})

describe('BetAccuracyWidget', () => {
  const accuracyStats = {
    percentage: 75,
    total: 8,
    hits: 6,
    misses: 2,
    excused: 1,
  }

  it('should display accuracy percentage', () => {
    render(<BetAccuracyWidget stats={accuracyStats} />)

    expect(screen.getByText(/75%/)).toBeInTheDocument()
  })

  it('should show hit/miss/excused breakdown', () => {
    render(<BetAccuracyWidget stats={accuracyStats} />)

    // Numbers and labels are in separate elements
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('hits')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('misses')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('excused')).toBeInTheDocument()
  })

  it('should link to bet history', async () => {
    const user = userEvent.setup()
    render(<BetAccuracyWidget stats={accuracyStats} />)

    const historyLink = screen.getByRole('link', { name: /view history/i })
    expect(historyLink).toHaveAttribute('href', '/bets')
  })

  it('should show encouraging message for high accuracy', () => {
    render(<BetAccuracyWidget stats={accuracyStats} />)

    expect(screen.getByText(/Great track record/i)).toBeInTheDocument()
  })

  it('should show warning for low accuracy', () => {
    const lowAccuracy = { ...accuracyStats, percentage: 30, hits: 3, misses: 7 }
    render(<BetAccuracyWidget stats={lowAccuracy} />)

    expect(screen.getByText(/needs improvement/i)).toBeInTheDocument()
  })

  it('should handle zero bets gracefully', () => {
    const zeroBets = {
      percentage: 0,
      total: 0,
      hits: 0,
      misses: 0,
      excused: 0,
    }

    render(<BetAccuracyWidget stats={zeroBets} />)

    expect(screen.getByText(/No bets yet/i)).toBeInTheDocument()
  })
})
