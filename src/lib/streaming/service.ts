import Anthropic from '@anthropic-ai/sdk'

export interface StreamChunk {
  type: 'text' | 'done' | 'error' | 'start' | 'unknown'
  text?: string
  fullText?: string
  error?: string
  messageId?: string
}

export interface StreamingOptions {
  systemPrompt: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  maxTokens?: number
  model?: string
  // For testing purposes
  mockStream?: AsyncIterable<{ type: string; delta?: { type: string; text?: string }; message?: { id: string } }>
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Creates a streaming response from the Anthropic API
 */
export async function* createStreamingResponse(
  options: StreamingOptions
): AsyncGenerator<StreamChunk> {
  const { systemPrompt, messages, maxTokens = 1024, model = 'claude-sonnet-4-20250514', mockStream } = options

  let fullText = ''

  try {
    // Use mock stream for testing or real API
    const stream = mockStream || await anthropic.messages.stream({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    })

    for await (const event of stream) {
      if (event.type === 'message_start') {
        yield {
          type: 'start',
          messageId: (event as { message?: { id?: string } }).message?.id,
        }
      } else if (event.type === 'content_block_delta') {
        const delta = (event as { delta?: { type?: string; text?: string } }).delta
        if (delta?.type === 'text_delta' && delta.text) {
          fullText += delta.text
          yield {
            type: 'text',
            text: delta.text,
          }
        }
      } else if (event.type === 'message_stop') {
        yield {
          type: 'done',
          fullText,
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error'
    yield {
      type: 'error',
      error: errorMessage,
    }
  }
}

// Type for raw chunk parsing
interface RawStreamChunk {
  type?: string
  delta?: { type?: string; text?: string }
  message?: { id?: string; role?: string }
  error?: { message?: string }
}

/**
 * Parse a raw chunk from the Anthropic streaming API
 * Can accept either a JSON string or a parsed object
 */
export function parseStreamChunk(chunk: string | RawStreamChunk): StreamChunk {
  try {
    const parsed: RawStreamChunk = typeof chunk === 'string' ? JSON.parse(chunk) : chunk

    // Handle text delta events
    if (parsed.type === 'content_block_delta') {
      const delta = parsed.delta
      if (delta?.type === 'text_delta' && delta.text) {
        return {
          type: 'text',
          text: delta.text,
        }
      }
    }

    // Handle message start
    if (parsed.type === 'message_start') {
      return {
        type: 'start',
        messageId: parsed.message?.id,
      }
    }

    // Handle message stop (end of stream)
    if (parsed.type === 'message_stop') {
      return {
        type: 'done',
      }
    }

    // Handle errors
    if (parsed.type === 'error') {
      return {
        type: 'error',
        error: parsed.error?.message || 'Unknown error',
      }
    }

    // Unknown chunk type
    return {
      type: 'unknown',
    }
  } catch {
    // Malformed chunk - return unknown
    return {
      type: 'unknown',
    }
  }
}

/**
 * Format data for Server-Sent Events
 */
export function formatSSEEvent(eventType: string, data: unknown, reconnectionToken?: string): string {
  let result = ''
  if (reconnectionToken) {
    result += `id: ${reconnectionToken}\n`
  }
  result += `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
  return result
}

/**
 * Create a ReadableStream for SSE responses
 */
export function createSSEStream(
  generator: AsyncGenerator<StreamChunk>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          const sseData = formatSSEEvent(chunk.type, chunk)
          controller.enqueue(encoder.encode(sseData))

          // If we're done or hit an error, close the stream
          if (chunk.type === 'done' || chunk.type === 'error') {
            break
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Stream error'
        const errorData = formatSSEEvent('error', { type: 'error', error: errorMessage })
        controller.enqueue(encoder.encode(errorData))
      } finally {
        controller.close()
      }
    },
  })
}
