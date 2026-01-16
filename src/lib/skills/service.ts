import prisma from '@/lib/prisma/client'

// Create a new skill
export async function createSkill(data: {
  userId: string
  name: string
  category: string
  proficiency: number
  targetLevel?: number
  yearsExperience?: number
  notes?: string
}) {
  return prisma.skill.create({
    data: {
      userId: data.userId,
      name: data.name,
      category: data.category,
      proficiency: data.proficiency,
      targetLevel: data.targetLevel,
      yearsExperience: data.yearsExperience,
      notes: data.notes,
    },
  })
}

// Get skill by ID with market demand data
export async function getSkillById(id: string) {
  return prisma.skill.findUnique({
    where: { id },
    include: {
      marketDemands: {
        include: {
          marketDemand: true,
        },
      },
      goals: true,
    },
  })
}

// Get all skills for a user
export async function getUserSkills(userId: string, category?: string) {
  return prisma.skill.findMany({
    where: {
      userId,
      ...(category && { category }),
    },
    include: {
      marketDemands: {
        include: {
          marketDemand: true,
        },
      },
      goals: {
        where: { status: 'active' },
      },
    },
    orderBy: [{ category: 'asc' }, { proficiency: 'desc' }],
  })
}

// Update a skill
export async function updateSkill(
  id: string,
  data: {
    proficiency?: number
    targetLevel?: number
    yearsExperience?: number
    notes?: string
  }
) {
  return prisma.skill.update({
    where: { id },
    data: {
      ...data,
      lastAssessed: new Date(),
    },
  })
}

// Delete a skill
export async function deleteSkill(id: string) {
  return prisma.skill.delete({
    where: { id },
  })
}

// Create a skill gap
export async function createSkillGap(data: {
  userId: string
  skillName: string
  currentLevel?: number
  requiredLevel: number
  priority: string
  source: string
  targetRole?: string
  notes?: string
}) {
  const gapSize = data.requiredLevel - (data.currentLevel || 0)

  return prisma.skillGap.create({
    data: {
      userId: data.userId,
      skillName: data.skillName,
      currentLevel: data.currentLevel,
      requiredLevel: data.requiredLevel,
      gapSize,
      priority: data.priority,
      source: data.source,
      targetRole: data.targetRole,
      notes: data.notes,
    },
  })
}

// Get skill gaps for a user
export async function getUserSkillGaps(
  userId: string,
  filters?: {
    priority?: string
    status?: string
  }
) {
  return prisma.skillGap.findMany({
    where: {
      userId,
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.status && { status: filters.status }),
    },
    orderBy: [
      { priority: 'asc' }, // critical first
      { gapSize: 'desc' },
    ],
  })
}

// Update skill gap
export async function updateSkillGap(
  id: string,
  data: {
    currentLevel?: number
    status?: string
    notes?: string
  }
) {
  return prisma.skillGap.update({
    where: { id },
    data,
  })
}

// Create a skill goal
export async function createSkillGoal(data: {
  userId: string
  skillId?: string
  skillName: string
  targetLevel: number
  deadline?: Date
  reason?: string
  resources?: string[]
  milestones?: string[]
}) {
  return prisma.skillGoal.create({
    data: {
      userId: data.userId,
      skillId: data.skillId,
      skillName: data.skillName,
      targetLevel: data.targetLevel,
      deadline: data.deadline,
      reason: data.reason,
      resources: data.resources ? JSON.stringify(data.resources) : null,
      milestones: data.milestones ? JSON.stringify(data.milestones) : null,
    },
  })
}

// Get skill goals for a user
export async function getUserSkillGoals(userId: string, status?: string) {
  return prisma.skillGoal.findMany({
    where: {
      userId,
      ...(status && { status }),
    },
    include: {
      skill: true,
    },
    orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
  })
}

// Update skill goal progress
export async function updateSkillGoalProgress(goalId: string, progress: number) {
  const status = progress >= 100 ? 'completed' : 'active'

  return prisma.skillGoal.update({
    where: { id: goalId },
    data: {
      progress,
      status,
    },
  })
}

// Get market demand data for a skill
export async function getMarketDemandData(skillName: string) {
  return prisma.marketSkillDemand.findFirst({
    where: {
      skillName: {
        equals: skillName,
        mode: 'insensitive',
      },
    },
    orderBy: { dataDate: 'desc' },
  })
}

// Analyze skill gaps based on market demand
export async function analyzeSkillGaps(userId: string) {
  // Get user's current skills
  const userSkills = await prisma.skill.findMany({
    where: { userId },
  })

  // Get high-demand skills from market
  const marketDemand = await prisma.marketSkillDemand.findMany({
    where: {
      demandLevel: { gte: 4 },
    },
    orderBy: { demandLevel: 'desc' },
  })

  const userSkillNames = new Set(userSkills.map((s) => s.name.toLowerCase()))

  // Identify gaps
  const gaps = []
  const recommendations = []

  for (const demand of marketDemand) {
    const existingSkill = userSkills.find(
      (s) => s.name.toLowerCase() === demand.skillName.toLowerCase()
    )

    if (!existingSkill) {
      // User doesn't have this high-demand skill
      gaps.push({
        skillName: demand.skillName,
        currentLevel: null,
        requiredLevel: demand.demandLevel,
        gapSize: demand.demandLevel,
        priority: demand.demandLevel >= 5 ? 'critical' : 'high',
        source: 'market-demand',
        growthTrend: demand.growthTrend,
        salaryImpact: demand.salaryImpact,
      })

      if (demand.growthTrend === 'rising') {
        recommendations.push({
          type: 'acquire',
          skillName: demand.skillName,
          reason: `High-demand skill with ${demand.growthTrend} trend`,
          priority: 'high',
        })
      }
    } else if (existingSkill.proficiency < demand.demandLevel) {
      // User has skill but proficiency is below market demand
      gaps.push({
        skillName: demand.skillName,
        currentLevel: existingSkill.proficiency,
        requiredLevel: demand.demandLevel,
        gapSize: demand.demandLevel - existingSkill.proficiency,
        priority: demand.demandLevel - existingSkill.proficiency >= 2 ? 'high' : 'medium',
        source: 'market-demand',
        growthTrend: demand.growthTrend,
        salaryImpact: demand.salaryImpact,
      })

      recommendations.push({
        type: 'improve',
        skillName: demand.skillName,
        currentLevel: existingSkill.proficiency,
        targetLevel: demand.demandLevel,
        reason: `Current proficiency (${existingSkill.proficiency}) below market demand (${demand.demandLevel})`,
        priority: 'medium',
      })
    }
  }

  // Check for depreciating skills
  for (const skill of userSkills) {
    const marketData = marketDemand.find(
      (d) => d.skillName.toLowerCase() === skill.name.toLowerCase()
    )
    if (marketData?.growthTrend === 'declining') {
      recommendations.push({
        type: 'alert',
        skillName: skill.name,
        reason: 'This skill shows declining market demand',
        priority: 'low',
      })
    }
  }

  return {
    gaps,
    recommendations,
    summary: {
      criticalGaps: gaps.filter((g) => g.priority === 'critical').length,
      highPriorityGaps: gaps.filter((g) => g.priority === 'high').length,
      mediumPriorityGaps: gaps.filter((g) => g.priority === 'medium').length,
      totalGaps: gaps.length,
    },
  }
}

// Get skills analytics
export async function getSkillsAnalytics(userId: string) {
  const skills = await prisma.skill.findMany({
    where: { userId },
  })

  const skillGaps = await prisma.skillGap.findMany({
    where: { userId },
  })

  const skillGoals = await prisma.skillGoal.findMany({
    where: { userId },
  })

  // Calculate by category
  const byCategory: Record<string, { count: number; avgProficiency: number; skills: string[] }> = {}

  for (const skill of skills) {
    if (!byCategory[skill.category]) {
      byCategory[skill.category] = { count: 0, avgProficiency: 0, skills: [] }
    }
    byCategory[skill.category].count += 1
    byCategory[skill.category].skills.push(skill.name)
  }

  // Calculate averages
  for (const category of Object.keys(byCategory)) {
    const categorySkills = skills.filter((s) => s.category === category)
    const totalProficiency = categorySkills.reduce((sum, s) => sum + s.proficiency, 0)
    byCategory[category].avgProficiency =
      Math.round((totalProficiency / categorySkills.length) * 10) / 10
  }

  // Overall average proficiency
  const totalProficiency = skills.reduce((sum, s) => sum + s.proficiency, 0)
  const averageProficiency =
    skills.length > 0 ? Math.round((totalProficiency / skills.length) * 10) / 10 : 0

  return {
    totalSkills: skills.length,
    byCategory,
    averageProficiency,
    openGaps: skillGaps.filter((g) => g.status === 'open').length,
    closedGaps: skillGaps.filter((g) => g.status === 'closed').length,
    activeGoals: skillGoals.filter((g) => g.status === 'active').length,
    completedGoals: skillGoals.filter((g) => g.status === 'completed').length,
    averageGoalProgress:
      skillGoals.length > 0
        ? Math.round(skillGoals.reduce((sum, g) => sum + g.progress, 0) / skillGoals.length)
        : 0,
  }
}
