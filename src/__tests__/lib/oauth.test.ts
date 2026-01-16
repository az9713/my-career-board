/**
 * @jest-environment node
 */

import {
  getOAuthProviders,
  getProviderConfig,
  handleOAuthCallback,
  linkOAuthAccount,
  unlinkOAuthAccount,
  getLinkedAccounts,
  OAuthProvider,
} from '@/lib/oauth/service'

// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

describe('OAuth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getOAuthProviders', () => {
    it('should return list of available OAuth providers', () => {
      const providers = getOAuthProviders()

      expect(providers).toContainEqual(
        expect.objectContaining({ id: 'google', name: 'Google' })
      )
      expect(providers).toContainEqual(
        expect.objectContaining({ id: 'github', name: 'GitHub' })
      )
    })

    it('should include provider icons', () => {
      const providers = getOAuthProviders()

      providers.forEach((provider) => {
        expect(provider.icon).toBeDefined()
      })
    })

    it('should include provider colors', () => {
      const providers = getOAuthProviders()

      const google = providers.find((p) => p.id === 'google')
      const github = providers.find((p) => p.id === 'github')

      expect(google?.color).toBeDefined()
      expect(github?.color).toBeDefined()
    })
  })

  describe('getProviderConfig', () => {
    it('should return Google provider config', () => {
      const config = getProviderConfig('google')

      expect(config).toBeDefined()
      expect(config?.id).toBe('google')
      expect(config?.name).toBe('Google')
    })

    it('should return GitHub provider config', () => {
      const config = getProviderConfig('github')

      expect(config).toBeDefined()
      expect(config?.id).toBe('github')
      expect(config?.name).toBe('GitHub')
    })

    it('should return null for unknown provider', () => {
      const config = getProviderConfig('unknown' as OAuthProvider)

      expect(config).toBeNull()
    })
  })

  describe('handleOAuthCallback', () => {
    it('should create new user if not exists', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'test@gmail.com',
        name: 'Test User',
      })
      prisma.account.create.mockResolvedValue({})

      const result = await handleOAuthCallback({
        provider: 'google',
        providerAccountId: 'google-123',
        email: 'test@gmail.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      })

      expect(result.user).toBeDefined()
      expect(result.isNewUser).toBe(true)
      expect(prisma.user.create).toHaveBeenCalled()
    })

    it('should link account to existing user', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user-id',
        email: 'test@gmail.com',
      })
      prisma.account.findFirst.mockResolvedValue(null)
      prisma.account.create.mockResolvedValue({})

      const result = await handleOAuthCallback({
        provider: 'google',
        providerAccountId: 'google-123',
        email: 'test@gmail.com',
        name: 'Test User',
      })

      expect(result.user.id).toBe('existing-user-id')
      expect(result.isNewUser).toBe(false)
    })

    it('should return existing linked account', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.account.findFirst.mockResolvedValue({
        userId: 'existing-user-id',
        provider: 'google',
      })
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user-id',
        email: 'test@gmail.com',
      })

      const result = await handleOAuthCallback({
        provider: 'google',
        providerAccountId: 'google-123',
        email: 'test@gmail.com',
        name: 'Test User',
      })

      expect(result.user.id).toBe('existing-user-id')
      expect(result.isNewUser).toBe(false)
    })
  })

  describe('linkOAuthAccount', () => {
    it('should link OAuth account to existing user', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.account.findFirst.mockResolvedValue(null)
      prisma.account.create.mockResolvedValue({
        id: 'account-id',
        provider: 'github',
        providerAccountId: 'github-456',
      })

      const result = await linkOAuthAccount('user-123', {
        provider: 'github',
        providerAccountId: 'github-456',
        accessToken: 'token',
      })

      expect(result.success).toBe(true)
      expect(prisma.account.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-123',
            provider: 'github',
          }),
        })
      )
    })

    it('should fail if account already linked', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.account.findFirst.mockResolvedValue({
        id: 'existing-account',
        provider: 'github',
      })

      const result = await linkOAuthAccount('user-123', {
        provider: 'github',
        providerAccountId: 'github-456',
        accessToken: 'token',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('already linked')
    })
  })

  describe('unlinkOAuthAccount', () => {
    it('should unlink OAuth account', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.account.findFirst.mockResolvedValue({
        id: 'account-id',
        provider: 'github',
        userId: 'user-123',
      })
      prisma.account.findMany.mockResolvedValue([
        { provider: 'github' },
        { provider: 'credentials' },
      ])
      prisma.account.delete.mockResolvedValue({})

      const result = await unlinkOAuthAccount('user-123', 'github')

      expect(result.success).toBe(true)
      expect(prisma.account.delete).toHaveBeenCalled()
    })

    it('should fail if account not found', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.account.findFirst.mockResolvedValue(null)

      const result = await unlinkOAuthAccount('user-123', 'github')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should fail if it is the only auth method', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.account.findFirst.mockResolvedValue({
        id: 'account-id',
        provider: 'google',
      })
      prisma.account.findMany.mockResolvedValue([{ provider: 'google' }])

      const result = await unlinkOAuthAccount('user-123', 'google')

      expect(result.success).toBe(false)
      expect(result.error).toContain('only auth method')
    })
  })

  describe('getLinkedAccounts', () => {
    it('should return all linked OAuth accounts', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.account.findMany.mockResolvedValue([
        { provider: 'google', providerAccountId: 'google-123' },
        { provider: 'github', providerAccountId: 'github-456' },
      ])

      const accounts = await getLinkedAccounts('user-123')

      expect(accounts).toHaveLength(2)
      expect(accounts).toContainEqual(
        expect.objectContaining({ provider: 'google' })
      )
      expect(accounts).toContainEqual(
        expect.objectContaining({ provider: 'github' })
      )
    })

    it('should return empty array if no linked accounts', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.account.findMany.mockResolvedValue([])

      const accounts = await getLinkedAccounts('user-123')

      expect(accounts).toHaveLength(0)
    })
  })
})
