#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const renderer = join(root, '.claude', 'skills', 'arquiteto', 'scripts', 'render-map.mjs');
const example = join(root, '.claude', 'skills', 'arquiteto', 'references', 'architect-spec.example.json');
const sandbox = mkdtempSync(join(tmpdir(), 'architect-test-'));

function write(name, spec) {
  const path = join(sandbox, name);
  writeFileSync(path, `${JSON.stringify(spec, null, 2)}\n`);
  return path;
}

function expectFailure(spec, expected) {
  const path = write(`invalid-${Math.random().toString(16).slice(2)}.json`, spec);
  const result = spawnSync(process.execPath, [renderer, path, '--validate-only'], { encoding: 'utf8' });
  if (result.status === 0 || !result.stderr.includes(expected)) {
    throw new Error(`esperava falha contendo "${expected}", recebeu: ${result.stderr || result.stdout}`);
  }
}

try {
  const base = JSON.parse(readFileSync(example, 'utf8'));
  const input = write('valid-v1.json', base);
  const output = join(sandbox, 'mapa.excalidraw.md');
  const env = { ...process.env, CEREBRO_TELEMETRY: 'off' };
  const validated = JSON.parse(execFileSync(process.execPath, [renderer, input, '--validate-only'], { encoding: 'utf8', env }));
  if (!validated.valid || validated.level !== 'V1' || validated.ranking !== 'proposed') {
    throw new Error('validação V1 não preservou estado e ranking');
  }
  const renderOutput = execFileSync(process.execPath, [renderer, input, output], { encoding: 'utf8', env });
  if (!renderOutput.includes('colisões texto×texto: 0') || !renderOutput.includes('linha×texto: 0')) {
    throw new Error('engine visual não comprovou zero colisões');
  }
  const visual = readFileSync(output, 'utf8');
  for (const expected of ['MAPA DA CAPACIDADE', 'O ranking é uma proposta', 'V1 · evidência parcial', 'PRÓXIMO PASSO']) {
    if (!visual.includes(expected)) throw new Error(`visual sem: ${expected}`);
  }

  const noObserved = structuredClone(base);
  noObserved.sources = noObserved.sources.map((source) => ({ ...source, status: 'declared' }));
  expectFailure(noObserved, 'exige ao menos uma fonte observada');

  const inflatedV2 = structuredClone(base);
  inflatedV2.state.level = 'V2';
  expectFailure(inflatedV2, 'exige validation.human_confirmation');

  const inflatedV3 = structuredClone(base);
  inflatedV3.state.level = 'V3';
  inflatedV3.state.basis.push({ kind: 'human-confirmation', ref: 'operacao/confirmacao.md', summary: 'Mapa confirmado.' });
  inflatedV3.ranking.status = 'confirmed';
  inflatedV3.recommendation.human_decision = 'approved';
  inflatedV3.validation.human_confirmation = {
    map_status: 'confirmed',
    ranking_status: 'confirmed',
    confirmed_at: '2026-08-12T16:00:00.000Z',
    confirmed_by_role: 'responsável pela operação',
    corrections: [],
  };
  expectFailure(inflatedV3, 'V3 exige validation.run');

  const noReasons = structuredClone(base);
  noReasons.ranking.opportunities[0].reason_codes = [];
  expectFailure(noReasons, 'reason_codes precisa ter entre 1 e 4 itens');

  const badRanking = structuredClone(base);
  badRanking.ranking.opportunities[1].rank = 3;
  expectFailure(badRanking, 'ranking precisa ser ordinal e sequencial');

  const withPii = structuredClone(base);
  withPii.operation.objective = 'Mandar para teste@empresa.com';
  expectFailure(withPii, 'spec contém e-mail');

  console.log('✓ Architect: V0→V3 protegido, ranking explicável, PII bloqueada e visual determinístico');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
