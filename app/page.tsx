import { getServerSession } from '@/lib/auth-supabase'
import { redirect } from 'next/navigation'
import { TeamScheduler } from '@/components/TeamScheduler'

export default async function HomePage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/signin')
  }

  return <TeamScheduler />
}