import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAuthUser } from '@/lib/auth';
import { getProductById } from '@/services/products';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';

const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return null;

  let product;
  try {
    product = await getProductById(id, user.tenantId);
  } catch {
    notFound();
  }

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={`SKU: ${product.sku ?? '—'}`}
        action={
          <Btn href="/admin/products" variant="secondary" icon={ArrowLeft}>
            Voltar
          </Btn>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Gerais */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Informações Gerais</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Nome</dt>
              <dd className="text-sm font-medium text-slate-900">{product.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">SKU</dt>
              <dd className="text-sm font-mono text-slate-700">{product.sku ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Código de Barras</dt>
              <dd className="text-sm font-mono text-slate-700">{product.barcode ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Categoria</dt>
              <dd className="text-sm text-slate-700">{product.category ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Status</dt>
              <dd><StatusBadge status={product.is_active ? 'active' : 'inactive'} /></dd>
            </div>
          </dl>
        </div>

        {/* Preços */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Preços</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Preço de Venda</dt>
              <dd className="text-sm font-semibold text-emerald-700">{brl(Number(product.price ?? 0))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Preço de Custo</dt>
              <dd className="text-sm font-medium text-slate-700">{brl(Number(product.cost_price ?? 0))}</dd>
            </div>
            {product.price && product.cost_price && (
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Margem</dt>
                <dd className="text-sm font-medium text-blue-700">
                  {(((Number(product.price) - Number(product.cost_price)) / Number(product.price)) * 100).toFixed(1)}%
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Descrição */}
      {product.description && (
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Descrição</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{product.description}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Btn href={`/admin/products/${product.id}/edit`} variant="secondary">
          Editar Produto
        </Btn>
      </div>
    </div>
  );
}
