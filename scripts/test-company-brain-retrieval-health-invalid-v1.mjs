#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { retrievalHealthModel } from './console-server.mjs';

const fixture = mkdtempSync(join(tmpdir(), 'retrieval-health-invalid-'));
const invalid = (relative) => {
  const parts = relative.split('/');
  const file = parts.pop();
  const dir = join(fixture, ...parts);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, file), '{ inválido');
};

try {
  invalid('.cerebro/contracts/providers/provider.json');
  invalid('.cerebro/runtime/receipts/indexing/receipt.json');
  invalid('.cerebro/runtime/receipts/retrieval/receipt.json');
  invalid('.cerebro/runtime/retrieval/health.json');
  invalid('.cerebro/runtime/ledger/runs.jsonl');

  const health = retrievalHealthModel(fixture);
  assert.equal(health.quality.measured, false);
  assert.equal(health.quality.percent, null);
  assert.equal(health.operation.current_status, 'unavailable');
  assert.equal(health.operation.receipts, 0);
  assert.equal(health.snapshots.observed, 0);
  assert.equal(health.privacy.content_exposed, false);
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

console.log('company-brain-retrieval-health-invalid-v1: ok');
