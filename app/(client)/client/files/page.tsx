import { requireAuth } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { FolderOpen, File, Download, AlertCircle } from 'lucide-react';

const formatBytes = (bytes?: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default async function ClientFilesPage() {
  const user = await requireAuth('client');

  if (!user.personId) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-5">
        <AlertCircle size={20} className="text-amber-600 shrink-0" />
        <p className="text-sm text-amber-700">
          Perfil não configurado. Contacte o administrador.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  // Fetch digital_files owned by this person
  const { data: digitalFiles } = await supabase
    .from('digital_files')
    .select('id, title, description, file_type, file_size, storage_path, created_at')
    .eq('tenant_id', user.tenantId)
    .eq('owner_person_id', user.personId)
    .order('created_at', { ascending: false });

  const files = digitalFiles ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus Arquivos"
        description={`${files.length} arquivo(s) disponível(is).`}
      />

      {files.length === 0 ? (
        <EmptyState
          title="Nenhum arquivo"
          description="Seus documentos e arquivos compartilhados aparecerão aqui."
          icon={FolderOpen}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => (
            <div
              key={f.id}
              className="bg-white border rounded-xl p-4 flex items-start gap-3 hover:shadow-md transition-shadow"
            >
              <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                <File size={18} className="text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 truncate text-sm">{f.title}</p>
                {f.description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{f.description}</p>
                )}
                <p className="text-xs text-slate-400 mt-0.5">
                  {f.file_type ?? 'Arquivo'} · {formatBytes(f.file_size)}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(f.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="shrink-0">
                <span
                  title="Download disponível no portal"
                  className="inline-flex items-center gap-1 text-xs text-blue-500 cursor-not-allowed opacity-50"
                >
                  <Download size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
