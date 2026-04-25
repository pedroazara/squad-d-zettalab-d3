import { useEffect, useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FilterSidebar, { FilterPayload } from '@/components/FilterSidebar';
import { MockBrazilMap } from '@/components/Map';
import { exportCsvReport, exportPdfReport, type ExportScope } from '@/lib/exportUtils';
import { isSupportedDomainState, normalizeLabel, SUPPORTED_DOMAIN_STATES } from '@/lib/territory';
import {
  fetchFaunaBiodiversitySummary,
  fetchFaunaSpecies,
  fetchAllFirePoints,
} from '@/services/analyticsApi';
import { getApiErrorMessage } from '@/services/apiClient';
import type { FaunaSpeciesItem, FirePointItem } from '@/types/api';

const biomeColorPalette: Record<string, string> = {
  Cerrado: '#F0AD4E',
  Amazonia: '#5CB85C',
  'Mata Atlantica': '#7CB342',
  Caatinga: '#D4A520',
  Pantanal: '#00BCD4',
  Pampa: '#5BC0DE',
};

const normalizeBiomeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

const normalizeState = (value: string) =>
  normalizeLabel(value);

const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const isInAmazCerrado = (stateName: string) => isSupportedDomainState(stateName);
const biomaIdToNome: Record<string, string> = {
  cerrado: 'Cerrado',
  amazonia: 'Amazônia',
};

export default function DashboardBiodiversidade() {
  const [appliedFilters, setAppliedFilters] = useState<FilterPayload>({
    yearRange: [2020, 2026],
    selectedBiomas: [],
    selectedStates: [],
    selectedState: '',
    selectedRisks: [],
  });
  const [criticalSpecies, setCriticalSpecies] = useState<FaunaSpeciesItem[]>([]);
  const [summary, setSummary] = useState({
    total_ocorrencias: 0,
    total_especies: 0,
    media_habitat_afetado: 0,
    por_status_iucn: {} as Record<string, number>,
  });
  const [firePoints, setFirePoints] = useState<FirePointItem[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<FaunaSpeciesItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'animal' | 'tipo'>('animal');
  const [selectedGroup, setSelectedGroup] = useState<string>('Todos');
  const [selectedAnimal, setSelectedAnimal] = useState<string>('Todos');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);
  const selectedState = appliedFilters.selectedState || appliedFilters.selectedStates[0] || undefined;
  const selectedBiome = appliedFilters.selectedBiomas.length > 0 ? biomaIdToNome[appliedFilters.selectedBiomas[0]] : undefined;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [speciesPayload, summaryPayload] = await Promise.all([
          fetchFaunaSpecies({
            estado: selectedState || undefined,
            bioma: selectedBiome || undefined,
          }),
          fetchFaunaBiodiversitySummary({
            estado: selectedState || undefined,
            bioma: selectedBiome || undefined,
          }),
        ]);

        const safeSpecies = ensureArray<FaunaSpeciesItem>(speciesPayload);
        const safeSummary = {
          total_ocorrencias:
            typeof (summaryPayload as { total_ocorrencias?: unknown })?.total_ocorrencias === 'number'
              ? (summaryPayload as { total_ocorrencias: number }).total_ocorrencias
              : 0,
          total_especies:
            typeof (summaryPayload as { total_especies?: unknown })?.total_especies === 'number'
              ? (summaryPayload as { total_especies: number }).total_especies
              : 0,
          media_habitat_afetado:
            typeof (summaryPayload as { media_habitat_afetado?: unknown })?.media_habitat_afetado === 'number'
              ? (summaryPayload as { media_habitat_afetado: number }).media_habitat_afetado
              : 0,
          por_status_iucn:
            typeof (summaryPayload as { por_status_iucn?: unknown })?.por_status_iucn === 'object' &&
            (summaryPayload as { por_status_iucn?: unknown }).por_status_iucn !== null
              ? ((summaryPayload as { por_status_iucn: Record<string, number> }).por_status_iucn || {})
              : {},
        };

        setCriticalSpecies(safeSpecies);
        setSummary(safeSummary);
      } catch (error) {
        setCriticalSpecies([]);
        setSummary({
          total_ocorrencias: 0,
          total_especies: 0,
          media_habitat_afetado: 0,
          por_status_iucn: {},
        });
        setLoadError(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [selectedBiome, selectedState]);

  useEffect(() => {
    const loadFirePoints = async () => {
      try {
        const all = await fetchAllFirePoints();
        setFirePoints(
          all.filter(
            (point) =>
              isInAmazCerrado(point.estado) &&
              (!selectedState || normalizeState(point.estado) === normalizeState(selectedState)) &&
              (!selectedBiome || normalizeBiomeName(point.bioma) === normalizeBiomeName(selectedBiome))
          )
        );
      } catch {
        setFirePoints([]);
      }
    };

    void loadFirePoints();
  }, [selectedBiome, selectedState]);

  const fireMapPoints = useMemo(() => {
    return firePoints.map((point) => ({
      lat: point.latitude,
      lng: point.longitude,
      intensity: Math.max(10, Math.min(100, Math.round(point.risco_fogo <= 1 ? point.risco_fogo * 100 : point.risco_fogo))),
      label: `${point.municipio} - ${point.estado}`,
    }));
  }, [firePoints]);

  const availableGroups = ['Todos', ...new Set(criticalSpecies.map((species) => species.grupo))];
  const availableAnimals = ['Todos', ...criticalSpecies.map((species) => species.nome_popular)];

  const filteredSpecies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return criticalSpecies.filter((species) => {
      const groupMatches = selectedGroup === 'Todos' || species.grupo === selectedGroup;
      const animalMatches = selectedAnimal === 'Todos' || species.nome_popular === selectedAnimal;
      const modeMatches = analysisMode === 'animal' ? animalMatches : groupMatches;

      if (!modeMatches) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        species.nome_popular.toLowerCase().includes(term) ||
        species.nome_cientifico.toLowerCase().includes(term) ||
        species.bioma.toLowerCase().includes(term) ||
        species.grupo.toLowerCase().includes(term)
      );
    });
  }, [analysisMode, criticalSpecies, searchTerm, selectedAnimal, selectedGroup]);

  const faunaMapPoints = useMemo(() => {
    return filteredSpecies.map((species) => ({
      lat: species.location.lat,
      lng: species.location.lng,
      label: `${species.nome_popular} (${species.nome_cientifico})`,
    }));
  }, [filteredSpecies]);

  const selectedAnimalData =
    selectedAnimal === 'Todos'
      ? null
      : criticalSpecies.find((species) => species.nome_popular === selectedAnimal) || null;

  const groupedImpactData = useMemo(() => {
    return availableGroups
      .filter((group) => group !== 'Todos')
      .map((group) => {
        const speciesInGroup = filteredSpecies.filter((species) => species.grupo === group);
        const avgImpact =
          speciesInGroup.length > 0
            ? speciesInGroup.reduce((acc, species) => acc + species.percentualAfetado, 0) / speciesInGroup.length
            : 0;
        return {
          grupo: group,
          mediaImpacto: Number(avgImpact.toFixed(1)),
          quantidade: speciesInGroup.length,
        };
      })
      .filter((item) => item.quantidade > 0);
  }, [availableGroups, filteredSpecies]);

  const biomeData = useMemo(() => {
    const grouped = filteredSpecies.reduce<Record<string, number>>((acc, species) => {
      const key = normalizeBiomeName(species.bioma);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const total = Object.values(grouped).reduce((acc, value) => acc + value, 0);
    return Object.entries(grouped).map(([nome, count]) => ({
      nome,
      percentual: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      cor: biomeColorPalette[nome] || '#64748b',
      count,
    }));
  }, [filteredSpecies]);

  const biomeImpactData = useMemo(() => {
    return biomeData.map((biome) => {
      const speciesByBiome = filteredSpecies.filter((species) => normalizeBiomeName(species.bioma) === biome.nome);
      const ameaçadas = speciesByBiome.filter((species) => ['CR', 'EN', 'VU'].includes(species.status)).length;
      const mediaHabitatAfetado =
        speciesByBiome.length > 0
          ? speciesByBiome.reduce((acc, species) => acc + species.percentualAfetado, 0) / speciesByBiome.length
          : 0;

      return {
        nome: biome.nome,
        areaQueimada: Number(mediaHabitatAfetado.toFixed(1)),
        especiesAmeacadas: ameaçadas,
        especiesTotais: speciesByBiome.length,
      };
    });
  }, [biomeData, filteredSpecies]);

  const iucnData = useMemo(() => {
    const statuses = ['LC', 'NT', 'VU', 'EN', 'CR'];

    return biomeData.map((biome) => {
      const speciesByBiome = filteredSpecies.filter((species) => normalizeBiomeName(species.bioma) === biome.nome);
      const row: Record<string, string | number> = { bioma: biome.nome };
      statuses.forEach((status) => {
        row[status] = speciesByBiome.filter((species) => species.status === status).length;
      });
      return row;
    });
  }, [biomeData, filteredSpecies]);

  const totalSpecies = filteredSpecies.length;
  const avgAffectedHabitat =
    totalSpecies > 0
      ? Number(
          (
            filteredSpecies.reduce((acc, species) => acc + species.percentualAfetado, 0) /
            totalSpecies
          ).toFixed(1)
        )
      : 0;
  const criticalCount = filteredSpecies.filter((species) => ['EN', 'CR', 'VU'].includes(species.status)).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LC':
        return '#A8D5A2';
      case 'NT':
        return '#F5E642';
      case 'VU':
        return '#F0AD4E';
      case 'EN':
        return '#FF6B6B';
      case 'CR':
        return '#8B0000';
      default:
        return '#CCCCCC';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'LC':
        return 'Pouco Preocupante';
      case 'NT':
        return 'Quase Ameaçada';
      case 'VU':
        return 'Vulnerável';
      case 'EN':
        return 'Em Perigo';
      case 'CR':
        return 'Criticamente em Perigo';
      default:
        return status;
    }
  };

  const handleExportPdf = (filters: FilterPayload, scope: ExportScope) => {
    const exportRows = scope === 'complete' ? criticalSpecies : filteredSpecies;
    exportPdfReport({
      pageName: 'Painel Biodiversidade',
      filters,
      scope,
      summaryLines: [
        `${exportRows.length} espécie(s) no escopo selecionado.`,
        `${firePoints.length} foco(s) de incêndio visíveis no mapa.`,
      ],
      rows: exportRows.map((species) => ({
        nome_popular: species.nome_popular,
        nome_cientifico: species.nome_cientifico,
        grupo: species.grupo,
        status: species.status,
        bioma: species.bioma,
        percentual_afetado: species.percentualAfetado,
      })),
    });
  };

  const handleExportCsv = (filters: FilterPayload, scope: ExportScope) => {
    const exportRows = scope === 'complete' ? criticalSpecies : filteredSpecies;
    exportCsvReport({
      pageName: 'Painel Biodiversidade',
      filters,
      scope,
      summaryLines: [
        `${exportRows.length} espécie(s) no escopo selecionado.`,
        `${firePoints.length} foco(s) de incêndio visíveis no mapa.`,
      ],
      rows: exportRows.map((species) => ({
        nome_popular: species.nome_popular,
        nome_cientifico: species.nome_cientifico,
        grupo: species.grupo,
        status: species.status,
        bioma: species.bioma,
        percentual_afetado: species.percentualAfetado,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-guarawatch-bg">
      <Navbar />

      <div className="flex">
        <FilterSidebar
          availableStates={SUPPORTED_DOMAIN_STATES}
          initialFilters={appliedFilters}
          recordCount={filteredSpecies.length}
          onApplyFilters={(filters) => setAppliedFilters(filters)}
          onClearFilters={() =>
            setAppliedFilters({
              yearRange: [2020, 2026],
              selectedBiomas: [],
              selectedStates: [],
              selectedState: '',
              selectedRisks: [],
            })
          }
          onExportPdf={handleExportPdf}
          onExportCsv={handleExportCsv}
        />

        <main className="flex-1 p-8">
          <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-2">
            Impacto das Queimadas na Biodiversidade
          </h1>
          <p className="text-guarawatch-muted mb-8">
            Painel baseado em dados reais de fauna com leitura por grupo taxonômico, espécie e status IUCN.
          </p>

          {loading && <p className="text-sm text-guarawatch-muted mb-4">Carregando dados reais...</p>}
          {loadError && (
            <p className="text-sm text-amber-700 mb-4">Não foi possível carregar a API ({loadError}).</p>
          )}

          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <h2 className="font-heading text-lg font-semibold text-guarawatch-primary">Modo de análise</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAnalysisMode('animal')}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                      analysisMode === 'animal'
                        ? 'bg-guarawatch-primary text-white border-guarawatch-primary'
                        : 'bg-white text-guarawatch-primary border-guarawatch-primary'
                    }`}
                  >
                    Por animal
                  </button>
                  <button
                    onClick={() => setAnalysisMode('tipo')}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                      analysisMode === 'tipo'
                        ? 'bg-guarawatch-primary text-white border-guarawatch-primary'
                        : 'bg-white text-guarawatch-primary border-guarawatch-primary'
                    }`}
                  >
                    Por tipo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-guarawatch-muted mb-1">Tipo taxonômico</label>
                  <select
                    value={selectedGroup}
                    onChange={(event) => setSelectedGroup(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {availableGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-guarawatch-muted mb-1">Animal específico</label>
                  <select
                    value={selectedAnimal}
                    onChange={(event) => setSelectedAnimal(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {availableAnimals.map((animal) => (
                      <option key={animal} value={animal}>
                        {animal}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-guarawatch-muted">Espécies no recorte</p>
                <p className="font-mono text-2xl font-semibold text-guarawatch-primary">{totalSpecies}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-guarawatch-muted">Habitat afetado médio</p>
                <p className="font-mono text-2xl font-semibold text-guarawatch-danger">{avgAffectedHabitat}%</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-guarawatch-muted">Espécies em alto risco</p>
                <p className="font-mono text-2xl font-semibold text-guarawatch-warning">{criticalCount}</p>
              </div>
            </div>

            {selectedAnimalData && analysisMode === 'animal' && (
              <div className="mt-6 rounded-lg bg-slate-50 p-4 border border-slate-200">
                <h3 className="font-heading text-base font-semibold text-guarawatch-primary mb-2">
                  Detalhe do animal selecionado: {selectedAnimalData.nome_popular}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold">Nome científico</p>
                    <p>{selectedAnimalData.nome_cientifico}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Status IUCN</p>
                    <p>{getStatusLabel(selectedAnimalData.status)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-heading text-lg font-semibold text-guarawatch-primary">
                    Mapa real do Brasil com incêndios e espécie selecionada
                  </h2>
                  <p className="text-sm text-guarawatch-muted">
                    Pontos de espécies usam coordenadas reais do CSV. Camada de incêndio plota foco a foco no recorte nacional.
                  </p>
                </div>

                <div className="w-full sm:w-80">
                  <label className="block text-sm font-medium text-guarawatch-muted mb-2" htmlFor="species-search">
                    Buscar por espécie
                  </label>
                  <input
                    id="species-search"
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Onça-pintada"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-guarawatch-text shadow-sm focus:border-guarawatch-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="h-[520px] w-full rounded-xl overflow-hidden border border-gray-200">
                <MockBrazilMap
                  showFire
                  firePoints={fireMapPoints}
                  faunaPoints={faunaMapPoints}
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                {selectedSpecies ? (
                  <span>
                    <strong>{selectedSpecies.nome_popular}</strong> ({selectedSpecies.nome_cientifico}) no bioma{' '}
                    <strong>{selectedSpecies.bioma}</strong>.
                  </span>
                ) : (
                  <span>Clique numa espécie na tabela abaixo ou use a busca para visualizar no mapa.</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Média de habitat afetado por tipo taxonômico
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={groupedImpactData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grupo" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="mediaImpacto" fill="#D9534F" name="Média de habitat afetado (%)" />
                <Bar dataKey="quantidade" fill="#2E6B3E" name="Quantidade de espécies" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Espécies e habitat afetado por Bioma
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="areaQueimada" name="Habitat afetado médio (%)" />
                <YAxis dataKey="especiesAmeacadas" name="Espécies ameaçadas" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Biomas" data={biomeImpactData} fill="#D9534F" shape="circle">
                  {biomeImpactData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={biomeData[index]?.cor || '#64748b'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Distribuição por Status de Conservação (IUCN)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={iucnData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bioma" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="LC" stackId="a" fill="#A8D5A2" name="Pouco Preocupante" />
                <Bar dataKey="NT" stackId="a" fill="#F5E642" name="Quase Ameaçada" />
                <Bar dataKey="VU" stackId="a" fill="#F0AD4E" name="Vulnerável" />
                <Bar dataKey="EN" stackId="a" fill="#FF6B6B" name="Em Perigo" />
                <Bar dataKey="CR" stackId="a" fill="#8B0000" name="Criticamente em Perigo" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Espécies Registradas no Dataset
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-guarawatch-primary">
                  <tr>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">Nome Científico</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">Nome Popular</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">Grupo</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">Status IUCN</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">Bioma</th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">% Habitat Afetado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpecies.map((species, idx) => (
                    <tr
                      key={`${species.nome_cientifico}-${idx}`}
                      className="border-b border-gray-200 hover:bg-guarawatch-bg transition-colors cursor-pointer"
                      onClick={() => setSelectedSpecies(species)}
                    >
                      <td className="py-3 px-4 font-mono text-sm text-guarawatch-muted italic">{species.nome_cientifico}</td>
                      <td className="py-3 px-4 font-heading font-semibold text-guarawatch-primary">{species.nome_popular}</td>
                      <td className="py-3 px-4 text-guarawatch-text">{species.grupo}</td>
                      <td className="py-3 px-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: getStatusColor(species.status) }}
                        >
                          {species.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-guarawatch-muted">{species.bioma}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{species.percentualAfetado}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSpecies.length === 0 && (
              <p className="text-sm text-guarawatch-muted mt-4">
                Nenhuma espécie encontrada para o recorte atual.
              </p>
            )}
          </div>

          {selectedSpecies && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-heading text-2xl font-semibold text-guarawatch-primary">{selectedSpecies.nome_popular}</h3>
                    <p className="text-sm text-guarawatch-muted italic">{selectedSpecies.nome_cientifico}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSpecies(null)}
                    className="text-guarawatch-muted hover:text-guarawatch-primary text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-guarawatch-muted mb-1">Grupo Taxonômico</p>
                    <p className="font-heading font-semibold text-guarawatch-text">{selectedSpecies.grupo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-guarawatch-muted mb-1">Status IUCN</p>
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: getStatusColor(selectedSpecies.status) }}
                    >
                      {getStatusLabel(selectedSpecies.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-guarawatch-muted mb-1">Bioma</p>
                    <p className="font-heading font-semibold text-guarawatch-text">{selectedSpecies.bioma}</p>
                  </div>
                  <div>
                    <p className="text-xs text-guarawatch-muted mb-1">Habitat Afetado</p>
                    <p className="font-mono font-semibold text-guarawatch-danger">{selectedSpecies.percentualAfetado}%</p>
                  </div>
                </div>

                <p className="text-sm text-guarawatch-muted">
                  Esta espécie tem {selectedSpecies.percentualAfetado}% de ocorrência fora do bioma principal no dataset atual.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold">Coordenada média da espécie</p>
                    <p>
                      Latitude: {selectedSpecies.location.lat}, Longitude: {selectedSpecies.location.lng}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-500">
            Totais globais carregados da API: {summary.total_especies} espécie(s), {summary.total_ocorrencias} ocorrência(s),
            habitat afetado médio de {summary.media_habitat_afetado}%.
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
