import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { DigitalFile, ObjectRecord } from '@/types/database';

export async function getFiles(tenantId: string): Promise<(DigitalFile & { object: ObjectRecord })[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('digital_files')
    .select(`
      *,
      object:objects!object_id(id, title, description, owner_type, owner_person_id, owner_tenant_id, created_at)
    `)
    .eq('object.tenant_id' as never, tenantId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as (DigitalFile & { object: ObjectRecord })[];
}

export async function getFilesByPerson(personId: string, tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('digital_files')
    .select(`
      *,
      object:objects!object_id(*)
    `)
    .eq('object.owner_person_id' as never, personId)
    .eq('object.tenant_id' as never, tenantId);
  if (error) throw error;
  return data ?? [];
}

export async function createFileRecord(
  tenantId: string,
  data: {
    ownerType: 'person' | 'tenant';
    ownerPersonId?: string;
    title: string;
    description?: string;
    storageBucket: string;
    storagePath: string;
    mimeType?: string;
    sizeBytes?: number;
    uploadedBy?: string;
  }
): Promise<{ object: ObjectRecord; file: DigitalFile }> {
  const supabase = await createSupabaseServerClient();

  const { data: object, error: objectError } = await supabase
    .from('objects')
    .insert({
      tenant_id: tenantId,
      owner_type: data.ownerType,
      owner_person_id: data.ownerType === 'person' ? data.ownerPersonId : null,
      owner_tenant_id: data.ownerType === 'tenant' ? tenantId : null,
      object_type: 'digital_file',
      title: data.title,
      description: data.description,
      created_by: data.uploadedBy
    })
    .select()
    .single();

  if (objectError) throw objectError;

  const { data: file, error: fileError } = await supabase
    .from('digital_files')
    .insert({
      object_id: object.id,
      storage_bucket: data.storageBucket,
      storage_path: data.storagePath,
      mime_type: data.mimeType,
      size_bytes: data.sizeBytes,
      uploaded_by: data.uploadedBy,
      uploaded_at: new Date().toISOString()
    })
    .select()
    .single();

  if (fileError) throw fileError;

  return { object: object as ObjectRecord, file: file as DigitalFile };
}
