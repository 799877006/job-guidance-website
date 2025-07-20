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
import { getApplications, getApplicationsByStatus, createApplication, updateApplication, createApplicationDetails, updateApplicationDetails } from '@/lib/application';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

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
        second_interview_at: null,
        final_interview_at: null,
        offer_received_at: null
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
                <TableCell>{format(new Date(app.applied_at), 'yyyy/MM/dd')}</TableCell>
                <TableCell>{format(new Date(app.updated_at), 'yyyy/MM/dd')}</TableCell>
                <TableCell>
                  <Dialog open={isDetailsDialogOpen && selectedApp?.id === app.id} onOpenChange={(open) => {
                    setIsDetailsDialogOpen(open);
                    if (open) setSelectedApp(app);
                    else setSelectedApp(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        詳細
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{app.company_name} - 詳細情報</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>一次面接日</Label>
                            <Input
                              type="datetime-local"
                              value={app.first_interview_at?.slice(0, 16) || ''}
                              onChange={async (e) => {
                                try {
                                  await updateApplication(app.id, {
                                    first_interview_at: e.target.value ? new Date(e.target.value).toISOString() : null
                                  });
                                  loadApplications();
                                } catch (error) {
                                  console.error('Failed to update interview date:', error);
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>二次面接日</Label>
                            <Input
                              type="datetime-local"
                              value={app.second_interview_at?.slice(0, 16) || ''}
                              onChange={async (e) => {
                                try {
                                  await updateApplication(app.id, {
                                    second_interview_at: e.target.value ? new Date(e.target.value).toISOString() : null
                                  });
                                  loadApplications();
                                } catch (error) {
                                  console.error('Failed to update interview date:', error);
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>最終面接日</Label>
                            <Input
                              type="datetime-local"
                              value={app.final_interview_at?.slice(0, 16) || ''}
                              onChange={async (e) => {
                                try {
                                  await updateApplication(app.id, {
                                    final_interview_at: e.target.value ? new Date(e.target.value).toISOString() : null
                                  });
                                  loadApplications();
                                } catch (error) {
                                  console.error('Failed to update interview date:', error);
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>内定日</Label>
                            <Input
                              type="datetime-local"
                              value={app.offer_received_at?.slice(0, 16) || ''}
                              onChange={async (e) => {
                                try {
                                  await updateApplication(app.id, {
                                    offer_received_at: e.target.value ? new Date(e.target.value).toISOString() : null
                                  });
                                  loadApplications();
                                } catch (error) {
                                  console.error('Failed to update offer date:', error);
                                }
                              }}
                            />
                          </div>
                        </div>
                        {app.status === '内定' && (
                          <form className="space-y-4" onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const formData = new FormData(form);
                            
                            try {
                              if (app.details?.id) {
                                await updateApplicationDetails(app.details.id, {
                                  annual_salary: Number(formData.get('annual_salary')),
                                  monthly_salary: Number(formData.get('monthly_salary')),
                                  location: formData.get('location') as string,
                                  work_hours: formData.get('work_hours') as string,
                                  other_conditions: formData.get('other_conditions') as string,
                                });
                              } else {
                                await createApplicationDetails({
                                  application_id: app.id,
                                  annual_salary: Number(formData.get('annual_salary')),
                                  monthly_salary: Number(formData.get('monthly_salary')),
                                  benefits: [],
                                  location: formData.get('location') as string,
                                  work_hours: formData.get('work_hours') as string,
                                  other_conditions: formData.get('other_conditions') as string,
                                });
                              }
                              loadApplications();
                            } catch (error) {
                              console.error('Failed to update offer details:', error);
                            }
                          }}>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="annual_salary">年収（万円）</Label>
                                <Input
                                  id="annual_salary"
                                  name="annual_salary"
                                  type="number"
                                  defaultValue={app.details?.annual_salary || ''}
                                />
                              </div>
                              <div>
                                <Label htmlFor="monthly_salary">月給（万円）</Label>
                                <Input
                                  id="monthly_salary"
                                  name="monthly_salary"
                                  type="number"
                                  defaultValue={app.details?.monthly_salary || ''}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="location">勤務地</Label>
                              <Input
                                id="location"
                                name="location"
                                defaultValue={app.details?.location || ''}
                              />
                            </div>
                            <div>
                              <Label htmlFor="work_hours">勤務時間</Label>
                              <Input
                                id="work_hours"
                                name="work_hours"
                                defaultValue={app.details?.work_hours || ''}
                              />
                            </div>
                            <div>
                              <Label htmlFor="other_conditions">その他条件</Label>
                              <Input
                                id="other_conditions"
                                name="other_conditions"
                                defaultValue={app.details?.other_conditions || ''}
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