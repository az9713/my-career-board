import { generateDirectorResponse } from './providers/anthropic'
import { DIRECTOR_PERSONAS, DirectorPersona, getDirector } from '../directors/personas'
import { BOARD_MEETING_PHASES, BoardMeetingPhase } from '../board/phases'

// Re-export for convenience (server-side only usage)
export { BOARD_MEETING_PHASES }
export type { BoardMeetingPhase }

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  speaker?: string // Director ID for assistant messages
}

export interface OrchestratorState {
  currentPhase: number
  conversationHistory: ConversationMessage[]
  activeDirector: string
  phaseQuestionIndex: number
}

export function initializeOrchestrator(): OrchestratorState {
  return {
    currentPhase: 0,
    conversationHistory: [],
    activeDirector: BOARD_MEETING_PHASES[0].leadDirector,
    phaseQuestionIndex: 0,
  }
}

export function getCurrentPhase(state: OrchestratorState): BoardMeetingPhase {
  return BOARD_MEETING_PHASES[state.currentPhase] || BOARD_MEETING_PHASES[0]
}

export function getActiveDirector(state: OrchestratorState): DirectorPersona {
  return getDirector(state.activeDirector) || DIRECTOR_PERSONAS[0]
}

export function getDirectorForPhase(phase: number): DirectorPersona {
  const phaseConfig = BOARD_MEETING_PHASES[phase] || BOARD_MEETING_PHASES[0]
  return getDirector(phaseConfig.leadDirector) || DIRECTOR_PERSONAS[0]
}

// Check if any director should interject based on user message
export function checkForInterjection(
  userMessage: string,
  currentDirector: string
): DirectorPersona | null {
  const messageLower = userMessage.toLowerCase()

  for (const director of DIRECTOR_PERSONAS) {
    if (director.id === currentDirector) continue

    const shouldInterject = director.interjectionTriggers.some(trigger =>
      messageLower.includes(trigger.toLowerCase())
    )

    if (shouldInterject && Math.random() > 0.6) { // 40% chance to interject
      return director
    }
  }

  return null
}

// Portfolio problem type for context
export interface PortfolioProblem {
  id: string
  name: string
  whatBreaks: string
  classification: string
  classificationReasoning?: string | null
  timeAllocation?: number | null
}

export async function generateBoardResponse(
  state: OrchestratorState,
  userMessage: string,
  portfolio: PortfolioProblem[] = []
): Promise<{ response: string; director: DirectorPersona; newState: OrchestratorState }> {
  const phase = getCurrentPhase(state)
  const director = getActiveDirector(state)

  // Check for interjection from another director
  const interjector = checkForInterjection(userMessage, state.activeDirector)
  const respondingDirector = interjector || director

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

  // Build context for the director
  const contextPrompt = `
You are in a quarterly board meeting, currently in the "${phase.name}" phase.
Phase description: ${phase.description}
${portfolioContext}
The user just said: "${userMessage}"

${interjector ? `You are interjecting because something the user said triggered your attention.` : `You are the lead director for this phase.`}

Respond naturally but stay in character. Keep it concise. Reference the user's specific problems from their portfolio when appropriate.
`

  const response = await generateDirectorResponse(
    respondingDirector.systemPrompt,
    state.conversationHistory.map(m => ({
      role: m.role,
      content: m.content,
    })),
    contextPrompt + '\n\nUser: ' + userMessage
  )

  // Update state
  const newHistory: ConversationMessage[] = [
    ...state.conversationHistory,
    { role: 'user', content: userMessage },
    { role: 'assistant', content: response, speaker: respondingDirector.id },
  ]

  // Determine if we should advance phase
  let newPhase = state.currentPhase
  let newQuestionIndex = state.phaseQuestionIndex

  // Simple heuristic: advance after 2-3 exchanges per phase
  const phaseExchanges = newHistory.filter(m =>
    m.role === 'assistant' && m.speaker === phase.leadDirector
  ).length

  if (phaseExchanges >= 2 && state.currentPhase < BOARD_MEETING_PHASES.length - 1) {
    newPhase = state.currentPhase + 1
    newQuestionIndex = 0
  }

  return {
    response,
    director: respondingDirector,
    newState: {
      currentPhase: newPhase,
      conversationHistory: newHistory,
      activeDirector: BOARD_MEETING_PHASES[newPhase].leadDirector,
      phaseQuestionIndex: newQuestionIndex,
    },
  }
}

export function getOpeningMessage(state: OrchestratorState): { message: string; director: DirectorPersona } {
  const phase = getCurrentPhase(state)
  const director = getDirector(phase.leadDirector) || DIRECTOR_PERSONAS[0]

  return {
    message: phase.questions[0],
    director,
  }
}
