/**
 * @jest-environment node
 */

import {
  parseResumeText,
  parseLinkedInProfile,
  extractSkills,
  extractExperience,
  summarizeContext,
  buildDirectorContext,
  ContextType,
} from '@/lib/context/service'

// Mock Prisma - use the shared mock
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    userContext: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

// Mock Anthropic for summarization
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Summarized professional context' }],
      }),
    },
  }))
})

describe('Context Service', () => {
  describe('parseResumeText', () => {
    it('should extract name from resume', () => {
      const resumeText = `
        John Doe
        Software Engineer
        john.doe@email.com

        Experience:
        Senior Developer at TechCorp (2020-2024)
      `

      const result = parseResumeText(resumeText)

      expect(result.name).toBe('John Doe')
    })

    it('should extract job titles', () => {
      const resumeText = `
        Jane Smith
        Senior Software Engineer | Tech Lead

        Experience:
        - Tech Lead at StartupXYZ (2022-Present)
        - Senior Developer at BigCorp (2018-2022)
      `

      const result = parseResumeText(resumeText)

      expect(result.titles).toContain('Senior Software Engineer')
      expect(result.titles).toContain('Tech Lead')
    })

    it('should extract years of experience', () => {
      const resumeText = `
        Experience:
        - Developer at Company A (2015-2020)
        - Senior Developer at Company B (2020-2024)
      `

      const result = parseResumeText(resumeText)

      expect(result.yearsOfExperience).toBeGreaterThanOrEqual(9)
    })

    it('should handle empty resume', () => {
      const result = parseResumeText('')

      expect(result.name).toBe('')
      expect(result.titles).toEqual([])
      expect(result.yearsOfExperience).toBe(0)
    })
  })

  describe('parseLinkedInProfile', () => {
    it('should parse LinkedIn JSON data', () => {
      const linkedInData = {
        firstName: 'John',
        lastName: 'Doe',
        headline: 'Engineering Manager at TechCorp',
        positions: [
          { title: 'Engineering Manager', companyName: 'TechCorp', startDate: { year: 2022 } },
          { title: 'Senior Engineer', companyName: 'StartupABC', startDate: { year: 2018 }, endDate: { year: 2022 } },
        ],
        skills: ['JavaScript', 'Python', 'Leadership'],
      }

      const result = parseLinkedInProfile(linkedInData)

      expect(result.name).toBe('John Doe')
      expect(result.currentRole).toBe('Engineering Manager at TechCorp')
      expect(result.skills).toContain('JavaScript')
      expect(result.skills).toContain('Leadership')
    })

    it('should handle missing fields gracefully', () => {
      const linkedInData = {
        firstName: 'Jane',
      }

      const result = parseLinkedInProfile(linkedInData)

      expect(result.name).toBe('Jane')
      expect(result.skills).toEqual([])
    })
  })

  describe('extractSkills', () => {
    it('should extract technical skills from text', () => {
      const text = `
        Proficient in JavaScript, TypeScript, React, and Node.js.
        Experience with Python, AWS, and Docker.
      `

      const skills = extractSkills(text)

      expect(skills).toContain('JavaScript')
      expect(skills).toContain('TypeScript')
      expect(skills).toContain('React')
      expect(skills).toContain('Python')
    })

    it('should extract soft skills', () => {
      const text = `
        Strong leadership and communication skills.
        Experienced in project management and team building.
      `

      const skills = extractSkills(text)

      expect(skills).toContain('leadership')
      expect(skills).toContain('communication')
      expect(skills).toContain('project management')
    })

    it('should deduplicate skills', () => {
      const text = 'JavaScript JavaScript React React'

      const skills = extractSkills(text)
      const jsCount = skills.filter((s) => s.toLowerCase() === 'javascript').length

      expect(jsCount).toBe(1)
    })
  })

  describe('extractExperience', () => {
    it('should extract company names and roles', () => {
      const text = `
        Experience:
        - Software Engineer at Google (2020-2022)
        - Senior Developer at Microsoft (2022-Present)
      `

      const experience = extractExperience(text)

      expect(experience).toHaveLength(2)
      expect(experience[0].company).toMatch(/Google/i)
      expect(experience[1].company).toMatch(/Microsoft/i)
    })

    it('should parse date ranges', () => {
      // Use format that matches the extraction pattern: "- Role at Company (dates)"
      const text = '- Senior Developer at TechCorp (January 2020 - December 2023)'

      const experience = extractExperience(text)

      expect(experience.length).toBeGreaterThan(0)
      expect(experience[0].startYear).toBe(2020)
    })

    it('should handle current positions', () => {
      const text = '- Engineering Manager at Company (2022 - Present)'

      const experience = extractExperience(text)

      expect(experience.length).toBeGreaterThan(0)
      expect(experience[0].current).toBe(true)
    })
  })

  describe('summarizeContext', () => {
    it('should create AI summary of context', async () => {
      const context = {
        type: 'resume' as ContextType,
        rawText: 'John Doe, Senior Engineer with 10 years experience...',
        parsedData: { name: 'John Doe', yearsOfExperience: 10 },
      }

      const summary = await summarizeContext(context)

      expect(summary).toBeTruthy()
      expect(typeof summary).toBe('string')
    })

    it('should handle API errors gracefully', async () => {
      const Anthropic = require('@anthropic-ai/sdk')
      Anthropic.mockImplementationOnce(() => ({
        messages: {
          create: jest.fn().mockRejectedValue(new Error('API Error')),
        },
      }))

      const context = {
        type: 'resume' as ContextType,
        rawText: 'Test',
        parsedData: {},
      }

      const summary = await summarizeContext(context)

      // Should return fallback summary
      expect(summary).toBeTruthy()
    })
  })

  describe('buildDirectorContext', () => {
    it('should combine all user contexts for director prompts', async () => {
      const { default: prisma } = require('@/lib/prisma/client')
      prisma.userContext.findMany.mockResolvedValue([
        {
          id: '1',
          type: 'resume',
          summary: 'Senior engineer with 10 years experience',
          parsedData: JSON.stringify({ yearsOfExperience: 10 }),
        },
        {
          id: '2',
          type: 'linkedin',
          summary: 'Currently Engineering Manager at TechCorp',
          parsedData: JSON.stringify({ currentRole: 'Engineering Manager' }),
        },
      ])

      const context = await buildDirectorContext('user-123')

      expect(context).toContain('Senior engineer')
      expect(context).toContain('Engineering Manager')
    })

    it('should format context for director consumption', async () => {
      const { default: prisma } = require('@/lib/prisma/client')
      prisma.userContext.findMany.mockResolvedValue([
        {
          id: '1',
          type: 'resume',
          summary: 'Experienced developer',
          parsedData: JSON.stringify({}),
        },
      ])

      const context = await buildDirectorContext('user-123')

      expect(context).toContain('Professional Background')
    })

    it('should return empty string for users with no context', async () => {
      const { default: prisma } = require('@/lib/prisma/client')
      prisma.userContext.findMany.mockResolvedValue([])

      const context = await buildDirectorContext('user-123')

      expect(context).toBe('')
    })
  })
})
