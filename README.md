# Team Scheduler - Standalone Team Meeting Scheduler

A clean, minimal standalone app for scheduling team meetings with Google Calendar integration. Built with Next.js 14 and Supabase, it allows teams to find common availability and book meetings that create real Google Calendar events.

## 🚀 Features

### Core Functionality
- **Google OAuth Authentication** - Simple sign-in with Google accounts via Supabase Auth
- **Team Discovery** - Automatically find colleagues from the same company domain
- **Availability Checking** - Query real Google Calendar data to find free times
- **One-Click Booking** - Create meetings that appear in everyone's calendar
- **Google Meet Integration** - Automatic video meeting links
- **Real Calendar Events** - Creates actual calendar invites, not just database records

### Key Capabilities
- ✅ **Domain-based team discovery** - Automatically shows colleagues with matching email domains
- ✅ **Real calendar integration** - Queries actual Google Calendar availability (not simulated)
- ✅ **Actual event creation** - Creates real Google Calendar events with invitations
- ✅ **Google Meet links** - Generates meeting links automatically
- ✅ **Business hours filtering** - Searches only during configurable work hours
- ✅ **Mobile responsive** - Works on all devices
- ✅ **TypeScript** - Full type safety throughout the application
- ✅ **Row Level Security** - Secure data access with Supabase RLS
- ✅ **Real-time Auth** - Instant authentication state updates

## 🛠 Tech Stack

- **Framework:** Next.js 14 with App Router
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth with Google OAuth
- **Calendar API:** Google Calendar API
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account
- Google Cloud Console account
- Google Workspace or Gmail account for testing

## 🔧 Quick Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd team-scheduler-standalone
npm install
```

### 2. Set Up Supabase

**See [SUPABASE-SETUP.md](./SUPABASE-SETUP.md) for detailed setup instructions.**

Quick steps:
1. Create a Supabase project
2. Run the SQL schema from `supabase-schema.sql`
3. Configure Google OAuth provider in Supabase Auth
4. Get your project URL and anon key

### 3. Environment Configuration

Create `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional - Company Domain (filters users by domain)
COMPANY_DOMAIN=yourcompany.com
```

### 4. Run the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Visit `http://localhost:3000` to see your app!

## 📱 How to Use

### For End Users:
1. **Sign In** - Click "Continue with Google" and grant calendar access
2. **Select Team Members** - Choose colleagues from your company domain
3. **Set Duration** - Pick meeting length (15min - 2 hours)
4. **Find Available Times** - System checks everyone's Google Calendar
5. **Book Meeting** - Click on preferred time slot and add meeting details
6. **Calendar Integration** - Meeting appears in all participants' calendars with Google Meet link

### Admin Features:
- **Domain Filtering** - Set `COMPANY_DOMAIN` to limit users to specific email domain
- **Business Hours** - Currently hardcoded to 9 AM - 5 PM, weekdays only
- **Meeting History** - View all scheduled meetings in "My Meetings" page

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. **Connect to Vercel:**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Set environment variables in Vercel dashboard
- Deploy

3. **Update Google OAuth:**
- Add your Vercel domain to Google OAuth redirect URIs
- Update `NEXTAUTH_URL` to your production domain

### Deploy to Docker

```bash
# Build image
docker build -t team-scheduler .

# Run container
docker run -p 3000:3000 --env-file .env.local team-scheduler
```

### Deploy to Railway

1. Connect your GitHub repository
2. Set environment variables
3. Deploy with automatic HTTPS

## 🔐 Security Features

- **OAuth-only Authentication** - No password storage, uses Google OAuth
- **Domain Validation** - Optional restriction to company email domains
- **Calendar Scope Limitation** - Only accesses free/busy information and event creation
- **Session Security** - Secure JWT sessions with NextAuth.js
- **API Protection** - All APIs require authentication

## ⚠️ Current Limitations

1. **Google Calendar Only** - Currently only supports Google Calendar (no Outlook/Apple)
2. **Fixed Business Hours** - Hardcoded to 9 AM - 5 PM, weekdays only
3. **7-Day Search Window** - Only searches next 7 days for availability
4. **No Recurring Meetings** - Each meeting is one-time only
5. **No Time Zone Selection** - Uses system time zone

## 🔧 Customization

### Modify Business Hours
Edit `/lib/google-calendar.ts`:
```typescript
businessHours: { start: 9, end: 17 } // Change these values
```

### Change Search Window
Edit `/app/api/availability/route.ts`:
```typescript
daysToCheck: z.number().min(1).max(14).default(7) // Extend max days
```

### Add Custom Meeting Types
Extend the database schema in `/prisma/schema.prisma` to add meeting categories.

## 🐛 Troubleshooting

### "No team members found"
- Ensure colleagues have signed in at least once
- Check that `COMPANY_DOMAIN` matches email domains
- Verify users are using Google accounts

### "Failed to fetch availability"
- Check Google Calendar API is enabled
- Verify OAuth scopes include calendar access
- Ensure all participants have connected Google Calendar

### "Calendar access expired"
- Users need to sign out and sign back in
- Check OAuth refresh token is working
- Verify Google OAuth credentials are correct

### Database connection errors
- Ensure PostgreSQL is running
- Check `DATABASE_URL` format
- Run `npx prisma migrate dev` to sync schema

## 📊 Database Schema

The app uses a minimal schema:

- **Users** - Store authenticated users with domain info
- **Sessions/Accounts** - NextAuth.js session management  
- **Meetings** - Store created meetings with Google Calendar integration
- **VerificationTokens** - Email verification (unused but required by NextAuth)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - feel free to use this for your team!

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Google Calendar API documentation
3. Check NextAuth.js documentation for auth issues
4. Open an issue in the GitHub repository

---

**Built for teams who want simple, reliable meeting scheduling without the complexity of full calendar platforms.**