import apiClient from '@/services/apiClient';
import type {
  BiomeDistributionRow,
  DataGranularity,
  FaunaBiodiversitySummary,
  FaunaFilterOptions,
  FaunaGroupDistributionItem,
  FaunaOccurrenceItem,
  FaunaSpeciesItem,
  FaunaStateDistributionItem,
  FaunaTimelineItem,
  FirePointItem,
  FireHotspotRow,
  FireMapItem,
  FireReportCreatePayload,
  FireReportResponse,
  NationalDashboardPayload,
  NationalHistoricalRow,
  NationalStateRow,
  RegionSnapshot,
  RiskForecastResponse,
  StateDashboardPayload,
} from '@/types/api';

const stateNameToCode: Record<string, string> = {
  ACRE: 'AC',
  ALAGOAS: 'AL',
  AMAPA: 'AP',
  AMAZONAS: 'AM',
  BAHIA: 'BA',
  CEARA: 'CE',
  'DISTRITO FEDERAL': 'DF',
  'ESPIRITO SANTO': 'ES',
  GOIAS: 'GO',
  MARANHAO: 'MA',
  'MATO GROSSO': 'MT',
  'MATO GROSSO DO SUL': 'MS',
  'MINAS GERAIS': 'MG',
  PARA: 'PA',
  PARAIBA: 'PB',
  PARANA: 'PR',
  PERNAMBUCO: 'PE',
  PIAUI: 'PI',
  'RIO DE JANEIRO': 'RJ',
  'RIO GRANDE DO NORTE': 'RN',
  'RIO GRANDE DO SUL': 'RS',
  RONDONIA: 'RO',
  RORAIMA: 'RR',
  'SANTA CATARINA': 'SC',
  'SAO PAULO': 'SP',
  SERGIPE: 'SE',
  TOCANTINS: 'TO',
};

const stateCodeToName: Record<string, string> = Object.entries(stateNameToCode).reduce(
  (acc, [name, code]) => ({ ...acc, [code]: name }),
  {} as Record<string, string>
);

const stateCoordinates: Record<string, { lat: number; lng: number }> = {
  AC: { lat: -9.02, lng: -70.81 },
  AL: { lat: -9.57, lng: -36.78 },
  AP: { lat: 1.41, lng: -51.77 },
  AM: { lat: -3.07, lng: -61.66 },
  BA: { lat: -12.7, lng: -41.7 },
  CE: { lat: -5.2, lng: -39.5 },
  DF: { lat: -15.78, lng: -47.93 },
  ES: { lat: -19.19, lng: -40.34 },
  GO: { lat: -15.9, lng: -50.14 },
  MA: { lat: -5.42, lng: -45.44 },
  MT: { lat: -12.64, lng: -55.42 },
  MS: { lat: -20.51, lng: -54.54 },
  MG: { lat: -18.1, lng: -44.38 },
  PA: { lat: -3.79, lng: -52.48 },
  PB: { lat: -7.24, lng: -36.78 },
  PR: { lat: -24.89, lng: -51.55 },
  PE: { lat: -8.38, lng: -37.86 },
  PI: { lat: -7.72, lng: -42.73 },
  RJ: { lat: -22.84, lng: -43.15 },
  RN: { lat: -5.22, lng: -36.52 },
  RS: { lat: -30.17, lng: -53.5 },
  RO: { lat: -11.22, lng: -62.8 },
  RR: { lat: 1.89, lng: -61.22 },
  SC: { lat: -27.33, lng: -50.88 },
  SP: { lat: -22.19, lng: -48.79 },
  SE: { lat: -10.57, lng: -37.45 },
  TO: { lat: -10.3, lng: -48.3 },
};

const biomeColorMap: Record<string, string> = {
  Cerrado: '#F0AD4E',
  Amazonia: '#5CB85C',
  Caatinga: '#D4A520',
  'Mata Atlantica': '#7CB342',
  Pantanal: '#00BCD4',
  Pampa: '#5BC0DE',
};

const defaultBiomeDistribution: BiomeDistributionRow[] = [
  { nome: 'Cerrado', percentual: 42, cor: '#F0AD4E' },
  { nome: 'Amazonia', percentual: 31, cor: '#5CB85C' },
  { nome: 'Caatinga', percentual: 12, cor: '#D4A520' },
  { nome: 'Mata Atlantica', percentual: 8, cor: '#7CB342' },
  { nome: 'Pantanal', percentual: 5, cor: '#00BCD4' },
  { nome: 'Pampa', percentual: 2, cor: '#5BC0DE' },
];

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

const AMAZ_CERRADO_STATES = new Set([
  'ACRE',
  'AMAPA',
  'AMAZONAS',
  'BAHIA',
  'DISTRITO FEDERAL',
  'GOIAS',
  'MARANHAO',
  'MATO GROSSO',
  'MATO GROSSO DO SUL',
  'MINAS GERAIS',
  'PARA',
  'PARANA',
  'PIAUI',
  'RONDONIA',
  'RORAIMA',
  'SAO PAULO',
  'TOCANTINS',
]);

const isInAmazCerrado = (stateName: string) => AMAZ_CERRADO_STATES.has(normalize(stateName));

const parseStateFromRegionName = (regionName: string): string => {
  const start = regionName.indexOf(' - ');
  const end = regionName.lastIndexOf(' (');
  if (start < 0 || end < 0 || end <= start + 3) {
    return '';
  }
  return regionName.slice(start + 3, end).trim();
};

const formatAnoMes = (anoMes: string, granularity: DataGranularity) => {
  const [year, month] = anoMes.split('-');
  if (granularity === 'anual') {
    return year;
  }
  if (granularity === 'mensal') {
    return `${month}/${year}`;
  }
  return `${month}/${year}`;
};

const estimateAreaByFires = (focos: number): number => {
  return Math.round(focos * 8.5);
};

const toRiskScore = (riskLabel: 'baixo' | 'medio' | 'alto') => {
  if (riskLabel === 'baixo') {
    return 30;
  }
  if (riskLabel === 'medio') {
    return 60;
  }
  return 85;
};

export const fetchRegions = async () => {
  const { data } = await apiClient.get<RegionSnapshot[]>('/regions');
  return data;
};

export const fetchRisk = async (params?: { region_id?: number; ano_mes?: string }) => {
  const { data } = await apiClient.get<RiskForecastResponse[]>('/risk', { params });
  return data;
};

export const fetchFires = async (params?: {
  ano_mes?: string;
  estado?: string;
  municipio?: string;
  limit?: number;
  offset?: number;
}) => {
  const { data } = await apiClient.get<FireMapItem[]>('/fires', { params });
  return data;
};

export const fetchFirePoints = async (params?: {
  ano_mes?: string;
  estado?: string;
  municipio?: string;
  limit?: number;
  offset?: number;
}) => {
  const { data } = await apiClient.get<FirePointItem[]>('/fires/points', { params });
  return data;
};

export const fetchFaunaFilters = async () => {
  const { data } = await apiClient.get<FaunaFilterOptions>('/fauna/filters');
  return data;
};

export const fetchFaunaOccurrences = async (params?: {
  estado?: string;
  bioma?: string;
  grupo?: string;
  status_iucn?: string;
  ano?: number;
  mes?: number;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  const { data } = await apiClient.get<FaunaOccurrenceItem[]>('/fauna/occurrences', { params });
  return data;
};

export const fetchFaunaTimeline = async (params?: {
  granularity?: 'anual' | 'mensal';
  estado?: string;
  bioma?: string;
  grupo?: string;
}) => {
  const { data } = await apiClient.get<FaunaTimelineItem[]>('/fauna/timeline', { params });
  return data;
};

export const fetchFaunaGroupDistribution = async (params?: {
  estado?: string;
  bioma?: string;
}) => {
  const { data } = await apiClient.get<FaunaGroupDistributionItem[]>('/fauna/distribution/groups', { params });
  return data;
};

export const fetchFaunaStateDistribution = async (params?: {
  bioma?: string;
  grupo?: string;
}) => {
  const { data } = await apiClient.get<FaunaStateDistributionItem[]>('/fauna/distribution/states', { params });
  return data;
};

export const fetchFaunaBiodiversitySummary = async (params?: {
  estado?: string;
  bioma?: string;
  grupo?: string;
}) => {
  const { data } = await apiClient.get<FaunaBiodiversitySummary>('/fauna/biodiversity/summary', { params });
  return data;
};

export const fetchFaunaSpecies = async (params?: {
  estado?: string;
  bioma?: string;
  grupo?: string;
  status_iucn?: string;
}) => {
  const { data } = await apiClient.get<FaunaSpeciesItem[]>('/fauna/biodiversity/species', { params });
  return data;
};

const PAGE_SIZE = 1000;

const parseAnoMesFromName = (value: string): string | null => {
  const match = value.match(/\((\d{4}-\d{2})\)$/);
  return match ? match[1] : null;
};

const inYearRange = (anoMes: string, yearRange?: [number, number]) => {
  if (!yearRange) {
    return true;
  }

  const [fromYear, toYear] = yearRange[0] <= yearRange[1] ? yearRange : [yearRange[1], yearRange[0]];
  const year = Number(anoMes.slice(0, 4));
  return year >= fromYear && year <= toYear;
};

const fetchAllFires = async () => {
  const all: FireMapItem[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await fetchFires({ limit: PAGE_SIZE, offset });
    all.push(...page);
    hasMore = page.length === PAGE_SIZE;
    if (hasMore) {
      offset += PAGE_SIZE;
    }
  }

  return all;
};

const fetchAllFirePoints = async () => {
  const all: FirePointItem[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await fetchFirePoints({ limit: PAGE_SIZE, offset });
    all.push(...page.filter((item) => isInAmazCerrado(item.estado)));
    hasMore = page.length === PAGE_SIZE;
    if (hasMore) {
      offset += PAGE_SIZE;
    }
  }

  return all;
};

const fetchAllRisk = async () => {
  const all: RiskForecastResponse[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await apiClient.get<RiskForecastResponse[]>('/risk', {
      params: { limit: PAGE_SIZE, offset },
    });
    all.push(...data);
    hasMore = data.length === PAGE_SIZE;
    if (hasMore) {
      offset += PAGE_SIZE;
    }
  }

  return all;
};

export const createFireReport = async (payload: FireReportCreatePayload) => {
  const { data } = await apiClient.post<FireReportResponse>('/reports/fire', payload);
  return data;
};

export const listFireReports = async () => {
  const { data } = await apiClient.get<FireReportResponse[]>('/reports/fire');
  return data;
};

export const fetchNationalDashboard = async (
  granularity: DataGranularity,
  yearRange?: [number, number]
): Promise<NationalDashboardPayload> => {
  const firePoints = await fetchAllFirePoints();
  const filteredPoints = firePoints.filter((item) => inYearRange(item.ano_mes, yearRange));

  const groupedByPeriod = new Map<string, { points: number; riskSum: number }>();
  const groupedByState = new Map<
    string,
    {
      points: FirePointItem[];
      focos: number;
      riskSum: number;
      biomas: Record<string, number>;
      years: Record<number, number>;
    }
  >();

  filteredPoints.forEach((item) => {
    const periodKey = granularity === 'anual' ? item.ano_mes.slice(0, 4) : item.ano_mes;
    const period = groupedByPeriod.get(periodKey) || { points: 0, riskSum: 0 };
    period.points += 1;
    period.riskSum += item.risco_fogo;
    groupedByPeriod.set(periodKey, period);

    const stateKey = normalize(item.estado);
    const state = groupedByState.get(stateKey) || {
      points: [],
      focos: 0,
      riskSum: 0,
      biomas: {},
      years: {},
    };

    state.points.push(item);
    state.focos += 1;
    state.riskSum += item.risco_fogo;
    state.biomas[item.bioma] = (state.biomas[item.bioma] || 0) + 1;
    const year = Number(item.ano_mes.slice(0, 4));
    if (Number.isFinite(year)) {
      state.years[year] = (state.years[year] || 0) + 1;
    }
    groupedByState.set(stateKey, state);
  });

  const historicalData: NationalHistoricalRow[] = Array.from(groupedByPeriod.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([periodKey, values]) => ({
      periodo: formatAnoMes(periodKey, granularity),
      areaQueimada: Number((estimateAreaByFires(values.points) / 1000000).toFixed(2)),
      focosCalor: values.points,
    }));

  const topStates: NationalStateRow[] = Array.from(groupedByState.entries())
    .map(([stateName, values]) => {
      const sigla = stateNameToCode[stateName] || stateName.slice(0, 2);
      const nome =
        stateCodeToName[sigla]?.toLowerCase().replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()) ||
        stateName;
      const dominantBiome = Object.entries(values.biomas).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Cerrado';
      const risco =
        values.focos > 0
          ? Number((values.riskSum / values.focos).toFixed(1))
          : toRiskScore('medio');
      const years = Object.keys(values.years)
        .map((year) => Number(year))
        .sort((a, b) => a - b);
      const variacao =
        years.length >= 2
          ? Number(
              (((values.years[years[years.length - 1]] || 0) - (values.years[years[years.length - 2]] || 0)) /
                Math.max(values.years[years[years.length - 2]] || 1, 1) *
                100).toFixed(1)
            )
          : 0;

      return {
        sigla,
        nome,
        bioma: dominantBiome,
        risco,
        areaQueimada: estimateAreaByFires(values.focos),
        focosCalor: values.focos,
        variacao,
      };
    })
    .sort((a, b) => b.risco - a.risco);

  const fireHotspots: FireHotspotRow[] = filteredPoints.map((point) => ({
    name: `${point.municipio} - ${point.estado}`,
    lat: point.latitude,
    lng: point.longitude,
    intensity: Math.max(10, Math.min(100, Math.round(point.risco_fogo))),
  }));

  const biomeDistributionMap = new Map<string, number>();
  filteredPoints.forEach((point) => {
    const biome = point.bioma || 'Cerrado';
    biomeDistributionMap.set(biome, (biomeDistributionMap.get(biome) || 0) + 1);
  });

  const biomeDistributionRows: BiomeDistributionRow[] = Array.from(biomeDistributionMap.entries()).length
    ? Array.from(biomeDistributionMap.entries()).map(([name, count]) => ({
        nome: name,
        percentual: Number(((count / filteredPoints.length) * 100).toFixed(1)),
        cor: biomeColorMap[name] || '#64748b',
      }))
    : defaultBiomeDistribution.map((item) => ({
        ...item,
        cor: biomeColorMap[item.nome] || item.cor,
      }));

  const fireHotspotsByState: FireHotspotRow[] = Array.from(groupedByState.entries()).map(([stateName, values]) => {
    const sigla = stateNameToCode[stateName] || stateName.slice(0, 2);
    const coord = stateCoordinates[sigla] || { lat: -15, lng: -55 };
    return {
      name: stateCodeToName[sigla] || stateName,
      lat: coord.lat,
      lng: coord.lng,
      intensity: Math.max(10, Math.min(100, Math.round(values.riskSum / Math.max(values.focos, 1)))),
    };
  });

  return {
    historicalData,
    topStates,
    biomeDistribution: biomeDistributionRows,
    fireHotspots: fireHotspots.length > 0 ? fireHotspots : fireHotspotsByState,
  };
};

export const fetchStateDashboard = async (
  stateCode: string,
  granularity: DataGranularity,
  yearRange?: [number, number]
): Promise<StateDashboardPayload> => {
  const stateNameUpper = stateCodeToName[stateCode] || stateCode;
  const stateNameNormalized = normalize(stateNameUpper);
  const firePoints = await fetchAllFirePoints();
  const filteredPoints = firePoints.filter((item) => inYearRange(item.ano_mes, yearRange));
  const statePoints = filteredPoints.filter((item) => normalize(item.estado) === stateNameNormalized);

  const focosCalor = statePoints.length;
  const areaQueimada = estimateAreaByFires(focosCalor);

  const avgRisk =
    statePoints.length > 0
      ? Number((statePoints.reduce((sum, cur) => sum + cur.risco_fogo, 0) / statePoints.length).toFixed(1))
      : 55;

  const temperature = statePoints.length > 0 ? Number((24 + avgRisk * 0.1).toFixed(1)) : 30;
  const humidity = statePoints.length > 0 ? Number((Math.max(12, 82 - avgRisk * 0.35)).toFixed(1)) : 40;
  const precipitation = statePoints.length > 0 ? Number((Math.max(0, 120 - avgRisk * 1.4)).toFixed(0)) : 800;
  const wind = statePoints.length > 0 ? Number((6 + Math.min(18, focosCalor / 250)).toFixed(1)) : 12;

  const groupedByPeriod = new Map<string, { points: number; riskSum: number }>();
  statePoints.forEach((item) => {
    const key = granularity === 'anual' ? item.ano_mes.slice(0, 4) : item.ano_mes;
    const current = groupedByPeriod.get(key) || { points: 0, riskSum: 0 };
    current.points += 1;
    current.riskSum += item.risco_fogo;
    groupedByPeriod.set(key, current);
  });

  const historicalData = Array.from(groupedByPeriod.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, values]) => ({
      periodo: formatAnoMes(key, granularity),
      score: Number((values.riskSum / Math.max(values.points, 1)).toFixed(1)),
    }));

  const seasonalityData = Array.from(groupedByPeriod.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, values]) => {
      if (granularity === 'diario') {
        return { periodo: formatAnoMes(key, granularity), area: estimateAreaByFires(values.points) };
      }
      const label = formatAnoMes(key, granularity);
      return { mes: label, area: estimateAreaByFires(values.points) };
    });

  const municipios = statePoints
    .reduce((acc, item) => {
      const existing = acc.get(item.municipio) || { areaQueimada: 0, scoreAcc: 0, count: 0, biomas: {} as Record<string, number> };
      existing.areaQueimada += estimateAreaByFires(1);
      existing.scoreAcc += item.risco_fogo;
      existing.count += 1;
      existing.biomas[item.bioma] = (existing.biomas[item.bioma] || 0) + 1;
      acc.set(item.municipio, existing);
      return acc;
    }, new Map<string, { areaQueimada: number; scoreAcc: number; count: number; biomas: Record<string, number> }>())
    .entries();

  const municipiosRows = Array.from(municipios)
    .map(([nome, values]) => ({
      nome,
      areaQueimada: values.areaQueimada,
      risco: Number((values.scoreAcc / Math.max(values.count, 1)).toFixed(1)),
      bioma: Object.entries(values.biomas).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Cerrado',
    }))
    .sort((a, b) => b.risco - a.risco)
    .slice(0, 10);

  const availableStates = Array.from(new Set(filteredPoints.map((item) => normalize(item.estado))))
    .map((stateName) => {
      const sigla = stateNameToCode[stateName];
      if (!sigla) {
        return null;
      }
      return {
        sigla,
        nome: stateName
          .toLowerCase()
          .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()),
      };
    })
    .filter((item): item is { sigla: string; nome: string } => Boolean(item))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const dominantBiome = statePoints.length > 0
    ? Object.entries(
        statePoints.reduce<Record<string, number>>((acc, point) => {
          acc[point.bioma] = (acc[point.bioma] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Cerrado'
    : 'Cerrado';

  return {
    nome:
      stateNameUpper
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()) || stateCode,
    sigla: stateCode,
    bioma: dominantBiome,
    risco: avgRisk,
    areaQueimada,
    focosCalor,
    temperatura: temperature,
    umidade: humidity,
    precipitacao: precipitation,
    vento: wind,
    municipios: municipiosRows,
    seasonalityData,
    historicalData,
    availableStates,
  };
};
