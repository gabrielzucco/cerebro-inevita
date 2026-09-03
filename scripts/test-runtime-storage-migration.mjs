#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readCanvasLayout, saveCanvasLayout } from './lib/canvas-layout-runtime.mjs';
import { migrateLegacyRuntimeStorage, readOperatorRuntime } from './lib/runtime-storage.mjs';

const roots = [];

function fixture(label) {
  const root = mkdtempSync(join(tmpdir(), `cerebro-runtime-${label}-`));
  roots.push(root);
  mkdirSync(join(root, '.cerebro'), { recursive: true });
  writeFileSync(join(root, '.cerebro', 'layout.json'), `${JSON.stringify({
    version: 3,
    canvasLayouts: '.cerebro/runtime/canvas-layouts',
  }, null, 2)}\n`);
  return root;
}

try {
  const legacy = fixture('legacy');
  writeFileSync(join(legacy, '.cerebro', 'runtime'), 'codex\n', { mode: 0o600 });

  const empty = readCanvasLayout(legacy, 'brain');
  assert.deepEqual(empty.positions, {});
  assert.equal(statSync(join(legacy, '.cerebro', 'runtime')).isFile(), true,
    'abrir o cockpit não pode migrar nem escrever estado');
  assert.equal(readOperatorRuntime(legacy), 'codex');

  const migrated = migrateLegacyRuntimeStorage(legacy);
  assert.equal(migrated.migrated, true);
  assert.equal(readOperatorRuntime(legacy), 'codex');
  assert.equal(statSync(join(legacy, '.cerebro', 'runtime')).isDirectory(), true);
  assert.equal(statSync(join(legacy, '.cerebro', 'runtime')).mode & 0o777, 0o700);
  assert.equal(statSync(join(legacy, '.cerebro', 'operator-runtime')).mode & 0o777, 0o600);

  saveCanvasLayout(legacy, 'brain', { capability: { x: 120, y: 48 } }, 'qa', {
    clock: () => new Date('2026-09-02T12:00:00.000Z'),
  });
  assert.deepEqual(readCanvasLayout(legacy, 'brain').positions.capability, { x: 120, y: 48 });
  assert.equal(migrateLegacyRuntimeStorage(legacy).migrated, false, 'migração precisa ser idempotente');

  const conflict = fixture('conflict');
  writeFileSync(join(conflict, '.cerebro', 'runtime'), 'claude-code\n', { mode: 0o600 });
  writeFileSync(join(conflict, '.cerebro', 'operator-runtime'), 'codex\n', { mode: 0o600 });
  const preserved = migrateLegacyRuntimeStorage(conflict);
  assert.equal(preserved.backup_ref, 'operator-runtime.legacy-1');
  assert.equal(readFileSync(join(conflict, '.cerebro', preserved.backup_ref), 'utf8').trim(), 'claude-code');
  assert.equal(readOperatorRuntime(conflict), 'codex');
  assert.equal(existsSync(join(conflict, '.cerebro', 'runtime', 'canvas-layouts')), false);

  console.log('✓ runtime legado migra sem perda e o Canvas permanece read-only na abertura');
} finally {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
}
