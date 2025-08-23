# Team Scheduler - Supabase Setup Guide

This guide walks you through setting up the team scheduler with Supabase for authentication and database management.

## 🚀 Prerequisites

- Node.js 18+ installed
- A Supabase account
- Google Cloud Console account
- Gmail/Google Workspace account for testing

## 📋 Step-by-Step Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization and enter:
   - **Project Name**: Team Scheduler
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
4. Wait for the project to be created (2-3 minutes)

### 2. Set Up Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` from the project root
3. Paste it into the SQL Editor and click **Run**
4. Verify tables were created by going to **Table Editor**

You should see these tables:
- `users` - User profiles
- `meetings` - Meeting records  
- `google_tokens` - Google OAuth tokens (secure storage)

### 3. Configure Google OAuth Provider

#### A. Set up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Calendar API**:
   - Go to "APIs & Services" → "Library"
   - Search "Google Calendar API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized origins and redirect URIs (see below)

#### B. Configure OAuth URLs

For **Development**:
- **Authorized JavaScript origins**: `http://localhost:3000`
- **Authorized redirect URIs**: 
  - `http://localhost:3000/auth/callback`
  - `https://your-project.supabase.co/auth/v1/callback`

For **Production**:
- **Authorized JavaScript origins**: `https://yourdomain.com`
- **Authorized redirect URIs**:
  - `https://yourdomain.com/api/auth/callback`
  - `https://your-project.supabase.co/auth/v1/callback`

#### C. Configure Supabase Auth Provider

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click configure
3. Enable the Google provider
4. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
   - **Scopes**: `openid email profile https://www.googleapis.com/auth/calendar`
5. Click **Save**

### 4. Environment Configuration

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **Anon Public Key**
3. Create `.env.local` in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional - Company Domain Filter
COMPANY_DOMAIN=yourcompany.com
```

### 5. Install Dependencies and Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 🔒 Row Level Security (RLS)

The schema includes comprehensive RLS policies:

- **Users can only see their own profile and colleagues from same domain**
- **Users can only see meetings they organized or are invited to**
- **Google tokens are strictly isolated per user**

## 🔧 Configuration Options

### Company Domain Filtering

Set `COMPANY_DOMAIN=yourcompany.com` to restrict sign-ups to specific email domains.

### Customizing Business Hours

Edit the availability checking in `lib/google-calendar.ts`:

```typescript
businessHours: { start: 9, end: 17 } // 9 AM to 5 PM
```

## 📱 How It Works

### Authentication Flow
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth with calendar scopes
3. Google redirects back to Supabase Auth
4. Supabase creates user session
5. App extracts Google tokens and stores them securely
6. User can now access calendar features

### Meeting Scheduling Flow
1. User selects team members from same domain
2. App queries Google Calendar API for availability
3. Finds intersection of free times for all participants
4. User selects preferred time slot
5. Creates Google Calendar event for all attendees
6. Stores meeting record in Supabase
7. Everyone gets calendar invite with Google Meet link

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Update OAuth Redirect URLs

After deployment, update your Google OAuth configuration with production URLs.

## 🔍 Troubleshooting

### "Invalid redirect URI" error
- Check Google OAuth redirect URIs match exactly
- Ensure both app callback and Supabase callback URLs are added

### "No calendar access" error  
- Verify Google Calendar API is enabled
- Check OAuth scopes include calendar access
- Ensure Google tokens are being stored (check `google_tokens` table)

### "No team members found"
- Ensure colleagues have signed in at least once
- Check `COMPANY_DOMAIN` setting
- Verify domain extraction is working (check `users.domain` column)

### Database connection issues
- Verify Supabase URL and anon key are correct
- Check RLS policies are properly applied
- Test database queries in Supabase SQL Editor

## 🔐 Security Features

- **OAuth-only authentication** - No passwords stored
- **Row Level Security** - Users can only access their own data
- **Secure token storage** - Google tokens encrypted in database
- **Domain validation** - Optional company email restriction
- **Calendar scope limitation** - Only free/busy and event creation access

## 📊 Database Schema

### Users Table
Extends Supabase Auth users with profile information and domain for team discovery.

### Meetings Table
Stores meeting details with Google Calendar integration. Includes RLS policies for organizer/participant access.

### Google Tokens Table
Securely stores Google OAuth tokens for calendar access with automatic refresh capability.

---

**This setup maintains all the original functionality while providing better security, scalability, and developer experience with Supabase.**