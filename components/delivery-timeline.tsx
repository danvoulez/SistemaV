import { DeliveryEvent } from '@/types/domain';

export function DeliveryTimeline({ events }: { events: DeliveryEvent[] }) {
  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="rounded-lg border bg-white p-3">
          <p className="text-sm font-medium">{event.eventType}</p>
          <p className="text-xs text-slate-600">{event.description}</p>
          <p className="text-xs text-slate-400">{new Date(event.createdAt).toLocaleString()}</p>
        </li>
      ))}
    </ol>
  );
}
