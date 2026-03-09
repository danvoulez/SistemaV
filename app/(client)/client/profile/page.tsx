'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { StatusBadge } from '@/components/status-badge';
import { Save, Check, User, Mail, Phone, Link2 } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  person_id: string | null;
  avatar_url: string | null;
}

interface Person {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  type: string | null;
}

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at, person_id, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setName(profileData.full_name ?? '');

        if (profileData.person_id) {
          const { data: personData } = await supabase
            .from('people')
            .select('id, full_name, email, phone, type')
            .eq('id', profileData.person_id)
            .single();
          if (personData) setPerson(personData);
        }
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!profile || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { error: saveErr } = await supabase
        .from('profiles')
        .update({ full_name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      if (saveErr) throw saveErr;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="text-sm text-slate-400 text-center py-12">Carregando perfil...</div>
    );
  }

  const initials = profile.full_name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Meu Perfil" description="Suas informações de conta." />

      {/* Profile card */}
      <div className="bg-white rounded-xl border p-6 space-y-5 shadow-sm">
        {/* Avatar + summary */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{profile.full_name}</p>
            <p className="text-sm text-slate-500">{profile.email}</p>
            <div className="mt-1">
              <StatusBadge status={profile.role} />
            </div>
          </div>
        </div>

        {/* Edit name */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Nome Completo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-sm text-slate-500">
          <span className="font-medium text-slate-700">Membro desde:</span>{' '}
          {new Date(profile.created_at).toLocaleDateString('pt-BR')}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Btn
          onClick={handleSave}
          disabled={saving || !name.trim()}
          icon={saved ? Check : Save}
          variant={saved ? 'secondary' : 'primary'}
        >
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar Alterações'}
        </Btn>
      </div>

      {/* Linked person info */}
      {person ? (
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Link2 size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Cadastro Vinculado</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <User size={14} className="text-slate-400" />
              <span className="font-medium">{person.full_name}</span>
              {person.type && (
                <span className="text-xs text-slate-400 capitalize ml-1">({person.type})</span>
              )}
            </div>
            {person.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={14} className="text-slate-400" />
                <a href={`mailto:${person.email}`} className="hover:text-blue-600 transition-colors">
                  {person.email}
                </a>
              </div>
            )}
            {person.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={14} className="text-slate-400" />
                <a href={`tel:${person.phone}`} className="hover:text-blue-600 transition-colors">
                  {person.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-5 text-center">
          <p className="text-sm text-slate-400">
            Nenhum cadastro de cliente vinculado a esta conta.
          </p>
        </div>
      )}
    </div>
  );
}
