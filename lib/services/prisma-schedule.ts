// 基于 Prisma 的日程管理服务
// 提供面试和日程的管理功能

import { prisma, ScheduleType, ScheduleStatus, InterviewType, InterviewStatus, MentoringType } from '../prisma'
import { getCurrentUser } from './prisma-auth'

/**
 * 获取用户的所有日程
 * @param userId 用户ID（可选，不传则获取当前用户）
 */
export async function getSchedules(userId?: string) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    const targetUserId = userId || user.id

    const schedules = await prisma.schedule.findMany({
      where: { userId: targetUserId },
      include: {
        application: {
          include: {
            company: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return schedules
  } catch (error) {
    console.error('获取日程列表错误:', error)
    throw error
  }
}

/**
 * 获取指定日期范围的日程
 * @param startDate 开始日期
 * @param endDate 结束日期
 */
export async function getSchedulesByDateRange(startDate: Date, endDate: Date) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    const schedules = await prisma.schedule.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        application: {
          include: {
            company: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return schedules
  } catch (error) {
    console.error('获取指定日期范围日程错误:', error)
    throw error
  }
}

/**
 * 创建日程
 * @param scheduleData 日程数据
 */
export async function createSchedule(scheduleData: {
  title: string
  startTime: Date
  endTime: Date
  status: ScheduleStatus
  type: ScheduleType
  applicationId?: string
  companyName?: string
  instructorId?: string
  notes?: string
  mentoringType?: MentoringType
  availableSlots?: number
  bookedSlots?: number
  onlineUrl?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    const schedule = await prisma.schedule.create({
      data: {
        userId: user.id,
        title: scheduleData.title,
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
        status: scheduleData.status,
        type: scheduleData.type,
        applicationId: scheduleData.applicationId,
        companyName: scheduleData.companyName,
        instructorId: scheduleData.instructorId,
        notes: scheduleData.notes,
        mentoringType: scheduleData.mentoringType,
        availableSlots: scheduleData.availableSlots,
        bookedSlots: scheduleData.bookedSlots || 0,
        onlineUrl: scheduleData.onlineUrl,
      },
      include: {
        application: {
          include: {
            company: true,
          },
        },
      },
    })

    return schedule
  } catch (error) {
    console.error('创建日程错误:', error)
    throw error
  }
}

/**
 * 更新日程
 * @param scheduleId 日程ID
 * @param updates 更新数据
 */
export async function updateSchedule(
  scheduleId: string,
  updates: {
    title?: string
    startTime?: Date
    endTime?: Date
    status?: ScheduleStatus
    type?: ScheduleType
    applicationId?: string
    companyName?: string
    instructorId?: string
    notes?: string
    mentoringType?: MentoringType
    availableSlots?: number
    bookedSlots?: number
    onlineUrl?: string
  }
) {
  try {
    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: updates,
      include: {
        application: {
          include: {
            company: true,
          },
        },
      },
    })

    return schedule
  } catch (error) {
    console.error('更新日程错误:', error)
    throw error
  }
}

/**
 * 删除日程
 * @param scheduleId 日程ID
 */
export async function deleteSchedule(scheduleId: string) {
  try {
    await prisma.schedule.delete({
      where: { id: scheduleId },
    })
    return { success: true }
  } catch (error) {
    console.error('删除日程错误:', error)
    throw error
  }
}

// ========== 面试管理 ==========

/**
 * 获取申请的所有面试
 * @param applicationId 申请ID
 */
export async function getInterviewsByApplication(applicationId: string) {
  try {
    const interviews = await prisma.interview.findMany({
      where: { applicationId },
      orderBy: { startTime: 'asc' },
    })

    return interviews
  } catch (error) {
    console.error('获取申请面试列表错误:', error)
    throw error
  }
}

/**
 * 创建面试记录
 * @param interviewData 面试数据
 */
export async function createInterview(interviewData: {
  applicationId: string
  startTime: Date
  endTime: Date
  status: InterviewStatus
  type: InterviewType
  notes?: string
}) {
  try {
    const interview = await prisma.interview.create({
      data: {
        applicationId: interviewData.applicationId,
        startTime: interviewData.startTime,
        endTime: interviewData.endTime,
        status: interviewData.status,
        type: interviewData.type,
        notes: interviewData.notes,
      },
      include: {
        application: {
          include: {
            company: true,
          },
        },
      },
    })

    return interview
  } catch (error) {
    console.error('创建面试记录错误:', error)
    throw error
  }
}

/**
 * 更新面试记录
 * @param interviewId 面试ID
 * @param updates 更新数据
 */
export async function updateInterview(
  interviewId: string,
  updates: {
    startTime?: Date
    endTime?: Date
    status?: InterviewStatus
    type?: InterviewType
    notes?: string
  }
) {
  try {
    const interview = await prisma.interview.update({
      where: { id: interviewId },
      data: updates,
      include: {
        application: {
          include: {
            company: true,
          },
        },
      },
    })

    return interview
  } catch (error) {
    console.error('更新面试记录错误:', error)
    throw error
  }
}

/**
 * 删除面试记录
 * @param interviewId 面试ID
 */
export async function deleteInterview(interviewId: string) {
  try {
    await prisma.interview.delete({
      where: { id: interviewId },
    })
    return { success: true }
  } catch (error) {
    console.error('删除面试记录错误:', error)
    throw error
  }
}

/**
 * 同步面试到日程
 * 当创建或更新面试时，自动创建或更新对应的日程
 * @param interviewId 面试ID
 */
export async function syncInterviewToSchedule(interviewId: string) {
  try {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            company: true,
            student: true,
          },
        },
      },
    })

    if (!interview) throw new Error('面试记录不存在')

    // 查找是否已存在对应的日程
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        userId: interview.application.studentId,
        applicationId: interview.applicationId,
        type: 'INTERVIEW',
        startTime: interview.startTime,
      },
    })

    // 将面试类型映射为日程标题
    const typeMap: Record<InterviewType, string> = {
      FIRST: '一次面接',
      SECOND: '二次面接',
      FINAL: '最終面接',
      CASUAL: 'カジュアル面接',
      OTHER: 'その他面接',
    }

    const scheduleTitle = `${interview.application.company.name} - ${typeMap[interview.type]}`

    // 将面试状态映射为日程状态
    const statusMap: Record<InterviewStatus, ScheduleStatus> = {
      SCHEDULED: 'SCHEDULED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    }

    if (existingSchedule) {
      // 更新现有日程
      await prisma.schedule.update({
        where: { id: existingSchedule.id },
        data: {
          title: scheduleTitle,
          startTime: interview.startTime,
          endTime: interview.endTime,
          status: statusMap[interview.status],
          notes: interview.notes,
          companyName: interview.application.company.name,
        },
      })
    } else {
      // 创建新日程
      await prisma.schedule.create({
        data: {
          userId: interview.application.studentId,
          title: scheduleTitle,
          startTime: interview.startTime,
          endTime: interview.endTime,
          status: statusMap[interview.status],
          type: 'INTERVIEW',
          applicationId: interview.applicationId,
          companyName: interview.application.company.name,
          notes: interview.notes,
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('同步面试到日程错误:', error)
    throw error
  }
}

/**
 * 获取讲师的空闲时段
 * @param instructorId 讲师ID
 * @param startDate 开始日期
 * @param endDate 结束日期
 */
export async function getInstructorAvailableSlots(
  instructorId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const schedules = await prisma.schedule.findMany({
      where: {
        userId: instructorId,
        status: 'FREE',
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return schedules
  } catch (error) {
    console.error('获取讲师空闲时段错误:', error)
    throw error
  }
}

/**
 * 预约辅导时段
 * @param scheduleId 日程ID
 * @param studentId 学生ID
 */
export async function bookMentoringSlot(scheduleId: string, studentId: string) {
  try {
    // 获取日程信息
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    })

    if (!schedule) throw new Error('日程不存在')
    if (schedule.status !== 'FREE') throw new Error('该时段不可预约')

    // 检查是否还有空位
    if (
      schedule.availableSlots &&
      schedule.bookedSlots &&
      schedule.bookedSlots >= schedule.availableSlots
    ) {
      throw new Error('该时段已满')
    }

    // 更新预约数
    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        bookedSlots: (schedule.bookedSlots || 0) + 1,
        status:
          schedule.availableSlots &&
          schedule.bookedSlots &&
          schedule.bookedSlots + 1 >= schedule.availableSlots
            ? 'SCHEDULED'
            : 'FREE',
      },
    })

    // 创建学生的日程记录
    await prisma.schedule.create({
      data: {
        userId: studentId,
        title: schedule.title,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        status: 'SCHEDULED',
        type: 'MENTORING',
        instructorId: schedule.userId,
        notes: schedule.notes,
        mentoringType: schedule.mentoringType,
        onlineUrl: schedule.onlineUrl,
      },
    })

    return updatedSchedule
  } catch (error) {
    console.error('预约辅导时段错误:', error)
    throw error
  }
}

