import { useState } from 'react';
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
import {
  getCriticalSpecies,
  getBiomeDistribution,
  getFireHotspots,
  SpeciesData,
} from '@/services/mockData';
import { exportMockCsv, exportMockPdf } from '@/lib/exportUtils';

export default function DashboardBiodiversidade() {
  const criticalSpecies = getCriticalSpecies();
  const biomeData = getBiomeDistribution();
  const fireHotspots = getFireHotspots();
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'animal' | 'tipo'>('animal');
  const [selectedGroup, setSelectedGroup] = useState<string>('Todos');
  const [selectedAnimal, setSelectedAnimal] = useState<string>('Todos');

  const availableGroups = ['Todos', ...new Set(criticalSpecies.map((species) => species.grupo))];
  const availableAnimals = ['Todos', ...criticalSpecies.map((species) => species.nomepopular)];

  const filteredSpecies = criticalSpecies.filter((species) => {
    const term = searchTerm.trim().toLowerCase();
    const groupMatches = selectedGroup === 'Todos' || species.grupo === selectedGroup;
    const animalMatches = selectedAnimal === 'Todos' || species.nomepopular === selectedAnimal;
    const modeMatches =
      analysisMode === 'animal' ? animalMatches : groupMatches;

    return (
      modeMatches &&
      (
        species.nomepopular.toLowerCase().includes(term) ||
        species.nomecientifico.toLowerCase().includes(term) ||
        species.bioma.toLowerCase().includes(term)
      )
    );
  }).filter((species) => {
    if (!searchTerm.trim()) {
      return true;
    }
    const term = searchTerm.trim().toLowerCase();
    return (
      species.nomepopular.toLowerCase().includes(term) ||
      species.nomecientifico.toLowerCase().includes(term) ||
      species.bioma.toLowerCase().includes(term) ||
      species.grupo.toLowerCase().includes(term)
    );
  });

  const selectedAnimalData =
    selectedAnimal === 'Todos'
      ? null
      : criticalSpecies.find((species) => species.nomepopular === selectedAnimal) || null;

  const groupedImpactData = availableGroups
    .filter((group) => group !== 'Todos')
    .map((group) => {
      const speciesInGroup = criticalSpecies.filter((species) => species.grupo === group);
      const avgImpact =
        speciesInGroup.reduce((acc, species) => acc + species.percentualAfetado, 0) /
        speciesInGroup.length;
      return {
        grupo: group,
        mediaImpacto: Number(avgImpact.toFixed(1)),
        quantidade: speciesInGroup.length,
      };
    });

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
  const criticalCount = filteredSpecies.filter((species) =>
    ['EN', 'CR', 'VU'].includes(species.status)
  ).length;

  // Biome impact data for scatter chart
  const biomeImpactData = [
    { nome: 'Cerrado', areaQueimada: 1250, especiesAmeacadas: 45, especiesTotais: 120 },
    { nome: 'Amazônia', areaQueimada: 980, especiesAmeacadas: 38, especiesTotais: 250 },
    { nome: 'Caatinga', areaQueimada: 750, especiesAmeacadas: 28, especiesTotais: 85 },
    { nome: 'Mata Atlântica', areaQueimada: 620, especiesAmeacadas: 32, especiesTotais: 95 },
    { nome: 'Pantanal', areaQueimada: 380, especiesAmeacadas: 18, especiesTotais: 65 },
    { nome: 'Pampa', areaQueimada: 240, especiesAmeacadas: 12, especiesTotais: 45 },
  ];

  // IUCN Status distribution
  const iucnData = [
    { bioma: 'Cerrado', LC: 45, NT: 28, VU: 32, EN: 12, CR: 3 },
    { bioma: 'Amazônia', LC: 65, NT: 48, VU: 55, EN: 25, CR: 7 },
    { bioma: 'Caatinga', LC: 25, NT: 18, VU: 20, EN: 10, CR: 2 },
    { bioma: 'Mata Atlântica', LC: 35, NT: 22, VU: 28, EN: 15, CR: 5 },
    { bioma: 'Pantanal', LC: 20, NT: 12, VU: 15, EN: 8, CR: 2 },
    { bioma: 'Pampa', LC: 15, NT: 8, VU: 10, EN: 5, CR: 1 },
  ];

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
      case 'EX':
        return '#000000';
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
      case 'EX':
        return 'Extinta';
      default:
        return status;
    }
  };

  const handleExportPdf = (filters: FilterPayload) => {
    exportMockPdf('Painel Biodiversidade', filters);
  };

  const handleExportCsv = (filters: FilterPayload) => {
    exportMockCsv('Painel Biodiversidade', filters);
  };

  return (
    <div className="min-h-screen bg-guarawatch-bg">
      <Navbar />

      <div className="flex">
        <FilterSidebar onExportPdf={handleExportPdf} onExportCsv={handleExportCsv} />

        <main className="flex-1 p-8">
          {/* Page Header */}
          <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-2">
            Impacto das Queimadas na Biodiversidade
          </h1>
          <p className="text-guarawatch-muted mb-8">
            Análise do cruzamento entre áreas afetadas por queimadas e espécies impactadas,
            com leitura por animal e por tipo taxonômico.
          </p>

          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <h2 className="font-heading text-lg font-semibold text-guarawatch-primary">
                  Modo de análise
                </h2>
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
                  <label className="block text-xs font-semibold text-guarawatch-muted mb-1">
                    Tipo taxonômico
                  </label>
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
                  <label className="block text-xs font-semibold text-guarawatch-muted mb-1">
                    Animal específico
                  </label>
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
                  Detalhe do animal selecionado: {selectedAnimalData.nomepopular}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold">Habitat</p>
                    <p>{selectedAnimalData.habitat || 'Sem dado disponível.'}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Alimentação</p>
                    <p>{selectedAnimalData.alimentacao?.join(', ') || 'Sem dado disponível.'}</p>
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
                    Mapa do Brasil com incêndios e espécie selecionada
                  </h2>
                  <p className="text-sm text-guarawatch-muted">
                    Busque por uma espécie e visualize sua localização com a sobreposição de áreas de incêndio.
                  </p>
                </div>

                <div className="w-full sm:w-80">
                  <label
                    className="block text-sm font-medium text-guarawatch-muted mb-2"
                    htmlFor="species-search"
                  >
                    Buscar por espécie
                  </label>
                  <input
                    id="species-search"
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Onça-pintada, Lobo-guará, Arara-azul..."
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-guarawatch-text shadow-sm focus:border-guarawatch-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="h-[520px] w-full rounded-xl overflow-hidden border border-gray-200">
                <MockBrazilMap
                  showFire
                  fireHotspots={fireHotspots}
                  highlight={
                    selectedSpecies?.location
                      ? {
                          lat: selectedSpecies.location.lat,
                          lng: selectedSpecies.location.lng,
                          label: selectedSpecies.nomepopular,
                        }
                      : null
                  }
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                {selectedSpecies ? (
                  <span>
                    <strong>{selectedSpecies.nomepopular}</strong> ({selectedSpecies.nomecientifico}) localizado no bioma{' '}
                    <strong>{selectedSpecies.bioma}</strong>. O mapa mostra a área de incêndio e o ponto de habitat estimado.
                  </span>
                ) : (
                  <span>
                    Clique numa espécie na tabela abaixo ou use a busca para visualizar a localização no mapa.
                  </span>
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

          {/* Biome Impact Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Espécies Afetadas por Bioma
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="areaQueimada" name="Área Queimada (1000 ha)" />
                <YAxis dataKey="especiesAmeacadas" name="Espécies Ameaçadas" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter
                  name="Biomas"
                  data={biomeImpactData}
                  fill="#D9534F"
                  shape="circle"
                >
                  {biomeImpactData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={biomeData[index]?.cor} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* IUCN Status Distribution */}
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

          {/* Critical Species Table */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
              Espécies Criticamente Afetadas
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-guarawatch-primary">
                  <tr>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Nome Científico
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Nome Popular
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Grupo
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Status IUCN
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      Bioma
                    </th>
                    <th className="text-left py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                      % Habitat Afetado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpecies.map((species, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 hover:bg-guarawatch-bg transition-colors cursor-pointer"
                      onClick={() => setSelectedSpecies(species)}
                    >
                      <td className="py-3 px-4 font-mono text-sm text-guarawatch-muted italic">
                        {species.nomecientifico}
                      </td>
                      <td className="py-3 px-4 font-heading font-semibold text-guarawatch-primary">
                        {species.nomepopular}
                      </td>
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
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-guarawatch-danger"
                              style={{ width: `${species.percentualAfetado}%` }}
                            />
                          </div>
                          <span className="font-mono text-sm">
                            {species.percentualAfetado}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSpecies.length === 0 && (
              <p className="text-sm text-guarawatch-muted mt-4">
                Nenhuma espécie encontrada para o recorte atual. Ajuste o tipo, animal ou termo de busca.
              </p>
            )}
          </div>

          {/* Species Detail Modal */}
          {selectedSpecies && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-heading text-2xl font-semibold text-guarawatch-primary">
                      {selectedSpecies.nomepopular}
                    </h3>
                    <p className="text-sm text-guarawatch-muted italic">
                      {selectedSpecies.nomecientifico}
                    </p>
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
                    <p className="font-heading font-semibold text-guarawatch-text">
                      {selectedSpecies.grupo}
                    </p>
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
                    <p className="font-heading font-semibold text-guarawatch-text">
                      {selectedSpecies.bioma}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-guarawatch-muted mb-1">Habitat Afetado</p>
                    <p className="font-mono font-semibold text-guarawatch-danger">
                      {selectedSpecies.percentualAfetado}%
                    </p>
                  </div>
                </div>

                <p className="text-sm text-guarawatch-muted">
                  Esta espécie tem {selectedSpecies.percentualAfetado}% de seu habitat afetado
                  pelas queimadas na região do {selectedSpecies.bioma}.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold">Habitat</p>
                    <p>{selectedSpecies.habitat || 'Sem dados detalhados de habitat.'}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Alimentação</p>
                    <p>{selectedSpecies.alimentacao?.join(', ') || 'Sem dados de alimentação.'}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Ameaças principais</p>
                    <p>{selectedSpecies.ameacas?.join(', ') || 'Sem dados de ameaças.'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
