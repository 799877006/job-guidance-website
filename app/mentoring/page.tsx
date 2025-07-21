"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, User, BookOpen, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAvailableInstructors, getInstructors, createBooking, getStudentBookings } from "@/lib/mentoring"
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns"
import { ja } from "date-fns/locale"

interface Instructor {
  id: string
  full_name: string
  bio: string | null
  avatar_url: string | null
  university: string | null
}

interface TimeSlot {
  id: string
  instructor_id: string
  date: string
  start_time: string
  end_time: string
  profiles: Instructor
}

interface Booking {
  id: string
  date: string
  start_time: string
  end_time: string
  subject: string
  status: string
  instructor: {
    full_name: string
    avatar_url: string | null
  }
}

export default function MentoringPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [bookingForm, setBookingForm] = useState({
    subject: "",
    description: "",
    studentNotes: ""
  })
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (profile?.role === 'student') {
      loadAvailableSlots()
      loadMyBookings()
    }
  }, [selectedDate, profile?.role])

  const loadAvailableSlots = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const slots = await getAvailableInstructors(dateStr)
      setAvailableSlots(slots || [])
    } catch (error: any) {
      console.error('Error loading available slots:', error)
      toast({
        title: "時間枠の取得に失敗しました",
        description: error.message || "利用可能な時間枠を取得中にエラーが発生しました",
        variant: "destructive"
      })
    }
  }

  const loadMyBookings = async () => {
    if (!user?.id) return
    try {
      const bookings = await getStudentBookings(user.id)
      setMyBookings(bookings || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
    }
  }

  const handleBooking = async () => {
    if (!selectedSlot || !user?.id) return

    setLoading(true)
    try {
      await createBooking({
        student_id: user.id,
        instructor_id: selectedSlot.instructor_id,
        availability_id: selectedSlot.id,
        date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        subject: bookingForm.subject,
        description: bookingForm.description,
        student_notes: bookingForm.studentNotes
      })

      toast({
        title: "予約が完了しました",
        description: "指導者からの確認をお待ちください。承認されるまでこの時間枠は仮予約状態となります。",
      })

      setIsDialogOpen(false)
      setBookingForm({ subject: "", description: "", studentNotes: "" })
      setSelectedSlot(null)
      loadAvailableSlots()
      loadMyBookings()
    } catch (error: any) {
      toast({
        title: "予約に失敗しました",
        description: error.message || "予約処理中にエラーが発生しました",
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

  // 等待 profile 加载完成
  if (!profile) {
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

  // profile 已加载，但不是学生
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">面接辅导预约</h1>
          <p className="text-muted-foreground">専門の指導者との面接練習をご予約ください</p>
        </div>
      </div>

      {/* 周历视图 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            可用时间段
          </CardTitle>
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
            {generateWeekDays().map((day, index) => (
              <div key={index} className="text-center">
                <div className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  isSameDay(day, selectedDate) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedDate(day)}>
                  <div className="text-sm font-medium">
                    {format(day, 'EEE', { locale: ja })}
                  </div>
                  <div className="text-lg">
                    {format(day, 'd')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 选中日期的时间段 */}
          <div className="mt-6">
            <h4 className="text-md font-medium mb-4">
              {format(selectedDate, 'yyyy年MM月dd日 (EEE)', { locale: ja })} の空き時間
            </h4>
            
            {availableSlots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                この日は利用可能な時間がありません
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableSlots.map((slot) => (
                  <Card key={slot.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={slot.profiles.avatar_url || undefined} />
                          <AvatarFallback>
                            {slot.profiles.full_name?.charAt(0) || 'T'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{slot.profiles.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {slot.profiles.university}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <Clock className="h-4 w-4" />
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </div>
                      
                      {slot.profiles.bio && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {slot.profiles.bio}
                        </p>
                      )}
                      
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full"
                            onClick={() => setSelectedSlot(slot)}
                          >
                            予約する
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>面接辅导の予約</DialogTitle>
                          </DialogHeader>
                          
                          {selectedSlot && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <Avatar>
                                  <AvatarImage src={selectedSlot.profiles.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {selectedSlot.profiles.full_name?.charAt(0) || 'T'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{selectedSlot.profiles.full_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {format(parseISO(selectedSlot.date), 'yyyy年MM月dd日', { locale: ja })} {selectedSlot.start_time.slice(0, 5)} - {selectedSlot.end_time.slice(0, 5)}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="subject">相談内容 *</Label>
                                <Input
                                  id="subject"
                                  value={bookingForm.subject}
                                  onChange={(e) => setBookingForm(prev => ({ ...prev, subject: e.target.value }))}
                                  placeholder="例: 面接対策、業界研究"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="description">詳細説明</Label>
                                <Textarea
                                  id="description"
                                  value={bookingForm.description}
                                  onChange={(e) => setBookingForm(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="相談したい内容を詳しくお書きください"
                                  rows={3}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="notes">その他・要望</Label>
                                <Textarea
                                  id="notes"
                                  value={bookingForm.studentNotes}
                                  onChange={(e) => setBookingForm(prev => ({ ...prev, studentNotes: e.target.value }))}
                                  placeholder="特別な要望やご質問があればお書きください"
                                  rows={2}
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
                                  onClick={handleBooking}
                                  disabled={loading || !bookingForm.subject}
                                >
                                  {loading ? "予約中..." : "予約する"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 我的预约 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            マイ予約
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
                          <AvatarImage src={booking.instructor.avatar_url || undefined} />
                          <AvatarFallback>
                            {booking.instructor.full_name?.charAt(0) || 'T'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{booking.instructor.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(parseISO(booking.date), 'yyyy年MM月dd日', { locale: ja })} {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                          </div>
                          <div className="text-sm font-medium mt-1">{booking.subject}</div>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 