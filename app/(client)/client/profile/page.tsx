'use client';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { StatusBadge } from '@/components/status-badge';
import { Save, Check } from 'lucide-react';

interface Profile { id: string; full_name: string; email: string; role: string; created_at: string; person_id: string | null; }

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { (async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('id,full_name,email,role,created_at,person_id').eq('id', user.id).single();
    if (data) { setProfile(data); setName(data.full_name); }
  })(); }, []);

  const handleSave = async () => {
    setSaving(true); setError(null);
    const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: name }) });
    const body = await response.json();
    if (!response.ok) setError(body.error ?? 'Erro ao salvar.');
    else { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

  if (!profile) return <div className="text-sm text-slate-400 text-center py-12">Carregando perfil...</div>;
  return <div className="space-y-6 max-w-lg"><PageHeader title="Meu Perfil" description="Suas informações de conta." /><div className="bg-white rounded-xl border p-6 space-y-5 shadow-sm"><p className="font-semibold text-slate-900">{profile.full_name}</p><p className="text-sm text-slate-500">{profile.email}</p><StatusBadge status={profile.role} /><input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />{error && <p className="text-sm text-red-600">{error}</p>}<Btn onClick={handleSave} disabled={saving || !name.trim()} icon={saved ? Check : Save}>{saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Alterações'}</Btn></div></div>;
}
