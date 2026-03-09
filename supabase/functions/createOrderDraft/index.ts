import { AnyPayloadSchema, adminClient, json, parsePayload } from '../_shared.ts';

Deno.serve(async (req) => {
  try {
    const payload = await parsePayload(req, AnyPayloadSchema);
    const supabase = adminClient();
    const { data, error } = await supabase.rpc('api_createOrderDraft', payload);

    if (error) {
      return json({ ok: false, error: error.message }, 400);
    }

    return json({ ok: true, data });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Unexpected error' }, 400);
  }
});
