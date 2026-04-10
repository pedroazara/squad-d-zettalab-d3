import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FilterSidebar, { FilterPayload } from '@/components/FilterSidebar';
import { MockBrazilMap } from '@/components/Map';
import { exportMockCsv, exportMockPdf } from '@/lib/exportUtils';
import {
  getHistoricalData,
  getTopStates,
  getBiomeDistribution,
  getFireHotspots,
} from '@/services/mockData';

const defaultNationalFilters: FilterPayload = {
  yearRange: [2019, 2025],
  selectedBiomas: [],
  selectedStates: [],
  selectedState: '',
  selectedRisks: [],
};

const biomaIdToNome: Record<string, string> = {
  cerrado: 'Cerrado',
  amazonia: 'Amazônia',
  caatinga: 'Caatinga',
  atlantica: 'Mata Atlântica',
  pampa: 'Pampa',
  pantanal: 'Pantanal',
};

const getRiskBucket = (risco: number) => {
  if (risco < 30) return 'low';
  if (risco < 55) return 'moderate';
  if (risco < 75) return 'high';
  return 'critical';
};

const applyBiomeGranularityProfile = (
  biomeData: Array<{ nome: string; percentual: number; cor: string }>,
  granularity: 'anual' | 'mensal' | 'diario'
) => {
  if (granularity === 'anual') {
    return biomeData;
  }

  const monthlyFactors: Record<string, number> = {
    Cerrado: 1.06,
    'Amazônia': 0.97,
    Caatinga: 1.03,
    'Mata Atlântica': 0.96,
    Pantanal: 0.95,
    Pampa: 1.08,
  };

  const dailyFactors: Record<string, number> = {
    Cerrado: 1.12,
    'Amazônia': 0.92,
    Caatinga: 1.05,
    'Mata Atlântica': 0.9,
    Pantanal: 0.88,
    Pampa: 1.14,
  };

  const factors = granularity === 'mensal' ? monthlyFactors : dailyFactors;
  const weighted = biomeData.map((item) => ({
    ...item,
    weighted: item.percentual * (factors[item.nome] || 1),
  }));
  const totalWeighted = weighted.reduce((acc, item) => acc + item.weighted, 0);

  return weighted.map((item) => ({
    nome: item.nome,
    cor: item.cor,
    percentual: Number(((item.weighted / totalWeighted) * 100).toFixed(1)),
  }));
};

const parseInitialNationalState = (): {
  filters: FilterPayload;
  granularity: 'anual' | 'mensal' | 'diario';
} => {
  if (typeof window === 'undefined') {
    return { filters: defaultNationalFilters, granularity: 'anual' };
  }

  const params = new URLSearchParams(window.location.search);
  const selectedStates = params.get('estados')?.split(',').filter(Boolean) || [];
  const selectedBiomas = params.get('biomas')?.split(',').filter(Boolean) || [];
  const selectedRisks = params.get('risks')?.split(',').filter(Boolean) || [];
  const fromYear = Number(params.get('fromYear'));
  const toYear = Number(params.get('toYear'));
  const granularityParam = params.get('granularity');

  const filters: FilterPayload = {
    yearRange:
      Number.isFinite(fromYear) && Number.isFinite(toYear)
        ? [fromYear, toYear]
        : defaultNationalFilters.yearRange,
    selectedBiomas,
    selectedStates,
    selectedState: selectedStates[0] || '',
    selectedRisks,
  };

  const granularity =
    granularityParam === 'mensal' || granularityParam === 'diario' || granularityParam === 'anual'
      ? granularityParam
      : 'anual';

  return { filters, granularity };
};

export default function DashboardNacional() {
  const initialState = useMemo(() => parseInitialNationalState(), []);
  const [granularity, setGranularity] = useState<'anual' | 'mensal' | 'diario'>(initialState.granularity);
  const [appliedFilters, setAppliedFilters] = useState<FilterPayload>(initialState.filters);
  const historicalData = getHistoricalData(granularity);
  const topStates = getTopStates();
  const baseBiomeData = getBiomeDistribution();
  const fireHotspots = getFireHotspots();

  const filteredTopStates = useMemo(() => {
    const selectedBiomaNames = appliedFilters.selectedBiomas
      .map((id) => biomaIdToNome[id])
      .filter(Boolean);

    return topStates.filter((state) => {
      const stateMatch =
        appliedFilters.selectedStates.length === 0 ||
        appliedFilters.selectedStates.includes(state.nome);
      const biomeMatch =
        selectedBiomaNames.length === 0 || selectedBiomaNames.includes(state.bioma);
      const riskMatch =
        appliedFilters.selectedRisks.length === 0 ||
        appliedFilters.selectedRisks.includes(getRiskBucket(state.risco));
      return stateMatch && biomeMatch && riskMatch;
    });
  }, [topStates, appliedFilters]);

  const filteredFireHotspots = useMemo(() => {
    if (appliedFilters.selectedStates.length === 0) {
      return fireHotspots;
    }
    return fireHotspots.filter((hotspot) => appliedFilters.selectedStates.includes(hotspot.name));
  }, [fireHotspots, appliedFilters.selectedStates]);

  const effectiveBiomeData = useMemo(() => {
    const applyProfile = (input: Array<{ nome: string; percentual: number; cor: string }>) =>
      applyBiomeGranularityProfile(input, granularity);

    if (filteredTopStates.length === 0) {
      return applyProfile(baseBiomeData);
    }

    const colorByBiome = new Map(baseBiomeData.map((item) => [item.nome, item.cor]));
    const totalArea = filteredTopStates.reduce((acc, state) => acc + state.areaQueimada, 0);
    const areaByBiome = filteredTopStates.reduce<Record<string, number>>((acc, state) => {
      acc[state.bioma] = (acc[state.bioma] || 0) + state.areaQueimada;
      return acc;
    }, {});

    const biomeDistribution = Object.entries(areaByBiome).map(([nome, area]) => ({
      nome,
      percentual: Number(((area / totalArea) * 100).toFixed(1)),
      cor: colorByBiome.get(nome) || '#5BC0DE',
    }));

    return applyProfile(biomeDistribution);
  }, [filteredTopStates, baseBiomeData, granularity]);

  const totalAreaQueimadaMha =
    filteredTopStates.length > 0
      ? Number((filteredTopStates.reduce((acc, item) => acc + item.areaQueimada, 0) / 1000000).toFixed(2))
      : 3.2;

  const biomeAbsoluteAreaData = effectiveBiomeData.map((item) => ({
    ...item,
    areaMha: Number(((item.percentual / 100) * totalAreaQueimadaMha).toFixed(2)),
  }));

  const statesComparisonData = filteredTopStates.slice(0, 6).map((state) => ({
    estado: state.sigla,
    risco: state.risco,
    focosCalor: state.focosCalor,
  }));

  const kpis = useMemo(() => {
    if (filteredTopStates.length === 0) {
      return [
        { label: 'Área Queimada Total', value: '0.00M ha', variation: 'Sem dados para o recorte', variationPercent: 0, color: 'danger' as const },
        { label: 'Focos de Calor', value: '0', variation: 'Sem dados para o recorte', variationPercent: 0, color: 'warning' as const },
        { label: 'Estado Mais Afetado', value: '-', variation: 'Sem dados para o recorte', variationPercent: 0, color: 'danger' as const },
        { label: 'Bioma Mais Afetado', value: '-', variation: 'Sem dados para o recorte', variationPercent: 0, color: 'warning' as const },
      ];
    }

    const areaTotal = filteredTopStates.reduce((acc, state) => acc + state.areaQueimada, 0);
    const focosTotal = filteredTopStates.reduce((acc, state) => acc + state.focosCalor, 0);
    const maisCritico = [...filteredTopStates].sort((a, b) => b.risco - a.risco)[0];
    const biomaArea = filteredTopStates.reduce<Record<string, number>>((acc, state) => {
      acc[state.bioma] = (acc[state.bioma] || 0) + state.areaQueimada;
      return acc;
    }, {});
    const [biomaMaisAfetado, areaBiomaMaisAfetado] = Object.entries(biomaArea).sort((a, b) => b[1] - a[1])[0];
    const percentualBioma = Number(((areaBiomaMaisAfetado / areaTotal) * 100).toFixed(1));

    return [
      {
        label: 'Área Queimada Total',
        value: `${(areaTotal / 1000000).toFixed(2)}M ha`,
        variation: `${filteredTopStates.length} estado(s) no recorte`,
        variationPercent: 0,
        color: 'danger' as const,
      },
      {
        label: 'Focos de Calor',
        value: focosTotal.toLocaleString('pt-BR'),
        variation: 'Total no recorte aplicado',
        variationPercent: 0,
        color: 'warning' as const,
      },
      {
        label: 'Estado Mais Afetado',
        value: maisCritico.nome,
        variation: `Score de risco: ${maisCritico.risco}`,
        variationPercent: 0,
        color: 'danger' as const,
      },
      {
        label: 'Bioma Mais Afetado',
        value: biomaMaisAfetado,
        variation: `${percentualBioma}% da área do recorte`,
        variationPercent: 0,
        color: 'warning' as const,
      },
    ];
  }, [filteredTopStates]);

  useEffect(() => {
    const params = new URLSearchParams();
    const [fromYear, toYear] = appliedFilters.yearRange;

    if (fromYear !== defaultNationalFilters.yearRange[0] || toYear !== defaultNationalFilters.yearRange[1]) {
      params.set('fromYear', String(fromYear));
      params.set('toYear', String(toYear));
    }
    if (appliedFilters.selectedBiomas.length > 0) {
      params.set('biomas', appliedFilters.selectedBiomas.join(','));
    }
    if (appliedFilters.selectedStates.length > 0) {
      params.set('estados', appliedFilters.selectedStates.join(','));
    }
    if (appliedFilters.selectedRisks.length > 0) {
      params.set('risks', appliedFilters.selectedRisks.join(','));
    }
    if (granularity !== 'anual') {
      params.set('granularity', granularity);
    }

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  }, [appliedFilters, granularity]);

  const handleExportPdf = (filters: FilterPayload) => {
    exportMockPdf('Painel Nacional', filters);
  };

  const handleExportCsv = (filters: FilterPayload) => {
    exportMockCsv('Painel Nacional', filters);
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
          multiStateSelection
          initialFilters={appliedFilters}
          onApplyFilters={(filters) => setAppliedFilters(filters)}
          onClearFilters={() => setAppliedFilters(defaultNationalFilters)}
          onExportPdf={handleExportPdf}
          onExportCsv={handleExportCsv}
        />

        <main className="flex-1 p-8">
          {/* Page Title */}
          <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-2">
            Painel Nacional de Queimadas
          </h1>
          <p className="text-guarawatch-muted mb-8">
            Visão consolidada do risco de queimadas em todo o Brasil
          </p>

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

          {/* KPI Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-6 shadow-sm border-l-4"
                style={{
                  borderLeftColor:
                    kpi.color === 'danger'
                      ? '#D9534F'
                      : '#F0AD4E',
                }}
              >
                <p className="text-sm text-guarawatch-muted mb-2">{kpi.label}</p>
                <p className="font-mono text-2xl font-bold text-guarawatch-text mb-2">
                  {kpi.value}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  {kpi.variationPercent > 0 ? (
                    <TrendingUp size={16} className="text-red-500" />
                  ) : (
                    <TrendingDown size={16} className="text-green-500" />
                  )}
                  <span
                    className={
                      kpi.variationPercent > 0 ? 'text-red-500' : 'text-green-500'
                    }
                  >
                    {kpi.variation}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Historical Data Chart */}
            <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
                {granularity === 'anual'
                  ? 'Evolução da Área Queimada (Brasil) - Anual'
                  : granularity === 'mensal'
                    ? 'Evolução da Área Queimada (Brasil) - Mensal'
                    : 'Evolução da Área Queimada (Brasil) - Últimos 30 dias'}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" interval={granularity === 'diario' ? 4 : 0} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="areaQueimada"
                    stroke="#D9534F"
                    name="Área Queimada (M ha)"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="focosCalor"
                    stroke="#F0AD4E"
                    name="Focos de Calor"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Biome Distribution */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
                Distribuição por Bioma
              </h2>
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie
                    data={effectiveBiomeData}
                    cx="50%"
                    cy="42%"
                    labelLine={false}
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="percentual"
                    nameKey="nome"
                  >
                    {effectiveBiomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    formatter={(value, _entry, index) => {
                      const item = effectiveBiomeData[index];
                      return `${value} ${item?.percentual ?? ''}%`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fire Map */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Mapa Nacional de Incêndios (mockado)
            </h2>
            <p className="text-sm text-guarawatch-muted mb-4">
              Visualização mockada dos focos de calor no Brasil, sem sobreposição de outros painéis.
            </p>
            <div className="h-[420px] w-full rounded-3xl overflow-hidden border border-gray-200">
              <MockBrazilMap showFire fireHotspots={filteredFireHotspots} highlight={null} />
            </div>
          </div>

          {/* Additional Dashboards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
                Relação entre Risco e Focos de Calor (Top 6 estados)
              </h2>
              <p className="text-sm text-guarawatch-muted mb-4">
                Comparativo rápido para identificar estados com alta combinação de risco e atividade térmica.
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statesComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="estado" />
                  <YAxis yAxisId="left" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="risco" fill="#D9534F" name="Score de risco" />
                  <Bar yAxisId="right" dataKey="focosCalor" fill="#F0AD4E" name="Focos de calor" />
                </BarChart>
              </ResponsiveContainer>
              {statesComparisonData.length === 0 && (
                <p className="text-sm text-guarawatch-muted mt-3">
                  Nenhum estado do recorte atual está presente no ranking nacional.
                </p>
              )}
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
                Área Queimada Estimada por Bioma (M ha)
              </h2>
              <p className="text-sm text-guarawatch-muted mb-4">
                Estimativa absoluta baseada na distribuição percentual dos biomas sobre 3.2 milhões de hectares.
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={biomeAbsoluteAreaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="areaMha" fill="#2E6B3E" name="Área estimada (M ha)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top States Table */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Top 10 Estados por Risco
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-guarawatch-primary">
                  <tr>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Posição
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Estado
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Bioma
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Score de Risco
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Área Queimada
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Variação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTopStates.map((state, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 hover:bg-guarawatch-bg transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-guarawatch-text">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                        {state.nome}
                      </td>
                      <td className="py-3 px-4 text-guarawatch-muted">{state.bioma}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeClass(
                            state.risco
                          )}`}
                        >
                          {state.risco}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-guarawatch-text">
                        {(state.areaQueimada / 1000000).toFixed(2)}M ha
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {state.variacao > 0 ? (
                            <TrendingUp size={16} className="text-red-500" />
                          ) : (
                            <TrendingDown size={16} className="text-green-500" />
                          )}
                          <span
                            className={
                              state.variacao > 0 ? 'text-red-500' : 'text-green-500'
                            }
                          >
                            {state.variacao > 0 ? '+' : ''}{state.variacao}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTopStates.length === 0 && (
              <p className="text-sm text-guarawatch-muted mt-3">
                Nenhum estado encontrado para os filtros aplicados.
              </p>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
