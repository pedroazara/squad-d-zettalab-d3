export type BackendRole = 'brigadista' | 'fazendeiro' | 'coordenacao';

export interface BackendUserPublic {
  id: number;
  name: string;
  email: string;
  organization: string;
  role: BackendRole;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: BackendUserPublic;
}

export interface UserCreatePayload {
  name: string;
  email: string;
  organization: string;
  role: BackendRole;
  password: string;
}

export interface UserLoginPayload {
  email: string;
  password: string;
}

export interface RegionSnapshot {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
  temperatura: number;
  umidade: number;
  vento: number;
  precipitacao: number;
  focos_calor: number;
}

export interface RiskForecastResponse {
  regiao_id: number;
  regiao_nome: string;
  score: number;
  risco: 'baixo' | 'medio' | 'alto';
  score_amanha: number;
  risco_amanha: 'baixo' | 'medio' | 'alto';
  tendencia: 'crescente' | 'estavel' | 'decrescente';
}

export interface FireMapItem {
  id: number;
  estado: string;
  municipio: string;
  ano_mes: string;
  quantidade_focos: number;
  risco_fogo_mediano: number;
  frp_mediano: number;
  score: number;
  risco: 'baixo' | 'medio' | 'alto';
}

export interface FirePointItem {
  id: number;
  data_hora: string;
  satelite: string;
  estado: string;
  municipio: string;
  bioma: string;
  risco_fogo: number;
  frp: number;
  latitude: number;
  longitude: number;
  ano_mes: string;
}

export interface FaunaOccurrenceItem {
  id: number;
  nome_cientifico: string;
  nome_popular: string;
  grupo: string;
  status_iucn: string;
  bioma: string;
  bioma_principal: string;
  habitat_afetado_pct: number;
  latitude: number;
  longitude: number;
  estado: string;
  ano: number;
  mes: number;
  ano_mes: string;
}

export interface FaunaFilterOptions {
  estados: string[];
  biomas: string[];
  grupos: string[];
  status_iucn: string[];
}

export interface FaunaTimelineItem {
  periodo: string;
  ocorrencias: number;
}

export interface FaunaGroupDistributionItem {
  grupo: string;
  ocorrencias: number;
  media_habitat_afetado: number;
}

export interface FaunaStateDistributionItem {
  regiao: string;
  ocorrencias: number;
}

export interface FaunaBiodiversitySummary {
  total_ocorrencias: number;
  total_especies: number;
  media_habitat_afetado: number;
  por_status_iucn: Record<string, number>;
}

export interface FaunaSpeciesItem {
  nome_cientifico: string;
  nome_popular: string;
  grupo: string;
  status: string;
  bioma: string;
  percentualAfetado: number;
  location: {
    lat: number;
    lng: number;
  };
}

export interface FireReportCreatePayload {
  location: string;
  description: string;
  phone: string;
  reporter_name?: string;
}

export interface FireReportResponse {
  id: number;
  location: string;
  description: string;
  phone: string;
  reporter_name: string | null;
  status: string;
  created_at: string;
}

export interface ApiErrorShape {
  detail?: string | Array<{ msg?: string }>;
  message?: string;
}

export interface SessionUser {
  id: number;
  fullName: string;
  email: string;
  organization: string;
  role: BackendRole;
}

export type DataGranularity = 'anual' | 'mensal' | 'diario';

export interface NationalStateRow {
  sigla: string;
  nome: string;
  bioma: string;
  risco: number;
  areaQueimada: number;
  focosCalor: number;
  variacao: number;
}

export interface NationalHistoricalRow {
  periodo: string;
  areaQueimada: number;
  focosCalor: number;
}

export interface BiomeDistributionRow {
  nome: string;
  percentual: number;
  cor: string;
}

export interface FireHotspotRow {
  name: string;
  lat: number;
  lng: number;
  intensity: number;
}

export interface NationalDashboardPayload {
  historicalData: NationalHistoricalRow[];
  topStates: NationalStateRow[];
  biomeDistribution: BiomeDistributionRow[];
  fireHotspots: FireHotspotRow[];
}

export interface StateMunicipalityRow {
  nome: string;
  areaQueimada: number;
  risco: number;
  bioma: string;
  focos: number;
}

export interface StateDashboardPayload {
  nome: string;
  sigla: string;
  bioma: string;
  risco: number;
  areaQueimada: number;
  focosCalor: number;
  frpMedio: number;
  municipiosAfetados: number;
  mesesMonitorados: number;
  ultimoPeriodo: string;
  cidadesAfetadas: Array<{ nome: string; focos: number }>;
  municipios: StateMunicipalityRow[];
  seasonalityData: Array<{ mes?: string; periodo?: string; area: number }>;
  historicalData: Array<{ periodo: string; score: number }>;
  availableStates: Array<{ sigla: string; nome: string }>;
}

export interface TrendSeriesRow {
  periodo: string;
  score: number;
  min: number;
  max: number;
}

export interface TrendBiomeRow {
  periodo: string;
  [biome: string]: string | number;
}

export interface TrendHeatmapAnnualRow {
  year: number;
  month: string;
  intensity: number;
}

export interface TrendHeatmapSeriesRow {
  periodo: string;
  intensity: number;
}

export interface TrendStateRow {
  sigla: string;
  nome: string;
  atual: number;
  anterior: number;
  variacao: number;
}

export interface TrendDashboardPayload {
  trendData: TrendSeriesRow[];
  biomeTrendData: TrendBiomeRow[];
  heatmapAnnualData: TrendHeatmapAnnualRow[];
  heatmapSeriesData: TrendHeatmapSeriesRow[];
  stateTrendData: TrendStateRow[];
  availableStates: Array<{ sigla: string; nome: string }>;
  availableBiomes: string[];
}
