#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const SOURCE = resolve(process.cwd());
const sandbox = mkdtempSync(join(tmpdir(), 'cerebro-brief-'));
const brain = join(sandbox, 'cerebro');
const external = join(sandbox, 'reunioes');

function write(path, content) {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content);
}

try {
  mkdirSync(external, { recursive: true });
  write(join(brain, 'COMECE-AQUI.md'), '# Comece aqui\n');
  write(join(brain, 'VERSION'), '1.12.0\n');
  write(join(brain, '.cerebro', 'layout.json'), JSON.stringify({
    version: 2,
    runLedger: '.cerebro/ledger/runs.jsonl',
  }));
  write(join(brain, '.cerebro', 'sistemas', 'calls.json'), JSON.stringify({
    system_id: 'calls',
    status: 'needs_attention',
    approved_run_count: 2,
    updated_at: '2026-07-24T12:00:00.000Z',
    last_run: {
      eval_passed: false,
      human_decision: 'changes_requested',
    },
  }));
  write(join(brain, '.cerebro', 'concierge-runs', 'onboarding.json'), JSON.stringify({
    runId: 'onboarding',
    milestones: { T0: '2026-07-24T12:00:00.000Z', T1: '2026-07-24T12:01:00.000Z' },
  }));
  write(join(brain, 'conexoes', 'configuradas', 'fontes.json'), JSON.stringify({
    version: 1,
    sources: [{
      id: 'fonte-1',
      label: 'Reuniões',
      type: 'meetings-folder',
      location: external,
      access: 'read-only',
      refresh: 'manual',
    }],
  }));
  write(join(brain, 'operacao', 'decisoes-pendentes', 'aprovar-brief.md'), '# Aprovar o briefing\n');
  write(join(brain, 'operacao', 'execucoes', 'run.md'), '# Execução — calls\n');
  write(join(brain, 'operacao', 'o-que-melhorou', 'procedimento.md'), '# Procedimento candidato — call curta\n');
  const runBase = {
    protocol_version: 1,
    system_version: '0.1.0',
    status: 'completed',
    started_at: '2026-07-24T12:00:00.000Z',
    completed_at: '2026-07-24T12:01:00.000Z',
    entity_refs: [{ role: 'lead', id: 'lead-abc' }],
    source_refs: [{ role: 'crm', id: 'fonte-1' }],
    output_refs: ['operacao/execucoes/run.md'],
    eval: { version: '0.1.0', passed: true },
    human_decision: 'approved',
    correction_ref: null,
    outcomes: [],
    privacy: { content_shared_with_inevita: false },
  };
  write(join(brain, '.cerebro', 'ledger', 'runs.jsonl'), [
    JSON.stringify({ ...runBase, run_id: 'run-calls', system_id: 'calls' }),
    JSON.stringify({ ...runBase, run_id: 'run-followup', system_id: 'followup' }),
    '',
  ].join('\n'));

  execFileSync(process.execPath, [join(SOURCE, 'scripts', 'generate-operating-brief.mjs')], {
    env: {
      ...process.env,
      CEREBRO_INSTALL_ROOT: brain,
      CEREBRO_BRIEF_NOW: '2026-07-24T15:00:00.000Z',
    },
  });

  const output = join(brain, 'operacao', '_HOJE.md');
  if (!existsSync(output)) throw new Error('brief não foi criado');
  const text = readFileSync(output, 'utf8');
  for (const expected of [
    'Brief operacional local',
    'calls | precisa de atenção',
    'Reuniões | meetings-folder | read-only | manual | disponível',
    'Aprovar o briefing',
    'Procedimento candidato — call curta',
    'primeiras experiências ainda sem T4: **1**',
    'runs no protocolo comum: **2** · entidades atravessando mais de um Sistema: **1**',
  ]) {
    if (!text.includes(expected)) throw new Error(`brief sem: ${expected}`);
  }
  if (text.includes(external)) throw new Error('brief expôs caminho absoluto da fonte');
  console.log('✓ brief vivo agrega estados, fontes, decisões e procedimentos sem expor caminhos');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
