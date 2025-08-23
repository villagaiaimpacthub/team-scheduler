import { getServerSession } from '@/lib/auth-supabase'
import { redirect } from 'next/navigation'
import { MeetingsList } from './MeetingsList'

export default async function MeetingsPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Meetings</h1>
        <p className="text-gray-600">View and manage your scheduled team meetings</p>
      </div>
      
      <MeetingsList />
    </div>
  )
}