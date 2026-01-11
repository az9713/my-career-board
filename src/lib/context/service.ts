import prisma from '@/lib/prisma/client'
import Anthropic from '@anthropic-ai/sdk'

export type ContextType = 'resume' | 'linkedin' | 'document' | 'notes'

export interface ParsedResume {
  name: string
  titles: string[]
  yearsOfExperience: number
  skills?: string[]
  experience?: ExperienceEntry[]
}

export interface ParsedLinkedIn {
  name: string
  currentRole?: string
  skills: string[]
  experience?: ExperienceEntry[]
}

export interface ExperienceEntry {
  role: string
  company: string
  startYear?: number
  endYear?: number
  current?: boolean
}

export interface ContextInput {
  type: ContextType
  rawText: string
  parsedData: Record<string, unknown>
}

// Common tech skills to look for
const TECH_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
  'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Next.js', 'Django', 'Flask',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST',
  'Git', 'CI/CD', 'Jenkins', 'GitHub Actions',
  'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch',
]

// Soft skills to look for
const SOFT_SKILLS = [
  'leadership', 'communication', 'project management', 'team building',
  'problem solving', 'strategic thinking', 'mentoring', 'collaboration',
  'agile', 'scrum', 'product management',
]

/**
 * Parse resume text to extract structured data
 */
export function parseResumeText(resumeText: string): ParsedResume {
  if (!resumeText || resumeText.trim() === '') {
    return { name: '', titles: [], yearsOfExperience: 0 }
  }

  const lines = resumeText.split('\n').map((l) => l.trim()).filter(Boolean)

  // Extract name (usually first non-empty line)
  const name = lines[0] || ''

  // Extract titles (look for common job title patterns)
  const titlePatterns = [
    /software engineer/i,
    /senior (developer|engineer|manager)/i,
    /tech lead/i,
    /engineering manager/i,
    /principal engineer/i,
    /staff engineer/i,
    /architect/i,
    /director/i,
    /vp of engineering/i,
    /cto/i,
    /product manager/i,
  ]

  const titles: string[] = []
  for (const line of lines.slice(0, 5)) {
    for (const pattern of titlePatterns) {
      const match = line.match(pattern)
      if (match) {
        // Extract the matched title and surrounding context
        const titleMatch = line.match(/([A-Za-z\s]+(?:Engineer|Developer|Manager|Lead|Architect|Director))/i)
        if (titleMatch) {
          titles.push(titleMatch[1].trim())
        }
      }
    }
  }

  // Also check for pipe-separated titles
  const pipeMatch = resumeText.match(/([A-Za-z\s]+)\s*\|\s*([A-Za-z\s]+)/i)
  if (pipeMatch) {
    titles.push(...pipeMatch.slice(1).map((t) => t.trim()))
  }

  // Calculate years of experience from date ranges
  const yearRanges = resumeText.matchAll(/\(?\s*(\d{4})\s*[-–]\s*(\d{4}|Present|present|current)\s*\)?/g)
  let totalYears = 0

  for (const match of yearRanges) {
    const startYear = parseInt(match[1])
    const endYear = match[2].toLowerCase() === 'present' || match[2].toLowerCase() === 'current'
      ? new Date().getFullYear()
      : parseInt(match[2])

    if (!isNaN(startYear) && !isNaN(endYear)) {
      totalYears += endYear - startYear
    }
  }

  return {
    name,
    titles: [...new Set(titles)],
    yearsOfExperience: totalYears,
    skills: extractSkills(resumeText),
    experience: extractExperience(resumeText),
  }
}

/**
 * Parse LinkedIn profile JSON data
 */
export function parseLinkedInProfile(data: Record<string, unknown>): ParsedLinkedIn {
  const firstName = (data.firstName as string) || ''
  const lastName = (data.lastName as string) || ''
  const name = [firstName, lastName].filter(Boolean).join(' ')

  const headline = data.headline as string | undefined
  const positions = data.positions as Array<{
    title?: string
    companyName?: string
    startDate?: { year?: number }
    endDate?: { year?: number }
  }> | undefined

  // Get current role from headline or first position
  let currentRole = headline
  if (!currentRole && positions && positions.length > 0) {
    const current = positions[0]
    if (current.title && current.companyName) {
      currentRole = `${current.title} at ${current.companyName}`
    }
  }

  // Extract skills
  const skills = (data.skills as string[]) || []

  return {
    name,
    currentRole,
    skills,
  }
}

/**
 * Extract skills from text
 */
export function extractSkills(text: string): string[] {
  const foundSkills: string[] = []
  const lowerText = text.toLowerCase()

  // Check for tech skills
  for (const skill of TECH_SKILLS) {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.push(skill)
    }
  }

  // Check for soft skills
  for (const skill of SOFT_SKILLS) {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.push(skill)
    }
  }

  // Deduplicate (case-insensitive)
  const seen = new Set<string>()
  return foundSkills.filter((skill) => {
    const lower = skill.toLowerCase()
    if (seen.has(lower)) return false
    seen.add(lower)
    return true
  })
}

/**
 * Extract work experience entries from text
 */
export function extractExperience(text: string): ExperienceEntry[] {
  const entries: ExperienceEntry[] = []

  // Pattern: Role at Company (Year - Year)
  const pattern = /([A-Za-z\s]+(?:Engineer|Developer|Manager|Lead|Architect|Director))\s+at\s+([A-Za-z\s]+)\s*\(?\s*(\d{4})\s*[-–]\s*(\d{4}|Present|present|current)\s*\)?/gi

  const matches = text.matchAll(pattern)
  for (const match of matches) {
    const role = match[1].trim()
    const company = match[2].trim()
    const startYear = parseInt(match[3])
    const endYearStr = match[4]
    const current = endYearStr.toLowerCase() === 'present' || endYearStr.toLowerCase() === 'current'
    const endYear = current ? new Date().getFullYear() : parseInt(endYearStr)

    entries.push({
      role,
      company,
      startYear,
      endYear: current ? undefined : endYear,
      current,
    })
  }

  // Also try simpler pattern: - Role at Company (dates)
  const simplePattern = /[-•]\s*([A-Za-z\s]+)\s+at\s+([A-Za-z\s]+)\s*\(([^)]+)\)/gi
  const simpleMatches = text.matchAll(simplePattern)
  for (const match of simpleMatches) {
    const role = match[1].trim()
    const company = match[2].trim()
    const dateRange = match[3]

    const yearMatch = dateRange.match(/(\d{4})/g)
    if (yearMatch) {
      const startYear = parseInt(yearMatch[0])
      const current = dateRange.toLowerCase().includes('present') || dateRange.toLowerCase().includes('current')
      const endYear = yearMatch[1] ? parseInt(yearMatch[1]) : (current ? undefined : startYear)

      // Avoid duplicates
      if (!entries.some((e) => e.company === company && e.role === role)) {
        entries.push({
          role,
          company,
          startYear,
          endYear,
          current,
        })
      }
    }
  }

  return entries
}

/**
 * Create AI summary of context for director prompts
 */
export async function summarizeContext(context: ContextInput): Promise<string> {
  try {
    const client = new Anthropic()

    const prompt = `Summarize the following professional context in 2-3 sentences for use by AI career advisors. Focus on key experience, skills, and current role. Be concise.

Context type: ${context.type}
Content: ${context.rawText.slice(0, 2000)}
${context.parsedData ? `\nExtracted data: ${JSON.stringify(context.parsedData)}` : ''}`

    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find((c) => c.type === 'text')
    return textContent?.text || 'Professional context available.'
  } catch (error) {
    // Fallback summary based on parsed data
    const data = context.parsedData as ParsedResume | ParsedLinkedIn
    if ('yearsOfExperience' in data && data.yearsOfExperience) {
      return `Professional with ${data.yearsOfExperience} years of experience.`
    }
    if ('currentRole' in data && data.currentRole) {
      return `Currently working as ${data.currentRole}.`
    }
    return 'Professional context available.'
  }
}

/**
 * Build combined context string for director prompts
 */
export async function buildDirectorContext(userId: string): Promise<string> {
  const contexts = await prisma.userContext.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  if (contexts.length === 0) {
    return ''
  }

  const sections: string[] = ['## Professional Background\n']

  for (const ctx of contexts) {
    if (ctx.summary) {
      sections.push(`### ${ctx.type.charAt(0).toUpperCase() + ctx.type.slice(1)}`)
      sections.push(ctx.summary)
      sections.push('')
    }
  }

  return sections.join('\n')
}

/**
 * Create a new user context
 */
export async function createContext(
  userId: string,
  type: ContextType,
  name: string,
  content: string
): Promise<{ id: string; summary: string }> {
  let parsedData: Record<string, unknown> = {}

  // Parse based on type
  if (type === 'resume') {
    parsedData = parseResumeText(content)
  } else if (type === 'linkedin') {
    try {
      const jsonData = JSON.parse(content)
      parsedData = parseLinkedInProfile(jsonData)
    } catch {
      parsedData = { rawContent: content }
    }
  } else {
    parsedData = { skills: extractSkills(content) }
  }

  // Generate summary
  const summary = await summarizeContext({
    type,
    rawText: content,
    parsedData,
  })

  const context = await prisma.userContext.create({
    data: {
      userId,
      type,
      name,
      rawText: content,
      parsedData: JSON.stringify(parsedData),
      summary,
    },
  })

  return { id: context.id, summary }
}

/**
 * Get all contexts for a user
 */
export async function getUserContexts(userId: string, type?: ContextType) {
  return prisma.userContext.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Delete a user context
 */
export async function deleteContext(userId: string, contextId: string): Promise<boolean> {
  const context = await prisma.userContext.findFirst({
    where: { id: contextId, userId },
  })

  if (!context) {
    return false
  }

  await prisma.userContext.delete({ where: { id: contextId } })
  return true
}
