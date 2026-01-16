import {
  createFeedbackRequest,
  getFeedbackRequestById,
  getUserFeedbackRequests,
  addFeedbackQuestion,
  addFeedbackRecipient,
  submitFeedbackResponse,
  getFeedbackResults,
  closeFeedbackRequest,
  createSelfAssessment,
  getSelfAssessments,
  compareFeedbackToSelfAssessment,
  getResponseByToken,
} from '@/lib/feedback360/service'

// Mock Prisma client
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    feedbackRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    feedbackQuestion: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    feedbackRecipient: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    feedbackResponse: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    feedbackQuestionResponse: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    selfAssessment: {
      create: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

import prisma from '@/lib/prisma/client'

describe('Feedback360 Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createFeedbackRequest', () => {
    it('should create a feedback request', async () => {
      const mockRequest = {
        id: 'req1',
        userId: 'user1',
        title: 'Q1 2024 Feedback',
        description: 'Annual review feedback',
        anonymous: true,
        status: 'open',
      }
      ;(prisma.feedbackRequest.create as jest.Mock).mockResolvedValue(mockRequest)

      const result = await createFeedbackRequest({
        userId: 'user1',
        title: 'Q1 2024 Feedback',
        description: 'Annual review feedback',
        anonymous: true,
      })

      expect(result).toEqual(mockRequest)
      expect(prisma.feedbackRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user1',
          title: 'Q1 2024 Feedback',
        }),
      })
    })
  })

  describe('getFeedbackRequestById', () => {
    it('should get feedback request with questions and responses', async () => {
      const mockRequest = {
        id: 'req1',
        title: 'Q1 Feedback',
        questions: [{ id: 'q1', question: 'Rate leadership' }],
        responses: [{ id: 'r1' }],
        recipients: [{ id: 'rec1', email: 'peer@example.com' }],
      }
      ;(prisma.feedbackRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest)

      const result = await getFeedbackRequestById('req1')

      expect(result).toEqual(mockRequest)
      expect(prisma.feedbackRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'req1' },
        include: {
          questions: { orderBy: { order: 'asc' } },
          responses: { include: { answers: true } },
          recipients: true,
        },
      })
    })

    it('should return null for non-existent request', async () => {
      ;(prisma.feedbackRequest.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getFeedbackRequestById('invalid')

      expect(result).toBeNull()
    })
  })

  describe('getUserFeedbackRequests', () => {
    it('should get all feedback requests for a user', async () => {
      const mockRequests = [
        { id: 'req1', title: 'Q1 Feedback', status: 'open' },
        { id: 'req2', title: 'Q2 Feedback', status: 'closed' },
      ]
      ;(prisma.feedbackRequest.findMany as jest.Mock).mockResolvedValue(mockRequests)

      const result = await getUserFeedbackRequests('user1')

      expect(result).toEqual(mockRequests)
      expect(prisma.feedbackRequest.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('addFeedbackQuestion', () => {
    it('should add a question to a feedback request', async () => {
      const mockQuestion = {
        id: 'q1',
        requestId: 'req1',
        question: 'Rate communication skills',
        category: 'communication',
        type: 'scale',
      }
      ;(prisma.feedbackQuestion.create as jest.Mock).mockResolvedValue(mockQuestion)

      const result = await addFeedbackQuestion({
        requestId: 'req1',
        question: 'Rate communication skills',
        category: 'communication',
        type: 'scale',
      })

      expect(result).toEqual(mockQuestion)
    })
  })

  describe('addFeedbackRecipient', () => {
    it('should add a recipient with unique token', async () => {
      const mockRecipient = {
        id: 'rec1',
        requestId: 'req1',
        email: 'peer@example.com',
        name: 'John Doe',
        relationship: 'peer',
        token: expect.any(String),
      }
      ;(prisma.feedbackRecipient.create as jest.Mock).mockResolvedValue(mockRecipient)

      const result = await addFeedbackRecipient({
        requestId: 'req1',
        email: 'peer@example.com',
        name: 'John Doe',
        relationship: 'peer',
      })

      expect(result.email).toBe('peer@example.com')
      expect(prisma.feedbackRecipient.create).toHaveBeenCalled()
    })
  })

  describe('getResponseByToken', () => {
    it('should get recipient by token', async () => {
      const mockRecipient = {
        id: 'rec1',
        token: 'abc123',
        request: {
          id: 'req1',
          title: 'Q1 Feedback',
          questions: [],
        },
      }
      ;(prisma.feedbackRecipient.findUnique as jest.Mock).mockResolvedValue(mockRecipient)

      const result = await getResponseByToken('abc123')

      expect(result).toEqual(mockRecipient)
    })
  })

  describe('submitFeedbackResponse', () => {
    it('should submit feedback response with answers', async () => {
      const mockResponse = {
        id: 'resp1',
        requestId: 'req1',
        relationship: 'peer',
      }
      ;(prisma.feedbackResponse.create as jest.Mock).mockResolvedValue(mockResponse)
      ;(prisma.feedbackQuestionResponse.createMany as jest.Mock).mockResolvedValue({ count: 2 })
      ;(prisma.feedbackRecipient.update as jest.Mock).mockResolvedValue({})

      const result = await submitFeedbackResponse({
        requestId: 'req1',
        recipientToken: 'token123',
        relationship: 'peer',
        answers: [
          { questionId: 'q1', scaleValue: 4 },
          { questionId: 'q2', textValue: 'Great work!' },
        ],
      })

      expect(result).toEqual(mockResponse)
      expect(prisma.feedbackQuestionResponse.createMany).toHaveBeenCalled()
    })
  })

  describe('getFeedbackResults', () => {
    it('should aggregate feedback results by category', async () => {
      const mockRequest = {
        id: 'req1',
        questions: [
          { id: 'q1', category: 'leadership', type: 'scale' },
          { id: 'q2', category: 'communication', type: 'scale' },
        ],
        responses: [
          {
            id: 'r1',
            relationship: 'peer',
            answers: [
              { questionId: 'q1', scaleValue: 4 },
              { questionId: 'q2', scaleValue: 5 },
            ],
          },
          {
            id: 'r2',
            relationship: 'manager',
            answers: [
              { questionId: 'q1', scaleValue: 3 },
              { questionId: 'q2', scaleValue: 4 },
            ],
          },
        ],
      }
      ;(prisma.feedbackRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest)

      const result = await getFeedbackResults('req1')

      expect(result).toBeDefined()
      expect(result.byCategory).toBeDefined()
      expect(result.byRelationship).toBeDefined()
    })
  })

  describe('closeFeedbackRequest', () => {
    it('should close a feedback request', async () => {
      const mockRequest = { id: 'req1', status: 'closed' }
      ;(prisma.feedbackRequest.update as jest.Mock).mockResolvedValue(mockRequest)

      const result = await closeFeedbackRequest('req1')

      expect(result.status).toBe('closed')
      expect(prisma.feedbackRequest.update).toHaveBeenCalledWith({
        where: { id: 'req1' },
        data: { status: 'closed' },
      })
    })
  })

  describe('SelfAssessment', () => {
    it('should create or update self-assessment', async () => {
      const mockAssessment = {
        id: 'sa1',
        userId: 'user1',
        category: 'leadership',
        area: 'decision-making',
        rating: 4,
      }
      ;(prisma.selfAssessment.upsert as jest.Mock).mockResolvedValue(mockAssessment)

      const result = await createSelfAssessment({
        userId: 'user1',
        category: 'leadership',
        area: 'decision-making',
        rating: 4,
      })

      expect(result).toEqual(mockAssessment)
    })

    it('should get all self-assessments for a user', async () => {
      const mockAssessments = [
        { id: 'sa1', category: 'leadership', rating: 4 },
        { id: 'sa2', category: 'communication', rating: 3 },
      ]
      ;(prisma.selfAssessment.findMany as jest.Mock).mockResolvedValue(mockAssessments)

      const result = await getSelfAssessments('user1')

      expect(result).toEqual(mockAssessments)
    })
  })

  describe('compareFeedbackToSelfAssessment', () => {
    it('should compare feedback results to self-assessment', async () => {
      const mockRequest = {
        id: 'req1',
        userId: 'user1',
        questions: [{ id: 'q1', category: 'leadership', type: 'scale' }],
        responses: [
          {
            answers: [{ questionId: 'q1', scaleValue: 3 }],
          },
        ],
      }
      const mockSelfAssessments = [
        { category: 'leadership', area: 'general', rating: 4 },
      ]
      ;(prisma.feedbackRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest)
      ;(prisma.selfAssessment.findMany as jest.Mock).mockResolvedValue(mockSelfAssessments)

      const result = await compareFeedbackToSelfAssessment('req1')

      expect(result).toBeDefined()
      expect(result.comparisons).toBeDefined()
      // Self-rating is 4, peer average is 3, so gap is -1
      expect(result.comparisons[0].gap).toBeDefined()
    })
  })
})
