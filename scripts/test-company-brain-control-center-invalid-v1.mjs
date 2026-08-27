#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { brainControlCenterModel } from './console-server.mjs';

const fixture = mkdtempSync(join(tmpdir(), 'brain-control-center-invalid-'));
const put = (relative, value) => {
  const target = join(fixture, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, value);
};

try {
  put('.cerebro/contracts/systems/broken.json', '{broken');
  put('.cerebro/contracts/sources/broken.json', '{broken');
  put('.cerebro/runtime/receipts/retrieval/broken.json', '{broken');
  put('.cerebro/runtime/judgments/nested/broken.json', '{broken');
  put('.cerebro/runtime/ledger/runs.jsonl', [
    '{broken',
    JSON.stringify({ run_id: 'failed-without-context', system_id: 'unknown', status: 'failed', completed_at: '2026-08-27T10:00:00Z' }),
  ].join('\n'));

  const model = brainControlCenterModel(fixture);
  assert.equal(model.recovery.runs.length, 1);
  assert.equal(model.recovery.runs[0].integrity.state, 'blocked');
  assert.deepEqual(model.recovery.runs[0].integrity.reasons.sort(), ['context-snapshot-missing', 'run-not-completed']);
  assert.equal(model.overview.benchmark.measured, false);
  assert.equal(model.memory.lifecycle.find((step) => step.id === 'raw').measured, false);
  assert.equal(model.learning.judgments, 0);
  assert.equal(model.architecture.protocol.system_contracts, 0);
  assert.equal(model.privacy.raw_error_exposed, false);
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

console.log('company-brain-control-center-invalid-v1: ok');
