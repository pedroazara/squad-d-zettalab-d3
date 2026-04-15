export type BackendRole = 'brigadista' | 'fazendeiro' | 'coordenacao' | 'administrador';

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
}

export interface StateDashboardPayload {
  nome: string;
  sigla: string;
  bioma: string;
  risco: number;
  areaQueimada: number;
  focosCalor: number;
  temperatura: number;
  umidade: number;
  precipitacao: number;
  vento: number;
  municipios: StateMunicipalityRow[];
  seasonalityData: Array<{ mes?: string; periodo?: string; area: number }>;
  historicalData: Array<{ periodo: string; score: number }>;
  availableStates: Array<{ sigla: string; nome: string }>;
}
