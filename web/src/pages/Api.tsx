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
            Esta secao apresenta a documentacao institucional da API do GuaraWatch. A camada de integracao ainda
            esta em evolucao e sera publicada em versao estavel nas proximas etapas do projeto.
          </p>
          <p>
            No estado atual, os dashboards operam com dados mockados para permitir validacao de experiencia,
            navegacao, filtros e exportacoes em ambiente de homologacao.
          </p>
          <p>
            Quando os endpoints estiverem disponiveis, aqui serao detalhados autenticacao, contratos de resposta,
            exemplos de requisicao e limites de uso.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
