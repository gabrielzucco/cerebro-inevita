#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { importLegacyRoutineRuns } from './lib/legacy-routine-run-import.mjs';

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length) || '';
}

const root = resolve(option('root') || process.cwd());
const manifestPath = option('manifest');
if (!manifestPath) {
  console.error('uso: node scripts/import-legacy-routine-runs.mjs --root=<cerebro> --manifest=<json> [--confirm]');
  process.exit(2);
}

try {
  const manifest = JSON.parse(readFileSync(resolve(manifestPath), 'utf8'));
  const result = importLegacyRoutineRuns(root, manifest, { confirm: process.argv.includes('--confirm') });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`✗ ${error instanceof Error ? error.message : 'legacy-routine-run-import-failed'}`);
  process.exit(1);
}
