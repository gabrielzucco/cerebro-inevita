#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildCommunicationReadModel,
  readBrainReleaseHistory,
  validateCommunicationFeed,
} from './lib/communication-feed.mjs';

const sandbox = mkdtempSync(join(tmpdir(), 'communication-feed-v1-'));

function write(path, value) {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, value);
}

const feed = {
  protocol_version: 1,
  channel_id: 'inevita-product-updates',
  generated_at: '2026-09-03',
  entries: [
    {
      update_id: 'entrada-antiga',
      kind: 'announcement',
      title: 'Uma entrada pública anterior',
      summary: 'Esta entrada existe para provar a ordenação determinística do canal.',
      published_at: '2026-09-01',
      highlights: [],
    },
    {
      update_id: 'central-atualizacoes-v1-36',
      kind: 'product-update',
      title: 'Central de Atualizações disponível',
      summary: 'Novidades, releases e versão instalada agora aparecem sem misturar seus papéis.',
      published_at: '2026-09-03',
      release_version: '1.36.0',
      highlights: ['Nenhum contexto privado é enviado.'],
    },
  ],
};

try {
  const feedPath = join(sandbox, 'comunidade', 'inevita', 'atualizacoes', 'feed.v1.json');
  write(feedPath, `${JSON.stringify(feed, null, 2)}\n`);
  write(join(sandbox, 'CHANGELOG.md'), `# Histórico\n\n## v1.36.0 — 2026-09-03 · “a INEVITA ganha uma voz dentro do Cérebro”\n\n- **Central pública:** novidades sem telemetria.\n\n## v1.35.0 — 2026-09-02 · “fronteiras visíveis”\n\n- Cérebro e Sistemas aparecem separados.\n`);

  assert.deepEqual(validateCommunicationFeed(feed), []);
  const model = buildCommunicationReadModel(sandbox);
  assert.equal(model.available, true);
  assert.equal(model.latest.update_id, 'central-atualizacoes-v1-36');
  assert.equal(model.entries.length, 2);
  assert.equal(model.brain_releases[0].version, '1.36.0');
  assert.equal(model.brain_releases[0].title, 'a INEVITA ganha uma voz dentro do Cérebro');
  assert.equal(model.privacy.company_context_sent, false);
  assert.equal(model.privacy.telemetry_sent, false);
  assert.equal(model.privacy.remote_auto_check, false);
  assert.equal(JSON.stringify(model).includes('source_content'), false);

  const leaked = structuredClone(feed);
  leaked.entries[0].private_body = 'não pode atravessar o contrato';
  assert(validateCommunicationFeed(leaked).some((error) => error.includes('não é público')));
  write(feedPath, `${JSON.stringify(leaked, null, 2)}\n`);
  const blocked = buildCommunicationReadModel(sandbox);
  assert.equal(blocked.available, false);
  assert.equal(blocked.entries.length, 0);
  assert.equal(blocked.issue, 'communication-feed-invalid');
  assert.equal(blocked.brain_releases.length, 2, 'histórico local continua útil se o feed falhar');

  assert.equal(readBrainReleaseHistory(sandbox, { limit: 1 }).length, 1);
  console.log('communication-feed-v1: ok');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
