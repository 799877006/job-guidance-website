// 基于 Prisma 的认证服务
// 提供用户注册、登录、个人资料管理等功能

import { supabase } from './supabase'
import { prisma, UserRole, RegisterRole } from '../prisma'

// 浏览器环境检测
const isBrowser = typeof window !== 'undefined'

/**
 * 用户注册
 * @param email 邮箱地址
 * @param password 密码
 * @param userData 用户基本信息
 */
export async function signUp(
  email: string,
  password: string,
  userData: {
    name: string
    role: RegisterRole
    phone?: string
    bio?: string
  }
) {
  try {
    // 1. 使用 Supabase Auth 创建认证用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 将用户数据存储在 metadata 中，等待邮箱验证后使用
        data: {
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          bio: userData.bio,
        }
      }
    })

    console.log('Supabase signup 返回数据:', authData)

    if (authError) {
      console.error('认证注册错误:', authError)
      throw authError
    }

    if (!authData?.user) {
      throw new Error('ユーザー登録に失敗しました')
    }

    // 2. 检查是否为重复注册
    if (!authData.user.identities || authData.user.identities.length === 0) {
      console.log('邮箱已被注册:', email)
      throw new Error('このメールアドレスは既に登録されています。ログインページからサインインしてください。')
    }

    // 3. 如果邮箱已经验证（开发环境可能自动验证），立即创建 Prisma 记录
    // 否则，在首次登录时创建
    if (authData.user.email_confirmed_at) {
      const userRole: UserRole = userData.role === 'STUDENT' ? 'STUDENT' : 'INSTRUCTOR'
      
      const user = await prisma.user.create({
        data: {
          id: authData.user.id,
          email: email,
          name: userData.name,
          role: userRole,
          phone: userData.phone,
          bio: userData.bio,
        },
      })

      console.log('用户记录已创建:', user)
      return { user: authData.user, profile: user }
    }

    // 邮箱未验证，返回认证用户数据，提示用户验证邮箱
    console.log('等待邮箱验证，用户数据已保存到 metadata')
    return { 
      user: authData.user, 
      profile: null,
      needsEmailVerification: true 
    }
  } catch (error: any) {
    console.error('注册错误:', error)

    // 保留特定的错误消息
    if (
      error.message.includes('このメールアドレスは既に登録されています') ||
      error.message.includes('ユーザー登録に失敗しました')
    ) {
      throw error
    }

    // 其他错误转换为通用消息
    throw new Error('登録に失敗しました。入力内容を確認して再度お試しください。')
  }
}

/**
 * 创建学生详细资料
 * @param userId 用户ID
 * @param profileData 学生资料数据
 */
export async function createStudentProfile(
  userId: string,
  profileData: {
    university: string
    major: string
    graduationYear: number
    skills?: string[]
    languages?: string[]
    resumeUrl: string
    preferredLocations?: string[]
    expectedSalary?: number
    formerSalary?: number
    availableStartDate?: Date
  }
) {
  try {
    const profile = await prisma.studentProfile.create({
      data: {
        userId,
        university: profileData.university,
        major: profileData.major,
        graduationYear: profileData.graduationYear,
        skills: profileData.skills || [],
        languages: profileData.languages || [],
        resumeUrl: profileData.resumeUrl,
        preferredLocations: profileData.preferredLocations || [],
        expectedSalary: profileData.expectedSalary,
        formerSalary: profileData.formerSalary,
        availableStartDate: profileData.availableStartDate,
      },
    })

    return profile
  } catch (error) {
    console.error('学生资料创建错误:', error)
    throw new Error('学生プロフィールの作成に失敗しました')
  }
}

/**
 * 创建讲师详细资料
 * @param userId 用户ID
 * @param profileData 讲师资料数据
 */
export async function createInstructorProfile(
  userId: string,
  profileData: {
    nationality: string
    experience?: number
    educationBackground?: string
    introduction?: string
    resumePdfUrl?: string
  }
) {
  try {
    const profile = await prisma.instructorProfile.create({
      data: {
        userId,
        nationality: profileData.nationality,
        experience: profileData.experience,
        educationBackground: profileData.educationBackground,
        introduction: profileData.introduction,
        resumePdfUrl: profileData.resumePdfUrl,
      },
    })

    return profile
  } catch (error) {
    console.error('讲师资料创建错误:', error)
    throw new Error('講師プロフィールの作成に失敗しました')
  }
}

/**
 * 用户登录
 * @param email 邮箱地址
 * @param password 密码
 */
export async function signIn(email: string, password: string) {
  try {
    console.log('开始登录')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    console.log('登录请求完成')

    if (error) {
      console.error('登录错误:', error)
      throw error
    }

    if (!data.user || !data.session) {
      console.error('登录成功但未获取到用户信息或会话')
      throw new Error('ログインに失敗しました')
    }

    // 从 Prisma 获取用户完整信息
    let user = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: {
        studentProfile: true,
        instructorProfile: true,
      },
    })

    // 如果 Prisma 中没有用户记录，说明是首次登录（邮箱验证后）
    // 从 Supabase metadata 中获取用户数据并创建 Prisma 记录
    if (!user && data.user.user_metadata) {
      console.log('首次登录，从 metadata 创建用户记录')
      
      const metadata = data.user.user_metadata
      const userRole: UserRole = metadata.role === 'STUDENT' ? 'STUDENT' : 'INSTRUCTOR'
      
      user = await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email || email,
          name: metadata.name || email,
          role: userRole,
          phone: metadata.phone,
          bio: metadata.bio,
        },
        include: {
          studentProfile: true,
          instructorProfile: true,
        },
      })
      
      console.log('用户记录已创建:', user)
    }

    if (!user) {
      throw new Error('ユーザープロフィールの取得に失敗しました')
    }

    console.log('登录成功，用户信息:', user)
    return { session: data.session, user: data.user, profile: user }
  } catch (error) {
    console.error('登录错误:', error)
    throw error
  }
}

/**
 * 用户登出
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('登出错误，但仍尝试清理缓存', error)
    }

    // 清理客户端存储
    if (isBrowser) {
      localStorage.removeItem('userProfile')
      sessionStorage.clear()
    }
    console.log('登出成功，所有缓存已清理')
  } catch (error) {
    console.error('登出错误:', error)
    throw error
  }
}

/**
 * 获取当前用户
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('获取当前用户错误:', error)
    return null
  }
}

/**
 * 获取用户资料（包含详细信息）
 * @param userId 用户ID
 */
export async function getProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        instructorProfile: true,
      },
    })

    if (!user) {
      console.error('未找到用户资料')
      return null
    }

    return user
  } catch (error) {
    console.error('获取用户资料错误:', error)
    return null
  }
}

/**
 * 更新用户基本信息
 * @param userId 用户ID
 * @param updates 更新数据
 */
export async function updateUser(
  userId: string,
  updates: {
    name?: string
    phone?: string
    avatarUrl?: string
    bio?: string
  }
) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
    })
    return user
  } catch (error) {
    console.error('更新用户信息错误:', error)
    throw error
  }
}

/**
 * 更新学生资料
 * @param userId 用户ID
 * @param updates 更新数据
 */
export async function updateStudentProfile(
  userId: string,
  updates: {
    university?: string
    major?: string
    graduationYear?: number
    skills?: string[]
    languages?: string[]
    resumeUrl?: string
    preferredLocations?: string[]
    expectedSalary?: number
    formerSalary?: number
    availableStartDate?: Date
  }
) {
  try {
    const profile = await prisma.studentProfile.update({
      where: { userId },
      data: updates,
    })
    return profile
  } catch (error) {
    console.error('更新学生资料错误:', error)
    throw error
  }
}

/**
 * 更新讲师资料
 * @param userId 用户ID
 * @param updates 更新数据
 */
export async function updateInstructorProfile(
  userId: string,
  updates: {
    nationality?: string
    experience?: number
    educationBackground?: string
    introduction?: string
    resumePdfUrl?: string
  }
) {
  try {
    const profile = await prisma.instructorProfile.update({
      where: { userId },
      data: updates,
    })
    return profile
  } catch (error) {
    console.error('更新讲师资料错误:', error)
    throw error
  }
}

