import { AnyPayloadSchema, adminClient, getCallerTenantId, json, parsePayload } from '../_shared.ts';

Deno.serve(async (req) => {
  try {
    const [payload, callerTenantId] = await Promise.all([
      parsePayload(req, AnyPayloadSchema),
      getCallerTenantId(req),
    ]);
    const supabase = adminClient();
    const { data, error } = await supabase.rpc('api_recordInventoryMovement', {
      payload: { ...payload, tenant_id: callerTenantId },
    });

    if (error) {
      return json({ ok: false, error: error.message }, 400);
    }

    return json({ ok: true, data });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Unexpected error' }, 400);
  }
});
