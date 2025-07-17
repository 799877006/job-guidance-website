import { supabase } from "./supabase"
import type { Profile } from "./supabase"

export async function signUp(email: string, password: string, userData: Partial<Profile>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error

  if (data.user) {
    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        email,
        ...userData,
      },
    ])

    if (profileError) throw profileError
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching profile:", error)
    return null
  }

  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single()

  if (error) throw error
  return data
}
