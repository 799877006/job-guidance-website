import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 添加缓存键前缀常量
const CACHE_KEY_PREFIX = 'job_guidance'

// 获取基于角色的缓存键
const getRoleCacheKey = (role: string | null) => {
  return `${CACHE_KEY_PREFIX}_${role || 'default'}`
}

// 创建自定义存储处理器
const customStorageAdapter = {
  getItem: (key: string) => {
    try {
      if (isBrowser) {
        return localStorage.getItem(key)
      }
      return null
    } catch (error) {
      console.error('Error reading from storage:', error)
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (isBrowser) {
        localStorage.setItem(key, value)
      }
    } catch (error) {
      console.error('Error writing to storage:', error)
    }
  },
  removeItem: (key: string) => {
    try {
      if (isBrowser) {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('Error removing from storage:', error)
    }
  }
}

// Supabase 客户端配置
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: isBrowser, // 只在浏览器环境中持久化会话
    storage: customStorageAdapter,
    detectSessionInUrl: isBrowser // 只在浏览器环境中检测URL中的会话
  }
}

// 创建 Supabase 客户端实例
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, supabaseConfig)

// 清除所有相关缓存
export const clearAllAuthCache = () => {
  if (!isBrowser) return

  const roles = ['student', 'instructor', 'admin', 'default']
  roles.forEach(role => {
    localStorage.removeItem(`${getRoleCacheKey(role)}.auth.token`)
    localStorage.removeItem(`${getRoleCacheKey(role)}.auth.expires_at`)
    localStorage.removeItem(`${getRoleCacheKey(role)}.auth.refresh_token`)
  })
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
