import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase-server'

export async function middleware(request: NextRequest) {
  // Generate per-request nonce (Edge-safe)
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  const nonce = btoa(String.fromCharCode(...array))

  // Update session first (propagate auth cookies)
  let response = await updateSession(request)

  // Build strict CSP with nonce and strict-dynamic
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const csp = [
    `default-src 'self'`,
    // Allow Next inline bootstrap via 'unsafe-inline' and nonce; strict-dynamic for child scripts
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'strict-dynamic' https://accounts.google.com https://www.gstatic.com https://apis.google.com`,
    // Styles (Tailwind injects styles via CSS files; allow inline for safety)
    `style-src 'self' 'unsafe-inline'`,
    // Images/fonts may load from CDNs
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data: https:`,
    // Network calls
    `connect-src 'self' ${supabaseUrl} https://*.supabase.co https://*.supabase.in https://www.googleapis.com https://accounts.google.com`,
    // OAuth frames
    `frame-src https://accounts.google.com`,
    // Embedding allowed
    `frame-ancestors *`,
    `base-uri 'self'`,
    `form-action 'self' ${supabaseUrl} https://accounts.google.com`,
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('x-nonce', nonce)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\..*$).*)',
  ],
}