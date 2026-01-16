import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SkillForm } from '@/components/skills/SkillForm'
import { SkillCard } from '@/components/skills/SkillCard'
import { SkillsMatrix } from '@/components/skills/SkillsMatrix'
import { SkillGapCard } from '@/components/skills/SkillGapCard'
import { SkillGoalCard } from '@/components/skills/SkillGoalCard'
import { SkillsAnalytics } from '@/components/skills/SkillsAnalytics'

// Mock fetch
global.fetch = jest.fn()

describe('SkillForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the form fields', () => {
    render(<SkillForm onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByText(/proficiency/i)).toBeInTheDocument()
  })

  it('should submit skill', async () => {
    const onSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ skill: { id: 'skill1' } }),
    })

    render(<SkillForm onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'TypeScript')
    await userEvent.selectOptions(screen.getByLabelText(/category/i), 'technical')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should show validation error for empty name', async () => {
    render(<SkillForm onSuccess={jest.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
  })
})

describe('SkillCard Component', () => {
  const mockSkill = {
    id: 'skill1',
    name: 'TypeScript',
    category: 'technical',
    proficiency: 4,
    targetLevel: 5,
    yearsExperience: 3,
  }

  it('should display skill details', () => {
    render(<SkillCard skill={mockSkill} />)

    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText(/technical/i)).toBeInTheDocument()
  })

  it('should show proficiency level', () => {
    render(<SkillCard skill={mockSkill} />)

    expect(screen.getByText(/4.*5/)).toBeInTheDocument()
  })

  it('should handle edit action', async () => {
    const onEdit = jest.fn()
    render(<SkillCard skill={mockSkill} onEdit={onEdit} />)

    await userEvent.click(screen.getByRole('button', { name: /edit/i }))

    expect(onEdit).toHaveBeenCalledWith(mockSkill)
  })
})

describe('SkillsMatrix Component', () => {
  const mockSkills = [
    { id: 'skill1', name: 'TypeScript', category: 'technical', proficiency: 4 },
    { id: 'skill2', name: 'React', category: 'technical', proficiency: 5 },
    { id: 'skill3', name: 'Communication', category: 'soft-skill', proficiency: 3 },
  ]

  it('should render skills in matrix', () => {
    render(<SkillsMatrix skills={mockSkills} />)

    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Communication')).toBeInTheDocument()
  })

  it('should group by category', () => {
    render(<SkillsMatrix skills={mockSkills} />)

    expect(screen.getByText(/technical/i)).toBeInTheDocument()
    expect(screen.getByText(/soft-skill/i)).toBeInTheDocument()
  })

  it('should show empty state', () => {
    render(<SkillsMatrix skills={[]} />)

    expect(screen.getByText(/no skills yet/i)).toBeInTheDocument()
  })
})

describe('SkillGapCard Component', () => {
  const mockGap = {
    id: 'gap1',
    skillName: 'Machine Learning',
    currentLevel: 2,
    requiredLevel: 4,
    gapSize: 2,
    priority: 'high',
    source: 'market-demand',
  }

  it('should display gap details', () => {
    render(<SkillGapCard gap={mockGap} />)

    expect(screen.getByText('Machine Learning')).toBeInTheDocument()
    expect(screen.getByText(/high/i)).toBeInTheDocument()
  })

  it('should show gap size visually', () => {
    render(<SkillGapCard gap={mockGap} />)

    // Gap size is shown as "+2" and current/required in separate columns
    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // current level
    expect(screen.getByText('4/5')).toBeInTheDocument() // required level
  })

  it('should show source label', () => {
    render(<SkillGapCard gap={mockGap} />)

    expect(screen.getByText(/market/i)).toBeInTheDocument()
  })
})

describe('SkillGoalCard Component', () => {
  const mockGoal = {
    id: 'goal1',
    skillName: 'Rust',
    targetLevel: 4,
    progress: 50,
    status: 'active',
    deadline: '2024-12-31T00:00:00Z',
    reason: 'Career growth',
  }

  it('should display goal details', () => {
    render(<SkillGoalCard goal={mockGoal} />)

    expect(screen.getByText('Rust')).toBeInTheDocument()
    expect(screen.getByText(/career growth/i)).toBeInTheDocument()
  })

  it('should show progress bar', () => {
    render(<SkillGoalCard goal={mockGoal} />)

    expect(screen.getByText(/50%/)).toBeInTheDocument()
  })

  it('should handle progress update', async () => {
    const onProgressUpdate = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ goal: { id: 'goal1', progress: 75 } }),
    })

    render(<SkillGoalCard goal={mockGoal} onProgressUpdate={onProgressUpdate} />)

    await userEvent.click(screen.getByRole('button', { name: /update progress/i }))

    // Modal or input would appear
  })

  it('should show deadline', () => {
    render(<SkillGoalCard goal={mockGoal} />)

    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })
})

describe('SkillsAnalytics Component', () => {
  const mockAnalytics = {
    totalSkills: 15,
    averageProficiency: 3.5,
    byCategory: {
      technical: { count: 8, avgProficiency: 3.8 },
      'soft-skill': { count: 7, avgProficiency: 3.2 },
    },
    openGaps: 4,
    closedGaps: 2,
    activeGoals: 3,
    completedGoals: 5,
    averageGoalProgress: 45,
  }

  it('should display total skills', () => {
    render(<SkillsAnalytics analytics={mockAnalytics} />)

    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText(/total skills/i)).toBeInTheDocument()
  })

  it('should display average proficiency', () => {
    render(<SkillsAnalytics analytics={mockAnalytics} />)

    expect(screen.getByText(/3.5/)).toBeInTheDocument()
  })

  it('should show category breakdown', () => {
    render(<SkillsAnalytics analytics={mockAnalytics} />)

    expect(screen.getByText(/technical/i)).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('should show gaps summary', () => {
    render(<SkillsAnalytics analytics={mockAnalytics} />)

    // Find the open gaps count by its label relationship
    const openGapsElements = screen.getAllByText('4')
    expect(openGapsElements.length).toBeGreaterThan(0)
    expect(screen.getByText(/open gaps/i)).toBeInTheDocument()
  })
})
