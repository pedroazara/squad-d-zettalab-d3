import { useEffect, useMemo, useState } from 'react';
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
  fetchFaunaFilters,
  fetchFaunaGroupDistribution,
  fetchFaunaOccurrences,
  fetchFaunaStateDistribution,
  fetchFaunaTimeline,
  fetchFirePoints,
} from '@/services/analyticsApi';
import { getApiErrorMessage } from '@/services/apiClient';
import type { FaunaOccurrenceItem, FirePointItem } from '@/types/api';

type DashboardGranularity = 'anual' | 'mensal';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

const emptyOptions = {
  estados: [] as string[],
  biomas: [] as string[],
  grupos: [] as string[],
};

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const PAGE_SIZE = 1000;
const AMAZ_CERRADO_STATES = new Set([
  'ACRE',
  'AMAPA',
  'AMAZONAS',
  'BAHIA',
  'DISTRITO FEDERAL',
  'GOIAS',
  'MARANHAO',
  'MATO GROSSO',
  'MATO GROSSO DO SUL',
  'MINAS GERAIS',
  'PARA',
  'PARANA',
  'PIAUI',
  'RONDONIA',
  'RORAIMA',
  'SAO PAULO',
  'TOCANTINS',
]);

const isInAmazCerrado = (stateName: string) => AMAZ_CERRADO_STATES.has(normalize(stateName));

export default function DashboardOcorrencias() {
  const [estado, setEstado] = useState('Todos');
  const [bioma, setBioma] = useState('Todos');
  const [tipoAnimal, setTipoAnimal] = useState('Todos');
  const [raca, setRaca] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [granularity, setGranularity] = useState<DashboardGranularity>('anual');
  const [showFireLayer, setShowFireLayer] = useState(false);

  const [options, setOptions] = useState(emptyOptions);
  const [records, setRecords] = useState<FaunaOccurrenceItem[]>([]);
  const [timelineData, setTimelineData] = useState<Array<{ periodo: string; ocorrencias: number; individuos: number }>>([]);
  const [behaviorData, setBehaviorData] = useState<Array<{ comportamento: string; ocorrencias: number; mediaConfianca: number }>>([]);
  const [regionData, setRegionData] = useState<Array<{ regiao: string; ocorrencias: number }>>([]);
  const [firePoints, setFirePoints] = useState<FirePointItem[]>([]);
  const [loadingFauna, setLoadingFauna] = useState(false);
  const [loadingFire, setLoadingFire] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const payload = await fetchFaunaFilters();
        setOptions({
          estados: ensureArray<string>((payload as { estados?: unknown })?.estados),
          biomas: ensureArray<string>((payload as { biomas?: unknown })?.biomas),
          grupos: ensureArray<string>((payload as { grupos?: unknown })?.grupos),
        });
      } catch {
        setOptions(emptyOptions);
      }
    };

    void loadOptions();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoadingFauna(true);
      setLoadError('');
      try {
        const [occurrencesPayload, timelinePayload, groupPayload, statePayload] = await Promise.all([
          fetchFaunaOccurrences({
            estado: estado === 'Todos' ? undefined : estado,
            bioma: bioma === 'Todos' ? undefined : bioma,
            grupo: tipoAnimal === 'Todos' ? undefined : tipoAnimal,
            search: searchTerm || undefined,
            limit: 5000,
            offset: 0,
          }),
          fetchFaunaTimeline({
            granularity,
            estado: estado === 'Todos' ? undefined : estado,
            bioma: bioma === 'Todos' ? undefined : bioma,
            grupo: tipoAnimal === 'Todos' ? undefined : tipoAnimal,
          }),
          fetchFaunaGroupDistribution({
            estado: estado === 'Todos' ? undefined : estado,
            bioma: bioma === 'Todos' ? undefined : bioma,
          }),
          fetchFaunaStateDistribution({
            bioma: bioma === 'Todos' ? undefined : bioma,
            grupo: tipoAnimal === 'Todos' ? undefined : tipoAnimal,
          }),
        ]);

        const safeOccurrences = ensureArray<FaunaOccurrenceItem>(occurrencesPayload);
        const safeTimeline = ensureArray<{ periodo?: unknown; ocorrencias?: unknown }>(timelinePayload);
        const safeGroups = ensureArray<{ grupo?: unknown; ocorrencias?: unknown; media_habitat_afetado?: unknown }>(groupPayload);
        const safeStates = ensureArray<{ regiao?: unknown; ocorrencias?: unknown }>(statePayload);

        setRecords(safeOccurrences);
        setTimelineData(
          safeTimeline.map((item) => ({
            periodo: String(item.periodo ?? ''),
            ocorrencias: Number(item.ocorrencias ?? 0),
            individuos: Number(item.ocorrencias ?? 0),
          }))
        );
        setBehaviorData(
          safeGroups.map((item) => ({
            comportamento: String(item.grupo ?? ''),
            ocorrencias: Number(item.ocorrencias ?? 0),
            mediaConfianca: Number(item.media_habitat_afetado ?? 0),
          }))
        );
        setRegionData(
          safeStates.slice(0, 10).map((item) => ({
            regiao: String(item.regiao ?? ''),
            ocorrencias: Number(item.ocorrencias ?? 0),
          }))
        );
      } catch (error) {
        setLoadError(getApiErrorMessage(error));
        setRecords([]);
        setTimelineData([]);
        setBehaviorData([]);
        setRegionData([]);
      } finally {
        setLoadingFauna(false);
      }
    };

    void loadData();
  }, [estado, bioma, tipoAnimal, searchTerm, granularity]);

  useEffect(() => {
    const loadFirePoints = async () => {
      setLoadingFire(true);
      try {
        const all: FirePointItem[] = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const payload = await fetchFirePoints({ limit: PAGE_SIZE, offset });
          const page = ensureArray<FirePointItem>(payload);
          all.push(...page.filter((point) => isInAmazCerrado(point.estado)));
          hasMore = page.length === PAGE_SIZE;
          if (hasMore) {
            offset += PAGE_SIZE;
          }
        }

        setFirePoints(all);
      } catch {
        setFirePoints([]);
      } finally {
        setLoadingFire(false);
      }
    };

    void loadFirePoints();
  }, []);

  const fireMapPoints = useMemo(() => {
    return firePoints.map((point) => ({
      lat: point.latitude,
      lng: point.longitude,
      intensity: Math.max(10, Math.min(100, Math.round(point.risco_fogo))),
      label: `${point.municipio} - ${point.estado}`,
    }));
  }, [firePoints]);

  const racasDisponiveis = useMemo(() => {
    const set = new Set(records.map((record) => record.nome_cientifico));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (raca === 'Todos') {
      return records;
    }
    return records.filter((record) => record.nome_cientifico === raca);
  }, [records, raca]);

  const faunaMapPoints = useMemo(() => {
    return filteredRecords.map((record) => ({
      lat: record.latitude,
      lng: record.longitude,
      label: `${record.nome_popular} (${record.nome_cientifico})`,
    }));
  }, [filteredRecords]);

  const selectedRecord = filteredRecords[0] || null;

  const raceRanking = useMemo(() => {
    const grouped = filteredRecords.reduce<Record<string, { raca: string; ocorrencias: number; individuos: number }>>(
      (acc, record) => {
        const key = record.nome_cientifico;
        if (!acc[key]) {
          acc[key] = { raca: key, ocorrencias: 0, individuos: 0 };
        }
        acc[key].ocorrencias += 1;
        acc[key].individuos += 1;
        return acc;
      },
      {}
    );

    return Object.values(grouped)
      .sort((a, b) => b.ocorrencias - a.ocorrencias)
      .slice(0, 8);
  }, [filteredRecords]);

  const fireLayerMetrics = useMemo(() => {
    const fireByState = new Map<string, { sum: number; count: number }>();
    firePoints.forEach((point) => {
      const key = normalize(point.estado);
      const current = fireByState.get(key) || { sum: 0, count: 0 };
      current.sum += point.risco_fogo;
      current.count += 1;
      fireByState.set(key, current);
    });

    const byState = regionData.map((row) => {
      const stateFire = fireByState.get(normalize(row.regiao));
      const intensidadeFogo = stateFire ? stateFire.sum / Math.max(stateFire.count, 1) : 0;
      return {
        comportamento: row.regiao,
        intensidadeFogo: Number(intensidadeFogo.toFixed(1)),
        ocorrencias: row.ocorrencias,
      };
    });

    const proximasAoFogo = byState.filter((row) => row.intensidadeFogo >= 30).reduce((acc, row) => acc + row.ocorrencias, 0);
    const total = byState.reduce((acc, row) => acc + row.ocorrencias, 0);
    const riscoMedio = byState.length
      ? Number((byState.reduce((acc, row) => acc + row.intensidadeFogo, 0) / byState.length).toFixed(1))
      : 0;

    return {
      proximasAoFogo,
      percentualProximas: total ? Number(((proximasAoFogo / total) * 100).toFixed(1)) : 0,
      riscoMedio,
      correlation: byState,
    };
  }, [firePoints, regionData]);

  const totalIndividuals = filteredRecords.length;
  const avgHabitatAffected =
    filteredRecords.length > 0
      ? Number(
          (
            filteredRecords.reduce((acc, record) => acc + record.habitat_afetado_pct, 0) /
            filteredRecords.length
          ).toFixed(1)
        )
      : 0;

  return (
    <div className="min-h-screen bg-guarawatch-bg">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-2">
          Análise de Ocorrência da Fauna
        </h1>
        <p className="text-guarawatch-muted mb-8">
          Dados reais da base fauna_cerrado. Os gráficos refletem apenas as variáveis disponíveis no dataset.
        </p>

        {(loadingFauna || loadingFire) && <p className="text-sm text-guarawatch-muted mb-3">Carregando dados reais...</p>}
        {loadError && (
          <p className="text-sm text-amber-700 mb-3">
            Não foi possível carregar a API ({loadError}).
          </p>
        )}

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
              <option value="Todos">Todos os grupos</option>
              {options.grupos.map((item) => (
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
              <option value="Todos">Todas as espécies</option>
              {racasDisponiveis.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar espécie"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />

            <button
              onClick={() => setShowFireLayer((prev) => !prev)}
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
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-guarawatch-muted mb-1">Ocorrências filtradas</p>
            <p className="font-mono text-2xl font-bold text-guarawatch-text">{filteredRecords.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-guarawatch-muted mb-1">Pontos georreferenciados</p>
            <p className="font-mono text-2xl font-bold text-guarawatch-text">{totalIndividuals}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-guarawatch-muted mb-1">Habitat afetado médio</p>
            <p className="font-mono text-2xl font-bold text-guarawatch-text">{avgHabitatAffected}%</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-guarawatch-muted mb-1">Espécies no recorte</p>
            <p className="font-mono text-2xl font-bold text-guarawatch-text">{new Set(filteredRecords.map((r) => r.nome_cientifico)).size}</p>
          </div>
        </section>

        <section className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
            Mapa de ocorrência {showFireLayer ? 'com camada de queimadas' : 'sem camada de queimadas'}
          </h2>
          <div className="h-[420px] rounded-2xl overflow-hidden border border-gray-200">
            <MockBrazilMap
              showFire={showFireLayer}
              firePoints={showFireLayer ? fireMapPoints : []}
              faunaPoints={faunaMapPoints}
              highlight={
                selectedRecord
                  ? {
                      lat: selectedRecord.latitude,
                      lng: selectedRecord.longitude,
                      label: selectedRecord.nome_popular,
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
                <XAxis dataKey="periodo" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ocorrencias" stroke="#1A3D2B" strokeWidth={2} name="Ocorrências" />
                <Line type="monotone" dataKey="individuos" stroke="#5CB85C" strokeWidth={2} name="Pontos" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Distribuição por grupo taxonômico
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={behaviorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="comportamento" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ocorrencias" fill="#2E6B3E" name="Ocorrências" />
                <Bar dataKey="mediaConfianca" fill="#5BC0DE" name="Habitat afetado médio (%)" />
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
              Ranking por espécie (nome científico)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2">Espécie</th>
                    <th className="text-left py-2">Ocorrências</th>
                    <th className="text-left py-2">Pontos</th>
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
                <p className="text-xs text-guarawatch-muted">Ocorrências em estados de alta intensidade</p>
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
