import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { EmptyState } from '@/components/empty-state';
import { FolderOpen, Upload, File } from 'lucide-react';

function formatBytes(bytes?: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function FilesPage() {
  const user = await getAuthUser();
  const supabase = await createSupabaseServerClient();

  const { data: objects } = await supabase
    .from('objects')
    .select('id, title, description, owner_type, created_at, digital_files(id, storage_bucket, storage_path, mime_type, size_bytes, uploaded_at)')
    .eq('tenant_id', user?.tenantId ?? '')
    .eq('object_type', 'digital_file')
    .order('created_at', { ascending: false });

  const files = (objects ?? []).flatMap((o) => {
    const df = (o as { digital_files?: Array<{ id: string; storage_bucket: string; storage_path: string; mime_type?: string; size_bytes?: number; uploaded_at: string }> }).digital_files ?? [];
    return df.map((f) => ({ ...f, objectTitle: o.title, ownerType: o.owner_type, createdAt: o.created_at }));
  });

  const rows = files.map((f) => [
    <div key={f.id} className="flex items-center gap-2">
      <File size={14} className="text-slate-400" />
      <span className="font-medium text-slate-800">{f.objectTitle}</span>
    </div>,
    f.mime_type ?? '—',
    f.storage_bucket,
    formatBytes(f.size_bytes),
    new Date(f.uploaded_at).toLocaleDateString('pt-BR')
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Arquivos"
        description={`${files.length} arquivo(s) armazenado(s)`}
        action={<Btn href="/ops/files" icon={Upload}>Upload de Arquivo</Btn>}
      />
      {files.length === 0 ? (
        <EmptyState title="Nenhum arquivo" description="Faça upload de documentos, imagens e outros arquivos." icon={FolderOpen} action={<Btn href="/ops/files" icon={Upload}>Upload de Arquivo</Btn>} />
      ) : (
        <DataTable headers={['Nome', 'Tipo', 'Bucket', 'Tamanho', 'Enviado em']} rows={rows} />
      )}
    </div>
  );
}
