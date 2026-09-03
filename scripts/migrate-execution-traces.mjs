#!/usr/bin/env node

// Migração one-shot de traces legados: eventos gravados antes de model_ref/
// connector_ref entrarem no protocolo omitem essas chaves, e o validador exige
// presença explícita (null ou ref válida) — chave ausente é `undefined`, não
// `null`, então readExecutionTrace falha com trace-event-invalid e o Runs
// Explorer marca "Trace ilegível". A correção acontece no ARQUIVO (chave
// ausente vira null explícito), nunca no validador: traces novos continuam
// sob a validação estrita integral.
//
// uso: node scripts/migrate-execution-traces.mjs --root=<cerebro> [--dry-run]

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  executionTraceDirectory,
  validateExecutionTraceEvent,
} from './lib/execution-trace-runtime.mjs';

const LEGACY_OMITTED_KEYS = ['model_ref', 'connector_ref'];

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length) || '';
}

const root = resolve(option('root') || process.cwd());
const dryRun = process.argv.includes('--dry-run');
const directory = executionTraceDirectory(root);
const files = readdirSync(directory).filter((name) => name.endsWith('.jsonl')).sort();

let invalidRemaining = 0;
for (const name of files) {
  const path = join(directory, name);
  let events;
  try {
    events = readFileSync(path, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
  } catch {
    invalidRemaining += 1;
    console.error(`inválido · ${name} — JSON ilegível, não tocado`);
    continue;
  }
  let changed = false;
  const patched = events.map((event) => {
    if (event === null || typeof event !== 'object' || Array.isArray(event)) return event;
    const next = { ...event };
    for (const key of LEGACY_OMITTED_KEYS) {
      if (!Object.hasOwn(next, key)) {
        next[key] = null;
        changed = true;
      }
    }
    return next;
  });
  const errors = patched.flatMap((event, index) => validateExecutionTraceEvent(event)
    .map((error) => `evento ${index + 1}: ${error}`));
  if (errors.length) {
    invalidRemaining += 1;
    console.error(`inválido · ${name} — não tocado (${errors.join(' | ')})`);
    continue;
  }
  if (!changed) {
    console.log(`já válido · ${name}`);
    continue;
  }
  if (dryRun) {
    console.log(`migraria · ${name}`);
    continue;
  }
  writeFileSync(path, `${patched.map((event) => JSON.stringify(event)).join('\n')}\n`, { mode: 0o600 });
  console.log(`migrado · ${name}`);
}

console.log(`total: ${files.length} trace(s) · ${invalidRemaining} inválido(s) restante(s)`);
process.exit(invalidRemaining ? 1 : 0);
