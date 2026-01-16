'use client'

interface Contact {
  id: string
  name: string
  relationship: string
  strength: number
  company?: string
}

interface NetworkMapProps {
  contacts: Contact[]
  onContactClick?: (contact: Contact) => void
}

const relationshipOrder = ['mentor', 'sponsor', 'peer', 'colleague', 'mentee', 'recruiter']

export function NetworkMap({ contacts, onContactClick }: NetworkMapProps) {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>No contacts yet</p>
        <p className="text-sm mt-2">Add contacts to build your network map</p>
      </div>
    )
  }

  // Group contacts by relationship
  const grouped = contacts.reduce((acc, contact) => {
    const rel = contact.relationship || 'other'
    if (!acc[rel]) acc[rel] = []
    acc[rel].push(contact)
    return acc
  }, {} as Record<string, Contact[]>)

  // Sort groups by order
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    const aIndex = relationshipOrder.indexOf(a)
    const bIndex = relationshipOrder.indexOf(b)
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
  })

  return (
    <div className="space-y-6">
      {sortedGroups.map(([relationship, relationshipContacts]) => (
        <div key={relationship}>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3 capitalize">
            {relationship}s ({relationshipContacts.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {relationshipContacts
              .sort((a, b) => b.strength - a.strength)
              .map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => onContactClick?.(contact)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-3 text-left transition-colors"
                >
                  <div className="text-white font-medium truncate">{contact.name}</div>
                  {contact.company && (
                    <div className="text-slate-400 text-sm truncate">{contact.company}</div>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-2 h-2 rounded-full ${
                          level <= contact.strength ? 'bg-blue-500' : 'bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
