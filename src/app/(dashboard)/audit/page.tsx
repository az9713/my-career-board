'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, Clock, ArrowRight, Loader2 } from 'lucide-react'

export default function AuditPage() {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startAudit = async () => {
    setIsStarting(true)
    setError(null)

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionType: 'quick_audit' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to start audit')
      }

      const session = await res.json()
      router.push(`/audit/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsStarting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Quick Audit</h1>
        <p className="text-slate-400 mt-2">
          15 minutes to surface what you&apos;ve been avoiding
        </p>
      </div>

      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-900/50">
              <ClipboardCheck className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white">Career Audit</CardTitle>
              <CardDescription className="text-slate-400">
                5 questions to assess your current trajectory
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="h-4 w-4" />
            <span>~15 minutes</span>
          </div>

          <div className="space-y-2 text-sm text-slate-400">
            <p>This audit will challenge you on:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Decisions you&apos;ve been avoiding</li>
              <li>Conversations you&apos;ve postponed</li>
              <li>Comfort work that filled your time</li>
              <li>Real progress you can point to</li>
              <li>Your bet for next week</li>
            </ul>
          </div>

          <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-3 text-sm text-amber-200">
            <strong>Note:</strong> Vague answers won&apos;t pass. The AI will push back
            until you get specific about what&apos;s really going on.
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="pt-4">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={startAudit}
              disabled={isStarting}
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  Start Audit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
