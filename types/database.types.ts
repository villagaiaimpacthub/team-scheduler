// Database types for TypeScript auto-completion
// This file should be generated with: supabase gen types typescript --local > types/database.types.ts
// For now, we'll define them manually based on our schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          email: string
          email_verified: string | null
          image_url: string | null
          domain: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          email_verified?: string | null
          image_url?: string | null
          domain?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          email_verified?: string | null
          image_url?: string | null
          domain?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          duration: number
          location: string | null
          google_event_id: string | null
          organizer_id: string
          participants: any // JSON array
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          duration: number
          location?: string | null
          google_event_id?: string | null
          organizer_id: string
          participants: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          duration?: number
          location?: string | null
          google_event_id?: string | null
          organizer_id?: string
          participants?: any
          created_at?: string
          updated_at?: string
        }
      }
      google_tokens: {
        Row: {
          id: string
          user_id: string
          access_token: string | null
          refresh_token: string | null
          expires_at: string | null
          token_type: string | null
          scope: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          token_type?: string | null
          scope?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          token_type?: string | null
          scope?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_team_members: {
        Args: {
          user_email: string
        }
        Returns: {
          id: string
          name: string
          email: string
          image_url: string
          domain: string
        }[]
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type User = Tables<'users'>
export type Meeting = Tables<'meetings'>
export type GoogleToken = Tables<'google_tokens'>