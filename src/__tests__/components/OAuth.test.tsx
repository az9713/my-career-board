/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { LinkedAccounts } from '@/components/auth/LinkedAccounts'
import { OAuthProviderButton } from '@/components/auth/OAuthProviderButton'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('OAuthButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        providers: [
          { id: 'google', name: 'Google', icon: 'google', color: '#4285F4' },
          { id: 'github', name: 'GitHub', icon: 'github', color: '#333' },
        ],
      }),
    })
  })

  it('should render OAuth provider buttons', async () => {
    render(<OAuthButtons />)

    await waitFor(() => {
      expect(screen.getByText(/google/i)).toBeInTheDocument()
      expect(screen.getByText(/github/i)).toBeInTheDocument()
    })
  })

  it('should show loading state initially', () => {
    render(<OAuthButtons />)

    expect(screen.getByTestId('oauth-loading')).toBeInTheDocument()
  })

  it('should call signIn when provider button clicked', async () => {
    const { signIn } = require('next-auth/react')

    render(<OAuthButtons />)

    await waitFor(() => {
      expect(screen.getByText(/google/i)).toBeInTheDocument()
    })

    const googleButton = screen.getByText(/google/i)
    await userEvent.click(googleButton)

    expect(signIn).toHaveBeenCalledWith('google', expect.any(Object))
  })

  it('should show divider text', async () => {
    render(<OAuthButtons />)

    await waitFor(() => {
      expect(screen.getByText(/or continue with/i)).toBeInTheDocument()
    })
  })

  it('should handle fetch error gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    })

    render(<OAuthButtons />)

    await waitFor(() => {
      expect(screen.queryByText(/google/i)).not.toBeInTheDocument()
    })
  })
})

describe('OAuthProviderButton', () => {
  it('should render provider button with name', () => {
    render(
      <OAuthProviderButton
        provider={{ id: 'google', name: 'Google', icon: 'google', color: '#4285F4' }}
        onClick={jest.fn()}
      />
    )

    expect(screen.getByText(/google/i)).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const onClick = jest.fn()

    render(
      <OAuthProviderButton
        provider={{ id: 'github', name: 'GitHub', icon: 'github', color: '#333' }}
        onClick={onClick}
      />
    )

    const button = screen.getByRole('button')
    await userEvent.click(button)

    expect(onClick).toHaveBeenCalled()
  })

  it('should show loading state when isLoading', () => {
    render(
      <OAuthProviderButton
        provider={{ id: 'google', name: 'Google', icon: 'google', color: '#4285F4' }}
        onClick={jest.fn()}
        isLoading={true}
      />
    )

    expect(screen.getByTestId('provider-loading')).toBeInTheDocument()
  })

  it('should be disabled when isLoading', () => {
    render(
      <OAuthProviderButton
        provider={{ id: 'google', name: 'Google', icon: 'google', color: '#4285F4' }}
        onClick={jest.fn()}
        isLoading={true}
      />
    )

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should apply provider color style', () => {
    render(
      <OAuthProviderButton
        provider={{ id: 'google', name: 'Google', icon: 'google', color: '#4285F4' }}
        onClick={jest.fn()}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveStyle({ borderColor: '#4285F4' })
  })
})

describe('LinkedAccounts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        accounts: [
          { provider: 'google', providerAccountId: 'google-123' },
        ],
      }),
    })
  })

  it('should fetch and display linked accounts', async () => {
    render(<LinkedAccounts />)

    await waitFor(() => {
      expect(screen.getByText(/google/i)).toBeInTheDocument()
    })
  })

  it('should show empty state when no accounts linked', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accounts: [] }),
    })

    render(<LinkedAccounts />)

    await waitFor(() => {
      expect(screen.getByText(/no linked accounts/i)).toBeInTheDocument()
    })
  })

  it('should show unlink button for linked accounts', async () => {
    render(<LinkedAccounts />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /unlink/i })).toBeInTheDocument()
    })
  })

  it('should call unlink API when unlink clicked', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accounts: [{ provider: 'google', providerAccountId: 'google-123' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

    render(<LinkedAccounts />)

    await waitFor(() => {
      expect(screen.getByText(/google/i)).toBeInTheDocument()
    })

    const unlinkButton = screen.getByRole('button', { name: /unlink/i })
    await userEvent.click(unlinkButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/oauth/accounts'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  it('should show link button for available providers', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accounts: [{ provider: 'google', providerAccountId: 'google-123' }],
        }),
      })

    render(<LinkedAccounts availableProviders={['google', 'github']} />)

    await waitFor(() => {
      expect(screen.getByText(/link github/i)).toBeInTheDocument()
    })
  })
})
