'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Target, CheckCircle, XCircle, MinusCircle } from 'lucide-react'

export interface AccuracyStats {
  percentage: number
  total: number
  hits: number
  misses: number
  excused: number
}

interface BetAccuracyWidgetProps {
  stats: AccuracyStats
}

export function BetAccuracyWidget({ stats }: BetAccuracyWidgetProps) {
  const getMessage = () => {
    if (stats.total === 0) {
      return 'No bets yet'
    }
    if (stats.percentage >= 70) {
      return 'Great track record!'
    }
    if (stats.percentage >= 50) {
      return 'Solid progress'
    }
    return 'Accuracy needs improvement'
  }

  const getIcon = () => {
    if (stats.total === 0) {
      return <Target className="w-5 h-5 text-slate-400" />
    }
    if (stats.percentage >= 50) {
      return <TrendingUp className="w-5 h-5 text-green-400" />
    }
    return <TrendingDown className="w-5 h-5 text-red-400" />
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Bet Accuracy</CardTitle>
          {getIcon()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.total === 0 ? (
          <div className="text-center py-4">
            <Target className="w-12 h-12 mx-auto text-slate-600 mb-2" />
            <p className="text-slate-400">No bets yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Make your first falsifiable bet to start tracking
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold text-white">{stats.percentage}%</span>
              <span className="text-sm text-slate-400">{getMessage()}</span>
            </div>

            <Progress
              value={stats.percentage}
              className="h-2 bg-slate-700"
            />

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-2 rounded-lg bg-green-900/20">
                <div className="flex items-center justify-center gap-1 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-semibold">{stats.hits}</span>
                </div>
                <span className="text-xs text-slate-400">hits</span>
              </div>

              <div className="text-center p-2 rounded-lg bg-red-900/20">
                <div className="flex items-center justify-center gap-1 text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span className="font-semibold">{stats.misses}</span>
                </div>
                <span className="text-xs text-slate-400">misses</span>
              </div>

              <div className="text-center p-2 rounded-lg bg-slate-900/50">
                <div className="flex items-center justify-center gap-1 text-slate-400">
                  <MinusCircle className="w-4 h-4" />
                  <span className="font-semibold">{stats.excused}</span>
                </div>
                <span className="text-xs text-slate-400">excused</span>
              </div>
            </div>
          </>
        )}

        <div className="pt-2 border-t border-slate-700">
          <Link
            href="/bets"
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
          >
            View history →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
