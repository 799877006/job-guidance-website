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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
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
import { createApplication } from "@/lib/application"
import { supabase, type Interview } from "@/lib/supabase"
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { useRouter } from "next/navigation"

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
  const router = useRouter()

  // 添加重定向逻辑
  useEffect(() => {
    if (profile?.role === 'instructor') {
      router.push('/instructor-dashboard')
    }
  }, [profile, router])

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
  const [pendingDeleteSchedule, setPendingDeleteSchedule] = useState<StudentSchedule | null>(null)

  useEffect(() => {
    if (!user?.id) return
    loadData()
  }, [selectedDate, user?.id, searchParams])

  const loadData = async () => {
    if (!user?.id) return
    
    try {
      // 获取周的开始和结束日期
      const startDate = format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'yyyy-MM-dd')
      const endDate = format(endOfWeek(selectedDate, { weekStartsOn: 0 }), 'yyyy-MM-dd')

      // 获取 student_schedule 表中的所有日程
      const schedule = await getStudentSchedule(user.id, startDate, endDate)

      // 获取 mentoring_bookings 表中的所有预约
      const { data: mentoringBookings } = await supabase
        .from('mentoring_bookings')
        .select('*')
        .eq('student_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)

      // 合并日程和预约
      const combinedSchedule = [
        ...(schedule || []),
        ...((mentoringBookings?.map(booking => ({
          id: booking.id,
          student_id: booking.student_id,
          date: booking.date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          schedule_type: 'mentoring',
          title: booking.subject,
          description: booking.description,
          location: '',
          color: '#3b82f6',
          application_id: null,
          created_at: booking.created_at || '',
          updated_at: booking.updated_at || '',
        })) || []) as StudentSchedule[])
      ]

      setMySchedule(combinedSchedule)
      setInterviews([])
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
      // 拼接完整的ISO日期时间字符串
      const startDateTime = `${scheduleForm.date}T${scheduleForm.startTime}:00`;
      const endDateTime = `${scheduleForm.date}T${scheduleForm.endTime}:00`;
      // if (scheduleForm.scheduleType === 'interview') {
      //   const { data: app } = await createApplication({
      //     user_id: user.id,
      //     first_interview_at: startDateTime,
      //     first_interview_end: endDateTime,
      //     second_interview_at: startDateTime,
      //     second_interview_end: endDateTime,
      //     final_interview_at: startDateTime,
      //     final_interview_end: endDateTime,
      //     offer_received_at: null,
      //     annual_salary: null,
      //     monthly_salary: null,
      //     benefits: [],
      //     location: null,
      //     work_hours: null,  
      //     other_conditions: null,
      //   })
      // }
      await createSchedule({
        student_id: user.id,
        date: scheduleForm.date,
        start_time: startDateTime,
        end_time: endDateTime,
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
      // 判断是否是面试日程（通过 schedule_type 和 application_id）
      if (editingSchedule.schedule_type === 'interview' && editingSchedule.application_id) {
        const applicationId = editingSchedule.application_id;
        let interviewType = '';
        if (editingSchedule.title.includes('一次')) interviewType = 'first';
        else if (editingSchedule.title.includes('二次')) interviewType = 'second';
        else if (editingSchedule.title.includes('最終')) interviewType = 'final';

        // 构建更新数据
        const updateData: any = {
          interview_location: scheduleForm.location || null,
          interview_notes: scheduleForm.description || null,
          interview_status: 'scheduled'
        };

        // 拼接完整的ISO日期时间字符串
        const startDateTime = `${scheduleForm.date}T${scheduleForm.startTime}:00`;
        // 更新对应的面试时间字段
        switch (interviewType) {
          case 'first':
            updateData.first_interview_at = startDateTime;
            break;
          case 'second':
            updateData.second_interview_at = startDateTime;
            break;
          case 'final':
            updateData.final_interview_at = startDateTime;
            break;
        }

        // 更新应聘记录
        const { error: updateError } = await supabase
          .from('applications')
          .update(updateData)
          .eq('id', applicationId);

        if (updateError) throw updateError;

        toast({
          title: "面接予定を更新しました",
          description: "面接の日時が更新されました",
        });
      } else {
        // 普通日程的更新
        const config = getScheduleTypeConfig(scheduleForm.scheduleType)
        // 拼接完整的ISO日期时间字符串
        const startDateTime = `${scheduleForm.date}T${scheduleForm.startTime}:00`;
        const endDateTime = `${scheduleForm.date}T${scheduleForm.endTime}:00`;
        await updateSchedule(editingSchedule.id, {
          date: scheduleForm.date,
          start_time: startDateTime,
          end_time: endDateTime,
          schedule_type: scheduleForm.scheduleType,
          title: scheduleForm.title,
          description: scheduleForm.description || undefined,
          location: scheduleForm.location || undefined,
          color: scheduleForm.color || config.color
        })

        toast({
          title: "スケジュールを更新しました",
          description: "時間予定が正常に更新されました",
        });
      }

      setIsDialogOpen(false)
      setEditingSchedule(null)
      resetForm()
      loadData()
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      toast({
        title: "更新に失敗しました",
        description: error.message,
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  const handleEditSchedule = async (schedule: StudentSchedule) => {
    // 判断是否是面试日程（通过 schedule_type 和 application_id）
    if (schedule.schedule_type === 'interview' && schedule.application_id) {
      const applicationId = schedule.application_id;
      let interviewType = '';
      if (schedule.title.includes('一次')) interviewType = 'first';
      else if (schedule.title.includes('二次')) interviewType = 'second';
      else if (schedule.title.includes('最終')) interviewType = 'final';
      // 查询 applications 表
      const { data: app } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();
      let startTime = '';
      let endTime = '';
      if (app) {
        if (interviewType === 'first') {
          startTime = app.first_interview_at ? app.first_interview_at.slice(11, 16) : '';
          endTime = app.first_interview_end ? app.first_interview_end.slice(11, 16) : '';
        } else if (interviewType === 'second') {
          startTime = app.second_interview_at ? app.second_interview_at.slice(11, 16) : '';
          endTime = app.second_interview_end ? app.second_interview_end.slice(11, 16) : '';
        } else if (interviewType === 'final') {
          startTime = app.final_interview_at ? app.final_interview_at.slice(11, 16) : '';
          endTime = app.final_interview_end ? app.final_interview_end.slice(11, 16) : '';
        }
      }
      setEditingSchedule(schedule);
      setScheduleForm({
        date: schedule.date,
        startTime,
        endTime,
        scheduleType: schedule.schedule_type,
        title: schedule.title,
        description: schedule.description || "",
        location: schedule.location || "",
        color: schedule.color
      });
      setIsDialogOpen(true);
      return;
    }

    // 检查是否是面试预约的日程（UUID格式）
    const isInterviewSchedule = interviews.find(i => i.id === schedule.id);
    
    if (isInterviewSchedule) {
      setEditingSchedule(schedule);
      setScheduleForm({
        date: schedule.date,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        scheduleType: schedule.schedule_type,
        title: schedule.title,
        description: schedule.description || "",
        location: schedule.location || "",
        color: schedule.color
      });
      setIsDialogOpen(true);
      return;
    }

    // 普通日程的编辑
    setEditingSchedule(schedule)
    setScheduleForm({
      date: schedule.date,
      startTime: schedule.start_time.slice(11, 16) || schedule.start_time.slice(0, 5),
      endTime: schedule.end_time.slice(11, 16) || schedule.end_time.slice(0, 5),
      scheduleType: schedule.schedule_type,
      title: schedule.title,
      description: schedule.description || "",
      location: schedule.location || "",
      color: schedule.color
    })
    setIsDialogOpen(true)
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const schedule = mySchedule.find(s => s.id === scheduleId);
      if (schedule && schedule.schedule_type === 'interview' && schedule.application_id) {
        let interviewType = '';
        if (schedule.title.includes('一次')) interviewType = 'first';
        else if (schedule.title.includes('二次')) interviewType = 'second';
        else if (schedule.title.includes('最終')) interviewType = 'final';
        const applicationId = schedule.application_id;
        // 不再直接confirm，交由AlertDialog处理
        // 构建更新数据
        const updateData: any = {
          interview_status: 'cancelled'
        };
        switch (interviewType) {
          case 'first':
            updateData.first_interview_at = null;
            updateData.status = '書類選考中';
            break;
          case 'second':
            updateData.second_interview_at = null;
            updateData.status = '一次面接完了';
            break;
          case 'final':
            updateData.final_interview_at = null;
            updateData.status = '二次面接完了';
            break;
        }
        // 更新应聘记录
        const { error: updateError } = await supabase
          .from('applications')
          .update(updateData)
          .eq('id', applicationId);
        if (updateError) throw updateError;
        await deleteSchedule(scheduleId);
        toast({
          title: "面接予定をキャンセルしました",
          description: "応募記録も更新されました",
        });
      } else {
        // 普通的日程删除
        await deleteSchedule(scheduleId);
        toast({
          title: "削除完了",
          description: "スケジュールを削除しました",
        });
      }
      loadData();
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "削除に失敗しました",
        description: error.message,
        variant: "destructive"
      });
    }
  };

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

  // 修改周历渲染部分，添加删除按钮
  const renderScheduleItem = (schedule: StudentSchedule) => {
    const config = getScheduleTypeConfig(schedule.schedule_type);
    const isInterview = schedule.schedule_type === 'interview' && schedule.application_id;
    const isMentoring = schedule.schedule_type === 'mentoring';
    
    return (
      <div 
        key={schedule.id} 
        className="text-xs p-1 rounded group relative"
        style={{ 
          backgroundColor: config.bgColor, 
          color: config.textColor,
          border: `1px solid ${config.color}`
        }}
      >
        <div className="font-medium">{schedule.start_time.slice(11, 16) || schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(11, 16) || schedule.end_time.slice(0, 5)}</div>
        <div className="truncate">{schedule.title}</div>
        {schedule.location && (
          <div className="truncate opacity-75">{schedule.location}</div>
        )}
        
        {/* 添加悬浮时显示的操作按钮 */}
        <div className="absolute top-0 right-0 hidden group-hover:flex gap-1 p-1">
          {isInterview ? (
            <>
              <button
                className="p-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/applications?id=${schedule.application_id}`;
                }}
                title="応募詳細へ"
              >
                <Edit className="h-3 w-3" />
              </button>
              <button
                className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDeleteSchedule(schedule);
                }}
                title="面接をキャンセル"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          ) : isMentoring ? (
            <button
              className="p-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/mentoring`;
              }}
              title="辅导予約詳細へ"
            >
              <BookOpen className="h-3 w-3" />
            </button>
          ) : (
            <>
              <button
                className="p-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditSchedule(schedule);
                }}
                title="編集"
              >
                <Edit className="h-3 w-3" />
              </button>
              <button
                className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDeleteSchedule(schedule);
                }}
                title="削除"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

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
                  予定面接: {interviews.filter(i => i.status === 'scheduled').length}
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
                <CardTitle className="text-sm font-medium text-gray-600">週間スケジュール</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{mySchedule.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">空き時間</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{mySchedule.filter(s => s.schedule_type === 'free').length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">忙しい時間</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{mySchedule.filter(s => s.schedule_type === 'busy').length + mySchedule.filter(s => s.schedule_type === 'class').length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">今後の面接</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{interviews.filter(i => i.status === 'scheduled').length}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="schedule">週間スケジュール</TabsTrigger>
              <TabsTrigger value="list">予定一覧</TabsTrigger>
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
                                {/* <SelectItem value="interview">面接</SelectItem> */}
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
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleDeleteSchedule(editingSchedule?.id || '')}
                              disabled={loading || !editingSchedule}
                            >
                              削除
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
                              {daySchedules.map((schedule) => renderScheduleItem(schedule))}
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
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        {/* 页面底部渲染AlertDialog */}
        <AlertDialog open={!!pendingDeleteSchedule} onOpenChange={open => { if (!open) setPendingDeleteSchedule(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>面接予定をキャンセルしますか？</AlertDialogTitle>
              <div className="text-sm text-muted-foreground">この操作は応募記録にも影響します。</div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingDeleteSchedule(null)}>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (pendingDeleteSchedule) {
                    await handleDeleteSchedule(pendingDeleteSchedule.id);
                    setPendingDeleteSchedule(null);
                  }
                }}
              >はい</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

