'use client'

import { useState } from 'react'

interface CalendarEvent {
  title: string
  startTime: Date
  endTime: Date
  description?: string
}

interface AddToCalendarButtonProps {
  event: CalendarEvent
}

export function AddToCalendarButton({ event }: AddToCalendarButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }

  const getGoogleCalendarUrl = () => {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatGoogleDate(event.startTime)}/${formatGoogleDate(event.endTime)}`,
      details: event.description || '',
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  const handleDownloadICS = async () => {
    try {
      // Create a simple ICS file for this single event
      const icsContent = generateICS(event)
      const blob = new Blob([icsContent], { type: 'text/calendar' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `${event.title.replace(/\s+/g, '-').toLowerCase()}.ics`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download ICS:', error)
    }

    setShowDropdown(false)
  }

  const generateICS = (event: CalendarEvent) => {
    const formatDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//My Career Board//EN
BEGIN:VEVENT
UID:${Date.now()}@my-career-board
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.startTime)}
DTEND:${formatDate(event.endTime)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
END:VEVENT
END:VCALENDAR`
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Add to calendar"
        className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Add to Calendar
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
          <a
            href={getGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            onClick={() => setShowDropdown(false)}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0 3c-3.866 0-7 3.134-7 7s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z" />
            </svg>
            Google Calendar
          </a>
          <button
            onClick={handleDownloadICS}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download ICS
          </button>
        </div>
      )}
    </div>
  )
}
