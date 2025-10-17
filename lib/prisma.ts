// Prisma Client 单例实例
// 用于在整个应用程序中共享同一个数据库连接

import { PrismaClient } from '@prisma/client'

// 创建类型安全的全局变量
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 在开发环境中，使用全局变量避免热重载时创建多个实例
// 在生产环境中，每次都创建新实例
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 导出 Prisma 类型和枚举
export * from '@prisma/client'

