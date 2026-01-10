// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
      stream: jest.fn(),
    },
  })),
}))

import {
  createStreamingResponse,
  parseStreamChunk,
  StreamChunk,
} from '@/lib/streaming/service'

describe('Streaming Service', () => {
  describe('createStreamingResponse', () => {
    it('should create a readable stream', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } }
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: ' World' } }
          yield { type: 'message_stop' }
        },
      }

      const stream = createStreamingResponse({
        systemPrompt: 'You are helpful',
        messages: [{ role: 'user', content: 'Hi' }],
        mockStream,
      })

      expect(stream).toBeDefined()
      expect(typeof stream[Symbol.asyncIterator]).toBe('function')
    })

    it('should emit tokens as they arrive', async () => {
      const tokens: (string | undefined)[] = []
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } }
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: ' World' } }
          yield { type: 'message_stop' }
        },
      }

      const stream = createStreamingResponse({
        systemPrompt: 'You are helpful',
        messages: [{ role: 'user', content: 'Hi' }],
        mockStream,
      })

      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          tokens.push(chunk.text)
        }
      }

      expect(tokens).toEqual(['Hello', ' World'])
    })

    it('should handle connection errors', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } }
          throw new Error('Connection lost')
        },
      }

      const stream = createStreamingResponse({
        systemPrompt: 'You are helpful',
        messages: [{ role: 'user', content: 'Hi' }],
        mockStream,
      })

      const chunks: StreamChunk[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      // Should have received text content and an error chunk
      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks.some(c => c.type === 'error')).toBe(true)
    })

    it('should signal end of stream', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Done' } }
          yield { type: 'message_stop' }
        },
      }

      const stream = createStreamingResponse({
        systemPrompt: 'You are helpful',
        messages: [{ role: 'user', content: 'Hi' }],
        mockStream,
      })

      const chunks: StreamChunk[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const lastChunk = chunks[chunks.length - 1]
      expect(lastChunk.type).toBe('done')
    })
  })

  describe('parseStreamChunk', () => {
    it('should parse Anthropic text delta format', () => {
      const rawChunk = {
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: 'Hello' },
      }

      const result = parseStreamChunk(rawChunk)

      expect(result.type).toBe('text')
      expect(result.text).toBe('Hello')
    })

    it('should detect end of stream', () => {
      const rawChunk = { type: 'message_stop' }

      const result = parseStreamChunk(rawChunk)

      expect(result.type).toBe('done')
    })

    it('should handle malformed chunks gracefully', () => {
      const rawChunk = { invalid: 'data' }

      const result = parseStreamChunk(rawChunk)

      expect(result.type).toBe('unknown')
    })

    it('should parse message start events', () => {
      const rawChunk = {
        type: 'message_start',
        message: { id: 'msg_123', role: 'assistant' },
      }

      const result = parseStreamChunk(rawChunk)

      expect(result.type).toBe('start')
    })
  })
})

describe('Stream utilities', () => {
  it('should format SSE event correctly', async () => {
    const { formatSSEEvent } = await import('@/lib/streaming/service')

    const event = formatSSEEvent('text', { text: 'Hello' })

    expect(event).toContain('event: text')
    expect(event).toContain('data: {"text":"Hello"}')
    expect(event).toContain('\n\n')
  })

  it('should handle reconnection token', async () => {
    const { formatSSEEvent } = await import('@/lib/streaming/service')

    const event = formatSSEEvent('text', { text: 'Hi' }, 'token-123')

    expect(event).toContain('id: token-123')
  })
})
