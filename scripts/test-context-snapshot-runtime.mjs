#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { prepareContextSnapshot } from './lib/context-snapshot-runtime.mjs';

const root = mkdtempSync(join(tmpdir(), 'company-brain-context-'));
const external = mkdtempSync(join(tmpdir(), 'company-brain-context-external-'));

function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

function example(name) {
  return JSON.parse(readFileSync(new URL(`../protocol/examples/${name}`, import.meta.url), 'utf8'));
}

function source(base, id, assurance = 'receipt-audited') {
  return {
    ...base,
    source_id: id,
    name: `Fonte ${id}`,
    assurance,
    truth: { ...base.truth, home_ref: `local:${id}` },
    connector: {
      ...base.connector,
      kind: 'local-file',
      binding_ref: null,
      credential_ref: null,
      custody: 'agent-direct',
    },
  };
}

try {
  write(join(root, 'VERSION'), 'fixture\n');
  write(join(root, 'COMECE-AQUI.md'), '# Fixture\n');
  write(join(root, '.cerebro', 'layout.json'), {
    version: 3,
    systemContracts: '.cerebro/contracts/systems',
    sourceContracts: '.cerebro/contracts/sources',
    contextArtifacts: '.cerebro/runtime/context-artifacts',
  });

  const system = example('system-contract.v2.json');
  write(join(root, '.cerebro', 'contracts', 'systems', 'analisar-funil.json'), system);
  const sourceBase = example('source-contract.v1.json');
  write(join(root, '.cerebro', 'contracts', 'sources', 'paid-media.json'), source(sourceBase, 'paid-media'));
  write(join(root, '.cerebro', 'contracts', 'sources', 'sales-ledger.json'), source(sourceBase, 'sales-ledger'));
  write(join(root, '.cerebro', 'contracts', 'sources', 'experiment-ledger.json'), source(sourceBase, 'experiment-ledger'));

  const artifactRef = '.automacao/context-fixture.json';
  write(join(root, artifactRef), {
    observed: '2026-08-24T11:29:00.000Z',
    paid: { private_metric: 17 },
    sales: { private_metric: 9 },
    experiments: { private_hypothesis: 'fixture-only' },
  });
  const observed = new Date('2026-08-24T11:29:00.000Z');
  utimesSync(join(root, artifactRef), observed, observed);

  const routine = {
    system_ref: 'analisar-funil',
    extensions: {
      preparation: {
        output_ref: artifactRef,
        source_selections: [
          { source_ref: 'paid-media', selected_pointers: ['/paid'], freshness_pointer: '/observed' },
          { source_ref: 'sales-ledger', selected_pointers: ['/sales'], freshness_pointer: '/observed' },
          { source_ref: 'experiment-ledger', selected_pointers: ['/experiments'], freshness_pointer: '/observed' },
        ],
      },
    },
  };
  const accessResults = system.sources.map((item) => ({
    source_ref: item.source_id,
    assurance: 'receipt-audited',
    decision: 'file-only',
    receipt_ref: `access-receipt:${item.source_id}`,
  }));

  const context = prepareContextSnapshot(root, routine, accessResults);
  assert.equal(context.status, 'recorded');
  assert.equal(context.context_snapshot.accesses.length, 3);
  assert.equal(context.context_snapshot.observed_at, observed.toISOString());
  assert.equal(context.context_snapshot.accesses[0].freshness_marker, 'observed:2026-08-24T11:29:00.000Z');
  assert(context.context_snapshot.accesses[0].selected_refs[0].endsWith(':json-pointer:/paid'));
  assert.equal(JSON.stringify(context.context_snapshot).includes('private_metric'), false);
  assert.equal(JSON.stringify(context.context_snapshot).includes('fixture-only'), false);
  assert(existsSync(join(root, context.artifact_path_ref)), 'a cópia privada content-addressed precisa existir');
  assert(readFileSync(join(root, context.artifact_path_ref), 'utf8').includes('private_metric'));

  assert.throws(() => prepareContextSnapshot(root, {
    ...routine,
    extensions: {
      preparation: {
        ...routine.extensions.preparation,
        source_selections: routine.extensions.preparation.source_selections.map((item) => (
          item.source_ref === 'paid-media' ? { ...item, selected_pointers: ['/missing'] } : item
        )),
      },
    },
  }, accessResults), /context-required-pointer-missing/);

  assert.throws(() => prepareContextSnapshot(root, {
    ...routine,
    extensions: {
      preparation: {
        ...routine.extensions.preparation,
        source_selections: [
          ...routine.extensions.preparation.source_selections,
          { source_ref: 'unknown-source', selected_pointers: ['/paid'], freshness_pointer: null },
        ],
      },
    },
  }, accessResults), /context-selection-source-unknown/);

  if (process.platform !== 'win32') {
    const layoutPath = join(root, '.cerebro', 'layout.json');
    const layout = JSON.parse(readFileSync(layoutPath, 'utf8'));
    symlinkSync(external, join(root, '.cerebro', 'runtime', 'linked-context'));
    write(layoutPath, { ...layout, contextArtifacts: '.cerebro/runtime/linked-context' });
    assert.throws(() => prepareContextSnapshot(root, routine, accessResults), /context-artifact-root-symlink-blocked/);
  }

  console.log('✓ Context Snapshot persiste referências privadas e bloqueia recortes inválidos');
} finally {
  rmSync(root, { recursive: true, force: true });
  rmSync(external, { recursive: true, force: true });
}
