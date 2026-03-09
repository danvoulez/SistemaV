'use client';

import { useState, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Search, User, Mail, Phone, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Person {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  type: string | null;
}

export default function OpsCustomersPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  const handleSearch = useCallback(async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .single();

      const { data, error: searchErr } = await supabase
        .from('people')
        .select('id, full_name, email, phone, type')
        .eq('tenant_id', profile?.tenant_id ?? '')
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .order('full_name')
        .limit(20);

      if (searchErr) throw searchErr;
      setResults(data ?? []);
      setSearched(true);
    } catch (e: any) {
      setError(e.message ?? 'Erro na busca.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch(query);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Busque clientes por nome, e-mail ou telefone."
      />

      {/* Search box */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => handleSearch(query)}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {!searched && !loading && (
        <div className="text-center py-12 text-sm text-slate-400">
          Digite um termo de busca para encontrar clientes.
        </div>
      )}

      {searched && results.length === 0 && (
        <EmptyState
          title="Nenhum resultado"
          description={`Nenhum cliente encontrado para "${query}".`}
          icon={User}
        />
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">{results.length} resultado(s) encontrado(s)</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((person) => (
              <div
                key={person.id}
                className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <User size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{person.full_name}</p>
                      {person.type && (
                        <span className="text-xs text-slate-400 capitalize">{person.type}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {person.email && (
                    <a
                      href={`mailto:${person.email}`}
                      className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      <Mail size={12} className="text-slate-400" />
                      {person.email}
                    </a>
                  )}
                  {person.phone && (
                    <a
                      href={`tel:${person.phone}`}
                      className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      <Phone size={12} className="text-slate-400" />
                      {person.phone}
                    </a>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
                  <Link
                    href={`/ops/orders?customer=${person.id}`}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <ExternalLink size={11} />
                    Ver pedidos
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
