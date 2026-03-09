import { ReactNode } from 'react';

interface DataTableProps {
  headers: string[];
  rows: ReactNode[][];
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable({ headers, rows, emptyMessage = 'Nenhum registro encontrado.', loading }: DataTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="p-8 text-center text-slate-400 text-sm">Carregando...</div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="p-8 text-center text-slate-400 text-sm">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white overflow-x-auto shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50 transition-colors">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
