import { StatusBadge } from '@/components/status-badge';
import { CheckCircle, Clock, Truck, Package, X, ArrowRight } from 'lucide-react';

interface TimelineEvent {
  id: string;
  event_type: string;
  description?: string;
  created_at: string;
}

const eventIcons: Record<string, React.ElementType> = {
  created: Package,
  scheduled: Clock,
  in_transit: Truck,
  delivered: CheckCircle,
  failed: X,
  returned: ArrowRight,
};

export function DeliveryTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events || events.length === 0) {
    return <p className="text-sm text-slate-400">Nenhum evento registrado.</p>;
  }

  return (
    <ol className="relative border-l border-slate-200 ml-3 space-y-6">
      {events.map((event, i) => {
        const Icon = eventIcons[event.event_type] ?? ArrowRight;
        const isLast = i === events.length - 1;
        return (
          <li key={event.id} className="ml-6">
            <div className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white ${isLast ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <Icon size={12} className="text-white" />
            </div>
            <div className="bg-white border rounded-xl p-3 ml-2 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-1">
                <StatusBadge status={event.event_type} />
                <span className="text-xs text-slate-400">
                  {new Date(event.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              {event.description && (
                <p className="text-sm text-slate-600">{event.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
