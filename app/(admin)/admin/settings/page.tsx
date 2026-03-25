'use client';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { Building2, Users, Save, Check } from 'lucide-react';

interface Profile { id: string; full_name: string; email: string; role: string; status: string; }
interface Tenant { id: string; name: string; slug: string; status: string; }

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [userName, setUserName] = useState('');
  const [saving, setSaving] = useState<'tenant' | 'profile' | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('*, tenant:tenants!tenant_id(*)').eq('id', user.id).single();
    if (!profile) return;
    const t = (profile as { tenant?: Tenant }).tenant;
    if (t) { setTenant(t); setTenantName(t.name); }
    setCurrentUser(profile as Profile);
    setUserName(profile.full_name);
    const { data: allProfiles } = await supabase.from('profiles').select('id,full_name,email,role,status').eq('tenant_id', profile.tenant_id).order('full_name');
    setProfiles(allProfiles ?? []);
  })(); }, [supabase]);

  async function saveTenant() {
    if (!tenant) return;
    setSaving('tenant'); setFeedback(null);
    const response = await fetch('/api/settings/tenant', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: tenantName }) });
    const body = await response.json();
    setSaving(null);
    setFeedback(response.ok ? 'Configurações do tenant salvas com sucesso.' : body.error ?? 'Falha ao salvar tenant.');
  }

  async function saveProfile() {
    setSaving('profile'); setFeedback(null);
    const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: userName }) });
    const body = await response.json();
    setSaving(null);
    setFeedback(response.ok ? 'Perfil atualizado com sucesso.' : body.error ?? 'Falha ao salvar perfil.');
  }

  return (<div className="space-y-8 max-w-3xl"><PageHeader title="Configurações" description="Configurações do tenant e perfil." />
    {feedback && <p className={`text-sm ${feedback.includes('sucesso') ? 'text-emerald-600' : 'text-red-600'}`}>{feedback}</p>}
    <div className="bg-white rounded-xl border p-6 space-y-4"><h2 className="font-semibold text-slate-800 flex items-center gap-2"><Building2 size={16} /> Dados do Tenant</h2>
      <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
      {tenant && <div className="text-sm text-slate-500"><span className="font-medium">Slug:</span> {tenant.slug}</div>}
      <Btn onClick={saveTenant} disabled={saving !== null} icon={saving === 'tenant' ? Save : Check}>{saving === 'tenant' ? 'Salvando...' : 'Salvar Tenant'}</Btn></div>

    <div className="bg-white rounded-xl border p-6 space-y-4"><h2 className="font-semibold text-slate-800 flex items-center gap-2"><Users size={16} /> Meu Perfil</h2>
      <input value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
      {currentUser && <div className="text-sm text-slate-500"><span className="font-medium">Email:</span> {currentUser.email}</div>}
      <Btn onClick={saveProfile} disabled={saving !== null} icon={saving === 'profile' ? Save : Check}>{saving === 'profile' ? 'Salvando...' : 'Salvar Perfil'}</Btn></div>

    <div className="bg-white rounded-xl border p-6"><h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4"><Users size={16} /> Equipe ({profiles.length})</h2>
      <DataTable headers={['Nome', 'Email', 'Role', 'Status']} rows={profiles.map((p) => [p.full_name, p.email, <StatusBadge key={`${p.id}-r`} status={p.role} />, <StatusBadge key={`${p.id}-s`} status={p.status} />])} emptyMessage="Nenhum membro na equipe." /></div></div>);
}
