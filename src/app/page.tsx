import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Users,
  ClipboardCheck,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl text-white">PCGS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white max-w-4xl mx-auto leading-tight">
          Your Career Deserves a{' '}
          <span className="text-blue-400">Board of Directors</span>
        </h1>
        <p className="mt-6 text-xl text-slate-400 max-w-2xl mx-auto">
          Stop drifting. Get the honest, adversarial feedback that executives pay thousands for.
          AI-powered accountability that holds you to what you said you&apos;d do.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
              Start Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Problem statement */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            The Problem With Self-Assessment
          </h2>
          <p className="text-slate-400 text-lg">
            We&apos;re unreliable narrators of our own careers. We round up successes, round down failures,
            and tell ourselves we&apos;re &quot;being patient&quot; when we&apos;re really just avoiding hard conversations.
            Without external accountability, drift accumulates into years of motion without progress.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <ClipboardCheck className="h-10 w-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Quick Audit</h3>
              <p className="text-slate-400">
                15 minutes to surface what you&apos;ve been avoiding. No commitment required.
                See if this system can help you.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <Users className="h-10 w-10 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">AI Board Meeting</h3>
              <p className="text-slate-400">
                5 AI directors who challenge you from different angles.
                No validation, only scrutiny.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <TrendingUp className="h-10 w-10 text-amber-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Pattern Detection</h3>
              <p className="text-slate-400">
                Track avoided decisions across quarters. Make patterns undeniable.
                See your real trajectory.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          {[
            {
              step: '1',
              title: 'Define Your Problem Portfolio',
              description: 'Identify the 3-5 problems you\'re actually paid to solve. Classify each as appreciating, depreciating, or stable.',
            },
            {
              step: '2',
              title: 'Meet Your Board',
              description: '5 AI directors are generated based on your portfolio: Accountability Hawk, Market Reality Skeptic, Avoidance Hunter, Strategist, and Devil\'s Advocate.',
            },
            {
              step: '3',
              title: 'Quarterly Board Meeting',
              description: 'Present your report. Get challenged on receipts, avoided decisions, and comfort work. Leave with falsifiable bets for next quarter.',
            },
            {
              step: '4',
              title: 'Track Over Time',
              description: 'Patterns become undeniable. See which avoided decisions keep recurring. Watch your bet accuracy improve.',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {item.step}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-slate-400 mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The Board */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Meet Your Board</h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          5 AI directors, each with a specific mandate. They don&apos;t validate. They scrutinize.
        </p>
        <div className="grid md:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {[
            { name: 'Accountability Hawk', focus: 'Demands receipts', color: 'blue' },
            { name: 'Market Reality', focus: 'Challenges your valuations', color: 'purple' },
            { name: 'Avoidance Hunter', focus: 'Probes what you\'re dodging', color: 'amber' },
            { name: 'Strategist', focus: 'Asks 5-year questions', color: 'green' },
            { name: 'Devil\'s Advocate', focus: 'Argues against your path', color: 'red' },
          ].map((director) => (
            <Card key={director.name} className="border-slate-700 bg-slate-800/50 text-center">
              <CardContent className="pt-6">
                <div className={`w-12 h-12 rounded-full bg-${director.color}-900/50 mx-auto mb-3 flex items-center justify-center`}>
                  <Shield className={`h-6 w-6 text-${director.color}-400`} />
                </div>
                <h4 className="font-semibold text-white text-sm">{director.name}</h4>
                <p className="text-slate-500 text-xs mt-1">{director.focus}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-blue-800 bg-blue-900/20 max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to stop drifting?
            </h2>
            <p className="text-slate-300 mb-6">
              Start with a 15-minute Quick Audit. No credit card required.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>Personal Career Governance System</p>
          <p className="mt-1">Based on Nate Jones&apos; AI Board of Directors concept</p>
        </div>
      </footer>
    </div>
  )
}
