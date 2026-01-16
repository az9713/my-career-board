import prisma from '@/lib/prisma/client'

// OKR Period types
interface CreateOKRPeriodInput {
  userId: string
  name: string
  type: string
  startDate: Date
  endDate: Date
  status?: string
}

interface UpdateOKRPeriodInput {
  name?: string
  status?: string
}

// Objective types
interface CreateObjectiveInput {
  periodId: string
  userId: string
  title: string
  description?: string
  category: string
  priority?: number
}

interface UpdateObjectiveInput {
  title?: string
  description?: string
  category?: string
  priority?: number
  status?: string
  progress?: number
}

// Key Result types
interface CreateKeyResultInput {
  objectiveId: string
  title: string
  description?: string
  metricType: string
  targetValue: number
  startValue?: number
  unit?: string
  confidence?: number
}

interface UpdateKeyResultInput {
  title?: string
  description?: string
  currentValue?: number
  targetValue?: number
  confidence?: number
  status?: string
  notes?: string
}

// OKR Period functions
export async function createOKRPeriod(input: CreateOKRPeriodInput) {
  return prisma.oKRPeriod.create({
    data: {
      ...input,
      status: input.status || 'active',
    },
  })
}

export async function getOKRPeriodById(id: string) {
  return prisma.oKRPeriod.findUnique({
    where: { id },
    include: {
      objectives: {
        include: { keyResults: true },
        orderBy: { priority: 'asc' },
      },
    },
  })
}

export async function getUserOKRPeriods(userId: string, status?: string) {
  const where: any = { userId }
  if (status) {
    where.status = status
  }

  return prisma.oKRPeriod.findMany({
    where,
    orderBy: { startDate: 'desc' },
  })
}

export async function updateOKRPeriod(id: string, input: UpdateOKRPeriodInput) {
  return prisma.oKRPeriod.update({
    where: { id },
    data: input,
  })
}

// Objective functions
export async function createObjective(input: CreateObjectiveInput) {
  return prisma.objective.create({
    data: {
      ...input,
      priority: input.priority || 2,
      progress: 0,
      status: 'on-track',
    },
  })
}

export async function getObjectiveById(id: string) {
  return prisma.objective.findUnique({
    where: { id },
    include: {
      keyResults: {
        include: { checkIns: { orderBy: { createdAt: 'desc' }, take: 5 } },
      },
    },
  })
}

export async function getPeriodObjectives(periodId: string) {
  return prisma.objective.findMany({
    where: { periodId },
    include: { keyResults: true },
    orderBy: { priority: 'asc' },
  })
}

export async function updateObjective(id: string, input: UpdateObjectiveInput) {
  return prisma.objective.update({
    where: { id },
    data: input,
  })
}

export async function deleteObjective(id: string) {
  return prisma.objective.delete({
    where: { id },
  })
}

// Key Result functions
export async function createKeyResult(input: CreateKeyResultInput) {
  return prisma.keyResult.create({
    data: {
      ...input,
      currentValue: input.startValue || 0,
      startValue: input.startValue || 0,
      progress: 0,
      status: 'on-track',
    },
  })
}

export async function getKeyResultById(id: string) {
  return prisma.keyResult.findUnique({
    where: { id },
    include: {
      checkIns: { orderBy: { createdAt: 'desc' } },
      objective: true,
    },
  })
}

export async function updateKeyResult(id: string, input: UpdateKeyResultInput) {
  // If currentValue is being updated, calculate new progress
  let progress: number | undefined

  if (input.currentValue !== undefined) {
    const existing = await prisma.keyResult.findUnique({ where: { id } })
    if (existing) {
      progress = calculateProgress(
        input.currentValue,
        existing.startValue,
        existing.targetValue
      )
    }
  }

  return prisma.keyResult.update({
    where: { id },
    data: {
      ...input,
      ...(progress !== undefined && { progress }),
    },
  })
}

export async function checkInKeyResult(id: string, value: number, notes?: string) {
  const keyResult = await prisma.keyResult.findUnique({ where: { id } })
  if (!keyResult) throw new Error('Key result not found')

  const checkIn = await prisma.keyResultCheckIn.create({
    data: {
      keyResultId: id,
      value,
      previousValue: keyResult.currentValue,
      notes,
    },
  })

  const progress = calculateProgress(value, keyResult.startValue, keyResult.targetValue)

  await prisma.keyResult.update({
    where: { id },
    data: {
      currentValue: value,
      progress,
      status: getStatusFromProgress(progress),
    },
  })

  return checkIn
}

export async function getKeyResultHistory(id: string) {
  return prisma.keyResultCheckIn.findMany({
    where: { keyResultId: id },
    orderBy: { createdAt: 'desc' },
  })
}

// Progress calculation
function calculateProgress(current: number, start: number, target: number): number {
  if (target === start) return current >= target ? 100 : 0

  // Handle both increasing and decreasing targets
  const totalChange = Math.abs(target - start)
  const actualChange = Math.abs(current - start)

  // Check direction
  const isIncreasing = target > start
  const isCorrectDirection = isIncreasing ? current >= start : current <= start

  if (!isCorrectDirection) return 0

  const progress = Math.round((actualChange / totalChange) * 100)
  return Math.min(100, Math.max(0, progress))
}

function getStatusFromProgress(progress: number): string {
  if (progress >= 100) return 'completed'
  if (progress >= 70) return 'on-track'
  if (progress >= 30) return 'at-risk'
  return 'behind'
}

// Objective progress calculation
export async function calculateObjectiveProgress(objectiveId: string): Promise<number> {
  const keyResults = await prisma.keyResult.findMany({
    where: { objectiveId },
  })

  if (keyResults.length === 0) return 0

  const avgProgress = Math.round(
    keyResults.reduce((sum, kr) => sum + kr.progress, 0) / keyResults.length
  )

  await prisma.objective.update({
    where: { id: objectiveId },
    data: { progress: avgProgress },
  })

  return avgProgress
}

// Analytics
export async function getOKRAnalytics(userId: string) {
  const periods = await prisma.oKRPeriod.findMany({
    where: { userId },
    orderBy: { startDate: 'desc' },
    take: 4,
  })

  const totalObjectives = await prisma.objective.count({
    where: { period: { userId } },
  })

  const objectives = await prisma.objective.findMany({
    where: { period: { userId } },
  })

  const statusBreakdown = objectives.reduce((acc, obj) => {
    acc[obj.status] = (acc[obj.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const averageProgress = objectives.length > 0
    ? Math.round(objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length)
    : 0

  const keyResults = await prisma.keyResult.findMany({
    where: { objective: { period: { userId } } },
  })

  const completedKeyResults = keyResults.filter(kr => kr.progress >= 100).length

  return {
    activePeriods: periods.filter(p => p.status === 'active').length,
    totalObjectives,
    statusBreakdown,
    averageProgress,
    totalKeyResults: keyResults.length,
    completedKeyResults,
    keyResultCompletionRate: keyResults.length > 0
      ? Math.round((completedKeyResults / keyResults.length) * 100)
      : 0,
  }
}
