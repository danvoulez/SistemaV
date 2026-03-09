import { getPersonById } from '@/services/people';
import { getAuthUser } from '@/lib/auth';
import { getOrders } from '@/services/orders';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, FileText, MapPin, ShoppingCart } from 'lucide-react';
import { notFound } from 'next/navigation';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

type PersonWithAddresses = {
  addresses?: Array<{ id: string; label: string; street: string; number: string; city: string; state: string }>;
  id: string; full_name: string; type: string; email?: string; phone?: string;
  document_type?: string; document_number?: string; notes?: string;
  is_active: boolean; created_at: string; customer_person_id?: string;
};

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  const person = await getPersonById(id, user?.tenantId ?? '').catch(() => null) as PersonWithAddresses | null;
  if (!person) notFound();

  const allOrders = await getOrders(user?.tenantId ?? '').catch(() => []);
  const personOrders = allOrders.filter((o) => o.customer_person_id === id);

  return (
    <div className="space-y-6">
      <Btn variant="ghost" href="/admin/people" icon={ArrowLeft} size="sm">Voltar</Btn>

      <PageHeader
        title={person.full_name}
        description={person.type === 'individual' ? 'Pessoa Física' : 'Empresa'}
        action={<StatusBadge status={person.is_active ? 'active' : 'inactive'} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Informações de Contato</h3>
            <div className="space-y-3">
              {person.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-slate-400" />
                  <span>{person.email}</span>
                </div>
              )}
              {person.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-slate-400" />
                  <span>{person.phone}</span>
                </div>
              )}
              {person.document_number && (
                <div className="flex items-center gap-3 text-sm">
                  <FileText size={16} className="text-slate-400" />
                  <span>{person.document_type?.toUpperCase()}: {person.document_number}</span>
                </div>
              )}
              {person.notes && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-slate-500 mb-1">Observações</p>
                  <p className="text-sm text-slate-700">{person.notes}</p>
                </div>
              )}
            </div>
          </div>

          {person.addresses && person.addresses.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin size={16} /> Endereços
              </h3>
              <div className="space-y-3">
                {person.addresses.map((addr) => (
                  <div key={addr.id} className="text-sm text-slate-600 border rounded-lg p-3">
                    <p className="font-medium text-slate-800">{addr.label}</p>
                    <p>{addr.street}, {addr.number} — {addr.city}, {addr.state}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {personOrders.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <ShoppingCart size={16} /> Pedidos ({personOrders.length})
              </h3>
              <div className="space-y-2">
                {personOrders.slice(0, 5).map((o) => (
                  <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{o.order_number}</p>
                      <p className="text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={o.status} />
                      <span className="text-sm font-semibold">{fmt(Number(o.total_amount))}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Resumo</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total de Pedidos</span>
                <span className="font-medium">{personOrders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Total</span>
                <span className="font-medium">{fmt(personOrders.reduce((s, o) => s + Number(o.total_amount), 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cadastrado em</span>
                <span className="font-medium">{new Date(person.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
