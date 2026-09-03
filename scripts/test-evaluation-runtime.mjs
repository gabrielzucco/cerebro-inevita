#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { evaluateRoutineOutput } from './lib/evaluation-runtime.mjs';

const root = mkdtempSync(join(tmpdir(), 'calls-evaluation-runtime-'));

function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

try {
  const sourceRef = '.cerebro/runtime/context-artifacts/call-source.md';
  const outputRef = '.cerebro/runtime/outputs/routines/call-output.md';
  const artifactRef = '.cerebro/runtime/context-artifacts/context-fixture.json';
  write(join(root, sourceRef), '[00:01:20] Precisamos fechar o próximo responsável ainda hoje.\n');
  write(join(root, outputRef), [
    '## Evidências',
    '> Precisamos fechar o próximo responsável ainda hoje. [00:01:20]',
    '',
    '## Compromissos',
    '- Definir responsável — dono: papel-lider',
    '',
  ].join('\n'));
  write(join(root, artifactRef), { call: { source_ref: sourceRef } });
  const contract = {
    extensions: {
      evaluation: {
        kind: 'registered-evaluator',
        evaluator_ref: 'calls-deterministic-v1',
        source_pointer: '/call/source_ref',
      },
    },
  };
  const result = evaluateRoutineOutput(root, contract, {
    artifact_ref: 'context-artifact:context-fixture',
    artifact_path_ref: artifactRef,
  }, outputRef);
  assert.equal(result.status, 'completed');
  assert.equal(result.passed, true);
  assert.equal(result.gate_results.length, 4);
  assert(result.gate_results.every((gate) => gate.passed));
  assert.match(result.evidence_ref, /^sha256:[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(result).includes('Precisamos fechar'), false);
  console.log('✓ Evaluator registrado de Calls executa quatro gates e devolve somente prova reference-only');
} finally {
  rmSync(root, { recursive: true, force: true });
}
