import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 需要用户认证的路由
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/applications',
  '/schedule',
  '/schedule-interview',
  '/mentoring',
  '/statistics',
  '/feedback',
  '/instructor-dashboard',
  '/instructor-profile'
]

// 公开路由 - 不需要认证
const publicRoutes = [
  '/',
  '/login',
  '/register'
]

// 公开API路由 - 不需要认证
const publicApiRoutes = [
  '/api/send-feedback'
]

// 需要认证的API路由
const protectedApiRoutes = [
  '/api/applications',
  '/api/profile',
  '/api/schedule',
  '/api/mentoring',
  '/api/statistics',
  '/api/messages',
  '/api/feedback'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 检查是否为公开路由
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // 检查是否为公开API路由
  const isPublicApiRoute = publicApiRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // 检查是否为受保护的API路由
  const isProtectedApiRoute = protectedApiRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // 检查是否为受保护的页面路由
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // 如果是公开路由或公开API路由，直接放行
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next()
  }
  
  // 获取认证信息
  const authHeader = request.headers.get('authorization')
  const sessionCookie = request.cookies.get('sb-access-token')?.value
  const refreshCookie = request.cookies.get('sb-refresh-token')?.value
  
  // 检查是否有有效的认证信息
  const hasAuth = authHeader || (sessionCookie && refreshCookie)
  
  // 如果是受保护的API路由
  if (isProtectedApiRoute) {
    if (!hasAuth) {
      // API路由返回401状态码和JSON错误信息
      return NextResponse.json(
        { 
          error: '認証が必要です',
          message: 'このAPIにアクセスするにはログインが必要です' 
        },
        { status: 401 }
      )
    }
  }
  
  // 如果是受保护的页面路由
  if (isProtectedRoute) {
    if (!hasAuth) {
      // 页面路由重定向到登录页
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return NextResponse.next()
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - 公开资源文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
