'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Problem {
  name: string
  whatBreaks: string
  timeAllocation: number
  aiCheaper: string
  errorCost: string
  trustRequired: string
  classification: 'appreciating' | 'depreciating' | 'stable' | 'uncertain'
  classificationReasoning: string
}

const STEPS = [
  { id: 'intro', title: 'Introduction' },
  { id: 'problems', title: 'Define Problems' },
  { id: 'classify', title: 'Classify Direction' },
  { id: 'review', title: 'Review & Save' },
]

function classifyProblem(problem: Problem): { classification: Problem['classification'], reasoning: string } {
  const aiCheaper = problem.aiCheaper?.toLowerCase() || ''
  const errorCost = problem.errorCost?.toLowerCase() || ''
  const trustRequired = problem.trustRequired?.toLowerCase() || ''

  let depreciatingSignals = 0
  let appreciatingSignals = 0

  if (aiCheaper.includes('yes') || aiCheaper.includes('already') || aiCheaper.includes('soon')) {
    depreciatingSignals++
  } else if (aiCheaper.includes('no') || aiCheaper.includes('never') || aiCheaper.includes('unlikely')) {
    appreciatingSignals++
  }

  if (errorCost.includes('low') || errorCost.includes('minor') || errorCost.includes('small')) {
    depreciatingSignals++
  } else if (errorCost.includes('high') || errorCost.includes('major') || errorCost.includes('catastrophic') || errorCost.includes('significant')) {
    appreciatingSignals++
  }

  if (trustRequired.includes('low') || trustRequired.includes('no') || trustRequired.includes('little')) {
    depreciatingSignals++
  } else if (trustRequired.includes('high') || trustRequired.includes('critical') || trustRequired.includes('essential')) {
    appreciatingSignals++
  }

  let classification: Problem['classification'] = 'uncertain'
  let reasoning = ''

  if (depreciatingSignals >= 2 && appreciatingSignals === 0) {
    classification = 'depreciating'
    reasoning = 'AI can likely do this cheaper, error costs are manageable, and trust requirements are low.'
  } else if (appreciatingSignals >= 2 && depreciatingSignals === 0) {
    classification = 'appreciating'
    reasoning = 'AI cannot easily replace this, errors are costly, and trust is essential.'
  } else if (depreciatingSignals > appreciatingSignals) {
    classification = 'depreciating'
    reasoning = 'More signals point toward depreciation. Monitor this skill closely.'
  } else if (appreciatingSignals > depreciatingSignals) {
    classification = 'appreciating'
    reasoning = 'More signals point toward appreciation. Continue investing here.'
  } else {
    classification = 'stable'
    reasoning = 'Mixed signals suggest this skill will maintain its current value.'
  }

  return { classification, reasoning }
}

export default function PortfolioSetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [problems, setProblems] = useState<Problem[]>([{
    name: '',
    whatBreaks: '',
    timeAllocation: 25,
    aiCheaper: '',
    errorCost: '',
    trustRequired: '',
    classification: 'uncertain',
    classificationReasoning: '',
  }])
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const addProblem = () => {
    if (problems.length < 5) {
      setProblems([...problems, {
        name: '',
        whatBreaks: '',
        timeAllocation: Math.floor((100 - problems.reduce((sum, p) => sum + p.timeAllocation, 0)) / (6 - problems.length)),
        aiCheaper: '',
        errorCost: '',
        trustRequired: '',
        classification: 'uncertain',
        classificationReasoning: '',
      }])
    }
  }

  const removeProblem = (index: number) => {
    if (problems.length > 1) {
      setProblems(problems.filter((_, i) => i !== index))
      if (currentProblemIndex >= problems.length - 1) {
        setCurrentProblemIndex(Math.max(0, problems.length - 2))
      }
    }
  }

  const updateProblem = (index: number, updates: Partial<Problem>) => {
    setProblems(problems.map((p, i) => i === index ? { ...p, ...updates } : p))
  }

  const handleNext = () => {
    if (currentStep === 2) {
      const classifiedProblems = problems.map(p => {
        const { classification, reasoning } = classifyProblem(p)
        return { ...p, classification, classificationReasoning: reasoning }
      })
      setProblems(classifiedProblems)
    }
    setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))
  }

  const handleBack = () => {
    setCurrentStep(Math.max(0, currentStep - 1))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      for (const problem of problems) {
        const res = await fetch('/api/portfolio/problems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(problem),
        })

        if (!res.ok) {
          throw new Error('Failed to save problem')
        }
      }

      router.push('/portfolio')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save portfolio')
      setIsSaving(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true
      case 1: return problems.every(p => p.name.trim() && p.whatBreaks.trim())
      case 2: return problems.every(p => p.aiCheaper.trim() && p.errorCost.trim() && p.trustRequired.trim())
      case 3: return true
      default: return false
    }
  }

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'appreciating': return <TrendingUp className="h-5 w-5 text-green-400" />
      case 'depreciating': return <TrendingDown className="h-5 w-5 text-red-400" />
      default: return <Minus className="h-5 w-5 text-slate-400" />
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-400">
          <span>{STEPS[currentStep].title}</span>
          <span>Step {currentStep + 1} of {STEPS.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {currentStep === 0 && (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Define Your Problem Portfolio</CardTitle>
            <CardDescription className="text-slate-400">
              Identify the problems you&apos;re paid to solve and classify their future value
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-slate-300">
              <p>
                Your <strong>problem portfolio</strong> is the set of problems your employer pays you to solve.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Identify 3-5 core problems you solve</li>
                <li>Classify each as appreciating, depreciating, or stable</li>
                <li>Generate your personalized board of directors</li>
              </ul>
              <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-3 text-sm text-amber-200 mt-4">
                <strong>Key insight:</strong> If AI can solve the problem cheaper, the market will eventually pay less for humans who solve it.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">What Problems Do You Solve?</CardTitle>
            <CardDescription className="text-slate-400">
              Define 3-5 problems. Think about what breaks if you don&apos;t do your job.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {problems.map((problem, index) => (
              <div key={index} className="space-y-4 p-4 border border-slate-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">Problem {index + 1}</h3>
                  {problems.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeProblem(index)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Problem Name</Label>
                  <Input
                    placeholder="e.g., System architecture decisions"
                    value={problem.name}
                    onChange={(e) => updateProblem(index, { name: e.target.value })}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">What breaks if you don&apos;t solve it?</Label>
                  <Textarea
                    placeholder="e.g., Bad architecture choices lead to technical debt and scaling issues"
                    value={problem.whatBreaks}
                    onChange={(e) => updateProblem(index, { whatBreaks: e.target.value })}
                    className="bg-slate-900 border-slate-600 text-white min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">% of your time on this problem</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={problem.timeAllocation}
                    onChange={(e) => updateProblem(index, { timeAllocation: parseInt(e.target.value) || 0 })}
                    className="bg-slate-900 border-slate-600 text-white w-24"
                  />
                </div>
              </div>
            ))}

            {problems.length < 5 && (
              <Button variant="outline" onClick={addProblem} className="w-full border-dashed border-slate-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Problem
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Classify: {problems[currentProblemIndex]?.name || 'Problem'}</CardTitle>
            <CardDescription className="text-slate-400">
              Answer 3 questions to determine if this problem is appreciating or depreciating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2 flex-wrap">
              {problems.map((p, i) => (
                <Button
                  key={i}
                  variant={i === currentProblemIndex ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentProblemIndex(i)}
                  className={i === currentProblemIndex ? 'bg-blue-600' : 'border-slate-600'}
                >
                  {i + 1}. {p.name || `Problem ${i + 1}`}
                </Button>
              ))}
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">1. Can AI solve this cheaper than you within 2 years?</Label>
                <Textarea
                  placeholder="Yes/No and why. Consider current AI capabilities and trajectory."
                  value={problems[currentProblemIndex]?.aiCheaper || ''}
                  onChange={(e) => updateProblem(currentProblemIndex, { aiCheaper: e.target.value })}
                  className="bg-slate-900 border-slate-600 text-white min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">2. What&apos;s the cost of errors in this problem?</Label>
                <Textarea
                  placeholder="Low/Medium/High. What happens when you get it wrong?"
                  value={problems[currentProblemIndex]?.errorCost || ''}
                  onChange={(e) => updateProblem(currentProblemIndex, { errorCost: e.target.value })}
                  className="bg-slate-900 border-slate-600 text-white min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">3. How much trust/relationship is required?</Label>
                <Textarea
                  placeholder="Low/Medium/High. Does success require human trust or stakeholder buy-in?"
                  value={problems[currentProblemIndex]?.trustRequired || ''}
                  onChange={(e) => updateProblem(currentProblemIndex, { trustRequired: e.target.value })}
                  className="bg-slate-900 border-slate-600 text-white min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-700">
              <Button
                variant="outline"
                onClick={() => setCurrentProblemIndex(Math.max(0, currentProblemIndex - 1))}
                disabled={currentProblemIndex === 0}
                className="border-slate-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentProblemIndex(Math.min(problems.length - 1, currentProblemIndex + 1))}
                disabled={currentProblemIndex === problems.length - 1}
                className="border-slate-600"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Review Your Portfolio</CardTitle>
            <CardDescription className="text-slate-400">
              Confirm your problems and their classifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {problems.map((problem, index) => (
              <div key={index} className="p-4 border border-slate-700 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getClassificationIcon(problem.classification)}
                    <h3 className="font-medium text-white">{problem.name}</h3>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded ${
                    problem.classification === 'appreciating' ? 'bg-green-900/50 text-green-300' :
                    problem.classification === 'depreciating' ? 'bg-red-900/50 text-red-300' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {problem.classification}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{problem.whatBreaks}</p>
                <p className="text-xs text-slate-500">{problem.classificationReasoning}</p>
                <p className="text-xs text-slate-500">{problem.timeAllocation}% of time</p>
              </div>
            ))}

            {error && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 0 ? () => router.push('/portfolio') : handleBack}
          className="border-slate-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()} className="bg-blue-600 hover:bg-blue-700">
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Portfolio'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
