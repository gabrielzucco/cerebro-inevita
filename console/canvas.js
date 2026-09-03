import { Graph, NodeEvent } from '@antv/g6';
import {
  AppWindow,
  BookOpenText,
  Boxes,
  BrainCircuit,
  Building2,
  FileChartColumn,
  FileOutput,
  Gavel,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Video,
  Webhook,
} from '@lucide/icons';
import { buildLucideDataUri } from '@lucide/icons/build';
import {
  siClickup,
  siFathom,
  siGithub,
  siGoogledrive,
  siMeta,
  siSupabase,
  siWhatsapp,
} from 'simple-icons';
import {
  operationalPositions,
  readableViewportPlan,
} from './canvas-layout-policy.js';

const KIND_ACCENT = {
  source: '#4fd1c5', area: '#67a7ff', system: '#9b8cff', routine: '#5e7ce2',
  collector: '#5eead4', retrieval: '#4da3ff', skill: '#d98cff', capability: '#9b8cff',
  stage: '#78a9ff', artifact: '#e2e8f0', output: '#e2e8f0', gate: '#f6bd4a', judgment: '#f6bd4a',
  run: '#42d392', handoff: '#59d6ff', model: '#d98cff', connector: '#5eead4',
};

const KIND_LABEL = {
  source: 'Fonte',
  area: 'Área',
  system: 'Sistema',
  routine: 'Rotina',
  collector: 'Coleta',
  retrieval: 'Contexto',
  skill: 'Skill',
  capability: 'Capability',
  stage: 'Etapa',
  artifact: 'Artefato',
  output: 'Output',
  gate: 'Gate',
  judgment: 'Julgamento',
  run: 'Execução',
  handoff: 'Handoff',
  model: 'Modelo',
  connector: 'Conector',
};

const STATE_LABEL = {
  declared: 'Declarado',
  active: 'Ativo',
  running: 'Executando',
  completed: 'Concluído',
  gap: 'Lacuna',
  pending: 'Pendente',
  failed: 'Falhou',
  denied: 'Negado',
  skipped: 'Pulado',
};

const KIND_ICON = {
  area: Building2,
  system: Boxes,
  routine: RefreshCw,
  collector: Webhook,
  retrieval: Search,
  skill: Sparkles,
  capability: BrainCircuit,
  stage: RefreshCw,
  artifact: FileOutput,
  output: FileOutput,
  gate: ShieldCheck,
  judgment: Gavel,
  run: RefreshCw,
  handoff: Share2,
  model: BrainCircuit,
  connector: Webhook,
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function simpleIconDataUri(icon, color = `#${icon.hex}`) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="${escapeHtml(icon.title)}"><path fill="${color}" d="${icon.path}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function functionalIconDataUri(icon, color) {
  return buildLucideDataUri(icon, { size: 24, color, strokeWidth: 1.8, absoluteStrokeWidth: true });
}

function sourceIcon(node) {
  const ref = `${node.id} ${node.details?.ref || ''} ${node.details?.type || ''}`.toLowerCase();
  if (ref.includes('clickup')) return simpleIconDataUri(siClickup);
  if (ref.includes('drive')) return simpleIconDataUri(siGoogledrive);
  if (ref.includes('fathom')) return simpleIconDataUri(siFathom);
  if (ref.includes('github') || ref.includes('git-repository')) return simpleIconDataUri(siGithub, '#f3f7fb');
  if (ref.includes('meta-marketing')) return simpleIconDataUri(siMeta);
  if (ref.includes('supabase')) return simpleIconDataUri(siSupabase);
  if (ref.includes('whatsapp')) return simpleIconDataUri(siWhatsapp);
  if (ref.includes('funnel') || ref.includes('experiment')) return functionalIconDataUri(FileChartColumn, '#8cc8ff');
  if (ref.includes('platform')) return functionalIconDataUri(AppWindow, '#8cc8ff');
  if (ref.includes('social')) return functionalIconDataUri(Share2, '#8cc8ff');
  if (ref.includes('vault') || ref.includes('knowledge')) return functionalIconDataUri(BookOpenText, '#8cc8ff');
  if (ref.includes('video') || ref.includes('vturb')) return functionalIconDataUri(Video, '#8cc8ff');
  return functionalIconDataUri(BookOpenText, '#8cc8ff');
}

function nodeIcon(node) {
  if (node.kind === 'source') return sourceIcon(node);
  return functionalIconDataUri(KIND_ICON[node.kind] || Boxes, KIND_ACCENT[node.kind] || '#91a0b5');
}

function nodeType() {
  return 'html';
}

// Nós compactos: círculo-ícone + label mono embaixo (linguagem de constelação,
// não de formulário). Hubs um pouco maiores que satélites.
function nodeSize(datum) {
  const kind = datum.data.kind;
  if (kind === 'area') return [150, 108];
  if (kind === 'system' || kind === 'run') return [150, 104];
  if (kind === 'routine' || kind === 'capability') return [140, 100];
  return [132, 96];
}

function nodeMarkup(datum) {
  const node = datum.data;
  const kind = KIND_LABEL[node.kind] || node.kind;
  const state = STATE_LABEL[node.state] || node.state;
  const trace = node.actual ? '<span class="brain-node-trace">REAL</span>' : '';
  return `<div class="brain-node brain-node--${escapeHtml(node.kind)} brain-node--state-${escapeHtml(node.state)}${node.actual ? ' is-actual' : ''}" data-node-id="${escapeHtml(node.id)}" title="${escapeHtml(node.label)} — ${escapeHtml(kind)} · ${escapeHtml(state)}">
    <span class="brain-node-ring"><span class="brain-node-icon"><img src="${nodeIcon(node)}" alt="" /></span>${trace}<i class="brain-node-state"></i></span>
    <span class="brain-node-copy"><strong>${escapeHtml(node.label)}</strong></span>
  </div>`;
}

function distribute(nodes, { x, centerY, gap = 126 }) {
  const height = Math.max(0, (nodes.length - 1) * gap);
  return Object.fromEntries(nodes.map((node, index) => [node.id, {
    x,
    y: centerY - (height / 2) + (index * gap),
  }]));
}

function brainPositions(model) {
  // Mandala radial: fontes (casas de verdade) no coração, sistemas no anel
  // médio agrupados por área, áreas como hubs externos, rotinas penduradas.
  // As arestas sistema→fonte convergem para o centro — o desenho é o leque.
  const positions = {};
  const areas = model.nodes.filter((node) => node.kind === 'area');
  const systems = model.nodes.filter((node) => node.kind === 'system');
  const sources = model.nodes.filter((node) => node.kind === 'source');
  const routines = model.nodes.filter((node) => node.kind === 'routine');
  const handoffs = model.nodes.filter((node) => node.kind === 'handoff');
  const areaBySystem = new Map(model.edges
    .filter((edge) => edge.relation === 'contains')
    .map((edge) => [edge.target, edge.source]));
  const systemByRoutine = new Map(model.edges
    .filter((edge) => edge.relation === 'operates')
    .map((edge) => [edge.target, edge.source]));

  const TAU = Math.PI * 2;
  const SQUASH = 0.8;
  const at = (radius, angle) => ({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * SQUASH });

  sources.forEach((source, index) => {
    positions[source.id] = at(320, -Math.PI / 2 + (index / Math.max(1, sources.length)) * TAU);
  });

  const areaOrder = [...areas.map((area) => area.id), null];
  const grouped = areaOrder.flatMap((areaId) => systems.filter((system) => (areaBySystem.get(system.id) || null) === areaId));
  const systemAngle = new Map();
  grouped.forEach((system, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(1, grouped.length)) * TAU;
    systemAngle.set(system.id, angle);
    positions[system.id] = at(560, angle);
  });

  areas.forEach((area, index) => {
    const owned = grouped.filter((system) => areaBySystem.get(system.id) === area.id);
    const angle = owned.length
      ? owned.reduce((sum, system) => sum + systemAngle.get(system.id), 0) / owned.length
      : -Math.PI / 2 + (index / Math.max(1, areas.length)) * TAU;
    positions[area.id] = at(800, angle);
  });

  routines.forEach((routine, index) => {
    const angle = systemAngle.get(systemByRoutine.get(routine.id));
    positions[routine.id] = angle === undefined
      ? at(960, -Math.PI / 2 + (index / Math.max(1, routines.length)) * TAU)
      : at(710, angle + 0.11);
  });

  handoffs.forEach((handoff, index) => {
    const inbound = model.edges.find((edge) => edge.target === handoff.id && edge.source.startsWith('system:'));
    const outbound = model.edges.find((edge) => edge.source === handoff.id && edge.target.startsWith('system:'));
    const left = positions[inbound?.source];
    const right = positions[outbound?.target];
    positions[handoff.id] = left && right
      ? { x: ((left.x + right.x) / 2) * 0.72, y: (((left.y + right.y) / 2) * 0.72) + ((index % 3) * 30) }
      : at(1020, (index / Math.max(1, handoffs.length)) * TAU);
  });
  return positions;
}

function defaultPositions(model) {
  return model.graph_type === 'brain' ? brainPositions(model) : operationalPositions(model);
}

function graphData(model) {
  const defaults = defaultPositions(model);
  return {
    nodes: model.nodes.map((node) => ({
      id: node.id,
      type: nodeType({ data: node }),
      data: node,
      states: node.actual ? ['actual'] : [],
      style: {
        x: node.position?.x ?? defaults[node.id]?.x ?? 0,
        y: node.position?.y ?? defaults[node.id]?.y ?? 0,
      },
    })),
    edges: model.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: edge,
      states: edge.actual ? ['actual'] : [],
    })),
  };
}

function layoutFor(model) {
  return undefined;
}

function allPositions(graph) {
  return Object.fromEntries(graph.getNodeData().map((node) => {
    const [x, y] = graph.getElementPosition(node.id);
    return [node.id, { x, y }];
  }));
}

export async function mountOperationalCanvas({
  container,
  model,
  editable = false,
  focusNodeId = null,
  onInspect = () => {},
  onLayoutChange = () => {},
}) {
  if (!container) throw new Error('canvas-container-required');
  container.replaceChildren();
  const data = graphData(model);
  const graph = new Graph({
    container,
    data,
    background: '#070708',
    padding: model.graph_type === 'brain' ? [72, 340, 72, 48] : [32, 340, 32, 32],
    autoFit: false,
    animation: { duration: 220, easing: 'ease-out' },
    layout: layoutFor(model),
    behaviors: [
      'drag-canvas',
      'zoom-canvas',
      ...(editable ? ['drag-element'] : []),
    ],
    node: {
      type: nodeType,
      style: {
        size: nodeSize,
        dx: (datum) => -(nodeSize(datum)[0] / 2),
        dy: (datum) => -(nodeSize(datum)[1] / 2),
        innerHTML: nodeMarkup,
        fill: 'rgba(0,0,0,0)',
        lineWidth: 0,
        opacity: 1,
        cursor: 'pointer',
      },
      state: {
        selected: { opacity: 1 },
        neighbor: { opacity: 1 },
        inactive: { opacity: 0.18 },
        actual: { opacity: 1 },
      },
      animation: { enter: false, update: 'translate' },
    },
    edge: {
      type: model.graph_type === 'brain' ? 'line' : 'cubic-horizontal',
      style: {
        stroke: (datum) => datum.data.actual ? '#4e9cf5' : '#9fb3cf',
        lineWidth: (datum) => datum.data.actual ? 1.8 : 1,
        opacity: (datum) => datum.data.actual ? 0.9 : model.graph_type === 'brain' ? 0.3 : 0.38,
        lineDash: (datum) => datum.data.actual ? [7, 4] : model.graph_type === 'brain' ? [1, 0] : [2, 6],
        endArrow: (datum) => datum.data.actual || model.graph_type !== 'brain',
        cursor: 'pointer',
      },
      state: {
        actual: { stroke: '#4e9cf5', lineWidth: 1.8, opacity: 0.85 },
        selected: { stroke: '#f4f4f5', lineWidth: 2, opacity: 0.9 },
        neighbor: { stroke: '#7ab5f8', lineWidth: 1.5, opacity: 0.66 },
        inactive: { opacity: 0.05 },
      },
      animation: { enter: false, update: 'fade' },
    },
  });
  const baselineStates = () => Object.fromEntries([
    ...model.nodes.map((node) => [node.id, node.actual ? ['actual'] : []]),
    ...model.edges.map((edge) => [edge.id, edge.actual ? ['actual'] : []]),
  ]);
  const clearDomFocus = () => {
    for (const element of container.querySelectorAll('.brain-node')) {
      element.classList.remove('is-focused', 'is-neighbor', 'is-dimmed');
    }
  };
  // Zoom semântico: o label contra-escala para continuar legível de longe;
  // muito longe, satélites recolhem o texto e sobram os hubs.
  const applyZoomBand = () => {
    let zoom = 1;
    try { zoom = graph.getZoom() || 1; } catch { return; /* runtime ainda não inicializou */ }
    container.style.setProperty('--inv-zoom', String(Math.min(2.1, Math.max(1, 1 / zoom))));
    container.dataset.zoomBand = zoom < 0.52 ? 'far' : 'near';
  };
  for (const eventName of ['viewportchange', 'aftertransform']) {
    try { graph.on(eventName, applyZoomBand); } catch { /* nome varia entre versões */ }
  }
  container.addEventListener('wheel', () => requestAnimationFrame(applyZoomBand), { passive: true });
  const fitReadable = async (duration) => {
    await graph.fitView({ when: 'always', direction: 'both' }, { duration });
    const plan = readableViewportPlan(model, graph.getZoom());
    if (plan.clamped) {
      await graph.zoomTo(plan.zoom, { duration, easing: 'ease-out' });
      if (plan.focus_ids.length) {
        await graph.focusElement(plan.focus_ids, { duration, easing: 'ease-out' });
      }
    }
    applyZoomBand();
  };
  const focusNode = async (id) => {
    const relatedEdges = graph.getRelatedEdgesData(id);
    const relatedEdgeIds = new Set(relatedEdges.map((edge) => edge.id));
    const relatedNodeIds = new Set([id]);
    for (const edge of relatedEdges) {
      relatedNodeIds.add(edge.source);
      relatedNodeIds.add(edge.target);
    }
    const states = {};
    for (const node of model.nodes) {
      states[node.id] = [
        ...(node.actual ? ['actual'] : []),
        node.id === id ? 'selected' : relatedNodeIds.has(node.id) ? 'neighbor' : 'inactive',
      ];
    }
    for (const edge of model.edges) {
      states[edge.id] = [
        ...(edge.actual ? ['actual'] : []),
        relatedEdgeIds.has(edge.id) ? 'neighbor' : 'inactive',
      ];
    }
    clearDomFocus();
    for (const element of container.querySelectorAll('.brain-node')) {
      const nodeId = element.dataset.nodeId;
      element.classList.add(nodeId === id ? 'is-focused' : relatedNodeIds.has(nodeId) ? 'is-neighbor' : 'is-dimmed');
    }
    await graph.setElementState(states, true);
  };
  graph.on(NodeEvent.CLICK, (event) => {
    const id = event.target?.id;
    if (!id) return;
    const node = model.nodes.find((item) => item.id === id);
    if (node) {
      void focusNode(id);
      onInspect(node);
    }
  });
  if (editable) {
    graph.on(NodeEvent.DRAG_END, () => onLayoutChange(allPositions(graph)));
  }
  await graph.render();
  if (focusNodeId && model.nodes.some((node) => node.id === focusNodeId)) {
    applyZoomBand();
    // foco pedido de fora (ex.: "Ver no mandala"); timeout garante que o mount
    // resolve mesmo com animações estranguladas em aba de fundo
    await Promise.race([
      (async () => {
        await focusNode(focusNodeId);
        await graph.focusElement(focusNodeId, { duration: 280, easing: 'ease-out' });
      })(),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } else {
    await fitReadable(360);
  }
  for (const node of model.nodes) {
    if (node.actual) await graph.setElementState(node.id, ['actual'], false);
  }
  return {
    fit: async () => {
      clearDomFocus();
      await graph.setElementState(baselineStates(), false);
      await fitReadable(420);
    },
    focus: async (id) => {
      await focusNode(id);
      try { await graph.focusElement(id, { duration: 320, easing: 'ease-out' }); } catch { /* nó fora do grafo atual */ }
    },
    positions: () => allPositions(graph),
    destroy: () => graph.destroy(),
    accentFor: (kind) => KIND_ACCENT[kind] || '#91a0b5',
  };
}
