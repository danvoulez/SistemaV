import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { ShoppingCart, AlertCircle } from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default async function ClientOrdersPage() {
  const user = await requireAuth('client');

  if (!user.personId) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-5">
        <AlertCircle size={20} className="text-amber-600 shrink-0" />
        <p className="text-sm text-amber-700">
          Perfil não configurado. Contacte o administrador para vincular sua conta a um cliente.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: orders } = await supabase
    .from('sales_orders')
    .select('id, order_number, status, payment_status, total_amount, created_at')
    .eq('tenant_id', user.tenantId)
    .eq('customer_person_id', user.personId)
    .order('created_at', { ascending: false });

  const list = orders ?? [];

  const rows = list.map((o) => [
    <Link key="num" href={`/client/orders/${o.id}`} className="font-medium text-blue-600 hover:underline">
      {o.order_number}
    </Link>,
    <StatusBadge key="status" status={o.status} />,
    <StatusBadge key="payment" status={o.payment_status ?? 'pending'} />,
    <span key="total">{fmt(Number(o.total_amount ?? 0))}</span>,
    <span key="date">{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus Pedidos"
        description={`${list.length} pedido(s) encontrado(s).`}
      />

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum pedido"
          description="Você ainda não tem pedidos no sistema."
          icon={ShoppingCart}
        />
      ) : (
        <DataTable
          headers={['Nº Pedido', 'Status', 'Pagamento', 'Total', 'Data']}
          rows={rows}
        />
      )}
    </div>
  );
}
