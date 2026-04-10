import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Link } from 'wouter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getEducationalContent } from '@/services/mockData';

export default function Educativo() {
  const allContent = getEducationalContent();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    'Prevenção de Incêndios',
    'Impacto Ambiental',
    'Biodiversidade em Risco',
    'Como Usar o Sistema',
    'Metodologia dos Dados',
  ];

  const filteredContent = selectedCategory
    ? allContent.filter((item) => item.categoria === selectedCategory)
    : allContent;

  return (
    <div className="min-h-screen bg-guarawatch-surface">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-4">
            Área Educativa
          </h1>
          <p className="text-guarawatch-muted max-w-2xl mx-auto">
            Conteúdo educativo sobre queimadas, prevenção e biodiversidade brasileira
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-guarawatch-primary text-white'
                : 'bg-guarawatch-bg text-guarawatch-primary border-2 border-guarawatch-primary hover:bg-guarawatch-primary hover:text-white'
            }`}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-guarawatch-primary text-white'
                  : 'bg-guarawatch-bg text-guarawatch-primary border-2 border-guarawatch-primary hover:bg-guarawatch-primary hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredContent.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <div className="w-full h-48 bg-guarawatch-bg overflow-hidden">
                <img
                  src={item.imagem}
                  alt={item.titulo}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Category Badge */}
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-guarawatch-accent bg-opacity-20 text-guarawatch-accent rounded-full text-xs font-semibold">
                    {item.categoria}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-heading text-lg font-semibold text-guarawatch-primary mb-2">
                  {item.titulo}
                </h3>

                {/* Description */}
                <p className="text-guarawatch-muted text-sm mb-4 line-clamp-3">
                  {item.descricao}
                </p>

                {/* Read More Button */}
                <Link href={`/educativo/artigo/${item.id}`}>
                  <a className="text-guarawatch-accent hover:text-guarawatch-primary font-heading font-semibold text-sm transition-colors">
                    Ler mais →
                  </a>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredContent.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={48} className="mx-auto text-guarawatch-muted mb-4 opacity-50" />
            <p className="text-guarawatch-muted">
              Nenhum conteúdo encontrado para esta categoria
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
