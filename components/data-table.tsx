import { ReactNode } from 'react';

export function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="rounded-lg border bg-white overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>{headers.map((h) => <th key={h} className="p-3">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">{r.map((cell, j) => <td key={j} className="p-3">{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
