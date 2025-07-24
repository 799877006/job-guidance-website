import { supabase } from './supabase';
import type { Application, ApplicationStatus } from './types/application';

export async function getApplications() {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('applied_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getApplicationsByStatus(status: ApplicationStatus) {
  const { data, error } = await supabase
    .from('applications')
    .select(`*`)
    .eq('status', status)
    .order('applied_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createApplication(application: Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('applications')
    .insert([{
      ...application,
      user_id: user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateApplication(
  id: string,
  updates: Partial<Application>
) {
  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
  return data;
}

export async function getApplicationCounts() {
  const { data, error } = await supabase
    .from('applications')
    .select('*', { count: 'exact' });

  if (error) throw error;

  const counts = {
    total: 0,
    failed: 0,
    passed: 0,
    inProgress: 0
  };

  if (data) {
    counts.total = data.length;
    data.forEach((item: { status: ApplicationStatus }) => {
      if (item.status === '不合格') {
        counts.failed++;
      } else if (item.status === '内定') {
        counts.passed++;
      } else {
        counts.inProgress++;
      }
    });
  }

  return counts;
} 