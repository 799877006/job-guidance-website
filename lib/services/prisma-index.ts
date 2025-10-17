// Prisma 服务统一导出
// 集中导出所有基于 Prisma 的服务函数

// 认证服务
export {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getProfile,
  updateUser,
  createStudentProfile,
  createInstructorProfile,
  updateStudentProfile,
  updateInstructorProfile,
} from './prisma-auth'

// 申请服务
export {
  getApplications,
  getApplicationsByStatus,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationCounts,
  upsertCompany,
  searchCompanies,
  getAllCompanies,
} from './prisma-application'

// 日程和面试服务
export {
  getSchedules,
  getSchedulesByDateRange,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getInterviewsByApplication,
  createInterview,
  updateInterview,
  deleteInterview,
  syncInterviewToSchedule,
  getInstructorAvailableSlots,
  bookMentoringSlot,
} from './prisma-schedule'

// 通知服务
export {
  getNotifications,
  getUnreadNotificationCount,
  createNotification,
  createBulkNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  archiveNotification,
  deleteNotification,
  cleanupOldNotifications,
  notifyScheduleCreated,
  notifyScheduleUpdated,
  notifyScheduleDeleted,
  notifyScheduleReminder,
  notifyMentoringRequest,
  notifyMentoringAccepted,
  notifyMentoringRejected,
  notifySystemNotice,
} from './prisma-notification'

// 反馈服务
export {
  submitFeedback,
  getAllFeedback,
  getUserFeedback,
  updateFeedbackStatus,
  deleteFeedback,
  getFeedbackStats,
} from './prisma-feedback'

// 导出 Prisma 客户端和类型
export { prisma } from '../prisma'
export type * from '@prisma/client'

