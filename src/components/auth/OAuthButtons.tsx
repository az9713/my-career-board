'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { OAuthProviderButton } from './OAuthProviderButton'

interface Provider {
  id: string
  name: string
  icon: string
  color: string
}

interface OAuthButtonsProps {
  callbackUrl?: string
}

export function OAuthButtons({ callbackUrl = '/dashboard' }: OAuthButtonsProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const response = await fetch('/api/oauth/providers')
        if (response.ok) {
          const data = await response.json()
          setProviders(data.providers)
        }
      } catch (error) {
        console.error('Failed to fetch providers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [])

  const handleSignIn = async (providerId: string) => {
    setSigningIn(providerId)
    try {
      await signIn(providerId, { callbackUrl })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setSigningIn(null)
    }
  }

  if (loading) {
    return (
      <div data-testid="oauth-loading" className="space-y-3">
        <div className="h-12 bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-12 bg-slate-700 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (providers.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-slate-900 text-slate-400">
            Or continue with
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {providers.map((provider) => (
          <OAuthProviderButton
            key={provider.id}
            provider={provider}
            onClick={() => handleSignIn(provider.id)}
            isLoading={signingIn === provider.id}
          />
        ))}
      </div>
    </div>
  )
}
