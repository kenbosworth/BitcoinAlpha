// lib/cycle.ts
import { supabase } from './supabase';

const CYCLE_LENGTH = 60;

// Fetch the cycle anchor from Supabase (dynamic)
export async function getCycleAnchor(): Promise<Date | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'cycle_anchor')
    .single();

  if (error || !data?.value) return null;
  return new Date(data.value);
}

export function getCycleDayFor(anchor: Date, cycleLength = CYCLE_LENGTH) {
  const now = new Date();
  const msInDay = 1000 * 60 * 60 * 24;
  const daysSince = Math.floor((now.getTime() - anchor.getTime()) / msInDay);
  return ((Math.max(daysSince, 1) - 1) % cycleLength) + 1;
}

export function getCyclePhase(cycleDay: number) {
  if (cycleDay <= 20) return 'Accumulation';
  if (cycleDay <= 40) return 'Markup';
  return 'Distribution';
}
