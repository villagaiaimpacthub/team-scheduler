'use client'

import { SignInForm } from './SignInForm'
import { useAuth } from '../../providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignInPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)] text-[var(--foreground)]">
      <div className="rounded-lg shadow-md border p-6 w-full max-w-md bg-[var(--card)] text-[var(--card-foreground)] border-[color:var(--border)]">
        <SignInForm />
      </div>
    </div>
  )
}