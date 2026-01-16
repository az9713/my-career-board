/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(() => Promise.resolve({ user: { id: 'user1' } })),
}))

// Mock service
jest.mock('@/lib/compensation/service', () => ({
  createCompensationRecord: jest.fn(),
  getCompensationRecordById: jest.fn(),
  getUserCompensationHistory: jest.fn(),
  updateCompensationRecord: jest.fn(),
  deleteCompensationRecord: jest.fn(),
}))

import { GET, POST } from '@/app/api/compensation/records/route'
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from '@/app/api/compensation/records/[id]/route'
import * as compensationService from '@/lib/compensation/service'

describe('Compensation Records API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/compensation/records', () => {
    it('should return user compensation history', async () => {
      const mockRecords = [
        { id: 'c1', type: 'salary', amount: 150000 },
        { id: 'c2', type: 'bonus', amount: 20000 },
      ]
      ;(compensationService.getUserCompensationHistory as jest.Mock).mockResolvedValue(mockRecords)

      const request = new Request('http://localhost/api/compensation/records')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
    })

    it('should filter by type', async () => {
      ;(compensationService.getUserCompensationHistory as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost/api/compensation/records?type=salary')
      await GET(request)

      expect(compensationService.getUserCompensationHistory).toHaveBeenCalledWith(
        'user1',
        { type: 'salary' }
      )
    })
  })

  describe('POST /api/compensation/records', () => {
    it('should create a compensation record', async () => {
      const mockRecord = {
        id: 'c1',
        userId: 'user1',
        type: 'salary',
        amount: 150000,
      }
      ;(compensationService.createCompensationRecord as jest.Mock).mockResolvedValue(mockRecord)

      const request = new Request('http://localhost/api/compensation/records', {
        method: 'POST',
        body: JSON.stringify({
          type: 'salary',
          amount: 150000,
          effectiveDate: '2024-01-01',
          company: 'Tech Corp',
          role: 'Senior Engineer',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('c1')
    })

    it('should return 400 for missing fields', async () => {
      const request = new Request('http://localhost/api/compensation/records', {
        method: 'POST',
        body: JSON.stringify({ type: 'salary' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/compensation/records/[id]', () => {
    it('should return a compensation record', async () => {
      const mockRecord = { id: 'c1', type: 'salary', amount: 150000 }
      ;(compensationService.getCompensationRecordById as jest.Mock).mockResolvedValue(mockRecord)

      const request = new Request('http://localhost/api/compensation/records/c1')
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'c1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('c1')
    })

    it('should return 404 for non-existent record', async () => {
      ;(compensationService.getCompensationRecordById as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/compensation/records/notfound')
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'notfound' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/compensation/records/[id]', () => {
    it('should update a compensation record', async () => {
      const mockRecord = { id: 'c1', amount: 160000 }
      ;(compensationService.updateCompensationRecord as jest.Mock).mockResolvedValue(mockRecord)

      const request = new Request('http://localhost/api/compensation/records/c1', {
        method: 'PUT',
        body: JSON.stringify({ amount: 160000 }),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'c1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.amount).toBe(160000)
    })
  })

  describe('DELETE /api/compensation/records/[id]', () => {
    it('should delete a compensation record', async () => {
      ;(compensationService.deleteCompensationRecord as jest.Mock).mockResolvedValue({ id: 'c1' })

      const request = new Request('http://localhost/api/compensation/records/c1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'c1' }) })

      expect(response.status).toBe(204)
    })
  })
})
