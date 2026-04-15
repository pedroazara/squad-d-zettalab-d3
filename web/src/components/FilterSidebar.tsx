import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FilterPayload {
  yearRange: number[];
  selectedBiomas: string[];
  selectedStates: string[];
  selectedState?: string;
  selectedRisks: string[];
}

interface FilterSidebarProps {
  multiStateSelection?: boolean;
  initialFilters?: Partial<FilterPayload>;
  // eslint-disable-next-line no-unused-vars
  onApplyFilters?: (filters: FilterPayload) => void;
  onClearFilters?: () => void;
  // eslint-disable-next-line no-unused-vars
  onExportPdf?: (filters: FilterPayload) => void;
  // eslint-disable-next-line no-unused-vars
  onExportCsv?: (filters: FilterPayload) => void;
}

const biomas = [
  { id: 'cerrado', label: 'Cerrado', color: '#F0AD4E' },
  { id: 'amazonia', label: 'Amazônia', color: '#5CB85C' },
  { id: 'caatinga', label: 'Caatinga', color: '#D4A520' },
  { id: 'atlantica', label: 'Mata Atlântica', color: '#7CB342' },
  { id: 'pampa', label: 'Pampa', color: '#5BC0DE' },
  { id: 'pantanal', label: 'Pantanal', color: '#00BCD4' },
];

const riskLevels = [
  { id: 'low', label: 'Baixo', color: '#A8D5A2' },
  { id: 'moderate', label: 'Moderado', color: '#F5E642' },
  { id: 'high', label: 'Alto', color: '#F0AD4E' },
  { id: 'critical', label: 'Muito Alto', color: '#D9534F' },
];

const states = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
  'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
  'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
  'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];

const sectionIds = {
  year: 'filter-section-year',
  bioma: 'filter-section-bioma',
  state: 'filter-section-state',
  risk: 'filter-section-risk',
};

const YEAR_MIN = 2019;
const YEAR_MAX = 2025;

const clampYear = (value: number) => Math.min(YEAR_MAX, Math.max(YEAR_MIN, value));

const sanitizeYearRange = (range?: number[]) => {
  if (!range || range.length !== 2) {
    return [YEAR_MIN, YEAR_MAX];
  }

  const from = clampYear(Number.isFinite(range[0]) ? range[0] : YEAR_MIN);
  const to = clampYear(Number.isFinite(range[1]) ? range[1] : YEAR_MAX);
  return [from, to];
};

export default function FilterSidebar({
  multiStateSelection = false,
  initialFilters,
  onApplyFilters,
  onClearFilters,
  onExportPdf,
  onExportCsv,
}: FilterSidebarProps) {
  const [yearRange, setYearRange] = useState<number[]>(sanitizeYearRange(initialFilters?.yearRange));
  const [selectedBiomas, setSelectedBiomas] = useState<string[]>(initialFilters?.selectedBiomas || []);
  const [selectedStates, setSelectedStates] = useState<string[]>(
    initialFilters?.selectedStates || (initialFilters?.selectedState ? [initialFilters.selectedState] : [])
  );
  const [selectedState, setSelectedState] = useState(
    initialFilters?.selectedStates?.[0] || initialFilters?.selectedState || ''
  );
  const [selectedRisks, setSelectedRisks] = useState<string[]>(initialFilters?.selectedRisks || []);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    year: true,
    bioma: true,
    state: true,
    risk: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  };

  const toggleBioma = (bioma: string) => {
    setSelectedBiomas((prev) =>
      prev.includes(bioma) ? prev.filter((b) => b !== bioma) : [...prev, bioma]
    );
  };

  const toggleRisk = (risk: string) => {
    setSelectedRisks((prev) =>
      prev.includes(risk) ? prev.filter((r) => r !== risk) : [...prev, risk]
    );
  };

  const toggleStateSelection = (stateName: string) => {
    setSelectedStates((prev) =>
      prev.includes(stateName)
        ? prev.filter((item) => item !== stateName)
        : [...prev, stateName]
    );
  };

  const allStatesSelected = selectedStates.length === states.length;

  const toggleAllStates = () => {
    setSelectedStates((prev) => (prev.length === states.length ? [] : [...states]));
  };

  const getCurrentFilters = (): FilterPayload => {
    const statesPayload = multiStateSelection
      ? selectedStates
      : selectedState
        ? [selectedState]
        : [];

    return {
      yearRange,
      selectedBiomas,
      selectedStates: statesPayload,
      selectedState: statesPayload[0] || '',
      selectedRisks,
    };
  };

  const handleApply = () => {
    const filters = getCurrentFilters();
    onApplyFilters?.(filters);
  };

  const handleClear = () => {
    setYearRange([2019, 2025]);
    setSelectedBiomas([]);
    setSelectedState('');
    setSelectedStates([]);
    setSelectedRisks([]);
    onClearFilters?.();
  };

  const recordCount: number = 1250; // Mock value

  return (
    <aside className="w-64 bg-guarawatch-bg border-r border-gray-200 p-6 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain">
      <h2 className="font-heading text-lg font-semibold mb-6 text-guarawatch-text">Filtros</h2>

      {/* Year Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('year')}
          className="flex items-center justify-between w-full mb-3 font-heading font-semibold text-guarawatch-text"
          aria-expanded={expandedSections.year}
          aria-controls={sectionIds.year}
        >
          Período (Anos)
          <ChevronDown
            size={18}
            className={`transition-transform ${expandedSections.year ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.year && (
          <div className="space-y-3" id={sectionIds.year}>
            <div className="flex gap-2">
              <input
                type="number"
                min={String(YEAR_MIN)}
                max={String(YEAR_MAX)}
                value={yearRange[0]}
                onChange={(e) => setYearRange([clampYear(Number(e.target.value)), yearRange[1]])}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                aria-label="Ano inicial"
              />
              <input
                type="number"
                min={String(YEAR_MIN)}
                max={String(YEAR_MAX)}
                value={yearRange[1]}
                onChange={(e) => setYearRange([yearRange[0], clampYear(Number(e.target.value))])}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                aria-label="Ano final"
              />
            </div>
            <input
              type="range"
              min={String(YEAR_MIN)}
              max={String(YEAR_MAX)}
              value={yearRange[0]}
              onChange={(e) => setYearRange([clampYear(Number(e.target.value)), yearRange[1]])}
              className="w-full"
              aria-label="Controle de período"
            />
          </div>
        )}
      </div>

      {/* Bioma Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('bioma')}
          className="flex items-center justify-between w-full mb-3 font-heading font-semibold text-guarawatch-text"
          aria-expanded={expandedSections.bioma}
          aria-controls={sectionIds.bioma}
        >
          Bioma
          <ChevronDown
            size={18}
            className={`transition-transform ${expandedSections.bioma ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.bioma && (
          <div className="space-y-2" id={sectionIds.bioma}>
            {biomas.map((bioma) => (
              <label key={bioma.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBiomas.includes(bioma.id)}
                  onChange={() => toggleBioma(bioma.id)}
                  className="w-4 h-4"
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: bioma.color }}
                />
                <span className="text-sm text-guarawatch-text">{bioma.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* State Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('state')}
          className="flex items-center justify-between w-full mb-3 font-heading font-semibold text-guarawatch-text"
          aria-expanded={expandedSections.state}
          aria-controls={sectionIds.state}
        >
          Estado
          <ChevronDown
            size={18}
            className={`transition-transform ${expandedSections.state ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.state && (
          multiStateSelection ? (
            <div className="space-y-2" id={sectionIds.state}>
              <label className="flex items-center gap-2 py-1 cursor-pointer border border-gray-200 rounded px-2 bg-white">
                <input
                  type="checkbox"
                  checked={allStatesSelected}
                  onChange={toggleAllStates}
                  className="w-4 h-4"
                />
                <span className="text-sm font-semibold text-guarawatch-text">Selecionar todos</span>
              </label>
              <div
                className="max-h-44 overflow-y-auto border border-gray-200 rounded p-2 bg-white"
                role="group"
                aria-label="Lista de estados"
              >
                {states.map((state) => (
                  <label key={state} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStates.includes(state)}
                      onChange={() => toggleStateSelection(state)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-guarawatch-text">{state}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-guarawatch-muted">
                {selectedStates.length > 0
                  ? `${selectedStates.length} estado(s) selecionado(s)`
                  : 'Nenhum estado selecionado'}
              </p>
            </div>
          ) : (
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              id={sectionIds.state}
              aria-label="Selecionar estado"
            >
              <option value="">Selecionar estado...</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          )
        )}
      </div>

      {/* Risk Level Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('risk')}
          className="flex items-center justify-between w-full mb-3 font-heading font-semibold text-guarawatch-text"
          aria-expanded={expandedSections.risk}
          aria-controls={sectionIds.risk}
        >
          Nível de Risco
          <ChevronDown
            size={18}
            className={`transition-transform ${expandedSections.risk ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.risk && (
          <div className="space-y-2" id={sectionIds.risk}>
            {riskLevels.map((level) => (
              <label key={level.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRisks.includes(level.id)}
                  onChange={() => toggleRisk(level.id)}
                  className="w-4 h-4"
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: level.color }}
                />
                <span className="text-sm text-guarawatch-text">{level.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Record Count */}
      <div className="mb-6 p-3 bg-white rounded border border-gray-200">
        <p className="text-xs text-guarawatch-muted">
          <span className="font-semibold text-guarawatch-text">{recordCount}</span> registros encontrados
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleApply}
          className="w-full px-4 py-2 bg-guarawatch-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Aplicar Filtros
        </button>
        <button
          onClick={handleClear}
          className="w-full px-4 py-2 border-2 border-guarawatch-primary text-guarawatch-primary bg-transparent rounded-lg font-medium hover:bg-guarawatch-bg transition-colors"
        >
          Limpar Filtros
        </button>
        <button
          onClick={() => onExportPdf?.(getCurrentFilters())}
          className="w-full px-4 py-2 bg-guarawatch-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Exportar PDF
        </button>
        <button
          onClick={() => onExportCsv?.(getCurrentFilters())}
          className="w-full px-4 py-2 border-2 border-guarawatch-secondary text-guarawatch-secondary bg-transparent rounded-lg font-medium hover:bg-guarawatch-bg transition-colors"
        >
          Exportar CSV
        </button>
      </div>
    </aside>
  );
}
