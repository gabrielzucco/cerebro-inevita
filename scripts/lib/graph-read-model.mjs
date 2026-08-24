import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { readCanvasLayout } from './canvas-layout-runtime.mjs';
import { buildConsoleReadModel } from './console-read-model.mjs';
import { latestStepStates, readExecutionTrace } from './execution-trace-runtime.mjs';
import { judgmentView } from './judgment-protocol.mjs';
import {
  listRoutineContracts,
  listRoutineRunReceipts,
  readRoutineRunReceipt,
} from './routine-protocol.mjs';
import {
  latestRunRecords,
  layout,
  readJson,
  validateSystemContract,
} from './system-protocol.mjs';

const ARTIFACT_REFS = Symbol('artifact-refs');
const ARTIFACT_POINTERS = Symbol('artifact-pointers');

function graphNode(id, kind, label, state = 'declared', details = {}) {
  return { id, kind, label, state, actual: false, details };
}

function graphEdge(id, source, target, relation, state = 'declared') {
  return { id, source, target, relation, state, actual: false };
}

function readableRef(value) {
  return String(value || '').replaceAll('_', ' ').replaceAll('-', ' ').replace(/\s+/g, ' ').trim()
    .replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

function stableId(prefix, value) {
  return `${prefix}:${createHash('sha256').update(String(value)).digest('hex').slice(0, 16)}`;
}

function applyLayout(root, key, graph) {
  const saved = readCanvasLayout(root, key);
  return {
    ...graph,
    layout: { key, editable: 'positions-only', positions: saved.positions, updated_at: saved.updated_at },
    nodes: graph.nodes.map((node) => saved.positions[node.id]
      ? { ...node, position: saved.positions[node.id] }
      : node),
  };
}

function systemContracts(root) {
  const directory = join(root, layout(root).systemContracts || '.cerebro/contracts/systems');
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort().flatMap((name) => {
    try {
      const contract = readJson(join(directory, name), 'System Contract');
      return validateSystemContract(contract).length ? [] : [contract];
    } catch { return []; }
  });
}

function findSystem(root, ref) {
  const found = systemContracts(root).find((contract) => contract.system_id === ref
    || contract.extensions?.portfolio_system_ref === ref);
  if (!found) throw new Error('graph-system-not-found');
  return found;
}

function routinesForSystem(root, systemId) {
  return listRoutineContracts(root).filter((routine) => routine.system_ref === systemId);
}

export function buildBrainGraph(root, { now = new Date() } = {}) {
  const model = buildConsoleReadModel(root, { now });
  const nodes = [];
  const edges = [];
  for (const area of model.areas) {
    nodes.push(graphNode(`area:${area.area_ref}`, 'area', area.name, 'declared', {
      system_count: area.system_refs.length,
      routine_count: area.routine_refs.length,
    }));
  }
  for (const system of model.systems) {
    const systemId = `system:${system.system_id}`;
    nodes.push(graphNode(systemId, 'system', system.name,
      system.migration_stage === 'active' ? 'active' : 'declared', {
        ref: system.system_id,
        contract_ref: system.contract_id,
        version: system.version,
        result: system.result,
        migration_stage: system.migration_stage,
      }));
    edges.push(graphEdge(`edge:area:${system.area_ref}:${system.system_id}`,
      `area:${system.area_ref}`, systemId, 'contains'));
    for (const source of system.source_refs.filter((item) => item.source_id)) {
      edges.push(graphEdge(`edge:source:${source.source_id}:${system.system_id}`,
        `source:${source.source_id}`, systemId, source.role));
    }
  }
  for (const source of model.sources) {
    nodes.push(graphNode(`source:${source.source_id}`, 'source', source.name,
      source.status === 'active' ? 'active' : 'declared', {
        ref: source.source_id,
        type: source.type,
        assurance: source.assurance,
        custody: source.custody,
      }));
  }
  for (const routine of model.routines) {
    nodes.push(graphNode(`routine:${routine.routine_id}`, 'routine', routine.name,
      routine.health_reason_code === 'active' ? 'active' : 'declared', {
        ref: routine.routine_id,
        trigger: routine.trigger,
        health: routine.health_reason_code,
      }));
    const system = model.systems.find((item) => item.contract_id === routine.system_ref
      || item.system_id === routine.system_ref);
    if (system) edges.push(graphEdge(`edge:system:${system.system_id}:routine:${routine.routine_id}`,
      `system:${system.system_id}`, `routine:${routine.routine_id}`, 'operates'));
  }
  return applyLayout(root, 'brain', {
    protocol_version: 1,
    graph_type: 'brain',
    graph_ref: 'company-brain',
    title: 'Mapa do Cérebro',
    subtitle: `${model.counts.areas} áreas · ${model.counts.systems} sistemas · ${model.counts.sources} fontes`,
    trace_origin: null,
    nodes,
    edges,
    states: { legend: ['declared', 'active', 'running', 'completed', 'gap', 'pending', 'failed', 'denied'] },
    privacy: { content_shared_with_inevita: false, payload_exposed: false },
  });
}

export function buildSystemGraph(root, systemRef) {
  const system = findSystem(root, systemRef);
  const routines = routinesForSystem(root, system.system_id);
  const sourceContracts = new Map(buildConsoleReadModel(root).sources.map((source) => [source.source_id, source]));
  const nodes = [];
  const edges = [];
  const sourceNodeByRole = new Map();
  for (const source of system.sources) {
    const id = `source:${source.source_id || source.role}`;
    const sourceContract = source.source_id ? sourceContracts.get(source.source_id) : null;
    sourceNodeByRole.set(source.role, id);
    nodes.push(graphNode(id, 'source', sourceContract?.name || source.source_id || source.role, 'declared', {
      ref: source.source_id || null,
      type: sourceContract?.type || null,
      role: source.role,
      required: source.required,
      freshness: source.freshness,
      purpose: source.purpose,
    }));
  }
  const hasCollector = routines.some((routine) => routine.extensions?.preparation);
  if (hasCollector) nodes.push(graphNode('collector', 'collector', 'Coleta determinística', 'declared', {
    binding_refs: routines.map((routine) => routine.extensions?.preparation?.binding_ref).filter(Boolean),
  }));
  nodes.push(graphNode('retrieval', 'retrieval', 'Recuperação de contexto', 'declared', {
    version: system.retrieval?.version || null,
    budget: system.retrieval?.context_budget || null,
  }));
  const skillRefs = [...new Set(routines.flatMap((routine) => routine.context.skill_refs || []))];
  for (const ref of skillRefs) nodes.push(graphNode(`skill:${ref}`, 'skill', ref.split('/').slice(-2, -1)[0] || ref, 'declared', { ref }));
  const consumedArtifacts = system.artifacts?.consumes || [];
  const producedArtifacts = system.artifacts?.produces || [];
  for (const artifact of consumedArtifacts) nodes.push(graphNode(
    `artifact-contract:consume:${artifact.role}`, 'artifact', readableRef(artifact.role), 'declared', {
      direction: 'consumes',
      artifact_type: artifact.artifact_type,
      schema_ref: artifact.schema_ref,
      accepted_versions: artifact.accepted_versions,
      required: artifact.required,
    },
  ));
  nodes.push(graphNode('capability', 'capability', system.capability.capability_id, 'declared', {
    version: system.capability.version,
    origin: system.capability.origin,
  }));
  const stageIds = system.pipeline.map((stage, index) => {
    const id = `stage:${index + 1}:${stage.state}`;
    nodes.push(graphNode(id, 'stage', readableRef(stage.state), 'declared', {
      order: index + 1,
      state_ref: stage.state,
      input: stage.input,
      output: stage.output,
      gate: stage.gate,
    }));
    return id;
  });
  nodes.push(graphNode('output', 'output', system.result.output_type, 'declared', {
    result: system.result.statement,
    done: system.result.definition_of_done,
  }));
  for (const artifact of producedArtifacts) nodes.push(graphNode(
    `artifact-contract:produce:${artifact.role}`, 'artifact', readableRef(artifact.role), 'declared', {
      direction: 'produces',
      artifact_type: artifact.artifact_type,
      schema_ref: artifact.schema_ref,
      schema_version: artifact.schema_version,
      sensitivity: artifact.sensitivity,
    },
  ));
  system.eval.deterministic_gates.forEach((gate, index) => nodes.push(
    graphNode(`gate:${index + 1}`, 'gate', gate, 'declared', { index: index + 1 }),
  ));
  nodes.push(graphNode('judgment', 'judgment', 'Julgamento humano', 'pending', {
    authority: system.result.human_gate,
    questions: system.eval.human_questions,
  }));
  for (const [role, sourceId] of sourceNodeByRole) {
    edges.push(graphEdge(`edge:${sourceId}:${hasCollector ? 'collector' : 'retrieval'}`,
      sourceId, hasCollector ? 'collector' : 'retrieval', role));
  }
  if (hasCollector) edges.push(graphEdge('edge:collector:retrieval', 'collector', 'retrieval', 'produces'));
  if (skillRefs.length) {
    for (const ref of skillRefs) edges.push(graphEdge(`edge:retrieval:skill:${ref}`, 'retrieval', `skill:${ref}`, 'loads'));
    for (const ref of skillRefs) edges.push(graphEdge(`edge:skill:${ref}:capability`, `skill:${ref}`, 'capability', 'instructs'));
  } else edges.push(graphEdge('edge:retrieval:capability', 'retrieval', 'capability', 'grounds'));
  for (const artifact of consumedArtifacts) edges.push(graphEdge(
    `edge:artifact-contract:consume:${artifact.role}:capability`,
    `artifact-contract:consume:${artifact.role}`, 'capability', 'consumed-by',
  ));
  if (stageIds.length) {
    edges.push(graphEdge(`edge:capability:${stageIds[0]}`, 'capability', stageIds[0], 'starts'));
    stageIds.slice(1).forEach((stageId, index) => edges.push(
      graphEdge(`edge:${stageIds[index]}:${stageId}`, stageIds[index], stageId, 'advances'),
    ));
    edges.push(graphEdge(`edge:${stageIds.at(-1)}:output`, stageIds.at(-1), 'output', 'produces'));
  } else edges.push(graphEdge('edge:capability:output', 'capability', 'output', 'produces'));
  for (const artifact of producedArtifacts) edges.push(graphEdge(
    `edge:output:artifact-contract:produce:${artifact.role}`,
    'output', `artifact-contract:produce:${artifact.role}`, 'materializes',
  ));
  system.eval.deterministic_gates.forEach((_gate, index) => {
    const source = index === 0 ? 'output' : `gate:${index}`;
    edges.push(graphEdge(`edge:${source}:gate:${index + 1}`, source, `gate:${index + 1}`, 'evaluates'));
  });
  edges.push(graphEdge(`edge:gate:${system.eval.deterministic_gates.length}:judgment`,
    `gate:${system.eval.deterministic_gates.length}`, 'judgment', 'hands-off'));
  return applyLayout(root, `system-${system.system_id}`, {
    protocol_version: 1,
    graph_type: 'system',
    graph_ref: system.system_id,
    title: system.name,
    subtitle: system.result.statement,
    trace_origin: null,
    nodes,
    edges,
    states: { legend: ['declared', 'running', 'completed', 'gap', 'pending', 'failed', 'denied'] },
    privacy: { content_shared_with_inevita: false, payload_exposed: false },
  });
}

function receiptById(root, receiptId) {
  try { return readRoutineRunReceipt(root, `routine-receipt:${receiptId}`); }
  catch { throw new Error('graph-run-not-found'); }
}

function setNode(graph, id, state, actual = true, extra = {}) {
  const index = graph.nodes.findIndex((node) => node.id === id);
  if (index === -1) return;
  graph.nodes[index] = { ...graph.nodes[index], state, actual, details: { ...graph.nodes[index].details, ...extra } };
}

function activateEdges(graph) {
  const actual = new Set(graph.nodes.filter((node) => node.actual).map((node) => node.id));
  graph.edges = graph.edges.map((edge) => actual.has(edge.source) && actual.has(edge.target)
    ? { ...edge, state: 'completed', actual: true }
    : edge);
}

function applyRecordedTrace(graph, events) {
  const steps = latestStepStates(events);
  for (const event of steps.values()) {
    let nodeId = null;
    if (event.source_ref) nodeId = `source:${event.source_ref}`;
    else if (event.step_type === 'collector') nodeId = 'collector';
    else if (event.step_type === 'retrieval') nodeId = 'retrieval';
    else if (event.step_type === 'skill' && event.skill_ref) nodeId = `skill:${event.skill_ref}`;
    else if (event.step_type === 'capability') nodeId = 'capability';
    else if (event.step_type === 'output') nodeId = 'output';
    else if (event.step_type === 'judgment') nodeId = 'judgment';
    if (nodeId) setNode(graph, nodeId, event.state, true, { reason_code: event.reason_code });
    if (event.step_type === 'eval' && Array.isArray(event.extensions?.gate_results)) {
      event.extensions.gate_results.forEach((gate, index) => setNode(
        graph, `gate:${index + 1}`, gate.passed ? 'completed' : 'failed', true,
        { gate_id: gate.gate_id, issue_count: gate.issue_count, not_applicable: gate.not_applicable },
      ));
    }
  }
}

function canonicalArtifactRef(ref) {
  const value = String(ref || '');
  if (value.startsWith('context-artifact:')) return value.split(':json-pointer:', 1)[0];
  return value;
}

function artifactReference(ref) {
  const value = String(ref || '');
  return Boolean(value)
    && !value.startsWith('source:')
    && !value.startsWith('access-receipt:')
    && !value.startsWith('routine-receipt:')
    && !value.startsWith('execution-trace:');
}

function artifactType(ref) {
  const value = String(ref || '').toLowerCase();
  if (value.startsWith('context-artifact:')) return 'context-snapshot';
  if (value.startsWith('collector-output:')) return 'collector-output';
  if (value.includes('.prompt.')) return 'instruction';
  if (value.includes('/outputs/')) return 'deliverable';
  if (value.startsWith('https://')) return 'external-object';
  return 'artifact';
}

function artifactLabel(ref, system) {
  const value = canonicalArtifactRef(ref);
  const kind = artifactType(value);
  if (kind === 'context-snapshot') return 'Context Snapshot';
  if (kind === 'collector-output') return `Coleta · ${readableRef(basename(value.slice('collector-output:'.length)).replace(/\.[^.]+$/, ''))}`;
  if (kind === 'instruction') return 'Instrução da rotina';
  if (kind === 'deliverable') return `Entrega · ${readableRef(system.result.output_type)}`;
  if (value.includes('app.clickup.com/')) return 'Objeto no ClickUp';
  if (value.includes('drive.google.com/')) return 'Objeto no Drive';
  const file = basename(value).replace(/\.[^.]+$/, '');
  return file && file !== '.' ? readableRef(file) : 'Artefato observado';
}

function artifactState(current, candidate) {
  const rank = { declared: 0, gap: 1, pending: 2, running: 3, skipped: 4, denied: 5, failed: 6, completed: 7 };
  return (rank[candidate] ?? 0) >= (rank[current] ?? 0) ? candidate : current;
}

function ensureArtifact(graph, ref, system, state = 'completed', { selected = false } = {}) {
  const canonical = canonicalArtifactRef(ref);
  const id = stableId('artifact', canonical);
  const existing = graph.nodes.find((node) => node.id === id);
  const pointer = String(ref).includes(':json-pointer:');
  if (existing) {
    existing.state = artifactState(existing.state, state);
    existing.actual = true;
    existing[ARTIFACT_REFS].add(String(ref));
    if (pointer || selected) existing[ARTIFACT_POINTERS].add(String(ref));
    existing.details.reference_count = existing[ARTIFACT_REFS].size;
    existing.details.selected_pointer_count = existing[ARTIFACT_POINTERS].size;
    return id;
  }
  const node = graphNode(id, 'artifact', artifactLabel(canonical, system), state, {
    ref: canonical,
    artifact_type: artifactType(canonical),
    reference_count: 1,
    selected_pointer_count: pointer || selected ? 1 : 0,
    ...(canonical.startsWith('https://') ? { external_url: canonical } : {}),
  });
  node.actual = true;
  node[ARTIFACT_REFS] = new Set([String(ref)]);
  node[ARTIFACT_POINTERS] = new Set(pointer || selected ? [String(ref)] : []);
  graph.nodes.push(node);
  return id;
}

function addActualEdge(graph, source, target, relation, state = 'completed') {
  if (!source || !target || source === target) return;
  const existing = graph.edges.find((edge) => edge.source === source && edge.target === target && edge.relation === relation);
  if (existing) {
    existing.actual = true;
    existing.state = state;
    return;
  }
  const edge = graphEdge(stableId('edge', `${source}|${target}|${relation}`), source, target, relation, state);
  edge.actual = true;
  graph.edges.push(edge);
}

function traceNodeId(event) {
  if (event.source_ref) return `source:${event.source_ref}`;
  if (event.step_type === 'collector') return 'collector';
  if (event.step_type === 'retrieval') return 'retrieval';
  if (event.step_type === 'skill' && event.skill_ref) return `skill:${event.skill_ref}`;
  if (event.step_type === 'capability' || event.step_type === 'run') return 'capability';
  if (event.step_type === 'output') return 'output';
  if (event.step_type === 'judgment') return 'judgment';
  return null;
}

function materializeRecordedArtifacts(graph, events, system) {
  const accessBySource = new Map();
  for (const event of events) {
    const stepNode = traceNodeId(event);
    if (event.source_ref) {
      const accessRefs = [...event.input_refs, ...event.output_refs].filter((ref) => ref.startsWith('access-receipt:'));
      const refs = new Set([...(accessBySource.get(event.source_ref) || []), ...accessRefs]);
      accessBySource.set(event.source_ref, refs);
      setNode(graph, `source:${event.source_ref}`, event.state, true, { access_receipt_count: refs.size });
    }
    if (event.step_type === 'collector') {
      const bindingRefs = event.input_refs.filter((ref) => /^collector-[a-z0-9-]+$/.test(ref));
      if (bindingRefs.length) setNode(graph, 'collector', event.state, true, { binding_refs: bindingRefs });
    }
    for (const ref of event.input_refs.filter((value) => artifactReference(value)
      && !(event.step_type === 'collector' && /^collector-[a-z0-9-]+$/.test(value)))) {
      const artifactId = ensureArtifact(graph, ref, system, event.state, { selected: Boolean(event.source_ref) });
      if (event.source_ref && event.step_type === 'retrieval') {
        addActualEdge(graph, `source:${event.source_ref}`, artifactId, 'selects', event.state);
      } else addActualEdge(graph, artifactId, stepNode, 'consumed-by', event.state);
    }
    if (event.step_type === 'run') continue;
    for (const ref of event.output_refs.filter(artifactReference)) {
      const artifactId = ensureArtifact(graph, ref, system, event.state);
      addActualEdge(graph, stepNode, artifactId, 'produces', event.state);
    }
  }
}

function materializeRecordArtifacts(graph, record, receipt, system) {
  if (record?.protocol_version === 2) {
    for (const access of record.context_snapshot.accesses) {
      const sourceId = `source:${access.source_ref.id}`;
      setNode(graph, sourceId, 'completed', true, { selected_ref_count: access.selected_refs.length });
      for (const ref of access.selected_refs.filter(artifactReference)) {
        const artifactId = ensureArtifact(graph, ref, system, 'completed', { selected: true });
        addActualEdge(graph, sourceId, artifactId, 'selects');
        addActualEdge(graph, artifactId, 'capability', 'grounds');
      }
    }
    for (const ref of record.output_refs.filter(artifactReference)) {
      const artifactId = ensureArtifact(graph, ref, system);
      addActualEdge(graph, 'output', artifactId, 'produces');
      addActualEdge(graph, artifactId, 'judgment', 'awaits-judgment', record.human_decision === 'pending' ? 'pending' : 'completed');
    }
  }
  for (const ref of (receipt.input_refs || []).filter(artifactReference)) {
    const artifactId = ensureArtifact(graph, ref, system);
    if (ref.startsWith('collector-output:')) addActualEdge(graph, 'collector', artifactId, 'produces');
    addActualEdge(graph, artifactId, 'capability', 'consumed-by');
  }
  if (receipt.output_ref && artifactReference(receipt.output_ref)) {
    const artifactId = ensureArtifact(graph, receipt.output_ref, system, receipt.status === 'completed' ? 'completed' : receipt.status);
    addActualEdge(graph, 'output', artifactId, 'produces', receipt.status === 'completed' ? 'completed' : receipt.status);
    addActualEdge(graph, artifactId, 'judgment', 'awaits-judgment', 'pending');
  }
}

function applyReconstructedTrace(root, graph, receipt, record) {
  for (const ref of receipt.input_refs || []) {
    if (ref.startsWith('source:')) setNode(graph, `source:${ref.slice('source:'.length)}`, 'completed');
    if (ref.startsWith('collector-output:')) setNode(graph, 'collector', 'completed');
  }
  if (record?.protocol_version === 2) {
    setNode(graph, 'retrieval', 'completed', true, {
      selected_source_count: record.context_snapshot.accesses.length,
      gap_count: record.context_snapshot.gaps.length,
    });
    for (const access of record.context_snapshot.accesses) setNode(graph, `source:${access.source_ref.id}`, 'completed');
    const system = findSystem(root, receipt.system_ref);
    for (const gap of record.context_snapshot.gaps) {
      const source = system.sources.find((item) => item.role === gap.source_role);
      if (source?.source_id) setNode(graph, `source:${source.source_id}`, 'gap', true, { reason_code: gap.reason_code });
    }
  }
  const executionState = receipt.status === 'completed' ? 'completed' : receipt.status;
  setNode(graph, 'capability', executionState, true, { reason_code: receipt.reason_code });
  if (receipt.output_ref) setNode(graph, 'output', executionState);
  if (record?.eval?.passed !== null && record?.eval?.passed !== undefined) {
    for (const node of graph.nodes.filter((item) => item.kind === 'gate')) {
      setNode(graph, node.id, record.eval.passed ? 'completed' : 'failed');
    }
  }
}

function executionGraphBase(base) {
  const stageIds = new Set(base.nodes.filter((node) => node.kind === 'stage').map((node) => node.id));
  if (!stageIds.size) return base;
  return {
    ...base,
    nodes: base.nodes.filter((node) => !stageIds.has(node.id)),
    edges: [
      ...base.edges.filter((edge) => !stageIds.has(edge.source) && !stageIds.has(edge.target)),
      graphEdge('edge:capability:output', 'capability', 'output', 'produces'),
    ],
  };
}

export function buildRunGraph(root, receiptId) {
  const receipt = receiptById(root, receiptId);
  const record = latestRunRecords(root).find((item) => item.run_id === receipt.run_id) || null;
  const system = findSystem(root, receipt.system_ref);
  const base = executionGraphBase(buildSystemGraph(root, receipt.system_ref));
  const graph = {
    ...base,
    graph_type: 'run',
    graph_ref: receipt.run_id,
    title: `Run · ${receipt.routine_id}`,
    subtitle: `${receipt.status} · ${receipt.reason_code}`,
    run: {
      run_id: receipt.run_id,
      receipt_ref: `routine-receipt:${receipt.receipt_id}`,
      started_at: receipt.started_at,
      completed_at: receipt.completed_at,
      status: receipt.status,
      reason_code: receipt.reason_code,
      eval_passed: record?.eval?.passed ?? null,
    },
  };
  let events = [];
  try { events = readExecutionTrace(root, receipt.run_id); } catch { events = []; }
  if (events.length) {
    graph.trace_origin = events[0].extensions?.origin === 'reconstructed' ? 'reconstructed' : 'recorded';
    graph.trace_ref = `execution-trace:${events[0].trace_id}`;
    graph.trace_events = events.length;
    applyRecordedTrace(graph, events);
  } else {
    graph.trace_origin = 'reconstructed';
    graph.trace_ref = null;
    graph.trace_events = 0;
    applyReconstructedTrace(root, graph, receipt, record);
  }
  try {
    const judgment = judgmentView(root, receipt.receipt_id);
    setNode(graph, 'judgment', judgment.status === 'pending' ? 'pending'
      : judgment.verdict === 'approved' ? 'completed'
        : judgment.verdict === 'rejected' ? 'failed' : 'pending', true, {
          verdict: judgment.verdict,
          decided_at: judgment.decided_at,
        });
  } catch { setNode(graph, 'judgment', 'pending', true); }
  materializeRecordArtifacts(graph, record, receipt, system);
  if (events.length) materializeRecordedArtifacts(graph, events, system);
  activateEdges(graph);
  return applyLayout(root, `run-${receipt.run_id}`, graph);
}

export function graphForLayout(root, key) {
  if (key === 'brain') return buildBrainGraph(root);
  if (key.startsWith('system-')) return buildSystemGraph(root, key.slice('system-'.length));
  if (key.startsWith('run-')) {
    const runId = key.slice('run-'.length);
    const receipt = listRoutineRunReceipts(root).find((item) => item.run_id === runId);
    if (!receipt) throw new Error('graph-run-not-found');
    return buildRunGraph(root, receipt.receipt_id);
  }
  throw new Error('graph-layout-key-invalid');
}
