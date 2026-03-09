import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.24.2';

export const AnyPayloadSchema = z.record(z.any());

export function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

/**
 * Verifies the Authorization JWT and returns the caller's tenant_id.
 * Throws if the token is missing, invalid, or the profile is not found.
 */
export async function getCallerTenantId(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  const token = authHeader.slice(7);

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) throw new Error('Unauthorized');

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) throw new Error('Profile not found');
  return profile.tenant_id as string;
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
