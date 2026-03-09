import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { CalendarEvent } from '@/types/database';

export async function getCalendarEvents(
  tenantId: string,
  from?: string,
  to?: string
): Promise<CalendarEvent[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('starts_at');

  if (from) query = query.gte('starts_at', from);
  if (to) query = query.lte('starts_at', to);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createCalendarEvent(
  tenantId: string,
  data: {
    title: string;
    description?: string;
    startsAt: string;
    endsAt?: string;
    createdBy?: string;
    relatedType?: string;
    relatedId?: string;
  }
): Promise<CalendarEvent> {
  const supabase = await createSupabaseServerClient();
  const { data: event, error } = await supabase
    .from('calendar_events')
    .insert({
      tenant_id: tenantId,
      title: data.title,
      description: data.description,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      created_by: data.createdBy,
      related_type: data.relatedType,
      related_id: data.relatedId
    })
    .select()
    .single();
  if (error) throw error;
  return event;
}

export async function deleteCalendarEvent(id: string, tenantId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (error) throw error;
}
