'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApplicationCounts } from "@/lib/application";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Calendar,
  BarChart3,
  User,
  MessageSquare,
  LogOut,
  Bell,
  Plus,
  Building,
  TrendingUp,
  MapPin,
  Coins,
  ArrowUpRight,
  ArrowRight
} from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageBox } from '@/components/message-box';
import { getLatestJobAdvertisements } from '@/lib/dashboard';
import type { JobAdvertisement } from '@/lib/types/dashboard';
import { useRouter } from "next/navigation";

interface DashboardStats {
  total: number;
  rejected: number;
  accepted: number;
  pending: number;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  
  // 添加重定向逻辑
  useEffect(() => {
    if (profile?.role === 'instructor') {
      router.push('/instructor-dashboard');
    }
  }, [profile, router]);

  // 学生用状态
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    rejected: 0,
    accepted: 0,
    pending: 0
  });
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [advertisements, setAdvertisements] = useState<JobAdvertisement[]>([]);

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'instructor') {
        fetchInstructorDashboardData();
      } else {
        loadCounts();
        fetchStudentDashboardData();
      }
    }
  }, [user?.id, profile?.role]);

  async function loadCounts() {
    try {
      const data = await getApplicationCounts();
      setStats({
        total: data.total,
        rejected: data.failed,
        accepted: data.passed,
        pending: data.inProgress
      });
    } catch (error) {
      console.error('Failed to load counts:', error);
      toast({
        title: "エラー",
        description: "データの取得に失敗しました",
        variant: "destructive",
      });
    }
  }

  const getInterviewStatus = (currentStatus: string, interviewType: string, interviewDate: Date) => {
    // 如果面试日期在未来
    if (interviewDate > new Date()) {
      // 根据面试类型判断状态
          return 'scheduled';
    }
    // 如果面试日期已过，显示为完了
    return 'completed';
  };

  const fetchStudentDashboardData = async () => {
    if (!user) return;

    try {
      // 获取当前东京时间
      const TOKYO_TIMEZONE = 'Asia/Tokyo';
      const now = new Date();
      const nowTokyoString = now.toLocaleString('sv-SE', { timeZone: TOKYO_TIMEZONE });
      const todayTokyoString = nowTokyoString.split('T')[0];

      // 获取面试预约
      const { data: interviews } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", user.id)
        .gte('scheduled_date', todayTokyoString)
        .order("scheduled_date", { ascending: true });

      // 获取应聘记录中的面试信息
      const { data: applications } = await supabase
        .from("applications")
        .select(`
          id,
          company_name,
          first_interview_at,
          second_interview_at,
          final_interview_at,
          status
        `)
        .eq("user_id", user.id)
        .neq("status", "不合格")
        .or(`first_interview_at.gte.${todayTokyoString},second_interview_at.gte.${todayTokyoString},final_interview_at.gte.${todayTokyoString}`)


      console.log('Found applications:', applications); // 添加调试日志

      // 合并面试信息
      let allInterviews = [...(interviews || [])];

      // 添加应聘记录中的面试
      if (applications) {
        applications.forEach(app => {
          // 添加一次面试
          if (app.first_interview_at && new Date(app.first_interview_at) >= new Date(todayTokyoString)) {
            const interviewDate = new Date(app.first_interview_at);
            allInterviews.push({
              id: `first_${app.id}`,
              company_name: app.company_name,
              scheduled_date: format(interviewDate, 'yyyy-MM-dd'),
              scheduled_time: format(interviewDate, 'HH:mm:ss'),
              interview_type: '一次面接',
              status: getInterviewStatus(app.status, '一次面接', interviewDate)
            });
          }

          // 添加二次面试
          if (app.second_interview_at && new Date(app.second_interview_at) >= new Date(todayTokyoString)) {
            const interviewDate = new Date(app.second_interview_at);
            allInterviews.push({
              id: `second_${app.id}`,
              company_name: app.company_name,
              scheduled_date: format(interviewDate, 'yyyy-MM-dd'),
              scheduled_time: format(interviewDate, 'HH:mm:ss'),
              interview_type: '二次面接',
              status: getInterviewStatus(app.status, '二次面接', interviewDate)
            });
          }

          // 添加最终面试
          if (app.final_interview_at && new Date(app.final_interview_at) >= new Date(todayTokyoString)) {
            const interviewDate = new Date(app.final_interview_at);
            allInterviews.push({
              id: `final_${app.id}`,
              company_name: app.company_name,
              scheduled_date: format(interviewDate, 'yyyy-MM-dd'),
              scheduled_time: format(interviewDate, 'HH:mm:ss'),
              interview_type: '最終面接',
              status: getInterviewStatus(app.status, '最終面接', interviewDate)
            });
          }
        });
      }

      // 按日期和时间排序
      allInterviews.sort((a, b) => {
        const dateA = `${a.scheduled_date} ${a.scheduled_time}`;
        const dateB = `${b.scheduled_date} ${b.scheduled_time}`;
        return dateA.localeCompare(dateB);
      });

      setUpcomingInterviews(allInterviews);

      // 获取最新求人信息
      const jobAds = await getLatestJobAdvertisements(5);
      setAdvertisements(jobAds);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "エラー",
        description: "データの取得に失敗しました",
        variant: "destructive",
      });
    }
  };

  const fetchInstructorDashboardData = async () => {
    // 指导者仪表盘数据获取逻辑
  };

  const handleSignOut = async () => {
    try {
      console.log("开始logout")
      await signOut();
      toast({
        title: "ログアウト",
        description: "正常にログアウトしました",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "ログアウトに失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-blue-600">向日offer</span>
              </Link>
              <div className="flex items-center space-x-4">
                <MessageBox />
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
            <h1 className="text-3xl font-bold text-gray-900">
              おかえりなさい、{profile?.full_name || "ユーザー"}さん
            </h1>
            <p className="text-gray-600 mt-2">就職活動の進捗を確認しましょう</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/applications" className="block">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">応募総数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    今月の活動
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/applications?status=不合格" className="block">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">不合格</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total > 0 ? `${((stats.rejected / stats.total) * 100).toFixed(1)}%` : "0%"}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/applications?status=内定" className="block">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">合格</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total > 0 ? `${((stats.accepted / stats.total) * 100).toFixed(1)}%` : "0%"}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/applications?status=選考中" className="block">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">選考中</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <p className="text-xs text-gray-500 mt-1">進行中の選考</p>
                </CardContent>
              </Card>
            </Link>
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
                      今後の予定
                    </CardTitle>
                    <div className="flex gap-2">
                      <Link href="/schedule">
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          時間管理
                        </Button>
                      </Link>
                      <Link href="/schedule-interview">
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          面接予約
                        </Button>
                      </Link>
                    </div>
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
                                {format(new Date(interview.scheduled_date), 'yyyy年MM月dd日')} {interview.scheduled_time.slice(0, 5)}
                              </div>
                              <div className="text-sm text-gray-500">{interview.interview_type}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">面接</Badge>
                            <Badge variant={interview.status === 'scheduled' ? 'default' : 'secondary'}>
                              {interview.status === 'scheduled' ? '予定' : '完了'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>予定されている面接はありません</p>
                      <div className="flex gap-2 justify-center mt-2">
                        <Link href="/schedule-interview">
                          <Button variant="outline" className="bg-transparent">
                            面接を予約する
                          </Button>
                        </Link>
                        <Link href="/mentoring">
                          <Button variant="outline" className="bg-transparent">
                            指導を予約する
                          </Button>
                        </Link>
                      </div>
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

                    <Link href="/mentoring">
                      <Button variant="outline" className="w-full h-16 flex flex-col bg-transparent">
                        <User className="h-5 w-5 mb-1" />
                        <span className="text-xs">面接指導予約</span>
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
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm truncate">{ad.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {ad.source}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{ad.company_name}</p>
                              {ad.location && (
                                <p className="text-xs text-gray-500">
                                  <MapPin className="inline h-3 w-3 mr-1" />
                                  {ad.location}
                                </p>
                              )}
                              {ad.salary_range && (
                                <p className="text-xs text-gray-500">
                                  <Coins className="inline h-3 w-3 mr-1" />
                                  {ad.salary_range}
                                </p>
                              )}
                              {ad.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ad.description}</p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">
                                  {format(new Date(ad.posted_at), 'MM/dd HH:mm')}
                                </span>
                                <a
                                  href={ad.link_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline inline-flex items-center"
                                >
                                  詳細を見る
                                  <ArrowUpRight className="h-3 w-3 ml-1" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="text-center">
                        <Link href="/jobs">
                          <Button variant="outline" size="sm">
                            すべての求人を見る
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
