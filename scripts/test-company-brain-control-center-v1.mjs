#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { brainControlCenterModel } from './console-server.mjs';

const root = resolve(process.cwd());
const app = readFileSync(resolve(root, 'console/app.js'), 'utf8');
const css = readFileSync(resolve(root, 'console/styles.css'), 'utf8');

for (const label of ['Visão geral', 'Memória', 'Recuperação', 'Aprendizado', 'Arquitetura']) {
  assert.match(app, new RegExp(label), `vista ausente: ${label}`);
}
assert.doesNotMatch(app, /Comparar versões do Cérebro/, 'a página não compara mais duas versões');
assert.match(app, /Contrato esperado/);
assert.match(app, /Contexto observado/);
assert.match(app, /Não instrumentado/);
assert.match(app, /implementação atual.*substituível/i);
for (const selector of ['.brain-overview-lead', '.brain-lifecycle', '.brain-run-table', '.brain-learning-lead', '.brain-architecture-lead']) {
  assert.match(css, new RegExp(selector.replace('.', '\\.')), `estilo ausente: ${selector}`);
}

const fixture = mkdtempSync(join(tmpdir(), 'brain-control-center-'));
const put = (relative, value) => {
  const target = join(fixture, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, typeof value === 'string' ? value : `${JSON.stringify(value)}\n`);
};

const access = ({ fresh = true, query = 'selection:recent:truth' } = {}) => ({
  source_ref: { role: 'truth', id: 'source-truth' },
  selected_refs: ['private-ref-that-must-not-leak'],
  query,
  window: 'current',
  freshness_marker: fresh ? '2026-08-27T10:00:00Z' : null,
  assurance: 'receipt-audited',
});

try {
  put('.cerebro/contracts/providers/local.json', {
    provider_id: 'local-semantic-retrieval', name: 'Índice semântico local', version: '1.0.0', status: 'active',
    driver: { implementation: 'gbrain', implementation_version: '0.46.30.0' },
    privacy: { local_only: true },
  });
  put('.cerebro/contracts/sources/source-truth.json', {
    source_id: 'source-truth', name: 'Truth', freshness: { policy: 'current' },
  });
  put('.cerebro/contracts/systems/system-a.json', {
    system_id: 'system-a', name: 'System A', version: '1.0.0', status: 'active',
    sources: [{ role: 'truth', source_id: 'source-truth', required: true, freshness: 'current' }],
    retrieval: { version: '1.0.0', evidence: { minimum_refs: 1 }, stop_conditions: ['stop safely'], fallback: { enabled: false } },
  });
  put('.cerebro/runtime/receipts/indexing/current.json', {
    receipt_id: 'index-current', status: 'completed', completed_at: '2026-08-27T10:00:00Z',
    document_count: 12, orphan_refs: [], benchmark: { cases: 10, hit_at_3: 0.9, false_positive_rate: 0, gate_passed: true },
  });
  put('.cerebro/runtime/receipts/retrieval/retrieval-receipt-good.json', {
    receipt_id: 'retrieval-receipt-good', status: 'completed', decision: 'accepted',
    reason_code: 'semantic_and_domain_evidence', latency_ms: 120,
    selected_refs: ['private-semantic-ref'], query_sha256: 'private-hash',
  });
  put('.cerebro/runtime/receipts/retrieval/retrieval-receipt-failed.json', {
    receipt_id: 'retrieval-receipt-failed', status: 'failed', decision: 'retrieval_unavailable',
    reason_code: 'adapter_failed', latency_ms: 3,
  });
  const records = [
    {
      run_id: 'run-complete', system_id: 'system-a', system_version: '1.0.0', status: 'completed',
      completed_at: '2026-08-27T10:00:00Z', eval: { passed: true }, human_decision: 'approved', outcomes: [],
      context_snapshot: { observed_at: '2026-08-27T10:00:00Z', accesses: [access()], gaps: [], conflicts: [], fallbacks: [] },
    },
    {
      run_id: 'run-limited', system_id: 'system-a', status: 'completed', completed_at: '2026-08-27T11:00:00Z',
      eval: { passed: null }, human_decision: 'pending', outcomes: [],
      context_snapshot: { observed_at: '2026-08-27T11:00:00Z', accesses: [access({ fresh: false })], gaps: [{ source_role: 'truth', reason_code: 'access-missing' }], conflicts: [], fallbacks: [] },
    },
    {
      run_id: 'run-blocked', system_id: 'system-a', status: 'failed', completed_at: '2026-08-27T12:00:00Z',
      eval: { passed: false }, human_decision: 'pending', outcomes: [],
      context_snapshot: { observed_at: '2026-08-27T12:00:00Z', accesses: [access({ query: 'retrieval-receipt:retrieval-receipt-failed:query-sha256:private' })], gaps: [], conflicts: [], fallbacks: [] },
    },
    {
      run_id: 'run-outcome', system_id: 'system-a', status: 'completed', completed_at: '2026-08-27T13:00:00Z',
      eval: { passed: true }, human_decision: 'approved', outcomes: [{ measure: 'worked', value: true }],
      context_snapshot: { observed_at: '2026-08-27T13:00:00Z', accesses: [access({ query: 'retrieval-receipt:retrieval-receipt-good:query-sha256:private' })], gaps: [], conflicts: [], fallbacks: [] },
    },
  ];
  put('.cerebro/runtime/ledger/runs.jsonl', records.map(JSON.stringify).join('\n'));
  put('.cerebro/runtime/judgments/run-complete/j1.json', { judgment_id: 'j1', run_id: 'run-complete', verdict: 'approved', decided_at: '2026-08-27T10:05:00Z' });
  put('.cerebro/runtime/judgments/run-complete/j2.json', { judgment_id: 'j2', run_id: 'run-complete', verdict: 'approved', decided_at: '2026-08-27T10:06:00Z' });
  put('.cerebro/runtime/judgments/orphan/j3.json', { judgment_id: 'j3', run_id: 'missing-run', verdict: 'approved', decided_at: '2026-08-27T10:07:00Z' });

  const model = brainControlCenterModel(fixture, {
    sources: [
      { source_id: 'source-truth', last_access: { occurred_at: '2026-08-27T10:00:00Z' }, freshness_observed: null },
      { source_id: 'source-cold', last_access: null, freshness_observed: null },
    ],
  });
  const byId = new Map(model.recovery.runs.map((run) => [run.run_id, run]));
  assert.equal(byId.get('run-complete').integrity.state, 'complete');
  assert.equal(byId.get('run-limited').integrity.state, 'limited');
  assert.deepEqual(byId.get('run-limited').integrity.reasons.sort(), ['context-gap', 'eval-pending', 'freshness-not-verifiable']);
  assert.equal(byId.get('run-blocked').integrity.state, 'blocked');
  assert.equal(byId.get('run-outcome').retrieval.mode, 'semantic-provider');
  assert.equal(byId.get('run-complete').retrieval.mode, 'contractual-direct');
  assert.equal(model.overview.sources.observed, 1);
  assert.equal(model.overview.sources.unobserved, 1);
  assert.equal(model.overview.systems_readiness.measured, false);
  assert.equal(model.memory.lifecycle.find((step) => step.id === 'raw').measured, false);
  assert.equal(model.memory.lifecycle.find((step) => step.id === 'current-context').value, 12);
  assert.equal(model.learning.outcomes, 1);
  assert.equal(model.learning.candidates, 0);
  assert.equal(model.learning.reconciliation.orphan_judgments, 1);
  assert.equal(model.learning.reconciliation.duplicate_judgments, 1);
  assert.deepEqual(model.privacy, {
    content_exposed: false, query_exposed: false, selected_refs_exposed: false,
    hashes_exposed: false, raw_error_exposed: false,
  });
  assert.doesNotMatch(JSON.stringify(model), /private-ref|private-semantic-ref|private-hash|query_sha256|selection:recent/);
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

console.log('company-brain-control-center-v1: ok');
