"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, AuthChangeEvent } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Profile } from "@/lib/types/supabase"
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
    // 首次加载时，尝试获取会话
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initializeSession();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // 这个回调函数应该是快速和同步的
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 当 user 状态变化时，获取 profile
  useEffect(() => {
    // 如果 user 存在，则获取 profile
    if (user) {
      setLoading(true);
      // 检查是否有待创建的 profile (注册流程)
      const pendingProfile = localStorage.getItem('pendingProfile');
      if (pendingProfile && JSON.parse(pendingProfile).id === user.id) {
         createProfile(user.id)
          .then(() => getProfile(user.id))
          .then(profileData => {
            setProfile(profileData);
            localStorage.removeItem('pendingProfile');
          })
          .catch(error => {
            console.error("创建或获取 profile 失败:", error);
            setProfile(null);
            localStorage.removeItem('pendingProfile');
          })
          .finally(() => setLoading(false));
      } else {
        // 普通登录流程
        getProfile(user.id)
          .then(profileData => {
            setProfile(profileData);
          })
          .catch(error => {
            console.error("获取 profile 失败:", error);
            setProfile(null);
          })
          .finally(() => setLoading(false));
      }
    } else {
      // 如果 user 为 null，则清除 profile
      setProfile(null);
    }
  }, [user]);


  const handleSignOut = async () => {
    console.log("开始signout")
    await supabase.auth.signOut()
    console.log("signout成功")
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
