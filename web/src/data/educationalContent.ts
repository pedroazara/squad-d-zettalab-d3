export interface EducationalContent {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  imagem: string;
  conteudo: string;
}

export const educationalContent: EducationalContent[] = [
  {
    id: '1',
    titulo: 'Como o Cerrado é afetado pelas queimadas anuais',
    descricao: 'Entenda o ciclo de queimadas no Cerrado e seus impactos ecológicos',
    categoria: 'Impacto Ambiental',
    imagem: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    conteudo: 'O Cerrado é um dos biomas mais afetados pelas queimadas anuais no Brasil. A combinação de clima seco, vegetação adaptada ao fogo e atividades humanas cria um cenário de alto risco. Durante os meses de junho a novembro, principalmente agosto e setembro, as condições climáticas favorecem a propagação do fogo, afetando milhões de hectares anualmente. Os impactos incluem perda de biodiversidade, emissão de gases de efeito estufa, degradação do solo e alteração dos ciclos hidrológicos. A recuperação do Cerrado após queimadas intensas pode levar décadas, e em alguns casos, a vegetação original nunca retorna ao seu estado original.'
  },
  {
    id: '2',
    titulo: 'Espécies em perigo: o lobo-guará e as chamas',
    descricao: 'Conheça a história do lobo-guará e como as queimadas ameaçam sua sobrevivência',
    categoria: 'Biodiversidade em Risco',
    imagem: 'https://oeco.org.br/wp-content/uploads/oeco-migration/images/stories/abr2013/animalsemana-lobo-guara.jpg',
    conteudo: 'O lobo-guará (Chrysocyon brachyurus) é uma espécie símbolo do Cerrado brasileiro. Seu habitat depende de mosaicos de campo e vegetação nativa, que são fortemente impactados por ciclos de queimadas mais intensos e prolongados. Nos últimos anos, o aumento de área queimada em períodos de seca elevou o risco de perda de abrigo, redução de oferta de alimento e deslocamento forçado para áreas com maior conflito com atividade humana. No recorte atual do sistema, os anos de 2021, 2023 e 2025 aparecem como períodos críticos para a espécie em regiões de Cerrado, com maior percentual de habitat afetado e maior frequência de focos de calor em corredores ecológicos.'
  },
  {
    id: '3',
    titulo: 'Entendendo o Índice de Risco GuaráWatch',
    descricao: 'Saiba como calculamos o índice de risco de queimadas',
    categoria: 'Metodologia dos Dados',
    imagem: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    conteudo: 'O índice de risco do GuaráWatch é calculado através da combinação de múltiplas variáveis ambientais e meteorológicas. Utilizamos dados de temperatura, umidade relativa do ar, velocidade dos ventos, precipitação acumulada e histórico de focos de calor. O algoritmo pondera cada fator conforme sua influência na probabilidade de ocorrência e propagação de incêndios. O resultado é um score de 0 a 100, classificado em quatro níveis: baixo (0-30), moderado (31-55), alto (56-75) e crítico (76-100). Este índice é atualizado diariamente e permite o monitoramento preventivo de áreas de risco.'
  },
  {
    id: '4',
    titulo: '10 ações preventivas para propriedades rurais',
    descricao: 'Dicas práticas para prevenir incêndios em sua propriedade',
    categoria: 'Prevenção de Incêndios',
    imagem: 'https://images.unsplash.com/photo-1542401886-65d27afda266?w=400&h=300&fit=crop',
    conteudo: 'A prevenção de incêndios em propriedades rurais envolve um conjunto de práticas simples mas eficazes: 1) Mantenha aceiros de no mínimo 3 metros de largura around das áreas de vegetação; 2) Realize o controle de plantas invasoras que aumentam a carga de combustível; 3) Armazene corretamente produtos inflamáveis; 4) Evite queimadas em dias de vento forte; 5) Tenha equipamentos de combate ao fogo disponíveis; 6) Crie planos de evacuação; 7) Monitore as condições meteorológicas; 8) Mantenha áreas de refúgio para fauna; 9) Estabeleça acordos com vizinhos para ajuda mútua; 10) Participe dos programas de prevenção local.'
  },
  {
    id: '5',
    titulo: 'Por que agosto é o mês mais crítico no Centro-Oeste',
    descricao: 'Análise sazonal das queimadas na região',
    categoria: 'Impacto Ambiental',
    imagem: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    conteudo: 'Agosto marca o pico de queimadas no Centro-Oeste brasileiro devido a uma combinação perfeita de fatores. É o período mais seco do ano, com umidade relativa do ar frequentemente abaixo de 30%, temperaturas elevadas e ventos constantes. A vegetação, especialmente as gramíneas, está completamente seca e altamente inflamável. Além disso, agosto coincide com o período de preparo de áreas para plantio, quando muitas queimadas controladas são realizadas e, em alguns casos, escapam do controle. A falta de chuvas prolongada e a baixa umidade atmosférica criam condições ideais para a rápida propagação do fogo.'
  },
  {
    id: '6',
    titulo: 'Fontes de dados: MapBiomas, INMET e INPE explicados',
    descricao: 'Conheça as fontes de dados que alimentam o GuaráWatch',
    categoria: 'Metodologia dos Dados',
    imagem: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    conteudo: 'O GuaráWatch integra dados de três principais fontes oficiais: O INPE (Instituto Nacional de Pesquisas Espaciais) fornece dados de focos de calor detectados por satélites em tempo real, permitindo o monitoramento contínuo de áreas de queimada. O INMET (Instituto Nacional de Meteorologia) contribui com dados meteorológicos de 750 estações automáticas espalhadas pelo país, incluindo temperatura, umidade, precipitação e vento. O MapBiomas oferece mapeamento detalhado do uso e cobertura da terra, permitindo identificar diferentes tipos de vegetação e áreas de transição. A combinação dessas fontes cria um sistema robusto e confiável para monitoramento e previsão de risco de incêndios.'
  }
];

export const getEducationalContent = (): EducationalContent[] => {
  return educationalContent;
};

export const getEducationalContentById = (id: string): EducationalContent | undefined => {
  return educationalContent.find(item => item.id === id);
};

export const getEducationalCategories = (): string[] => {
  const categories = educationalContent.map(item => item.categoria);
  return Array.from(new Set(categories)).sort();
};
