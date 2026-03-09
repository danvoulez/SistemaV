import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { Note } from '@/types/database';

export async function getNotes(tenantId: string, userId: string): Promise<Note[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('tenant_id', tenantId)
    .or(`visibility.eq.team,created_by.eq.${userId}`)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createNote(
  tenantId: string,
  userId: string,
  data: { title?: string; content: string; visibility: 'private' | 'team' }
): Promise<Note> {
  const supabase = await createSupabaseServerClient();
  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      tenant_id: tenantId,
      created_by: userId,
      title: data.title,
      content: data.content,
      visibility: data.visibility
    })
    .select()
    .single();
  if (error) throw error;
  return note;
}

export async function updateNote(
  id: string,
  tenantId: string,
  userId: string,
  data: Partial<Note>
): Promise<Note> {
  const supabase = await createSupabaseServerClient();
  const { data: note, error } = await supabase
    .from('notes')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('created_by', userId)
    .select()
    .single();
  if (error) throw error;
  return note;
}

export async function deleteNote(id: string, tenantId: string, userId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('created_by', userId);
  if (error) throw error;
}
