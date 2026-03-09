import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="rounded-xl border bg-white p-8 max-w-xl w-full space-y-4">
        <h1 className="text-2xl font-bold">SistemaV Multi-Tenant Prototype</h1>
        <p className="text-slate-600">Choose an area to navigate the role-based app sections.</p>
        <div className="flex gap-3 text-sm">
          <Link className="px-3 py-2 bg-slate-900 text-white rounded" href="/admin">Admin / Backoffice</Link>
          <Link className="px-3 py-2 bg-slate-900 text-white rounded" href="/ops">Team / Operations</Link>
          <Link className="px-3 py-2 bg-slate-900 text-white rounded" href="/client">Client Portal</Link>
        </div>
      </div>
    </main>
  );
}
