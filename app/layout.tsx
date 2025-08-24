import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Navigation } from '@/components/Navigation'
import './globals.css'
import { Icon } from '@/components/ui/Icon'
import { useEffect, useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Team Scheduler',
  description: 'Schedule team meetings with Google Calendar integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Force dark by default; allow toggle to light
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem('ts-theme') as 'dark' | 'light') || 'dark'
      setTheme(saved)
    }
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ts-theme', theme)
    }
    const html = document.documentElement
    html.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <html lang="en" className={theme === 'dark' ? 'dark' : ''}>
      <body className={inter.className}>
        <Providers>
          <Navigation />
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
          <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}