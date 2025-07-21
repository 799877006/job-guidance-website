import { supabase, clearAllAuthCache } from './supabase'
import type { Profile } from './types/supabase'

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

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
      graduation_year: null,
      avatar_url: null
    };

    if (isBrowser) {
      localStorage.setItem('pendingProfile', JSON.stringify(pendingProfileData));
      console.log("用户数据已暂存到 localStorage");
    }

    return data;
  } catch (error: any) {
    console.error("注册错误:", error);
    
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

export async function createProfile(userId: string) {
  try {
    let profileData;
    
    // 从 localStorage 获取暂存的用户数据
    if (isBrowser) {
      const pendingProfileData = localStorage.getItem('pendingProfile');
      if (!pendingProfileData) {
        throw new Error('プロフィールデータが見つかりません');
      }
      profileData = JSON.parse(pendingProfileData);
    } else {
      throw new Error('プロフィールデータが見つかりません');
    }
    
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
    if (isBrowser) {
      localStorage.removeItem('pendingProfile');
    }
    
    return profileData;
  } catch (error: any) {
    console.error('プロフィール作成エラー:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  try {
    console.log("开始signin")
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    console.log("signinwithpassword成功")
    
    if (error) {
      console.error('Sign in error:', error)
      throw error
    }

    return { user }
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // 清除所有认证缓存
    clearAllAuthCache()
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getProfile:', error)
    return null
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating profile:', error)
    throw error
  }
}
