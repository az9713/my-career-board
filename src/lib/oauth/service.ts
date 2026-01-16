import prisma from '@/lib/prisma/client'

export type OAuthProvider = 'google' | 'github'

export interface ProviderConfig {
  id: OAuthProvider
  name: string
  icon: string
  color: string
}

export interface OAuthCallbackData {
  provider: OAuthProvider
  providerAccountId: string
  email: string
  name?: string
  image?: string
  accessToken?: string
  refreshToken?: string
}

export interface LinkAccountData {
  provider: OAuthProvider
  providerAccountId: string
  accessToken?: string
  refreshToken?: string
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'google',
    name: 'Google',
    icon: 'google',
    color: '#4285F4',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: 'github',
    color: '#333333',
  },
]

/**
 * Get list of available OAuth providers
 */
export function getOAuthProviders(): ProviderConfig[] {
  return PROVIDERS
}

/**
 * Get configuration for a specific provider
 */
export function getProviderConfig(providerId: OAuthProvider): ProviderConfig | null {
  return PROVIDERS.find((p) => p.id === providerId) || null
}

/**
 * Handle OAuth callback - create or link user
 */
export async function handleOAuthCallback(data: OAuthCallbackData): Promise<{
  user: { id: string; email: string; name?: string | null }
  isNewUser: boolean
}> {
  const { provider, providerAccountId, email, name, image, accessToken, refreshToken } = data

  // Check if account is already linked
  const existingAccount = await prisma.account.findFirst({
    where: {
      provider,
      providerAccountId,
    },
  })

  if (existingAccount) {
    const user = await prisma.user.findUnique({
      where: { id: existingAccount.userId },
    })

    if (user) {
      return { user: { id: user.id, email: user.email, name: user.name }, isNewUser: false }
    }
  }

  // Check if user exists with this email
  let user = await prisma.user.findUnique({
    where: { email },
  })

  let isNewUser = false

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: '', // OAuth users don't have a password
        avatarUrl: image,
      },
    })
    isNewUser = true
  }

  // Link OAuth account if not already linked
  const accountExists = await prisma.account.findFirst({
    where: {
      userId: user.id,
      provider,
    },
  })

  if (!accountExists) {
    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider,
        providerAccountId,
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    })
  }

  return {
    user: { id: user.id, email: user.email, name: user.name },
    isNewUser,
  }
}

/**
 * Link OAuth account to existing user
 */
export async function linkOAuthAccount(
  userId: string,
  data: LinkAccountData
): Promise<{ success: boolean; error?: string }> {
  const { provider, providerAccountId, accessToken, refreshToken } = data

  // Check if already linked
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId,
      provider,
    },
  })

  if (existingAccount) {
    return { success: false, error: `${provider} account is already linked` }
  }

  // Check if this OAuth account is linked to another user
  const otherUserAccount = await prisma.account.findFirst({
    where: {
      provider,
      providerAccountId,
    },
  })

  if (otherUserAccount) {
    return { success: false, error: `This ${provider} account is already linked to another user` }
  }

  await prisma.account.create({
    data: {
      userId,
      type: 'oauth',
      provider,
      providerAccountId,
      access_token: accessToken,
      refresh_token: refreshToken,
    },
  })

  return { success: true }
}

/**
 * Unlink OAuth account from user
 */
export async function unlinkOAuthAccount(
  userId: string,
  provider: OAuthProvider
): Promise<{ success: boolean; error?: string }> {
  // Find the account
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider,
    },
  })

  if (!account) {
    return { success: false, error: `${provider} account not found` }
  }

  // Check if user has other auth methods
  const allAccounts = await prisma.account.findMany({
    where: { userId },
  })

  // Check if user has a password set
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  const hasPassword = user?.password && user.password.length > 0
  const hasOtherOAuth = allAccounts.filter((a) => a.provider !== provider).length > 0

  if (!hasPassword && !hasOtherOAuth) {
    return {
      success: false,
      error: 'Cannot unlink only auth method. Add a password or link another account first.',
    }
  }

  await prisma.account.delete({
    where: { id: account.id },
  })

  return { success: true }
}

/**
 * Get all linked OAuth accounts for a user
 */
export async function getLinkedAccounts(
  userId: string
): Promise<Array<{ provider: string; providerAccountId: string }>> {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
      type: 'oauth',
    },
    select: {
      provider: true,
      providerAccountId: true,
    },
  })

  return accounts
}
