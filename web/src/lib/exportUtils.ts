export type ExportFilters = {
  yearRange?: number[];
  selectedBiomas?: string[];
  selectedStates?: string[];
  selectedState?: string;
  selectedRisks?: string[];
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const sanitizeFilename = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

const buildExportLines = (pageName: string, filters: ExportFilters) => {
  const yearLabel =
    filters.yearRange && filters.yearRange.length === 2
      ? `${filters.yearRange[0]}-${filters.yearRange[1]}`
      : "todos";
  const biomas =
    filters.selectedBiomas && filters.selectedBiomas.length > 0
      ? filters.selectedBiomas.join(", ")
      : "todos";
  const state =
    filters.selectedStates && filters.selectedStates.length > 0
      ? filters.selectedStates.join(", ")
      : filters.selectedState || "todos";
  const risk =
    filters.selectedRisks && filters.selectedRisks.length > 0
      ? filters.selectedRisks.join(", ")
      : "todos";

  return [
    `Pagina: ${pageName}`,
    `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    "",
    "Filtros aplicados:",
    `- Periodo: ${yearLabel}`,
    `- Biomas: ${biomas}`,
    `- Estado: ${state}`,
    `- Nivel de risco: ${risk}`,
    "",
    "Resumo mockado:",
    "- Este arquivo e uma exportacao demonstrativa para validacao do fluxo.",
    "- Na integracao final, os dados reais do dashboard serao incluidos aqui.",
  ];
};

export const exportMockCsv = (pageName: string, filters: ExportFilters) => {
  const lines = [
    "campo,valor",
    `pagina,${pageName}`,
    `gerado_em,${new Date().toISOString()}`,
    `periodo,${
      filters.yearRange && filters.yearRange.length === 2
        ? `${filters.yearRange[0]}-${filters.yearRange[1]}`
        : "todos"
    }`,
    `biomas,${
      filters.selectedBiomas && filters.selectedBiomas.length > 0
        ? `"${filters.selectedBiomas.join(" | ")}"`
        : "todos"
    }`,
    `estado,${
      filters.selectedStates && filters.selectedStates.length > 0
        ? `"${filters.selectedStates.join(" | ")}"`
        : filters.selectedState || "todos"
    }`,
    `nivel_risco,${
      filters.selectedRisks && filters.selectedRisks.length > 0
        ? `"${filters.selectedRisks.join(" | ")}"`
        : "todos"
    }`,
    "tipo,mock",
  ];

  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const filename = `${sanitizeFilename(pageName)}-exportacao.csv`;
  downloadBlob(blob, filename);
};

export const exportMockPdf = (pageName: string, filters: ExportFilters) => {
  const content = buildExportLines(pageName, filters).join("\n");
  const blob = new Blob([content], { type: "application/pdf" });
  const filename = `${sanitizeFilename(pageName)}-exportacao.pdf`;
  downloadBlob(blob, filename);
};
