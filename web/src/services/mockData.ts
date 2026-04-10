// Mock data for GuaráWatch system

export interface KPIData {
  label: string;
  value: string;
  variation: string;
  variationPercent: number;
  icon: string;
  color: 'danger' | 'warning' | 'info' | 'success';
}

export interface StateData {
  sigla: string;
  nome: string;
  bioma: string;
  risco: number;
  areaQueimada: number;
  focosCalor: number;
  variacao: number;
}

export interface SpeciesData {
  nomecientifico: string;
  nomepopular: string;
  grupo: string;
  status: string;
  bioma: string;
  percentualAfetado: number;
  habitat?: string;
  alimentacao?: string[];
  ameacas?: string[];
  imagem?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface BiomeData {
  nome: string;
  percentual: number;
  cor: string;
}

export interface FireHotspot {
  name: string;
  lat: number;
  lng: number;
  intensity: number;
}

export interface EducationalContent {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  imagem: string;
  conteudo: string;
}

export interface OccurrenceRecord {
  id: string;
  especie: string;
  tipoAnimal: 'Mamífero' | 'Ave' | 'Réptil' | 'Anfíbio' | 'Peixe';
  raca: string;
  estado: string;
  bioma: string;
  comportamento: 'Alimentação' | 'Reprodução' | 'Deslocamento' | 'Descanso' | 'Nidificação';
  confianca: number;
  individuos: number;
  data: string;
  lat: number;
  lng: number;
}

export interface BehaviorCoverage {
  comportamento: string;
  ocorrencias: number;
  mediaConfianca: number;
}

export type DataGranularity = 'anual' | 'mensal' | 'diario';

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const getLastDaysLabels = (days: number) => {
  const labels: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    labels.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return labels;
};

const getLastMonthsLabels = (months: number) => {
  const labels: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(monthLabels[d.getMonth()]);
  }
  return labels;
};

// National KPIs
export const getNationalKPIs = (): KPIData[] => {
  return [
    {
      label: 'Área Queimada Total',
      value: '3.2M ha',
      variation: '+12% vs ano anterior',
      variationPercent: 12,
      icon: 'flame',
      color: 'danger',
    },
    {
      label: 'Focos de Calor',
      value: '185.420',
      variation: '-5% vs anterior',
      variationPercent: -5,
      icon: 'thermometer',
      color: 'warning',
    },
    {
      label: 'Estado Mais Afetado',
      value: 'Mato Grosso',
      variation: 'Score de risco: 87',
      variationPercent: 0,
      icon: 'map-pin',
      color: 'danger',
    },
    {
      label: 'Bioma Mais Afetado',
      value: 'Cerrado',
      variation: '42% da área queimada',
      variationPercent: 0,
      icon: 'leaf',
      color: 'warning',
    },
  ];
};

// Historical data for charts
export const getHistoricalData = (granularity: DataGranularity = 'anual') => {
  const annual = [
    { year: 2019, areaQueimada: 3.1, focosCalor: 180000 },
    { year: 2020, areaQueimada: 4.5, focosCalor: 220000 },
    { year: 2021, areaQueimada: 5.1, focosCalor: 240000 },
    { year: 2022, areaQueimada: 4.8, focosCalor: 210000 },
    { year: 2023, areaQueimada: 3.9, focosCalor: 195000 },
    { year: 2024, areaQueimada: 4.2, focosCalor: 200000 },
    { year: 2025, areaQueimada: 3.2, focosCalor: 185420 },
  ];

  if (granularity === 'anual') {
    return annual.map((entry) => ({ ...entry, periodo: String(entry.year) }));
  }

  if (granularity === 'mensal') {
    return getLastMonthsLabels(12).map((periodo, idx) => {
      const areaQueimada = Number((0.65 + idx * 0.05 + Math.sin(idx / 2.2) * 0.08).toFixed(2));
      const focosCalor = Math.round(12000 + idx * 420 + Math.cos(idx / 2.5) * 1100);
      return {
        periodo,
        areaQueimada,
        focosCalor,
      };
    });
  }

  const labels = getLastDaysLabels(30);
  return labels.map((periodo, idx) => {
    const base = 0.06 + idx * 0.0012;
    const wave = Math.sin(idx / 3) * 0.012;
    const areaQueimada = Number((base + wave + 0.03).toFixed(3));
    const focosCalor = Math.round(3800 + idx * 58 + Math.cos(idx / 2) * 420);

    return {
      periodo,
      areaQueimada,
      focosCalor,
    };
  });
};

export const getStateHistoricalData = (
  sigla: string,
  granularity: DataGranularity = 'anual'
) => {
  const riskBase = getStateData(sigla).risco;

  if (granularity === 'anual') {
    return [
      { periodo: '2019', score: Math.max(35, riskBase - 15) },
      { periodo: '2020', score: Math.max(40, riskBase - 9) },
      { periodo: '2021', score: Math.max(45, riskBase - 5) },
      { periodo: '2022', score: Math.max(40, riskBase - 7) },
      { periodo: '2023', score: Math.max(38, riskBase - 11) },
      { periodo: '2024', score: Math.max(40, riskBase - 10) },
      { periodo: '2025', score: riskBase },
    ];
  }

  if (granularity === 'mensal') {
    return getLastMonthsLabels(12).map((periodo, idx) => ({
      periodo,
      score: Math.max(20, Math.min(100, Math.round(riskBase - 10 + Math.sin(idx / 2) * 8 + idx * 0.8))),
    }));
  }

  return getLastDaysLabels(30).map((periodo, idx) => ({
    periodo,
    score: Math.max(20, Math.min(100, Math.round(riskBase - 8 + Math.sin(idx / 4) * 7 + idx * 0.25))),
  }));
};

export const getStateFireDistribution = (
  sigla: string,
  granularity: DataGranularity = 'anual'
) => {
  const baseArea = getStateData(sigla).areaQueimada;

  if (granularity === 'anual' || granularity === 'mensal') {
    return getSeasonalityData();
  }

  return getLastDaysLabels(30).map((periodo, idx) => ({
    periodo,
    area: Math.max(4500, Math.round(baseArea / 420 + Math.cos(idx / 2.8) * 2500 + idx * 120)),
  }));
};

// Top 10 states by risk
export const getTopStates = (): StateData[] => {
  return [
    { sigla: 'MT', nome: 'Mato Grosso', bioma: 'Cerrado', risco: 87, areaQueimada: 1250000, focosCalor: 45000, variacao: 12 },
    { sigla: 'GO', nome: 'Goiás', bioma: 'Cerrado', risco: 82, areaQueimada: 980000, focosCalor: 38000, variacao: 8 },
    { sigla: 'BA', nome: 'Bahia', bioma: 'Caatinga', risco: 76, areaQueimada: 750000, focosCalor: 32000, variacao: -3 },
    { sigla: 'TO', nome: 'Tocantins', bioma: 'Cerrado', risco: 72, areaQueimada: 620000, focosCalor: 28000, variacao: 5 },
    { sigla: 'AM', nome: 'Amazonas', bioma: 'Amazônia', risco: 68, areaQueimada: 580000, focosCalor: 25000, variacao: -8 },
    { sigla: 'AC', nome: 'Acre', bioma: 'Amazônia', risco: 65, areaQueimada: 520000, focosCalor: 22000, variacao: 2 },
    { sigla: 'RO', nome: 'Rondônia', bioma: 'Amazônia', risco: 62, areaQueimada: 480000, focosCalor: 20000, variacao: -5 },
    { sigla: 'MA', nome: 'Maranhão', bioma: 'Cerrado', risco: 58, areaQueimada: 420000, focosCalor: 18000, variacao: 3 },
    { sigla: 'MS', nome: 'Mato Grosso do Sul', bioma: 'Pantanal', risco: 55, areaQueimada: 380000, focosCalor: 16000, variacao: -2 },
    { sigla: 'PA', nome: 'Pará', bioma: 'Amazônia', risco: 52, areaQueimada: 340000, focosCalor: 14000, variacao: 1 },
  ];
};

// Biome distribution
export const getBiomeDistribution = (): BiomeData[] => {
  return [
    { nome: 'Cerrado', percentual: 42, cor: '#F0AD4E' },
    { nome: 'Amazônia', percentual: 31, cor: '#5CB85C' },
    { nome: 'Caatinga', percentual: 12, cor: '#D4A520' },
    { nome: 'Mata Atlântica', percentual: 8, cor: '#7CB342' },
    { nome: 'Pantanal', percentual: 5, cor: '#00BCD4' },
    { nome: 'Pampa', percentual: 2, cor: '#5BC0DE' },
  ];
};

// Critical species
export const getCriticalSpecies = (): SpeciesData[] => {
  return [
    {
      nomecientifico: 'Panthera onca',
      nomepopular: 'Onça-pintada',
      grupo: 'Mamífero',
      status: 'VU',
      bioma: 'Cerrado',
      percentualAfetado: 38,
      habitat: 'Matas ciliares, campos e bordas de floresta com oferta de água.',
      alimentacao: ['Capivaras', 'Veados', 'Tatus', 'Jacarés jovens'],
      ameacas: ['Incêndios extensivos', 'Perda de habitat', 'Caça retaliatória'],
      imagem: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Jaguar_%28Panthera_onca_palustris%29_female_Piquiri_River_2.jpg',
      location: { lat: -12.0, lng: -56.0 },
    },
    {
      nomecientifico: 'Anodorhynchus hyacinthinus',
      nomepopular: 'Arara-azul-grande',
      grupo: 'Ave',
      status: 'VU',
      bioma: 'Cerrado',
      percentualAfetado: 45,
      habitat: 'Áreas abertas com palmeiras e cavidades para nidificação.',
      alimentacao: ['Coquinhos', 'Frutos de palmeiras', 'Sementes duras'],
      ameacas: ['Queimadas em áreas de palmeiral', 'Tráfico de fauna'],
      imagem: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Anodorhynchus_hyacinthinus_-flying-8a.jpg',
      location: { lat: -15.0, lng: -54.0 },
    },
    {
      nomecientifico: 'Chrysocyon brachyurus',
      nomepopular: 'Lobo-guará',
      grupo: 'Mamífero',
      status: 'NT',
      bioma: 'Cerrado',
      percentualAfetado: 51,
      habitat: 'Campos limpos, cerrados abertos e mosaicos com vegetação nativa.',
      alimentacao: ['Lobeira', 'Frutos nativos', 'Roedores', 'Aves pequenas', 'Insetos'],
      ameacas: ['Incêndios recorrentes', 'Atropelamentos', 'Fragmentação de habitat'],
      imagem: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chrysocyon_brachyurus.jpg',
      location: { lat: -16.5, lng: -52.1 },
    },
    {
      nomecientifico: 'Speothos venaticus',
      nomepopular: 'Cachorro-do-mato-vinagre',
      grupo: 'Mamífero',
      status: 'NT',
      bioma: 'Amazônia',
      percentualAfetado: 29,
      habitat: 'Florestas úmidas e áreas de mata contínua.',
      alimentacao: ['Pequenos mamíferos', 'Aves de sub-bosque'],
      ameacas: ['Fragmentação florestal', 'Perda de conectividade'],
      imagem: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Speothos_venaticus_2.jpg',
      location: { lat: -3.0, lng: -61.0 },
    },
    {
      nomecientifico: 'Caryocar brasiliense',
      nomepopular: 'Pequi',
      grupo: 'Planta',
      status: 'LC',
      bioma: 'Cerrado',
      percentualAfetado: 62,
      habitat: 'Cerrados sensu stricto e cerradões com solo bem drenado.',
      alimentacao: ['Não se aplica'],
      ameacas: ['Queima de mudas e brotos', 'Supressão de vegetação'],
      imagem: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Caryocar_brasiliense_2009_G1.jpg',
      location: { lat: -14.5, lng: -49.0 },
    },
    {
      nomecientifico: 'Rhinella schneideri',
      nomepopular: 'Sapo-cururu',
      grupo: 'Anfíbio',
      status: 'LC',
      bioma: 'Cerrado',
      percentualAfetado: 33,
      habitat: 'Brejos temporários e bordas úmidas de matas.',
      alimentacao: ['Insetos', 'Artrópodes'],
      ameacas: ['Ressecamento de poças', 'Fogo em áreas de reprodução'],
      imagem: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Rhinella_schneideri.jpg',
      location: { lat: -17.5, lng: -48.5 },
    },
    {
      nomecientifico: 'Caiman yacare',
      nomepopular: 'Jacaré-do-pantanal',
      grupo: 'Réptil',
      status: 'LC',
      bioma: 'Pantanal',
      percentualAfetado: 27,
      habitat: 'Baías, corixos e margens de rios pantaneiros.',
      alimentacao: ['Peixes', 'Moluscos', 'Invertebrados'],
      ameacas: ['Seca extrema', 'Fumaça e perda de refúgio aquático'],
      imagem: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Caiman_yacare.jpg',
      location: { lat: -18.8, lng: -57.5 },
    },
    {
      nomecientifico: 'Piaractus mesopotamicus',
      nomepopular: 'Pacu',
      grupo: 'Peixe',
      status: 'NT',
      bioma: 'Pantanal',
      percentualAfetado: 24,
      habitat: 'Rios de planície e lagoas marginais.',
      alimentacao: ['Frutos', 'Sementes', 'Matéria vegetal'],
      ameacas: ['Assoreamento', 'Aquecimento da água'],
      imagem: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Piaractus_mesopotamicus.jpg',
      location: { lat: -19.5, lng: -56.8 },
    },
    {
      nomecientifico: 'Amazona aestiva',
      nomepopular: 'Papagaio-verdadeiro',
      grupo: 'Ave',
      status: 'LC',
      bioma: 'Mata Atlântica',
      percentualAfetado: 35,
      habitat: 'Matas secundárias e fragmentos florestais.',
      alimentacao: ['Frutas', 'Sementes', 'Flores'],
      ameacas: ['Perda de áreas de nidificação', 'Incêndios de borda'],
      imagem: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Amazona_aestiva_-Brazil-8.jpg',
      location: { lat: -22.7, lng: -44.0 },
    },
  ];
};

// Educational content
export const getEducationalContent = (): EducationalContent[] => {
  return [
    {
      id: '1',
      titulo: 'Como o Cerrado é afetado pelas queimadas anuais',
      descricao: 'Entenda o ciclo de queimadas no Cerrado e seus impactos ecológicos',
      categoria: 'Impacto Ambiental',
      imagem: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      conteudo: 'O Cerrado é um dos biomas mais afetados pelas queimadas anuais...',
    },
    {
      id: '2',
      titulo: 'Espécies em perigo: o lobo-guará e as chamas',
      descricao: 'Conheça a história do lobo-guará e como as queimadas ameaçam sua sobrevivência',
      categoria: 'Biodiversidade em Risco',
      imagem: 'https://oeco.org.br/wp-content/uploads/oeco-migration/images/stories/abr2013/animalsemana-lobo-guara.jpg',
      conteudo: 'O lobo-guará e uma especie chave do Cerrado e sofre com a fragmentacao do habitat causada por queimadas repetidas. Em anos de seca intensa, o aumento de focos de calor reduz abrigo, altera a disponibilidade de alimento e amplia conflitos em bordas urbanas e rurais. O monitoramento anual permite identificar periodos criticos e orientar acoes preventivas por territorio.',
    },
    {
      id: '3',
      titulo: 'Entendendo o Índice de Risco GuaráWatch',
      descricao: 'Saiba como calculamos o índice de risco de queimadas',
      categoria: 'Metodologia dos Dados',
      imagem: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      conteudo: 'O índice de risco é calculado através de múltiplas variáveis...',
    },
    {
      id: '4',
      titulo: '10 ações preventivas para propriedades rurais',
      descricao: 'Dicas práticas para prevenir incêndios em sua propriedade',
      categoria: 'Prevenção de Incêndios',
      imagem: 'https://images.unsplash.com/photo-1542401886-65d27afda266?w=400&h=300&fit=crop',
      conteudo: 'Aqui estão 10 ações que você pode tomar para prevenir queimadas...',
    },
    {
      id: '5',
      titulo: 'Por que agosto é o mês mais crítico no Centro-Oeste',
      descricao: 'Análise sazonal das queimadas na região',
      categoria: 'Impacto Ambiental',
      imagem: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      conteudo: 'Agosto marca o pico de queimadas no Centro-Oeste devido às condições climáticas...',
    },
    {
      id: '6',
      titulo: 'Fontes de dados: MapBiomas, INMET e INPE explicados',
      descricao: 'Conheça as fontes de dados que alimentam o GuaráWatch',
      categoria: 'Metodologia dos Dados',
      imagem: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      conteudo: 'O GuaráWatch integra dados de três principais fontes...',
    },
  ];
};

// State details
export const getStateData = (sigla: string) => {
  const states: Record<string, any> = {
    MT: {
      nome: 'Mato Grosso',
      sigla: 'MT',
      bioma: 'Cerrado',
      risco: 87,
      areaQueimada: 1250000,
      focosCalor: 45000,
      temperatura: 34.2,
      umidade: 38,
      precipitacao: 842,
      vento: 15.4,
      municipios: [
        { nome: 'Cuiabá', areaQueimada: 125000, risco: 85, bioma: 'Cerrado' },
        { nome: 'Rondonópolis', areaQueimada: 98000, risco: 82, bioma: 'Cerrado' },
        { nome: 'Sinop', areaQueimada: 87000, risco: 78, bioma: 'Cerrado' },
      ],
    },
    GO: {
      nome: 'Goiás',
      sigla: 'GO',
      bioma: 'Cerrado',
      risco: 82,
      areaQueimada: 980000,
      focosCalor: 38000,
      temperatura: 32.5,
      umidade: 40,
      precipitacao: 890,
      vento: 14.2,
      municipios: [
        { nome: 'Goiânia', areaQueimada: 95000, risco: 80, bioma: 'Cerrado' },
        { nome: 'Anápolis', areaQueimada: 78000, risco: 75, bioma: 'Cerrado' },
        { nome: 'Aparecida de Goiânia', areaQueimada: 65000, risco: 72, bioma: 'Cerrado' },
      ],
    },
  };
  return states[sigla] || states['MT'];
};

// Monthly seasonality data
export const getSeasonalityData = () => {
  return [
    { mes: 'Jan', area: 45000 },
    { mes: 'Fev', area: 52000 },
    { mes: 'Mar', area: 38000 },
    { mes: 'Abr', area: 28000 },
    { mes: 'Mai', area: 18000 },
    { mes: 'Jun', area: 125000 },
    { mes: 'Jul', area: 185000 },
    { mes: 'Ago', area: 245000 },
    { mes: 'Set', area: 215000 },
    { mes: 'Out', area: 165000 },
    { mes: 'Nov', area: 95000 },
    { mes: 'Dez', area: 62000 },
  ];
};

// Trend data
export const getTrendData = (granularity: DataGranularity = 'anual') => {
  const annual = [
    { year: 2019, score: 72, min: 65, max: 82 },
    { year: 2020, score: 78, min: 70, max: 88 },
    { year: 2021, score: 82, min: 75, max: 92 },
    { year: 2022, score: 80, min: 72, max: 90 },
    { year: 2023, score: 75, min: 68, max: 85 },
    { year: 2024, score: 76, min: 70, max: 86 },
    { year: 2025, score: 74, min: 68, max: 84 },
  ];

  if (granularity === 'anual') {
    return annual.map((entry) => ({ ...entry, periodo: String(entry.year) }));
  }

  if (granularity === 'mensal') {
    return getLastMonthsLabels(12).map((periodo, idx) => {
      const score = Math.round(68 + Math.sin(idx / 2.4) * 7 + idx * 0.9);
      return {
        periodo,
        score,
        min: Math.max(35, score - 9),
        max: Math.min(100, score + 11),
      };
    });
  }

  return getLastDaysLabels(30).map((periodo, idx) => {
    const score = Math.round(70 + Math.sin(idx / 4.2) * 6 + idx * 0.15);
    return {
      periodo,
      score,
      min: Math.max(35, score - 8),
      max: Math.min(100, score + 10),
    };
  });
};

export const getFireHotspots = (): FireHotspot[] => {
  return [
    { name: 'Mato Grosso', lat: -13.0, lng: -55.0, intensity: 92 },
    { name: 'Pará', lat: -6.5, lng: -52.0, intensity: 78 },
    { name: 'Bahia', lat: -13.0, lng: -41.5, intensity: 68 },
    { name: 'Mato Grosso do Sul', lat: -20.0, lng: -54.5, intensity: 72 },
    { name: 'Amazonas', lat: -4.0, lng: -62.0, intensity: 65 },
  ];
};

// Heatmap data for seasonality
export const getHeatmapData = (granularity: DataGranularity = 'anual') => {
  if (granularity === 'diario') {
    return getLastDaysLabels(30).map((periodo, idx) => ({
      periodo,
      intensity: Math.max(10, Math.min(100, Math.round(38 + Math.sin(idx / 2.4) * 22 + idx * 0.9))),
    }));
  }

  if (granularity === 'mensal') {
    return getLastMonthsLabels(12).map((periodo, idx) => ({
      periodo,
      intensity: Math.max(10, Math.min(100, Math.round(42 + Math.sin(idx / 2.2) * 28 + idx * 1.4))),
    }));
  }

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const data = [];

  for (let year of years) {
    for (let month = 0; month < 12; month++) {
      const intensity = month >= 5 && month <= 9 ? Math.random() * 100 + 50 : Math.random() * 50;
      data.push({
        year,
        month: months[month],
        intensity: Math.round(intensity),
      });
    }
  }
  return data;
};

// Biome trend data
export const getBiomeTrendData = (granularity: DataGranularity = 'anual') => {
  if (granularity === 'diario') {
    return getLastDaysLabels(14).map((periodo, idx) => ({
      periodo,
      Cerrado: Math.round(66 + Math.sin(idx / 2) * 5),
      Amazônia: Math.round(72 + Math.cos(idx / 3) * 4),
      Caatinga: Math.round(58 + Math.sin(idx / 2.5) * 3),
      'Mata Atlântica': Math.round(46 + Math.cos(idx / 2.7) * 3),
      Pantanal: Math.round(52 + Math.sin(idx / 2.2) * 4),
      Pampa: Math.round(36 + Math.cos(idx / 2.8) * 2),
    }));
  }

  if (granularity === 'mensal') {
    return getLastMonthsLabels(12).map((periodo, idx) => ({
      periodo,
      Cerrado: Math.round(65 + Math.sin(idx / 2) * 6 + idx * 0.5),
      Amazônia: Math.round(70 + Math.cos(idx / 2.5) * 5 + idx * 0.4),
      Caatinga: Math.round(56 + Math.sin(idx / 2.3) * 4 + idx * 0.3),
      'Mata Atlântica': Math.round(45 + Math.cos(idx / 2.7) * 3 + idx * 0.2),
      Pantanal: Math.round(50 + Math.sin(idx / 2.1) * 4 + idx * 0.3),
      Pampa: Math.round(35 + Math.cos(idx / 3) * 2 + idx * 0.1),
    }));
  }

  return [
    {
      year: 2019,
      periodo: '2019',
      Cerrado: 65,
      Amazônia: 72,
      Caatinga: 58,
      'Mata Atlântica': 45,
      Pantanal: 52,
      Pampa: 35,
    },
    {
      year: 2020,
      periodo: '2020',
      Cerrado: 72,
      Amazônia: 78,
      Caatinga: 65,
      'Mata Atlântica': 52,
      Pantanal: 60,
      Pampa: 42,
    },
    {
      year: 2021,
      periodo: '2021',
      Cerrado: 78,
      Amazônia: 82,
      Caatinga: 70,
      'Mata Atlântica': 58,
      Pantanal: 68,
      Pampa: 48,
    },
    {
      year: 2022,
      periodo: '2022',
      Cerrado: 75,
      Amazônia: 80,
      Caatinga: 68,
      'Mata Atlântica': 55,
      Pantanal: 65,
      Pampa: 45,
    },
    {
      year: 2023,
      periodo: '2023',
      Cerrado: 70,
      Amazônia: 75,
      Caatinga: 62,
      'Mata Atlântica': 50,
      Pantanal: 58,
      Pampa: 40,
    },
    {
      year: 2024,
      periodo: '2024',
      Cerrado: 72,
      Amazônia: 76,
      Caatinga: 64,
      'Mata Atlântica': 52,
      Pantanal: 60,
      Pampa: 42,
    },
    {
      year: 2025,
      periodo: '2025',
      Cerrado: 70,
      Amazônia: 74,
      Caatinga: 62,
      'Mata Atlântica': 50,
      Pantanal: 58,
      Pampa: 40,
    },
  ];
};

// All states data
export const getAllStates = (): StateData[] => {
  return [
    ...getTopStates(),
    { sigla: 'SP', nome: 'São Paulo', bioma: 'Mata Atlântica', risco: 45, areaQueimada: 250000, focosCalor: 10000, variacao: -5 },
    { sigla: 'MG', nome: 'Minas Gerais', bioma: 'Mata Atlântica', risco: 48, areaQueimada: 280000, focosCalor: 11000, variacao: -2 },
    { sigla: 'RJ', nome: 'Rio de Janeiro', bioma: 'Mata Atlântica', risco: 42, areaQueimada: 180000, focosCalor: 7000, variacao: -8 },
    { sigla: 'PR', nome: 'Paraná', bioma: 'Mata Atlântica', risco: 40, areaQueimada: 160000, focosCalor: 6000, variacao: -10 },
    { sigla: 'SC', nome: 'Santa Catarina', bioma: 'Mata Atlântica', risco: 38, areaQueimada: 140000, focosCalor: 5000, variacao: -12 },
    { sigla: 'RS', nome: 'Rio Grande do Sul', bioma: 'Pampa', risco: 35, areaQueimada: 120000, focosCalor: 4000, variacao: -15 },
    { sigla: 'ES', nome: 'Espírito Santo', bioma: 'Mata Atlântica', risco: 42, areaQueimada: 170000, focosCalor: 6500, variacao: -6 },
    { sigla: 'DF', nome: 'Distrito Federal', bioma: 'Cerrado', risco: 55, areaQueimada: 95000, focosCalor: 3500, variacao: 2 },
    { sigla: 'PE', nome: 'Pernambuco', bioma: 'Caatinga', risco: 52, areaQueimada: 180000, focosCalor: 7000, variacao: 4 },
    { sigla: 'CE', nome: 'Ceará', bioma: 'Caatinga', risco: 50, areaQueimada: 160000, focosCalor: 6000, variacao: 3 },
  ];
};

const occurrenceRecordsBase: OccurrenceRecord[] = [
  { id: 'O01', especie: 'Lobo-guará', tipoAnimal: 'Mamífero', raca: 'Chrysocyon brachyurus centralis', estado: 'GO', bioma: 'Cerrado', comportamento: 'Deslocamento', confianca: 84, individuos: 2, data: '2025-04-18', lat: -16.4, lng: -49.2 },
  { id: 'O02', especie: 'Lobo-guará', tipoAnimal: 'Mamífero', raca: 'Chrysocyon brachyurus centralis', estado: 'MT', bioma: 'Cerrado', comportamento: 'Alimentação', confianca: 88, individuos: 1, data: '2025-06-02', lat: -15.5, lng: -56.1 },
  { id: 'O03', especie: 'Onça-pintada', tipoAnimal: 'Mamífero', raca: 'Panthera onca palustris', estado: 'MS', bioma: 'Pantanal', comportamento: 'Descanso', confianca: 79, individuos: 1, data: '2025-07-21', lat: -19.3, lng: -57.1 },
  { id: 'O04', especie: 'Onça-pintada', tipoAnimal: 'Mamífero', raca: 'Panthera onca palustris', estado: 'MT', bioma: 'Cerrado', comportamento: 'Deslocamento', confianca: 74, individuos: 1, data: '2025-08-09', lat: -13.9, lng: -55.9 },
  { id: 'O05', especie: 'Arara-azul-grande', tipoAnimal: 'Ave', raca: 'Anodorhynchus hyacinthinus macro', estado: 'MS', bioma: 'Pantanal', comportamento: 'Nidificação', confianca: 91, individuos: 4, data: '2025-09-03', lat: -18.5, lng: -56.2 },
  { id: 'O06', especie: 'Arara-azul-grande', tipoAnimal: 'Ave', raca: 'Anodorhynchus hyacinthinus macro', estado: 'GO', bioma: 'Cerrado', comportamento: 'Alimentação', confianca: 83, individuos: 3, data: '2025-10-14', lat: -16.7, lng: -50.0 },
  { id: 'O07', especie: 'Papagaio-verdadeiro', tipoAnimal: 'Ave', raca: 'Amazona aestiva aestiva', estado: 'SP', bioma: 'Mata Atlântica', comportamento: 'Reprodução', confianca: 77, individuos: 6, data: '2025-05-08', lat: -22.8, lng: -46.3 },
  { id: 'O08', especie: 'Papagaio-verdadeiro', tipoAnimal: 'Ave', raca: 'Amazona aestiva aestiva', estado: 'MG', bioma: 'Mata Atlântica', comportamento: 'Deslocamento', confianca: 72, individuos: 5, data: '2025-11-24', lat: -19.6, lng: -44.2 },
  { id: 'O09', especie: 'Sapo-cururu', tipoAnimal: 'Anfíbio', raca: 'Rhinella schneideri cerrado', estado: 'DF', bioma: 'Cerrado', comportamento: 'Reprodução', confianca: 69, individuos: 12, data: '2025-03-30', lat: -15.8, lng: -47.9 },
  { id: 'O10', especie: 'Sapo-cururu', tipoAnimal: 'Anfíbio', raca: 'Rhinella schneideri cerrado', estado: 'TO', bioma: 'Cerrado', comportamento: 'Descanso', confianca: 66, individuos: 8, data: '2025-12-01', lat: -10.2, lng: -48.3 },
  { id: 'O11', especie: 'Jacaré-do-pantanal', tipoAnimal: 'Réptil', raca: 'Caiman yacare pantaneiro', estado: 'MS', bioma: 'Pantanal', comportamento: 'Alimentação', confianca: 82, individuos: 7, data: '2025-02-11', lat: -19.1, lng: -56.7 },
  { id: 'O12', especie: 'Jacaré-do-pantanal', tipoAnimal: 'Réptil', raca: 'Caiman yacare pantaneiro', estado: 'MT', bioma: 'Pantanal', comportamento: 'Deslocamento', confianca: 78, individuos: 5, data: '2025-08-29', lat: -16.1, lng: -57.3 },
  { id: 'O13', especie: 'Pacu', tipoAnimal: 'Peixe', raca: 'Piaractus mesopotamicus sul', estado: 'MS', bioma: 'Pantanal', comportamento: 'Alimentação', confianca: 75, individuos: 16, data: '2026-01-19', lat: -20.1, lng: -56.0 },
  { id: 'O14', especie: 'Pacu', tipoAnimal: 'Peixe', raca: 'Piaractus mesopotamicus sul', estado: 'MT', bioma: 'Pantanal', comportamento: 'Deslocamento', confianca: 71, individuos: 10, data: '2026-02-07', lat: -15.7, lng: -56.5 },
  { id: 'O15', especie: 'Cachorro-do-mato-vinagre', tipoAnimal: 'Mamífero', raca: 'Speothos venaticus amazonicus', estado: 'AM', bioma: 'Amazônia', comportamento: 'Deslocamento', confianca: 73, individuos: 2, data: '2026-02-26', lat: -3.1, lng: -61.2 },
  { id: 'O16', especie: 'Cachorro-do-mato-vinagre', tipoAnimal: 'Mamífero', raca: 'Speothos venaticus amazonicus', estado: 'PA', bioma: 'Amazônia', comportamento: 'Alimentação', confianca: 80, individuos: 3, data: '2026-03-05', lat: -4.2, lng: -52.7 },
  { id: 'O17', especie: 'Lobo-guará', tipoAnimal: 'Mamífero', raca: 'Chrysocyon brachyurus centralis', estado: 'BA', bioma: 'Caatinga', comportamento: 'Deslocamento', confianca: 68, individuos: 1, data: '2026-03-11', lat: -12.9, lng: -41.8 },
  { id: 'O18', especie: 'Arara-azul-grande', tipoAnimal: 'Ave', raca: 'Anodorhynchus hyacinthinus macro', estado: 'MT', bioma: 'Cerrado', comportamento: 'Nidificação', confianca: 90, individuos: 2, data: '2026-03-25', lat: -14.2, lng: -55.3 },
  { id: 'O19', especie: 'Onça-pintada', tipoAnimal: 'Mamífero', raca: 'Panthera onca palustris', estado: 'AM', bioma: 'Amazônia', comportamento: 'Descanso', confianca: 76, individuos: 1, data: '2026-03-29', lat: -3.9, lng: -62.5 },
  { id: 'O20', especie: 'Papagaio-verdadeiro', tipoAnimal: 'Ave', raca: 'Amazona aestiva aestiva', estado: 'PR', bioma: 'Mata Atlântica', comportamento: 'Alimentação', confianca: 70, individuos: 4, data: '2026-04-01', lat: -25.2, lng: -50.4 },
];

export const getOccurrenceFilterOptions = () => {
  const estados = Array.from(new Set(occurrenceRecordsBase.map((record) => record.estado))).sort();
  const biomas = Array.from(new Set(occurrenceRecordsBase.map((record) => record.bioma))).sort();
  const tipos = Array.from(new Set(occurrenceRecordsBase.map((record) => record.tipoAnimal))).sort();
  const racas = Array.from(new Set(occurrenceRecordsBase.map((record) => record.raca))).sort();
  return { estados, biomas, tipos, racas };
};

export const getOccurrenceRecords = (filters?: {
  estado?: string;
  bioma?: string;
  tipoAnimal?: string;
  raca?: string;
  searchTerm?: string;
}) => {
  const term = filters?.searchTerm?.trim().toLowerCase();
  return occurrenceRecordsBase.filter((record) => {
    const stateMatch = !filters?.estado || filters.estado === 'Todos' || record.estado === filters.estado;
    const biomeMatch = !filters?.bioma || filters.bioma === 'Todos' || record.bioma === filters.bioma;
    const typeMatch = !filters?.tipoAnimal || filters.tipoAnimal === 'Todos' || record.tipoAnimal === filters.tipoAnimal;
    const breedMatch = !filters?.raca || filters.raca === 'Todos' || record.raca === filters.raca;
    const searchMatch =
      !term ||
      record.especie.toLowerCase().includes(term) ||
      record.raca.toLowerCase().includes(term) ||
      record.comportamento.toLowerCase().includes(term);
    return stateMatch && biomeMatch && typeMatch && breedMatch && searchMatch;
  });
};

export const getOccurrenceTimeline = (
  granularity: DataGranularity = 'anual',
  records: OccurrenceRecord[] = occurrenceRecordsBase
) => {
  if (granularity === 'anual') {
    const grouped = new Map<string, { periodo: string; ocorrencias: number; individuos: number }>();
    records.forEach((record) => {
      const year = String(new Date(record.data).getFullYear());
      const current = grouped.get(year) || { periodo: year, ocorrencias: 0, individuos: 0 };
      current.ocorrencias += 1;
      current.individuos += record.individuos;
      grouped.set(year, current);
    });
    return Array.from(grouped.values()).sort((a, b) => Number(a.periodo) - Number(b.periodo));
  }

  if (granularity === 'mensal') {
    const grouped = new Map<string, { periodo: string; ocorrencias: number; individuos: number }>();
    records.forEach((record) => {
      const month = monthLabels[new Date(record.data).getMonth()];
      const current = grouped.get(month) || { periodo: month, ocorrencias: 0, individuos: 0 };
      current.ocorrencias += 1;
      current.individuos += record.individuos;
      grouped.set(month, current);
    });
    return monthLabels.map((month) => grouped.get(month) || { periodo: month, ocorrencias: 0, individuos: 0 });
  }

  return getLastDaysLabels(30).map((periodo, idx) => ({
    periodo,
    ocorrencias: Math.max(0, Math.round(2 + Math.sin(idx / 3) * 2 + (idx % 5 === 0 ? 1 : 0))),
    individuos: Math.max(0, Math.round(5 + Math.cos(idx / 3) * 3 + (idx % 6 === 0 ? 2 : 0))),
  }));
};

export const getOccurrenceBehaviorAnalysis = (
  records: OccurrenceRecord[] = occurrenceRecordsBase
): BehaviorCoverage[] => {
  const grouped = new Map<string, { ocorrencias: number; confianca: number }>();
  records.forEach((record) => {
    const current = grouped.get(record.comportamento) || { ocorrencias: 0, confianca: 0 };
    current.ocorrencias += 1;
    current.confianca += record.confianca;
    grouped.set(record.comportamento, current);
  });

  return Array.from(grouped.entries())
    .map(([comportamento, values]) => ({
      comportamento,
      ocorrencias: values.ocorrencias,
      mediaConfianca: Number((values.confianca / values.ocorrencias).toFixed(1)),
    }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias);
};

export const getOccurrenceRacaRanking = (records: OccurrenceRecord[] = occurrenceRecordsBase) => {
  const grouped = new Map<string, { raca: string; ocorrencias: number; individuos: number }>();
  records.forEach((record) => {
    const current = grouped.get(record.raca) || { raca: record.raca, ocorrencias: 0, individuos: 0 };
    current.ocorrencias += 1;
    current.individuos += record.individuos;
    grouped.set(record.raca, current);
  });

  return Array.from(grouped.values())
    .sort((a, b) => b.ocorrencias - a.ocorrencias)
    .slice(0, 8);
};

export const getOccurrenceRegionDistribution = (records: OccurrenceRecord[] = occurrenceRecordsBase) => {
  const grouped = new Map<string, number>();
  records.forEach((record) => {
    grouped.set(record.estado, (grouped.get(record.estado) || 0) + 1);
  });

  return Array.from(grouped.entries())
    .map(([regiao, ocorrencias]) => ({ regiao, ocorrencias }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias);
};

export const getOccurrenceFireLayerMetrics = (records: OccurrenceRecord[] = occurrenceRecordsBase) => {
  const hotspotByState: Record<string, number> = {
    MT: 92,
    PA: 78,
    BA: 68,
    MS: 72,
    AM: 65,
  };

  const withRisk = records.map((record) => ({
    ...record,
    fireIntensity: hotspotByState[record.estado] || 30,
  }));

  const proximas = withRisk.filter((record) => record.fireIntensity >= 65).length;
  const riscoMedio =
    withRisk.length > 0
      ? Number((withRisk.reduce((acc, record) => acc + record.fireIntensity, 0) / withRisk.length).toFixed(1))
      : 0;

  const correlation = ['Alimentação', 'Reprodução', 'Deslocamento', 'Descanso', 'Nidificação'].map((comportamento) => {
    const set = withRisk.filter((record) => record.comportamento === comportamento);
    const media =
      set.length > 0 ? Number((set.reduce((acc, record) => acc + record.fireIntensity, 0) / set.length).toFixed(1)) : 0;
    return {
      comportamento,
      intensidadeFogo: media,
      ocorrencias: set.length,
    };
  });

  return {
    totalOcorrencias: withRisk.length,
    proximasAoFogo: proximas,
    percentualProximas: withRisk.length > 0 ? Number(((proximas / withRisk.length) * 100).toFixed(1)) : 0,
    riscoMedio,
    correlation,
  };
};
