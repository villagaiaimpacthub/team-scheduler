'use client'

import { useState } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/button'
import { Icon } from './ui/Icon'

interface TeamMemberInput {
  email: string
  name?: string
}

interface EmailTeamBuilderProps {
  domain?: string
  members: string[]
  onAdd: (email: string) => void
  onRemove?: (email: string) => void
}

// Collects team member emails with simple validation and optional domain filter
export function EmailTeamBuilder({ domain, members, onAdd, onRemove }: EmailTeamBuilderProps) {
  const [inputEmail, setInputEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleAdd = async () => {
    const email = inputEmail.trim().toLowerCase()
    if (!isValidEmail(email)) {
      setError('Enter a valid email address')
      return
    }
    if (domain && !email.endsWith(`@${domain}`)) {
      setError(`Email must end with @${domain}`)
      return
    }
    if (members.includes(email)) {
      setError('Already added')
      return
    }
    try {
      await fetch('/api/team-members/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {}
    onAdd(email)
    setInputEmail('')
    setError(null)
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="Users" className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Add Team Members</h3>
      </div>

      <div className="flex gap-2">
        <input
          type="email"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          placeholder={domain ? `name@${domain}` : 'name@company.com'}
          className="input flex-1"
        />
        <Button onClick={handleAdd} disabled={!inputEmail.trim()}>
          Add
        </Button>
      </div>

      {error && (
        <div className="text-sm text-[var(--muted-foreground)]">{error}</div>
      )}

      {members.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {members.map((email) => (
            <span key={email} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-[var(--muted)] text-[var(--foreground)]">
              {email}
              {onRemove && (
                <button aria-label={`Remove ${email}`} onClick={async () => {
                  try { await fetch(`/api/team-members/${email}`, { method: 'DELETE' }) } catch {}
                  onRemove(email)
                }} className="ml-1">
                  <Icon name="X" className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}


