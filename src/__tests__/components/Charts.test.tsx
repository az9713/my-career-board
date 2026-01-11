/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BetAccuracyChart } from '@/components/charts/BetAccuracyChart'
import { TimeAllocationChart } from '@/components/charts/TimeAllocationChart'
import { AvoidanceHeatmap } from '@/components/charts/AvoidanceHeatmap'
import { MetricsSummary } from '@/components/charts/MetricsSummary'

// Mock Recharts to avoid canvas issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container" style={{ width: 400, height: 300 }}>
      {children}
    </div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ data, label }: { data: Array<{ name: string; allocation: number }>; label?: (entry: { name: string; allocation: number }) => string }) => (
    <div data-testid="pie">
      {data?.map((entry: { name: string; allocation: number }, i: number) => (
        <div key={i}>{label ? label(entry) : `${entry.allocation}%`}</div>
      ))}
    </div>
  ),
  Cell: () => null,
}))

describe('BetAccuracyChart', () => {
  const mockData = [
    { quarter: 'Q1-2025', accuracy: 50, total: 4, hits: 2, misses: 2 },
    { quarter: 'Q2-2025', accuracy: 75, total: 4, hits: 3, misses: 1 },
    { quarter: 'Q3-2025', accuracy: 80, total: 5, hits: 4, misses: 1 },
  ]

  it('should render line chart with accuracy data', () => {
    render(<BetAccuracyChart data={mockData} />)

    expect(screen.getByTestId('bet-accuracy-chart')).toBeInTheDocument()
  })

  it('should display chart title', () => {
    render(<BetAccuracyChart data={mockData} />)

    expect(screen.getByText(/bet accuracy/i)).toBeInTheDocument()
  })

  it('should handle zero data gracefully', () => {
    render(<BetAccuracyChart data={[]} />)

    expect(screen.getByText(/no data/i)).toBeInTheDocument()
  })

  it('should show trend indicator', () => {
    render(<BetAccuracyChart data={mockData} showTrend />)

    // Should show improving trend (50% -> 80%)
    expect(screen.getByTestId('trend-indicator')).toBeInTheDocument()
  })
})

describe('TimeAllocationChart', () => {
  const mockData = [
    { name: 'Problem A', allocation: 40, color: '#3b82f6' },
    { name: 'Problem B', allocation: 35, color: '#10b981' },
    { name: 'Problem C', allocation: 25, color: '#f59e0b' },
  ]

  it('should render pie chart', () => {
    render(<TimeAllocationChart data={mockData} />)

    expect(screen.getByTestId('time-allocation-chart')).toBeInTheDocument()
  })

  it('should show problem names in legend', () => {
    render(<TimeAllocationChart data={mockData} />)

    expect(screen.getByText('Problem A')).toBeInTheDocument()
    expect(screen.getByText('Problem B')).toBeInTheDocument()
    expect(screen.getByText('Problem C')).toBeInTheDocument()
  })

  it('should display percentages', () => {
    render(<TimeAllocationChart data={mockData} />)

    // Multiple elements show percentages (chart and legend)
    expect(screen.getAllByText(/40%/).length).toBeGreaterThan(0)
  })

  it('should handle empty data', () => {
    render(<TimeAllocationChart data={[]} />)

    expect(screen.getByText(/no problems/i)).toBeInTheDocument()
  })
})

describe('AvoidanceHeatmap', () => {
  const mockData = [
    { theme: 'salary', frequency: 5, lastMentioned: '2025-01-10' },
    { theme: 'feedback', frequency: 3, lastMentioned: '2025-01-08' },
    { theme: 'promotion', frequency: 2, lastMentioned: '2025-01-05' },
  ]

  it('should render heatmap grid', () => {
    render(<AvoidanceHeatmap data={mockData} />)

    expect(screen.getByTestId('avoidance-heatmap')).toBeInTheDocument()
  })

  it('should show theme labels', () => {
    render(<AvoidanceHeatmap data={mockData} />)

    expect(screen.getByText(/salary/i)).toBeInTheDocument()
    expect(screen.getByText(/feedback/i)).toBeInTheDocument()
  })

  it('should color by frequency', () => {
    render(<AvoidanceHeatmap data={mockData} />)

    const cells = screen.getAllByTestId('heatmap-cell')
    expect(cells.length).toBe(3)
  })

  it('should handle no patterns gracefully', () => {
    render(<AvoidanceHeatmap data={[]} />)

    expect(screen.getByText(/no patterns/i)).toBeInTheDocument()
  })
})

describe('MetricsSummary', () => {
  const mockMetrics = {
    betAccuracy: 75,
    totalBets: 12,
    sessionsCompleted: 4,
    currentStreak: 3,
    topAvoidance: 'salary discussions',
  }

  it('should display all key metrics', () => {
    render(<MetricsSummary metrics={mockMetrics} />)

    expect(screen.getByText(/75%/)).toBeInTheDocument()
    // 12 appears twice (accuracy section and total bets section)
    expect(screen.getAllByText(/12/).length).toBeGreaterThan(0)
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('should show accuracy with appropriate color', () => {
    render(<MetricsSummary metrics={mockMetrics} />)

    // 75% should be green/good
    const accuracyElement = screen.getByTestId('accuracy-metric')
    expect(accuracyElement).toHaveClass('text-green-500')
  })

  it('should show warning for low accuracy', () => {
    render(<MetricsSummary metrics={{ ...mockMetrics, betAccuracy: 30 }} />)

    const accuracyElement = screen.getByTestId('accuracy-metric')
    expect(accuracyElement).toHaveClass('text-red-500')
  })

  it('should display current streak', () => {
    render(<MetricsSummary metrics={mockMetrics} />)

    expect(screen.getByText(/3 week/i)).toBeInTheDocument()
  })
})
