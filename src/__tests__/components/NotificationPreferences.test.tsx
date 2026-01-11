/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NotificationPreferences } from '@/components/settings/NotificationPreferences'
import { StreakWidget } from '@/components/dashboard/StreakWidget'

// Mock fetch
global.fetch = jest.fn()

describe('NotificationPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        emailEnabled: true,
        quarterlyReminders: true,
        weeklyCheckins: true,
        avoidanceAlerts: true,
        streakNotifications: true,
        notificationEmail: 'test@example.com',
      }),
    })
  })

  it('should render all preference toggles', async () => {
    render(<NotificationPreferences />)

    await waitFor(() => {
      expect(screen.getByText(/email notifications/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/quarterly review reminders/i)).toBeInTheDocument()
    expect(screen.getByText(/weekly check-ins/i)).toBeInTheDocument()
    expect(screen.getByText(/avoidance alerts/i)).toBeInTheDocument()
    expect(screen.getByText(/streak notifications/i)).toBeInTheDocument()
  })

  it('should load current preferences on mount', async () => {
    render(<NotificationPreferences />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/preferences')
    })
  })

  it('should toggle preference when clicked', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          emailEnabled: true,
          quarterlyReminders: true,
          weeklyCheckins: true,
          avoidanceAlerts: true,
          streakNotifications: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          emailEnabled: true,
          quarterlyReminders: true,
          weeklyCheckins: false,
          avoidanceAlerts: true,
          streakNotifications: true,
        }),
      })

    render(<NotificationPreferences />)

    await waitFor(() => {
      expect(screen.getByText(/weekly check-ins/i)).toBeInTheDocument()
    })

    const weeklyToggle = screen.getByTestId('toggle-weeklyCheckins')
    fireEvent.click(weeklyToggle)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/preferences',
        expect.objectContaining({
          method: 'PATCH',
        })
      )
    })
  })

  it('should save preferences on change', async () => {
    render(<NotificationPreferences />)

    await waitFor(() => {
      expect(screen.getByText(/quarterly review reminders/i)).toBeInTheDocument()
    })

    const quarterlyToggle = screen.getByTestId('toggle-quarterlyReminders')
    fireEvent.click(quarterlyToggle)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/preferences',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('quarterlyReminders'),
        })
      )
    })
  })

  it('should show error message on save failure', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          emailEnabled: true,
          quarterlyReminders: true,
          weeklyCheckins: true,
          avoidanceAlerts: true,
          streakNotifications: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to save' }),
      })

    render(<NotificationPreferences />)

    await waitFor(() => {
      expect(screen.getByText(/email notifications/i)).toBeInTheDocument()
    })

    const emailToggle = screen.getByTestId('toggle-emailEnabled')
    fireEvent.click(emailToggle)

    await waitFor(() => {
      expect(screen.getByText(/failed to save/i)).toBeInTheDocument()
    })
  })

  it('should disable child options when email is disabled', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        emailEnabled: false,
        quarterlyReminders: true,
        weeklyCheckins: true,
        avoidanceAlerts: true,
        streakNotifications: true,
      }),
    })

    render(<NotificationPreferences />)

    await waitFor(() => {
      expect(screen.getByTestId('toggle-quarterlyReminders')).toBeDisabled()
      expect(screen.getByTestId('toggle-weeklyCheckins')).toBeDisabled()
      expect(screen.getByTestId('toggle-avoidanceAlerts')).toBeDisabled()
      expect(screen.getByTestId('toggle-streakNotifications')).toBeDisabled()
    })
  })
})

describe('StreakWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display current streak count', () => {
    render(<StreakWidget current={5} longest={10} />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText(/week streak/i)).toBeInTheDocument()
  })

  it('should show flame icon for active streak', () => {
    render(<StreakWidget current={3} longest={5} />)

    expect(screen.getByTestId('streak-flame')).toBeInTheDocument()
  })

  it('should show longest streak', () => {
    render(<StreakWidget current={3} longest={10} />)

    expect(screen.getByText(/longest: 10/i)).toBeInTheDocument()
  })

  it('should show encouragement for zero streak', () => {
    render(<StreakWidget current={0} longest={5} />)

    expect(screen.getByText(/start your streak/i)).toBeInTheDocument()
  })

  it('should highlight milestone streaks', () => {
    render(<StreakWidget current={10} longest={10} />)

    expect(screen.getByTestId('streak-milestone')).toBeInTheDocument()
  })

  it('should show week vs weeks correctly', () => {
    const { rerender } = render(<StreakWidget current={1} longest={1} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText(/week streak/i)).toBeInTheDocument()

    rerender(<StreakWidget current={2} longest={2} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText(/week streak/i)).toBeInTheDocument()
  })
})
