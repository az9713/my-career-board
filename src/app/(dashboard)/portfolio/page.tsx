import Link from 'next/link'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default async function PortfolioPage() {
  const session = await auth()
  const userId = session?.user?.id

  const problems = userId ? await prisma.problem.findMany({
    where: { userId },
    orderBy: { timeAllocation: 'desc' },
  }) : []

  const hasProblems = problems.length > 0

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'appreciating':
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'depreciating':
        return <TrendingDown className="h-4 w-4 text-red-400" />
      default:
        return <Minus className="h-4 w-4 text-slate-400" />
    }
  }

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'appreciating':
        return <Badge className="bg-green-900 text-green-300">Appreciating</Badge>
      case 'depreciating':
        return <Badge className="bg-red-900 text-red-300">Depreciating</Badge>
      case 'stable':
        return <Badge className="bg-slate-700 text-slate-300">Stable</Badge>
      default:
        return <Badge className="bg-amber-900 text-amber-300">Uncertain</Badge>
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Problem Portfolio</h1>
          <p className="text-slate-400 mt-1">
            The problems you&apos;re paid to solve
          </p>
        </div>
        <Link href="/portfolio/setup">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            {hasProblems ? 'Add Problem' : 'Set Up Portfolio'}
          </Button>
        </Link>
      </div>

      {!hasProblems ? (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No problems defined yet</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Define the 3-5 problems you&apos;re paid to solve. This creates your personalized board of directors.
            </p>
            <Link href="/portfolio/setup">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Set Up Portfolio
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {problems.map((problem) => (
            <Card key={problem.id} className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getClassificationIcon(problem.classification)}
                    <div>
                      <CardTitle className="text-white">{problem.name}</CardTitle>
                      <CardDescription className="text-slate-400">
                        {problem.whatBreaks}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {problem.timeAllocation && (
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {problem.timeAllocation}% time
                      </Badge>
                    )}
                    {getClassificationBadge(problem.classification)}
                  </div>
                </div>
              </CardHeader>
              {problem.classificationReasoning && (
                <CardContent>
                  <p className="text-sm text-slate-400">
                    {problem.classificationReasoning}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
