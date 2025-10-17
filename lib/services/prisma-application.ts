// 基于 Prisma 的应用管理服务
// 提供求职申请的增删改查功能

import { prisma, ApplicationStatus } from '../prisma'
import { getCurrentUser } from './prisma-auth'

/**
 * 获取当前用户的所有申请
 */
export async function getApplications() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    // 根据用户角色返回不同的数据
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (!userProfile) throw new Error('用户资料不存在')

    // 学生只能看到自己的申请
    if (userProfile.role === 'STUDENT') {
      const applications = await prisma.application.findMany({
        where: { studentId: user.id },
        include: {
          company: true,
          interviews: true,
        },
        orderBy: { appliedAt: 'desc' },
      })
      return applications
    }

    // 管理员可以看到所有申请
    if (userProfile.role === 'ADMINISTRATOR') {
      const applications = await prisma.application.findMany({
        include: {
          company: true,
          interviews: true,
        },
        orderBy: { appliedAt: 'desc' },
      })
      return applications
    }

    // 讲师暂时没有查看权限
    return []
  } catch (error) {
    console.error('获取申请列表错误:', error)
    throw error
  }
}

/**
 * 根据状态获取申请
 * @param status 申请状态
 */
export async function getApplicationsByStatus(status: ApplicationStatus) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    const applications = await prisma.application.findMany({
      where: {
        studentId: user.id,
        status: status,
      },
      include: {
        company: true,
        interviews: true,
      },
      orderBy: { appliedAt: 'desc' },
    })

    return applications
  } catch (error) {
    console.error('获取特定状态申请错误:', error)
    throw error
  }
}

/**
 * 获取单个申请详情
 * @param applicationId 申请ID
 */
export async function getApplicationById(applicationId: string) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        company: true,
        interviews: {
          orderBy: { createdAt: 'asc' },
        },
        schedules: {
          orderBy: { startTime: 'asc' },
        },
      },
    })

    return application
  } catch (error) {
    console.error('获取申请详情错误:', error)
    throw error
  }
}

/**
 * 创建新申请
 * @param applicationData 申请数据
 */
export async function createApplication(applicationData: {
  companyId: string
  status: ApplicationStatus
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
}) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    const application = await prisma.application.create({
      data: {
        studentId: user.id,
        companyId: applicationData.companyId,
        status: applicationData.status,
        appliedAt: applicationData.appliedAt,
        casualInterviewAt: applicationData.casualInterviewAt,
        casualInterviewEnd: applicationData.casualInterviewEnd,
        firstInterviewAt: applicationData.firstInterviewAt,
        secondInterviewAt: applicationData.secondInterviewAt,
        finalInterviewAt: applicationData.finalInterviewAt,
        firstInterviewEnd: applicationData.firstInterviewEnd,
        secondInterviewEnd: applicationData.secondInterviewEnd,
        finalInterviewEnd: applicationData.finalInterviewEnd,
        offerReceivedAt: applicationData.offerReceivedAt,
        annualSalary: applicationData.annualSalary,
        monthlySalary: applicationData.monthlySalary,
        benefits: applicationData.benefits || [],
        location: applicationData.location,
        workHours: applicationData.workHours,
        otherConditions: applicationData.otherConditions,
      },
      include: {
        company: true,
      },
    })

    return application
  } catch (error) {
    console.error('创建申请错误:', error)
    throw error
  }
}

/**
 * 更新申请信息
 * @param applicationId 申请ID
 * @param updates 更新数据
 */
export async function updateApplication(
  applicationId: string,
  updates: {
    status?: ApplicationStatus
    appliedAt?: Date
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
) {
  try {
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: updates,
      include: {
        company: true,
      },
    })

    return application
  } catch (error) {
    console.error('更新申请错误:', error)
    throw error
  }
}

/**
 * 删除申请
 * @param applicationId 申请ID
 */
export async function deleteApplication(applicationId: string) {
  try {
    await prisma.application.delete({
      where: { id: applicationId },
    })
    return { success: true }
  } catch (error) {
    console.error('删除申请错误:', error)
    throw error
  }
}

/**
 * 获取申请统计数据
 */
export async function getApplicationCounts() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('未登录')

    // 获取所有申请
    const applications = await prisma.application.findMany({
      where: { studentId: user.id },
      select: { status: true },
    })

    // 统计各状态数量
    const counts = {
      total: applications.length,
      failed: 0,
      passed: 0,
      inProgress: 0,
    }

    applications.forEach((app) => {
      if (app.status === 'REJECTED') {
        counts.failed++
      } else if (app.status === 'OFFER_RECEIVED') {
        counts.passed++
      } else {
        counts.inProgress++
      }
    })

    return counts
  } catch (error) {
    console.error('获取申请统计错误:', error)
    throw error
  }
}

/**
 * 创建或更新公司信息
 * @param companyData 公司数据
 */
export async function upsertCompany(companyData: {
  id?: string
  name: string
  position: string
  description?: string
  location: string
  benefits?: string[]
  workHours: string
}) {
  try {
    if (companyData.id) {
      // 更新现有公司
      const company = await prisma.company.update({
        where: { id: companyData.id },
        data: {
          name: companyData.name,
          position: companyData.position,
          description: companyData.description,
          location: companyData.location,
          benefits: companyData.benefits || [],
          workHours: companyData.workHours,
        },
      })
      return company
    } else {
      // 创建新公司
      const company = await prisma.company.create({
        data: {
          name: companyData.name,
          position: companyData.position,
          description: companyData.description,
          location: companyData.location,
          benefits: companyData.benefits || [],
          workHours: companyData.workHours,
        },
      })
      return company
    }
  } catch (error) {
    console.error('创建/更新公司错误:', error)
    throw error
  }
}

/**
 * 搜索公司
 * @param keyword 搜索关键词
 */
export async function searchCompanies(keyword: string) {
  try {
    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { position: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      take: 10,
    })
    return companies
  } catch (error) {
    console.error('搜索公司错误:', error)
    throw error
  }
}

/**
 * 获取所有公司
 */
export async function getAllCompanies() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
    })
    return companies
  } catch (error) {
    console.error('获取公司列表错误:', error)
    throw error
  }
}

