#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  chmodSync,
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
const PROFILE_SHA = 'a'.repeat(64);
const INDEX_CORPUS_SHA = 'c'.repeat(64);
const INDEX_RECEIPT_ID = 'source-index-receipt-11111111-1111-4111-8111-111111111111';
const INDEX_RECEIPT_REF = `source-index-receipt:${INDEX_RECEIPT_ID}`;

function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

function writePrivate(path, value) {
  write(path, value);
  if (process.platform !== 'win32') chmodSync(path, 0o600);
}

function retrievalReceipt(receiptId, overrides = {}) {
  const base = {
    protocol_version: 1,
    receipt_id: receiptId,
    kind: 'retrieval-receipt',
    status: 'completed',
    decision: 'accepted',
    reason_code: 'semantic_and_domain_evidence',
    query_sha256: 'b'.repeat(64),
    profile_sha256: PROFILE_SHA,
    started_at: '2026-08-24T11:28:59.900Z',
    completed_at: '2026-08-24T11:29:00.000Z',
    latency_ms: 100,
    adapter_invoked: true,
    provider_ref: 'local-semantic-retrieval',
    transport: 'local-unix-socket',
    index_receipt_ref: INDEX_RECEIPT_REF,
    corpus_sha256: INDEX_CORPUS_SHA,
    selected_refs: [
      { rank: 1, document_ref: 'document:system-next-best-commercial-action' },
      { rank: 2, document_ref: 'document:source-commercial-journey' },
    ],
    evidence: { candidate_similarity: 0.71, domain_coverage: 1, agreement: 2 },
    privacy: {
      query_recorded: false,
      snippet_recorded: false,
      content_recorded: false,
      raw_error_recorded: false,
      content_shared_with_inevita: false,
    },
  };
  return {
    ...base,
    ...overrides,
    evidence: { ...base.evidence, ...(overrides.evidence || {}) },
    privacy: { ...base.privacy, ...(overrides.privacy || {}) },
  };
}

function legacyRetrievalReceipt(receiptId) {
  const {
    provider_ref: _providerRef,
    index_receipt_ref: _indexReceiptRef,
    corpus_sha256: _corpusSha,
    ...legacy
  } = retrievalReceipt(receiptId, {
    transport: 'gbrain-vector-daemon',
  });
  return legacy;
}

function providerV1RetrievalReceipt(receiptId) {
  const {
    index_receipt_ref: _indexReceiptRef,
    corpus_sha256: _corpusSha,
    ...providerV1
  } = retrievalReceipt(receiptId);
  return providerV1;
}

function indexReceipt(overrides = {}) {
  const base = {
    protocol_version: 1,
    receipt_id: INDEX_RECEIPT_ID,
    kind: 'source-index-receipt',
    provider_ref: 'local-semantic-retrieval',
    provider_version: '1.0.0',
    driver: { implementation: 'gbrain', implementation_version: '0.46.30.0' },
    status: 'completed',
    reason_code: 'benchmark-gate-passed',
    plan_sha256: 'd'.repeat(64),
    corpus_sha256: INDEX_CORPUS_SHA,
    previous_receipt_ref: null,
    started_at: '2026-08-24T11:28:00.000Z',
    completed_at: '2026-08-24T11:28:30.000Z',
    document_count: 2,
    updated_refs: [
      'document:system-next-best-commercial-action',
      'document:source-commercial-journey',
    ],
    orphan_refs: [],
    documents: [
      { document_ref: 'document:system-next-best-commercial-action', source_sha256: 'e'.repeat(64) },
      { document_ref: 'document:source-commercial-journey', source_sha256: 'f'.repeat(64) },
    ],
    benchmark: {
      cases: 75,
      hit_at_3: 0.91,
      false_positive_rate: 0,
      latency_ms: 8000,
      gate_passed: true,
    },
    daemon_restarted: true,
    privacy: {
      content_recorded: false,
      query_recorded: false,
      third_party_zone_indexed: false,
    },
  };
  return {
    ...base,
    ...overrides,
    driver: { ...base.driver, ...(overrides.driver || {}) },
    benchmark: { ...base.benchmark, ...(overrides.benchmark || {}) },
    privacy: { ...base.privacy, ...(overrides.privacy || {}) },
  };
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
    retrievalReceipts: '.cerebro/runtime/receipts/retrieval',
  });

  const systemBase = example('system-contract.v2.json');
  const system = {
    ...systemBase,
    sources: [
      ...systemBase.sources,
      {
        role: 'memoria-operacional',
        source_id: 'operational-memory-index',
        required: false,
        access: 'read-only',
        freshness: 'recibo do Run',
        purpose: 'recuperar referências relevantes sem abrir conteúdo no ledger',
      },
    ],
    retrieval: {
      ...systemBase.retrieval,
      source_roles: [
        ...systemBase.retrieval.source_roles,
        {
          role: 'memoria-operacional',
          priority: 4,
          selection: 'relevant',
          filters: ['somente corpus explicitamente permitido'],
          window: 'estado aprovado no momento do Run',
          required_freshness: 'recibo do Run',
          on_unavailable: 'continue-with-gap',
        },
      ],
    },
  };
  write(join(root, '.cerebro', 'contracts', 'systems', 'analisar-funil.json'), system);
  const sourceBase = example('source-contract.v1.json');
  write(join(root, '.cerebro', 'contracts', 'sources', 'paid-media.json'), source(sourceBase, 'paid-media'));
  write(join(root, '.cerebro', 'contracts', 'sources', 'sales-ledger.json'), source(sourceBase, 'sales-ledger'));
  write(join(root, '.cerebro', 'contracts', 'sources', 'experiment-ledger.json'), source(sourceBase, 'experiment-ledger'));
  write(join(root, '.cerebro', 'contracts', 'sources', 'operational-memory-index.json'), {
    ...source(sourceBase, 'operational-memory-index'),
    connector: {
      ...sourceBase.connector,
      kind: 'retrieval-provider',
      binding_ref: 'local-semantic-retrieval',
      credential_ref: null,
      custody: 'agent-direct',
    },
  });

  writePrivate(
    join(root, '.cerebro', 'runtime', 'receipts', 'indexing', `${INDEX_RECEIPT_ID}.json`),
    indexReceipt(),
  );

  const acceptedReceiptId = 'retrieval-receipt-fixture-accepted';
  const acceptedReceiptRef = `retrieval-receipt:${acceptedReceiptId}`;
  writePrivate(
    join(root, '.cerebro', 'runtime', 'receipts', 'retrieval', `${acceptedReceiptId}.json`),
    retrievalReceipt(acceptedReceiptId),
  );

  const artifactRef = '.automacao/context-fixture.json';
  write(join(root, artifactRef), {
    observed: '2026-08-24T11:29:00.000Z',
    paid: { private_metric: 17 },
    sales: { private_metric: 9 },
    experiments: { private_hypothesis: 'fixture-only' },
    retrieval: { receipt_ref: acceptedReceiptRef },
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
          {
            source_ref: 'operational-memory-index',
            retrieval_receipt_pointer: '/retrieval/receipt_ref',
            expected_profile_sha256: PROFILE_SHA,
          },
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
  assert.equal(context.context_snapshot.accesses.length, 4);
  assert.equal(context.context_snapshot.observed_at, observed.toISOString());
  assert.equal(context.context_snapshot.accesses[0].freshness_marker, 'observed:2026-08-24T11:29:00.000Z');
  assert(context.context_snapshot.accesses[0].selected_refs[0].endsWith(':json-pointer:/paid'));
  assert.equal(JSON.stringify(context.context_snapshot).includes('private_metric'), false);
  assert.equal(JSON.stringify(context.context_snapshot).includes('fixture-only'), false);
  const retrievalAccess = context.context_snapshot.accesses.find((item) => item.source_ref.id === 'operational-memory-index');
  assert.deepEqual(retrievalAccess.selected_refs, [
    'document:system-next-best-commercial-action',
    'document:source-commercial-journey',
  ]);
  assert.equal(retrievalAccess.query, `${acceptedReceiptRef}:query-sha256:${'b'.repeat(64)}`);
  assert.equal(retrievalAccess.assurance, 'receipt-audited');
  assert(context.input_refs.includes(acceptedReceiptRef));
  assert(context.input_refs.includes(INDEX_RECEIPT_REF));
  assert.equal(JSON.stringify(context).includes('semantic_and_domain_evidence'), false);
  assert(existsSync(join(root, context.artifact_path_ref)), 'a cópia privada content-addressed precisa existir');
  assert(readFileSync(join(root, context.artifact_path_ref), 'utf8').includes('private_metric'));

  const legacyReceiptId = 'retrieval-receipt-fixture-legacy';
  const legacyReceiptRef = `retrieval-receipt:${legacyReceiptId}`;
  writePrivate(
    join(root, '.cerebro', 'runtime', 'receipts', 'retrieval', `${legacyReceiptId}.json`),
    legacyRetrievalReceipt(legacyReceiptId),
  );
  write(join(root, artifactRef), {
    observed: '2026-08-24T11:29:00.000Z',
    paid: { private_metric: 17 },
    sales: { private_metric: 9 },
    experiments: { private_hypothesis: 'fixture-only' },
    retrieval: { receipt_ref: legacyReceiptRef },
  });
  const legacyContext = prepareContextSnapshot(root, routine, accessResults);
  assert(legacyContext.input_refs.includes(legacyReceiptRef));
  write(join(root, artifactRef), {
    observed: '2026-08-24T11:29:00.000Z',
    paid: { private_metric: 17 },
    sales: { private_metric: 9 },
    experiments: { private_hypothesis: 'fixture-only' },
    retrieval: { receipt_ref: acceptedReceiptRef },
  });

  const providerV1Id = 'retrieval-receipt-fixture-provider-v1';
  const providerV1Ref = `retrieval-receipt:${providerV1Id}`;
  writePrivate(
    join(root, '.cerebro', 'runtime', 'receipts', 'retrieval', `${providerV1Id}.json`),
    providerV1RetrievalReceipt(providerV1Id),
  );
  write(join(root, artifactRef), {
    observed: '2026-08-24T11:29:00.000Z',
    paid: { private_metric: 17 },
    sales: { private_metric: 9 },
    experiments: { private_hypothesis: 'fixture-only' },
    retrieval: { receipt_ref: providerV1Ref },
  });
  const providerV1Context = prepareContextSnapshot(root, routine, accessResults);
  assert(providerV1Context.input_refs.includes(providerV1Ref));
  assert.equal(providerV1Context.input_refs.includes(INDEX_RECEIPT_REF), false);
  write(join(root, artifactRef), {
    observed: '2026-08-24T11:29:00.000Z',
    paid: { private_metric: 17 },
    sales: { private_metric: 9 },
    experiments: { private_hypothesis: 'fixture-only' },
    retrieval: { receipt_ref: acceptedReceiptRef },
  });

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

  const writeArtifactReceiptRef = (receiptRef) => write(join(root, artifactRef), {
    observed: '2026-08-24T11:29:00.000Z',
    paid: { private_metric: 17 },
    sales: { private_metric: 9 },
    experiments: { private_hypothesis: 'fixture-only' },
    retrieval: { receipt_ref: receiptRef },
  });

  const abstainedId = 'retrieval-receipt-fixture-abstained';
  const abstainedRef = `retrieval-receipt:${abstainedId}`;
  writePrivate(
    join(root, '.cerebro', 'runtime', 'receipts', 'retrieval', `${abstainedId}.json`),
    retrievalReceipt(abstainedId, {
      status: 'abstained',
      decision: 'insufficient_evidence',
      reason_code: 'below_similarity_threshold',
      selected_refs: [],
    }),
  );
  writeArtifactReceiptRef(abstainedRef);
  const abstainedContext = prepareContextSnapshot(root, routine, accessResults);
  assert.equal(abstainedContext.context_snapshot.accesses.length, 3);
  assert.deepEqual(abstainedContext.context_snapshot.gaps.at(-1), {
    source_role: 'memoria-operacional',
    reason_code: 'insufficient-evidence',
    detail_ref: abstainedRef,
  });
  assert(abstainedContext.input_refs.includes(abstainedRef));

  const unavailableId = 'retrieval-receipt-fixture-unavailable';
  const unavailableRef = `retrieval-receipt:${unavailableId}`;
  writePrivate(
    join(root, '.cerebro', 'runtime', 'receipts', 'retrieval', `${unavailableId}.json`),
    retrievalReceipt(unavailableId, {
      status: 'failed',
      decision: 'retrieval_unavailable',
      reason_code: 'retrieval-daemon-unavailable',
      selected_refs: [],
      adapter_invoked: false,
      evidence: { candidate_similarity: null, domain_coverage: null, agreement: null },
    }),
  );
  writeArtifactReceiptRef(unavailableRef);
  const unavailableContext = prepareContextSnapshot(root, routine, accessResults);
  assert.equal(unavailableContext.context_snapshot.accesses.length, 3);
  assert.equal(unavailableContext.context_snapshot.gaps.at(-1).reason_code, 'retrieval-unavailable');

  const requiredSystem = {
    ...system,
    sources: system.sources.map((item) => (
      item.source_id === 'operational-memory-index' ? { ...item, required: true } : item
    )),
  };
  write(join(root, '.cerebro', 'contracts', 'systems', 'analisar-funil.json'), requiredSystem);
  writeArtifactReceiptRef(abstainedRef);
  assert.throws(() => prepareContextSnapshot(root, routine, accessResults), /context-required-insufficient-evidence/);
  write(join(root, '.cerebro', 'contracts', 'systems', 'analisar-funil.json'), system);

  writeArtifactReceiptRef(acceptedReceiptRef);
  const profileMismatchRoutine = structuredClone(routine);
  profileMismatchRoutine.extensions.preparation.source_selections.at(-1).expected_profile_sha256 = 'c'.repeat(64);
  assert.throws(
    () => prepareContextSnapshot(root, profileMismatchRoutine, accessResults),
    /context-retrieval-receipt-profile-invalid/,
  );

  const providerMismatchId = 'retrieval-receipt-fixture-provider-mismatch';
  const providerMismatchRef = `retrieval-receipt:${providerMismatchId}`;
  writePrivate(
    join(root, '.cerebro', 'runtime', 'receipts', 'retrieval', `${providerMismatchId}.json`),
    retrievalReceipt(providerMismatchId, { provider_ref: 'other-provider' }),
  );
  writeArtifactReceiptRef(providerMismatchRef);
  assert.throws(
    () => prepareContextSnapshot(root, routine, accessResults),
    /context-retrieval-receipt-identity-invalid/,
  );

  writePrivate(
    join(root, '.cerebro', 'runtime', 'receipts', 'indexing', `${INDEX_RECEIPT_ID}.json`),
    indexReceipt({ corpus_sha256: '9'.repeat(64) }),
  );
  writeArtifactReceiptRef(acceptedReceiptRef);
  assert.throws(
    () => prepareContextSnapshot(root, routine, accessResults),
    /context-index-receipt-identity-invalid/,
  );
  writePrivate(
    join(root, '.cerebro', 'runtime', 'receipts', 'indexing', `${INDEX_RECEIPT_ID}.json`),
    indexReceipt(),
  );

  const privacyId = 'retrieval-receipt-fixture-privacy';
  const privacyRef = `retrieval-receipt:${privacyId}`;
  writePrivate(
    join(root, '.cerebro', 'runtime', 'receipts', 'retrieval', `${privacyId}.json`),
    retrievalReceipt(privacyId, { privacy: { query_recorded: true } }),
  );
  writeArtifactReceiptRef(privacyRef);
  assert.throws(() => prepareContextSnapshot(root, routine, accessResults), /context-retrieval-receipt-privacy-invalid/);

  const rawPayloadId = 'retrieval-receipt-fixture-raw-payload';
  const rawPayloadRef = `retrieval-receipt:${rawPayloadId}`;
  writePrivate(
    join(root, '.cerebro', 'runtime', 'receipts', 'retrieval', `${rawPayloadId}.json`),
    { ...retrievalReceipt(rawPayloadId), query: 'conteúdo privado que não pode entrar no recibo' },
  );
  writeArtifactReceiptRef(rawPayloadRef);
  assert.throws(() => prepareContextSnapshot(root, routine, accessResults), /context-retrieval-receipt-payload-forbidden/);

  if (process.platform !== 'win32') {
    const linkedId = 'retrieval-receipt-fixture-symlink';
    const linkedRef = `retrieval-receipt:${linkedId}`;
    const externalReceipt = join(external, `${linkedId}.json`);
    writePrivate(externalReceipt, retrievalReceipt(linkedId));
    symlinkSync(externalReceipt, join(root, '.cerebro', 'runtime', 'receipts', 'retrieval', `${linkedId}.json`));
    writeArtifactReceiptRef(linkedRef);
    assert.throws(() => prepareContextSnapshot(root, routine, accessResults), /context-retrieval-receipt-symlink-blocked/);
  }

  writeArtifactReceiptRef(acceptedReceiptRef);

  if (process.platform !== 'win32') {
    const layoutPath = join(root, '.cerebro', 'layout.json');
    const layout = JSON.parse(readFileSync(layoutPath, 'utf8'));
    symlinkSync(external, join(root, '.cerebro', 'runtime', 'linked-context'));
    write(layoutPath, { ...layout, contextArtifacts: '.cerebro/runtime/linked-context' });
    assert.throws(() => prepareContextSnapshot(root, routine, accessResults), /context-artifact-root-symlink-blocked/);
  }

  console.log('✓ Context Snapshot liga recibos de retrieval sem expor pergunta ou payload privado');
} finally {
  rmSync(root, { recursive: true, force: true });
  rmSync(external, { recursive: true, force: true });
}
