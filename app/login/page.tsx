'use client';

import { Suspense, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/admin';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createSupabaseBrowserClient();
    const { error: authError, data } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Email ou senha inválidos.');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    const role = profile?.role ?? 'client';
    const redirect = role === 'admin' ? '/admin' : role === 'member' ? '/ops' : '/client';
    router.push(next.startsWith('/') ? next : redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm" placeholder="seu@email.com" /></div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Senha</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm" placeholder="••••••••" /></div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60">{loading ? 'Entrando...' : 'Entrar'}</button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md"><div className="bg-white rounded-2xl shadow-xl p-8"><div className="mb-8 text-center"><h1 className="text-3xl font-bold text-slate-900">SistemaV</h1><p className="text-slate-500 mt-2">Plataforma de Gestão Empresarial</p></div><Suspense fallback={<p className="text-sm text-slate-400">Carregando...</p>}><LoginForm /></Suspense><p className="mt-6 text-center text-xs text-slate-400">Problemas para acessar? Contate o administrador.</p></div></div>
    </div>
  );
}
