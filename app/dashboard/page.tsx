"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, BarChart3, User, MessageSquare, LogOut, Bell, Plus, Building, TrendingUp, UserCheck, Clock, Users, CheckCircle, AlertCircle, BookOpen, X } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { supabase, type Interview, type Advertisement } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { getInstructorBookings, getPendingBookings } from "@/lib/mentoring"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"

interface Booking {
  id: string
  date: string
  start_time: string
  end_time: string
  subject: string
  description: string | null
  student_notes: string | null
  status: string
  student: {
    id: string
    full_name: string
    avatar_url: string | null
    university: string | null
    major: string | null
  }
}

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth()
  const { toast } = useToast()
  
  // 学生用状态
  const [stats, setStats] = useState({
    applied: 0,
    rejected: 0,
    accepted: 0,
    pending: 0,
  })
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([])
  const [pastInterviews, setPastInterviews] = useState<Interview[]>([])
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  
  // 指导者用状态
  const [instructorStats, setInstructorStats] = useState({
    totalGuidance: 0,         // 总辅导数
    monthlyGuidance: 0,       // 月辅导数
    successRate: 0,           // 合格率
    pendingBookings: 0,       // 待机中的预约
  })
  const [todayBookings, setTodayBookings] = useState<Booking[]>([])
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([])
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'instructor') {
        fetchInstructorDashboardData()
      } else {
        fetchStudentDashboardData()
      }
    } else if (user === null && profile === null) {
      // 如果用户和profile都为null，停止加载状态
      setLoading(false)
    }
  }, [user?.id, profile?.role])

  // 重置loading状态当组件卸载时
  useEffect(() => {
    return () => {
      setLoading(false)
    }
  }, [])

  const fetchStudentDashboardData = async () => {
    try {
      // Fetch application statistics
      const { data: applications } = await supabase.from("applications").select("status").eq("user_id", user!.id)

      if (applications) {
        const newStats = {
          applied: applications.length,
          rejected: applications.filter((app) => app.status === "rejected").length,
          accepted: applications.filter((app) => app.status === "accepted").length,
          pending: applications.filter((app) => app.status === "pending").length,
        }
        setStats(newStats)
      }

      // Fetch all interviews (upcoming and past)
      const { data: interviews } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", user!.id)
        .order("scheduled_date", { ascending: true })

      if (interviews) {
        // 获取当前东京时间的时间戳
        const TOKYO_TIMEZONE = 'Asia/Tokyo'
        const now = new Date()
        
        const upcoming = interviews.filter(interview => {
          // 将面试的日期和时间合并，并假定为东京时间
          const interviewDateTime = new Date(`${interview.scheduled_date}T${interview.scheduled_time}`)
          
          // 使用toLocaleString转换为东京时间进行比较
          // 先获取当前东京时间的字符串表示
          const nowTokyoString = now.toLocaleString('sv-SE', { timeZone: TOKYO_TIMEZONE })
          const nowTokyoTime = new Date(nowTokyoString)
          
          // 假定面试时间就是东京时间，直接比较
          return interviewDateTime >= nowTokyoTime
        })
        
        const past = interviews.filter(interview => {
          const interviewDateTime = new Date(`${interview.scheduled_date}T${interview.scheduled_time}`)
          
          const nowTokyoString = now.toLocaleString('sv-SE', { timeZone: TOKYO_TIMEZONE })
          const nowTokyoTime = new Date(nowTokyoString)
          
          // 如果面试时间早于当前东京时间，则认为是过去的面试
          return interviewDateTime < nowTokyoTime
        })
        
        setUpcomingInterviews(upcoming.slice(0, 5))
        setPastInterviews(past.slice(-3)) // 最近3个过去的面试
      }

      // Fetch advertisements
      const { data: ads } = await supabase
        .from("advertisements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3)

      if (ads) {
        setAdvertisements(ads)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "エラー",
        description: "データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchInstructorDashboardData = async () => {
    try {
      // 获取所有预约
      const allBookings = await getInstructorBookings(user!.id)
      const pending = await getPendingBookings(user!.id)
      
      if (allBookings) {
        const today = new Date().toISOString().split('T')[0]
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        
        // 计算今日预约
        const todayBookingsList = allBookings.filter(booking => 
          booking.date === today && booking.status === 'confirmed'
        )
        
        // 计算完成的指导数（总数）
        const completedGuidance = allBookings.filter(booking => 
          booking.status === 'completed'
        )
        
        // 计算月指导数
        const monthlyGuidanceList = allBookings.filter(booking => {
          const bookingDate = new Date(booking.date)
          return bookingDate.getMonth() === currentMonth && 
                 bookingDate.getFullYear() === currentYear &&
                 booking.status === 'completed'
        })

        // 计算合格率（需要获取指导过的学生的应募成功率）
        let successRate = 0
        try {
          // 获取所有被指导过的学生ID
          const guidedStudentIds = [...new Set(completedGuidance.map(booking => booking.student.id))]
          
          if (guidedStudentIds.length > 0) {
            // 获取这些学生的应募统计
            const { data: applications } = await supabase
              .from("applications")
              .select("status, user_id")
              .in("user_id", guidedStudentIds)
            
            if (applications && applications.length > 0) {
              const acceptedApplications = applications.filter(app => app.status === 'accepted')
              successRate = Math.round((acceptedApplications.length / applications.length) * 100)
            }
          }
        } catch (error) {
          console.error("Error calculating success rate:", error)
          successRate = 0
        }

        setInstructorStats({
          totalGuidance: completedGuidance.length,
          monthlyGuidance: monthlyGuidanceList.length,
          successRate: successRate,
          pendingBookings: pending?.length || 0,
        })
        
        setTodayBookings(todayBookingsList)
      }
      
      if (pending) {
        setPendingBookings(pending)
      }
    } catch (error) {
      console.error("Error fetching instructor dashboard data:", error)
      toast({
        title: "エラー",
        description: "データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 更新面试参加状态
  const updateInterviewAttendance = async (interviewId: string, attended: boolean) => {
    try {
      const { error } = await supabase
        .from("interviews")
        .update({ 
          status: attended ? "completed" : "cancelled"
        })
        .eq("id", interviewId)

      if (error) throw error

      // 重新获取数据
      await fetchStudentDashboardData()
      
      toast({
        title: "更新完了",
        description: attended ? "面接参加を記録しました" : "面接欠席を記録しました",
      })
    } catch (error) {
      console.error("Error updating interview attendance:", error)
      toast({
        title: "エラー",
        description: "面接状態の更新に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "ログアウト",
        description: "正常にログアウトしました",
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "ログアウトに失敗しました",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 指导者仪表板
  if (profile?.role === 'instructor') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <Link href="/" className="flex items-center">
                  <span className="text-xl font-bold text-blue-600">向日offer</span>
                </Link>
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm">
                    <Bell className="h-4 w-4" />
                    {instructorStats.pendingBookings > 0 && (
                      <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                        {instructorStats.pendingBookings}
                      </Badge>
                    )}
                  </Button>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      {profile?.full_name || "プロフィール"}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    ログアウト
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">おかえりなさい、{profile?.full_name || "先生"}</h1>
              <p className="text-gray-600 mt-2">今日の指導スケジュールを確認しましょう</p>
            </div>

            {/* 指导者统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">総指導数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{instructorStats.totalGuidance}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    累計指導回数
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">月間指導数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{instructorStats.monthlyGuidance}</div>
                  <p className="text-xs text-gray-500 mt-1">今月の指導回数</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">合格率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{instructorStats.successRate}%</div>
                  <p className="text-xs text-gray-500 mt-1">指導学生の合格率</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">待機中</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{instructorStats.pendingBookings}</div>
                  <p className="text-xs text-gray-500 mt-1">承認待ちの予約</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 本日のスケジュール */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        本日のスケジュール
                      </CardTitle>
                      <Link href="/instructor-dashboard">
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          スケジュール管理
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {todayBookings.length > 0 ? (
                      <div className="space-y-4">
                        {todayBookings.map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={booking.student.avatar_url || undefined} />
                                <AvatarFallback>
                                  {booking.student.full_name?.charAt(0) || 'S'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{booking.student.full_name}</div>
                                <div className="text-sm text-gray-600">
                                  {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                                </div>
                                <div className="text-sm text-gray-500">{booking.subject}</div>
                              </div>
                            </div>
                            <Badge variant="default">確定済み</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>本日の予定はありません</p>
                        <Link href="/instructor-dashboard">
                          <Button variant="outline" className="mt-2">
                            空き時間を設定する
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 待機中の予約とクイックアクション */}
              <div className="space-y-6">
                {/* 待機中の予約 */}
                {pendingBookings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                        承認待ちの予約
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pendingBookings.slice(0, 3).map((booking) => (
                          <div key={booking.id} className="p-3 border border-orange-200 rounded-lg">
                            <div className="font-medium text-sm">{booking.student.full_name}</div>
                            <div className="text-xs text-gray-600">
                              {format(parseISO(booking.date), 'MM月dd日', { locale: ja })} {booking.start_time.slice(0, 5)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{booking.subject}</div>
                          </div>
                        ))}
                        {pendingBookings.length > 3 && (
                          <div className="text-center">
                            <Link href="/instructor-dashboard?tab=pending">
                              <Button variant="ghost" size="sm">
                                他 {pendingBookings.length - 3} 件を見る
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* クイックアクション */}
                <Card>
                  <CardHeader>
                    <CardTitle>クイックアクション</CardTitle>
                    <CardDescription>指導者向け機能へのショートカット</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/instructor-dashboard">
                        <Button variant="outline" className="w-full h-16 flex flex-col">
                          <Calendar className="h-5 w-5 mb-1" />
                          <span className="text-xs">スケジュール管理</span>
                        </Button>
                      </Link>

                      <Link href="/instructor-dashboard?tab=bookings">
                        <Button variant="outline" className="w-full h-16 flex flex-col">
                          <Users className="h-5 w-5 mb-1" />
                          <span className="text-xs">予約管理</span>
                        </Button>
                      </Link>

                      <Link href="/profile">
                        <Button variant="outline" className="w-full h-16 flex flex-col">
                          <User className="h-5 w-5 mb-1" />
                          <span className="text-xs">プロフィール</span>
                        </Button>
                      </Link>

                      <Link href="/statistics">
                        <Button variant="outline" className="w-full h-16 flex flex-col">
                          <BarChart3 className="h-5 w-5 mb-1" />
                          <span className="text-xs">統計</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // 学生仪表板（原有内容）
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-blue-600">向日offer</span>
              </Link>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {profile?.full_name || "プロフィール"}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  ログアウト
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">おかえりなさい、{profile?.full_name || "ユーザー"}さん</h1>
            <p className="text-gray-600 mt-2">就職活動の進捗を確認しましょう</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">応募総数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.applied}</div>
                <p className="text-xs text-gray-500 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  今月の活動
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">不合格</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.applied > 0 ? `${((stats.rejected / stats.applied) * 100).toFixed(1)}%` : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">合格</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.applied > 0 ? `${((stats.accepted / stats.applied) * 100).toFixed(1)}%` : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">選考中</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-gray-500 mt-1">進行中の選考</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Interview Schedules */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Interviews */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      今後の面接予定
                    </CardTitle>
                    <Link href="/schedule">
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        新規予約
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {upcomingInterviews.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingInterviews.map((interview) => (
                        <div key={interview.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Building className="h-8 w-8 text-gray-400" />
                            <div>
                              <div className="font-medium">{interview.company_name}</div>
                              <div className="text-sm text-gray-600">
                                {interview.scheduled_date} {interview.scheduled_time}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline">{interview.interview_type}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>予定されている面接はありません</p>
                      <Link href="/schedule">
                        <Button variant="outline" className="mt-2 bg-transparent">
                          面接を予約する
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Past Interviews */}
              {pastInterviews.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-red-500" />
                      過去の面接
                    </CardTitle>
                    <CardDescription>参加状況を確認してください</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pastInterviews.map((interview) => {
                        const isPending = interview.status === 'scheduled'
                        const isCompleted = interview.status === 'completed'
                        const isCancelled = interview.status === 'cancelled'
                        
                        return (
                          <div 
                            key={interview.id} 
                            className={`p-3 rounded-lg border-2 ${
                              isPending ? 'border-red-200 bg-red-50' : 
                              isCompleted ? 'border-green-200 bg-green-50' :
                              isCancelled ? 'border-gray-200 bg-gray-50' :
                              'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Building className={`h-8 w-8 ${
                                  isPending ? 'text-red-400' : 
                                  isCompleted ? 'text-green-400' : 
                                  'text-gray-400'
                                }`} />
                                <div>
                                  <div className={`font-medium ${
                                    isPending ? 'text-red-700' : 
                                    isCompleted ? 'text-green-700' : 
                                    'text-gray-700'
                                  }`}>
                                    {interview.company_name}
                                  </div>
                                  <div className={`text-sm ${
                                    isPending ? 'text-red-600' : 
                                    isCompleted ? 'text-green-600' : 
                                    'text-gray-600'
                                  }`}>
                                    {interview.scheduled_date} {interview.scheduled_time}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {interview.interview_type}
                                    </Badge>
                                    {isPending && (
                                      <Badge variant="destructive" className="text-xs">
                                        確認待ち
                                      </Badge>
                                    )}
                                    {isCompleted && (
                                      <Badge variant="default" className="text-xs bg-green-600">
                                        参加済み
                                      </Badge>
                                    )}
                                    {isCancelled && (
                                      <Badge variant="secondary" className="text-xs">
                                        欠席
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {isPending && (
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                    onClick={() => updateInterviewAttendance(interview.id, true)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    参加した
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                    onClick={() => updateInterviewAttendance(interview.id, false)}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    欠席した
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Actions & Ads */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>クイックアクション</CardTitle>
                  <CardDescription>よく使用する機能へのショートカット</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/schedule">
                      <Button variant="outline" className="w-full h-16 flex flex-col bg-transparent">
                        <Calendar className="h-5 w-5 mb-1" />
                        <span className="text-xs">スケジュール</span>
                      </Button>
                    </Link>

                    <Link href="/mentoring">
                      <Button variant="outline" className="w-full h-16 flex flex-col bg-transparent">
                        <UserCheck className="h-5 w-5 mb-1" />
                        <span className="text-xs">面接指导予約</span>
                      </Button>
                    </Link>

                    <Link href="/profile">
                      <Button variant="outline" className="w-full h-16 flex flex-col bg-transparent">
                        <User className="h-5 w-5 mb-1" />
                        <span className="text-xs">プロフィール</span>
                      </Button>
                    </Link>

                    <Link href="/feedback">
                      <Button variant="outline" className="w-full h-16 flex flex-col bg-transparent">
                        <MessageSquare className="h-5 w-5 mb-1" />
                        <span className="text-xs">フィードバック</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Advertisements */}
              {advertisements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>求人情報</CardTitle>
                    <CardDescription>おすすめの求人をチェック</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {advertisements.map((ad) => (
                        <div key={ad.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start space-x-3">
                            {ad.image_url && (
                              <img
                                src={ad.image_url || "/placeholder.svg"}
                                alt={ad.title}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{ad.title}</h4>
                              <p className="text-xs text-gray-600 mt-1">{ad.company_name}</p>
                              {ad.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ad.description}</p>
                              )}
                              {ad.link_url && (
                                <a
                                  href={ad.link_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                >
                                  詳細を見る →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
