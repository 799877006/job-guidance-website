# Prisma 数据库重构完成指南

## 📋 重构概览

本项目已成功从直接使用 Supabase JS 客户端迁移到使用 Prisma ORM。这带来了以下优势：

- ✅ **类型安全**：完全的 TypeScript 类型支持
- ✅ **更好的开发体验**：自动补全和类型检查
- ✅ **统一的 API**：一致的数据库操作接口
- ✅ **易于维护**：清晰的数据模型和关系
- ✅ **迁移管理**：版本化的数据库模式变更

## 🗂️ 新的项目结构

```
lib/
├── prisma.ts                    # Prisma Client 实例
├── types/
│   └── prisma-types.ts         # 类型定义
└── services/
    ├── prisma-auth.ts          # 认证服务
    ├── prisma-application.ts   # 申请管理
    ├── prisma-schedule.ts      # 日程和面试
    ├── prisma-notification.ts  # 通知管理
    ├── prisma-feedback.ts      # 反馈管理
    └── prisma-index.ts         # 统一导出
```

## 📦 数据库结构

### 核心表

1. **users** - 用户基础信息
   - id, email, name, role, phone, avatarUrl, bio
   - 关系：studentProfile, instructorProfile, applications, schedules, notifications

2. **student_profiles** - 学生详细资料
   - 教育背景、技能、求职偏好等

3. **instructor_profiles** - 讲师详细资料
   - 国籍、经验、教育背景等

4. **companies** - 公司信息
   - 公司名称、职位、描述、福利等

5. **applications** - 求职申请
   - 申请状态、面试时间、薪资福利等
   - 关系：student, company, interviews, schedules

6. **interviews** - 面试记录
   - 面试类型、时间、状态等

7. **schedules** - 日程安排
   - 面试、辅导、其他日程

8. **notifications** - 通知消息
   - 各类系统通知

9. **feedback** - 用户反馈
   - 反馈类别、内容、状态

## 🚀 使用方法

### 1. 导入服务

```typescript
// 方式 1：导入所有服务
import * as PrismaService from '@/lib/services/prisma-index'

// 方式 2：按需导入
import { 
  signIn, 
  signUp, 
  getApplications,
  createSchedule 
} from '@/lib/services/prisma-index'

// 方式 3：直接导入特定服务
import { signIn, signUp } from '@/lib/services/prisma-auth'
```

### 2. 使用类型

```typescript
import type { 
  UserWithProfile,
  ApplicationWithDetails,
  ScheduleWithDetails,
  ApplicationStatus,
  UserRole
} from '@/lib/types/prisma-types'

// 使用类型
const user: UserWithProfile = await getProfile(userId)
const apps: ApplicationWithDetails[] = await getApplications()
```

### 3. 认证示例

```typescript
// 用户注册
const result = await signUp(email, password, {
  name: '山田太郎',
  role: 'STUDENT',
  phone: '090-1234-5678',
  bio: '就活中です'
})

// 用户登录
const { session, user, profile } = await signIn(email, password)

// 获取用户资料
const profile = await getProfile(userId)

// 更新用户信息
await updateUser(userId, {
  name: '新しい名前',
  bio: '更新した自己紹介'
})
```

### 4. 申请管理示例

```typescript
// 创建申请
const application = await createApplication({
  companyId: 'company-uuid',
  status: 'DOCUMENT_SCREENING',
  appliedAt: new Date(),
  firstInterviewAt: new Date('2024-12-01'),
  annualSalary: 5000000,
  benefits: ['交通費支給', '社会保険完備'],
  location: '東京都渋谷区'
})

// 获取所有申请
const applications = await getApplications()

// 更新申请状态
await updateApplication(applicationId, {
  status: 'FIRST_INTERVIEW_COMPLETED',
  notes: '面接は順調でした'
})

// 获取申请统计
const stats = await getApplicationCounts()
// { total: 10, failed: 2, passed: 3, inProgress: 5 }
```

### 5. 日程管理示例

```typescript
// 创建日程
const schedule = await createSchedule({
  title: 'ABC株式会社 - 一次面接',
  startTime: new Date('2024-12-01 10:00'),
  endTime: new Date('2024-12-01 11:00'),
  status: 'SCHEDULED',
  type: 'INTERVIEW',
  applicationId: 'app-uuid',
  companyName: 'ABC株式会社',
  notes: 'オンライン面接'
})

// 获取日程
const schedules = await getSchedules()

// 创建面试并自动同步到日程
const interview = await createInterview({
  applicationId: 'app-uuid',
  startTime: new Date('2024-12-01 10:00'),
  endTime: new Date('2024-12-01 11:00'),
  status: 'SCHEDULED',
  type: 'FIRST',
  notes: '一次面接'
})
await syncInterviewToSchedule(interview.id)
```

### 6. 通知管理示例

```typescript
// 获取未读通知
const notifications = await getNotifications('UNREAD')

// 获取未读数量
const count = await getUnreadNotificationCount()

// 标记为已读
await markNotificationAsRead(notificationId)

// 创建通知
await notifyScheduleCreated(userId, '面接予約')
await notifyMentoringRequest(instructorId, '学生名', '面接指導')
```

## 🔄 数据迁移

如果您有旧数据需要迁移，请执行以下步骤：

```bash
# 1. 确保新数据库结构已创建
pnpm prisma:push

# 2. 执行数据迁移脚本
psql $DATABASE_URL -f scripts/migrate-data-to-prisma.sql

# 3. 验证迁移结果
pnpm prisma:studio
```

## 🔧 开发命令

```bash
# 验证 Prisma schema
pnpm prisma:validate

# 生成 Prisma Client
pnpm prisma:generate

# 推送 schema 到数据库（开发环境）
pnpm prisma:push

# 打开 Prisma Studio（数据库 GUI）
pnpm prisma:studio

# 创建迁移（生产环境推荐）
pnpm prisma:migrate

# 部署迁移（生产环境）
pnpm prisma:migrate:deploy
```

## 📝 代码迁移示例

### 旧代码（Supabase 直接查询）

```typescript
// ❌ 旧的方式
const { data, error } = await supabase
  .from('applications')
  .select('*, companies(*)')
  .eq('user_id', userId)

if (error) throw error
```

### 新代码（Prisma）

```typescript
// ✅ 新的方式
const applications = await prisma.application.findMany({
  where: { studentId: userId },
  include: { company: true }
})
```

## 🎯 注意事项

### 1. 字段命名

- Prisma schema 使用 **camelCase**（如 `studentId`）
- 数据库列使用 **snake_case**（如 `student_id`）
- Prisma 会自动处理转换

### 2. 枚举类型

```typescript
// 使用 Prisma 生成的枚举
import { ApplicationStatus, UserRole } from '@/lib/types/prisma-types'

const status: ApplicationStatus = 'DOCUMENT_SCREENING' // ✅
const role: UserRole = 'STUDENT' // ✅
```

### 3. 关系查询

```typescript
// 包含关联数据
const application = await prisma.application.findUnique({
  where: { id: applicationId },
  include: {
    company: true,      // 包含公司信息
    interviews: true,   // 包含所有面试
    student: {          // 包含学生的部分信息
      select: {
        name: true,
        email: true
      }
    }
  }
})
```

### 4. 错误处理

```typescript
try {
  const result = await someOperation()
  return result
} catch (error) {
  console.error('操作失败:', error)
  throw new Error('操作失败，请重试')
}
```

## 🔍 调试技巧

### 1. 查看生成的 SQL

在 `lib/prisma.ts` 中启用日志：

```typescript
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})
```

### 2. 使用 Prisma Studio

```bash
pnpm prisma:studio
```

在浏览器中可视化和编辑数据。

## 📚 更多资源

- [Prisma 官方文档](https://www.prisma.io/docs)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [TypeScript 类型参考](https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety)

## 🆘 常见问题

### Q: 如何添加新字段？

1. 修改 `prisma/schema.prisma`
2. 运行 `pnpm prisma:push`
3. 重新生成类型 `pnpm prisma:generate`

### Q: 如何处理复杂查询？

使用 Prisma 的高级查询功能：

```typescript
// 复杂过滤
const applications = await prisma.application.findMany({
  where: {
    AND: [
      { status: 'OFFER_RECEIVED' },
      { annualSalary: { gte: 5000000 } }
    ]
  },
  orderBy: { appliedAt: 'desc' },
  take: 10
})

// 聚合查询
const stats = await prisma.application.groupBy({
  by: ['status'],
  _count: true
})
```

### Q: 性能优化？

1. 使用 `select` 只获取需要的字段
2. 合理使用 `include` 避免 N+1 问题
3. 添加数据库索引
4. 使用连接池（Prisma 默认开启）

---

**重构完成时间**: 2024-10-17  
**Prisma 版本**: 6.17.1  
**数据库**: PostgreSQL (Supabase)

