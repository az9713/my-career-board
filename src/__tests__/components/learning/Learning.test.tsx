import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LearningDashboard } from '@/components/learning/LearningDashboard'
import { LearningResources } from '@/components/learning/LearningResources'
import { Certifications } from '@/components/learning/Certifications'
import { LearningGoals } from '@/components/learning/LearningGoals'
import { ResourceForm } from '@/components/learning/ResourceForm'
import { CertificationForm } from '@/components/learning/CertificationForm'

// Mock fetch
global.fetch = jest.fn()

describe('LearningDashboard', () => {
  const mockAnalytics = {
    totalResources: 10,
    completedResources: 5,
    inProgressResources: 3,
    totalHoursSpent: 50,
    activeCertifications: 3,
    expiredCertifications: 1,
    activeGoals: 2,
    completedGoals: 1,
    averageGoalProgress: 45,
  }

  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    })
  })

  it('should render learning dashboard', async () => {
    render(<LearningDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Learning Dashboard')).toBeInTheDocument()
    })
  })

  it('should display learning stats', async () => {
    render(<LearningDashboard />)

    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument() // hours
    })
  })
})

describe('LearningResources', () => {
  const mockResources = [
    { id: 'lr1', title: 'TypeScript Course', type: 'course', status: 'in_progress', progress: 50 },
    { id: 'lr2', title: 'React Book', type: 'book', status: 'completed', progress: 100 },
  ]

  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResources),
    })
  })

  it('should render learning resources', async () => {
    render(<LearningResources />)

    await waitFor(() => {
      expect(screen.getByText('Learning Resources')).toBeInTheDocument()
    })
  })

  it('should display resource titles', async () => {
    render(<LearningResources />)

    await waitFor(() => {
      expect(screen.getByText('TypeScript Course')).toBeInTheDocument()
    })
  })
})

describe('Certifications', () => {
  const mockCerts = [
    { id: 'c1', name: 'AWS Solutions Architect', issuer: 'Amazon', status: 'active', earnedAt: '2024-01-01' },
    { id: 'c2', name: 'Google Cloud', issuer: 'Google', status: 'active', earnedAt: '2023-06-01' },
  ]

  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCerts),
    })
  })

  it('should render certifications', async () => {
    render(<Certifications />)

    await waitFor(() => {
      expect(screen.getByText('Certifications')).toBeInTheDocument()
    })
  })

  it('should display certification names', async () => {
    render(<Certifications />)

    await waitFor(() => {
      expect(screen.getByText('AWS Solutions Architect')).toBeInTheDocument()
    })
  })
})

describe('LearningGoals', () => {
  const mockGoals = [
    { id: 'g1', title: 'Master TypeScript', status: 'active', progress: 50, targetDate: '2024-12-31' },
    { id: 'g2', title: 'Learn React Native', status: 'active', progress: 25, targetDate: '2024-06-30' },
  ]

  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGoals),
    })
  })

  it('should render learning goals', async () => {
    render(<LearningGoals />)

    await waitFor(() => {
      expect(screen.getByText('Learning Goals')).toBeInTheDocument()
    })
  })

  it('should display goal titles', async () => {
    render(<LearningGoals />)

    await waitFor(() => {
      expect(screen.getByText('Master TypeScript')).toBeInTheDocument()
    })
  })
})

describe('ResourceForm', () => {
  it('should render form fields', () => {
    render(<ResourceForm onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
  })

  it('should call onSuccess after submit', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new' }),
    })

    render(<ResourceForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Course' } })
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'course' } })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})

describe('CertificationForm', () => {
  it('should render certification form fields', () => {
    render(<CertificationForm onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/issuer/i)).toBeInTheDocument()
  })

  it('should call onSuccess after submit', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new' }),
    })

    render(<CertificationForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'AWS' } })
    fireEvent.change(screen.getByLabelText(/issuer/i), { target: { value: 'Amazon' } })
    fireEvent.change(screen.getByLabelText(/earned date/i), { target: { value: '2024-01-01' } })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})
