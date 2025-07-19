"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User, AuthChangeEvent } from "@supabase/supabase-js"
import { supabase, type Profile } from "@/lib/supabase"
import { getProfile } from "@/lib/auth"

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

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mounted) {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            // 只在非注册页面获取 profile
            const currentPath = window.location.pathname
            if (currentPath !== '/register') {
              const profileData = await getProfile(session.user.id)
              setProfile(profileData)
            }
          }
          
          setLoading(false)
        }
      } catch (error) {
        console.error("初始化认证状态失败:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      if (!mounted) return

      setUser(session?.user ?? null)
      
      if (session?.user) {
        // 只在特定的认证事件下获取 profile
        const shouldFetchProfile = ['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event);
        
        if (shouldFetchProfile) {
          try {
            const profileData = await getProfile(session.user.id)
            setProfile(profileData)
          } catch (error) {
            console.error("获取 profile 失败:", error)
          }
        }
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
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
