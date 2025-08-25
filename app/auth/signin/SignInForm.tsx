'use client'

import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/Icon'

export function SignInForm() {
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy',
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    
    if (error) {
      console.error('Error signing in:', error)
    } else {
      // After successful sign-in, bootstrap teammates from calendar
      // No bootstrap anymore
    }
  }

  return (
    <Card className="w-full max-w-md">
      <div className="text-center space-y-6">
        <div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Icon name="Users" className="h-10 w-10 text-[var(--primary)]" />
            <h1 className="text-2xl font-bold">Team Scheduler</h1>
          </div>
          <p className="text-[var(--muted-foreground)]">Schedule team meetings with Google Calendar integration</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <Icon name="Users" className="h-8 w-8 text-[var(--primary)] mx-auto" />
              <p className="text-xs text-[var(--muted-foreground)]">Select Team</p>
            </div>
            <div className="space-y-2">
              <Icon name="Clock" className="h-8 w-8 text-[var(--primary)] mx-auto" />
              <p className="text-xs text-[var(--muted-foreground)]">Find Times</p>
            </div>
            <div className="space-y-2">
              <Icon name="Calendar" className="h-8 w-8 text-[var(--primary)] mx-auto" />
              <p className="text-xs text-[var(--muted-foreground)]">Book Meeting</p>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </div>

        <div className="text-xs text-[var(--muted-foreground)] space-y-1">
          <p>• Requires Google Calendar access</p>
          <p>• Works with your company domain</p>
          <p>• Creates real calendar events</p>
        </div>
      </div>
    </Card>
  )
}