import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FilterSidebar, { FilterPayload } from '@/components/FilterSidebar';
import { fetchStateDashboard } from '@/services/analyticsApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { exportCsvReport, exportPdfReport, type ExportScope } from '@/lib/exportUtils';
import { getAreaScale } from '@/lib/utils';
import { PaginatedCitiesTable } from '@/components/PaginatedCitiesTable';
import type { StateDashboardPayload } from '@/types/api';

const stateCodeToLabel: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const stateLabelToCode: Record<string, string> = Object.entries(stateCodeToLabel).reduce(
  (acc, [code, label]) => {
    acc[normalize(label)] = code;
    return acc;
  },
  {} as Record<string, string>
);

const getXAxisInterval = (length: number, granularity: 'anual' | 'mensal') => {
  if (granularity === 'anual') {
    return 0;
  }
  const maxTicks = 10;
  return Math.max(0, Math.ceil(length / maxTicks) - 1);
};

const monthlyTickFormatter = (value: string) => {
  const [month, year] = value.split('/');
  if (!month || !year) {
    return value;
  }
  return `${month}/${year.slice(-2)}`;
};

const buildEmptyStateData = (stateCode: string): StateDashboardPayload => ({
  nome: stateCodeToLabel[stateCode] || stateCode,
  sigla: stateCode,
  bioma: '-',
  risco: 0,
  areaQueimada: 0,
  focosCalor: 0,
  frpMedio: 0,
  municipiosAfetados: 0,
  mesesMonitorados: 0,
  ultimoPeriodo: '',
  cidadesAfetadas: [],
  municipios: [],
  seasonalityData: [],
  historicalData: [],
  availableStates: [],
});

export default function DashboardEstados() {
  const params = useParams<{ sigla?: string }>();
  const initialStateCode = params.sigla?.toUpperCase() || 'MT';
  const [appliedFilters, setAppliedFilters] = useState<FilterPayload>({
    yearRange: [2020, 2026],
    selectedBiomas: [],
    selectedStates: [stateCodeToLabel[initialStateCode] || 'Mato Grosso'],
    selectedState: stateCodeToLabel[initialStateCode] || 'Mato Grosso',
    selectedRisks: [],
  });
  const [granularity, setGranularity] = useState<'anual' | 'mensal'>('anual');
  const selectedStateCode =
    stateLabelToCode[normalize(appliedFilters.selectedState || '')] || initialStateCode;

  const [stateData, setStateData] = useState<StateDashboardPayload>(() => buildEmptyStateData(initialStateCode));
  const [seasonalityData, setSeasonalityData] = useState<Array<{ mes?: string; periodo?: string; area: number }>>([]);
  const [historicalData, setHistoricalData] = useState<Array<{ periodo: string; score: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const maxSeasonalityAreaHa = seasonalityData.reduce((max, entry) => Math.max(max, entry.area), 0);
  const seasonalityScale = getAreaScale(maxSeasonalityAreaHa);

  useEffect(() => {
    if (params.sigla) {
      const code = params.sigla.toUpperCase();
      setAppliedFilters((prev) => ({
        ...prev,
        selectedStates: [stateCodeToLabel[code] || prev.selectedStates[0] || 'Mato Grosso'],
        selectedState: stateCodeToLabel[code] || prev.selectedState || 'Mato Grosso',
      }));
    }
  }, [params.sigla]);

  useEffect(() => {
    const loadStateData = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetchStateDashboard(selectedStateCode, granularity, [
          appliedFilters.yearRange[0],
          appliedFilters.yearRange[1],
        ]);
        setStateData(response);
        setSeasonalityData(response.seasonalityData);
        setHistoricalData(response.historicalData);
      } catch (error) {
        setLoadError(getApiErrorMessage(error));
        setStateData(buildEmptyStateData(selectedStateCode));
        setSeasonalityData([]);
        setHistoricalData([]);
      } finally {
        setLoading(false);
      }
    };

    void loadStateData();
  }, [selectedStateCode, granularity, appliedFilters.yearRange]);

  const handleExportPdf = (filters: FilterPayload, scope: ExportScope) => {
    exportPdfReport({
      pageName: `Painel Estadual-${stateData.sigla}`,
      filters,
      scope,
      summaryLines: [
        `${stateData.focosCalor} foco(s) no recorte aplicado.`,
        `${stateData.municipiosAfetados} cidade(s) afetada(s).`,
        stateData.ultimoPeriodo ? `Último período com registro: ${stateData.ultimoPeriodo}.` : 'Sem período disponível.',
      ],
      rows: stateData.municipios.map((municipio) => ({
        cidade: municipio.nome,
        focos: municipio.focos,
        risco: municipio.risco,
        bioma: municipio.bioma,
        area_estimada_ha: municipio.areaQueimada,
      })),
    });
  };

  const handleExportCsv = (filters: FilterPayload, scope: ExportScope) => {
    exportCsvReport({
      pageName: `Painel Estadual-${stateData.sigla}`,
      filters,
      scope,
      summaryLines: [
        `${stateData.focosCalor} foco(s) no recorte aplicado.`,
        `${stateData.municipiosAfetados} cidade(s) afetada(s).`,
        stateData.ultimoPeriodo ? `Último período com registro: ${stateData.ultimoPeriodo}.` : 'Sem período disponível.',
      ],
      rows: stateData.municipios.map((municipio) => ({
        cidade: municipio.nome,
        focos: municipio.focos,
        risco: municipio.risco,
        bioma: municipio.bioma,
        area_estimada_ha: municipio.areaQueimada,
      })),
    });
  };

  const getRiskBadgeClass = (risco: number) => {
    if (risco < 30) return 'bg-green-100 text-green-800';
    if (risco < 55) return 'bg-yellow-100 text-yellow-800';
    if (risco < 75) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-guarawatch-bg">
      <Navbar />

      <div className="flex">
        <FilterSidebar
          availableStates={
            stateData.availableStates.length > 0
              ? stateData.availableStates.map((state) => state.nome)
              : [stateCodeToLabel[initialStateCode] || 'Mato Grosso']
          }
          recordCount={stateData.focosCalor}
          initialFilters={appliedFilters}
          onApplyFilters={(filters) => setAppliedFilters(filters)}
          onClearFilters={() =>
            setAppliedFilters({
              yearRange: [2020, 2026],
              selectedBiomas: [],
              selectedStates: [stateCodeToLabel[initialStateCode] || 'Mato Grosso'],
              selectedState: stateCodeToLabel[initialStateCode] || 'Mato Grosso',
              selectedRisks: [],
            })
          }
          onExportPdf={handleExportPdf}
          onExportCsv={handleExportCsv}
        />

        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-8">
            {loading && (
              <p className="text-sm text-guarawatch-muted mb-2">Carregando dados do backend...</p>
            )}
            {loadError && (
              <p className="text-sm text-amber-700 mb-2">
                Falha ao carregar backend ({loadError}).
              </p>
            )}
            <div className="flex items-center gap-4 mb-4">
              <div>
                <h1 className="font-display text-4xl font-bold text-guarawatch-primary">
                  {stateData.nome}
                </h1>
                <p className="text-guarawatch-muted">{stateData.sigla}</p>
              </div>
              <div className="ml-auto flex gap-4">
                <div className="text-right">
                  <p className="text-sm text-guarawatch-muted">Bioma Predominante</p>
                  <p className="font-heading font-semibold text-guarawatch-primary">
                    {stateData.bioma}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-guarawatch-muted">Nível de Risco</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiskBadgeClass(
                      stateData.risco
                    )}`}
                  >
                    {stateData.risco}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-8 bg-white rounded-lg p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <p className="text-sm text-guarawatch-muted">
                Estado selecionado pelos filtros laterais: <strong>{appliedFilters.selectedState || stateData.nome}</strong>
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-guarawatch-text">Granularidade:</span>
                <button
                  onClick={() => setGranularity('anual')}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    granularity === 'anual'
                      ? 'bg-guarawatch-primary text-white border-guarawatch-primary'
                      : 'bg-white text-guarawatch-primary border-guarawatch-primary'
                  }`}
                >
                  Anual
                </button>
                <button
                  onClick={() => setGranularity('mensal')}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    granularity === 'mensal'
                      ? 'bg-guarawatch-primary text-white border-guarawatch-primary'
                      : 'bg-white text-guarawatch-primary border-guarawatch-primary'
                  }`}
                >
                  Mensal
                </button>
              </div>
            </div>
          </div>

          {/* State Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-guarawatch-muted mb-1">Focos no período</p>
              <p className="font-mono text-2xl font-bold text-guarawatch-text">
                {stateData.focosCalor.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-guarawatch-muted mb-1">FRP médio</p>
              <p className="font-mono text-2xl font-bold text-guarawatch-text">
                {stateData.frpMedio}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-guarawatch-muted mb-1">Meses monitorados</p>
              <p className="font-mono text-2xl font-bold text-guarawatch-text">
                {stateData.mesesMonitorados.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Historical Trend */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
                {granularity === 'anual'
                  ? `Evolução do Risco (${selectedStateCode}) - Anual`
                  : `Evolução do Risco (${selectedStateCode}) - Mensal`}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D9534F" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#D9534F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="periodo"
                    interval={getXAxisInterval(historicalData.length, granularity)}
                    tickFormatter={granularity === 'mensal' ? monthlyTickFormatter : undefined}
                    minTickGap={36}
                    angle={granularity === 'mensal' ? -28 : 0}
                    textAnchor={granularity === 'mensal' ? 'end' : 'middle'}
                    height={granularity === 'mensal' ? 56 : undefined}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#D9534F"
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Seasonality */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
                {granularity === 'anual'
                  ? 'Sazonalidade das Queimadas (mensal)'
                  : 'Sazonalidade das Queimadas (mensal)'}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={seasonalityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mes"
                    interval={getXAxisInterval(seasonalityData.length, granularity)}
                    tickFormatter={granularity === 'mensal' ? monthlyTickFormatter : undefined}
                    minTickGap={36}
                    angle={granularity === 'mensal' ? -28 : 0}
                    textAnchor={granularity === 'mensal' ? 'end' : 'middle'}
                    height={granularity === 'mensal' ? 56 : undefined}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      typeof value === 'number'
                        ? (value / seasonalityScale.divisor).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
                        : String(value)
                    }
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'Área Queimada') {
                        return [`${(Number(value) / seasonalityScale.divisor).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${seasonalityScale.label}`, 'Área Queimada'];
                      }
                      return [String(value), String(name)];
                    }}
                  />
                  <Bar
                    dataKey="area"
                    fill="#F0AD4E"
                    name="Área Queimada"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* All Cities Table */}
          <PaginatedCitiesTable cities={stateData.municipios} loading={loading} />
        </main>
      </div>

      <Footer />
    </div>
  );
}
