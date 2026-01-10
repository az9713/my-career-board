/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { StreamingMessage } from '@/components/board/StreamingMessage'

// Mock the EventSource
class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onopen: (() => void) | null = null
  readyState = 0
  url: string

  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2

  constructor(url: string) {
    this.url = url
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = 1
      if (this.onopen) this.onopen()
    }, 0)
  }

  close() {
    this.readyState = 2
  }

  // Helper to simulate messages
  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }))
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

// Store reference to mock instance
let mockEventSourceInstance: MockEventSource | null = null

// @ts-expect-error - Mock EventSource globally
global.EventSource = jest.fn().mockImplementation((url: string) => {
  mockEventSourceInstance = new MockEventSource(url)
  return mockEventSourceInstance
})

describe('StreamingMessage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEventSourceInstance = null
  })

  it('should render loading state initially', () => {
    render(
      <StreamingMessage
        sessionId="session-123"
        message="Hello"
        onComplete={jest.fn()}
      />
    )

    expect(screen.getByTestId('streaming-loading')).toBeInTheDocument()
  })

  it('should display streamed text as it arrives', async () => {
    const onComplete = jest.fn()

    render(
      <StreamingMessage
        sessionId="session-123"
        message="Hello"
        onComplete={onComplete}
      />
    )

    await waitFor(() => {
      expect(mockEventSourceInstance).not.toBeNull()
    })

    // Simulate streaming text
    act(() => {
      mockEventSourceInstance?.simulateMessage({ type: 'text', text: 'Hello' })
    })

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    act(() => {
      mockEventSourceInstance?.simulateMessage({ type: 'text', text: ' world' })
    })

    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument()
    })
  })

  it('should show director avatar and name', async () => {
    render(
      <StreamingMessage
        sessionId="session-123"
        message="Hello"
        onComplete={jest.fn()}
        director={{
          id: 'accountability_hawk',
          name: 'Accountability Hawk',
          avatar: '🦅',
          color: 'blue',
        }}
      />
    )

    expect(screen.getByText('🦅')).toBeInTheDocument()
    expect(screen.getByText('Accountability Hawk')).toBeInTheDocument()
  })

  it('should call onComplete when stream ends', async () => {
    const onComplete = jest.fn()

    render(
      <StreamingMessage
        sessionId="session-123"
        message="Hello"
        onComplete={onComplete}
      />
    )

    await waitFor(() => {
      expect(mockEventSourceInstance).not.toBeNull()
    })

    act(() => {
      mockEventSourceInstance?.simulateMessage({ type: 'text', text: 'Response' })
    })

    act(() => {
      mockEventSourceInstance?.simulateMessage({ type: 'done', fullText: 'Response' })
    })

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('Response')
    })
  })

  it('should handle connection errors gracefully', async () => {
    const onError = jest.fn()

    render(
      <StreamingMessage
        sessionId="session-123"
        message="Hello"
        onComplete={jest.fn()}
        onError={onError}
      />
    )

    await waitFor(() => {
      expect(mockEventSourceInstance).not.toBeNull()
    })

    act(() => {
      mockEventSourceInstance?.simulateError()
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalled()
    })
  })

  it('should close connection on unmount', async () => {
    const { unmount } = render(
      <StreamingMessage
        sessionId="session-123"
        message="Hello"
        onComplete={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(mockEventSourceInstance).not.toBeNull()
    })

    const closeSpy = jest.spyOn(mockEventSourceInstance!, 'close')

    unmount()

    expect(closeSpy).toHaveBeenCalled()
  })

  it('should display typing indicator while streaming', async () => {
    render(
      <StreamingMessage
        sessionId="session-123"
        message="Hello"
        onComplete={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(mockEventSourceInstance).not.toBeNull()
    })

    act(() => {
      mockEventSourceInstance?.simulateMessage({ type: 'text', text: 'Hello' })
    })

    await waitFor(() => {
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
    })
  })

  it('should hide typing indicator when stream completes', async () => {
    render(
      <StreamingMessage
        sessionId="session-123"
        message="Hello"
        onComplete={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(mockEventSourceInstance).not.toBeNull()
    })

    act(() => {
      mockEventSourceInstance?.simulateMessage({ type: 'text', text: 'Response' })
    })

    act(() => {
      mockEventSourceInstance?.simulateMessage({ type: 'done', fullText: 'Response' })
    })

    await waitFor(() => {
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
    })
  })

  it('should construct correct SSE URL with message parameter', async () => {
    render(
      <StreamingMessage
        sessionId="session-123"
        message="Test message"
        onComplete={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(global.EventSource).toHaveBeenCalledWith(
        expect.stringContaining('/api/board/session-123/stream')
      )
      // Browser URL encoding uses + for spaces instead of %20
      expect(global.EventSource).toHaveBeenCalledWith(
        expect.stringMatching(/message=Test[+%20]message/)
      )
    })
  })
})
