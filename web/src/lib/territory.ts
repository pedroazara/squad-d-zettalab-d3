export const normalizeLabel = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

export const SUPPORTED_DOMAIN_STATES = [
  'Bahia',
  'Distrito Federal',
  'Goiás',
  'Maranhão',
  'Mato Grosso',
  'Mato Grosso do Sul',
  'Minas Gerais',
  'Paraná',
  'Piauí',
  'Rondônia',
  'São Paulo',
  'Tocantins',
];

export const SUPPORTED_DOMAIN_STATE_SET = new Set(
  SUPPORTED_DOMAIN_STATES.map((stateName) => normalizeLabel(stateName))
);

export const isSupportedDomainState = (value: string) =>
  SUPPORTED_DOMAIN_STATE_SET.has(normalizeLabel(value));
