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
import { exportCsvReport, exportPdfReport, type ExportScope } from '@/lib/exportUtils';
import {
  fetchFaunaFilters,
  fetchFaunaGroupDistribution,
  fetchFaunaOccurrences,
  fetchFaunaStateDistribution,
  fetchFaunaTimeline,
  fetchAllFirePoints,
} from '@/services/analyticsApi';
import { getApiErrorMessage } from '@/services/apiClient';
import type { FaunaOccurrenceItem, FirePointItem } from '@/types/api';

type DashboardGranularity = 'anual' | 'mensal';

const emptyOptions = {
  estados: [] as string[],
  biomas: [] as string[],
  grupos: [] as string[],
};

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const PROXIMITY_RADIUS_KM = 20;
const CELL_SIZE_DEG = 0.25;

export default function DashboardOcorrencias() {
  const [estado, setEstado] = useState('Todos');
  const [bioma, setBioma] = useState('Todos');
  const [tipoAnimal, setTipoAnimal] = useState('Todos');
  const [raca, setRaca] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [granularity, setGranularity] = useState<DashboardGranularity>('anual');
  const [showFireLayer, setShowFireLayer] = useState(true);
  const [exportScope, setExportScope] = useState<ExportScope>('visible');

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
        // Use the optimized fetchAllFirePoints function
        const all = await fetchAllFirePoints();
        setFirePoints(all);
      } catch (error) {
        console.error('Error loading fire points:', error);
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
      intensity: Math.max(10, Math.min(100, Math.round(point.risco_fogo <= 1 ? point.risco_fogo * 100 : point.risco_fogo))),
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

  // Calculate distance between two coordinates in kilometers
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const proximityAnalysis = useMemo(() => {
  if (filteredRecords.length === 0 || firePoints.length === 0) {
    return {
      totalOccurrences: 0,
      occurrencesWithNearbyFires: 0,
      averageNearbyFires: 0,
      maxNearbyFires: 0,
      proximityData: [],
      summary: {
        lowRisk: 0,      // 0-2 nearby fires
        mediumRisk: 0,   // 3-5 nearby fires  
        highRisk: 0,     // 6-10 nearby fires
        criticalRisk: 0  // >10 nearby fires
      }
    };
  }

  const toGridKey = (lat: number, lng: number) =>
    `${Math.floor(lat / CELL_SIZE_DEG)}:${Math.floor(lng / CELL_SIZE_DEG)}`;
  const fireGrid = new Map<string, FirePointItem[]>();
  firePoints.forEach((point) => {
    const key = toGridKey(point.latitude, point.longitude);
    const bucket = fireGrid.get(key) || [];
    bucket.push(point);
    fireGrid.set(key, bucket);
  });

  const proximityData = filteredRecords.map(record => {
    const cellLat = Math.floor(record.latitude / CELL_SIZE_DEG);
    const cellLng = Math.floor(record.longitude / CELL_SIZE_DEG);
    const nearbyCandidates: FirePointItem[] = [];
    for (let latOffset = -1; latOffset <= 1; latOffset += 1) {
      for (let lngOffset = -1; lngOffset <= 1; lngOffset += 1) {
        const key = `${cellLat + latOffset}:${cellLng + lngOffset}`;
        const bucket = fireGrid.get(key);
        if (bucket) {
          nearbyCandidates.push(...bucket);
        }
      }
    }

    const nearbyFires = nearbyCandidates.filter(firePoint => {
      const distance = calculateDistance(
        record.latitude, 
        record.longitude, 
        firePoint.latitude, 
        firePoint.longitude
      );
      return distance <= PROXIMITY_RADIUS_KM;
    });

    return {
      occurrenceName: record.nome_popular || record.nome_cientifico,
      nearbyFiresCount: nearbyFires.length,
      averageFireRisk: nearbyFires.length > 0 
        ? nearbyFires.reduce((sum, fire) => sum + fire.risco_fogo, 0) / nearbyFires.length 
        : 0,
      location: { lat: record.latitude, lng: record.longitude }
    };
  });

  const totalOccurrences = proximityData.length;
  const occurrencesWithNearbyFires = proximityData.filter(d => d.nearbyFiresCount > 0).length;
  const nearbyFiresCounts = proximityData.map(d => d.nearbyFiresCount);
  const averageNearbyFires = nearbyFiresCounts.length > 0 
    ? nearbyFiresCounts.reduce((sum, count) => sum + count, 0) / nearbyFiresCounts.length 
    : 0;
  const maxNearbyFires = Math.max(...nearbyFiresCounts, 0);

  // Categorize by risk level based on nearby fire count
  const summary = proximityData.reduce((acc, data) => {
    if (data.nearbyFiresCount === 0) return acc;
    if (data.nearbyFiresCount <= 2) acc.lowRisk++;
    else if (data.nearbyFiresCount <= 5) acc.mediumRisk++;
    else if (data.nearbyFiresCount <= 10) acc.highRisk++;
    else acc.criticalRisk++;
    return acc;
  }, { lowRisk: 0, mediumRisk: 0, highRisk: 0, criticalRisk: 0 });

  return {
    totalOccurrences,
    occurrencesWithNearbyFires,
    averageNearbyFires: Number(averageNearbyFires.toFixed(1)),
    maxNearbyFires,
    proximityData: proximityData.slice(0, 10), // Top 10 for display
    summary
  };
}, [filteredRecords, firePoints]);

  const handleExportPdf = () => {
    const sourceRows = exportScope === 'complete' ? records : filteredRecords;
    exportPdfReport({
      pageName: 'Painel Ocorrencias',
      scope: exportScope,
      filters: {
        selectedState: estado === 'Todos' ? '' : estado,
        selectedBiomas: bioma === 'Todos' ? [] : [bioma],
        selectedRisks: [],
      },
      summaryLines: [
        `${sourceRows.length} ocorrência(s) exportada(s).`,
        `${showFireLayer ? firePoints.length : 0} foco(s) de incêndio considerados na visualização atual.`,
      ],
      rows: sourceRows.map((record) => ({
        nome_popular: record.nome_popular,
        nome_cientifico: record.nome_cientifico,
        grupo: record.grupo,
        estado: record.estado,
        bioma: record.bioma,
        habitat_afetado_pct: record.habitat_afetado_pct,
        latitude: record.latitude,
        longitude: record.longitude,
      })),
    });
  };

  const handleExportCsv = () => {
    const sourceRows = exportScope === 'complete' ? records : filteredRecords;
    exportCsvReport({
      pageName: 'Painel Ocorrencias',
      scope: exportScope,
      filters: {
        selectedState: estado === 'Todos' ? '' : estado,
        selectedBiomas: bioma === 'Todos' ? [] : [bioma],
        selectedRisks: [],
      },
      summaryLines: [
        `${sourceRows.length} ocorrência(s) exportada(s).`,
        `${showFireLayer ? firePoints.length : 0} foco(s) de incêndio considerados na visualização atual.`,
      ],
      rows: sourceRows.map((record) => ({
        nome_popular: record.nome_popular,
        nome_cientifico: record.nome_cientifico,
        grupo: record.grupo,
        estado: record.estado,
        bioma: record.bioma,
        habitat_afetado_pct: record.habitat_afetado_pct,
        latitude: record.latitude,
        longitude: record.longitude,
      })),
    });
  };

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

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={exportScope}
              onChange={(event) => setExportScope(event.target.value as ExportScope)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="visible">Exportar dados visíveis/filtrados</option>
              <option value="complete">Exportar dataset completo</option>
            </select>
            <button
              onClick={handleExportPdf}
              className="px-3 py-2 bg-guarawatch-secondary text-white rounded-lg text-sm font-semibold"
            >
              Baixar PDF
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 border border-guarawatch-secondary text-guarawatch-secondary rounded-lg text-sm font-semibold"
            >
              Baixar CSV
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
              Análise de Proximidade: Focos de Incêndio (Raio de {PROXIMITY_RADIUS_KM}km)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-guarawatch-muted">Ocorrências com focos próximos</p>
                <p className="font-mono text-2xl font-bold text-guarawatch-danger">{proximityAnalysis.occurrencesWithNearbyFires}</p>
                <p className="text-xs text-guarawatch-muted mt-1">de {proximityAnalysis.totalOccurrences}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-guarawatch-muted">Média de focos próximos</p>
                <p className="font-mono text-2xl font-bold text-guarawatch-warning">{proximityAnalysis.averageNearbyFires}</p>
                <p className="text-xs text-guarawatch-muted mt-1">focos por ocorrência</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-guarawatch-muted">Máximo de focos próximos</p>
                <p className="font-mono text-2xl font-bold text-guarawatch-danger">{proximityAnalysis.maxNearbyFires}</p>
                <p className="text-xs text-guarawatch-muted mt-1">focos em uma ocorrência</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-guarawatch-muted">Risco Crítico</p>
                <p className="font-mono text-2xl font-bold text-guarawatch-danger">{proximityAnalysis.summary.criticalRisk}</p>
                <p className="text-xs text-guarawatch-muted mt-1">ocorrências com {'>'}10 focos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Distribution Chart */}
              <div>
                <h3 className="text-md font-semibold text-guarawatch-primary mb-3">Distribuição de Risco por Proximidade</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Baixo (0-2)', value: proximityAnalysis.summary.lowRisk, fill: '#5CB85C' },
                    { name: 'Médio (3-5)', value: proximityAnalysis.summary.mediumRisk, fill: '#F0AD4E' },
                    { name: 'Alto (6-10)', value: proximityAnalysis.summary.highRisk, fill: '#F0AD4E' },
                    { name: 'Crítico (>10)', value: proximityAnalysis.summary.criticalRisk, fill: '#D9534F' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Ocorrências" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Occurrences Table */}
              <div>
                <h3 className="text-md font-semibold text-guarawatch-primary mb-3">Top 10 Ocorrências com Mais Focos Próximos</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2">Espécie</th>
                        <th className="text-left py-2">Focos Próximos</th>
                        <th className="text-left py-2">Risco Médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proximityAnalysis.proximityData.map((data, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 text-guarawatch-text" title={data.occurrenceName}>
                            {data.occurrenceName.length > 20 
                              ? data.occurrenceName.substring(0, 20) + '...' 
                              : data.occurrenceName}
                          </td>
                          <td className="py-2 font-mono">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              data.nearbyFiresCount === 0 ? 'bg-green-100 text-green-800' :
                              data.nearbyFiresCount <= 2 ? 'bg-yellow-100 text-yellow-800' :
                              data.nearbyFiresCount <= 5 ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {data.nearbyFiresCount}
                            </span>
                          </td>
                          <td className="py-2 font-mono text-guarawatch-text">
                            {(data.averageFireRisk * 100).toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {proximityAnalysis.proximityData.length === 0 && (
                  <p className="text-sm text-guarawatch-muted text-center py-4">
                    Nenhuma ocorrência encontrada no recorte atual.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
