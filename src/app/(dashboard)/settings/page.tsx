import { auth } from '@/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Key, Bell, Link as LinkIcon } from 'lucide-react'

export default async function SettingsPage() {
  const session = await auth()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-slate-400" />
            <div>
              <CardTitle className="text-white">Profile</CardTitle>
              <CardDescription className="text-slate-400">
                Your account information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Email</span>
            <span className="text-white">{session?.user?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Name</span>
            <span className="text-white">{session?.user?.name || 'Not set'}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-slate-400" />
            <div>
              <CardTitle className="text-white">AI Provider</CardTitle>
              <CardDescription className="text-slate-400">
                Choose your preferred LLM provider
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Current provider</span>
            <Badge className="bg-blue-900 text-blue-300">Anthropic Claude</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Provider selection coming soon. Currently using Claude as default.
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-slate-400" />
            <div>
              <CardTitle className="text-white">Notifications</CardTitle>
              <CardDescription className="text-slate-400">
                Quarterly reminders and alerts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            Email notifications for quarterly board meetings coming soon.
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <LinkIcon className="h-5 w-5 text-slate-400" />
            <div>
              <CardTitle className="text-white">Integrations</CardTitle>
              <CardDescription className="text-slate-400">
                Connect external services for receipt verification
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/50">
            <span className="text-slate-300">Google Calendar</span>
            <Badge variant="outline" className="border-slate-600 text-slate-400">
              Not connected
            </Badge>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/50">
            <span className="text-slate-300">GitHub</span>
            <Badge variant="outline" className="border-slate-600 text-slate-400">
              Not connected
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Integrations coming in Phase 6.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
