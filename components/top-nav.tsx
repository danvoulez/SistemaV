'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { LogOut, User, ChevronDown, Bell } from 'lucide-react';

interface TopNavProps {
  title: string;
  userName?: string;
  userRole?: string;
  userEmail?: string;
}

export function TopNav({ title, userName, userRole, userEmail }: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const roleBadge: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    member: 'bg-blue-100 text-blue-700',
    client: 'bg-emerald-100 text-emerald-700'
  };

  return (
    <header className="flex items-center justify-between bg-white border-b px-4 md:px-6 h-14 sticky top-0 z-30">
      <h2 className="font-semibold text-slate-800 text-base">{title}</h2>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <Bell size={18} />
        </button>

        {userName ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-800 leading-tight">{userName}</p>
                {userRole && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleBadge[userRole] ?? 'bg-slate-100 text-slate-600'}`}>
                    {userRole}
                  </span>
                )}
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border py-1 z-50">
                  {userEmail && (
                    <div className="px-4 py-2 border-b">
                      <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                    </div>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); router.push('/client/profile'); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <User size={14} />
                    Meu Perfil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={14} />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400">SistemaV</div>
        )}
      </div>
    </header>
  );
}
