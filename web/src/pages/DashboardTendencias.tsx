import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FilterSidebar, { FilterPayload } from '@/components/FilterSidebar';
import { exportCsvReport, exportPdfReport, type ExportScope } from '@/lib/exportUtils';
import { fetchTrendDashboard } from '@/services/analyticsApi';
import { getApiErrorMessage } from '@/services/apiClient';
import type {
  TrendBiomeRow,
  TrendHeatmapAnnualRow,
  TrendHeatmapSeriesRow,
  TrendSeriesRow,
  TrendStateRow,
} from '@/types/api';

const defaultFilters: FilterPayload = {
  yearRange: [2020, 2026],
  selectedBiomas: [],
  selectedStates: [],
  selectedState: '',
  selectedRisks: [],
};

const biomeColorMap: Record<string, string> = {
  Cerrado: '#F0AD4E',
  Amazonia: '#5CB85C',
  'Mata Atlantica': '#7CB342',
  Caatinga: '#D4A520',
  Pantanal: '#00BCD4',
  Pampa: '#5BC0DE',
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

const getHeatmapColor = (intensity: number) => {
  if (intensity < 25) return '#A8D5A2';
  if (intensity < 50) return '#F5E642';
  if (intensity < 75) return '#F0AD4E';
  return '#D9534F';
};

const getXAxisInterval = (length: number, granularity: 'anual' | 'mensal' | 'diario') => {
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

export default function DashboardTendencias() {
  const [granularity, setGranularity] = useState<'anual' | 'mensal' | 'diario'>('anual');
  const [appliedFilters, setAppliedFilters] = useState<FilterPayload>(defaultFilters);
  const [trendData, setTrendData] = useState<TrendSeriesRow[]>([]);
  const [biomeTrendData, setBiomeTrendData] = useState<TrendBiomeRow[]>([]);
  const [heatmapAnnualData, setHeatmapAnnualData] = useState<TrendHeatmapAnnualRow[]>([]);
  const [heatmapSeriesData, setHeatmapSeriesData] = useState<TrendHeatmapSeriesRow[]>([]);
  const [stateTrendData, setStateTrendData] = useState<TrendStateRow[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableBiomes, setAvailableBiomes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetchTrendDashboard(granularity, [
          appliedFilters.yearRange[0],
          appliedFilters.yearRange[1],
        ]);
        setTrendData(response.trendData);
        setBiomeTrendData(response.biomeTrendData);
        setHeatmapAnnualData(response.heatmapAnnualData);
        setHeatmapSeriesData(response.heatmapSeriesData);
        setStateTrendData(response.stateTrendData);
        setAvailableStates(response.availableStates.map((state) => state.nome));
        setAvailableBiomes(response.availableBiomes);
      } catch (error) {
        setLoadError(getApiErrorMessage(error));
        setTrendData([]);
        setBiomeTrendData([]);
        setHeatmapAnnualData([]);
        setHeatmapSeriesData([]);
        setStateTrendData([]);
        setAvailableStates([]);
        setAvailableBiomes([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [granularity, appliedFilters.yearRange]);

  const selectedBiomes = useMemo(
    () =>
      appliedFilters.selectedBiomas
        .map((biome) => biome.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
        .map((biome) => biome.charAt(0).toUpperCase() + biome.slice(1)),
    [appliedFilters.selectedBiomas]
  );

  const filteredStateTrendData = useMemo(() => {
    const selectedStates = new Set(appliedFilters.selectedStates.map((state) => normalizeText(state)));
    const selectedRisks = new Set(appliedFilters.selectedRisks);

    const getRiskBucket = (score: number) => {
      if (score < 30) return 'low';
      if (score < 55) return 'moderate';
      if (score < 75) return 'high';
      return 'critical';
    };

    return stateTrendData.filter((state) => {
      const stateMatch = selectedStates.size === 0 || selectedStates.has(normalizeText(state.nome));
      const riskMatch = selectedRisks.size === 0 || selectedRisks.has(getRiskBucket(state.atual));
      return stateMatch && riskMatch;
    });
  }, [appliedFilters.selectedRisks, appliedFilters.selectedStates, stateTrendData]);

  const filteredBiomeKeys = useMemo(() => {
    if (selectedBiomes.length === 0) {
      return availableBiomes;
    }
    const selected = new Set(selectedBiomes.map((biome) => normalizeText(biome)));
    return availableBiomes.filter((biome) => selected.has(normalizeText(biome)));
  }, [availableBiomes, selectedBiomes]);

  const handleExportPdf = (filters: FilterPayload, scope: ExportScope) => {
    const exportRows = scope === 'complete' ? stateTrendData : filteredStateTrendData;
    exportPdfReport({
      pageName: 'Painel Tendencias',
      filters,
      scope,
      summaryLines: [
        `${trendData.length} ponto(s) na série histórica principal.`,
        `${exportRows.length} estado(s) com tendência calculada no escopo.`,
      ],
      rows: exportRows.map((state) => ({
        estado: state.nome,
        sigla: state.sigla,
        score_atual: state.atual,
        score_anterior: state.anterior,
        variacao: state.variacao,
      })),
    });
  };

  const handleExportCsv = (filters: FilterPayload, scope: ExportScope) => {
    const exportRows = scope === 'complete' ? stateTrendData : filteredStateTrendData;
    exportCsvReport({
      pageName: 'Painel Tendencias',
      filters,
      scope,
      summaryLines: [
        `${trendData.length} ponto(s) na série histórica principal.`,
        `${exportRows.length} estado(s) com tendência calculada no escopo.`,
      ],
      rows: exportRows.map((state) => ({
        estado: state.nome,
        sigla: state.sigla,
        score_atual: state.atual,
        score_anterior: state.anterior,
        variacao: state.variacao,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-guarawatch-bg">
      <Navbar />

      <div className="flex">
        <FilterSidebar
          availableStates={availableStates}
          recordCount={trendData.length}
          initialFilters={appliedFilters}
          onApplyFilters={setAppliedFilters}
          onClearFilters={() => setAppliedFilters(defaultFilters)}
          onExportPdf={handleExportPdf}
          onExportCsv={handleExportCsv}
        />

        <main className="flex-1 p-8">
          <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-2">
            Análise de Tendências e Padrões Históricos
          </h1>
          <p className="text-guarawatch-muted mb-8">
            Evolução temporal construída a partir dos focos detalhados observados no recorte atual.
          </p>

          {loading && <p className="text-sm text-guarawatch-muted mb-4">Carregando dados reais...</p>}
          {loadError && <p className="text-sm text-amber-700 mb-4">Falha ao carregar backend ({loadError}).</p>}

          <div className="mb-6 flex items-center gap-3">
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
            <button
              onClick={() => setGranularity('diario')}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                granularity === 'diario'
                  ? 'bg-guarawatch-primary text-white border-guarawatch-primary'
                  : 'bg-white text-guarawatch-primary border-guarawatch-primary'
              }`}
            >
              Diário
            </button>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Série histórica do risco médio
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D9534F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D9534F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="periodo"
                  interval={getXAxisInterval(trendData.length, granularity)}
                  tickFormatter={granularity !== 'anual' ? monthlyTickFormatter : undefined}
                  minTickGap={36}
                  angle={granularity !== 'anual' ? -28 : 0}
                  textAnchor={granularity !== 'anual' ? 'end' : 'middle'}
                  height={granularity !== 'anual' ? 56 : undefined}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="min" fill="#CCCCCC" stroke="none" fillOpacity={0.2} name="Mínimo" />
                <Area type="monotone" dataKey="max" fill="#D9534F" stroke="none" fillOpacity={0.2} name="Máximo" />
                <Line type="monotone" dataKey="score" stroke="#D9534F" strokeWidth={3} name="Score médio" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Tendência de risco por bioma disponível
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={biomeTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="periodo"
                  interval={getXAxisInterval(biomeTrendData.length, granularity)}
                  tickFormatter={granularity !== 'anual' ? monthlyTickFormatter : undefined}
                  minTickGap={36}
                  angle={granularity !== 'anual' ? -28 : 0}
                  textAnchor={granularity !== 'anual' ? 'end' : 'middle'}
                  height={granularity !== 'anual' ? 56 : undefined}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {filteredBiomeKeys.map((biome) => (
                  <Line
                    key={biome}
                    type="monotone"
                    dataKey={biome}
                    stroke={biomeColorMap[biome] || '#64748b'}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              {granularity === 'anual'
                ? 'Padrão sazonal por ano'
                : granularity === 'mensal'
                  ? 'Intensidade mensal de focos'
                  : 'Intensidade diária dos últimos 30 dias observados'}
            </h2>
            {granularity === 'anual' ? (
              <div className="overflow-x-auto">
                <div className="inline-block">
                  <div className="flex gap-1 mb-2">
                    <div className="w-12" />
                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((month) => (
                      <div key={month} className="w-8 text-center text-xs font-semibold text-guarawatch-text">
                        {month}
                      </div>
                    ))}
                  </div>
                  {Array.from(new Set(heatmapAnnualData.map((row) => row.year)))
                    .sort((a, b) => a - b)
                    .map((year) => (
                      <div key={year} className="flex gap-1 mb-1">
                        <div className="w-12 text-xs font-semibold text-guarawatch-text flex items-center">
                          {year}
                        </div>
                        {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((month) => {
                          const item = heatmapAnnualData.find((row) => row.year === year && row.month === month);
                          const intensity = item?.intensity || 0;
                          return (
                            <div
                              key={`${year}-${month}`}
                              className="w-8 h-8 rounded flex items-center justify-center text-xs font-mono text-white"
                              style={{ backgroundColor: getHeatmapColor(intensity) }}
                              title={`${month}/${year}: ${intensity}`}
                            >
                              {intensity > 0 ? intensity : '-'}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={heatmapSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="periodo"
                    interval={getXAxisInterval(heatmapSeriesData.length, granularity)}
                    tickFormatter={monthlyTickFormatter}
                    minTickGap={36}
                    angle={-28}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="intensity"
                    name={granularity === 'mensal' ? 'Intensidade mensal' : 'Intensidade diária'}
                    fill="#F0AD4E"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Tendência por Estado
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-guarawatch-primary">
                  <tr>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">Estado</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">Score Atual</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">Score Anterior</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">Variação</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">Tendência</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStateTrendData.map((state) => (
                    <tr key={state.sigla} className="border-b border-gray-200 hover:bg-guarawatch-bg transition-colors">
                      <td className="py-3 px-4 font-heading font-semibold text-guarawatch-primary">{state.nome}</td>
                      <td className="py-3 px-4 font-mono text-guarawatch-text">{state.atual}</td>
                      <td className="py-3 px-4 font-mono text-guarawatch-muted">{state.anterior}</td>
                      <td className="py-3 px-4">
                        <span className={`font-mono font-semibold ${state.variacao > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {state.variacao > 0 ? '+' : ''}
                          {state.variacao}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-lg">{state.variacao > 0 ? '↑' : state.variacao < 0 ? '↓' : '→'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStateTrendData.length === 0 && (
              <p className="mt-3 text-sm text-guarawatch-muted">
                Nenhum estado disponível para o recorte atual.
              </p>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
