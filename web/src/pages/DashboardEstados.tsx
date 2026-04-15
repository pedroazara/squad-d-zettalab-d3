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
import {
  getStateData,
  getStateHistoricalData,
  getStateFireDistribution,
} from '@/services/mockData';
import { exportMockCsv, exportMockPdf } from '@/lib/exportUtils';

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

export default function DashboardEstados() {
  const params = useParams<{ sigla?: string }>();
  const initialStateCode = params.sigla?.toUpperCase() || 'MT';
  const [appliedFilters, setAppliedFilters] = useState<FilterPayload>({
    yearRange: [2019, 2025],
    selectedBiomas: [],
    selectedStates: [stateCodeToLabel[initialStateCode] || 'Mato Grosso'],
    selectedState: stateCodeToLabel[initialStateCode] || 'Mato Grosso',
    selectedRisks: [],
  });
  const [granularity, setGranularity] = useState<'anual' | 'mensal'>('anual');
  const selectedStateCode =
    stateLabelToCode[normalize(appliedFilters.selectedState || '')] || initialStateCode;

  const [stateData, setStateData] = useState(() => getStateData(initialStateCode));
  const [seasonalityData, setSeasonalityData] = useState<Array<{ mes?: string; periodo?: string; area: number }>>(() =>
    getStateFireDistribution(initialStateCode, granularity)
  );
  const [historicalData, setHistoricalData] = useState(() =>
    getStateHistoricalData(initialStateCode, granularity)
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

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
        setSeasonalityData(
          response.seasonalityData.length > 0
            ? response.seasonalityData
            : getStateFireDistribution(selectedStateCode, granularity)
        );
        setHistoricalData(
          response.historicalData.length > 0
            ? response.historicalData
            : getStateHistoricalData(selectedStateCode, granularity)
        );
      } catch (error) {
        setLoadError(getApiErrorMessage(error));
        setStateData(getStateData(selectedStateCode));
        setSeasonalityData(getStateFireDistribution(selectedStateCode, granularity));
        setHistoricalData(getStateHistoricalData(selectedStateCode, granularity));
      } finally {
        setLoading(false);
      }
    };

    void loadStateData();
  }, [selectedStateCode, granularity, appliedFilters.yearRange]);

  const handleExportPdf = (filters: FilterPayload) => {
    exportMockPdf(`Painel Estadual-${stateData.sigla}`, filters);
  };

  const handleExportCsv = (filters: FilterPayload) => {
    exportMockCsv(`Painel Estadual-${stateData.sigla}`, filters);
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
          initialFilters={appliedFilters}
          onApplyFilters={(filters) => setAppliedFilters(filters)}
          onClearFilters={() =>
            setAppliedFilters((prev) => ({
              ...prev,
              yearRange: [2019, 2025],
              selectedBiomas: [],
              selectedStates: [stateCodeToLabel[initialStateCode] || 'Mato Grosso'],
              selectedState: stateCodeToLabel[initialStateCode] || 'Mato Grosso',
              selectedRisks: [],
            }))
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
                Falha ao carregar backend ({loadError}). Exibindo dados de contingência.
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

          {/* Climate Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-guarawatch-muted mb-1">Temperatura Média</p>
              <p className="font-mono text-2xl font-bold text-guarawatch-text">
                {stateData.temperatura}°C
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-guarawatch-muted mb-1">Umidade Relativa</p>
              <p className="font-mono text-2xl font-bold text-guarawatch-text">
                {stateData.umidade}%
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-guarawatch-muted mb-1">Precipitação Anual</p>
              <p className="font-mono text-2xl font-bold text-guarawatch-text">
                {stateData.precipitacao}mm
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-guarawatch-muted mb-1">Rajada Máxima</p>
              <p className="font-mono text-2xl font-bold text-guarawatch-text">
                {stateData.vento} km/h
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
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="area"
                    fill="#F0AD4E"
                    name="Área Queimada (ha)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Critical Municipalities */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Municípios Críticos
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-guarawatch-primary">
                  <tr>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Município
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Área Queimada
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Bioma
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Score de Risco
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stateData.municipios.map((municipio: any, idx: number) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 hover:bg-guarawatch-bg transition-colors"
                    >
                      <td className="py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                        {municipio.nome}
                      </td>
                      <td className="py-3 px-4 font-mono text-guarawatch-text">
                        {(municipio.areaQueimada / 1000).toFixed(0)}k ha
                      </td>
                      <td className="py-3 px-4 text-guarawatch-muted">{municipio.bioma}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeClass(
                            municipio.risco
                          )}`}
                        >
                          {municipio.risco}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
