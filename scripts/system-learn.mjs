#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureBrain,
  ID_RE,
  latestRunRecords,
  safeRelativePath,
  VERSION_RE,
  versionGreater,
  writeJsonAtomic,
  readJson,
} from './lib/system-protocol.mjs';

const ROOT = resolve(process.env.CEREBRO_INSTALL_ROOT
  || join(dirname(fileURLToPath(import.meta.url)), '..'));
const [systemId = '', action = ''] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const confirmed = process.argv.includes('--confirm');
const approved = process.argv.includes('--approved');

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? '';
}

function options(name) {
  const prefix = `--${name}=`;
  return process.argv.filter((arg) => arg.startsWith(prefix)).map((arg) => arg.slice(prefix.length));
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function learningPath(candidateId) {
  return join(ROOT, '.cerebro', 'learning', `${candidateId}.json`);
}

function completedRun(runId) {
  return latestRunRecords(ROOT).find((run) => run.run_id === runId && run.status === 'completed');
}

try {
  ensureBrain(ROOT);
  if (!ID_RE.test(systemId)) fail('informe um system_id válido');
  if (!['propose', 'promote', 'show'].includes(action)) fail('ação válida: propose, promote ou show');

  if (action === 'show') {
    const candidateId = option('candidate-id');
    const path = learningPath(candidateId);
    if (!candidateId || !existsSync(path)) fail('candidato não encontrado');
    console.log(JSON.stringify(readJson(path), null, 2));
    process.exit(0);
  }

  if (!confirmed) fail('mudança de aprendizado exige aprovação explícita: repita com --confirm');

  if (action === 'propose') {
    const runId = option('run-id');
    const layer = option('layer');
    const correctionRef = safeRelativePath(ROOT, option('correction-ref'), { mustExist: true });
    const expectedChangeRef = option('expected-change-ref')
      ? safeRelativePath(ROOT, option('expected-change-ref'), { mustExist: true })
      : null;
    const allowedLayers = new Set(['configuration', 'pipeline', 'routine', 'capability', 'gate', 'eval', 'golden-set']);
    if (!allowedLayers.has(layer)) fail('--layer inválido');
    const run = completedRun(runId);
    if (!run || run.system_id !== systemId) fail('run concluído não encontrado para este Sistema');

    const requestedCandidateId = option('candidate-id');
    let candidate;
    let candidateId = requestedCandidateId;
    if (requestedCandidateId) {
      const path = learningPath(requestedCandidateId);
      if (!existsSync(path)) fail('candidate-id não encontrado');
      candidate = readJson(path, 'candidato de aprendizado');
      if (candidate.system_id !== systemId || candidate.layer !== layer) {
        fail('o novo caso precisa pertencer ao mesmo Sistema e camada do candidato');
      }
    } else {
      candidateId = `learn-${createHash('sha256')
        .update(`${systemId}\0${layer}\0${correctionRef}`)
        .digest('hex').slice(0, 16)}`;
      candidate = {
        protocol_version: 1,
        candidate_id: candidateId,
        system_id: systemId,
        system_version: run.system_version,
        layer,
        status: 'candidate',
        correction_ref: correctionRef,
        expected_change_ref: expectedChangeRef,
        evidence_runs: [],
        replay_runs: [],
        created_at: new Date().toISOString(),
      };
    }
    candidate.evidence_runs = [...new Set([...candidate.evidence_runs, runId])];
    candidate.occurrences = candidate.evidence_runs.length;
    candidate.updated_at = new Date().toISOString();
    writeJsonAtomic(learningPath(candidateId), candidate);
    console.log(`✓ ${candidateId}: correção candidata · ${candidate.occurrences}/3 runs comparáveis`);
    process.exit(0);
  }

  const candidateId = option('candidate-id');
  const path = learningPath(candidateId);
  if (!candidateId || !existsSync(path)) fail('candidate-id não encontrado');
  const candidate = readJson(path, 'candidato de aprendizado');
  if (candidate.system_id !== systemId) fail('candidato pertence a outro Sistema');
  if (candidate.status === 'promoted') {
    console.log(`✓ ${candidateId} já estava promovido`);
    process.exit(0);
  }
  const replayRuns = [...new Set(options('replay-run'))];
  const targetVersion = option('target-version');
  const rollbackRef = safeRelativePath(ROOT, option('rollback-ref'), { mustExist: true });
  if (!approved) fail('promoção exige --approved depois da decisão humana');
  if (!VERSION_RE.test(targetVersion)) fail('--target-version precisa ser semver');
  if (!versionGreater(targetVersion, candidate.system_version)) {
    fail(`--target-version precisa ser maior que ${candidate.system_version}`);
  }
  if ((candidate.evidence_runs || []).length < 3) fail('promoção exige três ocorrências comparáveis');
  if (replayRuns.length < 3) fail('promoção exige ao menos três --replay-run=<run-id>');
  for (const runId of replayRuns) {
    const run = completedRun(runId);
    if (!run || run.system_id !== systemId) fail(`replay inválido para este Sistema: ${runId}`);
  }
  const now = new Date().toISOString();
  const promoted = {
    ...candidate,
    status: 'promoted',
    replay_runs: replayRuns,
    target_version: targetVersion,
    rollback_ref: rollbackRef,
    human_approved: true,
    promoted_at: now,
    updated_at: now,
  };
  writeJsonAtomic(path, promoted);

  const receiptDir = join(ROOT, 'operacao', 'o-que-melhorou');
  mkdirSync(receiptDir, { recursive: true });
  writeFileSync(join(receiptDir, `${candidateId}.md`), [
    `# Aprendizado promovido — ${candidateId}`,
    '',
    `- system-id: ${systemId}`,
    `- camada: ${candidate.layer}`,
    `- ocorrências comparáveis: ${candidate.evidence_runs.length}`,
    `- replays: ${replayRuns.length}`,
    `- versão de destino: ${targetVersion}`,
    `- correção local: ${candidate.correction_ref}`,
    `- rollback: ${rollbackRef}`,
    '- aprovação humana: sim',
    '- conteúdo enviado à INEVITA: não',
    '',
  ].join('\n'), { mode: 0o600 });
  console.log(`✓ ${candidateId} promovido para ${targetVersion}; alteração do motor continua explícita`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
