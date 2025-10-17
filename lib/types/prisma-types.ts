// 基于 Prisma 的类型定义
// 导出 Prisma 生成的类型和自定义的扩展类型

import type { Prisma } from '@prisma/client'

// ========== 用户相关类型 ==========

// 用户完整信息（包含 profile）
export type UserWithProfile = Prisma.UserGetPayload<{
  include: {
    studentProfile: true
    instructorProfile: true
  }
}>

// 学生完整信息
export type StudentWithProfile = Prisma.UserGetPayload<{
  include: {
    studentProfile: true
  }
}>

// 讲师完整信息
export type InstructorWithProfile = Prisma.UserGetPayload<{
  include: {
    instructorProfile: true
  }
}>

// ========== 申请相关类型 ==========

// 申请完整信息（包含公司和面试）
export type ApplicationWithDetails = Prisma.ApplicationGetPayload<{
  include: {
    company: true
    interviews: true
    schedules: true
  }
}>

// 申请简单信息（只包含公司）
export type ApplicationWithCompany = Prisma.ApplicationGetPayload<{
  include: {
    company: true
  }
}>

// 申请列表项
export type ApplicationListItem = Prisma.ApplicationGetPayload<{
  include: {
    company: {
      select: {
        id: true
        name: true
        position: true
        location: true
      }
    }
  }
}>

// ========== 日程相关类型 ==========

// 日程完整信息
export type ScheduleWithDetails = Prisma.ScheduleGetPayload<{
  include: {
    application: {
      include: {
        company: true
      }
    }
  }
}>

// 面试完整信息
export type InterviewWithDetails = Prisma.InterviewGetPayload<{
  include: {
    application: {
      include: {
        company: true
      }
    }
  }
}>

// ========== 通知相关类型 ==========

// 通知基本类型
export type NotificationItem = Prisma.NotificationGetPayload<{}>

// ========== 反馈相关类型 ==========

// 反馈完整信息（包含用户）
export type FeedbackWithUser = Prisma.FeedbackGetPayload<{
  include: {
    user: {
      select: {
        id: true
        name: true
        email: true
        role: true
      }
    }
  }
}>

// ========== 公司相关类型 ==========

// 公司基本信息
export type CompanyBasic = Prisma.CompanyGetPayload<{}>

// 公司详细信息（包含申请数量）
export type CompanyWithApplicationCount = Prisma.CompanyGetPayload<{
  include: {
    applications: {
      select: {
        id: true
        status: true
      }
    }
  }
}>

// ========== 表单输入类型 ==========

// 用户注册输入
export type SignUpInput = {
  email: string
  password: string
  name: string
  role: 'STUDENT' | 'INSTRUCTOR'
  phone?: string
  bio?: string
}

// 学生资料输入
export type StudentProfileInput = {
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

// 讲师资料输入
export type InstructorProfileInput = {
  nationality: string
  experience?: number
  educationBackground?: string
  introduction?: string
  resumePdfUrl?: string
}

// 申请创建输入
export type ApplicationCreateInput = {
  companyId: string
  status: Prisma.ApplicationStatus
  appliedAt: Date
  casualInterviewAt?: Date
  casualInterviewEnd?: Date
  firstInterviewAt?: Date
  secondInterviewAt?: Date
  finalInterviewAt?: Date
  firstInterviewEnd?: Date
  secondInterviewEnd?: Date
  finalInterviewEnd?: Date
  offerReceivedAt?: Date
  annualSalary?: number
  monthlySalary?: number
  benefits?: string[]
  location?: string
  workHours?: string
  otherConditions?: string
}

// 申请更新输入
export type ApplicationUpdateInput = Partial<ApplicationCreateInput>

// 日程创建输入
export type ScheduleCreateInput = {
  title: string
  startTime: Date
  endTime: Date
  status: Prisma.ScheduleStatus
  type: Prisma.ScheduleType
  applicationId?: string
  companyName?: string
  instructorId?: string
  notes?: string
  mentoringType?: Prisma.MentoringType
  availableSlots?: number
  bookedSlots?: number
  onlineUrl?: string
}

// 日程更新输入
export type ScheduleUpdateInput = Partial<ScheduleCreateInput>

// 面试创建输入
export type InterviewCreateInput = {
  applicationId: string
  startTime: Date
  endTime: Date
  status: Prisma.InterviewStatus
  type: Prisma.InterviewType
  notes?: string
}

// 面试更新输入
export type InterviewUpdateInput = Partial<Omit<InterviewCreateInput, 'applicationId'>>

// 通知创建输入
export type NotificationCreateInput = {
  userId: string
  type: Prisma.NotificationType
  title: string
  content: string
  metadata?: Record<string, any>
}

// 反馈提交输入
export type FeedbackSubmitInput = {
  name: string
  email: string
  category: string
  subject: string
  message: string
}

// 公司创建/更新输入
export type CompanyInput = {
  id?: string
  name: string
  position: string
  description?: string
  location: string
  benefits?: string[]
  workHours: string
}

// ========== API 响应类型 ==========

// 通用成功响应
export type SuccessResponse<T = any> = {
  success: true
  data: T
  message?: string
}

// 通用错误响应
export type ErrorResponse = {
  success: false
  error: string
  message: string
  code?: string
}

// API 响应类型
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

// ========== 统计类型 ==========

// 申请统计
export type ApplicationStats = {
  total: number
  failed: number
  passed: number
  inProgress: number
}

// 反馈统计
export type FeedbackStats = {
  total: number
  pending: number
  sent: number
  failed: number
  byCategory: Array<{
    category: string
    count: number
  }>
}

// ========== 枚举类型导出 ==========

export { 
  UserRole, 
  RegisterRole,
  ApplicationStatus, 
  ScheduleStatus, 
  ScheduleType, 
  InterviewStatus, 
  InterviewType,
  MentoringType,
  NotificationType,
  NotificationStatus,
} from '@prisma/client'

