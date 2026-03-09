import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { OrderForm } from '@/components/order-form';

export default function OrdersPage() {
  return (
    <section className="space-y-4">
      <DataTable
        headers={['Order', 'Customer', 'Status', 'Total']}
        rows={[
          ['SO-001', 'Ana Client', <StatusBadge key='a' status='confirmed' />, '250.00'],
          ['SO-002', 'Carlos Client', <StatusBadge key='b' status='draft' />, '120.00']
        ]}
      />
      <OrderForm />
    </section>
  );
}
