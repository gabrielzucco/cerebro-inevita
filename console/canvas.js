import { Graph, NodeEvent } from '@antv/g6';

const COLORS = {
  declared: { fill: '#151b25', stroke: '#536078', glow: 'rgba(83, 96, 120, .18)' },
  active: { fill: '#10243b', stroke: '#4da3ff', glow: 'rgba(77, 163, 255, .32)' },
  running: { fill: '#10243b', stroke: '#4da3ff', glow: 'rgba(77, 163, 255, .42)' },
  completed: { fill: '#102b24', stroke: '#42d392', glow: 'rgba(66, 211, 146, .3)' },
  gap: { fill: '#302612', stroke: '#f6bd4a', glow: 'rgba(246, 189, 74, .3)' },
  pending: { fill: '#302612', stroke: '#f6bd4a', glow: 'rgba(246, 189, 74, .24)' },
  failed: { fill: '#351722', stroke: '#ff647c', glow: 'rgba(255, 100, 124, .34)' },
  denied: { fill: '#351722', stroke: '#ff647c', glow: 'rgba(255, 100, 124, .34)' },
  skipped: { fill: '#1b1d24', stroke: '#667085', glow: 'rgba(102, 112, 133, .2)' },
};

const KIND_ACCENT = {
  source: '#4fd1c5', area: '#67a7ff', system: '#9b8cff', routine: '#5e7ce2',
  collector: '#5eead4', retrieval: '#4da3ff', skill: '#d98cff', capability: '#9b8cff',
  output: '#e2e8f0', gate: '#f6bd4a', judgment: '#f6bd4a',
};

function color(node) {
  return COLORS[node.data.state] || COLORS.declared;
}

function nodeType(datum) {
  const kind = datum.data.kind;
  if (kind === 'source') return 'circle';
  if (kind === 'capability') return 'hexagon';
  if (kind === 'gate') return 'diamond';
  if (kind === 'judgment') return 'star';
  return 'rect';
}

function nodeSize(datum) {
  const kind = datum.data.kind;
  if (kind === 'source') return 84;
  if (kind === 'gate') return 94;
  if (kind === 'capability') return 112;
  if (kind === 'judgment') return 104;
  if (kind === 'area') return [160, 66];
  if (kind === 'system') return [210, 72];
  if (kind === 'routine') return [190, 66];
  return [176, 64];
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
  const sources = model.nodes.filter((node) => node.kind === 'source');
  const collectors = model.nodes.filter((node) => node.kind === 'collector');
  const retrievals = model.nodes.filter((node) => node.kind === 'retrieval');
  const skills = model.nodes.filter((node) => node.kind === 'skill');
  const capabilities = model.nodes.filter((node) => node.kind === 'capability');
  const outputs = model.nodes.filter((node) => node.kind === 'output');
  const gates = model.nodes.filter((node) => node.kind === 'gate');
  const judgments = model.nodes.filter((node) => node.kind === 'judgment');
  const centerY = 330;
  let x = 90;
  Object.assign(positions, distribute(sources, { x, centerY, gap: 116 }));
  x += 225;
  if (collectors.length) {
    Object.assign(positions, distribute(collectors, { x, centerY }));
    x += 225;
  }
  Object.assign(positions, distribute(retrievals, { x, centerY }));
  x += 225;
  if (skills.length) {
    Object.assign(positions, distribute(skills, { x, centerY }));
    x += 225;
  }
  Object.assign(positions, distribute(capabilities, { x, centerY }));
  x += 225;
  Object.assign(positions, distribute(outputs, { x, centerY }));
  x += 225;
  Object.assign(positions, distribute(gates, { x, centerY, gap: 120 }));
  x += 240;
  Object.assign(positions, distribute(judgments, { x, centerY }));
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
      'click-select',
      ...(editable ? ['drag-element'] : []),
    ],
    node: {
      type: nodeType,
      style: {
        size: nodeSize,
        radius: 16,
        fill: (datum) => color(datum).fill,
        stroke: (datum) => color(datum).stroke,
        lineWidth: (datum) => datum.data.actual ? 2.4 : 1.2,
        shadowColor: (datum) => color(datum).glow,
        shadowBlur: (datum) => datum.data.actual ? 24 : 10,
        labelText: (datum) => datum.data.label,
        labelFill: '#f3f7fb',
        labelFontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        labelFontWeight: 650,
        labelFontSize: (datum) => ['source', 'gate'].includes(datum.data.kind) ? 11 : 12,
        labelWordWrap: true,
        labelMaxWidth: (datum) => ['source', 'gate'].includes(datum.data.kind) ? 76 : 160,
        cursor: 'pointer',
      },
      state: {
        selected: { lineWidth: 3, shadowBlur: 30 },
        actual: { lineWidth: 2.4 },
      },
      animation: { enter: 'fade', update: 'translate' },
    },
    edge: {
      type: model.graph_type === 'brain' ? 'line' : 'cubic-horizontal',
      style: {
        stroke: (datum) => datum.data.actual ? '#4da3ff' : '#344055',
        lineWidth: (datum) => datum.data.actual ? 2.1 : 1,
        opacity: (datum) => datum.data.actual ? 0.9 : 0.42,
        lineDash: (datum) => datum.data.actual ? [8, 4] : [3, 7],
        endArrow: true,
        cursor: 'pointer',
      },
      state: {
        actual: { stroke: '#4da3ff', lineWidth: 2.1, opacity: 0.9 },
        selected: { stroke: '#f3f7fb', lineWidth: 2.6 },
      },
      animation: { enter: 'path-in', update: 'fade' },
    },
  });
  graph.on(NodeEvent.CLICK, (event) => {
    const id = event.target?.id;
    if (!id) return;
    const node = model.nodes.find((item) => item.id === id);
    if (node) onInspect(node);
  });
  if (editable) {
    graph.on(NodeEvent.DRAG_END, () => onLayoutChange(allPositions(graph)));
  }
  await graph.render();
  for (const node of model.nodes) {
    if (node.actual) await graph.setElementState(node.id, ['actual'], false);
  }
  return {
    fit: () => graph.fitView({ when: 'always', direction: 'both' }, { duration: 420 }),
    positions: () => allPositions(graph),
    destroy: () => graph.destroy(),
    accentFor: (kind) => KIND_ACCENT[kind] || '#91a0b5',
  };
}
