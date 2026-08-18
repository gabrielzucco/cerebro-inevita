#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = resolve(process.cwd());
const sandbox = mkdtempSync(join(tmpdir(), 'cerebro-protocol-'));
const env = { ...process.env, CEREBRO_INSTALL_ROOT: sandbox, CEREBRO_TELEMETRY: 'off' };

function run(script, args) {
  return execFileSync(process.execPath, [join(source, 'scripts', script), ...args], {
    cwd: source,
    env,
    encoding: 'utf8',
  });
}

function fails(script, args, expected) {
  const result = spawnSync(process.execPath, [join(source, 'scripts', script), ...args], {
    cwd: source,
    env,
    encoding: 'utf8',
  });
  if (result.status === 0 || !result.stderr.includes(expected)) {
    throw new Error(`esperava falha "${expected}" em ${script}: ${result.stderr || result.stdout}`);
  }
}

function contract(systemId, capabilityId, requiredEntity = true) {
  return {
    protocol_version: 1,
    system_id: systemId,
    name: systemId,
    version: '0.1.0',
    status: 'confirmed',
    result: {
      statement: 'produzir resultado verificável',
      non_success: 'gerar apenas uma resposta genérica',
      output_type: 'artefato-verificavel',
      definition_of_done: 'humano aprova o artefato',
      owner: 'operador',
      human_gate: 'aprovação humana antes de encerrar',
    },
    trigger: { type: 'manual', description: 'quando chega um caso real' },
    capability: { capability_id: capabilityId, version: '0.1.0', origin: 'local' },
    entities: [{ type: 'lead', role: 'lead', required: requiredEntity }],
    sources: [{
      role: 'crm', source_id: 'source-crm', required: true, access: 'read-only',
      freshness: 'por evento', purpose: 'estado canônico do lead',
    }],
    pipeline: [{ state: 'recebido', input: 'caso real', output: 'artefato', gate: 'fonte autorizada' }],
    permissions: { read: ['crm'], write: ['output local'], external_actions: false },
    eval: {
      version: '0.1.0', deterministic_gates: ['proveniência presente'],
      human_questions: ['Você usaria isso?'], outcome_measure: 'uso-confirmado', baseline: null,
    },
    learning: {
      correction_policy: 'candidate-first', promotion_threshold: 3,
      requires_replay: true, requires_human_approval: true,
    },
  };
}

function state(systemId) {
  return JSON.parse(readFileSync(join(sandbox, '.cerebro', 'sistemas', `${systemId}.json`), 'utf8'));
}

function execute(systemId, entityId, sequence, decision = 'approved') {
  run('system-run.mjs', [systemId, 'start', `--entity=lead:${entityId}`]);
  const runId = state(systemId).current_run.id;
  const output = `operacao/execucoes/output-${sequence}.md`;
  writeFileSync(join(sandbox, output), `# Output ${sequence}\n`);
  const args = [
    systemId, 'complete', '--eval=pass', `--decision=${decision}`,
    `--output=${output}`, '--outcome=uso-confirmado:true', '--duration-ms=1000',
  ];
  if (decision === 'changes_requested') args.push('--correction-ref=operacao/o-que-melhorou/correcao.md');
  run('system-run.mjs', args);
  return runId;
}

try {
  mkdirSync(join(sandbox, '.cerebro'), { recursive: true });
  mkdirSync(join(sandbox, 'privado'), { recursive: true });
  mkdirSync(join(sandbox, 'operacao', 'execucoes'), { recursive: true });
  mkdirSync(join(sandbox, 'operacao', 'o-que-melhorou'), { recursive: true });
  writeFileSync(join(sandbox, 'COMECE-AQUI.md'), '# teste\n');
  writeFileSync(join(sandbox, 'VERSION'), '9.9.9\n');
  writeFileSync(join(sandbox, '.cerebro', 'layout.json'), JSON.stringify({
    version: 2,
    runLedger: '.cerebro/ledger/runs.jsonl',
  }));
  writeFileSync(join(sandbox, 'privado', 'lead-key.txt'), 'crm-contact-secret-123\n');
  writeFileSync(join(sandbox, 'operacao', 'o-que-melhorou', 'correcao.md'), 'não usar tom genérico\n');
  writeFileSync(join(sandbox, 'operacao', 'o-que-melhorou', 'mudanca.md'), 'usar critério aprovado\n');
  writeFileSync(join(sandbox, 'operacao', 'o-que-melhorou', 'rollback.md'), 'voltar para 0.1.0\n');

  const entityResult = JSON.parse(run('entity.mjs', [
    'register', '--type=lead', '--source-id=source-crm',
    '--key-file=privado/lead-key.txt', '--confirm',
  ]));
  const entityId = entityResult.entity_id;
  const entityStore = readFileSync(join(sandbox, 'privado', 'entidades.json'), 'utf8');
  if (entityStore.includes('crm-contact-secret-123')) throw new Error('chave externa vazou no registro');

  for (const [systemId, capabilityId] of [
    ['qualificar-lead', 'qualificar-lead'],
    ['preparar-call', 'preparar-call'],
  ]) {
    const path = join(sandbox, `${systemId}.json`);
    writeFileSync(path, `${JSON.stringify(contract(systemId, capabilityId), null, 2)}\n`);
    run('system-contract.mjs', ['validate', `${systemId}.json`]);
    run('system-contract.mjs', ['register', `${systemId}.json`, '--confirm']);
  }

  fails('system-run.mjs', ['qualificar-lead', 'start'], 'entidades obrigatórias');
  const first = execute('qualificar-lead', entityId, 1);
  const secondSystem = execute('preparar-call', entityId, 2);
  const second = execute('qualificar-lead', entityId, 3);
  const third = execute('qualificar-lead', entityId, 4);

  const journey = JSON.parse(run('entity.mjs', ['journey', `--entity-id=${entityId}`]));
  if (journey.runs.length !== 4) throw new Error(`jornada esperava 4 runs, recebeu ${journey.runs.length}`);
  if (!journey.runs.some((item) => item.system_id === 'preparar-call')) throw new Error('jornada não cruzou Sistemas');

  run('system-learn.mjs', [
    'qualificar-lead', 'propose', `--run-id=${first}`, '--layer=capability',
    '--correction-ref=operacao/o-que-melhorou/correcao.md',
    '--expected-change-ref=operacao/o-que-melhorou/mudanca.md', '--confirm',
  ]);
  const candidateId = readdirSync(join(sandbox, '.cerebro', 'learning'))[0].replace('.json', '');
  fails('system-learn.mjs', [
    'qualificar-lead', 'promote', `--candidate-id=${candidateId}`, `--replay-run=${first}`,
    '--target-version=0.2.0', '--rollback-ref=operacao/o-que-melhorou/rollback.md', '--approved', '--confirm',
  ], 'três ocorrências');
  for (const runId of [second, third]) {
    run('system-learn.mjs', [
      'qualificar-lead', 'propose', `--run-id=${runId}`, '--layer=capability',
      `--candidate-id=${candidateId}`, '--correction-ref=operacao/o-que-melhorou/correcao.md', '--confirm',
    ]);
  }
  run('system-learn.mjs', [
    'qualificar-lead', 'promote', `--candidate-id=${candidateId}`,
    `--replay-run=${first}`, `--replay-run=${second}`, `--replay-run=${third}`,
    '--target-version=0.2.0', '--rollback-ref=operacao/o-que-melhorou/rollback.md',
    '--approved', '--confirm',
  ]);
  const promoted = JSON.parse(readFileSync(join(sandbox, '.cerebro', 'learning', `${candidateId}.json`), 'utf8'));
  if (promoted.status !== 'promoted' || promoted.replay_runs.length !== 3) throw new Error('promoção não fechou');

  const ledgerPath = join(sandbox, '.cerebro', 'ledger', 'runs.jsonl');
  if (!existsSync(ledgerPath)) throw new Error('ledger não foi criado');
  const ledger = readFileSync(ledgerPath, 'utf8');
  if (ledger.includes('crm-contact-secret-123') || ledger.includes('não usar tom genérico')) {
    throw new Error('ledger carregou conteúdo privado em vez de referências');
  }
  if (ledger.trim().split('\n').length !== 8) throw new Error('ledger não registrou start+complete de 4 runs');
  if (!ledger.includes(secondSystem)) throw new Error('ledger perdeu run do segundo Sistema');

  console.log('✓ protocolo: contratos, entidade compartilhada, ledger, jornada e promoção 3+replay');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
