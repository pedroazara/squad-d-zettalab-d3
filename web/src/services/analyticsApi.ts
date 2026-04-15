import apiClient from '@/services/apiClient';
import type {
  BiomeDistributionRow,
  DataGranularity,
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
  const [fires, riskRows, regions] = await Promise.all([
    fetchAllFires(),
    fetchAllRisk(),
    fetchRegions(),
  ]);

  const filteredFires = fires.filter((item) => inYearRange(item.ano_mes, yearRange));
  const filteredRiskRows = riskRows.filter((item) => {
    const anoMes = parseAnoMesFromName(item.regiao_nome);
    return anoMes ? inYearRange(anoMes, yearRange) : false;
  });
  const filteredRegions = regions.filter((item) => {
    const anoMes = parseAnoMesFromName(item.nome);
    return anoMes ? inYearRange(anoMes, yearRange) : false;
  });

  const groupedByPeriod = new Map<string, { focos: number; area: number }>();
  const groupedByState = new Map<
    string,
    { focos: number; area: number; scores: number[]; biomas: Record<string, number> }
  >();

  filteredFires.forEach((item) => {
    const periodKey =
      granularity === 'anual' ? item.ano_mes.slice(0, 4) : item.ano_mes;
    const period = groupedByPeriod.get(periodKey) || { focos: 0, area: 0 };
    period.focos += item.quantidade_focos;
    period.area += estimateAreaByFires(item.quantidade_focos);
    groupedByPeriod.set(periodKey, period);

    const stateKey = normalize(item.estado);
    const state = groupedByState.get(stateKey) || {
      focos: 0,
      area: 0,
      scores: [],
      biomas: {},
    };

    state.focos += item.quantidade_focos;
    state.area += estimateAreaByFires(item.quantidade_focos);
    groupedByState.set(stateKey, state);
  });

  filteredRiskRows.forEach((item) => {
    const stateName = normalize(parseStateFromRegionName(item.regiao_nome));
    if (!stateName) {
      return;
    }
    const state = groupedByState.get(stateName) || {
      focos: 0,
      area: 0,
      scores: [],
      biomas: {},
    };
    state.scores.push(item.score);
    groupedByState.set(stateName, state);
  });

  filteredRegions.forEach((region) => {
    const stateName = normalize(parseStateFromRegionName(region.nome));
    if (!stateName) {
      return;
    }
    const state = groupedByState.get(stateName) || {
      focos: 0,
      area: 0,
      scores: [],
      biomas: {},
    };
    state.biomas[region.nome] = (state.biomas[region.nome] || 0) + 1;
    groupedByState.set(stateName, state);
  });

  const historicalData: NationalHistoricalRow[] = Array.from(groupedByPeriod.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([periodKey, values]) => ({
      periodo: formatAnoMes(periodKey, granularity),
      areaQueimada: Number((values.area / 1000000).toFixed(2)),
      focosCalor: values.focos,
    }));

  const topStates: NationalStateRow[] = Array.from(groupedByState.entries())
    .map(([stateName, values]) => {
      const sigla = stateNameToCode[stateName] || stateName.slice(0, 2);
      const nome =
        stateCodeToName[sigla]?.toLowerCase().replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()) ||
        stateName;
      const risco =
        values.scores.length > 0
          ? Number((values.scores.reduce((sum, cur) => sum + cur, 0) / values.scores.length).toFixed(1))
          : toRiskScore('medio');

      return {
        sigla,
        nome,
        bioma: 'Cerrado',
        risco,
        areaQueimada: values.area,
        focosCalor: values.focos,
        variacao: 0,
      };
    })
    .sort((a, b) => b.risco - a.risco);

  const fireHotspots: FireHotspotRow[] = topStates.map((state, index) => {
    const coord = stateCoordinates[state.sigla] || { lat: -15, lng: -55 };
    return {
      name: state.nome,
      lat: coord.lat + index * 0.08,
      lng: coord.lng + index * 0.08,
      intensity: Math.max(10, Math.round(state.focosCalor / 1000)),
    };
  });

  const biomeDistribution: BiomeDistributionRow[] = defaultBiomeDistribution.map((item) => ({
    ...item,
    cor: biomeColorMap[item.nome] || item.cor,
  }));

  return {
    historicalData,
    topStates,
    biomeDistribution,
    fireHotspots,
  };
};

export const fetchStateDashboard = async (
  stateCode: string,
  granularity: DataGranularity,
  yearRange?: [number, number]
): Promise<StateDashboardPayload> => {
  const [fires, riskRows, regions] = await Promise.all([
    fetchAllFires(),
    fetchAllRisk(),
    fetchRegions(),
  ]);

  const filteredFires = fires.filter((item) => inYearRange(item.ano_mes, yearRange));
  const filteredRiskRows = riskRows.filter((item) => {
    const anoMes = parseAnoMesFromName(item.regiao_nome);
    return anoMes ? inYearRange(anoMes, yearRange) : false;
  });
  const filteredRegions = regions.filter((item) => {
    const anoMes = parseAnoMesFromName(item.nome);
    return anoMes ? inYearRange(anoMes, yearRange) : false;
  });

  const stateNameUpper = stateCodeToName[stateCode] || stateCode;
  const stateNameNormalized = normalize(stateNameUpper);

  const stateFires = filteredFires.filter((item) => normalize(item.estado) === stateNameNormalized);
  const stateRiskRows = filteredRiskRows.filter(
    (item) => normalize(parseStateFromRegionName(item.regiao_nome)) === stateNameNormalized
  );

  const stateRegions = filteredRegions.filter(
    (region) => normalize(parseStateFromRegionName(region.nome)) === stateNameNormalized
  );

  const focosCalor = stateFires.reduce((sum, cur) => sum + cur.quantidade_focos, 0);
  const areaQueimada = stateFires.reduce((sum, cur) => sum + estimateAreaByFires(cur.quantidade_focos), 0);

  const avgRisk =
    stateRiskRows.length > 0
      ? Number(
          (
            stateRiskRows.reduce((sum, cur) => sum + cur.score, 0) /
            stateRiskRows.length
          ).toFixed(1)
        )
      : 55;

  const temperature =
    stateRegions.length > 0
      ? Number(
          (
            stateRegions.reduce((sum, cur) => sum + cur.temperatura, 0) /
            stateRegions.length
          ).toFixed(1)
        )
      : 30;
  const humidity =
    stateRegions.length > 0
      ? Number(
          (
            stateRegions.reduce((sum, cur) => sum + cur.umidade, 0) / stateRegions.length
          ).toFixed(1)
        )
      : 40;
  const precipitation =
    stateRegions.length > 0
      ? Number(
          (
            stateRegions.reduce((sum, cur) => sum + cur.precipitacao, 0) /
            stateRegions.length
          ).toFixed(0)
        )
      : 800;
  const wind =
    stateRegions.length > 0
      ? Number(
          (
            stateRegions.reduce((sum, cur) => sum + cur.vento, 0) / stateRegions.length
          ).toFixed(1)
        )
      : 12;

  const groupedByPeriod = new Map<string, { focos: number; scoreAcc: number; count: number }>();
  stateFires.forEach((item) => {
    const key = granularity === 'anual' ? item.ano_mes.slice(0, 4) : item.ano_mes;
    const current = groupedByPeriod.get(key) || { focos: 0, scoreAcc: 0, count: 0 };
    current.focos += item.quantidade_focos;
    current.scoreAcc += item.score;
    current.count += 1;
    groupedByPeriod.set(key, current);
  });

  const historicalData = Array.from(groupedByPeriod.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, values]) => ({
      periodo: formatAnoMes(key, granularity),
      score: Number((values.scoreAcc / Math.max(values.count, 1)).toFixed(1)),
    }));

  const seasonalityData = Array.from(groupedByPeriod.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, values]) => {
      if (granularity === 'diario') {
        return { periodo: formatAnoMes(key, granularity), area: estimateAreaByFires(values.focos) };
      }
      const label = formatAnoMes(key, granularity);
      return { mes: label, area: estimateAreaByFires(values.focos) };
    });

  const municipios = stateFires
    .reduce((acc, item) => {
      const existing = acc.get(item.municipio) || { areaQueimada: 0, scoreAcc: 0, count: 0 };
      existing.areaQueimada += estimateAreaByFires(item.quantidade_focos);
      existing.scoreAcc += item.score;
      existing.count += 1;
      acc.set(item.municipio, existing);
      return acc;
    }, new Map<string, { areaQueimada: number; scoreAcc: number; count: number }>())
    .entries();

  const municipiosRows = Array.from(municipios)
    .map(([nome, values]) => ({
      nome,
      areaQueimada: values.areaQueimada,
      risco: Number((values.scoreAcc / Math.max(values.count, 1)).toFixed(1)),
      bioma: 'Cerrado',
    }))
    .sort((a, b) => b.risco - a.risco)
    .slice(0, 10);

  const availableStates = Array.from(
    new Set(filteredFires.map((item) => normalize(item.estado)))
  )
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

  return {
    nome:
      stateNameUpper
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()) || stateCode,
    sigla: stateCode,
    bioma: 'Cerrado',
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
