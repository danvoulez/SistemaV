import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { Task } from '@/types/database';

export async function getTasks(tenantId: string, status?: string): Promise<Task[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('tasks')
    .select('*, assignee:profiles!assigned_to_profile_id(id,full_name,avatar_url)')
    .eq('tenant_id', tenantId)
    .order('priority')
    .order('due_date');

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(
  tenantId: string,
  data: {
    title: string;
    description?: string;
    assignedTo?: string;
    createdBy?: string;
    dueDate?: string;
    priority?: string;
  }
): Promise<Task> {
  const supabase = await createSupabaseServerClient();
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      tenant_id: tenantId,
      title: data.title,
      description: data.description,
      assigned_to_profile_id: data.assignedTo,
      created_by: data.createdBy,
      due_date: data.dueDate,
      priority: data.priority ?? 'medium',
      status: 'todo'
    })
    .select()
    .single();
  if (error) throw error;
  return task as Task;
}

export async function updateTaskStatus(id: string, tenantId: string, status: string): Promise<Task> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, tenantId: string, data: Partial<Task>): Promise<Task> {
  const supabase = await createSupabaseServerClient();
  const { data: task, error } = await supabase
    .from('tasks')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();
  if (error) throw error;
  return task as Task;
}

export async function deleteTask(id: string, tenantId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('tenant_id', tenantId);
  if (error) throw error;
}
