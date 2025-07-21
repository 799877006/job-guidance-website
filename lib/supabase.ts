import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// Supabase 客户端配置
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: isBrowser, // 只在浏览器环境中持久化会话
    detectSessionInUrl: isBrowser // 只在浏览器环境中检测URL中的会话
  }
}

// 创建 Supabase 客户端实例
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, supabaseConfig)

// 清除所有认证相关的缓存
export const clearAllAuthCache = () => {
  if (!isBrowser) return

  // 清理 Supabase 使用的标准 localStorage 键
  // Supabase 客户端会自动处理这些键，但为了确保完全清理，我们手动操作
  for (const key in localStorage) {
    if (key.startsWith('sb-') || key.startsWith('supabase.')) {
      localStorage.removeItem(key)
    }
  }
  // 额外清理我们之前可能使用的自定义键
  localStorage.removeItem('job_guidance_student.auth.token')
  localStorage.removeItem('job_guidance_instructor.auth.token')
  localStorage.removeItem('job_guidance_admin.auth.token')
  localStorage.removeItem('job_guidance_default.auth.token')
}

export type { Database } from './types/supabase'

// Client-side Supabase client (singleton pattern)
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export const getSupabaseBrowserClient = () => {
  if (!isBrowser) {
    throw new Error('getSupabaseBrowserClient should only be called in browser environment')
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, supabaseConfig)
  }
  return supabaseClient
}

// Server-side Supabase client
export function createServerClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })
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

export async function checkSupabaseConnection() {
  try {
    // 1. 检查认证连接
    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.error('认证连接错误:', authError)
      return {
        isConnected: false,
        error: authError,
        details: {
          auth: false,
          db: null
        }
      }
    }

    // 2. 检查数据库连接
    const { data: dbData, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (dbError) {
      console.error('数据库连接错误:', dbError)
      return {
        isConnected: false,
        error: dbError,
        details: {
          auth: true,
          db: false
        }
      }
    }

    return {
      isConnected: true,
      error: null,
      details: {
        auth: true,
        db: true,
        session: authData.session
      }
    }
  } catch (error) {
    console.error('Supabase 连接检查错误:', error)
    return {
      isConnected: false,
      error,
      details: {
        auth: false,
        db: false
      }
    }
  }
}
