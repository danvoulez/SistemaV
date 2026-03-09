'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';

export default function NewCalendarEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', starts_at: '', ends_at: '' });
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({...p, [k]: e.target.value}));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
    await supabase.from('calendar_events').insert({
      tenant_id: profile?.tenant_id,
      title: form.title,
      description: form.description || null,
      starts_at: form.starts_at,
      ends_at: form.ends_at || null,
      created_by: user.id
    });
    router.push('/admin/calendar');
  }

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader title="Novo Evento" />
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
          <input required value={form.title} onChange={f('title')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea value={form.description} onChange={f('description')} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Início *</label>
            <input required type="datetime-local" value={form.starts_at} onChange={f('starts_at')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fim</label>
            <input type="datetime-local" value={form.ends_at} onChange={f('ends_at')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Btn type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Criar Evento'}</Btn>
          <Btn variant="secondary" href="/admin/calendar">Cancelar</Btn>
        </div>
      </form>
    </div>
  );
}
