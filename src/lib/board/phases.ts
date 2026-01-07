// Board meeting phase definitions - safe to import on client side

export interface BoardMeetingPhase {
  id: number
  name: string
  description: string
  leadDirector: string
  questions: string[]
}

export const BOARD_MEETING_PHASES: BoardMeetingPhase[] = [
  {
    id: 0,
    name: 'Opening',
    description: 'Set the context for the meeting',
    leadDirector: 'strategist',
    questions: [
      "Let's start with the big picture. What quarter are we reviewing, and what did you set out to accomplish?",
    ],
  },
  {
    id: 1,
    name: 'Last Quarter Review',
    description: 'Review commitments and results',
    leadDirector: 'accountability_hawk',
    questions: [
      "What were your specific bets from last quarter? Let's see the receipts.",
      "For each bet, were you right or wrong? What's the evidence?",
    ],
  },
  {
    id: 2,
    name: 'Avoidance Audit',
    description: 'Surface avoided decisions and conversations',
    leadDirector: 'avoidance_hunter',
    questions: [
      "What decision have you been avoiding? Be specific.",
      "What conversation have you been putting off? Who, about what?",
    ],
  },
  {
    id: 3,
    name: 'Market Check',
    description: 'Assess market position and value',
    leadDirector: 'market_reality',
    questions: [
      "How has your market value changed this quarter? What evidence do you have?",
      "Which of your skills is depreciating fastest? What are you doing about it?",
    ],
  },
  {
    id: 4,
    name: 'Strategy Review',
    description: 'Evaluate long-term trajectory',
    leadDirector: 'strategist',
    questions: [
      "Zoom out: where is your current path leading in 5 years?",
      "Are you playing the right game, or just playing the current game well?",
    ],
  },
  {
    id: 5,
    name: 'Next Quarter Bets',
    description: 'Set falsifiable commitments',
    leadDirector: 'devils_advocate',
    questions: [
      "What are your bets for next quarter? Make them falsifiable.",
      "How will you know if you were wrong? What would make these bets fail?",
    ],
  },
]
