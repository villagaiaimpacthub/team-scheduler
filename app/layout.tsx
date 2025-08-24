import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Navigation } from '@/components/Navigation'
import './globals.css'
import { ThemeToggle } from '@/components/ThemeToggle'

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
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <Navigation />
          <ThemeToggle />
          <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}