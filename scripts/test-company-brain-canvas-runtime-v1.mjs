#!/usr/bin/env node

import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBrainGraph, buildSystemGraph } from './lib/graph-read-model.mjs';
import { listConsoleSystems } from './lib/console-read-model.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const brain = buildBrainGraph(root);
const nodeIds = new Set(brain.nodes.map((node) => node.id));

assert.equal(brain.edges.every((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)), true,
  'o mapa publicado não pode conter arestas órfãs');
assert(brain.nodes.some((node) => node.state === 'gap' && node.details?.reason_code === 'source-contract-missing'),
  'Fontes prometidas e ainda não conectadas devem aparecer como lacuna');

for (const system of listConsoleSystems(root)) {
  const graph = buildSystemGraph(root, system.system_id);
  assert.equal(graph.graph_type, 'system');
  assert.equal(graph.nodes.length > 0, true, `${system.system_id} precisa produzir um Canvas`);
}

console.log('company-brain-canvas-runtime-v1: ok');
