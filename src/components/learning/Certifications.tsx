'use client'

import { useState, useEffect } from 'react'

interface Certification {
  id: string
  name: string
  issuer: string
  credentialId?: string
  credentialUrl?: string
  earnedAt: string
  expiresAt?: string
  status: string
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-300',
  expired: 'bg-red-500/20 text-red-300',
  pending_renewal: 'bg-yellow-500/20 text-yellow-300',
}

export function Certifications() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCertifications() {
      try {
        const response = await fetch('/api/learning/certifications')
        if (response.ok) {
          const data = await response.json()
          setCertifications(data)
        }
      } catch (error) {
        console.error('Failed to fetch certifications:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCertifications()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false
    const expiry = new Date(expiresAt)
    const now = new Date()
    const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  if (loading) {
    return <div className="text-slate-400">Loading certifications...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Certifications</h2>

      <div className="space-y-3">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="bg-slate-800 rounded-lg border border-slate-700 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-medium">{cert.name}</h3>
                <div className="text-sm text-slate-400 mt-1">{cert.issuer}</div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  statusColors[cert.status] || statusColors.active
                }`}
              >
                {cert.status.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="text-slate-400">
                Earned: <span className="text-white">{formatDate(cert.earnedAt)}</span>
              </div>
              {cert.expiresAt && (
                <div className={isExpiringSoon(cert.expiresAt) ? 'text-yellow-400' : 'text-slate-400'}>
                  Expires: <span className="text-white">{formatDate(cert.expiresAt)}</span>
                  {isExpiringSoon(cert.expiresAt) && ' ⚠️'}
                </div>
              )}
            </div>

            {cert.credentialId && (
              <div className="mt-2 text-xs text-slate-500">
                Credential ID: {cert.credentialId}
              </div>
            )}

            {cert.credentialUrl && (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Verify Credential →
              </a>
            )}
          </div>
        ))}
      </div>

      {certifications.length === 0 && (
        <div className="text-center text-slate-400 py-8">
          No certifications found
        </div>
      )}
    </div>
  )
}
