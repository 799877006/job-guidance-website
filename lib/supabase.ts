import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://krkjwzphsrzwwijiadtw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client-side Supabase client (singleton pattern)
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseBrowserClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

// Server-side Supabase client
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Types
export interface Profile {
  id: string
  email: string
  full_name?: string
  role: "student" | "instructor"
  age?: number
  university?: string
  major?: string
  graduation_year?: number
  bio?: string
  avatar_url?: string
  resume_url?: string
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  user_id: string
  company_id: string
  position: string
  status: "applied" | "rejected" | "accepted" | "pending"
  applied_date: string
  notes?: string
  created_at: string
  updated_at: string
  companies?: {
    name: string
    industry?: string
  }
}

export interface Interview {
  id: string
  application_id?: string
  user_id: string
  company_name: string
  interview_type: string
  scheduled_date: string
  scheduled_time: string
  status: "scheduled" | "completed" | "cancelled"
  notes?: string
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  industry?: string
  website?: string
  description?: string
  logo_url?: string
  created_at: string
}

export interface Advertisement {
  id: string
  title: string
  description?: string
  image_url?: string
  link_url?: string
  company_name?: string
  is_active: boolean
  created_at: string
  expires_at?: string
}

export interface Feedback {
  id: string
  user_id: string
  name: string
  email: string
  category: string
  subject: string
  message: string
  status: string
  created_at: string
}
