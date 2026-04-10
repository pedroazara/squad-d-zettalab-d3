import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function Metodologia() {
  return (
    <div className="min-h-screen bg-guarawatch-surface">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-6">Metodologia</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-5 text-guarawatch-text leading-relaxed">
          <p>
            O indice de risco apresentado no sistema considera combinacoes de variaveis climaticas, historico de area
            queimada, focos de calor e sensibilidade ecologica por regiao.
          </p>
          <p>
            Os resultados atuais sao mockados para demonstracao da experiencia do usuario e validacao de interface.
            Na versao integrada, os calculos passarao a consumir fontes oficiais e pipelines de processamento.
          </p>
          <p>
            Para garantir transparencia, cada dashboard apresenta indicadores de contexto e comparacoes historicas,
            facilitando a interpretacao tecnica de cada cenario.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
