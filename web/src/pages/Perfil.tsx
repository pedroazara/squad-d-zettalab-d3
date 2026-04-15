import { useMemo } from 'react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { getSessionUser } from '@/services/authApi';

const roleLabelMap = {
  brigadista: 'Brigadista',
  fazendeiro: 'Fazendeiro',
  coordenacao: 'Coordenação',
  administrador: 'Administrador',
} as const;

export default function Perfil() {
  const user = useMemo(() => getSessionUser(), []);

  return (
    <div className="min-h-screen bg-guarawatch-surface">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-6">Perfil</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold text-guarawatch-primary">Dados da Conta</h2>
            <div className="space-y-2 text-sm text-guarawatch-text">
              <p><span className="font-semibold">Nome:</span> {user?.fullName || 'Não autenticado'}</p>
              <p><span className="font-semibold">Email:</span> {user?.email || '-'}</p>
              <p><span className="font-semibold">Perfil:</span> {user ? roleLabelMap[user.role] : '-'}</p>
              <p><span className="font-semibold">Organização:</span> {user?.organization || '-'}</p>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold text-guarawatch-primary">Sessão</h2>
            <div className="space-y-2 text-sm text-guarawatch-text">
              <p><span className="font-semibold">Status:</span> {user ? 'Autenticado' : 'Sem sessão ativa'}</p>
              <p><span className="font-semibold">Origem:</span> API FastAPI</p>
              <p><span className="font-semibold">Observação:</span> Preferências avançadas ainda dependem de endpoint dedicado.</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
