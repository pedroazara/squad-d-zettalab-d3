import { Link } from 'wouter';
import { ChevronDown, MapPin, Leaf, TrendingUp, Download, BookOpen, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-guarawatch-surface">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-guarawatch-primary via-guarawatch-secondary to-black text-white overflow-hidden flex items-center">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-guarawatch-accent rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="font-display text-6xl md:text-7xl font-bold mb-6 leading-tight">
            GuaráWatch
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Monitoramento histórico de queimadas e impacto na biodiversidade do Brasil
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/dashboard/nacional">
              <a className="px-8 py-3 bg-guarawatch-accent text-guarawatch-primary font-heading font-semibold rounded-lg hover:opacity-90 transition-opacity inline-block">
                Acessar o Painel
              </a>
            </Link>
            <button
              onClick={scrollToFeatures}
              className="px-8 py-3 border-2 border-white text-white font-heading font-semibold rounded-lg hover:bg-white hover:text-guarawatch-primary transition-colors"
            >
              Saiba mais
            </button>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown size={32} />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-guarawatch-primary bg-opacity-95 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-mono text-3xl md:text-4xl font-bold text-guarawatch-accent">631</p>
              <p className="text-sm text-gray-300 mt-2">Estações Meteorológicas</p>
            </div>
            <div>
              <p className="font-mono text-3xl md:text-4xl font-bold text-guarawatch-accent">6</p>
              <p className="text-sm text-gray-300 mt-2">Biomas Cobertos</p>
            </div>
            <div>
              <p className="font-mono text-3xl md:text-4xl font-bold text-guarawatch-accent">7</p>
              <p className="text-sm text-gray-300 mt-2">Anos de Dados</p>
            </div>
            <div>
              <p className="font-mono text-3xl md:text-4xl font-bold text-guarawatch-accent">27</p>
              <p className="text-sm text-gray-300 mt-2">Estados Analisados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-guarawatch-bg">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-4xl font-bold text-center mb-4 text-guarawatch-primary">
            Recursos Principais
          </h2>
          <p className="text-center text-guarawatch-muted mb-12 max-w-2xl mx-auto">
            Ferramentas avançadas para análise de queimadas e proteção da biodiversidade brasileira
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-guarawatch-accent hover:shadow-lg transition-shadow">
              <MapPin className="w-12 h-12 text-guarawatch-accent mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-3 text-guarawatch-primary">
                Mapa Interativo
              </h3>
              <p className="text-guarawatch-muted">
                Visualize padrões de queimadas em tempo real com mapas interativos do Brasil
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-guarawatch-warning hover:shadow-lg transition-shadow">
              <Leaf className="w-12 h-12 text-guarawatch-warning mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-3 text-guarawatch-primary">
                Cruzamento com Biodiversidade
              </h3>
              <p className="text-guarawatch-muted">
                Identifique espécies impactadas pelas queimadas em cada região
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-guarawatch-info hover:shadow-lg transition-shadow">
              <TrendingUp className="w-12 h-12 text-guarawatch-info mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-3 text-guarawatch-primary">
                Análise Histórica
              </h3>
              <p className="text-guarawatch-muted">
                Explore tendências de 2019 a 2025 com gráficos detalhados
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-guarawatch-accent hover:shadow-lg transition-shadow">
              <Download className="w-12 h-12 text-guarawatch-accent mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-3 text-guarawatch-primary">
                Exportação de Dados
              </h3>
              <p className="text-guarawatch-muted">
                Baixe dados em CSV para análises externas e pesquisa
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-guarawatch-danger hover:shadow-lg transition-shadow">
              <Zap className="w-12 h-12 text-guarawatch-danger mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-3 text-guarawatch-primary">
                Índice de Risco
              </h3>
              <p className="text-guarawatch-muted">
                Algoritmo científico que calcula risco de queimadas por região
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-guarawatch-secondary hover:shadow-lg transition-shadow">
              <BookOpen className="w-12 h-12 text-guarawatch-secondary mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-3 text-guarawatch-primary">
                Área Educativa
              </h3>
              <p className="text-guarawatch-muted">
                Conteúdo educativo sobre prevenção e impacto ambiental
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-4xl font-bold mb-6 text-guarawatch-primary">
                Visualize Padrões Históricos em Segundos
              </h2>
              <p className="text-guarawatch-muted mb-6 leading-relaxed">
                O GuaráWatch integra dados de múltiplas fontes confiáveis para oferecer uma visão
                completa do risco de queimadas no Brasil. Explore dados históricos, identifique
                padrões sazonais e proteja o bioma.
              </p>
              <Link href="/dashboard/nacional">
                <a className="inline-block px-8 py-3 bg-guarawatch-primary text-white font-heading font-semibold rounded-lg hover:opacity-90 transition-opacity">
                  Explorar Painel
                </a>
              </Link>
            </div>
            <div className="bg-guarawatch-bg rounded-lg p-8 border-2 border-guarawatch-accent">
              <div className="aspect-video bg-gradient-to-br from-guarawatch-primary to-guarawatch-secondary rounded flex items-center justify-center">
                <MapPin className="w-16 h-16 text-guarawatch-accent opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 bg-guarawatch-bg">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center mb-12 text-guarawatch-primary">
            Parceiros e Fontes de Dados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm mb-3">
                🗺️
              </div>
              <p className="font-heading font-semibold text-guarawatch-text">MapBiomas</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm mb-3">
                🌡️
              </div>
              <p className="font-heading font-semibold text-guarawatch-text">INMET</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm mb-3">
                📡
              </div>
              <p className="font-heading font-semibold text-guarawatch-text">INPE</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm mb-3">
                🌍
              </div>
              <p className="font-heading font-semibold text-guarawatch-text">GBIF</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm mb-3">
                🦁
              </div>
              <p className="font-heading font-semibold text-guarawatch-text">IUCN</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-guarawatch-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-4xl font-bold mb-6">
            Comece a Proteger o Bioma Hoje
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Acesse o painel completo e explore dados detalhados sobre queimadas e biodiversidade
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/nacional">
              <a className="px-8 py-3 bg-guarawatch-accent text-guarawatch-primary font-heading font-semibold rounded-lg hover:opacity-90 transition-opacity inline-block">
                Acessar o Painel
              </a>
            </Link>
            <Link href="/login">
              <a className="px-8 py-3 border-2 border-guarawatch-accent text-guarawatch-accent font-heading font-semibold rounded-lg hover:bg-guarawatch-accent hover:text-guarawatch-primary transition-colors inline-block">
                Já tenho conta
              </a>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
