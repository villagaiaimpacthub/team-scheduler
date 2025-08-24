/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://accounts.google.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self' ${supabaseUrl} https://*.supabase.co https://*.supabase.in https://www.googleapis.com https://accounts.google.com;
  frame-src 'self' https://accounts.google.com;
  frame-ancestors *;
  base-uri 'self';
  form-action 'self' ${supabaseUrl} https://*.supabase.co https://accounts.google.com;
`.replace(/\n/g, ' ')

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['googleapis']
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    COMPANY_DOMAIN: process.env.COMPANY_DOMAIN
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

module.exports = nextConfig