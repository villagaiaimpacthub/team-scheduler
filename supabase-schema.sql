-- Team Scheduler Supabase Schema
-- This replaces the Prisma schema with Supabase-native tables and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMPTZ,
  image_url TEXT,
  domain TEXT, -- Company domain extracted from email
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  location TEXT, -- Google Meet link
  
  -- Google Calendar integration
  google_event_id TEXT,
  
  -- Organizer (references users table)
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Participants (JSON array of email addresses)
  participants JSONB NOT NULL, -- ["email1@company.com", "email2@company.com"]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Google OAuth tokens table (stores refresh/access tokens securely)
CREATE TABLE public.google_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one token record per user
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_domain ON public.users(domain);
CREATE INDEX idx_meetings_organizer ON public.meetings(organizer_id);
CREATE INDEX idx_meetings_start_time ON public.meetings(start_time);
CREATE INDEX idx_google_tokens_user ON public.google_tokens(user_id);
CREATE INDEX idx_google_tokens_expires ON public.google_tokens(expires_at);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_google_tokens_updated_at BEFORE UPDATE ON public.google_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view colleagues from same domain (for team discovery)
CREATE POLICY "Users can view colleagues from same domain" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users self_user 
      WHERE self_user.id = auth.uid() 
      AND self_user.domain = public.users.domain
    )
  );

-- Meetings policies
CREATE POLICY "Users can view meetings they organized" ON public.meetings
  FOR SELECT USING (organizer_id = auth.uid());

CREATE POLICY "Users can view meetings they're invited to" ON public.meetings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND email = ANY(SELECT jsonb_array_elements_text(participants))
    )
  );

CREATE POLICY "Users can create meetings" ON public.meetings
  FOR INSERT WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Users can update their own meetings" ON public.meetings
  FOR UPDATE USING (organizer_id = auth.uid());

CREATE POLICY "Users can delete their own meetings" ON public.meetings
  FOR DELETE USING (organizer_id = auth.uid());

-- Google tokens policies (highly secure - users can only access their own tokens)
CREATE POLICY "Users can manage their own Google tokens" ON public.google_tokens
  FOR ALL USING (user_id = auth.uid());

-- Functions for common operations

-- Function to get team members by domain
CREATE OR REPLACE FUNCTION get_team_members(user_email TEXT)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  image_url TEXT,
  domain TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.image_url, u.domain
  FROM public.users u
  WHERE u.domain = (
    SELECT domain FROM public.users WHERE email = user_email LIMIT 1
  )
  AND u.email != user_email
  ORDER BY u.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to store user profile after Google OAuth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, image_url, domain, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    SPLIT_PART(NEW.email, '@', 2),
    NEW.email_confirmed_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();