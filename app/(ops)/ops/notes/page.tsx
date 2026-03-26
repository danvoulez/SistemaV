'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { EmptyState } from '@/components/empty-state';
import { Plus, FileText, Trash2, X } from 'lucide-react';
import type { PostgrestError } from '@supabase/supabase-js';

interface Note {
  id: string;
  title: string | null;
  content: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export default function OpsNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      setUserId(user.id);
      setTenantId(profile.tenant_id);

      const { data, error: notesErr } = await supabase
        .from('notes')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('visibility', 'team')
        .order('updated_at', { ascending: false });

      if (notesErr) throw notesErr;
      setNotes(data ?? []);
    } catch (error: unknown) {
      const message = (error as PostgrestError)?.message;
      setError(message ?? 'Erro ao carregar notas.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim() || !userId || !tenantId) return;
    setSubmitting(true);
    try {
      const { error: insertErr } = await supabase.from('notes').insert({
        tenant_id: tenantId,
        created_by: userId,
        title: formTitle.trim() || null,
        content: formContent.trim(),
        visibility: 'team',
      });
      if (insertErr) throw insertErr;
      setFormTitle('');
      setFormContent('');
      setShowForm(false);
      await loadData();
    } catch (error: unknown) {
      const message = (error as PostgrestError)?.message;
      setError(message ?? 'Erro ao criar nota.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!userId) return;
    try {
      await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('created_by', userId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (error: unknown) {
      const message = (error as PostgrestError)?.message;
      setError(message ?? 'Erro ao excluir nota.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notas da Equipe"
        description="Notas visíveis para todos os membros da equipe."
        action={
          <Btn icon={Plus} onClick={() => setShowForm(true)}>
            Nova Nota
          </Btn>
        }
      />

      {/* New note form */}
      {showForm && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Nova Nota</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Título (opcional)</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Título da nota..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Conteúdo *</label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={4}
                required
                placeholder="Escreva a nota aqui..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <Btn type="submit" disabled={submitting || !formContent.trim()}>
                {submitting ? 'Salvando...' : 'Salvar Nota'}
              </Btn>
              <Btn variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Btn>
            </div>
          </form>
        </div>
      )}

      {/* Notes grid */}
      {loading ? (
        <div className="text-sm text-slate-400 text-center py-12">Carregando notas...</div>
      ) : notes.length === 0 ? (
        <EmptyState
          title="Nenhuma nota da equipe"
          description="Crie a primeira nota para compartilhar com a equipe."
          icon={FileText}
          action={
            <Btn icon={Plus} onClick={() => setShowForm(true)}>
              Nova Nota
            </Btn>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-slate-800 leading-snug">
                  {note.title || 'Sem título'}
                </h3>
                {note.created_by === userId && (
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-4">{note.content}</p>
              <p className="text-xs text-slate-400 mt-3">
                {new Date(note.updated_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
