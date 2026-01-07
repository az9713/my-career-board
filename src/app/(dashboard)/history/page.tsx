import Link from 'next/link'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, ClipboardCheck, Users, ChevronRight } from 'lucide-react'

export default async function HistoryPage() {
  const session = await auth()
  const userId = session?.user?.id

  const sessions = userId ? await prisma.boardSession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  }) : []

  const hasSessions = sessions.length > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">History</h1>
        <p className="text-slate-400 mt-1">
          Your past sessions and reports
        </p>
      </div>

      {!hasSessions ? (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No sessions yet</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Complete a Quick Audit or Board Meeting to see your history here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <Link key={s.id} href={`/history/${s.id}`}>
              <Card className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {s.sessionType === 'quick_audit' ? (
                        <div className="p-2 rounded-lg bg-blue-900/50">
                          <ClipboardCheck className="h-5 w-5 text-blue-400" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-green-900/50">
                          <Users className="h-5 w-5 text-green-400" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-white">
                          {s.sessionType === 'quick_audit'
                            ? 'Quick Audit'
                            : `${s.quarter || 'Quarterly'} Board Meeting`}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          {new Date(s.startedAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                          {' • '}
                          {s._count.messages} messages
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          s.status === 'completed'
                            ? 'bg-green-900 text-green-300'
                            : 'bg-amber-900 text-amber-300'
                        }
                      >
                        {s.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-slate-500" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
