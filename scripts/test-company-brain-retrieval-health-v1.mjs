#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { retrievalHealthModel } from './console-server.mjs';

const root = resolve(process.cwd());
const app = readFileSync(resolve(root, 'console/app.js'), 'utf8');
const css = readFileSync(resolve(root, 'console/styles.css'), 'utf8');

assert.match(app, /Qualidade local da recuperação/, 'porcentagem precisa dizer o que mede');
assert.match(app, /Hit@3/, 'interface precisa nomear a métrica comparável');
assert.match(app, /não é ranking da Society/i, 'score local não pode fingir comparação de rede');
assert.match(app, /implementação atual e substituível/i, 'GBrain não pode virar o nome do produto');
assert.doesNotMatch(app, /GraphRAG saudável/i, 'interface não pode afirmar GraphRAG sem rota observada');

for (const selector of ['.brain-retrieval-health', '.retrieval-quality-score', '.retrieval-evidence-list', '.retrieval-operations']) {
  assert.match(css, new RegExp(selector.replace('.', '\\.')), `estilo ausente: ${selector}`);
}

const fixture = mkdtempSync(join(tmpdir(), 'retrieval-health-'));
const put = (relative, value) => {
  const target = join(fixture, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, typeof value === 'string' ? value : `${JSON.stringify(value)}\n`);
};

try {
  put('.cerebro/contracts/providers/local-semantic-retrieval.json', {
    provider_id: 'local-semantic-retrieval', name: 'Índice semântico local', version: '1.0.0', status: 'active',
    driver: { implementation: 'gbrain', implementation_version: '0.46.30.0' },
    privacy: { local_only: true, query_persisted: false, content_persisted_in_receipt: false },
  });
  put('.cerebro/runtime/retrieval/health.json', {
    status: 'healthy', circuit: 'closed', consecutive_failures: 0,
    last_success_at: '2026-08-27T01:34:45.034Z',
    privacy: { query_recorded: false, content_recorded: false, raw_error_recorded: false },
  });
  put('.cerebro/runtime/receipts/indexing/older.json', {
    receipt_id: 'source-index-receipt-old', status: 'completed', completed_at: '2026-08-26T01:00:00Z',
    provider_ref: 'local-semantic-retrieval', document_count: 20, orphan_refs: ['document:orphan'],
    benchmark: { cases: 40, hit_at_3: 0.75, false_positive_rate: 0.1, gate_passed: false },
  });
  put('.cerebro/runtime/receipts/indexing/current.json', {
    receipt_id: 'source-index-receipt-current', status: 'completed', completed_at: '2026-08-27T01:27:55.910Z',
    provider_ref: 'local-semantic-retrieval', provider_version: '1.0.0',
    driver: { implementation: 'gbrain', implementation_version: '0.46.30.0' },
    document_count: 38, orphan_refs: [],
    benchmark: { cases: 75, hit_at_3: 0.9142857142857143, false_positive_rate: 0, gate_passed: true },
    corpus_sha256: 'não deve aparecer', documents: [{ document_ref: 'document:private' }],
  });
  put('.cerebro/runtime/receipts/retrieval/accepted.json', {
    status: 'completed', decision: 'accepted', reason_code: 'semantic_and_domain_evidence',
    completed_at: '2026-08-27T01:34:45.034Z', latency_ms: 500,
    query_sha256: 'não deve aparecer', selected_refs: [{ document_ref: 'document:private' }],
  });
  put('.cerebro/runtime/receipts/retrieval/abstained.json', {
    status: 'abstained', decision: 'insufficient_evidence', reason_code: 'insufficient_domain_coverage',
    completed_at: '2026-08-27T01:20:00.000Z', latency_ms: 700,
  });
  put('.cerebro/runtime/receipts/retrieval/failed.json', {
    status: 'failed', decision: 'retrieval_unavailable', reason_code: 'adapter_failed',
    completed_at: '2026-08-26T15:01:08.502Z', latency_ms: 100,
  });
  put('.cerebro/runtime/ledger/runs.jsonl', [
    { run_id: 'run-1', protocol_version: 2, context_snapshot: { accesses: [], gaps: [], conflicts: [] } },
    { run_id: 'run-2', protocol_version: 2, context_snapshot: { accesses: [], gaps: [{ reason: 'missing' }], conflicts: [] } },
  ].map(JSON.stringify).join('\n'));

  const health = retrievalHealthModel(fixture);
  assert.equal(health.quality.measured, true);
  assert.equal(health.quality.metric, 'hit_at_3');
  assert.equal(health.quality.percent, 91.4);
  assert.equal(health.quality.cases, 75);
  assert.equal(health.quality.false_positive_percent, 0);
  assert.equal(health.quality.gate_passed, true);
  assert.equal(health.index.documents, 38);
  assert.equal(health.index.orphans, 0);
  assert.equal(health.provider.provider_id, 'local-semantic-retrieval');
  assert.equal(health.provider.implementation, 'gbrain');
  assert.equal(health.operation.current_status, 'healthy');
  assert.deepEqual(health.operation.decisions, { accepted: 1, insufficient_evidence: 1, retrieval_unavailable: 1 });
  assert.equal(health.snapshots.complete, 2);
  assert.equal(health.snapshots.gaps, 1);
  assert.equal(health.snapshots.conflicts, 0);
  assert.equal(health.comparability.network_ready, false);
  assert.doesNotMatch(JSON.stringify(health), /query_sha256|selected_refs|documents\":\[|corpus_sha256|não deve aparecer/);

  const empty = retrievalHealthModel(join(fixture, 'missing'));
  assert.equal(empty.quality.measured, false);
  assert.equal(empty.quality.percent, null);
  assert.equal(empty.operation.current_status, 'unavailable');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

console.log('company-brain-retrieval-health-v1: ok');
