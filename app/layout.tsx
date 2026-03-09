import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'SistemaV — Gestão Empresarial Multi-tenant',
  description: 'Plataforma modular de gestão empresarial com IA integrada'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
