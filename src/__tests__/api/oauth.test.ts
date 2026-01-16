/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET as getLinkedAccounts, DELETE as unlinkAccount } from '@/app/api/oauth/accounts/route'
import { GET as getProviders } from '@/app/api/oauth/providers/route'

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    account: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

// Mock OAuth service
jest.mock('@/lib/oauth/service', () => ({
  getOAuthProviders: jest.fn().mockReturnValue([
    { id: 'google', name: 'Google', icon: 'GoogleIcon', color: '#4285F4' },
    { id: 'github', name: 'GitHub', icon: 'GithubIcon', color: '#333' },
  ]),
  getLinkedAccounts: jest.fn().mockResolvedValue([
    { provider: 'google', providerAccountId: 'google-123' },
  ]),
  unlinkOAuthAccount: jest.fn().mockResolvedValue({ success: true }),
}))

describe('OAuth API', () => {
  const mockSession = {
    user: { id: 'user-123', email: 'test@example.com' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const { auth } = require('@/auth')
    auth.mockResolvedValue(mockSession)
  })

  describe('GET /api/oauth/providers', () => {
    it('should return available OAuth providers', async () => {
      const request = new NextRequest('http://localhost/api/oauth/providers')

      const response = await getProviders(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.providers).toHaveLength(2)
      expect(data.providers[0].id).toBe('google')
      expect(data.providers[1].id).toBe('github')
    })

    it('should include provider metadata', async () => {
      const request = new NextRequest('http://localhost/api/oauth/providers')

      const response = await getProviders(request)
      const data = await response.json()

      expect(data.providers[0]).toHaveProperty('name')
      expect(data.providers[0]).toHaveProperty('icon')
      expect(data.providers[0]).toHaveProperty('color')
    })
  })

  describe('GET /api/oauth/accounts', () => {
    it('should return linked OAuth accounts', async () => {
      const request = new NextRequest('http://localhost/api/oauth/accounts')

      const response = await getLinkedAccounts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.accounts).toBeDefined()
      expect(data.accounts[0].provider).toBe('google')
    })

    it('should return 401 if not authenticated', async () => {
      const { auth } = require('@/auth')
      auth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/oauth/accounts')

      const response = await getLinkedAccounts(request)

      expect(response.status).toBe(401)
    })
  })

  describe('DELETE /api/oauth/accounts', () => {
    it('should unlink OAuth account', async () => {
      const { unlinkOAuthAccount } = require('@/lib/oauth/service')
      unlinkOAuthAccount.mockResolvedValue({ success: true })

      const request = new NextRequest(
        'http://localhost/api/oauth/accounts?provider=google',
        { method: 'DELETE' }
      )

      const response = await unlinkAccount(request)

      expect(response.status).toBe(200)
      expect(unlinkOAuthAccount).toHaveBeenCalledWith('user-123', 'google')
    })

    it('should return 400 if provider not specified', async () => {
      const request = new NextRequest('http://localhost/api/oauth/accounts', {
        method: 'DELETE',
      })

      const response = await unlinkAccount(request)

      expect(response.status).toBe(400)
    })

    it('should return 401 if not authenticated', async () => {
      const { auth } = require('@/auth')
      auth.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost/api/oauth/accounts?provider=google',
        { method: 'DELETE' }
      )

      const response = await unlinkAccount(request)

      expect(response.status).toBe(401)
    })

    it('should return error if unlink fails', async () => {
      const { unlinkOAuthAccount } = require('@/lib/oauth/service')
      unlinkOAuthAccount.mockResolvedValue({
        success: false,
        error: 'Cannot unlink only auth method',
      })

      const request = new NextRequest(
        'http://localhost/api/oauth/accounts?provider=google',
        { method: 'DELETE' }
      )

      const response = await unlinkAccount(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Cannot unlink')
    })
  })
})
