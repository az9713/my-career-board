// Quick Audit Questions - 5 questions with specificity gates

export interface AuditQuestion {
  id: string
  question: string
  subtext: string
  placeholder: string
  gatePrompt: string // Prompt for LLM to evaluate specificity
  challengeMessages: string[] // Messages when response is too vague
  minWords: number // Minimum words for a valid response
}

export const auditQuestions: AuditQuestion[] = [
  {
    id: 'avoided_decision',
    question: "What decision have you been avoiding?",
    subtext: "Think about conversations you've postponed, choices you've deferred, or actions you've rationalized delaying.",
    placeholder: "I've been avoiding the decision to...",
    gatePrompt: `Evaluate if this response describes a SPECIFIC decision being avoided.
A specific response includes:
- A concrete action or choice (not just a feeling or general area)
- Who is involved or affected
- What the actual decision point is

Vague examples: "having difficult conversations", "making changes", "addressing issues"
Specific examples: "telling my manager I want to transition to the data science team", "deciding whether to accept the promotion that requires relocation"

Respond with JSON: {"isSpecific": boolean, "reason": string}`,
    challengeMessages: [
      "That sounds like a category of decisions. What's ONE specific decision you're avoiding right now?",
      "I need you to get more concrete. What's the actual choice you need to make?",
      "Imagine you had to make this decision in the next 24 hours. What exactly would you be deciding?"
    ],
    minWords: 5
  },
  {
    id: 'avoided_conversation',
    question: "What conversation have you been avoiding?",
    subtext: "Consider feedback you haven't given, requests you haven't made, or boundaries you haven't set.",
    placeholder: "I've been putting off talking to...",
    gatePrompt: `Evaluate if this response describes a SPECIFIC conversation being avoided.
A specific response includes:
- WHO the conversation is with (role or relationship)
- WHAT the conversation is about
- The actual message or request

Vague examples: "giving feedback", "discussing expectations", "having hard talks"
Specific examples: "telling Sarah that her code reviews are blocking the team's velocity", "asking my skip-level if there's a path to senior engineer this year"

Respond with JSON: {"isSpecific": boolean, "reason": string}`,
    challengeMessages: [
      "Who specifically do you need to talk to, and what do you need to say?",
      "Picture yourself having this conversation. Who's across from you and what are the first words out of your mouth?",
      "What's the one sentence you've rehearsed but never said?"
    ],
    minWords: 5
  },
  {
    id: 'comfort_work',
    question: "What 'comfort work' filled your calendar this week?",
    subtext: "Comfort work feels productive but doesn't move important things forward. It's often what you do instead of the hard thing.",
    placeholder: "I spent time on...",
    gatePrompt: `Evaluate if this response identifies SPECIFIC comfort work activities.
A specific response includes:
- Actual activities or tasks (not just categories)
- Time indicators or frequency
- Recognition of why it was "comfort" vs necessary

Vague examples: "meetings", "emails", "busy work"
Specific examples: "reorganizing my Notion workspace for the third time instead of writing the project proposal", "taking on two more code reviews when I was already behind on my own deliverables"

Respond with JSON: {"isSpecific": boolean, "reason": string}`,
    challengeMessages: [
      "What specifically did you do? Not the category, but the actual activity.",
      "If I watched a video of your week, what would I see you doing that felt productive but wasn't?",
      "What did you do this week that you could have NOT done and nothing bad would have happened?"
    ],
    minWords: 5
  },
  {
    id: 'progress_claim',
    question: "What progress are you claiming this week?",
    subtext: "What moved forward? What can you point to as evidence of advancement?",
    placeholder: "I made progress on...",
    gatePrompt: `Evaluate if this response describes SPECIFIC, verifiable progress.
A specific response includes:
- A concrete deliverable or outcome
- Measurable advancement (not just "worked on")
- Something that could be shown or demonstrated

Vague examples: "made progress", "moved things forward", "worked on the project"
Specific examples: "shipped the authentication feature and it's now in production", "had 3 customer interviews and documented the findings in Notion"

Respond with JSON: {"isSpecific": boolean, "reason": string}`,
    challengeMessages: [
      "What artifact exists now that didn't exist before? What could you show someone?",
      "If I asked for a receipt of this progress, what would you hand me?",
      "Complete this sentence with something concrete: 'This week I finished ___'"
    ],
    minWords: 5
  },
  {
    id: 'next_week_bet',
    question: "What's your bet for next week?",
    subtext: "A bet is a prediction about what you'll accomplish. It should be specific enough that you'll know if you were wrong.",
    placeholder: "Next week I will...",
    gatePrompt: `Evaluate if this response is a SPECIFIC, falsifiable bet.
A specific bet includes:
- A concrete action or deliverable
- Clear success criteria (you'll know if it happened)
- Something that could be verified next week

Vague examples: "make progress", "focus on X", "try to improve"
Specific examples: "ship the MVP to 5 beta users and get feedback from at least 3", "have the compensation conversation with my manager and get a clear answer"

Respond with JSON: {"isSpecific": boolean, "reason": string}`,
    challengeMessages: [
      "How will you know next week if this happened or not? Make it binary.",
      "What would make you wrong? If you can't fail, it's not a real bet.",
      "State it as: 'I bet that by Friday I will have ___'. Fill in something concrete."
    ],
    minWords: 5
  }
]

export function getQuestion(id: string): AuditQuestion | undefined {
  return auditQuestions.find(q => q.id === id)
}

export function getQuestionByIndex(index: number): AuditQuestion | undefined {
  return auditQuestions[index]
}
