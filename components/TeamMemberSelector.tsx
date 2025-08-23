'use client'

import { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { Users, Check } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  image?: string
}

interface TeamMemberSelectorProps {
  selectedEmails: string[]
  onSelectionChange: (emails: string[]) => void
}

export function TeamMemberSelector({ selectedEmails, onSelectionChange }: TeamMemberSelectorProps) {
  const [teammates, setTeammates] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTeammates()
  }, [])

  const fetchTeammates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/team-members')
      
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }
      
      const data = await response.json()
      setTeammates(data.teammates || [])
    } catch (error) {
      console.error('Error fetching teammates:', error)
      setError(error instanceof Error ? error.message : 'Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const toggleMemberSelection = (email: string) => {
    if (selectedEmails.includes(email)) {
      onSelectionChange(selectedEmails.filter(e => e !== email))
    } else {
      onSelectionChange([...selectedEmails, email])
    }
  }

  if (loading) {
    return (
      <Card>
        <LoadingSpinner text="Loading team members..." />
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="text-center text-red-600 p-4">
          <p>Error: {error}</p>
        </div>
      </Card>
    )
  }

  if (teammates.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Team Members</h3>
        </div>
        <p className="text-gray-500">
          No teammates found. Make sure your colleagues have signed in with the same company domain.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Team Members ({selectedEmails.length} selected)
        </h3>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {teammates.map((member) => {
          const isSelected = selectedEmails.includes(member.email)
          
          return (
            <div
              key={member.id}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-primary-50 border border-primary-200'
                  : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
              }`}
              onClick={() => toggleMemberSelection(member.email)}
            >
              <div className="flex items-center gap-3">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div>
                  <div className="font-medium text-sm">{member.name}</div>
                  <div className="text-xs text-gray-500">{member.email}</div>
                </div>
              </div>
              
              {isSelected && (
                <Check className="h-4 w-4 text-primary-600" />
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}