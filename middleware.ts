import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase-server'

export async function middleware(request: NextRequest) {
  // Update session first (propagate auth cookies)
  const sessionResponse = await updateSession(request)

  // Create a fresh response
  let response = NextResponse.next()
  // Copy cookies set by updateSession onto the new response
  sessionResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie)
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const csp = [
    `default-src 'self'`,
    // Pragmatic allowlist: allow inline + same-origin + Google auth hosts
    `script-src 'self' 'unsafe-inline' https://accounts.google.com https://www.gstatic.com https://apis.google.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data: https:`,
    `connect-src 'self' ${supabaseUrl} https://*.supabase.co https://*.supabase.in https://www.googleapis.com https://accounts.google.com`,
    `frame-src https://accounts.google.com`,
    `frame-ancestors *`,
    `base-uri 'self'`,
    `form-action 'self' ${supabaseUrl} https://accounts.google.com`,
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\..*$).*)',
  ],
}