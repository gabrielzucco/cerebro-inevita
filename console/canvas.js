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

const KIND_ACCENT = {
  source: '#4fd1c5', area: '#67a7ff', system: '#9b8cff', routine: '#5e7ce2',
  collector: '#5eead4', retrieval: '#4da3ff', skill: '#d98cff', capability: '#9b8cff',
  stage: '#78a9ff', artifact: '#e2e8f0', output: '#e2e8f0', gate: '#f6bd4a', judgment: '#f6bd4a',
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

function nodeSize(datum) {
  const kind = datum.data.kind;
  if (kind === 'source') return [194, 76];
  if (kind === 'area') return [190, 72];
  if (kind === 'system') return [224, 78];
  if (kind === 'routine') return [212, 74];
  if (kind === 'capability') return [216, 78];
  if (kind === 'stage') return [222, 78];
  if (kind === 'artifact') return [232, 78];
  if (kind === 'judgment') return [204, 78];
  return [204, 74];
}

function nodeMarkup(datum) {
  const node = datum.data;
  const kind = KIND_LABEL[node.kind] || node.kind;
  const state = STATE_LABEL[node.state] || node.state;
  const trace = node.actual ? '<span class="brain-node-trace">REAL</span>' : '';
  return `<div class="brain-node brain-node--${escapeHtml(node.kind)} brain-node--state-${escapeHtml(node.state)}${node.actual ? ' is-actual' : ''}" data-node-id="${escapeHtml(node.id)}" title="${escapeHtml(node.label)}">
    <span class="brain-node-icon"><img src="${nodeIcon(node)}" alt="" /></span>
    <span class="brain-node-copy"><small>${escapeHtml(kind)} <i></i> ${escapeHtml(state)}</small><strong>${escapeHtml(node.label)}</strong></span>
    ${trace}
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
  const positions = {};
  const areas = model.nodes.filter((node) => node.kind === 'area');
  const systems = model.nodes.filter((node) => node.kind === 'system');
  const sources = model.nodes.filter((node) => node.kind === 'source');
  const routines = model.nodes.filter((node) => node.kind === 'routine');
  const areaBySystem = new Map(model.edges
    .filter((edge) => edge.relation === 'contains')
    .map((edge) => [edge.target, edge.source]));
  const systemByRoutine = new Map(model.edges
    .filter((edge) => edge.relation === 'operates')
    .map((edge) => [edge.target, edge.source]));
  const systemsBySource = new Map();
  for (const edge of model.edges.filter((item) => item.source.startsWith('source:'))) {
    systemsBySource.set(edge.source, [...(systemsBySource.get(edge.source) || []), edge.target]);
  }

  const clusterWidth = 570;
  const clusterGap = 90;
  for (const [areaIndex, area] of areas.entries()) {
    const left = 70 + areaIndex * (clusterWidth + clusterGap);
    const center = left + clusterWidth / 2;
    positions[area.id] = { x: center, y: 70 };
    const areaSystems = systems.filter((system) => areaBySystem.get(system.id) === area.id);
    areaSystems.forEach((system, index) => {
      positions[system.id] = {
        x: left + 145 + ((index % 2) * 280),
        y: 210 + (Math.floor(index / 2) * 124),
      };
    });
    const systemRows = Math.max(1, Math.ceil(areaSystems.length / 2));
    const areaSources = sources.filter((source) => {
      const linked = systemsBySource.get(source.id) || [];
      return linked.length && areaBySystem.get(linked[0]) === area.id;
    });
    const sourceStart = 210 + (systemRows * 124) + 70;
    areaSources.forEach((source, index) => {
      positions[source.id] = {
        x: left + 90 + ((index % 3) * 195),
        y: sourceStart + (Math.floor(index / 3) * 118),
      };
    });
    const sourceRows = Math.max(1, Math.ceil(areaSources.length / 3));
    const areaRoutines = routines.filter((routine) => {
      const system = systemByRoutine.get(routine.id);
      return system && areaBySystem.get(system) === area.id;
    });
    areaRoutines.forEach((routine, index) => {
      positions[routine.id] = {
        x: left + 170 + ((index % 2) * 230),
        y: sourceStart + (sourceRows * 118) + 70,
      };
    });
  }
  return positions;
}

function operationalPositions(model) {
  const positions = {};
  const depth = new Map(model.nodes.map((node) => [node.id, 0]));
  for (let pass = 0; pass < model.nodes.length; pass += 1) {
    let changed = false;
    for (const edge of model.edges) {
      if (!depth.has(edge.source) || !depth.has(edge.target)) continue;
      const candidate = depth.get(edge.source) + 1;
      if (candidate > depth.get(edge.target) && candidate <= model.nodes.length) {
        depth.set(edge.target, candidate);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const gateDepths = model.nodes.filter((node) => node.kind === 'gate').map((node) => depth.get(node.id) || 0);
  if (gateDepths.length) {
    const gateDepth = Math.min(...gateDepths);
    for (const node of model.nodes.filter((item) => item.kind === 'gate')) depth.set(node.id, gateDepth);
    for (const node of model.nodes.filter((item) => item.kind === 'judgment')) depth.set(node.id, gateDepth + 1);
  }
  const layers = new Map();
  for (const node of model.nodes) {
    const level = depth.get(node.id) || 0;
    layers.set(level, [...(layers.get(level) || []), node]);
  }
  for (const [level, nodes] of [...layers.entries()].sort(([a], [b]) => a - b)) {
    Object.assign(positions, distribute(nodes, { x: 95 + (level * 248), centerY: 340, gap: 112 }));
  }
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
  onInspect = () => {},
  onLayoutChange = () => {},
}) {
  if (!container) throw new Error('canvas-container-required');
  container.replaceChildren();
  const data = graphData(model);
  const graph = new Graph({
    container,
    data,
    background: 'transparent',
    padding: 72,
    autoFit: 'view',
    animation: { duration: 440, easing: 'ease-out' },
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
        cursor: 'pointer',
      },
      state: {
        selected: { opacity: 1, halo: true, haloStroke: '#f3f7fb', haloStrokeOpacity: 0.2, haloLineWidth: 7 },
        neighbor: { opacity: 1 },
        inactive: { opacity: 0.18 },
        actual: { opacity: 1 },
      },
      animation: { enter: 'fade', update: 'translate' },
    },
    edge: {
      type: model.graph_type === 'brain' ? 'line' : 'cubic-horizontal',
      style: {
        stroke: (datum) => datum.data.actual ? '#4da3ff' : '#334057',
        lineWidth: (datum) => datum.data.actual ? 2.1 : 1,
        opacity: (datum) => datum.data.actual ? 0.92 : model.graph_type === 'brain' ? 0.16 : 0.3,
        lineDash: (datum) => datum.data.actual ? [8, 4] : [3, 7],
        endArrow: (datum) => datum.data.actual || model.graph_type !== 'brain',
        cursor: 'pointer',
      },
      state: {
        actual: { stroke: '#4da3ff', lineWidth: 2.1, opacity: 0.9 },
        selected: { stroke: '#f3f7fb', lineWidth: 2.4, opacity: 0.94 },
        neighbor: { stroke: '#6db6ff', lineWidth: 1.8, opacity: 0.78 },
        inactive: { opacity: 0.035 },
      },
      animation: { enter: 'path-in', update: 'fade' },
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
  const readableZoom = 0.82;
  if (model.graph_type === 'brain' && graph.getZoom() < readableZoom) {
    await graph.zoomTo(readableZoom, { duration: 360, easing: 'ease-out' });
  }
  for (const node of model.nodes) {
    if (node.actual) await graph.setElementState(node.id, ['actual'], false);
  }
  return {
    fit: async () => {
      clearDomFocus();
      await graph.setElementState(baselineStates(), false);
      await graph.fitView({ when: 'always', direction: 'both' }, { duration: 420 });
    },
    positions: () => allPositions(graph),
    destroy: () => graph.destroy(),
    accentFor: (kind) => KIND_ACCENT[kind] || '#91a0b5',
  };
}
