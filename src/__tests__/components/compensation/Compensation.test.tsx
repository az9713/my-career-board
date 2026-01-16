import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CompensationDashboard } from '@/components/compensation/CompensationDashboard'
import { CompensationHistory } from '@/components/compensation/CompensationHistory'
import { EquityGrants } from '@/components/compensation/EquityGrants'
import { CompensationForm } from '@/components/compensation/CompensationForm'
import { EquityGrantForm } from '@/components/compensation/EquityGrantForm'
import { VestingSchedule } from '@/components/compensation/VestingSchedule'

// Mock fetch
global.fetch = jest.fn()

describe('CompensationDashboard', () => {
  const mockAnalytics = {
    currentSalary: 150000,
    totalEquityValue: 75000,
    unvestedEquityValue: 50000,
    yearBonuses: 20000,
    totalCompensation: 245000,
    equityGrants: 2,
  }

  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    })
  })

  it('should render compensation analytics', async () => {
    render(<CompensationDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Compensation Overview')).toBeInTheDocument()
    })
  })

  it('should display salary and equity values', async () => {
    render(<CompensationDashboard />)

    await waitFor(() => {
      expect(screen.getByText('$150,000')).toBeInTheDocument()
    })
  })
})

describe('CompensationHistory', () => {
  const mockRecords = [
    { id: 'c1', type: 'salary', amount: 150000, company: 'Tech Corp', role: 'Senior Engineer', effectiveDate: '2024-01-01' },
    { id: 'c2', type: 'bonus', amount: 20000, company: 'Tech Corp', role: 'Senior Engineer', effectiveDate: '2024-03-01' },
  ]

  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRecords),
    })
  })

  it('should render compensation history', async () => {
    render(<CompensationHistory />)

    await waitFor(() => {
      expect(screen.getByText('Compensation History')).toBeInTheDocument()
    })
  })

  it('should display records by type', async () => {
    render(<CompensationHistory />)

    await waitFor(() => {
      const salaryElements = screen.getAllByText(/salary/i)
      expect(salaryElements.length).toBeGreaterThan(0)
    })
  })
})

describe('EquityGrants', () => {
  const mockGrants = [
    { id: 'g1', company: 'Tech Corp', grantType: 'rsu', totalShares: 1000, vestedShares: 250, currentPrice: 100 },
    { id: 'g2', company: 'Startup Inc', grantType: 'iso', totalShares: 5000, vestedShares: 0, strikePrice: 10 },
  ]

  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGrants),
    })
  })

  it('should render equity grants', async () => {
    render(<EquityGrants />)

    await waitFor(() => {
      expect(screen.getByText('Equity Grants')).toBeInTheDocument()
    })
  })

  it('should show grant details', async () => {
    render(<EquityGrants />)

    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument()
    })
  })
})

describe('CompensationForm', () => {
  it('should render form fields', () => {
    render(<CompensationForm onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument()
  })

  it('should call onSuccess after submit', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new' }),
    })

    render(<CompensationForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'salary' } })
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '150000' } })
    fireEvent.change(screen.getByLabelText(/company/i), { target: { value: 'Tech Corp' } })
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'Engineer' } })
    fireEvent.change(screen.getByLabelText(/effective date/i), { target: { value: '2024-01-01' } })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})

describe('EquityGrantForm', () => {
  it('should render grant form fields', () => {
    render(<EquityGrantForm onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/company/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/grant type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/total shares/i)).toBeInTheDocument()
  })

  it('should call onSuccess after submit', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new' }),
    })

    render(<EquityGrantForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText(/company/i), { target: { value: 'Tech Corp' } })
    fireEvent.change(screen.getByLabelText(/grant type/i), { target: { value: 'rsu' } })
    fireEvent.change(screen.getByLabelText(/total shares/i), { target: { value: '1000' } })
    fireEvent.change(screen.getByLabelText(/grant date/i), { target: { value: '2024-01-01' } })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})

describe('VestingSchedule', () => {
  const mockGrant = {
    id: 'g1',
    company: 'Tech Corp',
    totalShares: 1000,
    vestedShares: 250,
    grantDate: '2024-01-01',
    cliffMonths: 12,
    vestingMonths: 48,
    vestings: [
      { id: 'v1', vestDate: '2025-01-01', shares: 250, vested: true },
      { id: 'v2', vestDate: '2025-04-01', shares: 62, vested: false },
    ],
  }

  it('should render vesting timeline', () => {
    render(<VestingSchedule grant={mockGrant} />)

    expect(screen.getByText('Vesting Schedule')).toBeInTheDocument()
  })

  it('should show vested and unvested shares', () => {
    render(<VestingSchedule grant={mockGrant} />)

    const elements250 = screen.getAllByText(/250/)
    expect(elements250.length).toBeGreaterThan(0)
    const vestedElements = screen.getAllByText(/vested/i)
    expect(vestedElements.length).toBeGreaterThan(0)
  })
})
