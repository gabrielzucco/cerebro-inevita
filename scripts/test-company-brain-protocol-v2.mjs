#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  runRecordView,
  systemContractView,
  validateAccessGrant,
  validateRunRecord,
  validateSourceContract,
  validateSystemContract,
} from './lib/system-protocol.mjs';

const ROOT = resolve(process.cwd());
const sandbox = mkdtempSync(join(tmpdir(), 'company-brain-protocol-v2-'));
const external = mkdtempSync(join(tmpdir(), 'company-brain-source-'));
const env = { ...process.env, CEREBRO_INSTALL_ROOT: sandbox, CEREBRO_TELEMETRY: 'off' };

function json(path) {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
}

function clone(value) {
  return structuredClone(value);
}

function expectValid(label, validate, value) {
  const errors = validate(value);
  if (errors.length) throw new Error(`${label} deveria passar: ${errors.join(' · ')}`);
}

function expectInvalid(label, validate, value, expected) {
  const errors = validate(value);
  if (!errors.some((error) => error.includes(expected))) {
    throw new Error(`${label} deveria reprovar com "${expected}": ${errors.join(' · ')}`);
  }
}

function run(script, args) {
  return execFileSync(process.execPath, [join(ROOT, 'scripts', script), ...args], {
    cwd: ROOT,
    env,
    encoding: 'utf8',
  });
}

function fails(script, args, expected) {
  const result = spawnSync(process.execPath, [join(ROOT, 'scripts', script), ...args], {
    cwd: ROOT,
    env,
    encoding: 'utf8',
  });
  if (result.status === 0 || !result.stderr.includes(expected)) {
    throw new Error(`${script} deveria falhar com "${expected}": ${result.stderr || result.stdout}`);
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

try {
  const source = json('protocol/examples/source-contract.v1.json');
  const systemV2 = json('protocol/examples/system-contract.v2.json');
  const runV2 = json('protocol/examples/run-record.v2.json');
  const grant = json('protocol/examples/access-grant.v1.json');
  const systemV1 = json('templates/sistema/contract.json');
  const runV1 = {
    protocol_version: 1,
    run_id: 'run-file-only-001',
    system_id: 'meu-sistema',
    system_version: '0.1.0',
    capability: null,
    status: 'completed',
    started_at: '2026-08-23T17:00:00.000Z',
    completed_at: '2026-08-23T17:01:00.000Z',
    entity_refs: [],
    source_refs: [],
    output_refs: ['operacao/execucoes/output.md'],
    eval: { version: '0.1.0', passed: true },
    human_decision: 'approved',
    correction_ref: null,
    outcomes: [],
    privacy: { content_shared_with_inevita: false },
  };

  expectValid('Source Contract V1', validateSourceContract, source);
  expectValid('System Contract V1', validateSystemContract, systemV1);
  expectValid('System Contract V2', validateSystemContract, systemV2);
  expectValid('Run Record V1', validateRunRecord, runV1);
  expectValid('Run Record V2', validateRunRecord, runV2);
  expectValid('Access Grant V1', validateAccessGrant, grant);

  if (systemContractView(systemV1).retrieval_status !== 'retrieval-not-declared') {
    throw new Error('dual-read inventou retrieval em System Contract V1');
  }
  if (systemContractView(systemV2).retrieval_status !== 'declared') {
    throw new Error('dual-read perdeu retrieval do System Contract V2');
  }
  if (runRecordView(runV1).context_status !== 'context-not-recorded') {
    throw new Error('dual-read inventou Context Snapshot em Run Record V1');
  }
  if (runRecordView(runV2).context_status !== 'recorded') {
    throw new Error('dual-read perdeu Context Snapshot do Run Record V2');
  }

  const unknownV1 = clone(systemV1);
  unknownV1.retrieval = {};
  expectInvalid('campo V2 em V1', validateSystemContract, unknownV1, 'retrieval não é permitido');

  const retrievalWithoutFallback = clone(systemV2);
  delete retrievalWithoutFallback.retrieval.fallback;
  expectInvalid('retrieval sem fallback', validateSystemContract, retrievalWithoutFallback, 'retrieval.fallback precisa ser objeto');

  const retrievalWithoutStop = clone(systemV2);
  retrievalWithoutStop.retrieval.stop_conditions = [];
  expectInvalid('retrieval sem parada', validateSystemContract, retrievalWithoutStop, 'stop_conditions precisa ter pelo menos 1');

  const snapshotWithoutProvenance = clone(runV2);
  snapshotWithoutProvenance.context_snapshot.accesses[0].selected_refs = [];
  expectInvalid('snapshot sem proveniência', validateRunRecord, snapshotWithoutProvenance, 'selected_refs precisa ter pelo menos 1');

  const snapshotWithRaw = clone(runV2);
  snapshotWithRaw.context_snapshot.accesses[0].raw_content = 'payload não permitido';
  expectInvalid('snapshot com bruto', validateRunRecord, snapshotWithRaw, 'raw_content não é permitido');

  const snapshotWithSecret = clone(runV2);
  snapshotWithSecret.context_snapshot.accesses[0].query = 'Bearer abcdefghijklmnopqrstuvwxyz123456';
  expectInvalid('snapshot com segredo', validateRunRecord, snapshotWithSecret, 'parece conter segredo');

  const sourceWithRaw = clone(source);
  sourceWithRaw.raw_content = 'payload não permitido';
  expectInvalid('source com bruto', validateSourceContract, sourceWithRaw, 'raw_content não é permitido');

  const dishonestLocalSource = clone(source);
  dishonestLocalSource.type = 'local-folder';
  expectInvalid('fonte local com garantia falsa', validateSourceContract, dishonestLocalSource, 'fonte local não pode declarar runtime-enforced');

  const grantWithoutApprover = clone(grant);
  delete grantWithoutApprover.approved_by;
  expectInvalid('grant sem aprovador', validateAccessGrant, grantWithoutApprover, 'approved_by obrigatório');

  const grantWithoutCustody = clone(grant);
  grantWithoutCustody.custody = 'agent-direct';
  expectInvalid('grant com custódia incompatível', validateAccessGrant, grantWithoutCustody, 'runtime-enforced exige custody runtime-exclusive');

  const grantWithSecret = clone(grant);
  grantWithSecret.credential_ref = 'sk-abcdefghijklmnopqrstuvwxyz123456';
  expectInvalid('grant com segredo', validateAccessGrant, grantWithSecret, 'parece conter segredo');

  const grantWithCamelCaseSecret = clone(grant);
  grantWithCamelCaseSecret.extensions = { apiKey: 'valor-curto' };
  expectInvalid('grant com campo de segredo disfarçado', validateAccessGrant, grantWithCamelCaseSecret, 'carrega payload/segredo');

  const systemV1Schema = readFileSync(join(ROOT, 'protocol', 'system-contract.schema.json'));
  const runV1Schema = readFileSync(join(ROOT, 'protocol', 'run-record.schema.json'));
  if (sha256(systemV1Schema) !== '21121ad06dbc219030972b990fdbd83307e7d42d052abc50bd7861a553de423a') {
    throw new Error('system-contract-v1 foi alterado');
  }
  if (sha256(runV1Schema) !== '14562c240d6049b7066a2979cacfde06e91c90beddc2fef30f80c6049fe8ff80') {
    throw new Error('run-record-v1 foi alterado');
  }

  mkdirSync(join(sandbox, '.cerebro', 'sistemas'), { recursive: true });
  mkdirSync(join(sandbox, 'conexoes', 'configuradas'), { recursive: true });
  writeFileSync(join(sandbox, 'COMECE-AQUI.md'), '# sandbox\n');
  writeFileSync(join(sandbox, 'VERSION'), '9.9.9\n');
  writeFileSync(join(sandbox, '.cerebro', 'layout.json'), JSON.stringify({
    version: 3,
    runLedger: '.cerebro/ledger/runs.jsonl',
  }));

  const sourcePath = join(external, 'history.txt');
  const sourcePayload = 'evidência que a migração não pode abrir nem alterar\n';
  writeFileSync(sourcePath, sourcePayload);
  const sourceBefore = {
    content: readFileSync(sourcePath),
    mtime: statSync(sourcePath).mtimeMs,
  };
  const registry = {
    version: 1,
    sources: [{
      id: 'legacy-source',
      label: 'Fonte legada',
      type: 'local-file',
      location: sourcePath,
      access: 'read-only',
      sourceOfTruth: true,
      sensitivity: 'private',
      scope: 'primeiro caso',
      refresh: 'manual',
      status: 'active',
      createdAt: '2026-08-22T18:00:00.000Z',
      updatedAt: '2026-08-22T18:00:00.000Z',
    }],
  };
  const registryPath = join(sandbox, 'conexoes', 'configuradas', 'fontes.json');
  const registryBefore = `${JSON.stringify(registry, null, 2)}\n`;
  writeFileSync(registryPath, registryBefore);

  const preview = JSON.parse(run('source-contract.mjs', ['migrate-registry']));
  const migratedPath = join(sandbox, '.cerebro', 'contracts', 'sources', 'legacy-source.json');
  if (preview.mode !== 'preview' || preview.changes[0]?.action !== 'create') {
    throw new Error('preview de migração não expôs diff create');
  }
  if (existsSync(migratedPath)) throw new Error('preview escreveu Source Contract sem confirmação');
  if (preview.source_guarantee.opened || preview.source_guarantee.copied || preview.source_guarantee.modified) {
    throw new Error('preview declarou acesso indevido à Fonte');
  }

  const applied = JSON.parse(run('source-contract.mjs', ['migrate-registry', '--confirm']));
  if (applied.mode !== 'applied' || applied.created.length !== 1 || !existsSync(migratedPath)) {
    throw new Error('migração confirmada não criou exatamente um Source Contract');
  }
  expectValid('Source Contract migrado', validateSourceContract, JSON.parse(readFileSync(migratedPath, 'utf8')));
  const sourceAfter = { content: readFileSync(sourcePath), mtime: statSync(sourcePath).mtimeMs };
  if (!sourceBefore.content.equals(sourceAfter.content) || sourceBefore.mtime !== sourceAfter.mtime) {
    throw new Error('migração abriu ou alterou a Fonte externa');
  }
  if (readFileSync(registryPath, 'utf8') !== registryBefore) throw new Error('migração reescreveu o registro legado');

  const repeated = JSON.parse(run('source-contract.mjs', ['migrate-registry', '--confirm']));
  if (repeated.created.length !== 0 || repeated.unchanged.length !== 1) {
    throw new Error('migração não é idempotente');
  }

  const v2ContractPath = join(sandbox, '.cerebro', 'contracts', 'analisar-funil.json');
  writeFileSync(v2ContractPath, `${JSON.stringify(systemV2, null, 2)}\n`);
  writeFileSync(join(sandbox, '.cerebro', 'sistemas', 'analisar-funil.json'), `${JSON.stringify({
    system_id: 'analisar-funil',
    package_version: '0.2.0',
    contract_path: '.cerebro/contracts/analisar-funil.json',
    status: 'configuring',
  }, null, 2)}\n`);
  fails('system-run.mjs', ['analisar-funil', 'start'], 'System Contract V2 exige runner governado');

  console.log('✓ protocolo V2: dual-read, contratos fechados, anti-slop e migração sem tocar a Fonte');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
  rmSync(external, { recursive: true, force: true });
}
