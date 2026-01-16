/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET as getContacts, POST as createContact } from '@/app/api/network/contacts/route'
import { GET as getContact, PUT as updateContact, DELETE as deleteContact } from '@/app/api/network/contacts/[id]/route'
import { POST as logInteraction } from '@/app/api/network/interactions/route'
import { GET as getFollowUps } from '@/app/api/network/follow-ups/route'
import { GET as getGoals, POST as createGoal } from '@/app/api/network/goals/route'
import { GET as getAnalytics } from '@/app/api/network/analytics/route'

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(() => Promise.resolve({ user: { id: 'user1' } })),
}))

// Mock service
jest.mock('@/lib/network/service', () => ({
  createContact: jest.fn(),
  getContactById: jest.fn(),
  getUserContacts: jest.fn(),
  updateContact: jest.fn(),
  deleteContact: jest.fn(),
  logInteraction: jest.fn(),
  getUpcomingFollowUps: jest.fn(),
  createNetworkingGoal: jest.fn(),
  getUserNetworkingGoals: jest.fn(),
  getNetworkAnalytics: jest.fn(),
}))

import * as networkService from '@/lib/network/service'

describe('Network API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/network/contacts', () => {
    it('should return user contacts', async () => {
      const mockContacts = [
        { id: 'c1', name: 'Jane Smith', relationship: 'mentor' },
        { id: 'c2', name: 'John Doe', relationship: 'peer' },
      ]
      ;(networkService.getUserContacts as jest.Mock).mockResolvedValue(mockContacts)

      const request = new NextRequest('http://localhost/api/network/contacts')
      const response = await getContacts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.contacts).toHaveLength(2)
    })

    it('should filter by relationship', async () => {
      ;(networkService.getUserContacts as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/network/contacts?relationship=mentor')
      await getContacts(request)

      expect(networkService.getUserContacts).toHaveBeenCalledWith('user1', { relationship: 'mentor' })
    })
  })

  describe('POST /api/network/contacts', () => {
    it('should create a new contact', async () => {
      const mockContact = { id: 'c1', name: 'Jane Smith', relationship: 'mentor' }
      ;(networkService.createContact as jest.Mock).mockResolvedValue(mockContact)

      const request = new NextRequest('http://localhost/api/network/contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Jane Smith',
          email: 'jane@example.com',
          relationship: 'mentor',
        }),
      })
      const response = await createContact(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.contact.name).toBe('Jane Smith')
    })
  })

  describe('GET /api/network/contacts/[id]', () => {
    it('should return a contact by id', async () => {
      const mockContact = { id: 'c1', name: 'Jane Smith', interactions: [] }
      ;(networkService.getContactById as jest.Mock).mockResolvedValue(mockContact)

      const request = new NextRequest('http://localhost/api/network/contacts/c1')
      const response = await getContact(request, { params: Promise.resolve({ id: 'c1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.contact.id).toBe('c1')
    })

    it('should return 404 for non-existent contact', async () => {
      ;(networkService.getContactById as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/network/contacts/invalid')
      const response = await getContact(request, { params: Promise.resolve({ id: 'invalid' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/network/contacts/[id]', () => {
    it('should update a contact', async () => {
      const mockContact = { id: 'c1', name: 'Jane Smith Updated', strength: 5 }
      ;(networkService.updateContact as jest.Mock).mockResolvedValue(mockContact)

      const request = new NextRequest('http://localhost/api/network/contacts/c1', {
        method: 'PUT',
        body: JSON.stringify({ strength: 5 }),
      })
      const response = await updateContact(request, { params: Promise.resolve({ id: 'c1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.contact.strength).toBe(5)
    })
  })

  describe('DELETE /api/network/contacts/[id]', () => {
    it('should delete a contact', async () => {
      ;(networkService.deleteContact as jest.Mock).mockResolvedValue({ id: 'c1' })

      const request = new NextRequest('http://localhost/api/network/contacts/c1', {
        method: 'DELETE',
      })
      const response = await deleteContact(request, { params: Promise.resolve({ id: 'c1' }) })

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/network/interactions', () => {
    it('should log an interaction', async () => {
      const mockInteraction = { id: 'int1', contactId: 'c1', type: 'meeting' }
      ;(networkService.logInteraction as jest.Mock).mockResolvedValue(mockInteraction)

      const request = new NextRequest('http://localhost/api/network/interactions', {
        method: 'POST',
        body: JSON.stringify({
          contactId: 'c1',
          type: 'meeting',
          summary: 'Career discussion',
        }),
      })
      const response = await logInteraction(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.interaction.type).toBe('meeting')
    })
  })

  describe('GET /api/network/follow-ups', () => {
    it('should return upcoming follow-ups', async () => {
      const mockFollowUps = [
        { id: 'c1', name: 'Jane', nextFollowUp: new Date() },
      ]
      ;(networkService.getUpcomingFollowUps as jest.Mock).mockResolvedValue(mockFollowUps)

      const request = new NextRequest('http://localhost/api/network/follow-ups')
      const response = await getFollowUps(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.followUps).toHaveLength(1)
    })
  })

  describe('GET /api/network/goals', () => {
    it('should return networking goals', async () => {
      const mockGoals = [{ id: 'g1', title: 'Goal 1', status: 'active' }]
      ;(networkService.getUserNetworkingGoals as jest.Mock).mockResolvedValue(mockGoals)

      const request = new NextRequest('http://localhost/api/network/goals')
      const response = await getGoals(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.goals).toHaveLength(1)
    })
  })

  describe('POST /api/network/goals', () => {
    it('should create a networking goal', async () => {
      const mockGoal = { id: 'g1', title: 'Expand network', category: 'expand-network' }
      ;(networkService.createNetworkingGoal as jest.Mock).mockResolvedValue(mockGoal)

      const request = new NextRequest('http://localhost/api/network/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Expand network',
          category: 'expand-network',
          targetCount: 5,
        }),
      })
      const response = await createGoal(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.goal.title).toBe('Expand network')
    })
  })

  describe('GET /api/network/analytics', () => {
    it('should return network analytics', async () => {
      const mockAnalytics = {
        totalContacts: 25,
        byRelationship: { mentor: 5, peer: 15 },
        totalInteractions: 50,
      }
      ;(networkService.getNetworkAnalytics as jest.Mock).mockResolvedValue(mockAnalytics)

      const request = new NextRequest('http://localhost/api/network/analytics')
      const response = await getAnalytics(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics.totalContacts).toBe(25)
    })
  })
})
