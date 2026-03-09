'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string }>>([]);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', assigned_to_profile_id: '' });

  useEffect(() => {
    async function loadProfiles() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
      const { data } = await supabase.from('profiles').select('id,full_name').eq('tenant_id', profile?.tenant_id ?? '').order('full_name');
      setProfiles(data ?? []);
    }
    loadProfiles();
  }, []);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({...p, [k]: e.target.value}));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
    const { error: err } = await supabase.from('tasks').insert({
      tenant_id: profile?.tenant_id,
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      due_date: form.due_date || null,
      assigned_to_profile_id: form.assigned_to_profile_id || null,
      created_by: user.id,
      status: 'todo'
    });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push('/admin/tasks');
  }

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader title="Nova Tarefa" />
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
          <input required value={form.title} onChange={f('title')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea value={form.description} onChange={f('description')} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
            <select value={form.priority} onChange={f('priority')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento</label>
            <input type="date" value={form.due_date} onChange={f('due_date')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
          <select value={form.assigned_to_profile_id} onChange={f('assigned_to_profile_id')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Sem responsável</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}
        <div className="flex gap-3 pt-2">
          <Btn type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Criar Tarefa'}</Btn>
          <Btn variant="secondary" href="/admin/tasks">Cancelar</Btn>
        </div>
      </form>
    </div>
  );
}
