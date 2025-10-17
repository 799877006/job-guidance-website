// 基于 Prisma 的通知管理服务
// 提供通知的创建、查询和更新功能

import { prisma, NotificationType, NotificationStatus } from '../prisma'
import { getCurrentUser } from './prisma-auth'

/**
 * 获取用户的所有通知
 * @param status 通知状态过滤（可选）
 */
export async function getNotifications(status?: NotificationStatus) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // 限制返回数量
    })

    return notifications
  } catch (error) {
    console.error('获取通知列表错误:', error)
    throw error
  }
}

/**
 * 获取未读通知数量
 */
export async function getUnreadNotificationCount() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        status: 'UNREAD',
      },
    })

    return count
  } catch (error) {
    console.error('获取未读通知数量错误:', error)
    throw error
  }
}

/**
 * 创建通知
 * @param notificationData 通知数据
 */
export async function createNotification(notificationData: {
  userId: string
  type: NotificationType
  title: string
  content: string
  metadata?: Record<string, any>
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        content: notificationData.content,
        metadata: notificationData.metadata || {},
        status: 'UNREAD',
      },
    })

    return notification
  } catch (error) {
    console.error('创建通知错误:', error)
    throw error
  }
}

/**
 * 批量创建通知
 * @param userIds 用户ID列表
 * @param notificationData 通知数据
 */
export async function createBulkNotifications(
  userIds: string[],
  notificationData: {
    type: NotificationType
    title: string
    content: string
    metadata?: Record<string, any>
  }
) {
  try {
    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: notificationData.type,
        title: notificationData.title,
        content: notificationData.content,
        metadata: notificationData.metadata || {},
        status: 'UNREAD' as NotificationStatus,
      })),
    })

    return notifications
  } catch (error) {
    console.error('批量创建通知错误:', error)
    throw error
  }
}

/**
 * 标记通知为已读
 * @param notificationId 通知ID
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    })

    return notification
  } catch (error) {
    console.error('标记通知已读错误:', error)
    throw error
  }
}

/**
 * 标记所有通知为已读
 */
export async function markAllNotificationsAsRead() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        status: 'UNREAD',
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    })

    return result
  } catch (error) {
    console.error('标记所有通知已读错误:', error)
    throw error
  }
}

/**
 * 归档通知
 * @param notificationId 通知ID
 */
export async function archiveNotification(notificationId: string) {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'ARCHIVED',
      },
    })

    return notification
  } catch (error) {
    console.error('归档通知错误:', error)
    throw error
  }
}

/**
 * 删除通知
 * @param notificationId 通知ID
 */
export async function deleteNotification(notificationId: string) {
  try {
    await prisma.notification.delete({
      where: { id: notificationId },
    })
    return { success: true }
  } catch (error) {
    console.error('删除通知错误:', error)
    throw error
  }
}

/**
 * 清理旧通知
 * 删除超过指定天数的已读和已归档通知
 * @param days 天数
 */
export async function cleanupOldNotifications(days: number = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: {
          in: ['READ', 'ARCHIVED'],
        },
      },
    })

    return result
  } catch (error) {
    console.error('清理旧通知错误:', error)
    throw error
  }
}

// ========== 特定类型通知的创建函数 ==========

/**
 * 创建日程创建通知
 */
export async function notifyScheduleCreated(userId: string, scheduleTitle: string) {
  return createNotification({
    userId,
    type: 'SCHEDULE_CREATED',
    title: '予約が作成されました',
    content: `「${scheduleTitle}」の予約が作成されました。`,
  })
}

/**
 * 创建日程更新通知
 */
export async function notifyScheduleUpdated(userId: string, scheduleTitle: string) {
  return createNotification({
    userId,
    type: 'SCHEDULE_UPDATED',
    title: '予約が更新されました',
    content: `「${scheduleTitle}」の予約が更新されました。`,
  })
}

/**
 * 创建日程删除通知
 */
export async function notifyScheduleDeleted(userId: string, scheduleTitle: string) {
  return createNotification({
    userId,
    type: 'SCHEDULE_DELETED',
    title: '予約が削除されました',
    content: `「${scheduleTitle}」の予約が削除されました。`,
  })
}

/**
 * 创建日程提醒通知
 */
export async function notifyScheduleReminder(userId: string, scheduleTitle: string, startTime: Date) {
  return createNotification({
    userId,
    type: 'SCHEDULE_REMINDER',
    title: '予約のリマインダー',
    content: `「${scheduleTitle}」が${startTime.toLocaleString('ja-JP')}に始まります。`,
    metadata: { startTime: startTime.toISOString() },
  })
}

/**
 * 创建辅导请求通知
 */
export async function notifyMentoringRequest(
  instructorId: string,
  studentName: string,
  subject: string
) {
  return createNotification({
    userId: instructorId,
    type: 'MENTORING_REQUEST',
    title: '指導依頼がありました',
    content: `${studentName}さんから「${subject}」の指導依頼がありました。`,
  })
}

/**
 * 创建辅导接受通知
 */
export async function notifyMentoringAccepted(studentId: string, instructorName: string) {
  return createNotification({
    userId: studentId,
    type: 'MENTORING_ACCEPTED',
    title: '指導依頼が承認されました',
    content: `${instructorName}先生が指導依頼を承認しました。`,
  })
}

/**
 * 创建辅导拒绝通知
 */
export async function notifyMentoringRejected(studentId: string, instructorName: string) {
  return createNotification({
    userId: studentId,
    type: 'MENTORING_REJECTED',
    title: '指導依頼が拒否されました',
    content: `${instructorName}先生が指導依頼を拒否しました。`,
  })
}

/**
 * 创建系统通知
 */
export async function notifySystemNotice(userId: string, title: string, content: string) {
  return createNotification({
    userId,
    type: 'SYSTEM_NOTICE',
    title,
    content,
  })
}

