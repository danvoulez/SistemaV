import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const NEXT_STATUS: Record<string, string> = {
  todo: 'in_progress',
  in_progress: 'done',
  blocked: 'in_progress',
  done: 'todo'
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single();
  if (!profile || !['admin', 'member'].includes(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: task } = await supabase.from('tasks').select('status').eq('id', id).eq('tenant_id', profile.tenant_id).single();
  if (!task) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });

  const nextStatus = NEXT_STATUS[task.status];
  if (!nextStatus) return NextResponse.json({ error: 'Status sem transição' }, { status: 400 });

  const { error } = await supabase.from('tasks').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', id).eq('tenant_id', profile.tenant_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, status: nextStatus });
}
