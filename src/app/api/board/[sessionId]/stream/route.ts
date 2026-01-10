import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'
import { getDirectorForPhase } from '@/lib/llm/orchestrator'
import {
  createStreamingResponse,
  createSSEStream,
  formatSSEEvent,
} from '@/lib/streaming/service'

export const dynamic = 'force-dynamic'

// GET /api/board/[sessionId]/stream - SSE endpoint for streaming responses
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { sessionId } = await params
    const url = new URL(request.url)
    const message = url.searchParams.get('message')

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get the board session
    const boardSession = await prisma.boardSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!boardSession) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (boardSession.status === 'completed') {
      return new Response(JSON.stringify({ error: 'Session already completed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get user's portfolio for context
    const portfolio = await prisma.problem.findMany({
      where: { userId: session.user.id },
      orderBy: { timeAllocation: 'desc' },
    })

    // Get the director for this phase
    const director = getDirectorForPhase(boardSession.currentPhase)

    // Build portfolio context
    const portfolioContext = portfolio.length > 0 ? `
THE USER'S PROBLEM PORTFOLIO (what they're paid to solve):
${portfolio.map((p, i) => `
${i + 1}. "${p.name}" (${p.classification}, ${p.timeAllocation || 0}% of time)
   - What breaks if ignored: ${p.whatBreaks}
   ${p.classificationReasoning ? `- Classification reasoning: ${p.classificationReasoning}` : ''}
`).join('')}

Use this portfolio knowledge in your responses. Reference specific problems by name when relevant.
` : ''

    // Reconstruct conversation history
    const conversationHistory = boardSession.messages.map(m => ({
      role: (m.speaker === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }))

    // Build system prompt
    const systemPrompt = `${director.systemPrompt}

You are in a quarterly board meeting.
${portfolioContext}

Respond naturally but stay in character. Keep it concise.`

    // Add the new user message to history
    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: message },
    ]

    // Store the user message
    await prisma.sessionMessage.create({
      data: {
        sessionId,
        speaker: 'user',
        content: message,
        messageType: 'user_message',
      },
    })

    // Create the streaming response
    const streamGenerator = createStreamingResponse({
      systemPrompt,
      messages,
    })

    // Wrap the generator to capture the full response and store it
    async function* wrappedGenerator() {
      // First send the director info
      yield {
        type: 'director' as const,
        director: {
          id: director.id,
          name: director.name,
          title: director.title,
          avatar: director.avatar,
          color: director.color,
        },
      }

      let fullText = ''
      for await (const chunk of streamGenerator) {
        if (chunk.type === 'text' && chunk.text) {
          fullText += chunk.text
        }
        yield chunk

        // When done, store the response
        if (chunk.type === 'done') {
          await prisma.sessionMessage.create({
            data: {
              sessionId,
              speaker: director.id,
              content: fullText,
              messageType: 'director_response',
              metadata: JSON.stringify({
                directorName: director.name,
                directorTitle: director.title,
                phase: boardSession.currentPhase,
              }),
            },
          })
        }
      }
    }

    const sseStream = createSSEStream(wrappedGenerator() as AsyncGenerator<{
      type: string;
      text?: string;
      fullText?: string;
      error?: string;
    }>)

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Streaming error:', error)
    return new Response(JSON.stringify({ error: 'Streaming failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
