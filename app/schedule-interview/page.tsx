"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, Clock, Building, ArrowLeft, Plus, Edit, Trash2 } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/services/supabase"
import { useToast } from "@/hooks/use-toast"
import { Application, ApplicationStatus } from "@/lib/types/application"
import { format } from "date-fns"
import { createSchedule, updateSchedule } from "@/lib/services/student-schedule"

export default function ScheduleInterviewPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [formData, setFormData] = useState({
    company_name: "",
    position: "",
    interview_type: "",
    scheduled_date: "",
    start_time: "", // 新增
    end_time: "",   // 新增
    interview_notes: "",
    interview_location: "",
  })
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user])

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error("Error fetching applications:", error)
      toast({
        title: "エラー",
        description: "面接データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const interviewStartDateTime = `${formData.scheduled_date}T${formData.start_time}:00`;
      const interviewEndDateTime = `${formData.scheduled_date}T${formData.end_time}:00`;
      let updateData: any = {
        company_name: formData.company_name,
        position: formData.position,
        interview_notes: formData.interview_notes,
        interview_location: formData.interview_location,
        interview_status: 'scheduled'
      };

      // 根据面试类型设置对应的面试时间和状态
      switch (formData.interview_type) {
        case '一次面接':
          updateData.first_interview_at = interviewStartDateTime;
          updateData.first_interview_end = interviewEndDateTime;
          updateData.status = '一次面接待ち';
          break;
        case '二次面接':
          updateData.second_interview_at = interviewStartDateTime;
          updateData.second_interview_end = interviewEndDateTime;
          updateData.status = '二次面接待ち';
          break;
        case '最終面接':
          updateData.final_interview_at = interviewStartDateTime;
          updateData.final_interview_end = interviewEndDateTime;
          updateData.status = '最終面接待ち';
          break;
      }

      if (editingApplication) {
        // 更新现有应聘记录
        const { error } = await supabase
          .from("applications")
          .update(updateData)
          .eq("id", editingApplication.id)

        updateSchedule(editingApplication.id, {
          title: updateData.status,
          start_time: updateData.first_interview_at,
        })
        
          if (error) throw error
        toast({
          title: "更新完了",
          description: "面接情報を更新しました",
        })
      } else {
        // 创建新的应聘记录
        updateData.user_id = user!.id;
        updateData.applied_at = new Date().toISOString();
        
        const { error } = await supabase
          .from("applications")
          .insert([updateData])
        // 同步到日程表
        createSchedule({
          student_id: user!.id,
          date: formData.scheduled_date,
          start_time: interviewStartDateTime,
          end_time: interviewEndDateTime,
          schedule_type: "interview",
          title: formData.interview_type,
        })
        
        if (error) throw error
        toast({
          title: "予約完了",
          description: "面接を予約しました",
        })
      }

      setDialogOpen(false)
      setEditingApplication(null)
      setFormData({
        company_name: "",
        position: "",
        interview_type: "",
        scheduled_date: "",
        start_time: "",
        end_time: "",
        interview_notes: "",
        interview_location: "",
      })
      fetchApplications()
    } catch (error) {
      console.error("Error saving application:", error)
      toast({
        title: "エラー",
        description: "面接の保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (application: Application) => {
    setEditingApplication(application)
    // 确定面试类型和时间
    let interview_type = "";
    let scheduled_date = "";
    let start_time = "";
    let end_time = "";
    
    if (application.first_interview_at) {
      interview_type = "一次面接";
      const date = new Date(application.first_interview_at);
      scheduled_date = format(date, "yyyy-MM-dd");
      start_time = format(date, "HH:mm");
      end_time = application.first_interview_end ? format(new Date(application.first_interview_end), "HH:mm") : "";
    } else if (application.second_interview_at) {
      interview_type = "二次面接";
      const date = new Date(application.second_interview_at);
      scheduled_date = format(date, "yyyy-MM-dd");
      start_time = format(date, "HH:mm");
      end_time = application.second_interview_end ? format(new Date(application.second_interview_end), "HH:mm") : "";
    } else if (application.final_interview_at) {
      interview_type = "最終面接";
      const date = new Date(application.final_interview_at);
      scheduled_date = format(date, "yyyy-MM-dd");
      start_time = format(date, "HH:mm");
      end_time = application.final_interview_end ? format(new Date(application.final_interview_end), "HH:mm") : "";
    }

    setFormData({
      company_name: application.company_name,
      position: application.position || "",
      interview_type,
      scheduled_date,
      start_time,
      end_time,
      interview_notes: application.interview_notes || "",
      interview_location: application.interview_location || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast({
        title: "削除完了",
        description: "面接を削除しました",
      })
      fetchApplications()
    } catch (error) {
      console.error("Error deleting application:", error)
      toast({
        title: "エラー",
        description: "面接の削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case '一次面接待ち':
      case '二次面接待ち':
      case '最終面接待ち':
        return <Badge className="bg-blue-100 text-blue-800">予定</Badge>
      case '一次面接完了':
      case '二次面接完了':
      case '最終面接完了':
        return <Badge className="bg-green-100 text-green-800">完了</Badge>
      case '内定':
        return <Badge className="bg-purple-100 text-purple-800">内定</Badge>
      case '不合格':
        return <Badge className="bg-red-100 text-red-800">不合格</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getInterviewDateTime = (application: Application) => {
    if (application.first_interview_at) {
      return {
        date: format(new Date(application.first_interview_at), "yyyy-MM-dd"),
        start_time: format(new Date(application.first_interview_at), "HH:mm"),
        end_time: application.first_interview_end ? format(new Date(application.first_interview_end), "HH:mm") : "",
        type: "一次面接"
      };
    }
    if (application.second_interview_at) {
      return {
        date: format(new Date(application.second_interview_at), "yyyy-MM-dd"),
        start_time: format(new Date(application.second_interview_at), "HH:mm"),
        end_time: application.second_interview_end ? format(new Date(application.second_interview_end), "HH:mm") : "",
        type: "二次面接"
      };
    }
    if (application.final_interview_at) {
      return {
        date: format(new Date(application.final_interview_at), "yyyy-MM-dd"),
        start_time: format(new Date(application.final_interview_at), "HH:mm"),
        end_time: application.final_interview_end ? format(new Date(application.final_interview_end), "HH:mm") : "",
        type: "最終面接"
      };
    }
    return null;
  }

  // 只获取有面试的应聘记录
  const interviewApplications = applications.filter(
    app => app.first_interview_at || app.second_interview_at || app.final_interview_at
  );

  const stats = {
    total: interviewApplications.length,
    scheduled: interviewApplications.filter((a) => 
      a.status === '一次面接待ち' || 
      a.status === '二次面接待ち' || 
      a.status === '最終面接待ち'
    ).length,
    completed: interviewApplications.filter((a) => 
      a.status === '一次面接完了' || 
      a.status === '二次面接完了' || 
      a.status === '最終面接完了' || 
      a.status === '内定'
    ).length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center">
                <Link href="/schedule">
                  <Button variant="ghost" size="sm" className="mr-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    時間管理に戻る
                  </Button>
                </Link>
                <h1 className="text-xl font-bold">面接スケジュール管理</h1>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingApplication(null)
                      setFormData({
                        company_name: "",
                        position: "",
                        interview_type: "",
                        scheduled_date: "",
                        start_time: "",
                        end_time: "",
                        interview_notes: "",
                        interview_location: "",
                      })
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新規面接予約
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingApplication ? "面接情報編集" : "新規面接予約"}</DialogTitle>
                    <DialogDescription>面接の詳細情報を入力してください</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">会社名 *</Label>
                      <Input
                        id="company"
                        placeholder="株式会社○○"
                        value={formData.company_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, company_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">職種 *</Label>
                      <Input
                        id="position"
                        placeholder="エンジニア"
                        value={formData.position}
                        onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">面接種類 *</Label>
                      <Select
                        value={formData.interview_type}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, interview_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="一次面接">一次面接</SelectItem>
                          <SelectItem value="二次面接">二次面接</SelectItem>
                          <SelectItem value="最終面接">最終面接</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">面接日 *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.scheduled_date}
                          onChange={(e) => setFormData((prev) => ({ ...prev, scheduled_date: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="start_time">面接開始時間 *</Label>
                        <Input
                          id="start_time"
                          type="time"
                          value={formData.start_time}
                          onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_time">面接終了時間 *</Label>
                        <Input
                          id="end_time"
                          type="time"
                          value={formData.end_time}
                          onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">面接場所</Label>
                      <Input
                        id="location"
                        placeholder="東京都渋谷区..."
                        value={formData.interview_location}
                        onChange={(e) => setFormData((prev) => ({ ...prev, interview_location: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">メモ</Label>
                      <Textarea
                        id="notes"
                        placeholder="面接に関するメモや準備事項"
                        value={formData.interview_notes}
                        onChange={(e) => setFormData((prev) => ({ ...prev, interview_notes: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingApplication ? "更新" : "予約を追加"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">総面接数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">予定中の面接</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.scheduled}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">完了した面接</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Interview List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                面接一覧
              </CardTitle>
              <CardDescription>すべての面接予定と履歴</CardDescription>
            </CardHeader>
            <CardContent>
              {interviewApplications.length > 0 ? (
                <div className="space-y-4">
                  {interviewApplications.map((application) => {
                    const interviewInfo = getInterviewDateTime(application);
                    if (!interviewInfo) return null;

                    return (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <Building className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{application.company_name}</div>
                            <div className="text-sm text-gray-600">{application.position}</div>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              {interviewInfo.date}
                              <Clock className="h-4 w-4 ml-3 mr-1" />
                              {interviewInfo.start_time} ~ {interviewInfo.end_time}
                            </div>
                            {application.interview_location && (
                              <div className="text-sm text-gray-500 mt-1">📍 {application.interview_location}</div>
                            )}
                            {application.interview_notes && (
                              <div className="text-sm text-gray-500 mt-1">{application.interview_notes}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{interviewInfo.type}</Badge>
                          {getStatusBadge(application.status)}
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(application)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(application.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">面接予定がありません</p>
                  <p className="text-sm mb-4">最初の面接を予約してみましょう</p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    面接を予約する
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 提示信息 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">💡 ヒント</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 面接予定は自動的に<Link href="/schedule" className="text-blue-600 hover:underline">時間管理</Link>にも表示されます</p>
                <p>• 面接時間と授業時間の重複がないか確認しましょう</p>
                <p>• 面接後は参加状況を時間管理ページで更新できます</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* 页面底部渲染AlertDialog */}
      <AlertDialog open={!!pendingDeleteId} onOpenChange={open => { if (!open) setPendingDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この面接を削除しますか？</AlertDialogTitle>
            <div className="text-sm text-muted-foreground">この操作は元に戻せません。</div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeleteId(null)}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (pendingDeleteId) {
                  await handleDelete(pendingDeleteId);
                  setPendingDeleteId(null);
                }
              }}
            >はい</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  )
} 