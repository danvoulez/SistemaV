import { getInventoryBalances, getInventoryLocations, getInventoryMovements } from '@/services/inventory';
import { getAuthUser } from '@/lib/auth';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/kpi-card';
import { Btn } from '@/components/btn';
import { Warehouse, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';

export default async function InventoryPage() {
  const user = await getAuthUser();
  const tenantId = user?.tenantId ?? '';

  const [balances, locations, movements] = await Promise.all([
    getInventoryBalances(tenantId).catch(() => []),
    getInventoryLocations(tenantId).catch(() => []),
    getInventoryMovements(tenantId, 20).catch(() => [])
  ]);

  const lowStock = balances.filter((b) => b.quantity_available <= 0);
  const totalSKUs = new Set(balances.map((b) => b.merchandise_id)).size;

  const kpis = [
    { label: 'Localizações', value: String(locations.length), icon: MapPin, color: 'blue' as const },
    { label: 'SKUs Rastreados', value: String(totalSKUs), icon: Warehouse, color: 'blue' as const },
    { label: 'Estoque Crítico', value: String(lowStock.length), icon: AlertTriangle, color: 'red' as const },
    { label: 'Movimentações', value: String(movements.length), icon: TrendingUp, color: 'emerald' as const }
  ];

  type BalanceWithRels = typeof balances[number] & {
    merchandise?: { sku?: string; object?: { title?: string } };
    location?: { name?: string };
  };

  const balanceRows = (balances as BalanceWithRels[]).map((b) => [
    b.merchandise?.object?.title ?? 'Sem nome',
    b.merchandise?.sku ?? '—',
    b.location?.name ?? '—',
    <span key={b.id} className={b.quantity_on_hand > 0 ? 'text-slate-700' : 'text-red-600 font-medium'}>{b.quantity_on_hand}</span>,
    <span key={b.id} className="text-orange-600">{b.quantity_reserved}</span>,
    <span key={b.id} className={b.quantity_available > 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>{b.quantity_available}</span>
  ]);

  type MovementWithRels = typeof movements[number] & { location?: { name?: string } };
  const movementRows = (movements as MovementWithRels[]).map((m) => [
    <StatusBadge key={m.id} status={m.movement_type} />,
    <span key={m.id} className={['in', 'release'].includes(m.movement_type) ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
      {['in', 'release'].includes(m.movement_type) ? '+' : '-'}{m.quantity}
    </span>,
    m.location?.name ?? '—',
    new Date(m.created_at).toLocaleDateString('pt-BR')
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Estoque" description="Controle de saldos e movimentações" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={{ label: k.label, value: k.value }} icon={k.icon} color={k.color} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-3">Saldos de Estoque</h2>
          <DataTable headers={['Item', 'SKU', 'Local', 'Em Mãos', 'Reservado', 'Disponível']} rows={balanceRows} emptyMessage="Sem saldos registrados." />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-3">Movimentações Recentes</h2>
          <DataTable headers={['Tipo', 'Qtd', 'Local', 'Data']} rows={movementRows} emptyMessage="Sem movimentações." />
        </div>
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Localizações ({locations.length})</h2>
        <DataTable
          headers={['Nome', 'Tipo', 'Status']}
          rows={locations.map((l) => [l.name, l.type, <StatusBadge key={l.id} status={l.is_active ? 'active' : 'inactive'} />])}
          emptyMessage="Sem localizações cadastradas."
        />
      </div>
    </div>
  );
}
