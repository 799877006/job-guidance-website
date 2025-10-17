# 前端组件更新示例

本文档展示如何将现有的前端组件从旧的 Supabase 直接查询迁移到新的 Prisma 服务。

## 📝 更新步骤

### 1. 更新导入语句

#### 旧代码
```typescript
import { supabase } from '@/lib/services/supabase'
import type { Application } from '@/lib/types/supabase'
```

#### 新代码
```typescript
import { 
  getApplications, 
  createApplication,
  updateApplication 
} from '@/lib/services/prisma-index'
import type { 
  ApplicationWithDetails,
  ApplicationStatus 
} from '@/lib/types/prisma-types'
```

### 2. 登录页面更新

#### 旧代码 (app/login/page.tsx)
```typescript
'use client'

import { useState } from 'react'
import { signIn } from '@/lib/services/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      alert('ログインに失敗しました')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

#### 新代码
```typescript
'use client'

import { useState } from 'react'
import { signIn } from '@/lib/services/prisma-index' // ✅ 使用新的服务
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { session, profile } = await signIn(email, password) // ✅ 获取 profile
      console.log('User profile:', profile) // ✅ 可以直接使用 profile
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      alert('ログインに失敗しました')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### 3. 申请列表页面更新

#### 旧代码 (app/applications/page.tsx)
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/services/supabase'
import type { Application } from '@/lib/types/supabase'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, companies(*)')
        .order('applied_date', { ascending: false })
      
      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <ul>
          {applications.map(app => (
            <li key={app.id}>{app.companies?.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

#### 新代码
```typescript
'use client'

import { useEffect, useState } from 'react'
import { getApplications } from '@/lib/services/prisma-index' // ✅ 使用新服务
import type { ApplicationWithDetails } from '@/lib/types/prisma-types' // ✅ 使用新类型

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const data = await getApplications() // ✅ 简洁的 API
      setApplications(data)
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <ul>
          {applications.map(app => (
            <li key={app.id}>
              {app.company.name} - {app.company.position} {/* ✅ 类型安全 */}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### 4. 创建申请表单更新

#### 旧代码
```typescript
const handleSubmit = async (formData: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('applications')
      .insert([{
        user_id: user.id,
        company_id: formData.companyId,
        position: formData.position,
        status: 'applied',
        applied_date: new Date().toISOString(),
        notes: formData.notes
      }])
      .select()
      .single()

    if (error) throw error
    
    alert('申請を作成しました')
    router.push('/applications')
  } catch (error) {
    console.error('Error creating application:', error)
    alert('エラーが発生しました')
  }
}
```

#### 新代码
```typescript
import { createApplication } from '@/lib/services/prisma-index'

const handleSubmit = async (formData: any) => {
  try {
    const application = await createApplication({
      companyId: formData.companyId,
      status: 'DOCUMENT_SCREENING', // ✅ 使用枚举类型
      appliedAt: new Date(),
      annualSalary: formData.annualSalary,
      benefits: formData.benefits || [],
      location: formData.location,
      workHours: formData.workHours,
    })
    
    alert('申請を作成しました')
    router.push('/applications')
  } catch (error) {
    console.error('Error creating application:', error)
    alert('エラーが発生しました')
  }
}
```

### 5. 用户资料页面更新

#### 旧代码
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/services/supabase'
import { getCurrentUser, getProfile, updateProfile } from '@/lib/services/auth'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('未登录')
      
      const profileData = await getProfile(user.id)
      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (updates: any) => {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('未登录')
      
      await updateProfile(user.id, updates)
      alert('プロフィールを更新しました')
      loadProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('更新に失敗しました')
    }
  }

  // ... rest of component
}
```

#### 新代码
```typescript
'use client'

import { useEffect, useState } from 'react'
import { 
  getCurrentUser, 
  getProfile, 
  updateUser,
  updateStudentProfile 
} from '@/lib/services/prisma-index' // ✅ 统一导入
import type { UserWithProfile } from '@/lib/types/prisma-types' // ✅ 类型安全

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserWithProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('未登录')
      
      const profileData = await getProfile(user.id)
      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBasicInfo = async (updates: {
    name?: string
    phone?: string
    bio?: string
  }) => {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('未登录')
      
      await updateUser(user.id, updates) // ✅ 更新基本信息
      alert('プロフィールを更新しました')
      loadProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('更新に失敗しました')
    }
  }

  const handleUpdateStudentInfo = async (updates: {
    university?: string
    major?: string
    skills?: string[]
  }) => {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('未登録')
      
      await updateStudentProfile(user.id, updates) // ✅ 更新学生资料
      alert('学生プロフィールを更新しました')
      loadProfile()
    } catch (error) {
      console.error('Error updating student profile:', error)
      alert('更新に失敗しました')
    }
  }

  if (loading) return <div>読み込み中...</div>
  if (!profile) return <div>プロフィールが見つかりません</div>

  return (
    <div>
      <h1>{profile.name}</h1>
      <p>{profile.email}</p>
      
      {/* ✅ 类型安全的条件渲染 */}
      {profile.role === 'STUDENT' && profile.studentProfile && (
        <div>
          <h2>学生情報</h2>
          <p>大学: {profile.studentProfile.university}</p>
          <p>専攻: {profile.studentProfile.major}</p>
          <p>卒業年: {profile.studentProfile.graduationYear}</p>
        </div>
      )}
      
      {profile.role === 'INSTRUCTOR' && profile.instructorProfile && (
        <div>
          <h2>講師情報</h2>
          <p>国籍: {profile.instructorProfile.nationality}</p>
          <p>経験: {profile.instructorProfile.experience}年</p>
        </div>
      )}
    </div>
  )
}
```

### 6. 日程管理页面更新

#### 新代码示例
```typescript
'use client'

import { useEffect, useState } from 'react'
import { 
  getSchedules, 
  createSchedule,
  updateSchedule 
} from '@/lib/services/prisma-index'
import type { 
  ScheduleWithDetails,
  ScheduleCreateInput 
} from '@/lib/types/prisma-types'

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    try {
      const data = await getSchedules()
      setSchedules(data)
    } catch (error) {
      console.error('Error loading schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchedule = async (input: ScheduleCreateInput) => {
    try {
      await createSchedule(input)
      alert('予約を作成しました')
      loadSchedules()
    } catch (error) {
      console.error('Error creating schedule:', error)
      alert('作成に失敗しました')
    }
  }

  const handleUpdateStatus = async (
    scheduleId: string, 
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  ) => {
    try {
      await updateSchedule(scheduleId, { status })
      loadSchedules()
    } catch (error) {
      console.error('Error updating schedule:', error)
    }
  }

  return (
    <div>
      <h1>日程管理</h1>
      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <ul>
          {schedules.map(schedule => (
            <li key={schedule.id}>
              <h3>{schedule.title}</h3>
              <p>
                {new Date(schedule.startTime).toLocaleString('ja-JP')}
                {' - '}
                {new Date(schedule.endTime).toLocaleString('ja-JP')}
              </p>
              <p>状態: {schedule.status}</p>
              
              {/* ✅ 类型安全的关联数据访问 */}
              {schedule.application && (
                <p>企業: {schedule.application.company.name}</p>
              )}
              
              <button 
                onClick={() => handleUpdateStatus(schedule.id, 'COMPLETED')}
              >
                完了にする
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

## 🎯 迁移检查清单

### 每个页面都需要：

- [ ] 更新导入语句，使用新的 Prisma 服务
- [ ] 更新类型定义，使用 Prisma 生成的类型
- [ ] 移除直接的 Supabase 查询
- [ ] 更新字段名（snake_case → camelCase）
- [ ] 更新状态枚举值（小写 → 大写）
- [ ] 添加适当的错误处理
- [ ] 测试所有功能是否正常工作

### 常见替换：

| 旧代码 | 新代码 |
|--------|--------|
| `user_id` | `studentId` 或 `userId` |
| `company_id` | `companyId` |
| `applied_date` | `appliedAt` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `'applied'` | `'DOCUMENT_SCREENING'` |
| `'rejected'` | `'REJECTED'` |
| `'accepted'` | `'OFFER_RECEIVED'` |

## 🧪 测试建议

### 1. 单元测试
```typescript
import { getApplications } from '@/lib/services/prisma-index'

describe('Applications Service', () => {
  it('should fetch all applications', async () => {
    const applications = await getApplications()
    expect(Array.isArray(applications)).toBe(true)
  })
})
```

### 2. 集成测试
- 测试完整的用户流程
- 测试数据创建、读取、更新、删除
- 测试错误处理

### 3. E2E 测试
- 使用 Playwright 或 Cypress
- 测试真实的用户交互

## 📚 相关文档

- [PRISMA-MIGRATION-GUIDE.md](./PRISMA-MIGRATION-GUIDE.md) - Prisma 迁移指南
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**更新日期**: 2024-10-17

