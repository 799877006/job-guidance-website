"use client"

import React, { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, ArrowLeft, Plus, Edit, Trash2, AlertCircle, BookOpen, CheckCircle, Users } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { 
  getStudentSchedule, 
  createSchedule, 
  updateSchedule, 
  deleteSchedule,
  getScheduleTypeConfig,
  type StudentSchedule,
  type ScheduleType 
} from "@/lib/student-schedule"
import { supabase, type Interview } from "@/lib/supabase"
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns"
import { ja } from "date-fns/locale"

// 加载状态组件
function LoadingState() {
  return (
    <div className="container mx-auto p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-[600px] bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

// 主要内容组件
function StudentScheduleContent() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState("schedule")
  const [mySchedule, setMySchedule] = useState<StudentSchedule[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [scheduleForm, setScheduleForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: "09:00",
    endTime: "10:00",
    scheduleType: 'free' as ScheduleType,
    title: "",
    description: "",
    location: "",
    color: "#10b981"
  })
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<StudentSchedule | null>(null)

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    if (!user?.id) return
    
    try {
      // 获取我的时间表
      const startDate = format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'yyyy-MM-dd')
      const endDate = format(endOfWeek(selectedDate, { weekStartsOn: 0 }), 'yyyy-MM-dd')
      const schedule = await getStudentSchedule(user.id, startDate, endDate)
      setMySchedule(schedule || [])

      // 获取面试信息
      const { data: interviewData } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", user.id)
        .gte("scheduled_date", startDate)
        .lte("scheduled_date", endDate)
        .order("scheduled_date", { ascending: true })

      setInterviews(interviewData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "エラー",
        description: "データの読み込みに失敗しました",
        variant: "destructive"
      })
    }
  }

  // 等待用户信息加载
  if (!user || !profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 如果用户不是学生，显示提示
  if (profile.role !== 'student') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium">アクセス権限がありません</h3>
              <p className="text-muted-foreground">このページは学生のみアクセス可能です。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCreateSchedule = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const config = getScheduleTypeConfig(scheduleForm.scheduleType)
      await createSchedule({
        student_id: user.id,
        date: scheduleForm.date,
        start_time: scheduleForm.startTime,
        end_time: scheduleForm.endTime,
        schedule_type: scheduleForm.scheduleType,
        title: scheduleForm.title,
        description: scheduleForm.description || undefined,
        location: scheduleForm.location || undefined,
        color: scheduleForm.color || config.color
      })

      toast({
        title: "スケジュールを追加しました",
        description: "新しい時間予定が追加されました",
      })

      setIsDialogOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      toast({
        title: "追加に失敗しました",
        description: error.message,
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  const handleUpdateSchedule = async () => {
    if (!user?.id || !editingSchedule) return

    setLoading(true)
    try {
      const config = getScheduleTypeConfig(scheduleForm.scheduleType)
      await updateSchedule(editingSchedule.id, {
        date: scheduleForm.date,
        start_time: scheduleForm.startTime,
        end_time: scheduleForm.endTime,
        schedule_type: scheduleForm.scheduleType,
        title: scheduleForm.title,
        description: scheduleForm.description || undefined,
        location: scheduleForm.location || undefined,
        color: scheduleForm.color || config.color
      })

      toast({
        title: "スケジュールを更新しました",
        description: "時間予定が正常に更新されました",
      })

      setIsDialogOpen(false)
      setEditingSchedule(null)
      resetForm()
      loadData()
    } catch (error: any) {
      toast({
        title: "更新に失敗しました",
        description: error.message,
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("このスケジュールを削除しますか？")) return

    try {
      await deleteSchedule(scheduleId)
      toast({
        title: "削除完了",
        description: "スケジュールを削除しました",
      })
      loadData()
    } catch (error: any) {
      toast({
        title: "削除に失敗しました",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleEditSchedule = (schedule: StudentSchedule) => {
    setEditingSchedule(schedule)
    setScheduleForm({
      date: schedule.date,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      scheduleType: schedule.schedule_type,
      title: schedule.title,
      description: schedule.description || "",
      location: schedule.location || "",
      color: schedule.color
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setScheduleForm({
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: "09:00",
      endTime: "10:00",
      scheduleType: 'free',
      title: "",
      description: "",
      location: "",
      color: "#10b981"
    })
    setEditingSchedule(null)
  }

  const handleScheduleTypeChange = (value: ScheduleType) => {
    const config = getScheduleTypeConfig(value)
    setScheduleForm(prev => ({
      ...prev,
      scheduleType: value,
      color: config.color
    }))
  }

  // 周历生成
  const generateWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 })
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i))
    }
    return days
  }

  // 获取状态标识
  const getStatusBadge = (type: ScheduleType) => {
    const config = getScheduleTypeConfig(type)
    return (
      <Badge 
        style={{ 
          backgroundColor: config.bgColor, 
          color: config.textColor,
          border: `1px solid ${config.color}`
        }}
      >
        {config.label}
      </Badge>
    )
  }

  // 统计信息
  const stats = {
    totalSchedules: mySchedule.length,
    freeTime: mySchedule.filter(s => s.schedule_type === 'free').length,
    busyTime: mySchedule.filter(s => s.schedule_type === 'busy').length + 
              mySchedule.filter(s => s.schedule_type === 'class').length + 
              mySchedule.filter(s => s.schedule_type === 'interview').length,
    upcomingInterviews: interviews.filter(i => i.status === 'scheduled').length
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="mr-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    戻る
                  </Button>
                </Link>
                <h1 className="text-xl font-bold">時間管理</h1>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  予定面接: {stats.upcomingInterviews}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">総スケジュール</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalSchedules}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">空き時間</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.freeTime}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">忙しい時間</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.busyTime}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">今後の面接</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.upcomingInterviews}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="schedule">週間スケジュール</TabsTrigger>
              <TabsTrigger value="list">予定一覧</TabsTrigger>
              <TabsTrigger value="interviews">面接管理</TabsTrigger>
            </TabsList>

            {/* 周间日程管理 */}
            <TabsContent value="schedule" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      週間時間管理
                    </CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                          <Plus className="h-4 w-4 mr-2" />
                          予定を追加
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {editingSchedule ? "予定を編集" : "新しい予定を追加"}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="date">日付</Label>
                            <Input
                              id="date"
                              type="date"
                              value={scheduleForm.date}
                              onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                              min={format(new Date(), 'yyyy-MM-dd')}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="startTime">開始時間</Label>
                              <Input
                                id="startTime"
                                type="time"
                                value={scheduleForm.startTime}
                                onChange={(e) => setScheduleForm(prev => ({ ...prev, startTime: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="endTime">終了時間</Label>
                              <Input
                                id="endTime"
                                type="time"
                                value={scheduleForm.endTime}
                                onChange={(e) => setScheduleForm(prev => ({ ...prev, endTime: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="scheduleType">予定タイプ</Label>
                            <Select
                              value={scheduleForm.scheduleType}
                              onValueChange={handleScheduleTypeChange}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">空き時間</SelectItem>
                                <SelectItem value="busy">忙しい</SelectItem>
                                <SelectItem value="class">授業</SelectItem>
                                <SelectItem value="interview">面接</SelectItem>
                                <SelectItem value="other">その他</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="title">タイトル</Label>
                            <Input
                              id="title"
                              value={scheduleForm.title}
                              onChange={(e) => setScheduleForm(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="例：データベース講義、面接準備など"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="location">場所（オプション）</Label>
                            <Input
                              id="location"
                              value={scheduleForm.location}
                              onChange={(e) => setScheduleForm(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="例：第一講義室、オンライン会議など"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">詳細（オプション）</Label>
                            <Textarea
                              id="description"
                              value={scheduleForm.description}
                              onChange={(e) => setScheduleForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="追加の詳細情報"
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setIsDialogOpen(false)
                                resetForm()
                              }}
                            >
                              キャンセル
                            </Button>
                            <Button
                              className="flex-1"
                              onClick={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
                              disabled={loading || !scheduleForm.title}
                            >
                              {loading ? "保存中..." : editingSchedule ? "更新" : "追加"}
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
                      const daySchedules = mySchedule.filter(schedule => schedule.date === dayStr)
                      const dayInterviews = interviews.filter(interview => interview.scheduled_date === dayStr)
                      
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
                            
                            {/* 时间安排 */}
                            <div className="space-y-1">
                              {daySchedules.map((schedule) => {
                                const config = getScheduleTypeConfig(schedule.schedule_type)
                                return (
                                  <div 
                                    key={schedule.id} 
                                    className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                                    style={{ 
                                      backgroundColor: config.bgColor, 
                                      color: config.textColor,
                                      border: `1px solid ${config.color}`
                                    }}
                                    onClick={() => handleEditSchedule(schedule)}
                                  >
                                    <div className="font-medium">{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</div>
                                    <div className="truncate">{schedule.title}</div>
                                    {schedule.location && (
                                      <div className="truncate opacity-75">{schedule.location}</div>
                                    )}
                                  </div>
                                )
                              })}
                              
                              {/* 面试信息 */}
                              {dayInterviews.map((interview) => (
                                <div key={interview.id} className="text-xs p-1 bg-purple-100 text-purple-800 rounded border border-purple-300">
                                  <div className="font-medium">{interview.scheduled_time}</div>
                                  <div className="truncate">{interview.company_name}</div>
                                  <div className="truncate opacity-75">{interview.interview_type}</div>
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

            {/* 预定一览 */}
            <TabsContent value="list" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    全ての予定
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mySchedule.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      まだ予定がありません
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mySchedule
                        .sort((a, b) => `${a.date} ${a.start_time}`.localeCompare(`${b.date} ${b.start_time}`))
                        .map((schedule) => (
                        <Card key={schedule.id} className="border-l-4" style={{ borderLeftColor: schedule.color }}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="font-medium">{schedule.title}</div>
                                  {getStatusBadge(schedule.schedule_type)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {format(parseISO(schedule.date), 'yyyy年MM月dd日', { locale: ja })} {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                                </div>
                                {schedule.location && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    📍 {schedule.location}
                                  </div>
                                )}
                                {schedule.description && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {schedule.description}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSchedule(schedule)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 面试管理 */}
            <TabsContent value="interviews" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      面接スケジュール
                    </CardTitle>
                    <Link href="/schedule-interview">
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        面接を予約
                      </Button>
                    </Link>
                  </div>
                  <CardDescription>
                    面接予定は自動的にスケジュールに反映されます
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {interviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      まだ面接予定がありません
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {interviews
                        .sort((a, b) => `${a.scheduled_date} ${a.scheduled_time}`.localeCompare(`${b.scheduled_date} ${b.scheduled_time}`))
                        .map((interview) => (
                        <Card key={interview.id} className="border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-purple-900">{interview.company_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(parseISO(interview.scheduled_date), 'yyyy年MM月dd日', { locale: ja })} {interview.scheduled_time}
                                </div>
                                <div className="text-sm text-purple-700 mt-1">
                                  {interview.interview_type}
                                </div>
                                {interview.notes && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {interview.notes}
                                  </div>
                                )}
                              </div>
                              <Badge 
                                variant={interview.status === 'scheduled' ? 'default' : 'secondary'}
                                className={interview.status === 'scheduled' ? 'bg-purple-100 text-purple-800' : ''}
                              >
                                {interview.status === 'scheduled' ? '予定' : 
                                 interview.status === 'completed' ? '完了' : 
                                 interview.status === 'cancelled' ? 'キャンセル' : interview.status}
                              </Badge>
                            </div>
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
      </div>
    </ProtectedRoute>
  )
}

// 主页面组件
export default function StudentSchedulePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StudentScheduleContent />
    </Suspense>
  );
}
