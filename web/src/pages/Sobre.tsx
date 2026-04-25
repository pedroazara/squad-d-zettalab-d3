import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function Sobre() {
  return (
    <div className="min-h-screen bg-guarawatch-surface">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-6">Sobre o GuaraWatch</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-5 text-guarawatch-text leading-relaxed">
          <p>
            O GuaraWatch e uma plataforma de monitoramento e analise de queimadas no Brasil com foco em
            prevencao, interpretacao historica e impacto sobre a biodiversidade.
          </p>
          <p>
            Os painéis operam com dados processados a partir das bases de focos, fauna e clima integradas ao projeto,
            com filtros e visualizações preparados para uso direto em análise.
          </p>
          <p>
            A plataforma foi pensada para pesquisadores, orgaos publicos, equipes de resposta ambiental e para a
            sociedade em geral que deseja entender os padroes de risco no territorio nacional.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
