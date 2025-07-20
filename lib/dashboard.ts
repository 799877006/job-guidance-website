import { supabase } from './supabase';
import type { JobAdvertisement } from './types/dashboard';

export async function getLatestJobAdvertisements(limit: number = 3): Promise<JobAdvertisement[]> {
  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .eq('is_active', true)
    .order('posted_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getJobAdvertisementsByKeyword(keyword: string, limit: number = 10): Promise<JobAdvertisement[]> {
  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .eq('is_active', true)
    .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
    .order('posted_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getJobAdvertisementsBySource(source: string, limit: number = 10): Promise<JobAdvertisement[]> {
  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .eq('is_active', true)
    .eq('source', source)
    .order('posted_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
} 