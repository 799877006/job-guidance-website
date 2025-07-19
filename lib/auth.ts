import { toast } from "sonner";
import { supabase } from "./supabase"
import type { Profile } from "./supabase"

const MAX_RETRIES = 3
const TIMEOUT = 10000 // 10 seconds

export async function signUp(email: string, password: string, userData: Partial<Profile>) {
  try {
    // 1. 创建认证用户
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log("supabase signup返回数据:", data);

    if (error) {
      console.error("认证注册错误:", error);
      throw error;
    }
    
    if (!data?.user) {
      throw new Error('ユーザー登録に失敗しました');
    }

    // 2. 检查是否为重复注册
    // 如果 identities 数组为空，说明邮箱已被注册
    if (!data.user.identities || data.user.identities.length === 0) {
      console.log("邮箱已被注册:", email);
      throw new Error('このメールアドレスは既に登録されています。ログインページからサインインしてください。');
    }

    // 3. 将用户数据暂存到 localStorage
    const pendingProfileData = {
      id: data.user.id,
      email: email,
      role: userData.role || 'student',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      full_name: userData.full_name || null,
      university: userData.university || null,
      major: userData.major || null,
      age: null,
      graduation_year: null,
      bio: null,
      avatar_url: null,
      resume_url: null
    };

    localStorage.setItem('pendingProfile', JSON.stringify(pendingProfileData));
    console.log("用户数据已暂存到 localStorage");

    return data;
  } catch (error: any) {
    console.error('登録エラー:', error);
    
    // 特定のエラーメッセージをそのまま返す
    if (error.message.includes('このメールアドレスは既に登録されています') ||
        error.message.includes('プロフィールの作成に失敗しました') ||
        error.message.includes('ユーザー登録中にエラーが発生しました')) {
      throw error;
    }
    
    // その他のエラーは一般的なメッセージに変換
    throw new Error('登録に失敗しました。入力内容を確認して再度お試しください。');
  }
}

// 新增：创建用户 profile
export async function createProfile(userId: string) {
  try {
    // 从 localStorage 获取暂存的用户数据
    const pendingProfileData = localStorage.getItem('pendingProfile');
    if (!pendingProfileData) {
      throw new Error('プロフィールデータが見つかりません');
    }

    const profileData = JSON.parse(pendingProfileData);
    
    // 确保 userId 匹配
    if (profileData.id !== userId) {
      throw new Error('ユーザーIDが一致しません');
    }

    // 创建 profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([profileData]);

    if (profileError) {
      console.error("プロフィール作成エラー:", profileError);
      
      if (profileError.code === '23503') {
        throw new Error('ユーザー登録中にエラーが発生しました。しばらく時間をおいて再度お試しください。');
      }
      
      throw new Error('プロフィールの作成に失敗しました。');
    }

    // 成功后清除暂存数据
    localStorage.removeItem('pendingProfile');
    
    return profileData;
  } catch (error: any) {
    console.error('プロフィール作成エラー:', error);
    throw error;
  }
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
