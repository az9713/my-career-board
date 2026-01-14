'use client'

import { useState, useEffect } from 'react'
import { CalendarEventCard } from './CalendarEventCard'

interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  startTime: string
  endTime: string
  type: string
}

export function UpcomingEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/calendar/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleDelete = async (eventId: string) => {
    try {
      const response = await fetch(`/api/calendar/events?eventId=${eventId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId))
      }
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  if (loading) {
    return (
      <div data-testid="calendar-loading" className="space-y-3">
        <div className="h-24 bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-24 bg-slate-700 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No upcoming events scheduled.</p>
        <p className="text-sm text-slate-500 mt-1">
          Schedule a board meeting or check-in to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Upcoming Events</h3>
      <div className="space-y-3">
        {events.map((event) => (
          <CalendarEventCard
            key={event.id}
            event={event}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}
