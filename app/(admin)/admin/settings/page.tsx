'use client';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { Building2, Users, Save, Check } from 'lucide-react';

interface Profile { id: string; full_name: string; email: string; role: string; status: string; created_at: string; }
interface Tenant { id: string; name: string; slug: string; status: string; }

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [userName, setUserName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('*, tenant:tenants!tenant_id(*)').eq('id', user.id).single();
      if (!profile) return;
      const t = (profile as { tenant?: Tenant }).tenant;
      if (t) { setTenant(t); setTenantName(t.name); }
      setCurrentUser(profile as Profile);
      setUserName(profile.full_name);
      const { data: allProfiles } = await supabase.from('profiles').select('*').eq('tenant_id', profile.tenant_id).order('full_name');
      setProfiles(allProfiles ?? []);
    }
    load();
  }, []);

  async function saveTenant() {
    if (!tenant) return;
    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.from('tenants').update({ name: tenantName }).eq('id', tenant.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function saveProfile() {
    if (!currentUser) return;
    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.from('profiles').update({ full_name: userName }).eq('id', currentUser.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader title="Configurações" description="Configurações do tenant e perfil." />

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Building2 size={16} /> Dados do Tenant</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Organização</label>
          <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {tenant && (
          <div className="text-sm text-slate-500">
            <span className="font-medium">Slug:</span> {tenant.slug} &nbsp;|&nbsp;
            <span className="font-medium">Status:</span> {tenant.status} &nbsp;|&nbsp;
            <span className="font-medium">ID:</span> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{tenant.id}</code>
          </div>
        )}
        <Btn onClick={saveTenant} disabled={saving} icon={saved ? Check : Save} variant={saved ? 'secondary' : 'primary'}>
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar'}
        </Btn>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Users size={16} /> Meu Perfil</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
          <input value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {currentUser && (
          <div className="text-sm text-slate-500">
            <span className="font-medium">Email:</span> {currentUser.email} &nbsp;|&nbsp;
            <StatusBadge status={currentUser.role} />
          </div>
        )}
        <Btn onClick={saveProfile} disabled={saving} icon={saved ? Check : Save} variant={saved ? 'secondary' : 'primary'}>
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar Perfil'}
        </Btn>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4"><Users size={16} /> Equipe ({profiles.length})</h2>
        <DataTable
          headers={['Nome', 'Email', 'Role', 'Status']}
          rows={profiles.map((p) => [
            p.full_name,
            p.email,
            <StatusBadge key={p.id} status={p.role} />,
            <StatusBadge key={p.id} status={p.status} />
          ])}
          emptyMessage="Nenhum membro na equipe."
        />
      </div>
    </div>
  );
}
