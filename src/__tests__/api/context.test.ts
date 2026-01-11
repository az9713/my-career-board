/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '@/app/api/context/route'
import { POST as uploadFile } from '@/app/api/context/upload/route'

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    userContext: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

// Mock context service
jest.mock('@/lib/context/service', () => ({
  parseResumeText: jest.fn().mockReturnValue({
    name: 'John Doe',
    titles: ['Software Engineer'],
    yearsOfExperience: 5,
  }),
  parseLinkedInProfile: jest.fn().mockReturnValue({
    name: 'John Doe',
    currentRole: 'Engineer',
    skills: ['JavaScript'],
  }),
  extractSkills: jest.fn().mockReturnValue(['JavaScript', 'React']),
  summarizeContext: jest.fn().mockResolvedValue('Professional summary'),
  buildDirectorContext: jest.fn().mockResolvedValue('Full context for directors'),
}))

describe('Context API', () => {
  const mockSession = {
    user: { id: 'user-123', email: 'test@example.com' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const { auth } = require('@/auth')
    auth.mockResolvedValue(mockSession)
  })

  describe('GET /api/context', () => {
    it('should return all user contexts', async () => {
      const { default: prisma } = require('@/lib/prisma/client')
      prisma.userContext.findMany.mockResolvedValue([
        {
          id: 'ctx-1',
          userId: 'user-123',
          type: 'resume',
          name: 'My Resume',
          summary: 'Professional summary',
          createdAt: new Date(),
        },
      ])

      const request = new NextRequest('http://localhost/api/context')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.contexts).toHaveLength(1)
      expect(data.contexts[0].type).toBe('resume')
    })

    it('should return 401 if not authenticated', async () => {
      const { auth } = require('@/auth')
      auth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/context')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should filter by type if provided', async () => {
      const { default: prisma } = require('@/lib/prisma/client')
      prisma.userContext.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/context?type=resume')
      await GET(request)

      expect(prisma.userContext.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'resume' }),
        })
      )
    })
  })

  describe('POST /api/context', () => {
    it('should create context from text input', async () => {
      const { default: prisma } = require('@/lib/prisma/client')
      prisma.userContext.create.mockResolvedValue({
        id: 'ctx-new',
        userId: 'user-123',
        type: 'resume',
        name: 'My Resume',
        rawText: 'Resume content...',
        summary: 'Professional summary',
      })

      const request = new NextRequest('http://localhost/api/context', {
        method: 'POST',
        body: JSON.stringify({
          type: 'resume',
          name: 'My Resume',
          content: 'Resume content...',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.context.type).toBe('resume')
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost/api/context', {
        method: 'POST',
        body: JSON.stringify({
          type: 'resume',
          // missing content
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should validate context type', async () => {
      const request = new NextRequest('http://localhost/api/context', {
        method: 'POST',
        body: JSON.stringify({
          type: 'invalid_type',
          name: 'Test',
          content: 'Content',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should handle linkedin JSON data', async () => {
      const { default: prisma } = require('@/lib/prisma/client')
      prisma.userContext.create.mockResolvedValue({
        id: 'ctx-new',
        type: 'linkedin',
      })

      const request = new NextRequest('http://localhost/api/context', {
        method: 'POST',
        body: JSON.stringify({
          type: 'linkedin',
          name: 'LinkedIn Profile',
          content: JSON.stringify({ firstName: 'John', lastName: 'Doe' }),
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })
  })

  describe('DELETE /api/context', () => {
    it('should delete user context', async () => {
      const { default: prisma } = require('@/lib/prisma/client')
      prisma.userContext.findFirst.mockResolvedValue({
        id: 'ctx-1',
        userId: 'user-123',
      })
      prisma.userContext.delete.mockResolvedValue({})

      const request = new NextRequest('http://localhost/api/context?id=ctx-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request)

      expect(response.status).toBe(200)
    })

    it('should return 404 for non-existent context', async () => {
      const { default: prisma } = require('@/lib/prisma/client')
      prisma.userContext.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/context?id=invalid', {
        method: 'DELETE',
      })

      const response = await DELETE(request)

      expect(response.status).toBe(404)
    })

    it('should not allow deleting other users context', async () => {
      const { default: prisma } = require('@/lib/prisma/client')
      prisma.userContext.findFirst.mockResolvedValue(null) // Not found for this user

      const request = new NextRequest('http://localhost/api/context?id=other-user-ctx', {
        method: 'DELETE',
      })

      const response = await DELETE(request)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/context/upload', () => {
    it('should handle file upload', async () => {
      const { default: prisma } = require('@/lib/prisma/client')
      prisma.userContext.create.mockResolvedValue({
        id: 'ctx-upload',
        type: 'document',
        name: 'performance_review.pdf',
      })

      const formData = new FormData()
      formData.append('file', new Blob(['file content'], { type: 'text/plain' }), 'resume.txt')
      formData.append('type', 'resume')
      formData.append('name', 'My Resume')

      const request = new NextRequest('http://localhost/api/context/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await uploadFile(request)

      expect(response.status).toBe(201)
    })

    it('should validate file size', async () => {
      // Create a large file (over 5MB)
      const largeContent = 'x'.repeat(6 * 1024 * 1024)
      const formData = new FormData()
      formData.append('file', new Blob([largeContent]), 'large.txt')
      formData.append('type', 'document')

      const request = new NextRequest('http://localhost/api/context/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await uploadFile(request)

      expect(response.status).toBe(400)
    })

    it('should validate file type', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['content'], { type: 'application/exe' }), 'malware.exe')
      formData.append('type', 'document')

      const request = new NextRequest('http://localhost/api/context/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await uploadFile(request)

      expect(response.status).toBe(400)
    })
  })
})
