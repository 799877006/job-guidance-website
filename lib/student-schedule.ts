import { supabase } from './supabase'

export type ScheduleType = 'free' | 'busy' | 'class' | 'interview' | 'other' | 'mentoring'

export interface StudentSchedule {
  id: string
  student_id: string
  date: string
  start_time: string
  end_time: string
  schedule_type: ScheduleType
  title: string
  description?: string
  location?: string
  color: string
  application_id?: string | null;
  created_at: string
  updated_at: string
}

export interface CreateScheduleData {
  student_id: string
  date: string
  start_time: string
  end_time: string
  schedule_type: ScheduleType
  title: string
  description?: string
  location?: string
  color?: string
}

// 获取学生指定日期范围内的时间表
export async function getStudentSchedule(
  studentId: string, 
  startDate: string, 
  endDate: string
): Promise<StudentSchedule[]> {
  const { data, error } = await supabase
    .from('student_schedule')
    .select('*')
    .eq('student_id', studentId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching student schedule:', error)
    throw new Error(`时间表获取失败: ${error.message}`)
  }

  return data || []
}

// 创建新的时间安排
export async function createSchedule(scheduleData: CreateScheduleData): Promise<StudentSchedule> {
  // 检查时间冲突
    console.log('scheduleData', scheduleData)
    const conflicts = await checkTimeConflict(
      scheduleData.student_id,
      scheduleData.date,
      scheduleData.start_time,
      scheduleData.end_time
    )
    if (conflicts.length > 0) {
      for (const conflict of conflicts) {
        if (conflict.schedule_type !== 'free') {
          throw new Error('選択した時間には既にスケジュールが入っています')
        }
      }
    }

  const { data, error } = await supabase
    .from('student_schedule')
    .insert([scheduleData])
    .select()
    .single()
  if (error) {
    console.error('Error creating schedule:', error)
    throw new Error(`スケジュール作成失敗: ${error.message}`)
  }
  return data as StudentSchedule
}

// 更新时间安排
export async function updateSchedule(
  scheduleId: string, 
  updateData: Partial<CreateScheduleData>
): Promise<StudentSchedule> {
  // 如果更新了时间，需要检查冲突
  if (updateData.date || updateData.start_time || updateData.end_time) {
    // 获取当前记录
    const { data: currentSchedule } = await supabase
      .from('student_schedule')
      .select('*')
      .eq('id', scheduleId)
      .single()

      const conflicts = await checkTimeConflict(
        currentSchedule.student_id,
        updateData.date || currentSchedule.date,
        updateData.start_time || currentSchedule.start_time,
        updateData.end_time || currentSchedule.end_time,
        scheduleId // 排除当前记录
      )

      if (conflicts.length > 0) {
        for (const conflict of conflicts) {
          if (conflict.schedule_type !== 'free') {
            throw new Error('選択した時間には既にスケジュールが入っています')
          }
        }
      }
    }
  

  const { data, error } = await supabase
    .from('student_schedule')
    .update(updateData)
    .eq('id', scheduleId)
    .select()
    .single()

  if (error) {
    console.error('Error updating schedule:', error)
    throw new Error(`スケジュール更新失敗: ${error.message}`)
  }

  return data as StudentSchedule
}

// 删除时间安排
export async function deleteSchedule(scheduleId: string): Promise<void> {
  const { error } = await supabase
    .from('student_schedule')
    .delete()
    .eq('id', scheduleId)

  if (error) {
    console.error('Error deleting schedule:', error)
    throw new Error(`スケジュール削除失敗: ${error.message}`)
  }
}

// 检查时间冲突
export async function checkTimeConflict(
  studentId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<StudentSchedule[]> {
  let query = supabase
    .from('student_schedule')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', date)
    .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error checking time conflict:', error)
    throw new Error(`時間重複チェック失敗: ${error.message}`)
  }

  return data || []
}

// 获取学生某天的空闲时间段
export async function getAvailableTimeSlots(
  studentId: string,
  date: string,
  slotDuration: number = 60 // 默认60分钟时间段
): Promise<{ start_time: string; end_time: string }[]> {
  // 获取当天所有忙碌时间
  const busySlots = await supabase
    .from('student_schedule')
    .select('start_time, end_time')
    .eq('student_id', studentId)
    .eq('date', date)
    .in('schedule_type', ['busy', 'class', 'interview'])
    .order('start_time', { ascending: true })

  if (busySlots.error) {
    throw new Error(`空き時間取得失敗: ${busySlots.error.message}`)
  }

  // 计算空闲时间段
  const availableSlots: { start_time: string; end_time: string }[] = []
  const workingHours = { start: '09:00', end: '18:00' } // 默认工作时间
  
  let currentTime = workingHours.start
  const busyTimes = busySlots.data || []

  for (const busySlot of busyTimes) {
    if (currentTime < busySlot.start_time) {
      // 有空闲时间
      const timeDiff = getTimeDifferenceInMinutes(currentTime, busySlot.start_time)
      if (timeDiff >= slotDuration) {
        availableSlots.push({
          start_time: currentTime,
          end_time: busySlot.start_time
        })
      }
    }
    currentTime = busySlot.end_time > currentTime ? busySlot.end_time : currentTime
  }

  // 检查最后一个空闲时间段
  if (currentTime < workingHours.end) {
    const timeDiff = getTimeDifferenceInMinutes(currentTime, workingHours.end)
    if (timeDiff >= slotDuration) {
      availableSlots.push({
        start_time: currentTime,
        end_time: workingHours.end
      })
    }
  }

  return availableSlots
}

// 计算时间差（分钟）
function getTimeDifferenceInMinutes(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}:00`)
  const end = new Date(`2000-01-01T${endTime}:00`)
  return (end.getTime() - start.getTime()) / (1000 * 60)
}

// 获取时间类型的显示配置
export function getScheduleTypeConfig(type: ScheduleType) {
  switch (type) {
    case 'free':
      return {
        label: '空き時間',
        color: '#10b981',
        bgColor: '#d1fae5',
        textColor: '#065f46',
      }
    case 'busy':
      return {
        label: '忙しい',
        color: '#ef4444',
        bgColor: '#fee2e2',
        textColor: '#991b1b',
      }
    case 'class':
      return {
        label: '授業',
        color: '#f59e42',
        bgColor: '#fef3c7',
        textColor: '#92400e',
      }
    case 'interview':
      return {
        label: '面接',
        color: '#a78bfa',
        bgColor: '#ede9fe',
        textColor: '#5b21b6',
      }
    case 'mentoring': // 新增辅导预约类型
      return {
        label: '面接辅导',
        color: '#3b82f6',
        bgColor: '#dbeafe',
        textColor: '#1e40af',
      }
    case 'other':
    default:
      return {
        label: 'その他',
        color: '#6b7280',
        bgColor: '#f3f4f6',
        textColor: '#374151',
      }
  }
} 