"use client"

import React, { Suspense, useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, User, BookOpen, CheckCircle, XCircle, AlertCircle, Plus, Settings, Users, TrendingUp, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  getInstructorAvailability, 
  createAvailability, 
  updateAvailability, 
  deleteAvailability,
  getInstructorBookings,
  getPendingBookings,
  updateBookingStatus 
} from "@/lib/mentoring"
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Availability {
  id: string
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  notes: string | null
}

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

// 加载状态组件
function LoadingState() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-[600px] bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

// 主要内容组件
function InstructorDashboardContent() {
  const { user, profile, signOut } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState("schedule")
  const [myAvailability, setMyAvailability] = useState<Availability[]>([])
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([])
  const [availabilityForm, setAvailabilityForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: "09:00",
    endTime: "10:00",
    notes: ""
  })
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 添加登出处理函数
  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "ログアウト",
        description: "正常にログアウトしました",
      })
      router.push('/login')
    } catch (error) {
      toast({
        title: "エラー",
        description: "ログアウトに失敗しました",
        variant: "destructive",
      })
    }
  }

  const loadData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      // 获取我的可用时间
      const startDate = format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'yyyy-MM-dd')
      const endDate = format(endOfWeek(selectedDate, { weekStartsOn: 0 }), 'yyyy-MM-dd')
      const availability = await getInstructorAvailability(user.id, startDate, endDate)
      setMyAvailability(availability || [])

      // 获取我的预约
      const bookings = await getInstructorBookings(user.id)
      setMyBookings(bookings || [])

      // 获取待处理的预约
      const pending = await getPendingBookings(user.id)
      setPendingBookings(pending || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, [user?.id, selectedDate])

  // 处理URL参数，设置默认标签
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['schedule', 'bookings', 'pending'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 如果用户不是导师，显示提示
  if (profile?.role !== 'instructor') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium">アクセス権限がありません</h3>
              <p className="text-muted-foreground">このページは指導者のみアクセス可能です。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCreateAvailability = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      await createAvailability({
        instructor_id: user.id,
        date: availabilityForm.date,
        start_time: availabilityForm.startTime,
        end_time: availabilityForm.endTime,
        notes: availabilityForm.notes || null,
        is_available: true
      })

      toast({
        title: "空き時間を追加しました",
        description: "学生が予約できるようになりました",
      })

      setIsDialogOpen(false)
      setAvailabilityForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: "09:00",
        endTime: "10:00",
        notes: ""
      })
      loadData()
    } catch (error: any) {
      toast({
        title: "追加に失敗しました",
        description: error.message || "時間帯の追加中にエラーが発生しました",
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'rejected', notes?: string) => {
    setLoading(true)
    try {
      await updateBookingStatus(bookingId, action, notes)
      
      toast({
        title: action === 'confirmed' ? "予約を承認しました" : "予約を拒否しました",
        description: action === 'confirmed' ? "学生に通知されます。この時間帯は他の予約を受け付けません。" : "学生に拒否理由が通知されます",
      })

      loadData()
    } catch (error: any) {
      toast({
        title: "操作に失敗しました",
        description: error.message || "予約のステータス更新中にエラーが発生しました",
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "確認待ち", variant: "secondary" as const, icon: AlertCircle },
      confirmed: { label: "確定", variant: "default" as const, icon: CheckCircle },
      completed: { label: "完了", variant: "secondary" as const, icon: CheckCircle },
      cancelled: { label: "キャンセル", variant: "destructive" as const, icon: XCircle },
      rejected: { label: "拒否", variant: "destructive" as const, icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // 週のカレンダー生成
  const generateWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 })
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i))
    }
    return days
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">指导者ダッシュボード</h1>
          <p className="text-muted-foreground">予約管理と空き時間の設定</p>
        </div>
        <div className="flex gap-2 items-center">
          <Link href="/instructor-profile">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              プロフィール
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            ログアウト
          </Button>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            待機中: {pendingBookings.length}
          </Badge>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">今月の指導回数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {myBookings.filter(b => 
                b.status === 'completed' && 
                new Date(b.date).getMonth() === new Date().getMonth()
              ).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              今月の実績
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">予約待ち</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingBookings.length}</div>
            <p className="text-xs text-gray-500 mt-1">承認待ちの予約</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">今後の予約</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {myBookings.filter(b => 
                b.status === 'confirmed' && 
                new Date(b.date) > new Date()
              ).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">確定済みの予約</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">空き時間枠</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{myAvailability.length}</div>
            <p className="text-xs text-gray-500 mt-1">予約可能な時間枠</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="schedule">スケジュール管理</TabsTrigger>
          <TabsTrigger value="bookings">予約一覧</TabsTrigger>
          <TabsTrigger value="pending">待機中の予約</TabsTrigger>
        </TabsList>

        {/* 日程管理 */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  空き時間管理
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      空き時間を追加
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>空き時間の追加</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">日付</Label>
                        <Input
                          id="date"
                          type="date"
                          value={availabilityForm.date}
                          onChange={(e) => setAvailabilityForm(prev => ({ ...prev, date: e.target.value }))}
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startTime">開始時間</Label>
                          <Input
                            id="startTime"
                            type="time"
                            value={availabilityForm.startTime}
                            onChange={(e) => setAvailabilityForm(prev => ({ ...prev, startTime: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endTime">終了時間</Label>
                          <Input
                            id="endTime"
                            type="time"
                            value={availabilityForm.endTime}
                            onChange={(e) => setAvailabilityForm(prev => ({ ...prev, endTime: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">備考</Label>
                        <Textarea
                          id="notes"
                          value={availabilityForm.notes}
                          onChange={(e) => setAvailabilityForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="特別な条件や注意事項があれば記入してください"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          キャンセル
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleCreateAvailability}
                          disabled={loading}
                        >
                          {loading ? "追加中..." : "追加"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* 周导航 */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                >
                  前の週
                </Button>
                <h3 className="text-lg font-medium">
                  {format(selectedDate, 'yyyy年MM月', { locale: ja })}
                </h3>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                >
                  次の週
                </Button>
              </div>

              {/* 周历 */}
              <div className="grid grid-cols-7 gap-4">
                {generateWeekDays().map((day, index) => {
                  const dayStr = format(day, 'yyyy-MM-dd')
                  const dayAvailability = myAvailability.filter(av => av.date === dayStr)
                  const dayBookings = myBookings.filter(booking => booking.date === dayStr)
                  
                  return (
                    <Card key={index} className={`${isSameDay(day, selectedDate) ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-3">
                        <div className="text-center mb-3">
                          <div className="text-sm font-medium">
                            {format(day, 'EEE', { locale: ja })}
                          </div>
                          <div className="text-lg">
                            {format(day, 'd')}
                          </div>
                        </div>
                        
                        {/* 可用时间段 */}
                        <div className="space-y-1">
                          {dayAvailability.map((av) => (
                            <div key={av.id} className="text-xs p-1 bg-green-100 text-green-800 rounded">
                              {av.start_time.slice(0, 5)} - {av.end_time.slice(0, 5)}
                            </div>
                          ))}
                          
                          {/* 已预约时间段 */}
                          {dayBookings.filter(b => b.status === 'confirmed').map((booking) => (
                            <div key={booking.id} className="text-xs p-1 bg-blue-100 text-blue-800 rounded">
                              {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                              <div className="truncate">{booking.student.full_name}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 预约一览 */}
        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                全ての予約
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  まだ予約がありません
                </div>
              ) : (
                <div className="space-y-4">
                  {myBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={booking.student.avatar_url || undefined} />
                              <AvatarFallback>
                                {booking.student.full_name?.charAt(0) || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{booking.student.full_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {booking.student.university} - {booking.student.major}
                              </div>
                              <div className="text-sm font-medium mt-1">{booking.subject}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(parseISO(booking.date), 'yyyy年MM月dd日', { locale: ja })} {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                        
                        {booking.description && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <div className="text-sm font-medium mb-1">相談内容:</div>
                            <div className="text-sm">{booking.description}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 待处理的预约 */}
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                待機中の予約リクエスト
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  新しい予約リクエストはありません
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingBookings.map((booking) => (
                    <Card key={booking.id} className="border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={booking.student.avatar_url || undefined} />
                              <AvatarFallback>
                                {booking.student.full_name?.charAt(0) || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{booking.student.full_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {booking.student.university} - {booking.student.major}
                              </div>
                              <div className="text-sm font-medium mt-1">{booking.subject}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(parseISO(booking.date), 'yyyy年MM月dd日', { locale: ja })} {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBookingAction(booking.id, 'rejected', '都合が悪いため')}
                              disabled={loading}
                            >
                              拒否
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleBookingAction(booking.id, 'confirmed')}
                              disabled={loading}
                            >
                              承認
                            </Button>
                          </div>
                        </div>
                        
                        {booking.description && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <div className="text-sm font-medium mb-1">相談内容:</div>
                            <div className="text-sm">{booking.description}</div>
                          </div>
                        )}

                        {booking.student_notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium mb-1">学生からの要望:</div>
                            <div className="text-sm">{booking.student_notes}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 主页面组件
export default function InstructorDashboard() {
  return (
    <Suspense fallback={<LoadingState />}>
      <InstructorDashboardContent />
    </Suspense>
  );
} 