import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { getPeople } from '@/services/people';
import { getAuthUser } from '@/lib/auth';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';

export default async function PeoplePage() {
  const user = await getAuthUser();
  const people = await getPeople(user?.tenantId ?? '').catch(() => []);

  const rows = people.map((p) => [
    <Link key={p.id} href={`/admin/people/${p.id}`} className="font-medium text-blue-600 hover:underline">
      {p.full_name}
    </Link>,
    p.type === 'individual' ? 'Pessoa Física' : 'Empresa',
    p.email ?? <span className="text-slate-400">—</span>,
    p.phone ?? <span className="text-slate-400">—</span>,
    <StatusBadge key={p.id} status={p.is_active ? 'active' : 'inactive'} />,
    <span key={p.id} className="text-xs text-slate-400">
      {new Date(p.created_at).toLocaleDateString('pt-BR')}
    </span>
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pessoas"
        description={`${people.length} pessoa(s) cadastrada(s)`}
        action={<Btn href="/admin/people/new" icon={Plus}>Nova Pessoa</Btn>}
      />
      {people.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Users size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="font-semibold text-slate-600">Nenhuma pessoa cadastrada</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Adicione clientes, colaboradores ou contatos.</p>
          <Btn href="/admin/people/new" icon={Plus}>Nova Pessoa</Btn>
        </div>
      ) : (
        <DataTable headers={['Nome', 'Tipo', 'Email', 'Telefone', 'Status', 'Criado em']} rows={rows} />
      )}
    </div>
  );
}
