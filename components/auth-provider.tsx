"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User, AuthChangeEvent } from "@supabase/supabase-js"
import { supabase, type Profile } from "@/lib/supabase"
import { getProfile, createProfile } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (user) {
      try {
        const profileData = await getProfile(user.id)
        setProfile(profileData)
      } catch (error) {
        console.error("获取 profile 失败:", error)
      }
    }
  }

  useEffect(() => {
    let mounted = true

    // 检查页面是否可见，避免在后台时进行不必要的状态更新
    const isPageVisible = () => !document.hidden

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // 只在非注册页面获取 profile
          const currentPath = window.location.pathname
          if (currentPath !== '/register') {
            try {
              const profileData = await getProfile(session.user.id)
              if (mounted) {
                setProfile(profileData)
              }
            } catch (error) {
              console.error("获取 profile 失败:", error)
              if (mounted) {
                setProfile(null)
              }
            }
          }
        } else {
          setProfile(null)
        }
        
        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error("初始化认证状态失败:", error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // 监听页面可见性变化
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // 页面重新可见时，静默同步状态（不显示loading）
        // 这里可以在将来添加必要的状态同步逻辑
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      if (!mounted) return

      // 对于TOKEN_REFRESHED事件，如果页面不可见，则不进行UI更新
      if (event === 'TOKEN_REFRESHED' && !isPageVisible()) {
        return
      }

      // 只在必要的事件时设置loading状态，避免在token刷新时显示加载界面
      const shouldShowLoading = ['SIGNED_IN', 'SIGNED_OUT'].includes(event)
      if (shouldShowLoading) {
        setLoading(true)
      }
      
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // 检查是否有待创建的 profile
        const pendingProfile = localStorage.getItem('pendingProfile');
        
        if (event === 'SIGNED_IN' && pendingProfile) {
          try {
            // 创建 profile
            await createProfile(session.user.id);
            // 获取新创建的 profile
            const profileData = await getProfile(session.user.id);
            if (mounted) {
              setProfile(profileData);
            }
          } catch (error) {
            console.error("创建 profile 失败:", error);
            // 清除暂存数据以防止重复尝试
            localStorage.removeItem('pendingProfile');
            if (mounted) {
              setProfile(null);
            }
          }
        } else {
          // 只在特定的认证事件下获取 profile
          const shouldFetchProfile = ['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event);
          
          if (shouldFetchProfile) {
            try {
              const profileData = await getProfile(session.user.id)
              if (mounted) {
                setProfile(profileData)
              }
            } catch (error) {
              console.error("获取 profile 失败:", error)
              if (mounted) {
                setProfile(null)
              }
            }
          }
        }
      } else {
        setProfile(null)
      }
      
      // 只在设置了loading的情况下才重置loading状态
      if (mounted && shouldShowLoading) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
