const OPERATING_AREA_DEFINITIONS = [
  { id: 'commercial', label: 'Comercial' },
  { id: 'operations-technology', label: 'Operações & Tecnologia' },
  { id: 'product-community', label: 'Produto & Comunidade' },
];

const BUSINESS_FUNCTION_DEFINITIONS = [
  { id: 'sales', label: 'Vendas' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'product', label: 'Produto' },
  { id: 'operations', label: 'Operações' },
  { id: 'community', label: 'Comunidade' },
  { id: 'data-technology', label: 'Dados & Tecnologia' },
];

const LEGACY_OPERATING_AREAS = new Map([
  ['crescimento', 'commercial'],
  ['fundacao', 'operations-technology'],
  ['produto-comunidade', 'product-community'],
]);

const OPERATING_AREA_LABELS = new Map(OPERATING_AREA_DEFINITIONS.map((item) => [item.id, item.label]));
const BUSINESS_FUNCTION_LABELS = new Map(BUSINESS_FUNCTION_DEFINITIONS.map((item) => [item.id, item.label]));
const PRODUCT_KINDS = new Set(['business-system', 'brain-native']);
const PRODUCT_SURFACES = new Set(['systems', 'brain']);

function readable(value) {
  return String(value || 'geral').replaceAll('-', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

export function normalizeOperatingArea(value) {
  const ref = String(value || 'general');
  return LEGACY_OPERATING_AREAS.get(ref) || ref;
}

export function normalizeBusinessFunction(value) {
  const ref = String(value || 'unclassified');
  return BUSINESS_FUNCTION_LABELS.has(ref) ? ref : 'unclassified';
}

export function operatingAreaLabel(value) {
  const ref = normalizeOperatingArea(value);
  return OPERATING_AREA_LABELS.get(ref) || readable(ref);
}

export function businessFunctionLabel(value) {
  const ref = normalizeBusinessFunction(value);
  return BUSINESS_FUNCTION_LABELS.get(ref) || 'Não classificada';
}

export function systemClassification(extensions = {}, systemId = null) {
  const inferredNative = systemId === 'cerebro-base';
  const productKind = PRODUCT_KINDS.has(extensions.product_kind)
    ? extensions.product_kind
    : inferredNative ? 'brain-native' : 'business-system';
  const defaultSurface = productKind === 'brain-native' ? 'brain' : 'systems';
  return {
    operating_area: normalizeOperatingArea(extensions.operating_area || extensions.area_ref),
    business_function: normalizeBusinessFunction(extensions.business_function),
    product_kind: productKind,
    surface: PRODUCT_SURFACES.has(extensions.surface) ? extensions.surface : defaultSurface,
  };
}

export function systemTaxonomy() {
  return {
    operating_areas: OPERATING_AREA_DEFINITIONS.map((item) => ({ ...item })),
    business_functions: BUSINESS_FUNCTION_DEFINITIONS.map((item) => ({ ...item })),
  };
}
