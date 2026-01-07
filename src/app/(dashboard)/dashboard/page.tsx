import Link from 'next/link'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardCheck,
  Briefcase,
  Users,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  Clock,
  Target,
} from 'lucide-react'
import { analyzePatterns, getInsightMessage } from '@/lib/insights/patterns'

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id

  const problemCount = userId ? await prisma.problem.count({ where: { userId } }) : 0
  const hasPortfolio = problemCount >= 3

  // Get recent sessions with messages for pattern analysis
  const recentSessions = userId
    ? await prisma.boardSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: {
          messages: {
            select: {
              speaker: true,
              content: true,
              messageType: true,
              metadata: true,
            },
          },
        },
      })
    : []

  // Analyze patterns
  const insights = analyzePatterns(recentSessions)
  const insightMessage = getInsightMessage(insights)

  const now = new Date()
  const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`

  // Get last 3 sessions for display
  const displaySessions = recentSessions.slice(0, 3)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}
        </h1>
        <p className="text-slate-400 mt-1">
          {quarter} - Your personal board awaits
        </p>
      </div>

      {/* Setup reminder */}
      {!hasPortfolio && (
        <Card className="border-amber-800 bg-amber-900/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              <div>
                <CardTitle className="text-white">Complete Your Setup</CardTitle>
                <CardDescription className="text-slate-300">
                  Define at least 3 problems in your portfolio to unlock board meetings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/portfolio/setup">
              <Button className="bg-amber-600 hover:bg-amber-700">
                Set Up Portfolio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Insight alert */}
      {insightMessage && (
        <Card className="border-purple-800 bg-purple-900/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-900/50">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-200">Pattern Insight</p>
                <p className="text-sm text-purple-300/80">{insightMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-900/50">
                <ClipboardCheck className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white">Quick Audit</CardTitle>
                <CardDescription className="text-slate-400">
                  15-minute accountability check
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/audit">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Start Audit
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-900/50">
                <Briefcase className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-white">Problem Portfolio</CardTitle>
                <CardDescription className="text-slate-400">
                  {problemCount} problem{problemCount !== 1 ? 's' : ''} defined
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/portfolio">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                View Portfolio
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className={`border-slate-700 bg-slate-800/50 ${!hasPortfolio ? 'opacity-50' : ''}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-900/50">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-white">Board Meeting</CardTitle>
                <CardDescription className="text-slate-400">
                  {quarter} quarterly review
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/board">
              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300"
                disabled={!hasPortfolio}
              >
                {hasPortfolio ? 'Enter Board Room' : 'Portfolio Required'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Stats row */}
      {insights.totalSessions > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-white">{insights.completedSessions}</p>
              <p className="text-xs text-slate-400">Sessions Completed</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-white">{insights.averageDuration}m</p>
              <p className="text-xs text-slate-400">Avg Duration</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-white">{insights.patterns.length}</p>
              <p className="text-xs text-slate-400">Patterns Found</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent activity */}
      {displaySessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link href="/history" className="text-sm text-blue-400 hover:text-blue-300">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {displaySessions.map((s) => (
              <Link key={s.id} href={`/history/${s.id}`}>
                <Card className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {s.sessionType === 'quick_audit' ? (
                          <ClipboardCheck className="h-4 w-4 text-blue-400" />
                        ) : (
                          <Users className="h-4 w-4 text-green-400" />
                        )}
                        <span className="text-sm text-white">
                          {s.sessionType === 'quick_audit' ? 'Quick Audit' : `${s.quarter} Board Meeting`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {new Date(s.startedAt).toLocaleDateString()}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            s.status === 'completed'
                              ? 'border-green-700 text-green-400'
                              : 'border-amber-700 text-amber-400'
                          }
                        >
                          {s.status === 'completed' ? 'Done' : 'In Progress'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Top avoided themes */}
      {insights.topAvoidedThemes.length > 0 && (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-white text-base">Recurring Themes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.topAvoidedThemes.map((theme) => (
                <Badge key={theme} variant="outline" className="border-slate-600 text-slate-300">
                  {theme}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
