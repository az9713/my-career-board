'use client'

interface ContactCardProps {
  contact: {
    id: string
    name: string
    email?: string
    company?: string
    title?: string
    relationship: string
    strength: number
    lastContactAt?: string
  }
  onView?: (contact: any) => void
  onEdit?: (contact: any) => void
}

const relationshipColors: Record<string, string> = {
  mentor: 'bg-purple-500/20 text-purple-300',
  mentee: 'bg-green-500/20 text-green-300',
  peer: 'bg-blue-500/20 text-blue-300',
  sponsor: 'bg-yellow-500/20 text-yellow-300',
  colleague: 'bg-slate-500/20 text-slate-300',
  recruiter: 'bg-orange-500/20 text-orange-300',
}

export function ContactCard({ contact, onView, onEdit }: ContactCardProps) {
  const strengthPercentage = (contact.strength / 5) * 100

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-medium text-white">{contact.name}</h3>
          {contact.title && contact.company && (
            <p className="text-sm text-slate-400">
              {contact.title} at {contact.company}
            </p>
          )}
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${relationshipColors[contact.relationship] || 'bg-slate-500/20 text-slate-300'}`}>
          {contact.relationship}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-400">Relationship Strength</span>
          <span className="text-white">{contact.strength}/5</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {contact.lastContactAt && (
        <p className="text-xs text-slate-500 mb-3">
          Last contact: {new Date(contact.lastContactAt).toLocaleDateString()}
        </p>
      )}

      <div className="flex gap-2">
        {onView && (
          <button
            onClick={() => onView(contact)}
            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
          >
            View
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(contact)}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  )
}
