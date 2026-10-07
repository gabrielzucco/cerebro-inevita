#!/usr/bin/env node
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { activationState, buildConsoleReadModel } from './lib/console-read-model.mjs';

const root = resolve(process.cwd());
const fixture = mkdtempSync(join(tmpdir(), 'cerebro-first-mission-'));
const runs = join(fixture, '.cerebro', 'concierge-runs');

function receipt(name, value) {
  mkdirSync(runs, { recursive: true });
  writeFileSync(join(runs, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`);
}

try {
  const fresh = activationState(fixture);
  assert.equal(fresh.status, 'not-started');
  assert.equal(fresh.complete, false);
  assert.equal(fresh.current_step, 'work');
  assert.equal(fresh.completed_steps, 0);
  assert.equal(fresh.command, '/comecar');
  assert.equal(fresh.seed_options.length, 4);

  receipt('parcial', {
    schemaVersion: 1,
    runId: 'primeira-missao-parcial',
    systemId: 'cerebro-base',
    productVersion: '1.35.0',
    milestones: { T0: '2026-09-02T12:00:00.000Z', T1: '2026-09-02T12:02:00.000Z' },
    interventions: [],
  });
  const partial = activationState(fixture);
  assert.equal(partial.status, 'in-progress');
  assert.equal(partial.current_step, 'result');
  assert.equal(partial.completed_steps, 2);
  assert.equal(partial.receipt_ref, null);

  receipt('concluida', {
    schemaVersion: 1,
    runId: 'primeira-missao-concluida',
    systemId: 'cerebro-base',
    productVersion: '1.35.0',
    milestones: {
      T0: '2026-09-01T12:00:00.000Z', T1: '2026-09-01T12:01:00.000Z',
      T2: '2026-09-01T12:04:00.000Z', T3: '2026-09-01T12:07:00.000Z',
      T4: '2026-09-01T12:12:00.000Z',
    },
    interventions: [{ at: '2026-09-01T12:03:00.000Z', kind: 'locate-file', withinContract: true }],
  });
  const complete = activationState(fixture);
  assert.equal(complete.status, 'complete');
  assert.equal(complete.complete, true);
  assert.equal(complete.current_step, null);
  assert.equal(complete.completed_steps, 5);
  assert.equal(complete.run_id, 'primeira-missao-concluida');
  assert.equal(complete.receipt_ref, '.cerebro/concierge-runs/concluida.json');

  const model = buildConsoleReadModel(root, { now: new Date('2026-09-02T15:00:00.000Z') });
  assert(model.native_systems.some((system) => system.system_id === 'cerebro-base' && system.product_kind === 'brain-native'));
  assert(!model.systems.some((system) => system.system_id === 'cerebro-base'));
  assert(model.systems.some((system) => system.system_id === 'calls-decisoes'));
  assert.equal(model.counts.systems, model.systems.length);
  assert(!model.areas.some((area) => area.system_refs.includes('cerebro-base')));
  assert.equal(model.communication.available, true);
  assert.equal(model.communication.privacy.company_context_sent, false);

  // O modelo consulta o feed do próprio motor. Uma cópia isolada permite variar
  // os comunicados sem reescrever o produto nem fixar a release atual no teste.
  const isolatedProduct = join(fixture, 'motor');
  cpSync(join(root, 'scripts', 'lib'), join(isolatedProduct, 'scripts', 'lib'), { recursive: true });
  const { buildConsoleReadModel: isolatedModel } = await import(pathToFileURL(join(isolatedProduct, 'scripts', 'lib', 'console-read-model.mjs')).href);
  const feedDir = join(isolatedProduct, 'comunidade', 'inevita', 'atualizacoes');
  mkdirSync(feedDir, { recursive: true });
  const older = {
    update_id: 'comunicado-antigo', kind: 'product-update', title: 'Comunicado anterior',
    summary: 'Comunicado público usado somente nesta fixture de teste.',
    published_at: '2026-09-01', release_version: '1.0.0', highlights: [],
  };
  const newer = { ...older, update_id: 'comunicado-novo', published_at: '2026-09-03', release_version: '1.0.1' };
  const feed = { protocol_version: 1, channel_id: 'inevita-product-updates', generated_at: '2026-09-03', entries: [older] };
  writeFileSync(join(feedDir, 'feed.v1.json'), JSON.stringify(feed));
  assert.equal(isolatedModel(isolatedProduct).communication.latest.update_id, older.update_id);
  for (const entries of [[newer, older], [older, newer]]) {
    feed.entries = entries;
    writeFileSync(join(feedDir, 'feed.v1.json'), JSON.stringify(feed));
    const updatedCommunication = isolatedModel(isolatedProduct).communication;
    assert.equal(updatedCommunication.available, true);
    assert.equal(updatedCommunication.latest.update_id, newer.update_id);
    assert.equal(updatedCommunication.entries.length, 2);
    assert.equal(updatedCommunication.privacy.company_context_sent, false);
  }

  const app = readFileSync(join(root, 'console', 'app.js'), 'utf8');
  assert.match(app, /activation\.complete \? 'today' : 'activation'/);
  assert.match(app, /function renderActivation\(\)/);
  assert.match(app, /Leitura direta é exceção explícita/);
  assert.match(app, /Rotina do Cérebro/);
  assert.match(app, /NOVIDADE DA INEVITA/);
  assert.match(app, /data-open-brain-updates/);
  console.log('cockpit-first-mission: ok');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
