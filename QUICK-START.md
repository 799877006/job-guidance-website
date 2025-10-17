# 🚀 Prisma 数据库重构 - 快速开始

## ⚡ 5 分钟快速开始

### 1️⃣ 确认环境配置

检查 `.env` 文件中的数据库连接：

```bash
# .env
DATABASE_URL="postgresql://postgres.xxx:xxx@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2️⃣ 初始化数据库（如果还未创建）

```bash
# 推送 Prisma schema 到数据库
pnpm prisma:push

# 生成 Prisma Client
pnpm prisma:generate
```

### 3️⃣ （可选）迁移旧数据

如果您有旧数据需要迁移：

```bash
# 执行数据迁移脚本
psql $DATABASE_URL -f scripts/migrate-data-to-prisma.sql
```

### 4️⃣ 在代码中使用新服务

#### 示例 1: 用户登录

```typescript
// app/login/page.tsx
'use client'

import { signIn } from '@/lib/services/prisma-index'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = async (email: string, password: string) => {
    try {
      const { session, profile } = await signIn(email, password)
      console.log('登录成功:', profile)
      router.push('/dashboard')
    } catch (error) {
      alert('ログインに失敗しました')
    }
  }

  // ... rest of component
}
```

#### 示例 2: 获取申请列表

```typescript
// app/applications/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { getApplications } from '@/lib/services/prisma-index'
import type { ApplicationWithDetails } from '@/lib/types/prisma-types'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    const data = await getApplications()
    setApplications(data)
  }

  return (
    <div>
      {applications.map(app => (
        <div key={app.id}>
          <h3>{app.company.name}</h3>
          <p>{app.company.position}</p>
          <p>状態: {app.status}</p>
        </div>
      ))}
    </div>
  )
}
```

#### 示例 3: 创建新申请

```typescript
import { createApplication } from '@/lib/services/prisma-index'

const handleSubmit = async (formData: any) => {
  try {
    const application = await createApplication({
      companyId: formData.companyId,
      status: 'DOCUMENT_SCREENING',
      appliedAt: new Date(),
      annualSalary: formData.annualSalary,
      benefits: formData.benefits || [],
      location: formData.location,
    })
    
    alert('申請を作成しました')
  } catch (error) {
    console.error('Error:', error)
    alert('エラーが発生しました')
  }
}
```

### 5️⃣ 查看数据（Prisma Studio）

```bash
# 打开 Prisma Studio 浏览数据
pnpm prisma:studio
```

这将在浏览器中打开一个可视化的数据库管理界面。

## 📚 详细文档

### 完整指南
- **[PRISMA-MIGRATION-GUIDE.md](./PRISMA-MIGRATION-GUIDE.md)** - 完整的 Prisma 使用指南
- **[FRONTEND-UPDATE-EXAMPLES.md](./FRONTEND-UPDATE-EXAMPLES.md)** - 前端组件更新示例
- **[REFACTOR-SUMMARY.md](./REFACTOR-SUMMARY.md)** - 重构总结

### 常用命令

```bash
# 验证 Prisma schema
pnpm prisma:validate

# 生成 Prisma Client
pnpm prisma:generate

# 推送 schema 到数据库
pnpm prisma:push

# 打开 Prisma Studio
pnpm prisma:studio

# 启动开发服务器
pnpm dev
```

## 🎯 可用的服务 API

### 认证服务
```typescript
import { 
  signUp,           // 用户注册
  signIn,           // 用户登录
  signOut,          // 用户登出
  getProfile,       // 获取用户资料
  updateUser,       // 更新用户信息
} from '@/lib/services/prisma-index'
```

### 申请服务
```typescript
import { 
  getApplications,          // 获取所有申请
  getApplicationById,       // 获取单个申请
  createApplication,        // 创建申请
  updateApplication,        // 更新申请
  getApplicationCounts,     // 获取统计数据
} from '@/lib/services/prisma-index'
```

### 日程服务
```typescript
import { 
  getSchedules,             // 获取日程
  createSchedule,           // 创建日程
  updateSchedule,           // 更新日程
  createInterview,          // 创建面试
  syncInterviewToSchedule,  // 同步面试到日程
} from '@/lib/services/prisma-index'
```

### 通知服务
```typescript
import { 
  getNotifications,         // 获取通知
  getUnreadNotificationCount, // 未读数量
  markNotificationAsRead,   // 标记已读
} from '@/lib/services/prisma-index'
```

## 🎨 类型系统

所有类型都有完整的 TypeScript 支持：

```typescript
import type { 
  // 数据模型类型
  UserWithProfile,
  ApplicationWithDetails,
  ScheduleWithDetails,
  
  // 表单输入类型
  ApplicationCreateInput,
  ScheduleCreateInput,
  
  // 枚举类型
  ApplicationStatus,
  UserRole,
  ScheduleStatus,
} from '@/lib/types/prisma-types'
```

## ⚠️ 重要提示

### 字段命名
- **代码中**: 使用 camelCase（如 `studentId`, `appliedAt`）
- **数据库**: 自动映射为 snake_case（如 `student_id`, `applied_at`）

### 状态枚举
新的状态值都是大写：
```typescript
// ✅ 正确
status: 'DOCUMENT_SCREENING'
status: 'OFFER_RECEIVED'

// ❌ 错误（旧的格式）
status: 'applied'
status: 'accepted'
```

### 角色枚举
```typescript
// ✅ 正确
role: 'STUDENT'
role: 'INSTRUCTOR'
role: 'ADMINISTRATOR'

// ❌ 错误
role: 'student'
role: 'instructor'
```

## 🔍 调试技巧

### 1. 查看生成的 SQL
修改 `lib/prisma.ts`：

```typescript
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'], // 启用查询日志
})
```

### 2. 使用 Prisma Studio
```bash
pnpm prisma:studio
```

### 3. 检查数据库连接
```typescript
import { prisma } from '@/lib/prisma'

// 测试连接
const testConnection = async () => {
  try {
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
  }
}
```

## 🎓 学习资源

### 推荐阅读顺序
1. 本文档（快速开始）
2. `PRISMA-MIGRATION-GUIDE.md`（完整使用指南）
3. `FRONTEND-UPDATE-EXAMPLES.md`（实际代码示例）
4. [Prisma 官方文档](https://www.prisma.io/docs)

### 外部资源
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma 最佳实践](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js + Prisma 集成](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

## 💬 获取帮助

### 常见问题
查看 `PRISMA-MIGRATION-GUIDE.md` 的"常见问题"部分

### 错误排查
1. 检查 `.env` 文件配置
2. 确认数据库连接正常
3. 查看控制台错误信息
4. 启用 Prisma 日志查看 SQL

### 示例代码
查看 `FRONTEND-UPDATE-EXAMPLES.md` 获取更多实际示例

---

**准备好了吗？开始使用新的 Prisma 架构吧！** 🚀

如有问题，请参考详细文档或提交 Issue。

