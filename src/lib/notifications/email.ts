/**
 * Email service for sending notifications
 * Uses environment variable EMAIL_PROVIDER to determine provider (resend, sendgrid, or console for dev)
 */

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email using the configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER || 'console'

  switch (provider) {
    case 'resend':
      return sendWithResend(options)
    case 'sendgrid':
      return sendWithSendGrid(options)
    case 'console':
    default:
      return sendToConsole(options)
  }
}

/**
 * Send email via Resend API
 */
async function sendWithResend(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@my-career-board.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    const data = await response.json()
    return { success: true, messageId: data.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send email via SendGrid API
 */
async function sendWithSendGrid(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    return { success: false, error: 'SENDGRID_API_KEY not configured' }
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: process.env.EMAIL_FROM || 'noreply@my-career-board.com' },
        subject: options.subject,
        content: [
          { type: 'text/html', value: options.html },
          ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    return { success: true, messageId: response.headers.get('x-message-id') || undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Log email to console (for development)
 */
async function sendToConsole(options: EmailOptions): Promise<EmailResult> {
  console.log('==================== EMAIL ====================')
  console.log(`To: ${options.to}`)
  console.log(`Subject: ${options.subject}`)
  console.log('---')
  console.log(options.text || options.html)
  console.log('===============================================')

  return { success: true, messageId: `console-${Date.now()}` }
}

/**
 * Email templates for different notification types
 */
export const emailTemplates = {
  quarterlyReview: (userName: string) => ({
    subject: "Time for your quarterly board review",
    html: `
      <h1>Quarterly Review Reminder</h1>
      <p>Hi ${userName},</p>
      <p>It's time for your quarterly board review. Your AI board of directors is ready to challenge your thinking and hold you accountable.</p>
      <p><strong>What to expect:</strong></p>
      <ul>
        <li>Review your bets from last quarter</li>
        <li>Surface what you've been avoiding</li>
        <li>Set falsifiable commitments for next quarter</li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/board">Start Your Board Meeting</a></p>
    `,
    text: `Quarterly Review Reminder\n\nHi ${userName},\n\nIt's time for your quarterly board review.\n\nVisit: ${process.env.NEXT_PUBLIC_APP_URL}/board`,
  }),

  weeklyCheckin: (userName: string, streak: number) => ({
    subject: `Weekly check-in (${streak} week streak!)`,
    html: `
      <h1>Weekly Check-in</h1>
      <p>Hi ${userName},</p>
      <p>Quick check: Are you making progress on what matters?</p>
      <p>Your current streak: <strong>${streak} weeks</strong></p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/audit">Take 5-minute audit</a></p>
    `,
    text: `Weekly Check-in\n\nHi ${userName},\n\nYour streak: ${streak} weeks\n\nVisit: ${process.env.NEXT_PUBLIC_APP_URL}/audit`,
  }),

  avoidanceAlert: (userName: string, pattern: string) => ({
    subject: "Avoidance pattern detected",
    html: `
      <h1>Avoidance Alert</h1>
      <p>Hi ${userName},</p>
      <p>We've noticed a pattern in your sessions. You keep mentioning:</p>
      <blockquote>${pattern}</blockquote>
      <p>This might be something worth addressing. Your board is ready when you are.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/board">Talk to your board</a></p>
    `,
    text: `Avoidance Alert\n\nHi ${userName},\n\nPattern detected: ${pattern}\n\nVisit: ${process.env.NEXT_PUBLIC_APP_URL}/board`,
  }),

  streakMilestone: (userName: string, streak: number) => ({
    subject: `Milestone: ${streak} week streak!`,
    html: `
      <h1>Streak Milestone!</h1>
      <p>Hi ${userName},</p>
      <p>Congratulations! You've hit a <strong>${streak} week streak</strong> of accountability check-ins.</p>
      <p>Keep it going!</p>
    `,
    text: `Streak Milestone!\n\nHi ${userName},\n\nYou've hit a ${streak} week streak!`,
  }),
}
