import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function Api() {
  return (
    <div className="min-h-screen bg-guarawatch-surface">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-6">API</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-5 text-guarawatch-text leading-relaxed">
          <p>
            Esta secao apresenta a documentacao institucional da API do GuaraWatch. Os dashboards já consomem a API
            autenticada do projeto para listar focos, fauna, risco e relatórios operacionais.
          </p>
          <p>
            Aqui serao detalhados autenticacao, contratos de resposta, exemplos de requisicao e limites de uso para
            consumo externo e integracoes futuras.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
