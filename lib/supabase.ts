import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/supabase'

// 简化配置：直接使用环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 客户端配置 - 专注于浏览器环境
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // 使用默认的localStorage，简化配置
  },
}

// 创建单一的Supabase客户端实例
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, supabaseOptions)

// 添加网络请求测试函数
export async function testSupabaseConnection() {
  try {
    console.log('🔍 测试 Supabase 连接...')
    const { data, error } = await supabase.auth.getSession()
    console.log('✅ Supabase Auth 连接正常:', data)
    return { success: true, data, error }
  } catch (error) {
    console.error('❌ Supabase 连接失败:', error)
    return { success: false, error }
  }
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
