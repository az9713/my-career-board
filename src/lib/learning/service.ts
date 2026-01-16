import prisma from '@/lib/prisma/client'

// Types
interface CreateLearningResourceInput {
  userId: string
  title: string
  type: string
  provider?: string
  url?: string
  skillId?: string
  cost?: number
  notes?: string
}

interface UpdateLearningResourceInput {
  title?: string
  type?: string
  provider?: string
  url?: string
  status?: string
  progress?: number
  rating?: number
  notes?: string
  hoursSpent?: number
  completedAt?: Date
}

interface CreateCertificationInput {
  userId: string
  name: string
  issuer: string
  credentialId?: string
  credentialUrl?: string
  skillId?: string
  earnedAt: Date
  expiresAt?: Date
  renewalCost?: number
  notes?: string
}

interface UpdateCertificationInput {
  credentialId?: string
  credentialUrl?: string
  expiresAt?: Date
  status?: string
  renewalCost?: number
  notes?: string
}

interface CreateLearningGoalInput {
  userId: string
  title: string
  description?: string
  skillGapId?: string
  targetDate: Date
  resources?: string
  milestones?: string
  priority?: string
}

interface UpdateLearningGoalInput {
  title?: string
  description?: string
  targetDate?: Date
  resources?: string
  milestones?: string
  progress?: number
  status?: string
  priority?: string
}

interface LearningResourceOptions {
  status?: string
  type?: string
}

// Learning Resource Functions
export async function createLearningResource(input: CreateLearningResourceInput) {
  return prisma.learningResource.create({
    data: {
      userId: input.userId,
      title: input.title,
      type: input.type,
      provider: input.provider,
      url: input.url,
      skillId: input.skillId,
      status: 'not_started',
      progress: 0,
      cost: input.cost,
      notes: input.notes,
    },
  })
}

export async function getLearningResourceById(id: string) {
  return prisma.learningResource.findUnique({
    where: { id },
  })
}

export async function getUserLearningResources(
  userId: string,
  options?: LearningResourceOptions
) {
  const where: any = { userId }
  if (options?.status) {
    where.status = options.status
  }
  if (options?.type) {
    where.type = options.type
  }

  return prisma.learningResource.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateLearningResource(
  id: string,
  data: UpdateLearningResourceInput
) {
  const updateData: any = { ...data }

  // Mark as completed if progress is 100
  if (data.progress === 100 && !data.status) {
    updateData.status = 'completed'
    updateData.completedAt = new Date()
  }

  return prisma.learningResource.update({
    where: { id },
    data: updateData,
  })
}

export async function deleteLearningResource(id: string) {
  return prisma.learningResource.delete({
    where: { id },
  })
}

// Certification Functions
export async function createCertification(input: CreateCertificationInput) {
  return prisma.certification.create({
    data: {
      userId: input.userId,
      name: input.name,
      issuer: input.issuer,
      credentialId: input.credentialId,
      credentialUrl: input.credentialUrl,
      skillId: input.skillId,
      earnedAt: input.earnedAt,
      expiresAt: input.expiresAt,
      status: 'active',
      renewalCost: input.renewalCost,
      notes: input.notes,
    },
  })
}

export async function getCertificationById(id: string) {
  return prisma.certification.findUnique({
    where: { id },
  })
}

export async function getUserCertifications(userId: string, status?: string) {
  const where: any = { userId }
  if (status) {
    where.status = status
  }

  return prisma.certification.findMany({
    where,
    orderBy: { earnedAt: 'desc' },
  })
}

export async function updateCertification(id: string, data: UpdateCertificationInput) {
  return prisma.certification.update({
    where: { id },
    data,
  })
}

export async function getExpiringCertifications(userId: string, daysAhead: number = 30) {
  const now = new Date()
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  return prisma.certification.findMany({
    where: {
      userId,
      status: 'active',
      expiresAt: {
        gte: now,
        lte: futureDate,
      },
    },
    orderBy: { expiresAt: 'asc' },
  })
}

// Learning Goal Functions
export async function createLearningGoal(input: CreateLearningGoalInput) {
  return prisma.learningGoal.create({
    data: {
      userId: input.userId,
      title: input.title,
      description: input.description,
      skillGapId: input.skillGapId,
      targetDate: input.targetDate,
      resources: input.resources,
      milestones: input.milestones,
      progress: 0,
      status: 'active',
      priority: input.priority || 'medium',
    },
  })
}

export async function getLearningGoalById(id: string) {
  return prisma.learningGoal.findUnique({
    where: { id },
  })
}

export async function getUserLearningGoals(userId: string, status?: string) {
  const where: any = { userId }
  if (status) {
    where.status = status
  }

  return prisma.learningGoal.findMany({
    where,
    orderBy: { targetDate: 'asc' },
  })
}

export async function updateLearningGoal(id: string, data: UpdateLearningGoalInput) {
  const updateData: any = { ...data }

  // Mark as completed if progress is 100
  if (data.progress === 100 && !data.status) {
    updateData.status = 'completed'
  }

  return prisma.learningGoal.update({
    where: { id },
    data: updateData,
  })
}

// Analytics Functions
export async function getLearningAnalytics(userId: string) {
  const resources = await prisma.learningResource.findMany({
    where: { userId },
  })

  const certifications = await prisma.certification.findMany({
    where: { userId },
  })

  const goals = await prisma.learningGoal.findMany({
    where: { userId },
  })

  // Calculate metrics
  const totalResources = resources.length
  const completedResources = resources.filter(r => r.status === 'completed').length
  const inProgressResources = resources.filter(r => r.status === 'in_progress').length
  const totalHoursSpent = resources.reduce((sum, r) => sum + (r.hoursSpent || 0), 0)

  const activeCertifications = certifications.filter(c => c.status === 'active').length
  const expiredCertifications = certifications.filter(c => c.status === 'expired').length

  const activeGoals = goals.filter(g => g.status === 'active').length
  const completedGoals = goals.filter(g => g.status === 'completed').length
  const averageGoalProgress = activeGoals > 0
    ? goals.filter(g => g.status === 'active').reduce((sum, g) => sum + (g.progress || 0), 0) / activeGoals
    : 0

  return {
    totalResources,
    completedResources,
    inProgressResources,
    totalHoursSpent,
    activeCertifications,
    expiredCertifications,
    totalCertifications: certifications.length,
    activeGoals,
    completedGoals,
    averageGoalProgress: Math.round(averageGoalProgress),
    resourcesByType: resources.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }
}
