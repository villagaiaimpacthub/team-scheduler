# 🔧 Quick Fix: "At least one Client ID is required" Error

## The Issue
You're getting this error because Google OAuth is enabled in Supabase but the Client ID hasn't been configured yet.

## 🚀 Quick Solution (5 minutes)

### Option 1: Complete Google Setup (Recommended)

**Step 1: Get Google OAuth Credentials**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Library**
4. Search and enable **"Google Calendar API"**
5. Go to **APIs & Services** → **Credentials**
6. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
7. Choose **"Web application"**
8. Add these **Authorized redirect URIs**:
   ```
   https://YOUR-SUPABASE-PROJECT-ID.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
   (Replace YOUR-SUPABASE-PROJECT-ID with your actual project ID)
9. Click **"Create"**
10. **Copy the Client ID and Client Secret**

**Step 2: Add to Supabase**
1. Go to your Supabase dashboard
2. **Authentication** → **Providers**
3. Find **"Google"** provider
4. Paste your **Client ID** and **Client Secret**
5. Click **"Save"**

### Option 2: Temporarily Disable Google Auth

If you want to test the app first without Google setup:

1. In Supabase dashboard: **Authentication** → **Providers**
2. Toggle **Google** to **OFF**
3. Enable **Email** provider instead for basic testing

## 🎯 Environment Variables Needed

Once you have Google credentials, add these to Vercel/local `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
COMPANY_DOMAIN=yourcompany.com
```

## ✅ Verification

After fixing:
1. Try accessing your app
2. Click "Sign in with Google"
3. Should redirect to Google OAuth flow
4. Grant calendar permissions
5. You should be signed in successfully

## 🆘 Still Having Issues?

**Check these common problems:**
- Redirect URIs must exactly match (no trailing slashes)
- Google Calendar API must be enabled
- Client ID/Secret must be pasted correctly (no extra spaces)
- Supabase project URL must be correct

The Google OAuth setup is the only manual step needed - once this is configured, your team scheduler will work perfectly!