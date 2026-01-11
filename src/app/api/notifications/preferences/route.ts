import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'
import { getDefaultPreferences, parsePreferences } from '@/lib/notifications/service'

// GET /api/notifications/preferences - Get user's notification preferences
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notificationPreferences: true,
        notificationEmail: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const preferences = parsePreferences(user.notificationPreferences)

    return NextResponse.json({
      ...preferences,
      notificationEmail: user.notificationEmail || user.email,
    })
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications/preferences - Update user's notification preferences
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate email if provided
    if (body.notificationEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.notificationEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPreferences: true },
    })

    const currentPrefs = parsePreferences(user?.notificationPreferences)

    // Merge with new preferences
    const allowedKeys = [
      'emailEnabled',
      'quarterlyReminders',
      'weeklyCheckins',
      'avoidanceAlerts',
      'streakNotifications',
    ]

    const updatedPrefs = { ...currentPrefs }
    for (const key of allowedKeys) {
      if (key in body && typeof body[key] === 'boolean') {
        updatedPrefs[key as keyof typeof updatedPrefs] = body[key]
      }
    }

    // Update user
    const updateData: { notificationPreferences: string; notificationEmail?: string } = {
      notificationPreferences: JSON.stringify(updatedPrefs),
    }

    if (body.notificationEmail !== undefined) {
      updateData.notificationEmail = body.notificationEmail || null
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    return NextResponse.json(updatedPrefs)
  } catch (error) {
    console.error('Update preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
