import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.24.2';

export const AnyPayloadSchema = z.record(z.any());

export function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

export async function parsePayload(req: Request, schema: z.ZodTypeAny) {
  if (req.method !== 'POST') {
    throw new Error('Method not allowed');
  }

  const body = await req.json().catch(() => {
    throw new Error('Invalid JSON payload');
  });

  return schema.parse(body);
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
