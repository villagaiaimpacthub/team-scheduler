import { getServerSession } from '@/lib/auth-supabase'
import { redirect } from 'next/navigation'
import { SignInForm } from './SignInForm'

export default async function SignInPage() {
  const session = await getServerSession()
  
  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignInForm />
    </div>
  )
}