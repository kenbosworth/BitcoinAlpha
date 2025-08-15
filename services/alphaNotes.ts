import { supabase } from '../lib/supabase';

export type AlphaNote = {
  id: string;
  created_at: string;
  title: string | null;
  body: string | null;
  category: 'app' | 'market' | null;
  pinned: boolean | null;
  published: boolean | null;
};

export async function getLatestAlphaNote(): Promise<AlphaNote | null> {
  const { data, error } = await supabase
    .from('alpha_notes')
    .select('id, created_at, title, body, category, pinned, published')
    .eq('published', true)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function getAlphaNotes(limit = 50, offset = 0): Promise<AlphaNote[]> {
  const { data, error } = await supabase
    .from('alpha_notes')
    .select('id, created_at, title, body, category, pinned, published')
    .eq('published', true)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data ?? []) as AlphaNote[];
}
