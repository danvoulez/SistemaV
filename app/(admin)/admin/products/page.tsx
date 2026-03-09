import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAuthUser } from '@/lib/auth';
import { getProducts } from '@/services/products';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';

const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default async function ProductsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const products = await getProducts(user.tenantId);

  const rows = products.map((p) => [
    <Link key={p.id} href={`/admin/products/${p.id}`} className="font-medium text-blue-600 hover:underline">
      {p.name}
    </Link>,
    <span key="sku" className="font-mono text-xs text-slate-500">{p.sku ?? '—'}</span>,
    <span key="price">{brl(Number(p.price ?? 0))}</span>,
    <span key="cat">{p.category ?? '—'}</span>,
    <StatusBadge key="status" status={p.is_active ? 'active' : 'inactive'} />,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Gerencie o catálogo de produtos"
        action={
          <Btn href="/admin/products/new" icon={Plus}>
            Novo Produto
          </Btn>
        }
      />
      <DataTable
        headers={['Nome', 'SKU', 'Preço de Venda', 'Categoria', 'Status']}
        rows={rows}
        emptyMessage="Nenhum produto cadastrado."
      />
    </div>
  );
}
