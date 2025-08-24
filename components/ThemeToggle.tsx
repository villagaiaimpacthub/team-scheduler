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
      className="fixed bottom-4 right-4 z-50 inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shadow"
    >
      {theme === 'dark' ? (
        <Icon name="Sun" className="h-5 w-5" />
      ) : (
        <Icon name="Moon" className="h-5 w-5" />
      )}
    </button>
  )
}


