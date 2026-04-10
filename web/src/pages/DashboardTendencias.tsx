import { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
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
import { getTrendData, getBiomeTrendData, getHeatmapData, getAllStates } from '@/services/mockData';
import { exportMockCsv, exportMockPdf } from '@/lib/exportUtils';

export default function DashboardTendencias() {
  const [granularity, setGranularity] = useState<'anual' | 'mensal' | 'diario'>('anual');
  const trendData = getTrendData(granularity);
  const biomeTrendData = getBiomeTrendData(granularity);
  const heatmapData = getHeatmapData(granularity);
  const allStates = getAllStates();

  // Trend by state
  const stateTrendData = allStates.map((state) => ({
    sigla: state.sigla,
    nome: state.nome,
    atual: state.risco,
    anterior: state.risco - state.variacao,
    variacao: state.variacao,
  }));

  const getHeatmapColor = (intensity: number) => {
    if (intensity < 25) return '#A8D5A2';
    if (intensity < 50) return '#F5E642';
    if (intensity < 75) return '#F0AD4E';
    return '#D9534F';
  };

  const handleExportPdf = (filters: FilterPayload) => {
    exportMockPdf('Painel Tendencias', filters);
  };

  const handleExportCsv = (filters: FilterPayload) => {
    exportMockCsv('Painel Tendencias', filters);
  };

  return (
    <div className="min-h-screen bg-guarawatch-bg">
      <Navbar />

      <div className="flex">
        <FilterSidebar onExportPdf={handleExportPdf} onExportCsv={handleExportCsv} />

        <main className="flex-1 p-8">
          {/* Page Header */}
          <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-2">
            Análise de Tendências e Padrões Históricos
          </h1>
          <p className="text-guarawatch-muted mb-8">
            Comparação histórica e identificação de tendências de risco ao longo do tempo
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

          {/* Trend Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
                {granularity === 'anual'
                  ? 'Evolução do Índice de Risco Nacional (2019-2025)'
                  : granularity === 'mensal'
                    ? 'Evolução do Índice de Risco Nacional (12 meses)'
                    : 'Evolução do Índice de Risco Nacional (últimos 30 dias)'}
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
                <XAxis dataKey="periodo" interval={granularity === 'diario' ? 4 : 0} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="min"
                  fill="#CCCCCC"
                  stroke="none"
                  fillOpacity={0.2}
                  name="Mínimo Histórico"
                />
                <Area
                  type="monotone"
                  dataKey="max"
                  fill="#D9534F"
                  stroke="none"
                  fillOpacity={0.2}
                  name="Máximo Histórico"
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#D9534F"
                  strokeWidth={3}
                  name="Score Médio"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Biome Trends */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Tendência de Risco por Bioma
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={biomeTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" interval={granularity === 'diario' ? 2 : 0} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Cerrado"
                  stroke="#F0AD4E"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Amazônia"
                  stroke="#5CB85C"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Caatinga"
                  stroke="#D4A520"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Mata Atlântica"
                  stroke="#7CB342"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Pantanal"
                  stroke="#00BCD4"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Pampa"
                  stroke="#5BC0DE"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Heatmap */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              {granularity === 'anual'
                ? 'Padrão Sazonal por Ano (Heatmap)'
                : granularity === 'mensal'
                  ? 'Intensidade mensal de queimadas (últimos 12 meses)'
                  : 'Intensidade diária de queimadas (últimos 30 dias)'}
            </h2>
            {granularity === 'anual' ? (
              <div className="overflow-x-auto">
                <div className="inline-block">
                  <div className="flex gap-1 mb-2">
                    <div className="w-12" />
                    {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m) => (
                      <div key={m} className="w-8 text-center text-xs font-semibold text-guarawatch-text">
                        {m}
                      </div>
                    ))}
                  </div>
                  {[2019, 2020, 2021, 2022, 2023, 2024, 2025].map((year) => (
                    <div key={year} className="flex gap-1 mb-1">
                      <div className="w-12 text-xs font-semibold text-guarawatch-text flex items-center">
                        {year}
                      </div>
                      {(heatmapData as Array<{ year: number; month: string; intensity: number }>)
                        .filter((d) => d.year === year)
                        .map((d, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded flex items-center justify-center text-xs font-mono text-white"
                            style={{ backgroundColor: getHeatmapColor(d.intensity) }}
                            title={`${d.month} ${year}: ${d.intensity}`}
                          >
                            {d.intensity}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={heatmapData as Array<{ periodo: string; intensity: number }> }>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" interval={granularity === 'diario' ? 4 : 0} />
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

          {/* State Trends Table */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Tendência por Estado
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-guarawatch-primary">
                  <tr>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Estado
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Score Atual
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Score Anterior
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Variação
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Tendência
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stateTrendData.map((state, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 hover:bg-guarawatch-bg transition-colors"
                    >
                      <td className="py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                        {state.nome}
                      </td>
                      <td className="py-3 px-4 font-mono text-guarawatch-text">{state.atual}</td>
                      <td className="py-3 px-4 font-mono text-guarawatch-muted">{state.anterior}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-semibold ${
                            state.variacao > 0 ? 'text-red-500' : 'text-green-500'
                          }`}
                        >
                          {state.variacao > 0 ? '+' : ''}{state.variacao}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-lg">
                        {state.variacao > 0 ? '📈' : '📉'}
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
