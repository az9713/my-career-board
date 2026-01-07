import { evaluateSpecificity, GateEvaluationResult } from './providers/anthropic'
import { AuditQuestion } from '../audit/questions'

export interface GateCheckResult {
  passed: boolean
  isSpecific: boolean
  reason: string
  challengeMessage?: string
  attemptCount: number
}

// Check if response meets minimum requirements before LLM evaluation
function meetsMinimumRequirements(response: string, minWords: number): boolean {
  const wordCount = response.trim().split(/\s+/).filter(w => w.length > 0).length
  return wordCount >= minWords
}

// Get a challenge message based on attempt count
function getChallengeMessage(
  question: AuditQuestion,
  attemptCount: number,
  reason: string
): string {
  const messages = question.challengeMessages
  // Cycle through challenge messages, add the LLM's reason
  const baseMessage = messages[Math.min(attemptCount - 1, messages.length - 1)]
  return `${baseMessage}\n\n(${reason})`
}

export async function checkSpecificityGate(
  response: string,
  question: AuditQuestion,
  attemptCount: number = 1,
  maxAttempts: number = 3
): Promise<GateCheckResult> {
  // Check minimum word count first
  if (!meetsMinimumRequirements(response, question.minWords)) {
    return {
      passed: false,
      isSpecific: false,
      reason: `Response too brief. Please provide more detail (at least ${question.minWords} words).`,
      challengeMessage: `Please expand on your answer. A few words isn't enough to work with.`,
      attemptCount,
    }
  }

  // If max attempts reached, let it through with a note
  if (attemptCount >= maxAttempts) {
    return {
      passed: true,
      isSpecific: false,
      reason: 'Maximum attempts reached - response accepted for review',
      attemptCount,
    }
  }

  // Evaluate specificity with LLM
  const evaluation: GateEvaluationResult = await evaluateSpecificity(
    response,
    question.gatePrompt
  )

  if (evaluation.isSpecific) {
    return {
      passed: true,
      isSpecific: true,
      reason: evaluation.reason,
      attemptCount,
    }
  }

  // Response not specific enough - challenge the user
  return {
    passed: false,
    isSpecific: false,
    reason: evaluation.reason,
    challengeMessage: getChallengeMessage(question, attemptCount, evaluation.reason),
    attemptCount,
  }
}

// Strict mode - requires specificity to pass
export async function checkStrictGate(
  response: string,
  question: AuditQuestion,
  attemptCount: number = 1
): Promise<GateCheckResult> {
  return checkSpecificityGate(response, question, attemptCount, 3)
}

// Lenient mode - accepts after 2 attempts
export async function checkLenientGate(
  response: string,
  question: AuditQuestion,
  attemptCount: number = 1
): Promise<GateCheckResult> {
  return checkSpecificityGate(response, question, attemptCount, 2)
}
