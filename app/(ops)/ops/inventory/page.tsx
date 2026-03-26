import { requireMemberOrAdmin } from '@/lib/auth';
import { getInventoryBalances, getInventoryLocations } from '@/services/inventory';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Package } from 'lucide-react';
import { InventoryMovementForm } from './inventory-movement-form';

export default async function OpsInventoryPage() {
  const user = await requireMemberOrAdmin();

  const [balances, locations] = await Promise.all([
    getInventoryBalances(user.tenantId),
    getInventoryLocations(user.tenantId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque"
        description="Saldos de estoque por produto e localização."
      />

      {/* Balances table */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Saldos de Estoque</h2>
        {balances.length === 0 ? (
          <EmptyState
            title="Sem registros de estoque"
            description="Nenhum saldo de estoque encontrado."
            icon={Package}
          />
        ) : (
          <DataTable
            headers={['Produto', 'SKU', 'Localização', 'Disponível', 'Em Mãos', 'Reservado']}
            rows={balances.map((b) => {
              const merch = b.merchandise;
              const loc = b.location;
              const title = merch?.object?.title ?? merch?.sku ?? '—';
              const isLow = (b.quantity_available ?? 0) <= 0;
              return [
                <span key="title" className="font-medium text-slate-800">{title}</span>,
                <span key="sku" className="text-slate-500 font-mono text-xs">{merch?.sku ?? '—'}</span>,
                <span key="loc">{loc?.name ?? '—'}</span>,
                <span key="avail" className={`font-semibold ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
                  {b.quantity_available ?? 0}
                </span>,
                <span key="onhand">{b.quantity_on_hand ?? 0}</span>,
                <span key="reserved">{b.quantity_reserved ?? 0}</span>,
              ];
            })}
          />
        )}
      </section>

      {/* Record movement form */}
      <InventoryMovementForm locations={locations} userId={user.id} />
    </div>
  );
}
