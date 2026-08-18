#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureBrain,
  ID_RE,
  latestRunRecords,
  REF_ID_RE,
  readJson,
  writeJsonAtomic,
} from './lib/system-protocol.mjs';

const ROOT = resolve(process.env.CEREBRO_INSTALL_ROOT
  || join(dirname(fileURLToPath(import.meta.url)), '..'));
const args = process.argv.slice(2);
const action = args.find((arg) => !arg.startsWith('--')) || '';
const confirmed = args.includes('--confirm');

function option(name) {
  const prefix = `--${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? '';
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function entityStorePath() {
  return join(ROOT, existsSync(join(ROOT, 'privado')) ? 'privado' : 'private', 'entidades.json');
}

try {
  ensureBrain(ROOT);

  if (action === 'journey') {
    const entityId = option('entity-id');
    if (!REF_ID_RE.test(entityId)) fail('--entity-id inválido');
    const journey = latestRunRecords(ROOT)
      .filter((run) => run.entity_refs?.some((ref) => ref.id === entityId))
      .map((run) => ({
        run_id: run.run_id,
        system_id: run.system_id,
        system_version: run.system_version,
        status: run.status,
        started_at: run.started_at,
        completed_at: run.completed_at || null,
        human_decision: run.human_decision,
        eval_passed: run.eval?.passed ?? null,
        output_refs: run.output_refs || [],
        outcomes: run.outcomes || [],
      }));
    console.log(JSON.stringify({ entity_id: entityId, runs: journey }, null, 2));
    process.exit(0);
  }

  if (action !== 'register') fail('ação válida: register ou journey');
  if (!confirmed) fail('registro exige aprovação explícita: repita com --confirm');
  const type = option('type');
  const sourceId = option('source-id');
  const keyFile = option('key-file');
  if (!ID_RE.test(type)) fail('--type inválido');
  if (!REF_ID_RE.test(sourceId)) fail('--source-id inválido');
  if (!keyFile) fail('--key-file é obrigatório; a chave nunca é gravada em claro');
  const keyPath = resolve(ROOT, keyFile);
  if (!existsSync(keyPath)) fail(`key-file não encontrado: ${keyFile}`);
  const externalKey = readFileSync(keyPath, 'utf8').trim();
  if (!externalKey) fail('key-file está vazio');

  const externalKeyHash = createHash('sha256').update(externalKey).digest('hex');
  const stableHash = createHash('sha256')
    .update(`${type}\0${sourceId}\0${externalKey}`)
    .digest('hex');
  const entityId = `${type}-${stableHash.slice(0, 16)}`;
  const path = entityStorePath();
  const registry = existsSync(path) ? readJson(path, 'registro privado de entidades') : { version: 1, entities: [] };
  if (registry.version !== 1 || !Array.isArray(registry.entities)) fail('registro privado de entidades incompatível');
  const now = new Date().toISOString();
  const existing = registry.entities.find((entity) => entity.entity_id === entityId);
  registry.entities = registry.entities.filter((entity) => entity.entity_id !== entityId);
  registry.entities.push({
    entity_id: entityId,
    type,
    source_id: sourceId,
    external_key_hash: externalKeyHash,
    created_at: existing?.created_at || now,
    updated_at: now,
  });
  registry.entities.sort((left, right) => left.entity_id.localeCompare(right.entity_id));
  writeJsonAtomic(path, registry);
  console.log(JSON.stringify({
    registered: true,
    entity_id: entityId,
    type,
    source_id: sourceId,
    external_key_persisted: false,
  }, null, 2));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
