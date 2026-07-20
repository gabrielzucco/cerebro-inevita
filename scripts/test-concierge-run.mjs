#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const script = join(root, 'scripts', 'concierge-run.mjs');
const sandbox = mkdtempSync(join(tmpdir(), 'cerebro-concierge-'));
const runId = 'teste-primeiro-loop';
const env = { ...process.env };

function run(args, now) {
  return JSON.parse(execFileSync('node', [script, ...args, '--brain', sandbox, '--json'], {
    env: { ...env, CEREBRO_CLOCK_NOW: now },
    encoding: 'utf8',
  }));
}

try {
  mkdirSync(join(sandbox, '.cerebro'), { recursive: true });
  writeFileSync(join(sandbox, 'VERSION'), '9.9.9\n');

  run(['start', '--run-id', runId, '--system', 'calls-decisoes'], '2026-07-20T12:00:00.000Z');
  run(['mark', '--run-id', runId, '--milestone', 'T1'], '2026-07-20T12:01:00.000Z');

  const skipped = spawnSync('node', [script, 'mark', '--run-id', runId, '--milestone', 'T3', '--brain', sandbox], {
    encoding: 'utf8',
  });
  if (skipped.status === 0 || !skipped.stderr.includes('registre T2 antes')) {
    throw new Error('permitiu pular um marco');
  }

  run(['mark', '--run-id', runId, '--milestone', 'T2'], '2026-07-20T12:06:00.000Z');
  run(['intervention', '--run-id', runId, '--kind', 'explain-question'], '2026-07-20T12:06:30.000Z');
  run(['mark', '--run-id', runId, '--milestone', 'T3'], '2026-07-20T12:10:00.000Z');
  const final = run(['mark', '--run-id', runId, '--milestone', 'T4'], '2026-07-20T12:12:00.000Z');

  if (!final.complete) throw new Error('T4 não fechou a execução');
  if (final.productVersion !== '9.9.9') throw new Error('versão não ficou congelada no recibo');
  if (final.deltasMs.T0_T3 !== 600000 || final.deltasMs.T1_T2 !== 300000) {
    throw new Error('deltas incorretos');
  }
  if (final.interventions[0]?.withinContract !== true) throw new Error('intervenção permitida incorreta');

  const saved = JSON.parse(readFileSync(join(sandbox, '.cerebro', 'concierge-runs', `${runId}.json`), 'utf8'));
  const serialized = JSON.stringify(saved);
  for (const forbidden of ['name', 'email', 'phone', 'sourcePath', 'message']) {
    if (serialized.includes(`\"${forbidden}\"`)) throw new Error(`recibo contém campo proibido: ${forbidden}`);
  }

  console.log('✓ relógio T0–T4 sequencial, privado, versionado e sem conteúdo');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
