import { NextResponse } from 'next/server'
import { getDueReminders, markReminderSent, parsePreferences, calculateStreak } from '@/lib/notifications/service'
import { sendEmail, emailTemplates } from '@/lib/notifications/email'

// POST /api/cron/send-reminders - Send all due reminders (called by cron job)
export async function POST(request: Request) {
  try {
    // Verify authorization (cron secret or API key)
    const authHeader = request.headers.get('Authorization')
    const cronSecret = process.env.CRON_SECRET || 'test-secret'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all due reminders
    const reminders = await getDueReminders()

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const reminder of reminders) {
      // Skip if user has disabled this type of notification
      if (reminder.user) {
        const prefs = parsePreferences(reminder.user.notificationPreferences)

        // Check if notifications are enabled
        if (!prefs.emailEnabled) {
          continue
        }

        // Check specific notification type
        const typeToPreference: Record<string, string> = {
          quarterly_review: 'quarterlyReminders',
          weekly_checkin: 'weeklyCheckins',
          avoidance_alert: 'avoidanceAlerts',
          streak_milestone: 'streakNotifications',
        }

        const prefKey = typeToPreference[reminder.type]
        if (prefKey && !prefs[prefKey as keyof typeof prefs]) {
          continue
        }
      }

      try {
        // Generate email content based on reminder type
        const userName = reminder.user?.name || 'there'
        const userEmail = reminder.user?.email

        if (!userEmail) {
          errors.push(`No email for reminder ${reminder.id}`)
          failed++
          continue
        }

        let emailContent: { subject: string; html: string; text?: string }

        switch (reminder.type) {
          case 'quarterly_review':
            emailContent = emailTemplates.quarterlyReview(userName)
            break

          case 'weekly_checkin':
            // Get current streak for weekly checkin email
            const streak = await calculateStreak(reminder.userId)
            emailContent = emailTemplates.weeklyCheckin(userName, streak.current)
            break

          case 'avoidance_alert':
            const metadata = reminder.metadata ? JSON.parse(reminder.metadata) : {}
            emailContent = emailTemplates.avoidanceAlert(userName, metadata.pattern || 'something important')
            break

          case 'streak_milestone':
            const milestoneMetadata = reminder.metadata ? JSON.parse(reminder.metadata) : {}
            emailContent = emailTemplates.streakMilestone(userName, milestoneMetadata.streak || 0)
            break

          default:
            errors.push(`Unknown reminder type: ${reminder.type}`)
            failed++
            continue
        }

        // Send the email
        const result = await sendEmail({
          to: userEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        })

        if (result.success) {
          await markReminderSent(reminder.id)
          sent++
        } else {
          errors.push(`Email failed for ${reminder.id}: ${result.error}`)
          failed++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Error processing ${reminder.id}: ${errorMessage}`)
        failed++
      }
    }

    return NextResponse.json({
      total: reminders.length,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Send reminders error:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}
