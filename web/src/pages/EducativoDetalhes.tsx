import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Link, useRoute } from 'wouter';
import { getEducationalContentById } from '@/data/educationalContent';

const wolfImageUrl = 'https://oeco.org.br/wp-content/uploads/oeco-migration/images/stories/abr2013/animalsemana-lobo-guara.jpg';
const wolfGallery = [
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chrysocyon_brachyurus.jpg',
    caption: 'Lobo-guará adulto em área aberta de Cerrado.',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Chrysocyon_brachyurus_-_Copenhagen_Zoo_-_DSC08948.JPG',
    caption: 'Pelagem alta e pernas longas, adaptação para campos com vegetação alta.',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Chrysocyon_brachyurus_Parque_Das_Aves_01.jpg',
    caption: 'Espécie símbolo da biodiversidade do Cerrado brasileiro.',
  },
];

export default function EducativoDetalhes() {
  const [match, params] = useRoute('/educativo/artigo/:id');

  if (!match || !params?.id) {
    return null;
  }

  const article = getEducationalContentById(params.id);
  const isWolfArticle = params.id === '2';

  if (!article) {
    return (
      <div className="min-h-screen bg-guarawatch-surface">
        <Navbar />
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="font-display text-3xl font-bold text-guarawatch-primary mb-4">Artigo nao encontrado</h1>
          <Link href="/educativo">
            <a className="text-guarawatch-accent hover:text-guarawatch-primary">Voltar para a area educativa</a>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-guarawatch-surface">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <Link href="/educativo">
          <a className="text-sm text-guarawatch-accent hover:text-guarawatch-primary">← Voltar para a area educativa</a>
        </Link>

        <article className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
          <img
            src={isWolfArticle ? wolfImageUrl : article.imagem}
            alt={article.titulo}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-8 space-y-5">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-guarawatch-accent bg-opacity-20 text-guarawatch-accent">
              {article.categoria}
            </span>

            <h1 className="font-display text-3xl font-bold text-guarawatch-primary">{article.titulo}</h1>
            <p className="text-guarawatch-muted">{article.descricao}</p>

            {isWolfArticle ? (
              <div className="space-y-4 text-guarawatch-text leading-relaxed">
                <p>
                  O lobo-guara (Chrysocyon brachyurus) e uma especie simbolo do Cerrado brasileiro. Seu habitat
                  depende de mosaicos de campo e vegetacao nativa, que sao fortemente impactados por ciclos de
                  queimadas mais intensos e prolongados.
                </p>
                <p>
                  Nos ultimos anos, o aumento de area queimada em periodos de seca elevou o risco de perda de
                  abrigo, reducao de oferta de alimento e deslocamento forçado para areas com maior conflito com
                  atividade humana.
                </p>
                <p>
                  No recorte atual do sistema, os anos de 2021, 2023 e 2025 aparecem como periodos criticos para
                  a especie em regioes de Cerrado, com maior percentual de habitat afetado e maior frequencia de
                  focos de calor em corredores ecologicos.
                </p>
                <p>
                  A combinacao de monitoramento continuo, restauracao de vegetacao e planejamento preventivo por
                  municipio e fundamental para reduzir o impacto sobre a especie no medio e longo prazo.
                </p>

                <section className="pt-3 border-t border-gray-200">
                  <h2 className="font-heading text-xl font-semibold text-guarawatch-primary mb-2">Habitat</h2>
                  <p>
                    O lobo-guara ocupa principalmente campos, cerrados abertos e áreas de transição com vegetação
                    nativa. Ele precisa de grandes áreas contínuas para se deslocar, caçar e reproduzir. Quando há
                    queimadas extensas e frequentes, o território fica fragmentado, diminuindo abrigo e conectividade.
                  </p>
                </section>

                <section className="pt-3 border-t border-gray-200">
                  <h2 className="font-heading text-xl font-semibold text-guarawatch-primary mb-2">O que ele come</h2>
                  <p>
                    A dieta do lobo-guara é onívora. Ele se alimenta de frutos (especialmente lobeira), pequenos
                    mamíferos, aves, insetos e outros recursos sazonais. A redução de frutos e a fuga de presas após
                    eventos de fogo alteram esse equilíbrio alimentar e aumentam o estresse da espécie.
                  </p>
                </section>

                <section className="pt-3 border-t border-gray-200">
                  <h2 className="font-heading text-xl font-semibold text-guarawatch-primary mb-2">Comportamento e conservação</h2>
                  <p>
                    O lobo-guara tem hábitos majoritariamente crepusculares e noturnos, utilizando áreas amplas e
                    pouco perturbadas. Estratégias de conservação incluem prevenção de incêndios, criação de
                    corredores ecológicos, redução de atropelamentos e monitoramento contínuo com dados geoespaciais.
                  </p>
                </section>

                <section className="pt-3 border-t border-gray-200">
                  <h2 className="font-heading text-xl font-semibold text-guarawatch-primary mb-3">Galeria</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {wolfGallery.map((image) => (
                      <figure key={image.src} className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                        <img src={image.src} alt={image.caption} className="w-full h-40 object-cover" loading="lazy" />
                        <figcaption className="p-2 text-xs text-slate-600">{image.caption}</figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <p className="text-guarawatch-text leading-relaxed">{article.conteudo}</p>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
