import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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
import {
  getStateData,
  getStateHistoricalData,
  getStateFireDistribution,
  getTopStates,
} from '@/services/mockData';
import { exportMockCsv, exportMockPdf } from '@/lib/exportUtils';

export default function DashboardEstados() {
  const [selectedState, setSelectedState] = useState('MT');
  const [granularity, setGranularity] = useState<'anual' | 'mensal' | 'diario'>('anual');
  const stateData = getStateData(selectedState);
  const seasonalityData = getStateFireDistribution(selectedState, granularity);
  const historicalData = getStateHistoricalData(selectedState, granularity);
  const topStates = getTopStates();

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
        <FilterSidebar onExportPdf={handleExportPdf} onExportCsv={handleExportCsv} />

        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-8">
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

          {/* State Selector */}
          <div className="mb-8 bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-heading font-semibold text-guarawatch-text mb-2">
              Selecionar Estado
            </label>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-guarawatch-accent"
              >
                {topStates.map((state) => (
                  <option key={state.sigla} value={state.sigla}>
                    {state.nome} ({state.sigla})
                  </option>
                ))}
              </select>

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
                  ? `Evolução do Risco (${selectedState}) - Anual`
                  : granularity === 'mensal'
                    ? `Evolução do Risco (${selectedState}) - Mensal`
                    : `Evolução do Risco (${selectedState}) - Últimos 30 dias`}
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
                  <XAxis dataKey="periodo" interval={granularity === 'diario' ? 4 : 0} />
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
                  : granularity === 'mensal'
                    ? 'Sazonalidade das Queimadas (12 meses)'
                    : 'Queimadas nos últimos 30 dias'}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={seasonalityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={granularity === 'diario' ? 'periodo' : 'mes'} interval={granularity === 'diario' ? 4 : 0} />
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
