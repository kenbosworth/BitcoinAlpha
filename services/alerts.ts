// services/alerts.ts
import { supabase } from '../lib/supabase';

export type AlertRow = {
  id: string;
  created_at: string;
  title: string | null;
  body: string | null;
  cycle_day: number | null;
  cycle_phase: string | null;
};

export async function getLatestAlert(): Promise<AlertRow | null> {
  const { data, error } = await supabase
    .from('alerts')
    .select('id, created_at, title, body, cycle_day, cycle_phase')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** Fetch a page of alerts (newest first). Offset paging is fine for MVP. */
export async function getAlerts(limit = 30, offset = 0): Promise<AlertRow[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('id, created_at, title, body, cycle_day, cycle_phase')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as AlertRow[];
}
