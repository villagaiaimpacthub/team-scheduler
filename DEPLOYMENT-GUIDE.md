# 🚀 Complete Deployment Guide - Team Scheduler

## Overview
This guide will get your Supabase-powered team scheduler live in production in about 15 minutes.

## ✅ Pre-Deployment Checklist
- [ ] Google account for Google Cloud Console
- [ ] GitHub account for Vercel deployment
- [ ] Email domain you want to use for team discovery

---

## 🏗️ Phase 1: Supabase Setup (5 minutes)

### Step 1: Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" → Sign up/Sign in
3. Click "New Project"
4. Fill in:
   - **Name**: `team-scheduler`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project" (takes ~2 minutes)

### Step 2: Set Up Database
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" (should complete successfully)

### Step 3: Configure Google OAuth
1. Go to **Authentication** → **Providers**
2. Find "Google" and toggle it **ON**
3. **Leave Client ID and Secret empty for now** (we'll fill these after Google setup)

### Step 4: Get Supabase Credentials
1. Go to **Settings** → **API**
2. Copy and save these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJ0eXAi...`
   - **service_role key**: `eyJ0eXAi...` (click "Reveal")

---

## 🔑 Phase 2: Google Cloud Setup (5 minutes)

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown → "New Project"
3. Name: `team-scheduler-app`
4. Click "Create"

### Step 2: Enable Google Calendar API
1. In the sidebar, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it → Click "Enable"

### Step 3: Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. **Application type**: Web application
4. **Name**: `Team Scheduler Auth`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-app-name.vercel.app
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   https://your-app-name.vercel.app/auth/callback
   https://xxxxx.supabase.co/auth/v1/callback
   ```
   (Replace `xxxxx` with your Supabase project ID)
7. Click "Create"
8. **Copy the Client ID and Client Secret** (save them!)

### Step 4: Update Supabase with Google Credentials
1. Go back to your Supabase dashboard
2. **Authentication** → **Providers** → **Google**
3. Paste your **Google Client ID** and **Client Secret**
4. Click "Save"

---

## 🌐 Phase 3: Deploy to Vercel (3 minutes)

### Step 1: Prepare Repository
1. Push your team scheduler code to a GitHub repository
2. Make sure `DEPLOYMENT-GUIDE.md` and all files are included

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your team scheduler repository
4. **Framework Preset**: Next.js (should auto-detect)
5. Don't click Deploy yet - we need environment variables first

### Step 3: Configure Environment Variables
In Vercel's environment variables section, add:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
COMPANY_DOMAIN=yourcompany.com
```

**Replace all the placeholders with your actual values!**

### Step 4: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You'll get a live URL like: `https://team-scheduler-abc123.vercel.app`

### Step 5: Update Google OAuth URLs
1. Copy your Vercel production URL
2. Go back to Google Cloud Console → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Update the **Authorized origins** and **redirect URIs** with your real Vercel URL:
   ```
   https://your-actual-vercel-url.vercel.app
   https://your-actual-vercel-url.vercel.app/auth/callback
   ```
5. Save

---

## ✅ Phase 4: Production Testing (2 minutes)

### Test the Complete Flow
1. Open your production URL
2. Click "Sign in with Google"
3. Grant calendar permissions
4. You should see the team scheduler interface
5. Try adding team members (colleagues with same email domain)
6. Test "Find Available Times"
7. Book a test meeting
8. Check that the meeting appears in all participants' Google Calendars

---

## 🎉 Success! Your App is Live

**Your team scheduler is now live at your Vercel URL!**

### Next Steps:
1. **Custom Domain** (optional): Configure a custom domain in Vercel settings
2. **Team Onboarding**: Share the URL with your team
3. **Monitor Usage**: Check Supabase and Vercel dashboards for usage

---

## 🔧 Troubleshooting

### Common Issues:

**"OAuth Error" during login:**
- Verify Google OAuth credentials are correct in both Google Cloud and Supabase
- Check that redirect URIs exactly match your production URL

**"No team members found":**
- Ensure `COMPANY_DOMAIN` is set correctly
- Team members need to sign in once to appear in the system

**Calendar events not created:**
- Verify Google Calendar API is enabled
- Check that users granted calendar permissions during OAuth

**Build fails on Vercel:**
- Check environment variables are set correctly
- Verify all required dependencies are in `package.json`

### Need Help?
Check the logs in:
- **Vercel**: Function logs tab
- **Supabase**: Logs & reports section
- **Google Cloud**: APIs & Services → Credentials

---

## 🚨 Security Notes

- Never commit `.env.local` to git
- Keep your `service_role` key secret
- Regularly rotate OAuth credentials
- Monitor authentication logs in Supabase

Your team scheduler is production-ready and secure! 🎉