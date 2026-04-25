import apiClient from '@/services/apiClient';
import { isSupportedDomainState, normalizeLabel } from '@/lib/territory';
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
  TrendBiomeRow,
  TrendDashboardPayload,
  TrendHeatmapAnnualRow,
  TrendHeatmapSeriesRow,
  TrendSeriesRow,
  TrendStateRow,
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

const biomeColorMap: Record<string, string> = {
  Cerrado: '#F0AD4E',
  Amazonia: '#5CB85C',
  Caatinga: '#D4A520',
  'Mata Atlantica': '#7CB342',
  Pantanal: '#00BCD4',
  Pampa: '#5BC0DE',
};

const normalize = normalizeLabel;

const isInAmazCerrado = (stateName: string) => isSupportedDomainState(stateName);

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

const formatStateName = (stateName: string) =>
  stateName
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, (match) => match.toUpperCase());

const formatPointIntensity = (point: FirePointItem) => {
  const riskComponent = point.risco_fogo <= 1 ? point.risco_fogo * 100 : point.risco_fogo;
  const frpComponent = Math.min(100, point.frp);
  return Math.max(10, Math.min(100, Math.round(riskComponent * 0.7 + frpComponent * 0.3)));
};

const formatHeatmapLabel = (value: string) => {
  const [year, month, day] = value.split('-');
  if (day) {
    return `${day}/${month}/${year}`;
  }
  if (month) {
    return `${month}/${year}`;
  }
  return value;
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
const MAX_PAGES = 400;
const YEARLY_SAMPLE_LIMIT = 10_000;
const FIRE_POINTS_CACHE_TTL_MS = 5 * 60 * 1000;
let firePointsCache: { data: FirePointItem[]; expiresAt: number } | null = null;
let firePointsInFlight: Promise<FirePointItem[]> | null = null;

const inYearRange = (anoMes: string, yearRange?: [number, number]) => {
  if (!yearRange) {
    return true;
  }

  const [fromYear, toYear] = yearRange[0] <= yearRange[1] ? yearRange : [yearRange[1], yearRange[0]];
  const year = Number(anoMes.slice(0, 4));
  return year >= fromYear && year <= toYear;
};

const buildSampledFirePoints = (allPoints: FirePointItem[]) => {
  const pointsByYear = new Map<number, FirePointItem[]>();
  for (const point of allPoints) {
    const year = Number(point.ano_mes.slice(0, 4));
    const bucket = pointsByYear.get(year) || [];
    bucket.push(point);
    pointsByYear.set(year, bucket);
  }

  const sampled: FirePointItem[] = [];
  pointsByYear.forEach((points) => {
    if (points.length <= YEARLY_SAMPLE_LIMIT) {
      sampled.push(...points);
      return;
    }

    const stride = points.length / YEARLY_SAMPLE_LIMIT;
    for (let i = 0; i < YEARLY_SAMPLE_LIMIT; i += 1) {
      sampled.push(points[Math.floor(i * stride)]);
    }
  });
  return sampled;
};

const fetchAllFirePointsUncached = async () => {
  const all: FirePointItem[] = [];
  let offset = 0;
  let pageCount = 0;

  try {
    while (pageCount < MAX_PAGES) {
      const page = await fetchFirePoints({ limit: PAGE_SIZE, offset });
      
      if (!page || page.length === 0) {
        break;
      }
      
      // Add bioma lookup and area_queimada estimation
      const enhancedPage = page.map((item) => {
        const biomaMap: Record<string, string> = {
          'Amazonas': 'Amazônia',
          'Pará': 'Amazônia',
          'Acre': 'Amazônia',
          'Rondônia': 'Amazônia',
          'Roraima': 'Amazônia',
          'Amapá': 'Amazônia',
          'Tocantins': 'Cerrado',
          'Goiás': 'Cerrado',
          'Mato Grosso': 'Amazônia',
          'Mato Grosso do Sul': 'Cerrado',
          'Bahia': 'Cerrado',
          'Maranhão': 'Amazônia',
          'Piauí': 'Cerrado',
          'Minas Gerais': 'Cerrado',
          'São Paulo': 'Cerrado',
          'Distrito Federal': 'Cerrado',
        };
        
        return {
          ...item,
          bioma: biomaMap[item.estado] || 'Cerrado',
          area_queimada: 1000, // Estimate burned area in hectares
        };
      });
      
      const filteredPage = enhancedPage.filter((item) => isInAmazCerrado(item.estado));
      all.push(...filteredPage);
      
      if (page.length < PAGE_SIZE) {
        break; // Last page
      }
      
      offset += PAGE_SIZE;
      pageCount++;
    }
  } catch (error) {
    console.error('Error fetching fire points:', error);
    // Return what we have so far
  }

  return buildSampledFirePoints(all);
};

export const fetchAllFirePoints = async () => {
  const now = Date.now();
  if (firePointsCache && firePointsCache.expiresAt > now) {
    return firePointsCache.data;
  }

  if (firePointsInFlight) {
    return firePointsInFlight;
  }

  firePointsInFlight = fetchAllFirePointsUncached()
    .then((data) => {
      firePointsCache = {
        data,
        expiresAt: Date.now() + FIRE_POINTS_CACHE_TTL_MS,
      };
      return data;
    })
    .finally(() => {
      firePointsInFlight = null;
    });

  return firePointsInFlight;
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

  if (filteredPoints.length === 0) {
    return {
      historicalData: [],
      topStates: [],
      biomeDistribution: [],
      fireHotspots: [],
    };
  }

  const groupedByPeriod = new Map<string, { points: number; riskSum: number }>();
  const groupedByState = new Map<
    string,
    {
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
      focos: 0,
      riskSum: 0,
      biomas: {},
      years: {},
    };

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
      areaQueimada: estimateAreaByFires(values.points),
      focosCalor: values.points,
    }));

  const topStates: NationalStateRow[] = Array.from(groupedByState.entries())
    .map(([stateName, values]) => {
      const sigla = stateNameToCode[stateName] || stateName.slice(0, 2);
      const nome = formatStateName(stateCodeToName[sigla] || stateName);
      const dominantBiome = Object.entries(values.biomas).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Cerrado';
      const risco = values.focos > 0 ? Number(((values.riskSum / values.focos) * 100).toFixed(1)) : 0;
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
    intensity: formatPointIntensity(point),
  }));

  const biomeDistributionMap = new Map<string, number>();
  filteredPoints.forEach((point) => {
    const biome = point.bioma || 'Cerrado';
    biomeDistributionMap.set(biome, (biomeDistributionMap.get(biome) || 0) + 1);
  });

  const biomeDistributionRows: BiomeDistributionRow[] = Array.from(biomeDistributionMap.entries()).map(([name, count]) => ({
    nome: name,
    percentual: Number(((count / filteredPoints.length) * 100).toFixed(1)),
    cor: biomeColorMap[name] || '#64748b',
  }));

  return {
    historicalData,
    topStates,
    biomeDistribution: biomeDistributionRows,
    fireHotspots,
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
      ? Number(((statePoints.reduce((sum, cur) => sum + cur.risco_fogo, 0) / statePoints.length) * 100).toFixed(1))
      : 0;
  const avgFrp =
    statePoints.length > 0
      ? Number((statePoints.reduce((sum, cur) => sum + cur.frp, 0) / statePoints.length).toFixed(1))
      : 0;
  const uniquePeriods = Array.from(new Set(statePoints.map((item) => item.ano_mes))).sort((a, b) => a.localeCompare(b));
  const uniqueCities = Array.from(new Set(statePoints.map((item) => item.municipio))).sort((a, b) => a.localeCompare(b));

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
      score: Number(((values.riskSum / Math.max(values.points, 1)) * 100).toFixed(1)),
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
      const existing = acc.get(item.municipio) || {
        areaQueimada: 0,
        scoreAcc: 0,
        count: 0,
        frpAcc: 0,
        biomas: {} as Record<string, number>,
      };
      existing.areaQueimada += estimateAreaByFires(1);
      existing.scoreAcc += item.risco_fogo;
      existing.frpAcc += item.frp;
      existing.count += 1;
      existing.biomas[item.bioma] = (existing.biomas[item.bioma] || 0) + 1;
      acc.set(item.municipio, existing);
      return acc;
    }, new Map<string, { areaQueimada: number; scoreAcc: number; count: number; frpAcc: number; biomas: Record<string, number> }>())
    .entries();

  const municipiosRows = Array.from(municipios)
    .map(([nome, values]) => ({
      nome,
      areaQueimada: values.areaQueimada,
      risco: Number((values.scoreAcc / Math.max(values.count, 1)).toFixed(1)),
      bioma: Object.entries(values.biomas).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Cerrado',
      focos: values.count,
    }))
    .sort((a, b) => b.focos - a.focos || b.risco - a.risco || a.nome.localeCompare(b.nome));

  const availableStates = Array.from(new Set(filteredPoints.map((item) => normalize(item.estado))))
    .map((stateName) => {
      const sigla = stateNameToCode[stateName];
      if (!sigla) {
        return null;
      }
      return {
        sigla,
        nome: formatStateName(stateName),
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
    nome: formatStateName(stateNameUpper || stateCode),
    sigla: stateCode,
    bioma: dominantBiome,
    risco: avgRisk,
    areaQueimada,
    focosCalor,
    frpMedio: avgFrp,
    municipiosAfetados: uniqueCities.length,
    mesesMonitorados: uniquePeriods.length,
    ultimoPeriodo: uniquePeriods[uniquePeriods.length - 1] || '',
    cidadesAfetadas: municipiosRows.map((municipio) => ({
      nome: municipio.nome,
      focos: municipio.focos,
    })),
    municipios: municipiosRows,
    seasonalityData,
    historicalData,
    availableStates,
  };
};

export const fetchTrendDashboard = async (
  granularity: DataGranularity,
  yearRange?: [number, number]
): Promise<TrendDashboardPayload> => {
  const firePoints = await fetchAllFirePoints();
  const filteredPoints = firePoints.filter((item) => inYearRange(item.ano_mes, yearRange));

  if (filteredPoints.length === 0) {
    return {
      trendData: [],
      biomeTrendData: [],
      heatmapAnnualData: [],
      heatmapSeriesData: [],
      stateTrendData: [],
      availableStates: [],
      availableBiomes: [],
    };
  }

  const groupedTrend = new Map<string, { count: number; riskSum: number; min: number; max: number }>();
  const groupedBiome = new Map<string, Map<string, number[]>>();
  const groupedDaily = new Map<string, number>();
  const groupedState = new Map<string, Map<string, { count: number; riskSum: number }>>();

  filteredPoints.forEach((point) => {
    const periodKey =
      granularity === 'anual'
        ? point.ano_mes.slice(0, 4)
        : granularity === 'mensal'
          ? point.ano_mes
          : point.data_hora.slice(0, 10);
    const trendItem = groupedTrend.get(periodKey) || { count: 0, riskSum: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY };
    trendItem.count += 1;
    trendItem.riskSum += point.risco_fogo;
    trendItem.min = Math.min(trendItem.min, point.risco_fogo);
    trendItem.max = Math.max(trendItem.max, point.risco_fogo);
    groupedTrend.set(periodKey, trendItem);

    const biomeKey = point.bioma || 'Sem bioma';
    const biomePeriod = groupedBiome.get(periodKey) || new Map<string, number[]>();
    const biomeValues = biomePeriod.get(biomeKey) || [];
    biomeValues.push(point.risco_fogo);
    biomePeriod.set(biomeKey, biomeValues);
    groupedBiome.set(periodKey, biomePeriod);

    groupedDaily.set(point.ano_mes, (groupedDaily.get(point.ano_mes) || 0) + 1);

    const stateName = normalize(point.estado);
    const statePeriod = groupedState.get(stateName) || new Map<string, { count: number; riskSum: number }>();
    const stateValues = statePeriod.get(periodKey) || { count: 0, riskSum: 0 };
    stateValues.count += 1;
    stateValues.riskSum += point.risco_fogo;
    statePeriod.set(periodKey, stateValues);
    groupedState.set(stateName, statePeriod);
  });

  const trendData: TrendSeriesRow[] = Array.from(groupedTrend.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([periodo, values]) => ({
      periodo: granularity === 'diario' ? formatHeatmapLabel(periodo) : formatAnoMes(periodo, granularity),
      score: Number(((values.riskSum / Math.max(values.count, 1)) * 100).toFixed(1)),
      min: Number((values.min * 100).toFixed(1)),
      max: Number((values.max * 100).toFixed(1)),
    }));

  const biomeKeys = Array.from(
    filteredPoints.reduce((set, point) => {
      set.add(point.bioma || 'Sem bioma');
      return set;
    }, new Set<string>())
  ).sort((a, b) => a.localeCompare(b));

  const biomeTrendData: TrendBiomeRow[] = Array.from(groupedBiome.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([periodKey, biomeMap]) => {
      const row: TrendBiomeRow = {
        periodo: granularity === 'diario' ? formatHeatmapLabel(periodKey) : formatAnoMes(periodKey, granularity),
      };

      biomeKeys.forEach((biome) => {
        const values = biomeMap.get(biome) || [];
        row[biome] = values.length > 0 ? Number(((values.reduce((sum, value) => sum + value, 0) / values.length) * 100).toFixed(1)) : 0;
      });

      return row;
    });

  const heatmapAnnualData: TrendHeatmapAnnualRow[] = Array.from(groupedDaily.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([anoMes, intensity]) => {
      const [year, month] = anoMes.split('-');
      return {
        year: Number(year),
        month,
        intensity,
      };
    });

  const heatmapSeriesSource =
    granularity === 'diario'
      ? Array.from(
          filteredPoints.reduce((map, point) => {
            const key = point.data_hora.slice(0, 10);
            map.set(key, (map.get(key) || 0) + 1);
            return map;
          }, new Map<string, number>())
        )
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-30)
      : Array.from(groupedDaily.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const heatmapSeriesData: TrendHeatmapSeriesRow[] = heatmapSeriesSource.map(([periodo, intensity]) => ({
    periodo: granularity === 'diario' ? formatHeatmapLabel(periodo) : formatAnoMes(periodo, 'mensal'),
    intensity,
  }));

  const stateTrendData: TrendStateRow[] = Array.from(groupedState.entries())
    .map(([stateName, periods]) => {
      const orderedPeriods = Array.from(periods.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const current = orderedPeriods[orderedPeriods.length - 1]?.[1];
      const previous = orderedPeriods[orderedPeriods.length - 2]?.[1];
      const atual = current ? Number(((current.riskSum / Math.max(current.count, 1)) * 100).toFixed(1)) : 0;
      const anterior = previous ? Number(((previous.riskSum / Math.max(previous.count, 1)) * 100).toFixed(1)) : 0;
      const sigla = stateNameToCode[stateName] || stateName.slice(0, 2);
      return {
        sigla,
        nome: formatStateName(stateCodeToName[sigla] || stateName),
        atual,
        anterior,
        variacao: Number((atual - anterior).toFixed(1)),
      };
    })
    .sort((a, b) => b.variacao - a.variacao || a.nome.localeCompare(b.nome));

  const availableStates = Array.from(groupedState.keys())
    .map((stateName) => {
      const sigla = stateNameToCode[stateName];
      if (!sigla) {
        return null;
      }
      return {
        sigla,
        nome: formatStateName(stateName),
      };
    })
    .filter((item): item is { sigla: string; nome: string } => Boolean(item))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return {
    trendData,
    biomeTrendData,
    heatmapAnnualData,
    heatmapSeriesData,
    stateTrendData,
    availableStates,
    availableBiomes: biomeKeys,
  };
};
