const LEVEL_GAP = 236;
const COLUMN_START = 95;
const CENTER_Y = 340;
const ROW_GAP = 112;

const MIN_READABLE_ZOOM = {
  brain: 0.48,
  system: 0.72,
  run: 0.70,
};

function distribute(nodes, level) {
  const height = Math.max(0, (nodes.length - 1) * ROW_GAP);
  return Object.fromEntries(nodes.map((node, index) => [node.id, {
    x: COLUMN_START + (level * LEVEL_GAP),
    y: CENTER_Y - (height / 2) + (index * ROW_GAP),
  }]));
}

function artifactLevel(node, model, outputLevel) {
  if (node.id.includes('artifact-contract:consume:')) return 2;
  if (node.id.includes('artifact-contract:produce:')) return outputLevel + 1;
  const inbound = model.edges.filter((edge) => edge.target === node.id);
  const outbound = model.edges.filter((edge) => edge.source === node.id);
  const sourceKinds = new Set(inbound.map((edge) => model.nodes.find((item) => item.id === edge.source)?.kind));
  const targetKinds = new Set(outbound.map((edge) => model.nodes.find((item) => item.id === edge.target)?.kind));
  if ([...targetKinds].some((kind) => ['retrieval', 'capability', 'model', 'source'].includes(kind))) return 2;
  if (sourceKinds.has('run')) return 1;
  if ([...sourceKinds].some((kind) => ['capability', 'output'].includes(kind)) || targetKinds.has('judgment')) {
    return outputLevel + 1;
  }
  return outputLevel;
}

export function operationalLevels(model) {
  const stages = model.nodes.filter((node) => node.kind === 'stage')
    .sort((left, right) => left.id.localeCompare(right.id));
  const stageLevel = new Map(stages.map((node, index) => [node.id, 4 + index]));
  const outputLevel = stages.length ? 4 + stages.length : 4;
  return Object.fromEntries(model.nodes.map((node) => {
    let level;
    if (['source', 'run'].includes(node.kind)) level = 0;
    else if (node.kind === 'collector') level = 1;
    else if (['retrieval', 'handoff'].includes(node.kind)) level = 2;
    else if (['skill', 'capability', 'model', 'system', 'routine'].includes(node.kind)) level = 3;
    else if (node.kind === 'stage') level = stageLevel.get(node.id);
    else if (node.kind === 'output') level = outputLevel;
    else if (node.kind === 'artifact') level = artifactLevel(node, model, outputLevel);
    else if (node.kind === 'gate') level = outputLevel + 1;
    else if (node.kind === 'judgment') level = outputLevel + 2;
    else level = outputLevel;
    return [node.id, level];
  }));
}

export function operationalPositions(model) {
  const levels = operationalLevels(model);
  const columns = new Map();
  for (const node of model.nodes) {
    const level = levels[node.id];
    columns.set(level, [...(columns.get(level) || []), node]);
  }
  const positions = {};
  for (const [level, nodes] of [...columns.entries()].sort(([left], [right]) => left - right)) {
    Object.assign(positions, distribute(nodes, level));
  }
  return positions;
}

function focusIds(model) {
  if (model.graph_type === 'brain') return [];
  const preferredKinds = model.graph_type === 'run'
    ? ['retrieval', 'capability', 'output', 'gate', 'judgment']
    : ['retrieval', 'capability', 'stage', 'output'];
  const selected = [];
  for (const kind of preferredKinds) {
    const candidates = model.nodes.filter((node) => node.kind === kind);
    const candidate = candidates.find((node) => node.actual) || candidates[0];
    if (candidate) selected.push(candidate.id);
  }
  return selected;
}

export function readableViewportPlan(model, fittedZoom) {
  const minimumZoom = MIN_READABLE_ZOOM[model.graph_type] ?? 0.72;
  const clamp = fittedZoom < minimumZoom;
  return {
    zoom: clamp ? minimumZoom : fittedZoom,
    focus_ids: clamp ? focusIds(model) : [],
    clamped: clamp,
  };
}
