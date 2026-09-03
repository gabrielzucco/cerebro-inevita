#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  operationalLevels,
  operationalPositions,
  readableViewportPlan,
} from '../console/canvas-layout-policy.js';

const model = {
  graph_type: 'run',
  nodes: [
    { id: 'source:experiments', kind: 'source', actual: true },
    { id: 'collector', kind: 'collector', actual: false },
    { id: 'retrieval', kind: 'retrieval', actual: true },
    { id: 'artifact:input', kind: 'artifact', actual: true },
    { id: 'capability', kind: 'capability', actual: true },
    { id: 'output', kind: 'output', actual: true },
    { id: 'artifact:output', kind: 'artifact', actual: true },
    { id: 'gate:1', kind: 'gate', actual: true },
    { id: 'judgment', kind: 'judgment', actual: true },
    { id: 'run:producer', kind: 'run', actual: true },
  ],
  edges: [
    { source: 'source:experiments', target: 'collector', relation: 'collects' },
    { source: 'collector', target: 'retrieval', relation: 'produces' },
    { source: 'source:experiments', target: 'artifact:input', relation: 'selects' },
    { source: 'artifact:input', target: 'source:experiments', relation: 'consumed-by' },
    { source: 'artifact:input', target: 'capability', relation: 'grounds' },
    { source: 'retrieval', target: 'capability', relation: 'grounds' },
    { source: 'capability', target: 'output', relation: 'produces' },
    { source: 'output', target: 'artifact:output', relation: 'produces' },
    { source: 'artifact:output', target: 'judgment', relation: 'awaits-judgment' },
    { source: 'output', target: 'gate:1', relation: 'evaluates' },
    { source: 'gate:1', target: 'judgment', relation: 'hands-off' },
    { source: 'run:producer', target: 'artifact:input', relation: 'hands-off' },
  ],
};

const levels = operationalLevels(model);
assert.equal(levels['source:experiments'], 0);
assert.equal(levels['artifact:input'], 2, 'ciclo de proveniência não pode criar novas colunas');
assert.equal(levels.capability, 3);
assert.equal(levels.output, 4);
assert.equal(levels['artifact:output'], 5);
assert.equal(levels.judgment, 6);

const positions = operationalPositions(model);
const xs = Object.values(positions).map(({ x }) => x);
assert.ok(Math.max(...xs) - Math.min(...xs) <= 6 * 236, 'Run deve caber em sete colunas semânticas');

const plan = readableViewportPlan(model, 0.24);
assert.equal(plan.zoom, 0.70);
assert.equal(plan.clamped, true);
assert.ok(plan.focus_ids.includes('capability'));
assert.ok(plan.focus_ids.includes('output'));
assert.ok(plan.focus_ids.includes('judgment'));
assert.ok(!plan.focus_ids.includes('source:experiments'), 'foco legível não centraliza no vão entre extremos');

const alreadyReadable = readableViewportPlan(model, 0.9);
assert.equal(alreadyReadable.zoom, 0.9);
assert.equal(alreadyReadable.clamped, false);
assert.deepEqual(alreadyReadable.focus_ids, []);

console.log('✅ Canvas layout readability: semantic columns and readable framing verified.');
