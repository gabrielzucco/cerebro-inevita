#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import {
  buildExperimentReadModel,
  readExperimentDetail,
  validateExperimentContract,
  validateExperimentState,
} from './lib/experiment-protocol.mjs';

const source = resolve(process.cwd());
const root = mkdtempSync(join(tmpdir(), 'company-brain-experiments-'));

function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

function example(name) {
  return JSON.parse(readFileSync(join(source, 'protocol', 'examples', name), 'utf8'));
}

function runImport(confirm = false) {
  return execFileSync(process.execPath, [join(source, 'scripts', 'import-legacy-experiments.mjs'),
    `--root=${root}`, '--registry=legacy-experiments.json', ...(confirm ? ['--confirm'] : [])], {
    cwd: source, encoding: 'utf8',
  });
}

try {
  write(join(root, '.cerebro', 'layout.json'), {
    version: 3,
    experimentContracts: '.cerebro/contracts/experiments',
    experimentStates: '.cerebro/runtime/experiments',
    runLedger: '.cerebro/runtime/ledger/runs.jsonl',
  });
  assert.deepEqual(validateExperimentContract(example('experiment-contract.v1.json')), []);
  assert.deepEqual(validateExperimentState(example('experiment-state.v1.json')), []);

  const invalidContract = { ...example('experiment-contract.v1.json'), arms_status: 'structured', arms: [] };
  assert(validateExperimentContract(invalidContract).some((error) => error.includes('arms estruturados')));
  const invalidState = { ...example('experiment-state.v1.json'), amendment_count: 9 };
  assert(validateExperimentState(invalidState).some((error) => error.includes('diverge')));

  write(join(root, 'legacy-experiments.json'), {
    experiments: [
      {
        id: 'EXP-001', name: 'Tarja no anúncio', status: 'concluido', owner: 'Owner',
        start_date: '2026-08-03', read_date: '2026-08-10', closed_on: '2026-08-10',
        oferta_id: 'OFR-DEMO', sistema_palco: 'funil-crescimento', sistemas_leitura: ['funil-crescimento'],
        frozen: {
          hypothesis: 'Se a tarja nomear o público, o custo cai.',
          variable: 'Somente a tarja muda.', original_metric: 'Custo por lead qualificado.',
          original_guards: 'Custo geral não pode passar do limite.',
          original_decision: 'Adotar somente se a métrica vencer e o guardrail passar.',
          original_precondition: 'Orçamento comparável.',
        },
        amendments: [{ id: 'EXP-001-A1', date: '2026-08-05', reason: 'Janela estendida.', changes: ['data'] }],
        effective: {
          primary_metric: 'cpl_icp', guardrails: ['cpl_geral'], diagnostics: ['ctr_link'],
          arms: ['AD-CONTROLE', 'AD-TARJA'], metric_query_id: 'exp001_cpl_v1',
        },
        verdict: 'Tarja adotada com ressalvas.',
      },
      {
        id: 'EXP-002', name: 'Headline futura', status: 'queued', owner: 'Owner',
        start_date: null, read_date: null, oferta_id: null,
        sistema_palco: 'funil-crescimento', sistemas_leitura: ['funil-crescimento'],
        frozen: {
          hypothesis: 'Se a headline mudar, a conversão pode subir.',
          variable: 'Somente a headline muda.', original_metric: 'Conversão da página.',
          original_guards: 'Qualificação não pode cair.',
          original_decision: 'Manter somente se a conversão subir e o guardrail passar.',
        },
        amendments: [],
        effective: { primary_metric: 'page_conversion', guardrails: ['pct_icp'], diagnostics: [], arms: null },
      },
    ],
  });

  const preview = JSON.parse(runImport(false));
  assert.equal(preview.status, 'preview');
  assert.equal(preview.experiment_count, 2);
  assert.equal(existsSync(join(root, '.cerebro', 'contracts', 'experiments')), false, 'preview não escreve');

  const imported = runImport(true);
  assert(imported.includes('2 Experimentos importados'));
  assert(existsSync(join(root, '.cerebro', 'contracts', 'experiments', 'exp-001.json')));
  assert(existsSync(join(root, '.cerebro', 'runtime', 'experiments', 'exp-001.json')));

  write(join(root, '.cerebro', 'runtime', 'ledger', 'runs.jsonl'), `${JSON.stringify({
    run_id: 'run-tarja-briefing', started_at: '2026-08-04T10:00:00.000Z',
    entity_refs: [{ role: 'experiment', id: 'EXP-001' }],
  })}\n`);
  const model = buildExperimentReadModel(root);
  assert.equal(model.issues.length, 0);
  assert.equal(model.experiments.length, 2);
  assert.equal(model.experiments.find((item) => item.experiment_id === 'EXP-001').run_count, 1);
  assert.equal(model.experiments.find((item) => item.experiment_id === 'EXP-002').arms_status, 'not-structured');
  assert.equal(JSON.stringify(model).includes('Tarja adotada com ressalvas.'), false, 'resumo não carrega veredito privado');
  assert.equal(JSON.stringify(model).includes('Se a tarja nomear'), false, 'resumo não carrega hipótese privada');

  const detail = readExperimentDetail(root, 'EXP-001');
  assert.equal(detail.contract.hypothesis, 'Se a tarja nomear o público, o custo cai.');
  assert.equal(detail.state.verdict.summary, 'Tarja adotada com ressalvas.');
  assert(detail.state.run_refs.includes('run-record:run-tarja-briefing'));
  assert.equal(detail.pipeline.at(-1).state, 'gap', 'decisão sem learning_ref precisa ficar visivelmente incompleta');
  assert.throws(() => readExperimentDetail(root, 'EXP-404'), /experiment-not-found/);

  console.log('✓ Experimento é contrato + estado: import seguro, resumo privado e Runs por entity_ref');
} finally {
  rmSync(root, { recursive: true, force: true });
}

