import Link from 'next/link';
import { NavItem } from '@/types/domain';

export function Sidebar({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <aside className="hidden md:block border-r bg-white p-4">
      <h1 className="font-semibold text-lg mb-4">{title}</h1>
      <nav className="space-y-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="block rounded px-3 py-2 text-sm hover:bg-slate-100">
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
