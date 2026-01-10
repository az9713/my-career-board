'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Target, CheckCircle, XCircle, MinusCircle } from 'lucide-react'

export interface Bet {
  id: string
  content: string
  falsifiableCriteria: string
  deadline: Date
  quarter: string
  status: 'pending' | 'resolved'
  outcome: 'hit' | 'miss' | 'excused' | null
  evidence: string | null
  reflection: string | null
  createdAt: Date
  resolvedAt?: Date | null
}

interface BetCardProps {
  bet: Bet
  onResolve?: (betId: string) => void
}

export function BetCard({ bet, onResolve }: BetCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusBadge = () => {
    if (bet.status === 'pending') {
      return (
        <Badge className="bg-amber-900 text-amber-300 hover:bg-amber-900">
          Pending
        </Badge>
      )
    }

    switch (bet.outcome) {
      case 'hit':
        return (
          <Badge className="bg-green-900 text-green-300 hover:bg-green-900">
            <CheckCircle className="w-3 h-3 mr-1" />
            Hit
          </Badge>
        )
      case 'miss':
        return (
          <Badge className="bg-red-900 text-red-300 hover:bg-red-900">
            <XCircle className="w-3 h-3 mr-1" />
            Miss
          </Badge>
        )
      case 'excused':
        return (
          <Badge className="bg-slate-700 text-slate-300 hover:bg-slate-700">
            <MinusCircle className="w-3 h-3 mr-1" />
            Excused
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white text-lg leading-tight">
              {bet.content}
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              {bet.quarter}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Target className="w-4 h-4" />
          <span>{bet.falsifiableCriteria}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>Deadline: {formatDate(bet.deadline)}</span>
        </div>

        {bet.status === 'resolved' && bet.evidence && (
          <div className="mt-3 p-3 rounded-lg bg-green-900/20 border border-green-800">
            <p className="text-sm text-green-300">
              <strong>Evidence:</strong> {bet.evidence}
            </p>
          </div>
        )}

        {bet.status === 'resolved' && bet.reflection && (
          <div className="mt-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
            <p className="text-sm text-slate-300">
              <strong>Reflection:</strong> {bet.reflection}
            </p>
          </div>
        )}

        {bet.status === 'pending' && onResolve && (
          <div className="mt-4 pt-3 border-t border-slate-700">
            <Button
              onClick={() => onResolve(bet.id)}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Resolve Bet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
