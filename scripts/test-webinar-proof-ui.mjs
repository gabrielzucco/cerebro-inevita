#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const app = readFileSync(join(root, 'console', 'app.js'), 'utf8');
const css = readFileSync(join(root, 'console', 'styles.css'), 'utf8');

for (const marker of ['proof-split', 'Origens usadas', 'Correção registrada', 'Aplicada em novo Run', 'Resultado aprovado']) {
  assert.match(app, new RegExp(marker), `Cockpit sem prova visível: ${marker}`);
}
assert.match(app, /if \(detail\.context_available\) await loadContext/);
assert.match(css, /\.proof-split\s*\{[^}]*grid-template-columns:/s);
assert.match(css, /\.correction-proof\s*\{/);
assert.match(css, /\.proof-split\s*\{\s*grid-template-columns:\s*1fr;/s, 'mobile precisa empilhar resultado e origem');
console.log('✓ prova da aula: resultado/origens e estados da correção estão visíveis e responsivos');
