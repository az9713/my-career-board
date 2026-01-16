import prisma from '@/lib/prisma/client'

// Contact types
interface CreateContactInput {
  userId: string
  name: string
  email?: string
  company?: string
  title?: string
  relationship: string
  strength?: number
  notes?: string
  linkedinUrl?: string
  tags?: string[]
  nextFollowUp?: Date
}

interface UpdateContactInput {
  name?: string
  email?: string
  company?: string
  title?: string
  relationship?: string
  strength?: number
  notes?: string
  linkedinUrl?: string
  tags?: string[]
  nextFollowUp?: Date | null
}

interface ContactFilters {
  relationship?: string
  minStrength?: number
}

// Interaction types
interface LogInteractionInput {
  contactId: string
  type: string
  date?: Date
  summary?: string
  notes?: string
  followUpNeeded?: boolean
  followUpDate?: Date
  sentiment?: string
}

// Networking Goal types
interface CreateNetworkingGoalInput {
  userId: string
  title: string
  description?: string
  targetCount?: number
  category: string
  deadline?: Date
}

// Contact functions
export async function createContact(input: CreateContactInput) {
  const { tags, ...data } = input
  return prisma.contact.create({
    data: {
      ...data,
      tags: tags ? JSON.stringify(tags) : null,
    },
  })
}

export async function getContactById(id: string) {
  return prisma.contact.findUnique({
    where: { id },
    include: {
      interactions: {
        orderBy: { date: 'desc' },
        take: 10,
      },
    },
  })
}

export async function getUserContacts(userId: string, filters?: ContactFilters) {
  const where: any = { userId }

  if (filters?.relationship) {
    where.relationship = filters.relationship
  }

  if (filters?.minStrength) {
    where.strength = { gte: filters.minStrength }
  }

  return prisma.contact.findMany({
    where,
    orderBy: { strength: 'desc' },
  })
}

export async function updateContact(id: string, input: UpdateContactInput) {
  const { tags, ...data } = input
  return prisma.contact.update({
    where: { id },
    data: {
      ...data,
      ...(tags !== undefined && { tags: tags ? JSON.stringify(tags) : null }),
    },
  })
}

export async function deleteContact(id: string) {
  return prisma.contact.delete({
    where: { id },
  })
}

// Interaction functions
export async function logInteraction(input: LogInteractionInput) {
  const { contactId, date = new Date(), ...data } = input

  const interaction = await prisma.interaction.create({
    data: {
      contactId,
      date,
      ...data,
    },
  })

  // Update last contact date on the contact
  await prisma.contact.update({
    where: { id: contactId },
    data: { lastContactAt: date },
  })

  return interaction
}

export async function getContactInteractions(contactId: string) {
  return prisma.interaction.findMany({
    where: { contactId },
    orderBy: { date: 'desc' },
  })
}

export async function getUpcomingFollowUps(userId: string, daysAhead: number = 7) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  return prisma.contact.findMany({
    where: {
      userId,
      nextFollowUp: {
        lte: futureDate,
        gte: new Date(),
      },
    },
    orderBy: { nextFollowUp: 'asc' },
  })
}

// Networking Goal functions
export async function createNetworkingGoal(input: CreateNetworkingGoalInput) {
  return prisma.networkingGoal.create({
    data: input,
  })
}

export async function getUserNetworkingGoals(userId: string, status?: string) {
  const where: any = { userId }
  if (status) {
    where.status = status
  }

  return prisma.networkingGoal.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateNetworkingGoalProgress(goalId: string, currentCount: number) {
  const goal = await prisma.networkingGoal.findUnique({
    where: { id: goalId },
  })

  const isCompleted = goal?.targetCount && currentCount >= goal.targetCount

  return prisma.networkingGoal.update({
    where: { id: goalId },
    data: {
      currentCount,
      status: isCompleted ? 'completed' : 'active',
    },
  })
}

// Analytics
export async function getNetworkAnalytics(userId: string) {
  const totalContacts = await prisma.contact.count({
    where: { userId },
  })

  const byRelationship = await prisma.contact.groupBy({
    by: ['relationship'],
    where: { userId },
    _count: { id: true },
  })

  const totalInteractions = await prisma.interaction.count({
    where: {
      contact: { userId },
    },
  })

  // Contacts not contacted in 90+ days
  const staleDate = new Date()
  staleDate.setDate(staleDate.getDate() - 90)

  const staleContacts = await prisma.contact.findMany({
    where: {
      userId,
      OR: [
        { lastContactAt: { lt: staleDate } },
        { lastContactAt: null },
      ],
    },
    orderBy: { lastContactAt: 'asc' },
    take: 10,
  })

  return {
    totalContacts,
    byRelationship: byRelationship.reduce((acc, item) => {
      acc[item.relationship] = item._count.id
      return acc
    }, {} as Record<string, number>),
    totalInteractions,
    staleContacts,
  }
}
