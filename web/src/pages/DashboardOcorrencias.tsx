import { useMemo, useState } from 'react';
import {
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
import { MockBrazilMap } from '@/components/Map';
import {
  DataGranularity,
  getFireHotspots,
  getOccurrenceBehaviorAnalysis,
  getOccurrenceFilterOptions,
  getOccurrenceFireLayerMetrics,
  getOccurrenceRacaRanking,
  getOccurrenceRecords,
  getOccurrenceRegionDistribution,
  getOccurrenceTimeline,
} from '@/services/mockData';

export default function DashboardOcorrencias() {
  const [estado, setEstado] = useState('Todos');
  const [bioma, setBioma] = useState('Todos');
  const [tipoAnimal, setTipoAnimal] = useState('Todos');
  const [raca, setRaca] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [granularity, setGranularity] = useState<DataGranularity>('anual');
  const [showFireLayer, setShowFireLayer] = useState(false);

  const options = getOccurrenceFilterOptions();
  const fireHotspots = getFireHotspots();

  const records = useMemo(
    () =>
      getOccurrenceRecords({
        estado,
        bioma,
        tipoAnimal,
        raca,
        searchTerm,
      }),
    [estado, bioma, tipoAnimal, raca, searchTerm]
  );

  const timelineData = useMemo(
    () => getOccurrenceTimeline(granularity, records),
    [granularity, records]
  );

  const behaviorData = useMemo(
    () => getOccurrenceBehaviorAnalysis(records),
    [records]
  );

  const regionData = useMemo(
    () => getOccurrenceRegionDistribution(records).slice(0, 8),
    [records]
  );

  const raceRanking = useMemo(
    () => getOccurrenceRacaRanking(records),
    [records]
  );

  const fireLayerMetrics = useMemo(
    () => getOccurrenceFireLayerMetrics(records),
    [records]
  );

  const selectedRecord = records[0] || null;
  const totalIndividuals = records.reduce((acc, record) => acc + record.individuos, 0);
  const avgConfidence =
    records.length > 0
      ? Number((records.reduce((acc, record) => acc + record.confianca, 0) / records.length).toFixed(1))
      : 0;

  return (
    <div className="min-h-screen bg-guarawatch-bg">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-2">
          Análise de Ocorrência da Fauna
        </h1>
        <p className="text-guarawatch-muted mb-8">
          Leitura comportamental independente das queimadas, com camada opcional para correlação com focos de calor.
        </p>

        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="Todos">Todos os estados</option>
              {options.estados.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={bioma}
              onChange={(e) => setBioma(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="Todos">Todos os biomas</option>
              {options.biomas.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={tipoAnimal}
              onChange={(e) => setTipoAnimal(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="Todos">Todos os tipos</option>
              {options.tipos.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={raca}
              onChange={(e) => setRaca(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="Todos">Todas as raças</option>
              {options.racas.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar espécie/comportamento"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />

            <button
              onClick={() =>
                setShowFireLayer((prev) => !prev)
              }
              className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                showFireLayer
                  ? 'bg-guarawatch-danger text-white border-guarawatch-danger'
                  : 'bg-white text-guarawatch-danger border-guarawatch-danger'
              }`}
            >
              {showFireLayer ? 'Camada de queimadas: ativa' : 'Adicionar camada de queimadas'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-sm font-semibold text-guarawatch-text">Granularidade:</span>
            <button
              onClick={() => setGranularity('anual')}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                granularity === 'anual'
                  ? 'bg-guarawatch-primary text-white border-guarawatch-primary'
                  : 'bg-white text-guarawatch-primary border-guarawatch-primary'
              }`}
            >
              Anual
            </button>
            <button
              onClick={() => setGranularity('mensal')}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                granularity === 'mensal'
                  ? 'bg-guarawatch-primary text-white border-guarawatch-primary'
                  : 'bg-white text-guarawatch-primary border-guarawatch-primary'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setGranularity('diario')}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                granularity === 'diario'
                  ? 'bg-guarawatch-primary text-white border-guarawatch-primary'
                  : 'bg-white text-guarawatch-primary border-guarawatch-primary'
              }`}
            >
              Diário
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-guarawatch-muted mb-1">Ocorrências filtradas</p>
            <p className="font-mono text-2xl font-bold text-guarawatch-text">{records.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-guarawatch-muted mb-1">Indivíduos observados</p>
            <p className="font-mono text-2xl font-bold text-guarawatch-text">{totalIndividuals}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-guarawatch-muted mb-1">Confiança média</p>
            <p className="font-mono text-2xl font-bold text-guarawatch-text">{avgConfidence}%</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-guarawatch-muted mb-1">Raças no recorte</p>
            <p className="font-mono text-2xl font-bold text-guarawatch-text">{new Set(records.map((r) => r.raca)).size}</p>
          </div>
        </section>

        <section className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
            Mapa de ocorrência {showFireLayer ? 'com camada de queimadas' : 'sem camada de queimadas'}
          </h2>
          <div className="h-[420px] rounded-2xl overflow-hidden border border-gray-200">
            <MockBrazilMap
              showFire={showFireLayer}
              fireHotspots={showFireLayer ? fireHotspots : []}
              highlight={
                selectedRecord
                  ? {
                      lat: selectedRecord.lat,
                      lng: selectedRecord.lng,
                      label: selectedRecord.especie,
                    }
                  : null
              }
            />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Tendência de ocorrências ({granularity})
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" interval={granularity === 'diario' ? 4 : 0} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ocorrencias" stroke="#1A3D2B" strokeWidth={2} name="Ocorrências" />
                <Line type="monotone" dataKey="individuos" stroke="#5CB85C" strokeWidth={2} name="Indivíduos" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Distribuição comportamental
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={behaviorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="comportamento" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ocorrencias" fill="#2E6B3E" name="Ocorrências" />
                <Bar dataKey="mediaConfianca" fill="#5BC0DE" name="Confiança média" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Ocorrências por estado
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="regiao" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ocorrencias" fill="#F0AD4E" name="Ocorrências" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Ranking por raça/subespécie
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2">Raça</th>
                    <th className="text-left py-2">Ocorrências</th>
                    <th className="text-left py-2">Indivíduos</th>
                  </tr>
                </thead>
                <tbody>
                  {raceRanking.map((row) => (
                    <tr key={row.raca} className="border-b border-gray-100">
                      <td className="py-2 text-guarawatch-text">{row.raca}</td>
                      <td className="py-2 font-mono">{row.ocorrencias}</td>
                      <td className="py-2 font-mono">{row.individuos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {showFireLayer && (
          <section className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Correlação adicional com queimadas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-guarawatch-muted">Ocorrências próximas de áreas críticas</p>
                <p className="font-mono text-2xl font-bold text-guarawatch-danger">{fireLayerMetrics.proximasAoFogo}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-guarawatch-muted">Percentual de proximidade</p>
                <p className="font-mono text-2xl font-bold text-guarawatch-danger">{fireLayerMetrics.percentualProximas}%</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-guarawatch-muted">Intensidade média do fogo</p>
                <p className="font-mono text-2xl font-bold text-guarawatch-danger">{fireLayerMetrics.riscoMedio}</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={fireLayerMetrics.correlation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="comportamento" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="intensidadeFogo" fill="#D9534F" name="Intensidade média do fogo" />
                <Bar dataKey="ocorrencias" fill="#5CB85C" name="Ocorrências" />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
