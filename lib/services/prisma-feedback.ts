// 基于 Prisma 的反馈管理服务
// 提供用户反馈的提交和管理功能

import { prisma } from '../prisma'
import { getCurrentUser } from './prisma-auth'

/**
 * 提交反馈
 * @param feedbackData 反馈数据
 */
export async function submitFeedback(feedbackData: {
  name: string
  email: string
  category: string
  subject: string
  message: string
}) {
  try {
    const user = await getCurrentUser()

    const feedback = await prisma.feedback.create({
      data: {
        userId: user?.id, // 可选，未登录用户也可以提交反馈
        name: feedbackData.name,
        email: feedbackData.email,
        category: feedbackData.category,
        subject: feedbackData.subject,
        message: feedbackData.message,
        status: 'pending',
      },
    })

    return feedback
  } catch (error) {
    console.error('提交反馈错误:', error)
    throw error
  }
}

/**
 * 获取所有反馈（管理员）
 * @param status 状态过滤（可选）
 */
export async function getAllFeedback(status?: string) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    // 检查用户是否为管理员
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (userProfile?.role !== 'ADMINISTRATOR') {
      throw new Error('权限不足')
    }

    const feedback = await prisma.feedback.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return feedback
  } catch (error) {
    console.error('获取反馈列表错误:', error)
    throw error
  }
}

/**
 * 获取当前用户的反馈
 */
export async function getUserFeedback() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    const feedback = await prisma.feedback.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return feedback
  } catch (error) {
    console.error('获取用户反馈错误:', error)
    throw error
  }
}

/**
 * 更新反馈状态（管理员）
 * @param feedbackId 反馈ID
 * @param status 新状态
 */
export async function updateFeedbackStatus(feedbackId: string, status: string) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    // 检查用户是否为管理员
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (userProfile?.role !== 'ADMINISTRATOR') {
      throw new Error('权限不足')
    }

    const feedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status },
    })

    return feedback
  } catch (error) {
    console.error('更新反馈状态错误:', error)
    throw error
  }
}

/**
 * 删除反馈（管理员）
 * @param feedbackId 反馈ID
 */
export async function deleteFeedback(feedbackId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    // 检查用户是否为管理员
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (userProfile?.role !== 'ADMINISTRATOR') {
      throw new Error('权限不足')
    }

    await prisma.feedback.delete({
      where: { id: feedbackId },
    })

    return { success: true }
  } catch (error) {
    console.error('删除反馈错误:', error)
    throw error
  }
}

/**
 * 获取反馈统计（管理员）
 */
export async function getFeedbackStats() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    // 检查用户是否为管理员
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (userProfile?.role !== 'ADMINISTRATOR') {
      throw new Error('权限不足')
    }

    const [total, pending, sent, failed] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { status: 'pending' } }),
      prisma.feedback.count({ where: { status: 'sent' } }),
      prisma.feedback.count({ where: { status: 'email_failed' } }),
    ])

    // 按分类统计
    const byCategory = await prisma.feedback.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    })

    return {
      total,
      pending,
      sent,
      failed,
      byCategory: byCategory.map((item) => ({
        category: item.category,
        count: item._count.category,
      })),
    }
  } catch (error) {
    console.error('获取反馈统计错误:', error)
    throw error
  }
}

