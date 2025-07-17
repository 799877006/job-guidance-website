"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, TrendingUp, Building, CheckCircle, XCircle, Clock } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { supabase, type Application } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function StatisticsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user])

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          companies (
            name,
            industry
          )
        `)
        .eq("user_id", user!.id)
        .order("applied_date", { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error("Error fetching applications:", error)
      toast({
        title: "エラー",
        description: "応募データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    applied: applications.length,
    rejected: applications.filter((app) => app.status === "rejected").length,
    accepted: applications.filter((app) => app.status === "accepted").length,
    pending: applications.filter((app) => app.status === "pending").length,
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "合格"
      case "rejected":
        return "不合格"
      case "pending":
        return "選考中"
      case "applied":
        return "応募済み"
      default:
        return status
    }
  }

  // Calculate percentages for pie chart
  const total = stats.applied
  const acceptedPercentage = total > 0 ? (stats.accepted / total) * 100 : 0
  const rejectedPercentage = total > 0 ? (stats.rejected / total) * 100 : 0
  const pendingPercentage = total > 0 ? (stats.pending / total) * 100 : 0
  const appliedPercentage = total > 0 ? ((total - stats.accepted - stats.rejected - stats.pending) / total) * 100 : 0

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
            <div className="flex items-center py-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  戻る
                </Button>
              </Link>
              <h1 className="text-xl font-bold">選考状況統計</h1>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">応募総数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.applied}</div>
                <p className="text-sm text-gray-600 mt-1">社</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">合格</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.accepted}</div>
                <p className="text-sm text-gray-600 mt-1">{total > 0 ? `${acceptedPercentage.toFixed(1)}%` : "0%"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">不合格</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-sm text-gray-600 mt-1">{total > 0 ? `${rejectedPercentage.toFixed(1)}%` : "0%"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">選考中</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-sm text-gray-600 mt-1">{total > 0 ? `${pendingPercentage.toFixed(1)}%` : "0%"}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  選考結果分布
                </CardTitle>
                <CardDescription>応募した企業の選考結果の割合</CardDescription>
              </CardHeader>
              <CardContent>
                {total > 0 ? (
                  <>
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative w-48 h-48">
                        {/* Simple pie chart using conic-gradient */}
                        <div
                          className="w-full h-full rounded-full"
                          style={{
                            background: `conic-gradient(
                              #10b981 0deg ${acceptedPercentage * 3.6}deg,
                              #ef4444 ${acceptedPercentage * 3.6}deg ${(acceptedPercentage + rejectedPercentage) * 3.6}deg,
                              #eab308 ${(acceptedPercentage + rejectedPercentage) * 3.6}deg ${(acceptedPercentage + rejectedPercentage + pendingPercentage) * 3.6}deg,
                              #6b7280 ${(acceptedPercentage + rejectedPercentage + pendingPercentage) * 3.6}deg 360deg
                            )`,
                          }}
                        />
                        <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{total}</div>
                            <div className="text-sm text-gray-600">総応募数</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                          <span className="text-sm">合格</span>
                        </div>
                        <span className="text-sm font-medium">
                          {stats.accepted}社 ({acceptedPercentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                          <span className="text-sm">不合格</span>
                        </div>
                        <span className="text-sm font-medium">
                          {stats.rejected}社 ({rejectedPercentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
                          <span className="text-sm">選考中</span>
                        </div>
                        <span className="text-sm font-medium">
                          {stats.pending}社 ({pendingPercentage.toFixed(1)}%)
                        </span>
                      </div>
                      {appliedPercentage > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-500 rounded-full mr-2" />
                            <span className="text-sm">応募済み</span>
                          </div>
                          <span className="text-sm font-medium">
                            {total - stats.accepted - stats.rejected - stats.pending}社 ({appliedPercentage.toFixed(1)}
                            %)
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">まだ応募データがありません</p>
                    <p className="text-sm">応募を開始すると統計が表示されます</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  応募企業一覧
                </CardTitle>
                <CardDescription>最近の応募状況</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {applications.map((application) => (
                      <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(application.status)}
                          <div>
                            <div className="font-medium">{application.companies?.name || "企業名不明"}</div>
                            <div className="text-sm text-gray-600">
                              {application.position} • {application.applied_date}
                            </div>
                            {application.companies?.industry && (
                              <div className="text-xs text-gray-500">{application.companies.industry}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-medium">{getStatusText(application.status)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Building className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">応募企業がありません</p>
                    <p className="text-sm">応募を開始してデータを蓄積しましょう</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
