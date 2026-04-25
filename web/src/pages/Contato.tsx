import { type FormEvent, useEffect, useState } from 'react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Link } from 'wouter';
import { createFireReport, listFireReports } from '@/services/analyticsApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { getSessionUser } from '@/services/authApi';
import type { FireReportResponse } from '@/types/api';

export default function Contato() {
  const user = getSessionUser();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<FireReportResponse[]>([]);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [formData, setFormData] = useState({
    location: '',
    description: '',
    phone: '',
    reporter_name: user?.fullName || '',
  });

  useEffect(() => {
    if (!user) {
      setReports([]);
      return;
    }

    const loadReports = async () => {
      try {
        const list = await listFireReports();
        setReports(list.slice(0, 5));
      } catch {
        setReports([]);
      }
    };

    void loadReports();
  }, [user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setStatus({
        type: 'error',
        message: 'Faca login para enviar reportes de incendio.',
      });
      return;
    }

    setLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const created = await createFireReport({
        location: formData.location,
        description: formData.description,
        phone: formData.phone,
        reporter_name: formData.reporter_name || undefined,
      });
      setStatus({
        type: 'success',
        message: 'Reporte enviado com sucesso.',
      });
      setReports((prev) => [created, ...prev].slice(0, 5));
      setFormData((prev) => ({
        ...prev,
        location: '',
        description: '',
        phone: '',
      }));
    } catch (error) {
      setStatus({
        type: 'error',
        message: getApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-guarawatch-surface">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-6">Contato</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-8 space-y-4 text-guarawatch-text">
            <p className="leading-relaxed">
              Use este formulário para reportar focos de incêndio observados em campo.
            </p>
            {!user && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Esta funcionalidade exige autenticacao no backend.
                {' '}
                <Link href="/login">
                  <a className="font-semibold underline">Entrar agora</a>
                </Link>
                .
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold mb-1" htmlFor="location">
                  Local
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Município, rodovia ou referência"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  disabled={!user}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" htmlFor="description">
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva intensidade, vegetação afetada e riscos próximos"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-28"
                  required
                  disabled={!user}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" htmlFor="phone">
                  Telefone
                </label>
                <input
                  id="phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  disabled={!user}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" htmlFor="reporter_name">
                  Nome do responsável
                </label>
                <input
                  id="reporter_name"
                  type="text"
                  value={formData.reporter_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, reporter_name: e.target.value }))
                  }
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!user}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !user}
                className="w-full bg-guarawatch-primary text-white font-semibold rounded-md py-2 hover:opacity-90 transition-opacity"
              >
                {loading ? 'Enviando...' : 'Enviar reporte'}
              </button>

              {status.type !== 'idle' && (
                <p className={`text-sm ${status.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                  {status.message}
                </p>
              )}
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 space-y-4 text-guarawatch-text">
            <h2 className="font-heading text-xl font-semibold text-guarawatch-primary">
              Últimos reports enviados
            </h2>
            {!user && (
              <p className="text-sm text-guarawatch-muted">
                Faca login para visualizar os reportes.
              </p>
            )}
            {user && reports.length === 0 && (
              <p className="text-sm text-guarawatch-muted">Nenhum reporte encontrado.</p>
            )}
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-guarawatch-primary">{report.location}</p>
                    <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{report.description}</p>
                  <p className="text-xs text-guarawatch-muted mt-2">
                    {new Date(report.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
