import { PrismaClient } from '@prisma/client';
import { supabase } from './supabase';

const prisma = new PrismaClient();

// 面试类型映射
const INTERVIEW_TYPE_LABELS = {
  FIRST: '一次面接',
  SECOND: '二次面接',
  FINAL: '最終面接',
  CASUAL: 'カジュアル面接',
  OTHER: 'その他'
} as const;

// 面试状态映射
const INTERVIEW_STATUS_MAP = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

/**
 * 创建面试并自动同步到日程表
 */
export async function createInterviewWithSchedule(
  applicationId: string,
  interviewData: {
    startTime: Date;
    endTime: Date;
    type: 'FIRST' | 'SECOND' | 'FINAL' | 'CASUAL' | 'OTHER';
    notes?: string;
    location?: string;
  }
) {
  return await prisma.$transaction(async (tx) => {
    // 1. 获取申请信息
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!application) {
      throw new Error('申请不存在');
    }

    // 2. 创建面试记录
    const interview = await tx.interview.create({
      data: {
        applicationId,
        startTime: interviewData.startTime,
        endTime: interviewData.endTime,
        status: 'SCHEDULED',
        type: interviewData.type as any,
        notes: interviewData.notes || null
      }
    });

    // 3. 自动创建对应的日程记录
    const scheduleTitle = `${application.company.name} - ${INTERVIEW_TYPE_LABELS[interviewData.type]}`;
    
    const schedule = await tx.schedule.create({
      data: {
        userId: application.studentId,
        title: scheduleTitle,
        startTime: interviewData.startTime,
        endTime: interviewData.endTime,
        status: 'SCHEDULED',
        type: 'INTERVIEW',
        applicationId: applicationId,
        companyName: application.company.name,
        notes: interviewData.notes || null
      }
    });

    // 4. 更新 Application 表中的面试时间字段
    const interviewFieldMap = {
      FIRST: 'firstInterviewAt',
      SECOND: 'secondInterviewAt',
      FINAL: 'finalInterviewAt',
      CASUAL: 'casualInterviewAt'
    };

    const interviewEndFieldMap = {
      FIRST: 'firstInterviewEnd',
      SECOND: 'secondInterviewEnd',
      FINAL: 'finalInterviewEnd',
      CASUAL: 'casualInterviewEnd'
    };

    if (interviewFieldMap[interviewData.type as keyof typeof interviewFieldMap]) {
      await tx.application.update({
        where: { id: applicationId },
        data: {
          [interviewFieldMap[interviewData.type as keyof typeof interviewFieldMap]]: interviewData.startTime,
          [interviewEndFieldMap[interviewData.type as keyof typeof interviewEndFieldMap]]: interviewData.endTime
        }
      });
    }

    return { interview, schedule, application };
  });
}

/**
 * 更新面试并同步到日程表
 */
export async function updateInterviewWithSchedule(
  interviewId: string,
  updateData: {
    startTime?: Date;
    endTime?: Date;
    status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
    location?: string;
  }
) {
  return await prisma.$transaction(async (tx) => {
    // 1. 获取现有面试信息
    const existingInterview = await tx.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            student: {
              select: {
                id: true,
                name: true
              }
            },
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!existingInterview) {
      throw new Error('面试不存在');
    }

    // 2. 更新面试记录
    const updatedInterview = await tx.interview.update({
      where: { id: interviewId },
      data: {
        ...(updateData.startTime && { startTime: updateData.startTime }),
        ...(updateData.endTime && { endTime: updateData.endTime }),
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
        updatedAt: new Date()
      }
    });

    // 3. 同步更新日程表
    const scheduleTitle = `${existingInterview.application.company.name} - ${INTERVIEW_TYPE_LABELS[existingInterview.type]}`;
    
    const updatedSchedule = await tx.schedule.updateMany({
      where: {
        applicationId: existingInterview.applicationId,
        title: scheduleTitle,
        type: 'INTERVIEW'
      },
      data: {
        ...(updateData.startTime && { startTime: updateData.startTime }),
        ...(updateData.endTime && { endTime: updateData.endTime }),
        ...(updateData.status && { status: INTERVIEW_STATUS_MAP[updateData.status] }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
        updatedAt: new Date()
      }
    });

    // 4. 如果面试时间更新，同步更新 Application 表
    if (updateData.startTime || updateData.endTime) {
      const interviewFieldMap = {
        FIRST: 'firstInterviewAt',
        SECOND: 'secondInterviewAt',
        FINAL: 'finalInterviewAt',
        CASUAL: 'casualInterviewAt'
      };

      const interviewEndFieldMap = {
        FIRST: 'firstInterviewEnd',
        SECOND: 'secondInterviewEnd',
        FINAL: 'finalInterviewEnd',
        CASUAL: 'casualInterviewEnd'
      };

      const updateFields: any = {};
      if (updateData.startTime && interviewFieldMap[existingInterview.type as keyof typeof interviewFieldMap]) {
        updateFields[interviewFieldMap[existingInterview.type as keyof typeof interviewFieldMap]] = updateData.startTime;
      }
      if (updateData.endTime && interviewEndFieldMap[existingInterview.type as keyof typeof interviewEndFieldMap]) {
        updateFields[interviewEndFieldMap[existingInterview.type as keyof typeof interviewEndFieldMap]] = updateData.endTime;
      }

      if (Object.keys(updateFields).length > 0) {
        await tx.application.update({
          where: { id: existingInterview.applicationId },
          data: updateFields
        });
      }
    }

    return { interview: updatedInterview, schedule: updatedSchedule };
  });
}

/**
 * 删除面试并同步删除日程表记录
 */
export async function deleteInterviewWithSchedule(interviewId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. 获取面试信息
    const interview = await tx.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!interview) {
      throw new Error('面试不存在');
    }

    // 2. 删除日程表记录
    const scheduleTitle = `${interview.application.company.name} - ${INTERVIEW_TYPE_LABELS[interview.type]}`;
    
    const deletedSchedule = await tx.schedule.deleteMany({
      where: {
        applicationId: interview.applicationId,
        title: scheduleTitle,
        type: 'INTERVIEW'
      }
    });

    // 3. 删除面试记录
    const deletedInterview = await tx.interview.delete({
      where: { id: interviewId }
    });

    // 4. 清空 Application 表中的对应面试时间字段
    const interviewFieldMap = {
      FIRST: 'firstInterviewAt',
      SECOND: 'secondInterviewAt',
      FINAL: 'finalInterviewAt',
      CASUAL: 'casualInterviewAt'
    };

    const interviewEndFieldMap = {
      FIRST: 'firstInterviewEnd',
      SECOND: 'secondInterviewEnd',
      FINAL: 'finalInterviewEnd',
      CASUAL: 'casualInterviewEnd'
    };

    const clearFields: any = {};
    if (interviewFieldMap[interview.type as keyof typeof interviewFieldMap]) {
      clearFields[interviewFieldMap[interview.type as keyof typeof interviewFieldMap]] = null;
    }
    if (interviewEndFieldMap[interview.type as keyof typeof interviewEndFieldMap]) {
      clearFields[interviewEndFieldMap[interview.type as keyof typeof interviewEndFieldMap]] = null;
    }

    if (Object.keys(clearFields).length > 0) {
      await tx.application.update({
        where: { id: interview.applicationId },
        data: clearFields
      });
    }

    return { interview: deletedInterview, schedule: deletedSchedule };
  });
}

/**
 * 批量更新面试状态（用于批量操作）
 */
export async function batchUpdateInterviewStatus(
  interviewIds: string[],
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
) {
  return await prisma.$transaction(async (tx) => {
    // 1. 批量更新面试状态
    const updatedInterviews = await tx.interview.updateMany({
      where: {
        id: {
          in: interviewIds
        }
      },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    // 2. 获取所有相关面试信息
    const interviews = await tx.interview.findMany({
      where: {
        id: {
          in: interviewIds
        }
      },
      include: {
        application: {
          include: {
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // 3. 批量更新对应的日程表记录
    const scheduleUpdates = await Promise.all(
      interviews.map(async (interview) => {
        const scheduleTitle = `${interview.application.company.name} - ${INTERVIEW_TYPE_LABELS[interview.type]}`;
        
        return await tx.schedule.updateMany({
          where: {
            applicationId: interview.applicationId,
            title: scheduleTitle,
            type: 'INTERVIEW'
          },
          data: {
            status: INTERVIEW_STATUS_MAP[status],
            updatedAt: new Date()
          }
        });
      })
    );

    return { interviews: updatedInterviews, schedules: scheduleUpdates };
  });
}

/**
 * 获取面试及其对应的日程信息
 */
export async function getInterviewWithSchedule(interviewId: string) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: {
          student: {
            select: {
              id: true,
              name: true
            }
          },
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  if (!interview) {
    throw new Error('面试不存在');
  }

  const scheduleTitle = `${interview.application.company.name} - ${INTERVIEW_TYPE_LABELS[interview.type]}`;
  
  const schedule = await prisma.schedule.findFirst({
    where: {
      applicationId: interview.applicationId,
      title: scheduleTitle,
      type: 'INTERVIEW'
    }
  });

  return { interview, schedule };
}

/**
 * 获取申请的所有面试及其日程
 */
export async function getApplicationInterviewsWithSchedules(applicationId: string) {
  const interviews = await prisma.interview.findMany({
    where: { applicationId },
    include: {
      application: {
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const schedules = await prisma.schedule.findMany({
    where: {
      applicationId,
      type: 'INTERVIEW'
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return { interviews, schedules };
}
