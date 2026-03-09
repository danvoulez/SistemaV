import clsx from 'clsx';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Rascunho' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmado' },
  paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Pago' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado' },
  packed: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Embalado' },
  shipped: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Enviado' },
  delivered: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Entregue' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendente' },
  partial: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Parcial' },
  refunded: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Reembolsado' },
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Agendado' },
  in_transit: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Em trânsito' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Falhou' },
  returned: { bg: 'bg-red-100', text: 'text-red-700', label: 'Devolvido' },
  todo: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'A fazer' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Em progresso' },
  blocked: { bg: 'bg-red-100', text: 'text-red-700', label: 'Bloqueado' },
  done: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Concluído' },
  low: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Baixa' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Média' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Alta' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgente' },
  income: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Receita' },
  expense: { bg: 'bg-red-100', text: 'text-red-700', label: 'Despesa' },
  active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Ativo' },
  inactive: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Inativo' },
  transfer: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Transferência' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', label: status };
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.bg, config.text)}>
      {config.label}
    </span>
  );
}
