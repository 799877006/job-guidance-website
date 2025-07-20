// Dashboard页面使用的类型定义

// 统计信息
export interface DashboardStats {
  applied: number
  rejected: number
  accepted: number
  pending: number
}

// 指导老师信息
export interface Instructor {
  id: string
  full_name: string
  avatar_url: string | null
}

// 预约事件基础类型
interface BaseEvent {
  id: string
  date: string
  time: string
  title: string
  status: string
}

// 面试预约事件
export interface InterviewEvent extends BaseEvent {
  type: 'interview'
}

// 指导预约事件
export interface MentoringEvent extends BaseEvent {
  type: 'mentoring'
  instructor: Instructor
}

// 预约事件联合类型
export type UpcomingEvent = InterviewEvent | MentoringEvent

// 判断事件类型的类型守卫
export function isMentoringEvent(event: UpcomingEvent): event is MentoringEvent {
  return event.type === 'mentoring'
}

export function isInterviewEvent(event: UpcomingEvent): event is InterviewEvent {
  return event.type === 'interview'
}

// 状态配置类型
interface StatusConfig {
  label: string
  variant: 'default' | 'secondary' | 'outline'
  className?: string
}

// 获取事件状态显示配置
export function getEventStatusConfig(event: UpcomingEvent): StatusConfig {
  const statusConfigs: Record<string, StatusConfig> = {
    scheduled: { label: '確定', variant: 'default' },
    confirmed: { label: '確定', variant: 'default' },
    pending: { label: '確認待ち', variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
    completed: { label: '完了', variant: 'outline' },
    cancelled: { label: 'キャンセル', variant: 'outline' }
  }

  const status = event.status.toLowerCase()
  return statusConfigs[status] || { label: event.status, variant: 'outline' }
} 