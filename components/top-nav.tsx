export function TopNav({ title }: { title: string }) {
  return (
    <header className="rounded-lg bg-white border p-4 flex justify-between items-center">
      <div>
        <p className="text-xs uppercase text-slate-500">SistemaV</p>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="text-xs text-slate-500">Tenant: acme-industries</div>
    </header>
  );
}
