'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Lock, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { DIRECTOR_PERSONAS } from '@/lib/directors/personas'

export default function BoardPage() {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)
  const [problemCount, setProblemCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`
  const hasPortfolio = problemCount !== null && problemCount >= 3

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch('/api/portfolio')
        if (res.ok) {
          const problems = await res.json()
          setProblemCount(problems.length)
        }
      } catch {
        setProblemCount(0)
      }
    }
    fetchPortfolio()
  }, [])

  const startMeeting = async () => {
    setIsStarting(true)
    setError(null)

    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quarter }),
      })

      if (!res.ok) {
        throw new Error('Failed to start board meeting')
      }

      const session = await res.json()
      router.push(`/board/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsStarting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Board Meeting</h1>
        <p className="text-slate-400 mt-2">
          {quarter} Quarterly Review
        </p>
      </div>

      {problemCount === null ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : !hasPortfolio ? (
        <Card className="border-amber-800 bg-amber-900/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-amber-400" />
              <div>
                <CardTitle className="text-white">Portfolio Required</CardTitle>
                <CardDescription className="text-slate-300">
                  You need at least 3 problems in your portfolio before starting a board meeting.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/portfolio/setup">
              <Button className="bg-amber-600 hover:bg-amber-700">
                Set Up Portfolio First
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-900/50">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-white">Start Board Meeting</CardTitle>
                <CardDescription className="text-slate-400">
                  Your 5 directors are ready to review your {quarter} performance
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-5 gap-2">
              {DIRECTOR_PERSONAS.map((director) => (
                <div
                  key={director.id}
                  className="text-center p-3 rounded-lg bg-slate-900/50"
                >
                  <div className="text-2xl mb-2">{director.avatar}</div>
                  <p className="text-xs text-slate-400 truncate">{director.name.split(' ').slice(-1)[0]}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-white">Meeting Agenda</h4>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>1. Review last quarter&apos;s bets and outcomes</li>
                <li>2. Audit avoided decisions and conversations</li>
                <li>3. Market value assessment</li>
                <li>4. Strategic trajectory check</li>
                <li>5. Set falsifiable bets for next quarter</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <Button
              onClick={startMeeting}
              disabled={isStarting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Convening Board...
                </>
              ) : (
                <>
                  Enter Board Room
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
