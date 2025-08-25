import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import './globals.css'

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
      <body className={`${inter.className} bg-[rgb(var(--background))] text-[rgb(var(--foreground))]`}>
        <Providers>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
          <ThemeToggle />
        </Providers>
      </body>
    </html>
  )
}