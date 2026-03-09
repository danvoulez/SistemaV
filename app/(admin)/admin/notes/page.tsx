'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Lock, Users } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';

interface Note {
  id: string;
  title?: string;
  content: string;
  visibility: 'private' | 'team';
  created_at: string;
  updated_at: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    visibility: 'private' as 'private' | 'team',
  });

  const fetchNotes = async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) return;

    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .or(`visibility.eq.team,created_by.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    setNotes(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setSaving(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const { error: insertError } = await supabase.from('notes').insert({
      tenant_id: profile?.tenant_id,
      created_by: user.id,
      title: form.title.trim() || null,
      content: form.content.trim(),
      visibility: form.visibility,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm({ title: '', content: '', visibility: 'private' });
      setShowForm(false);
      await fetchNotes();
    }
    setSaving(false);
  };

  const inputClass =
    'block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notas"
        description="Suas anotações e notas da equipe"
        action={
          <Btn onClick={() => setShowForm(!showForm)} icon={showForm ? X : Plus} variant={showForm ? 'secondary' : 'primary'}>
            {showForm ? 'Cancelar' : 'Nova Nota'}
          </Btn>
        }
      />

      {/* Inline create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Nova Nota</h2>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título (opcional)</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Título da nota"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Conteúdo *</label>
            <textarea
              rows={4}
              required
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              placeholder="Escreva sua nota..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Visibilidade</label>
            <select
              value={form.visibility}
              onChange={(e) => setForm((p) => ({ ...p, visibility: e.target.value as 'private' | 'team' }))}
              className={inputClass}
            >
              <option value="private">Privada</option>
              <option value="team">Equipe</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Btn>
            <Btn type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Nota'}</Btn>
          </div>
        </form>
      )}

      {/* Notes grid */}
      {loading ? (
        <div className="text-center text-slate-400 text-sm py-12">Carregando...</div>
      ) : notes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 text-sm">
          Nenhuma nota encontrada. Crie sua primeira nota!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow space-y-3 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900 text-sm leading-snug">
                  {note.title || 'Sem título'}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${
                    note.visibility === 'private'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {note.visibility === 'private' ? (
                    <><Lock size={10} /> Privada</>
                  ) : (
                    <><Users size={10} /> Equipe</>
                  )}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed flex-1 line-clamp-4">
                {note.content}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(note.updated_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
