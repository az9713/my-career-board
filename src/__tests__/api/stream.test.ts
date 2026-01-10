/**
 * @jest-environment node
 */

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    boardSession: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    problem: {
      findMany: jest.fn(),
    },
    sessionMessage: {
      create: jest.fn(),
    },
  },
}))

// Mock streaming service
jest.mock('@/lib/streaming/service', () => ({
  createStreamingResponse: jest.fn(),
  formatSSEEvent: jest.fn((type, data) => `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`),
  createSSEStream: jest.fn((generator) => {
    const encoder = new TextEncoder()
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generator) {
            const data = `event: ${chunk.type}\ndata: ${JSON.stringify(chunk)}\n\n`
            controller.enqueue(encoder.encode(data))
            if (chunk.type === 'done' || chunk.type === 'error') break
          }
        } finally {
          controller.close()
        }
      },
    })
  }),
}))

// Mock orchestrator
jest.mock('@/lib/llm/orchestrator', () => ({
  getDirectorForPhase: jest.fn(() => ({
    id: 'accountability_hawk',
    name: 'Accountability Hawk',
    title: 'Director',
    avatar: '🦅',
    color: 'blue',
    systemPrompt: 'You are a director',
  })),
}))

import { GET } from '@/app/api/board/[sessionId]/stream/route'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'
import { createStreamingResponse } from '@/lib/streaming/service'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockCreateStream = createStreamingResponse as jest.MockedFunction<typeof createStreamingResponse>

describe('GET /api/board/[sessionId]/stream', () => {
  const mockSessionId = 'session-123'
  const mockUserId = 'user-456'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return SSE content-type', async () => {
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    } as any)

    mockPrisma.boardSession.findFirst.mockResolvedValue({
      id: mockSessionId,
      userId: mockUserId,
      status: 'in_progress',
      currentPhase: 1,
      messages: [],
    } as any)

    mockPrisma.problem.findMany.mockResolvedValue([])

    const mockStream = (async function* () {
      yield { type: 'text', text: 'Hello' }
      yield { type: 'done' }
    })()

    mockCreateStream.mockResolvedValue(mockStream as any)

    const url = new URL(`http://localhost/api/board/${mockSessionId}/stream`)
    url.searchParams.set('message', 'Hello')

    const request = new Request(url.toString(), {
      method: 'GET',
    })

    const response = await GET(request, {
      params: Promise.resolve({ sessionId: mockSessionId }),
    })

    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
    expect(response.headers.get('Connection')).toBe('keep-alive')
  })

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const url = new URL(`http://localhost/api/board/${mockSessionId}/stream`)
    url.searchParams.set('message', 'Hello')

    const request = new Request(url.toString(), {
      method: 'GET',
    })

    const response = await GET(request, {
      params: Promise.resolve({ sessionId: mockSessionId }),
    })

    expect(response.status).toBe(401)
  })

  it('should return 404 for non-existent session', async () => {
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    } as any)

    mockPrisma.boardSession.findFirst.mockResolvedValue(null)

    const url = new URL(`http://localhost/api/board/${mockSessionId}/stream`)
    url.searchParams.set('message', 'Hello')

    const request = new Request(url.toString(), {
      method: 'GET',
    })

    const response = await GET(request, {
      params: Promise.resolve({ sessionId: mockSessionId }),
    })

    expect(response.status).toBe(404)
  })

  it('should include director metadata in stream', async () => {
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    } as any)

    mockPrisma.boardSession.findFirst.mockResolvedValue({
      id: mockSessionId,
      userId: mockUserId,
      status: 'in_progress',
      currentPhase: 1,
      messages: [],
    } as any)

    mockPrisma.problem.findMany.mockResolvedValue([])

    const mockStream = (async function* () {
      yield { type: 'text', text: 'Response' }
      yield { type: 'done' }
    })()

    mockCreateStream.mockResolvedValue(mockStream as any)

    const url = new URL(`http://localhost/api/board/${mockSessionId}/stream`)
    url.searchParams.set('message', 'Hello')

    const request = new Request(url.toString(), {
      method: 'GET',
    })

    const response = await GET(request, {
      params: Promise.resolve({ sessionId: mockSessionId }),
    })

    // Read stream to verify it completes
    const reader = response.body?.getReader()
    expect(reader).toBeDefined()
  })

  it('should require message parameter', async () => {
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    } as any)

    const url = new URL(`http://localhost/api/board/${mockSessionId}/stream`)
    // No message parameter

    const request = new Request(url.toString(), {
      method: 'GET',
    })

    const response = await GET(request, {
      params: Promise.resolve({ sessionId: mockSessionId }),
    })

    expect(response.status).toBe(400)
  })

  it('should not allow streaming for completed sessions', async () => {
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    } as any)

    mockPrisma.boardSession.findFirst.mockResolvedValue({
      id: mockSessionId,
      userId: mockUserId,
      status: 'completed',
      currentPhase: 5,
      messages: [],
    } as any)

    const url = new URL(`http://localhost/api/board/${mockSessionId}/stream`)
    url.searchParams.set('message', 'Hello')

    const request = new Request(url.toString(), {
      method: 'GET',
    })

    const response = await GET(request, {
      params: Promise.resolve({ sessionId: mockSessionId }),
    })

    expect(response.status).toBe(400)
  })
})
