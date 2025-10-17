'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  createInterviewWithSchedule,
  updateInterviewWithSchedule,
  deleteInterviewWithSchedule,
  getApplicationInterviewsWithSchedules,
} from '@/lib/services/interview-cascade';
import { Calendar, Clock, MapPin, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface InterviewManagerProps {
  applicationId: string;
  onUpdate?: () => void;
}

export function InterviewManager({ applicationId, onUpdate }: InterviewManagerProps) {
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<any>(null);
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    type: '',
    notes: '',
    location: ''
  });

  useEffect(() => {
    loadInterviews();
  }, [applicationId]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const { interviews: interviewData, schedules: scheduleData } = 
        await getApplicationInterviewsWithSchedules(applicationId);
      setInterviews(interviewData);
      setSchedules(scheduleData);
    } catch (error) {
      console.error('Failed to load interviews:', error);
      toast({
        title: "错误",
        description: "加载面试信息失败",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingInterview) {
        // 更新面试
        await updateInterviewWithSchedule(editingInterview.id, {
          startTime: new Date(formData.startTime),
          endTime: new Date(formData.endTime),
          notes: formData.notes,
          location: formData.location
        });
        
        toast({
          title: "成功",
          description: "面试信息已更新，日程表已同步"
        });
      } else {
        // 创建新面试
        await createInterviewWithSchedule(applicationId, {
          startTime: new Date(formData.startTime),
          endTime: new Date(formData.endTime),
          type: formData.type as any,
          notes: formData.notes,
          location: formData.location
        });
        
        toast({
          title: "成功",
          description: "面试已创建，已自动添加到日程表"
        });
      }
      
      setIsDialogOpen(false);
      setEditingInterview(null);
      resetForm();
      await loadInterviews();
      onUpdate?.();
      
    } catch (error) {
      console.error('Failed to save interview:', error);
      toast({
        title: "错误",
        description: error.message || "操作失败",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (interview: any) => {
    setEditingInterview(interview);
    setFormData({
      startTime: new Date(interview.startTime).toISOString().slice(0, 16),
      endTime: new Date(interview.endTime).toISOString().slice(0, 16),
      type: interview.type,
      notes: interview.notes || '',
      location: ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (interviewId: string) => {
    if (!confirm('确定要删除这个面试吗？日程表中的相关记录也会被删除。')) {
      return;
    }

    try {
      await deleteInterviewWithSchedule(interviewId);
      
      toast({
        title: "成功",
        description: "面试已删除，日程表已同步更新"
      });
      
      await loadInterviews();
      onUpdate?.();
      
    } catch (error) {
      console.error('Failed to delete interview:', error);
      toast({
        title: "错误",
        description: "删除失败",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (interviewId: string, status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED') => {
    try {
      await updateInterviewWithSchedule(interviewId, { status });
      
      toast({
        title: "成功",
        description: "面试状态已更新，日程表已同步"
      });
      
      await loadInterviews();
      onUpdate?.();
      
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: "错误",
        description: "状态更新失败",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      startTime: '',
      endTime: '',
      type: '',
      notes: '',
      location: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return '已安排';
      case 'COMPLETED': return '已完成';
      case 'CANCELLED': return '已取消';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      FIRST: '一次面接',
      SECOND: '二次面接',
      FINAL: '最終面接',
      CASUAL: 'カジュアル面接',
      OTHER: 'その他'
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">面试管理</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingInterview(null);
              resetForm();
            }}>
              安排新面试
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingInterview ? '编辑面试' : '安排新面试'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingInterview && (
                <div>
                  <Label htmlFor="type">面试类型</Label>
                  <Select value={formData.type} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="选择面试类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIRST">一次面接</SelectItem>
                      <SelectItem value="SECOND">二次面接</SelectItem>
                      <SelectItem value="FINAL">最終面接</SelectItem>
                      <SelectItem value="CASUAL">カジュアル面接</SelectItem>
                      <SelectItem value="OTHER">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="startTime">开始时间</Label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endTime">结束时间</Label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">地点</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="面试地点"
                />
              </div>

              <div>
                <Label htmlFor="notes">备注</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="面试相关备注"
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  {editingInterview ? '更新' : '创建'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {interviews.map((interview) => {
          const correspondingSchedule = schedules.find(
            s => s.title.includes(getTypeLabel(interview.type))
          );
          
          return (
            <Card key={interview.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {getTypeLabel(interview.type)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(interview.status)}>
                      {getStatusLabel(interview.status)}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(interview)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(interview.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(interview.startTime).toLocaleString('ja-JP')} - 
                      {new Date(interview.endTime).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  
                  {correspondingSchedule?.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{correspondingSchedule.location}</span>
                    </div>
                  )}
                  
                  {interview.notes && (
                    <p className="text-sm text-gray-600">{interview.notes}</p>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant={interview.status === 'SCHEDULED' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(interview.id, 'SCHEDULED')}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      已安排
                    </Button>
                    <Button
                      size="sm"
                      variant={interview.status === 'COMPLETED' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(interview.id, 'COMPLETED')}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      已完成
                    </Button>
                    <Button
                      size="sm"
                      variant={interview.status === 'CANCELLED' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(interview.id, 'CANCELLED')}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      已取消
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {interviews.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">暂无面试安排</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
