import prisma from '@/lib/prisma/client'

// Types
interface CreateCompensationRecordInput {
  userId: string
  type: string
  amount: number
  currency?: string
  effectiveDate: Date
  company: string
  role: string
  notes?: string
}

interface UpdateCompensationRecordInput {
  type?: string
  amount?: number
  currency?: string
  effectiveDate?: Date
  company?: string
  role?: string
  notes?: string
}

interface CreateEquityGrantInput {
  userId: string
  company: string
  grantType: string
  grantDate: Date
  totalShares: number
  strikePrice?: number
  currentPrice?: number
  cliffMonths?: number
  vestingMonths?: number
  vestingSchedule?: string
  expirationDate?: Date
  notes?: string
}

interface UpdateEquityGrantInput {
  currentPrice?: number
  status?: string
  notes?: string
}

interface CompensationHistoryOptions {
  type?: string
}

// Compensation Record Functions
export async function createCompensationRecord(input: CreateCompensationRecordInput) {
  return prisma.compensationRecord.create({
    data: {
      userId: input.userId,
      type: input.type,
      amount: input.amount,
      currency: input.currency || 'USD',
      effectiveDate: input.effectiveDate,
      company: input.company,
      role: input.role,
      notes: input.notes,
    },
  })
}

export async function getCompensationRecordById(id: string) {
  return prisma.compensationRecord.findUnique({
    where: { id },
  })
}

export async function getUserCompensationHistory(
  userId: string,
  options?: CompensationHistoryOptions
) {
  const where: any = { userId }
  if (options?.type) {
    where.type = options.type
  }

  return prisma.compensationRecord.findMany({
    where,
    orderBy: { effectiveDate: 'desc' },
  })
}

export async function updateCompensationRecord(
  id: string,
  data: UpdateCompensationRecordInput
) {
  return prisma.compensationRecord.update({
    where: { id },
    data,
  })
}

export async function deleteCompensationRecord(id: string) {
  return prisma.compensationRecord.delete({
    where: { id },
  })
}

// Equity Grant Functions
export async function createEquityGrant(input: CreateEquityGrantInput) {
  return prisma.equityGrant.create({
    data: {
      userId: input.userId,
      company: input.company,
      grantType: input.grantType,
      grantDate: input.grantDate,
      totalShares: input.totalShares,
      vestedShares: 0,
      strikePrice: input.strikePrice,
      currentPrice: input.currentPrice,
      cliffMonths: input.cliffMonths || 12,
      vestingMonths: input.vestingMonths || 48,
      vestingSchedule: input.vestingSchedule,
      expirationDate: input.expirationDate,
      status: 'active',
      notes: input.notes,
    },
  })
}

export async function getEquityGrantById(id: string) {
  return prisma.equityGrant.findUnique({
    where: { id },
    include: { vestings: true },
  })
}

export async function getUserEquityGrants(userId: string) {
  return prisma.equityGrant.findMany({
    where: { userId },
    include: { vestings: true },
    orderBy: { grantDate: 'desc' },
  })
}

export async function updateEquityGrant(id: string, data: UpdateEquityGrantInput) {
  return prisma.equityGrant.update({
    where: { id },
    data,
  })
}

// Vesting Functions
export async function recordVesting(
  vestingId: string,
  grantId: string,
  shares: number
) {
  await prisma.equityVesting.update({
    where: { id: vestingId },
    data: {
      vested: true,
      vestedAt: new Date(),
    },
  })

  return prisma.equityGrant.update({
    where: { id: grantId },
    data: {
      vestedShares: { increment: shares },
    },
  })
}

export async function getUpcomingVestings(userId: string, daysAhead: number = 30) {
  const now = new Date()
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  return prisma.equityVesting.findMany({
    where: {
      grant: { userId },
      vested: false,
      vestDate: {
        gte: now,
        lte: futureDate,
      },
    },
    include: { grant: true },
    orderBy: { vestDate: 'asc' },
  })
}

// Analytics Functions
export async function getCompensationAnalytics(userId: string) {
  const compensationRecords = await prisma.compensationRecord.findMany({
    where: { userId },
    orderBy: { effectiveDate: 'desc' },
  })

  const equityGrants = await prisma.equityGrant.findMany({
    where: { userId },
    include: { vestings: true },
  })

  // Find current salary (most recent salary record)
  const currentSalaryRecord = compensationRecords.find(r => r.type === 'salary')
  const currentSalary = currentSalaryRecord?.amount || 0

  // Calculate total equity value
  const totalEquityValue = equityGrants.reduce((sum, grant) => {
    const vestedValue = (grant.vestedShares || 0) * (grant.currentPrice || 0)
    return sum + vestedValue
  }, 0)

  // Calculate unvested equity value
  const unvestedEquityValue = equityGrants.reduce((sum, grant) => {
    const unvestedShares = grant.totalShares - (grant.vestedShares || 0)
    const unvestedValue = unvestedShares * (grant.currentPrice || 0)
    return sum + unvestedValue
  }, 0)

  // Calculate total bonuses this year
  const currentYear = new Date().getFullYear()
  const yearBonuses = compensationRecords
    .filter(r => r.type === 'bonus' && new Date(r.effectiveDate).getFullYear() === currentYear)
    .reduce((sum, r) => sum + r.amount, 0)

  return {
    currentSalary,
    totalEquityValue,
    unvestedEquityValue,
    yearBonuses,
    totalCompensation: currentSalary + yearBonuses + totalEquityValue,
    equityGrants: equityGrants.length,
    compensationHistory: compensationRecords,
  }
}

export async function getMarketBenchmark(role: string, level: string) {
  return prisma.compensationBenchmark.findFirst({
    where: { role, level },
  })
}
