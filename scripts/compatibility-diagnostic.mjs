#!/usr/bin/env node

import { resolve } from 'node:path';
import { buildCompatibilityDiagnostic } from './lib/compatibility-diagnostic.mjs';

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) || '';
}

try {
  const root = resolve(option('root') || process.cwd());
  const diagnostic = buildCompatibilityDiagnostic(root);
  process.stdout.write(`${JSON.stringify(diagnostic, null, process.argv.includes('--compact') ? 0 : 2)}\n`);
} catch (error) {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
