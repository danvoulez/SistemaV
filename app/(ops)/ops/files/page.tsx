'use client';

import { useState, useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { EmptyState } from '@/components/empty-state';
import { Upload, File, Download, Loader2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  title: string;
  description: string | null;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
}

export default function OpsFilesPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createSupabaseBrowserClient();

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      const { data, error: filesErr } = await supabase
        .from('digital_files')
        .select('*')
        .eq('tenant_id', profile?.tenant_id ?? '')
        .order('created_at', { ascending: false })
        .limit(20);

      if (filesErr) throw filesErr;
      setFiles(data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar arquivos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || !title.trim()) return;

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado.');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, person_id')
        .eq('id', user.id)
        .single();

      const ext = file.name.split('.').pop();
      const storagePath = `${profile?.tenant_id}/${Date.now()}-${file.name}`;

      const { error: storageErr } = await supabase.storage
        .from('private-files')
        .upload(storagePath, file);

      if (storageErr) throw storageErr;

      // Create digital_file record
      const { error: recordErr } = await supabase.from('digital_files').insert({
        tenant_id: profile?.tenant_id,
        title: title.trim(),
        description: description.trim() || null,
        storage_path: storagePath,
        file_type: file.type || ext || null,
        file_size: file.size,
        owner_person_id: profile?.person_id ?? null,
        created_by: user.id,
      });

      if (recordErr) throw recordErr;

      setTitle('');
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccessMsg('Arquivo enviado com sucesso!');
      await loadFiles();
    } catch (e: any) {
      setError(e.message ?? 'Erro ao fazer upload.');
    } finally {
      setUploading(false);
    }
  };

  const getDownloadUrl = async (storagePath: string) => {
    const { data } = await supabase.storage
      .from('private-files')
      .createSignedUrl(storagePath, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Arquivos"
        description="Upload e gerenciamento de arquivos da operação."
      />

      {/* Upload form */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Enviar Arquivo</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Nome do arquivo..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Descrição (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Arquivo *</label>
            <input
              type="file"
              ref={fileInputRef}
              required
              className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMsg && <p className="text-sm text-emerald-600">{successMsg}</p>}

          <Btn type="submit" icon={uploading ? Loader2 : Upload} disabled={uploading || !title.trim()}>
            {uploading ? 'Enviando...' : 'Enviar Arquivo'}
          </Btn>
        </form>
      </div>

      {/* Recent uploads */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Uploads Recentes</h2>

        {loading ? (
          <div className="text-sm text-slate-400 text-center py-8">Carregando arquivos...</div>
        ) : files.length === 0 ? (
          <EmptyState
            title="Nenhum arquivo"
            description="Nenhum arquivo foi enviado ainda."
            icon={File}
          />
        ) : (
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Título</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tamanho</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {files.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <File size={14} className="text-slate-400 shrink-0" />
                        <div>
                          <p className="font-medium text-slate-800">{f.title}</p>
                          {f.description && (
                            <p className="text-xs text-slate-400">{f.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{f.file_type ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatSize(f.file_size)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(f.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => getDownloadUrl(f.storage_path)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Download size={12} />
                        Baixar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
