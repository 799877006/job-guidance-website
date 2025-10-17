// Dashboard页面使用的类型定义

export interface DashboardStats {
  total: number;
  rejected: number;
  accepted: number;
  pending: number;
}

export interface UpcomingEvent {
  id: string;
  type: 'interview' | 'mentoring';
  date: string;
  time: string;
  title: string;
  status: string;
  instructor?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export function getEventStatusConfig(event: UpcomingEvent) {
  if (event.type === 'interview') {
    return {
      variant: 'default',
      className: '',
      label: '面接'
    };
  } else {
    return {
      variant: event.status === 'pending' ? 'secondary' : 'default',
      className: '',
      label: event.status === 'pending' ? '承認待ち' : '確定'
    };
  }
} 