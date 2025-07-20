import { supabase } from './supabase'
import type { Database } from './types/supabase'

export type InstructorAvailability = Database['public']['Tables']['instructor_availability']['Row']
export type MentoringBooking = Database['public']['Tables']['mentoring_bookings']['Row']
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'

// 导师可用时间管理
export async function getInstructorAvailability(instructorId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('instructor_availability')
    .select('*')
    .eq('instructor_id', instructorId)
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('is_available', true)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

export async function createAvailability(availability: Database['public']['Tables']['instructor_availability']['Insert']) {
  const { data, error } = await supabase
    .from('instructor_availability')
    .insert(availability)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAvailability(id: string, updates: Database['public']['Tables']['instructor_availability']['Update']) {
  const { data, error } = await supabase
    .from('instructor_availability')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAvailability(id: string) {
  const { error } = await supabase
    .from('instructor_availability')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// 获取所有可用的导师和时间段
export async function getAvailableInstructors(date: string) {
  const { data, error } = await supabase
    .from('instructor_availability')
    .select(`
      *,
      profiles:instructor_id (
        id,
        full_name,
        bio,
        avatar_url
      )
    `)
    .eq('date', date)
    .eq('is_available', true)
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

// 预约管理
export async function createBooking(booking: Database['public']['Tables']['mentoring_bookings']['Insert']) {
  const { data, error } = await supabase
    .from('mentoring_bookings')
    .insert(booking)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getStudentBookings(studentId: string) {
  const { data, error } = await supabase
    .from('mentoring_bookings')
    .select(`
      *,
      instructor:instructor_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('student_id', studentId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

export async function getInstructorBookings(instructorId: string) {
  const { data, error } = await supabase
    .from('mentoring_bookings')
    .select(`
      *,
      student:student_id (
        id,
        full_name,
        avatar_url,
        university,
        major
      )
    `)
    .eq('instructor_id', instructorId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

export async function updateBookingStatus(id: string, status: BookingStatus, instructorNotes?: string) {
  const updates: Database['public']['Tables']['mentoring_bookings']['Update'] = {
    status,
    ...(instructorNotes && { instructor_notes: instructorNotes })
  }

  const { data, error } = await supabase
    .from('mentoring_bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function cancelBooking(id: string, reason?: string) {
  const { data, error } = await supabase
    .from('mentoring_bookings')
    .update({
      status: 'cancelled',
      instructor_notes: reason
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// 获取导师的预约请求（待处理）
export async function getPendingBookings(instructorId: string) {
  const { data, error } = await supabase
    .from('mentoring_bookings')
    .select(`
      *,
      student:student_id (
        id,
        full_name,
        avatar_url,
        university,
        major
      )
    `)
    .eq('instructor_id', instructorId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

// 检查时间段是否有冲突
export async function checkTimeConflict(instructorId: string, date: string, startTime: string, endTime: string) {
  const { data, error } = await supabase
    .from('mentoring_bookings')
    .select('id')
    .eq('instructor_id', instructorId)
    .eq('date', date)
    .in('status', ['pending', 'confirmed'])
    .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`)

  if (error) throw error
  return data.length > 0
}

// 获取导师列表
export async function getInstructors() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, bio, avatar_url, university')
    .eq('role', 'instructor')
    .order('full_name', { ascending: true })

  if (error) throw error
  return data
} 