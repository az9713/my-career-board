// Pattern detection for recurring issues and themes

export interface Pattern {
  id: string
  type: 'recurring_avoidance' | 'comfort_work' | 'bet_accuracy' | 'theme'
  title: string
  description: string
  frequency: number // How many times this pattern appeared
  sessions: string[] // Session IDs where this appeared
  severity: 'info' | 'warning' | 'critical'
}

export interface InsightSummary {
  totalSessions: number
  completedSessions: number
  averageDuration: number // in minutes
  patterns: Pattern[]
  betAccuracy: {
    total: number
    correct: number
    percentage: number
  }
  topAvoidedThemes: string[]
}

// Extract key themes from text using simple keyword analysis
function extractThemes(text: string): string[] {
  const themes: string[] = []
  const textLower = text.toLowerCase()

  const themeKeywords: Record<string, string[]> = {
    'career growth': ['promotion', 'title', 'level', 'senior', 'growth', 'advance'],
    'compensation': ['salary', 'raise', 'pay', 'compensation', 'money', 'bonus'],
    'difficult conversations': ['conversation', 'talk', 'tell', 'feedback', 'confront'],
    'team dynamics': ['team', 'colleague', 'manager', 'coworker', 'boss'],
    'technical skills': ['learn', 'skill', 'technical', 'technology', 'coding'],
    'work-life balance': ['balance', 'hours', 'overtime', 'burnout', 'stress'],
    'decision making': ['decide', 'choice', 'decision', 'commit', 'choose'],
    'project delivery': ['ship', 'deliver', 'deadline', 'launch', 'release'],
  }

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      themes.push(theme)
    }
  }

  return themes
}

// Analyze sessions to find patterns
export function analyzePatterns(sessions: Array<{
  id: string
  sessionType: string
  status: string
  startedAt: Date
  completedAt: Date | null
  messages: Array<{
    speaker: string
    content: string
    messageType: string
    metadata?: string | null
  }>
}>): InsightSummary {
  const completedSessions = sessions.filter(s => s.status === 'completed')

  // Calculate average duration
  const durations = completedSessions
    .filter(s => s.completedAt)
    .map(s => (new Date(s.completedAt!).getTime() - new Date(s.startedAt).getTime()) / 60000)
  const averageDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0

  // Collect all user responses
  const allResponses = sessions.flatMap(s =>
    s.messages
      .filter(m => m.speaker === 'user')
      .map(m => ({ sessionId: s.id, content: m.content, metadata: m.metadata }))
  )

  // Find recurring themes
  const themeCount: Record<string, { count: number; sessions: Set<string> }> = {}

  for (const response of allResponses) {
    const themes = extractThemes(response.content)
    for (const theme of themes) {
      if (!themeCount[theme]) {
        themeCount[theme] = { count: 0, sessions: new Set() }
      }
      themeCount[theme].count++
      themeCount[theme].sessions.add(response.sessionId)
    }
  }

  // Convert to patterns
  const patterns: Pattern[] = []

  // Find recurring avoidance patterns (themes appearing in 3+ sessions)
  for (const [theme, data] of Object.entries(themeCount)) {
    if (data.sessions.size >= 2) {
      patterns.push({
        id: `avoidance-${theme.replace(/\s+/g, '-')}`,
        type: 'recurring_avoidance',
        title: `Recurring: ${theme}`,
        description: `This theme has appeared in ${data.sessions.size} sessions`,
        frequency: data.count,
        sessions: Array.from(data.sessions),
        severity: data.sessions.size >= 3 ? 'critical' : 'warning',
      })
    }
  }

  // Sort by frequency
  patterns.sort((a, b) => b.frequency - a.frequency)

  // Top avoided themes
  const topAvoidedThemes = Object.entries(themeCount)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([theme]) => theme)

  return {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    averageDuration,
    patterns: patterns.slice(0, 5), // Top 5 patterns
    betAccuracy: {
      total: 0, // Would need bet tracking to calculate
      correct: 0,
      percentage: 0,
    },
    topAvoidedThemes,
  }
}

// Get a summary insight message
export function getInsightMessage(summary: InsightSummary): string | null {
  if (summary.patterns.length === 0) {
    if (summary.totalSessions < 3) {
      return 'Complete a few more sessions to start seeing patterns.'
    }
    return null
  }

  const criticalPatterns = summary.patterns.filter(p => p.severity === 'critical')

  if (criticalPatterns.length > 0) {
    const pattern = criticalPatterns[0]
    return `Pattern detected: "${pattern.title}" keeps coming up across sessions. Are you avoiding this?`
  }

  const topPattern = summary.patterns[0]
  return `You've mentioned "${topPattern.title.replace('Recurring: ', '')}" multiple times. Worth examining.`
}
