import {
  createCompensationRecord,
  getCompensationRecordById,
  getUserCompensationHistory,
  updateCompensationRecord,
  deleteCompensationRecord,
  createEquityGrant,
  getEquityGrantById,
  getUserEquityGrants,
  updateEquityGrant,
  recordVesting,
  getUpcomingVestings,
  getCompensationAnalytics,
  getMarketBenchmark,
} from '@/lib/compensation/service'

// Mock Prisma client
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    compensationRecord: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    equityGrant: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    equityVesting: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    compensationBenchmark: {
      findFirst: jest.fn(),
    },
  },
}))

import prisma from '@/lib/prisma/client'

describe('Compensation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createCompensationRecord', () => {
    it('should create a compensation record', async () => {
      const mockRecord = {
        id: 'comp1',
        userId: 'user1',
        type: 'salary',
        amount: 150000,
        currency: 'USD',
        effectiveDate: new Date('2024-01-01'),
        company: 'Tech Corp',
        role: 'Senior Engineer',
      }

      ;(prisma.compensationRecord.create as jest.Mock).mockResolvedValue(mockRecord)

      const result = await createCompensationRecord({
        userId: 'user1',
        type: 'salary',
        amount: 150000,
        effectiveDate: new Date('2024-01-01'),
        company: 'Tech Corp',
        role: 'Senior Engineer',
      })

      expect(result).toEqual(mockRecord)
      expect(prisma.compensationRecord.create).toHaveBeenCalled()
    })
  })

  describe('getCompensationRecordById', () => {
    it('should return a compensation record', async () => {
      const mockRecord = {
        id: 'comp1',
        type: 'salary',
        amount: 150000,
      }

      ;(prisma.compensationRecord.findUnique as jest.Mock).mockResolvedValue(mockRecord)

      const result = await getCompensationRecordById('comp1')

      expect(result).toEqual(mockRecord)
    })
  })

  describe('getUserCompensationHistory', () => {
    it('should return compensation history sorted by date', async () => {
      const mockRecords = [
        { id: 'c1', type: 'salary', amount: 150000, effectiveDate: new Date('2024-01-01') },
        { id: 'c2', type: 'bonus', amount: 20000, effectiveDate: new Date('2024-03-01') },
      ]

      ;(prisma.compensationRecord.findMany as jest.Mock).mockResolvedValue(mockRecords)

      const result = await getUserCompensationHistory('user1')

      expect(result).toHaveLength(2)
      expect(prisma.compensationRecord.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { effectiveDate: 'desc' },
      })
    })

    it('should filter by type', async () => {
      ;(prisma.compensationRecord.findMany as jest.Mock).mockResolvedValue([])

      await getUserCompensationHistory('user1', { type: 'salary' })

      expect(prisma.compensationRecord.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1', type: 'salary' },
        orderBy: { effectiveDate: 'desc' },
      })
    })
  })

  describe('updateCompensationRecord', () => {
    it('should update a compensation record', async () => {
      const mockRecord = { id: 'comp1', amount: 160000 }

      ;(prisma.compensationRecord.update as jest.Mock).mockResolvedValue(mockRecord)

      const result = await updateCompensationRecord('comp1', { amount: 160000 })

      expect(result.amount).toBe(160000)
    })
  })

  describe('deleteCompensationRecord', () => {
    it('should delete a compensation record', async () => {
      ;(prisma.compensationRecord.delete as jest.Mock).mockResolvedValue({ id: 'comp1' })

      await deleteCompensationRecord('comp1')

      expect(prisma.compensationRecord.delete).toHaveBeenCalledWith({
        where: { id: 'comp1' },
      })
    })
  })

  describe('createEquityGrant', () => {
    it('should create an equity grant with vesting schedule', async () => {
      const mockGrant = {
        id: 'grant1',
        userId: 'user1',
        company: 'Tech Corp',
        grantType: 'rsu',
        grantDate: new Date('2024-01-01'),
        totalShares: 1000,
        vestedShares: 0,
        cliffMonths: 12,
        vestingMonths: 48,
        status: 'active',
      }

      ;(prisma.equityGrant.create as jest.Mock).mockResolvedValue(mockGrant)

      const result = await createEquityGrant({
        userId: 'user1',
        company: 'Tech Corp',
        grantType: 'rsu',
        grantDate: new Date('2024-01-01'),
        totalShares: 1000,
        cliffMonths: 12,
        vestingMonths: 48,
      })

      expect(result).toEqual(mockGrant)
    })
  })

  describe('getEquityGrantById', () => {
    it('should return an equity grant with vestings', async () => {
      const mockGrant = {
        id: 'grant1',
        totalShares: 1000,
        vestings: [
          { id: 'v1', shares: 250, vested: true },
          { id: 'v2', shares: 250, vested: false },
        ],
      }

      ;(prisma.equityGrant.findUnique as jest.Mock).mockResolvedValue(mockGrant)

      const result = await getEquityGrantById('grant1')

      expect(result?.vestings).toHaveLength(2)
    })
  })

  describe('getUserEquityGrants', () => {
    it('should return all user equity grants', async () => {
      const mockGrants = [
        { id: 'g1', company: 'Tech Corp', totalShares: 1000 },
        { id: 'g2', company: 'Startup Inc', totalShares: 5000 },
      ]

      ;(prisma.equityGrant.findMany as jest.Mock).mockResolvedValue(mockGrants)

      const result = await getUserEquityGrants('user1')

      expect(result).toHaveLength(2)
    })
  })

  describe('updateEquityGrant', () => {
    it('should update equity grant current price', async () => {
      const mockGrant = { id: 'grant1', currentPrice: 150.00 }

      ;(prisma.equityGrant.update as jest.Mock).mockResolvedValue(mockGrant)

      const result = await updateEquityGrant('grant1', { currentPrice: 150.00 })

      expect(result.currentPrice).toBe(150.00)
    })
  })

  describe('recordVesting', () => {
    it('should mark shares as vested', async () => {
      ;(prisma.equityVesting.update as jest.Mock).mockResolvedValue({
        id: 'v1',
        vested: true,
        vestedAt: new Date(),
      })
      ;(prisma.equityGrant.update as jest.Mock).mockResolvedValue({
        id: 'grant1',
        vestedShares: 250,
      })

      const result = await recordVesting('v1', 'grant1', 250)

      expect(prisma.equityVesting.update).toHaveBeenCalled()
      expect(prisma.equityGrant.update).toHaveBeenCalled()
    })
  })

  describe('getUpcomingVestings', () => {
    it('should return upcoming vesting events', async () => {
      const mockVestings = [
        { id: 'v1', vestDate: new Date('2024-04-01'), shares: 250, grant: { company: 'Tech Corp' } },
      ]

      ;(prisma.equityVesting.findMany as jest.Mock).mockResolvedValue(mockVestings)

      const result = await getUpcomingVestings('user1', 30)

      expect(result).toHaveLength(1)
    })
  })

  describe('getCompensationAnalytics', () => {
    it('should return compensation analytics', async () => {
      ;(prisma.compensationRecord.findMany as jest.Mock).mockResolvedValue([
        { type: 'salary', amount: 150000 },
        { type: 'bonus', amount: 20000 },
      ])
      ;(prisma.equityGrant.findMany as jest.Mock).mockResolvedValue([
        { totalShares: 1000, vestedShares: 250, currentPrice: 100 },
      ])

      const result = await getCompensationAnalytics('user1')

      expect(result.currentSalary).toBeDefined()
      expect(result.totalEquityValue).toBeDefined()
    })
  })

  describe('getMarketBenchmark', () => {
    it('should return market benchmark data', async () => {
      const mockBenchmark = {
        role: 'Senior Engineer',
        level: 'senior',
        percentile50: 180000,
        percentile75: 220000,
      }

      ;(prisma.compensationBenchmark.findFirst as jest.Mock).mockResolvedValue(mockBenchmark)

      const result = await getMarketBenchmark('Senior Engineer', 'senior')

      expect(result?.percentile50).toBe(180000)
    })
  })
})
