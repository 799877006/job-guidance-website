"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, BarChart3, User, MessageSquare, LogOut, Bell, Plus, Building, TrendingUp } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { supabase, type Interview, type Advertisement } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState({
    applied: 0,
    rejected: 0,
    accepted: 0,
    pending: 0,
  })
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([])
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
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

      // Fetch upcoming interviews
      const { data: interviews } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "scheduled")
        .gte("scheduled_date", new Date().toISOString().split("T")[0])
        .order("scheduled_date", { ascending: true })
        .limit(5)

      if (interviews) {
        setUpcomingInterviews(interviews)
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-blue-600">就職塾</span>
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
            {/* Upcoming Interviews */}
            <div className="lg:col-span-2">
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

                    <Link href="/statistics">
                      <Button variant="outline" className="w-full h-16 flex flex-col bg-transparent">
                        <BarChart3 className="h-5 w-5 mb-1" />
                        <span className="text-xs">統計</span>
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
