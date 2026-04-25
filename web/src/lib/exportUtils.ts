export type ExportFilters = {
  yearRange?: number[];
  selectedBiomas?: string[];
  selectedStates?: string[];
  selectedState?: string;
  selectedRisks?: string[];
};
export type ExportScope = 'visible' | 'complete';

export type ExportRow = Record<string, string | number | boolean | null | undefined>;

type ExportPayload = {
  pageName: string;
  filters: ExportFilters;
  summaryLines?: string[];
  rows?: ExportRow[];
  scope?: ExportScope;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const sanitizeFilename = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

const escapeCsvValue = (value: string | number | boolean | null | undefined) => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const buildFiltersSection = (filters: ExportFilters) => {
  const yearLabel =
    filters.yearRange && filters.yearRange.length === 2
      ? `${filters.yearRange[0]}-${filters.yearRange[1]}`
      : 'todos';
  const biomas =
    filters.selectedBiomas && filters.selectedBiomas.length > 0
      ? filters.selectedBiomas.join(', ')
      : 'todos';
  const states =
    filters.selectedStates && filters.selectedStates.length > 0
      ? filters.selectedStates.join(', ')
      : filters.selectedState || 'todos';
  const risk =
    filters.selectedRisks && filters.selectedRisks.length > 0
      ? filters.selectedRisks.join(', ')
      : 'todos';

  return [
    `Periodo: ${yearLabel}`,
    `Biomas: ${biomas}`,
    `Estados: ${states}`,
    `Niveis de risco: ${risk}`,
  ];
};

export const exportCsvReport = ({ pageName, filters, rows = [], summaryLines = [] }: ExportPayload) => {
  const metadataRows = [
    ['pagina', pageName],
    ['gerado_em', new Date().toISOString()],
    ['periodo', buildFiltersSection(filters)[0].replace('Periodo: ', '')],
    ['biomas', buildFiltersSection(filters)[1].replace('Biomas: ', '')],
    ['estados', buildFiltersSection(filters)[2].replace('Estados: ', '')],
    ['niveis_risco', buildFiltersSection(filters)[3].replace('Niveis de risco: ', '')],
  ];

  const csvLines: string[] = ['secao,campo,valor'];
  metadataRows.forEach(([field, value]) => {
    csvLines.push(['metadados', field, value].map(escapeCsvValue).join(','));
  });

  summaryLines.forEach((line, index) => {
    csvLines.push(['resumo', `linha_${index + 1}`, line].map(escapeCsvValue).join(','));
  });

  if (rows.length > 0) {
    const headers = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set<string>())
    );

    csvLines.push('');
    csvLines.push(headers.map(escapeCsvValue).join(','));
    rows.forEach((row) => {
      csvLines.push(headers.map((header) => escapeCsvValue(row[header])).join(','));
    });
  }

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const filename = `${sanitizeFilename(pageName)}-exportacao.csv`;
  downloadBlob(blob, filename);
};

const prettifyHeader = (header: string) =>
  header
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const escapePdfText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const buildPdfFile = (lines: string[]) => {
  const header = '%PDF-1.4\n';
  const textOps = lines
    .map((line, index) => {
      const y = 800 - index * 14;
      return `BT /F1 10 Tf 40 ${Math.max(40, y)} Td (${escapePdfText(line)}) Tj ET`;
    })
    .join('\n');
  const stream = `<< /Length ${textOps.length} >>\nstream\n${textOps}\nendstream`;

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj ${stream} endobj`,
  ];

  let offset = header.length;
  const xrefPositions = [0];
  const body = objects
    .map((obj) => {
      xrefPositions.push(offset);
      offset += obj.length + 1;
      return `${obj}\n`;
    })
    .join('');

  const xrefStart = offset;
  const xrefRows = xrefPositions
    .map((pos, idx) => (idx === 0 ? '0000000000 65535 f ' : `${String(pos).padStart(10, '0')} 00000 n `))
    .join('\n');
  const xref = `xref\n0 ${xrefPositions.length}\n${xrefRows}\n`;
  const trailer = `trailer << /Size ${xrefPositions.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([header, body, xref, trailer], { type: 'application/pdf' });
};

export const exportPdfReport = ({ pageName, filters, rows = [], summaryLines = [], scope = 'visible' }: ExportPayload) => {
  const generatedAt = new Date().toLocaleString('pt-BR');
  const scopeLabel = scope === 'complete' ? 'Conjunto completo' : 'Dados visiveis/filtrados';
  const filterLines = buildFiltersSection(filters);
  const normalizedSummary = summaryLines.length > 0 ? summaryLines : ['Exportacao gerada com sucesso para auditoria e analise.'];
  const lines: string[] = [
    pageName,
    `Gerado em: ${generatedAt}`,
    `Escopo: ${scopeLabel}`,
    '',
    'Filtros aplicados',
    ...filterLines.map((line) => `- ${line}`),
    '',
    'Resumo executivo',
    ...normalizedSummary.map((line) => `- ${line}`),
  ];
  if (rows.length > 0) {
    const headers = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set<string>())
    );
    lines.push('', 'Tabela de dados', headers.map(prettifyHeader).join(' | '));
    rows.slice(0, 120).forEach((row) => {
      lines.push(headers.map((header) => String(row[header] ?? '')).join(' | '));
    });
    if (rows.length > 120) {
      lines.push(`... ${rows.length - 120} registro(s) adicionais omitidos nesta pagina.`);
    }
  }

  const filename = `${sanitizeFilename(pageName)}-exportacao.pdf`;
  const blob = buildPdfFile(lines);
  downloadBlob(blob, filename);
};
