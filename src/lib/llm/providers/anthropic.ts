import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface GateEvaluationResult {
  isSpecific: boolean
  reason: string
}

export async function evaluateSpecificity(
  userResponse: string,
  gatePrompt: string
): Promise<GateEvaluationResult> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `${gatePrompt}\n\nUser's response: "${userResponse}"`,
        },
      ],
    })

    // Extract text from response
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        isSpecific: result.isSpecific ?? false,
        reason: result.reason ?? 'Unable to evaluate',
      }
    }

    return {
      isSpecific: false,
      reason: 'Unable to parse evaluation',
    }
  } catch (error) {
    console.error('Anthropic API error:', error)
    // Default to accepting the response if API fails
    return {
      isSpecific: true,
      reason: 'Evaluation unavailable - response accepted',
    }
  }
}

export async function generateDirectorResponse(
  systemPrompt: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): Promise<string> {
  try {
    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: userMessage },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    return response.content[0].type === 'text'
      ? response.content[0].text
      : ''
  } catch (error) {
    console.error('Anthropic API error:', error)
    throw new Error('Failed to generate response')
  }
}
