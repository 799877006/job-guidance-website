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
import { supabase, type Interview } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function ScheduleInterviewPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)
  const [formData, setFormData] = useState({
    company_name: "",
    interview_type: "",
    scheduled_date: "",
    scheduled_time: "",
    notes: "",
  })

  useEffect(() => {
    if (user) {
      fetchInterviews()
    }
  }, [user])

  const fetchInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", user!.id)
        .order("scheduled_date", { ascending: false })

      if (error) throw error
      setInterviews(data || [])
    } catch (error) {
      console.error("Error fetching interviews:", error)
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
      if (editingInterview) {
        // Update existing interview
        const { error } = await supabase
          .from("interviews")
          .update({
            company_name: formData.company_name,
            interview_type: formData.interview_type,
            scheduled_date: formData.scheduled_date,
            scheduled_time: formData.scheduled_time,
            notes: formData.notes,
          })
          .eq("id", editingInterview.id)

        if (error) throw error
        toast({
          title: "更新完了",
          description: "面接情報を更新しました",
        })
      } else {
        // Create new interview
        const { error } = await supabase.from("interviews").insert([
          {
            user_id: user!.id,
            company_name: formData.company_name,
            interview_type: formData.interview_type,
            scheduled_date: formData.scheduled_date,
            scheduled_time: formData.scheduled_time,
            notes: formData.notes,
            status: "scheduled",
          },
        ])

        if (error) throw error
        toast({
          title: "予約完了",
          description: "面接を予約しました",
        })
      }

      setDialogOpen(false)
      setEditingInterview(null)
      setFormData({
        company_name: "",
        interview_type: "",
        scheduled_date: "",
        scheduled_time: "",
        notes: "",
      })
      fetchInterviews()
    } catch (error) {
      console.error("Error saving interview:", error)
      toast({
        title: "エラー",
        description: "面接の保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (interview: Interview) => {
    setEditingInterview(interview)
    setFormData({
      company_name: interview.company_name,
      interview_type: interview.interview_type,
      scheduled_date: interview.scheduled_date,
      scheduled_time: interview.scheduled_time,
      notes: interview.notes || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この面接を削除しますか？")) return

    try {
      const { error } = await supabase.from("interviews").delete().eq("id", id)

      if (error) throw error
      toast({
        title: "削除完了",
        description: "面接を削除しました",
      })
      fetchInterviews()
    } catch (error) {
      console.error("Error deleting interview:", error)
      toast({
        title: "エラー",
        description: "面接の削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">予定</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">完了</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">キャンセル</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const stats = {
    total: interviews.length,
    scheduled: interviews.filter((i) => i.status === "scheduled").length,
    completed: interviews.filter((i) => i.status === "completed").length,
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
                      setEditingInterview(null)
                      setFormData({
                        company_name: "",
                        interview_type: "",
                        scheduled_date: "",
                        scheduled_time: "",
                        notes: "",
                      })
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新規面接予約
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingInterview ? "面接情報編集" : "新規面接予約"}</DialogTitle>
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
                          <SelectItem value="グループ面接">グループ面接</SelectItem>
                          <SelectItem value="オンライン面接">オンライン面接</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label htmlFor="time">面接時間 *</Label>
                        <Input
                          id="time"
                          type="time"
                          value={formData.scheduled_time}
                          onChange={(e) => setFormData((prev) => ({ ...prev, scheduled_time: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">メモ</Label>
                      <Textarea
                        id="notes"
                        placeholder="面接に関するメモや準備事項"
                        value={formData.notes}
                        onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingInterview ? "更新" : "予約を追加"}
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
              {interviews.length > 0 ? (
                <div className="space-y-4">
                  {interviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Building className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{interview.company_name}</div>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            {interview.scheduled_date}
                            <Clock className="h-4 w-4 ml-3 mr-1" />
                            {interview.scheduled_time}
                          </div>
                          {interview.notes && <div className="text-sm text-gray-500 mt-1">{interview.notes}</div>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{interview.interview_type}</Badge>
                        {getStatusBadge(interview.status)}
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(interview)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(interview.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
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
    </ProtectedRoute>
  )
} 