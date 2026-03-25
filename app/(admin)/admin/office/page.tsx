import { getAuthUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/kpi-card';
import Link from 'next/link';
import { ClipboardList, StickyNote, Calendar, FolderOpen, ArrowRight } from 'lucide-react';

export default async function OfficePage() {
  const user = await getAuthUser();
  const supabase = await createSupabaseServerClient();
  const tenantId = user?.tenantId ?? '';

  const [{ data: tasks }, { data: notes }, { data: events }] = await Promise.all([
    supabase.from('tasks').select('id,status').eq('tenant_id', tenantId).neq('status', 'done'),
    supabase.from('notes').select('id').eq('tenant_id', tenantId),
    supabase.from('calendar_events').select('id,title,starts_at').eq('tenant_id', tenantId).gte('starts_at', new Date().toISOString()).order('starts_at').limit(5)
  ]);

  const kpis = [
    { label: 'Tarefas Abertas', value: String((tasks ?? []).length), icon: ClipboardList, color: 'blue' as const },
    { label: 'Total de Notas', value: String((notes ?? []).length), icon: StickyNote, color: 'amber' as const },
    { label: 'Próximos Eventos', value: String((events ?? []).length), icon: Calendar, color: 'purple' as const },
  ];

  const shortcuts = [
    { href: '/admin/tasks', icon: ClipboardList, label: 'Gerenciar Tarefas', desc: 'Kanban de tarefas da equipe' },
    { href: '/admin/notes', icon: StickyNote, label: 'Ver Notas', desc: 'Notas pessoais e da equipe' },
    { href: '/admin/calendar', icon: Calendar, label: 'Calendário', desc: 'Eventos e compromissos' },
    { href: '/admin/files', icon: FolderOpen, label: 'Arquivos', desc: 'Documentos e arquivos' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Office" description="Ferramentas de produtividade e colaboração." />
      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => <KpiCard key={k.label} kpi={{ label: k.label, value: k.value }} icon={k.icon} color={k.color} />)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href} className="flex items-center gap-4 bg-white rounded-xl border p-5 hover:shadow-md transition-shadow group">
            <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-blue-100 transition-colors">
              <s.icon size={20} className="text-slate-600 group-hover:text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">{s.label}</p>
              <p className="text-sm text-slate-500">{s.desc}</p>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
          </Link>
        ))}
      </div>
      {(events ?? []).length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Próximos Eventos</h2>
          <div className="space-y-3">
            {(events ?? []).map((e) => (
              <div key={e.id} className="flex items-center gap-4">
                <div className="bg-blue-50 rounded-lg px-3 py-1.5 text-center min-w-[50px]">
                  <p className="text-sm font-bold text-blue-700">{new Date(e.starts_at).getDate()}</p>
                  <p className="text-xs text-blue-500">{new Date(e.starts_at).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{e.title}</p>
                  <p className="text-xs text-slate-400">{new Date(e.starts_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
