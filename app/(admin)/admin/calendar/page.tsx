import { getCalendarEvents } from '@/services/calendar';
import { getAuthUser } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { EmptyState } from '@/components/empty-state';
import { Plus, Calendar, Clock } from 'lucide-react';

function groupByMonth(events: Array<{ id: string; title: string; description?: string; starts_at: string; ends_at?: string }>) {
  return events.reduce((acc, e) => {
    const month = new Date(e.starts_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(e);
    return acc;
  }, {} as Record<string, typeof events>);
}

export default async function CalendarPage() {
  const user = await getAuthUser();
  const events = await getCalendarEvents(user?.tenantId ?? '').catch(() => []);
  const grouped = groupByMonth(events);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendário"
        description={`${events.length} evento(s) agendado(s)`}
        action={<Btn href="/admin/calendar/new" icon={Plus}>Novo Evento</Btn>}
      />
      {events.length === 0 ? (
        <EmptyState title="Nenhum evento" description="Agende compromissos, reuniões e lembretes." icon={Calendar} action={<Btn href="/admin/calendar/new" icon={Plus}>Novo Evento</Btn>} />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, monthEvents]) => (
            <div key={month}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 capitalize">{month}</h2>
              <div className="space-y-2">
                {monthEvents.map((e) => (
                  <div key={e.id} className="bg-white rounded-xl border p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
                    <div className="bg-blue-50 rounded-lg p-2.5 text-center min-w-[52px]">
                      <p className="text-lg font-bold text-blue-700 leading-none">{new Date(e.starts_at).getDate()}</p>
                      <p className="text-xs text-blue-500 mt-0.5">{new Date(e.starts_at).toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{e.title}</p>
                      {e.description && <p className="text-sm text-slate-500 mt-0.5 truncate">{e.description}</p>}
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                        <Clock size={11} />
                        {new Date(e.starts_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {e.ends_at && ` → ${new Date(e.ends_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
