'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('ts-theme') as 'dark' | 'light') || 'dark'
    setTheme(saved)
    document.documentElement.classList.toggle('dark', saved === 'dark')
  }, [])

  useEffect(() => {
    localStorage.setItem('ts-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      className="fixed bottom-4 right-4 z-50 inline-flex items-center justify-center h-10 w-10 rounded-full bg-[var(--card)] text-[var(--card-foreground)] shadow border border-[color:var(--border)]"
    >
      {theme === 'dark' ? (
        <Icon name="Sun" className="h-5 w-5" />
      ) : (
        <Icon name="Moon" className="h-5 w-5" />
      )}
    </button>
  )
}


