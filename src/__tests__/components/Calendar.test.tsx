import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: 'user-123', email: 'test@example.com' } },
    status: 'authenticated',
  })),
}))

import { UpcomingEvents } from '@/components/calendar/UpcomingEvents'
import { AddToCalendarButton } from '@/components/calendar/AddToCalendarButton'
import { CalendarSyncSettings } from '@/components/calendar/CalendarSyncSettings'
import { CalendarEventCard } from '@/components/calendar/CalendarEventCard'

describe('UpcomingEvents Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<UpcomingEvents />)

    expect(screen.getByTestId('calendar-loading')).toBeInTheDocument()
  })

  it('should display upcoming events', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          events: [
            {
              id: 'event-1',
              title: 'Q1 Board Review',
              startTime: '2025-04-01T10:00:00Z',
              endTime: '2025-04-01T11:00:00Z',
              type: 'quarterly_review',
            },
            {
              id: 'event-2',
              title: 'Team Sync Meeting',
              startTime: '2025-01-20T09:00:00Z',
              endTime: '2025-01-20T09:30:00Z',
              type: 'weekly_checkin',
            },
          ],
        }),
    } as any)

    render(<UpcomingEvents />)

    await waitFor(() => {
      expect(screen.getByText('Q1 Board Review')).toBeInTheDocument()
      expect(screen.getByText('Team Sync Meeting')).toBeInTheDocument()
    })
  })

  it('should display empty state when no events', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: [] }),
    } as any)

    render(<UpcomingEvents />)

    await waitFor(() => {
      expect(screen.getByText(/no upcoming events/i)).toBeInTheDocument()
    })
  })

  it('should allow deleting events', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            events: [
              {
                id: 'event-1',
                title: 'Test Event',
                startTime: '2025-04-01T10:00:00Z',
                endTime: '2025-04-01T11:00:00Z',
                type: 'quarterly_review',
              },
            ],
          }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as any)

    render(<UpcomingEvents />)

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/calendar/events?eventId=event-1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  it('should display event type badges', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          events: [
            {
              id: 'event-1',
              title: 'Q1 Review',
              startTime: '2025-04-01T10:00:00Z',
              endTime: '2025-04-01T11:00:00Z',
              type: 'quarterly_review',
            },
          ],
        }),
    } as any)

    render(<UpcomingEvents />)

    await waitFor(() => {
      expect(screen.getByText(/quarterly/i)).toBeInTheDocument()
    })
  })
})

describe('AddToCalendarButton Component', () => {
  const mockEvent = {
    title: 'Board Meeting',
    startTime: new Date('2025-04-01T10:00:00Z'),
    endTime: new Date('2025-04-01T11:00:00Z'),
    description: 'Quarterly review meeting',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render add to calendar button', () => {
    render(<AddToCalendarButton event={mockEvent} />)

    expect(screen.getByRole('button', { name: /add to calendar/i })).toBeInTheDocument()
  })

  it('should show dropdown with calendar options', async () => {
    render(<AddToCalendarButton event={mockEvent} />)

    const button = screen.getByRole('button', { name: /add to calendar/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/google calendar/i)).toBeInTheDocument()
      expect(screen.getByText(/download ics/i)).toBeInTheDocument()
    })
  })

  it('should generate Google Calendar link', async () => {
    render(<AddToCalendarButton event={mockEvent} />)

    const button = screen.getByRole('button', { name: /add to calendar/i })
    fireEvent.click(button)

    const googleOption = await screen.findByText(/google calendar/i)
    expect(googleOption.closest('a')).toHaveAttribute(
      'href',
      expect.stringContaining('calendar.google.com')
    )
  })

  it('should trigger ICS download on click', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['ICS content'], { type: 'text/calendar' })),
    } as any)

    // Mock URL.createObjectURL and click
    const mockCreateObjectURL = jest.fn(() => 'blob:test')
    const mockRevokeObjectURL = jest.fn()
    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL

    render(<AddToCalendarButton event={mockEvent} />)

    const button = screen.getByRole('button', { name: /add to calendar/i })
    fireEvent.click(button)

    const downloadOption = await screen.findByText(/download ics/i)
    fireEvent.click(downloadOption)

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled()
    })
  })
})

describe('CalendarSyncSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display current sync status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          connected: true,
          provider: 'google',
          lastSync: '2025-01-15T10:00:00Z',
        }),
    } as any)

    render(<CalendarSyncSettings />)

    await waitFor(() => {
      expect(screen.getByText(/connected/i)).toBeInTheDocument()
      expect(screen.getByText(/google/i)).toBeInTheDocument()
    })
  })

  it('should display disconnected state', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          connected: false,
          provider: null,
        }),
    } as any)

    render(<CalendarSyncSettings />)

    await waitFor(() => {
      expect(screen.getByText(/not connected/i)).toBeInTheDocument()
    })
  })

  it('should show connect buttons when disconnected', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          connected: false,
          provider: null,
        }),
    } as any)

    render(<CalendarSyncSettings />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connect google/i })).toBeInTheDocument()
    })
  })

  it('should trigger sync when button clicked', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            connected: true,
            provider: 'google',
            lastSync: '2025-01-15T10:00:00Z',
          }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            syncedCount: 3,
          }),
      } as any)

    render(<CalendarSyncSettings />)

    await waitFor(() => {
      expect(screen.getByText(/connected/i)).toBeInTheDocument()
    })

    const syncButton = screen.getByRole('button', { name: /sync now/i })
    fireEvent.click(syncButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/calendar/sync'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('should display last sync time', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          connected: true,
          provider: 'google',
          lastSync: '2025-01-15T10:00:00Z',
        }),
    } as any)

    render(<CalendarSyncSettings />)

    await waitFor(() => {
      expect(screen.getByText(/last synced/i)).toBeInTheDocument()
    })
  })
})

describe('CalendarEventCard Component', () => {
  const mockEvent = {
    id: 'event-1',
    title: 'Q1 Board Review',
    description: 'Quarterly accountability session',
    startTime: '2025-04-01T10:00:00Z',
    endTime: '2025-04-01T11:00:00Z',
    type: 'quarterly_review',
  }

  it('should display event title and time', () => {
    render(<CalendarEventCard event={mockEvent} />)

    expect(screen.getByText('Q1 Board Review')).toBeInTheDocument()
    expect(screen.getByText(/apr 1/i)).toBeInTheDocument()
  })

  it('should display event type badge', () => {
    render(<CalendarEventCard event={mockEvent} />)

    expect(screen.getByText(/quarterly/i)).toBeInTheDocument()
  })

  it('should show description when expanded', async () => {
    render(<CalendarEventCard event={mockEvent} />)

    const expandButton = screen.getByRole('button', { name: /expand/i })
    fireEvent.click(expandButton)

    await waitFor(() => {
      expect(screen.getByText(/quarterly accountability session/i)).toBeInTheDocument()
    })
  })

  it('should call onDelete when delete button clicked', () => {
    const onDelete = jest.fn()

    render(<CalendarEventCard event={mockEvent} onDelete={onDelete} />)

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith('event-1')
  })

  it('should format time in user timezone', () => {
    render(<CalendarEventCard event={mockEvent} />)

    // Should show time in a readable format
    expect(screen.getByText(/10:00/i)).toBeInTheDocument()
  })
})
