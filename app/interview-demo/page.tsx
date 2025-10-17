'use client';

import { useState, useEffect } from 'react';
import { InterviewManager } from '@/components/InterviewManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/services/supabase';

export default function InterviewDemoPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          appliedAt,
          student:users!applications_student_id_fkey(name),
          company:companies!applications_company_id_fkey(name)
        `)
        .order('appliedAt', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
      
      if (data && data.length > 0 && !selectedApplicationId) {
        setSelectedApplicationId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedApplication = applications.find(app => app.id === selectedApplicationId);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">面试管理演示</h1>
        <p className="text-gray-600 mt-2">
          演示 Interview 的增删改操作如何自动同步到 Schedule 表
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>选择申请</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                选择要管理的申请
              </label>
              <Select value={selectedApplicationId} onValueChange={setSelectedApplicationId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择申请" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.company.name} - {app.student.name} ({app.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedApplication && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold">申请信息</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p><strong>公司：</strong>{selectedApplication.company.name}</p>
                  <p><strong>学生：</strong>{selectedApplication.student.name}</p>
                  <p><strong>状态：</strong>{selectedApplication.status}</p>
                  <p><strong>申请时间：</strong>
                    {new Date(selectedApplication.appliedAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedApplicationId && (
        <InterviewManager 
          applicationId={selectedApplicationId}
          onUpdate={loadApplications}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>功能说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-600">✓</span>
              <span>
                <strong>创建面试：</strong>当创建新面试时，会自动在 Schedule 表中创建对应的日程记录
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-600">✓</span>
              <span>
                <strong>更新面试：</strong>修改面试时间、状态或备注时，Schedule 表中的记录会自动同步更新
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-600">✓</span>
              <span>
                <strong>删除面试：</strong>删除面试时，Schedule 表中的相关记录也会被自动删除
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-600">✓</span>
              <span>
                <strong>状态同步：</strong>面试状态变更时，日程表的状态也会同步更新
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-600">✓</span>
              <span>
                <strong>事务保证：</strong>所有操作都在数据库事务中执行，确保数据一致性
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
