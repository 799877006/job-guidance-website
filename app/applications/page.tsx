'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApplicationStatus, ApplicationWithDetails } from '@/lib/types/application';
import { getApplications, getApplicationsByStatus, createApplication, updateApplication } from '@/lib/application';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { createSchedule, updateSchedule, getStudentSchedule } from '@/lib/student-schedule';

// 主要内容组件
function ApplicationsContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [selectedApp, setSelectedApp] = useState<ApplicationWithDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewTimes, setInterviewTimes] = useState({
    first_interview_start: '',
    first_interview_end: '',
    second_interview_start: '',
    second_interview_end: '',
    final_interview_start: '',
    final_interview_end: '',
    offer_received_at: '',
  });

  const today_string = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  async function loadApplications() {
    try {
      let data;
      if (statusFilter === '選考中') {
        data = await getApplications();
        data = data.filter(app => app.status !== '内定' && app.status !== '不合格');
      } else if (statusFilter) {
        data = await getApplicationsByStatus(statusFilter as ApplicationStatus);
      } else {
        data = await getApplications();
      }
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
      toast({
        title: "エラー",
        description: "応募情報の取得に失敗しました",
        variant: "destructive",
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');

      const companyName = formData.get('company_name') as string;
      const position = formData.get('position') as string;

      if (!companyName || !position) {
        throw new Error('必須項目を入力してください');
      }

      await createApplication({
        company_name: companyName,
        position: position,
        status: '書類選考中',
        applied_at: new Date().toISOString(),
        first_interview_at: null,
        first_interview_end: null,
        second_interview_at: null,
        second_interview_end: null,
        final_interview_at: null,
        final_interview_end: null,
        offer_received_at: null,
        annual_salary: null,
        monthly_salary: null,
        benefits: [],
        location: null,
        work_hours: null,
        other_conditions: null,
      });

      await loadApplications();
      setIsDialogOpen(false);
      toast({
        title: "完了",
        description: "新規応募を追加しました",
      });
      form.reset();
    } catch (error) {
      console.error('Failed to create application:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "応募の追加に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusLabels: Record<ApplicationStatus, string> = {
    '書類選考中': '書類選考中',
    '一次面接待ち': '一次面接待ち',
    '一次面接完了': '一次面接完了',
    '二次面接待ち': '二次面接待ち',
    '二次面接完了': '二次面接完了',
    '最終面接待ち': '最終面接待ち',
    '最終面接完了': '最終面接完了',
    '内定': '内定',
    '不合格': '不合格'
  };

  // 格式化日期时间为本地时间
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const date = parseISO(dateStr);
      console.log('Formatting date:', {
        original: dateStr,
        parsed: date,
        formatted: formatInTimeZone(date, 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm")
      });
      return formatInTimeZone(date, 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm");
    } catch (error) {
      console.error('Error formatting date:', dateStr, error);
      return '';
    }
  };

  // 将本地时间转换为 UTC
  const toUTCDateTime = (localDateStr: string) => {
    if (!localDateStr) return null;
    try {
      const date = new Date(localDateStr);
      const utcDate = date.toISOString();
      console.log('Converting to UTC:', {
        local: localDateStr,
        utc: utcDate
      });
      return utcDate;
    } catch (error) {
      console.error('Error converting to UTC:', localDateStr, error);
      return null;
    }
  };

  // 修改面试日期处理函数（只更新本地状态）
  const handleLocalInterviewDateChange = (
    interviewType: '一次' | '二次' | '最終' | '内定',
    dateValue: string | null,
    timeField: 'start' | 'end'
  ) => {
    const interviewTypeToKeyMap = {
      '一次': 'first',
      '二次': 'second',
      '最終': 'final',
    };

    const newTimes = { ...interviewTimes };
    let fieldKey: keyof typeof interviewTimes;

    if (interviewType === '内定') {
      fieldKey = 'offer_received_at';
      newTimes[fieldKey] = dateValue || '';
    } else {
      const keyPrefix = interviewTypeToKeyMap[interviewType as keyof typeof interviewTypeToKeyMap];
      fieldKey = `${keyPrefix}_interview_${timeField}` as keyof typeof interviewTimes;
      newTimes[fieldKey] = dateValue || '';
    }
    setInterviewTimes(newTimes);
  }

  // 保存所有日程变更
  const handleSaveChanges = async () => {
    if (!selectedApp || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');
      
      const app = selectedApp;
      const updates: Partial<ApplicationWithDetails> = {};
      
      const interviewTypesToProcess = [
        { type: '一次' as const, key: 'first' as const },
        { type: '二次' as const, key: 'second' as const },
        { type: '最終' as const, key: 'final' as const },
      ];

      for (const it of interviewTypesToProcess) {
        const startKey = `${it.key}_interview_start` as keyof typeof interviewTimes;
        const endKey = `${it.key}_interview_end` as keyof typeof interviewTimes;
        
        const startTime = interviewTimes[startKey];
        const endTime = interviewTimes[endKey];
        
        if (startTime) {
          const utcStartTime = toUTCDateTime(startTime);
          const utcEndTime = toUTCDateTime(endTime);
          updates[`${it.key}_interview_at`] = utcStartTime;
          updates[`${it.key}_interview_end`] = utcEndTime; // 新增：end时间也转为timestamptz
          await syncInterviewToSchedule(
            user.id,
            app.company_name,
            utcStartTime,
            it.type,
            utcEndTime,
            app.id // 传入 applicationId
          );
        } else {
          updates[`${it.key}_interview_at`] = null;
          updates[`${it.key}_interview_end`] = null; // 新增
        }
      }

      // 处理内定日
      if (interviewTimes.offer_received_at) {
        updates.offer_received_at = toUTCDateTime(interviewTimes.offer_received_at);
      } else {
        updates.offer_received_at = null;
      }
      
      // 根据最新的日程更新状态
      if (updates.final_interview_at) updates.status = '最終面接待ち';
      else if (updates.second_interview_at) updates.status = '二次面接待ち';
      else if (updates.first_interview_at) updates.status = '一次面接待ち';
      else updates.status = '書類選考中';


      if (Object.keys(updates).length > 0) {
        await updateApplication(app.id, updates);
      }

      await loadApplications();
      toast({
        title: "保存完了",
        description: "日程の変更が正常に保存されました。",
      });
      setIsDetailsDialogOpen(false);

    } catch (error) {
       console.error('Failed to save changes:', error);
      toast({
        title: "エラー",
        description: "変更の保存に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // 同步面试日程到日程表
  const syncInterviewToSchedule = async (
    userId: string,
    companyName: string,
    interviewDate: string | null,
    interviewType: '一次' | '二次' | '最終',
    interviewEndDate?: string | null,
    applicationId?: string
  ) => {
    try {
      if (!interviewDate) {
        // 如果面试日期被清空，不需要创建日程
        return;
      }

      // 准备日程数据
      const parsedStartDate = parseISO(interviewDate);
      let parsedEndDate: Date;

      if (interviewEndDate) {
        // 如果提供了结束时间，则使用它
        const tempEndDate = new Date(interviewEndDate);
        // 确保结束日期和开始日期是同一天，避免用户错误输入
        tempEndDate.setFullYear(parsedStartDate.getFullYear(), parsedStartDate.getMonth(), parsedStartDate.getDate());
        parsedEndDate = tempEndDate;

        // 再次检查跨天问题
        if (parsedEndDate.getDate() !== parsedStartDate.getDate()) {
          parsedEndDate.setHours(23, 59, 59, 999);
        }
      } else {
        parsedEndDate = parsedStartDate;
      }

      // 1. 先查找是否已有对应的面试日程
      const { data: existing, error: findError } = await supabase
        .from('student_schedule')
        .select('*')
        .eq('student_id', userId)
        .eq('schedule_type', 'interview')
        .eq('title', `${companyName} - ${interviewType}面接`)
        .eq('application_id', applicationId || null)
        .maybeSingle();

      const scheduleData = {
        student_id: userId,
        date: format(parsedStartDate, 'yyyy-MM-dd'),
        start_time: format(parsedStartDate, "yyyy-MM-dd'T'HH:mm:00"),
        end_time: format(parsedEndDate, "yyyy-MM-dd'T'HH:mm:00"),
        schedule_type: 'interview' as const,
        title: `${companyName} - ${interviewType}面接`,
        description: `${companyName}の${interviewType}面接`,
        color: '#3b82f6', // 蓝色
        application_id: applicationId || null,
      };

      if (existing) {
        // 2. 已有则 update
        await updateSchedule(existing.id, scheduleData);
        await updateApplication(applicationId!, {
          first_interview_at: scheduleData.start_time,
          second_interview_at: scheduleData.start_time,
          final_interview_at: scheduleData.start_time,
        });
      } else {
        // 3. 没有则 create
        await createSchedule(scheduleData);
      }
          
    } catch (error) {
      console.error('Failed to sync interview schedule:', error);
      throw error; // 向上传递错误
    }
  };

  const handleOpenDetailsDialog = (app: ApplicationWithDetails) => {
    // 用最新的 applications 查找
    const latestApp = applications.find(a => a.id === app.id) || app;
    setSelectedApp(latestApp);
    setInterviewTimes({
      first_interview_start: formatDateTime(latestApp.first_interview_at),
      first_interview_end: formatDateTime(latestApp.first_interview_end),
      second_interview_start: formatDateTime(latestApp.second_interview_at),
      second_interview_end: formatDateTime(latestApp.second_interview_end),
      final_interview_start: formatDateTime(latestApp.final_interview_at),
      final_interview_end: formatDateTime(latestApp.final_interview_end),
      offer_received_at: formatDateTime(latestApp.offer_received_at),
    });
    setIsDetailsDialogOpen(true);
  }

  // 新增：保存内定信息的函数
  const handleOfferDetailsSave = async (
    app: ApplicationWithDetails,
    formData: FormData,
    closeDialog: () => void
  ) => {
    try {
      await updateApplication(app.id, {
        annual_salary: Number(formData.get('annual_salary')),
        monthly_salary: Number(formData.get('monthly_salary')),
        location: formData.get('location') as string,
        work_hours: formData.get('work_hours') as string,
        other_conditions: formData.get('other_conditions') as string,
      });

      await loadApplications();
      closeDialog(); // 关闭弹窗
      toast({
        title: "保存完了",
        description: "内定情報が保存されました。",
      });
    } catch (error) {
      console.error('Failed to update offer details:', error);
      toast({
        title: "エラー",
        description: "内定情報の保存に失敗しました",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">応募管理{statusFilter ? ` - ${statusFilter}` : ''}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>新規応募を追加</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規応募の追加</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="company_name">企業名</Label>
                <Input id="company_name" name="company_name" required />
              </div>
              <div>
                <Label htmlFor="position">職種</Label>
                <Input id="position" name="position" required />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '追加中...' : '追加'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>企業名</TableHead>
              <TableHead>職種</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>応募日</TableHead>
              <TableHead>最終更新日</TableHead>
              <TableHead>アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell>{app.company_name}</TableCell>
                <TableCell>{app.position}</TableCell>
                <TableCell>
                  <Select
                    value={app.status}
                    onValueChange={async (value: ApplicationStatus) => {
                      try {
                        await updateApplication(app.id, { status: value });
                        loadApplications();
                      } catch (error) {
                        console.error('Failed to update status:', error);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>{statusLabels[app.status]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{formatInTimeZone(new Date(app.applied_at), 'Asia/Tokyo', 'yyyy/MM/dd')}</TableCell>
                <TableCell>{formatInTimeZone(new Date(app.updated_at), 'Asia/Tokyo', 'yyyy/MM/dd')}</TableCell>
                <TableCell>
                  <Dialog open={isDetailsDialogOpen && selectedApp?.id === app.id} onOpenChange={(open) => {
                    setIsDetailsDialogOpen(open);
                    if (!open) setSelectedApp(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleOpenDetailsDialog(app)}>
                        詳細
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{app.company_name} - 詳細情報</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>一次面接日</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="datetime-local"
                              min={today_string}
                              value={interviewTimes.first_interview_start}
                              onChange={(e) => handleLocalInterviewDateChange('一次', e.target.value, 'start')}
                            />
                            <Input
                              type="datetime-local"
                              min={interviewTimes.first_interview_start || today_string}
                              value={interviewTimes.first_interview_end}
                              onChange={(e) => handleLocalInterviewDateChange('一次', e.target.value, 'end')}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>二次面接日</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="datetime-local"
                              min={today_string}
                              value={interviewTimes.second_interview_start}
                              onChange={(e) => handleLocalInterviewDateChange('二次', e.target.value, 'start')}
                            />
                            <Input
                              type="datetime-local"
                              min={interviewTimes.second_interview_start || today_string}
                              value={interviewTimes.second_interview_end}
                              onChange={(e) => handleLocalInterviewDateChange('二次', e.target.value, 'end')}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>最終面接日</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="datetime-local"
                              min={today_string}
                              value={interviewTimes.final_interview_start}
                              onChange={(e) => handleLocalInterviewDateChange('最終', e.target.value, 'start')}
                            />
                            <Input
                              type="datetime-local"
                              min={interviewTimes.final_interview_start || today_string}
                              value={interviewTimes.final_interview_end}
                              onChange={(e) => handleLocalInterviewDateChange('最終', e.target.value, 'end')}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>内定日</Label>
                          <Input
                            type="datetime-local"
                            min={today_string}
                            value={interviewTimes.offer_received_at}
                            onChange={(e) => handleLocalInterviewDateChange('内定', e.target.value, 'start')}
                          />
                        </div>
                        
                        <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                          {isSubmitting ? '保存中...' : '日程を保存'}
                        </Button>

                        {app.status === '内定' && (
                          <form className="space-y-4 pt-4 border-t" onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const formData = new FormData(form);
                            
                            await handleOfferDetailsSave(app, formData, () => setIsDetailsDialogOpen(false));
                          }}>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="annual_salary">年収（万円）</Label>
                                <Input
                                  id="annual_salary"
                                  name="annual_salary"
                                  type="number"
                                  defaultValue={app.annual_salary || ''}
                                />
                              </div>
                              <div>
                                <Label htmlFor="monthly_salary">月給（万円）</Label>
                                <Input
                                  id="monthly_salary"
                                  name="monthly_salary"
                                  type="number"
                                  defaultValue={app.monthly_salary || ''}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="location">勤務地</Label>
                              <Input
                                id="location"
                                name="location"
                                defaultValue={app.location || ''}
                              />
                            </div>
                            <div>
                              <Label htmlFor="work_hours">勤務時間</Label>
                              <Input
                                id="work_hours"
                                name="work_hours"
                                defaultValue={app.work_hours || ''}
                              />
                            </div>
                            <div>
                              <Label htmlFor="other_conditions">その他条件</Label>
                              <Input
                                id="other_conditions"
                                name="other_conditions"
                                defaultValue={app.other_conditions || ''}
                              />
                            </div>
                            <Button type="submit">保存</Button>
                          </form>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// 加载状态组件
function LoadingState() {
  return (
    <div className="container mx-auto py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-[400px] bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

// 主页面组件
export default function ApplicationsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ApplicationsContent />
    </Suspense>
  );
} 