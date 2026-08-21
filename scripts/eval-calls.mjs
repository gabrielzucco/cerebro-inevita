#!/usr/bin/env node
// Roda os gates determinísticos do sistema Calls em Decisões sobre um par
// (fonte, garimpo). É o mesmo código que o CI executa — a skill `call` chama
// isto antes de perguntar "você usaria?" para a pessoa, então o que chega na
// régua humana já passou pela régua que não mente.
//
// Uso: node scripts/eval-calls.mjs <fonte.md> <garimpo.md>
// Saída 0 = todos os gates aplicáveis passaram; 1 = alguma violação.
import { readFileSync } from 'node:fs';
import { rodarGates } from './lib/eval-calls-gates.mjs';

const [fontePath, garimpoPath] = process.argv.slice(2);
if (!fontePath || !garimpoPath) {
  console.error('uso: node scripts/eval-calls.mjs <fonte.md> <garimpo.md>');
  process.exit(2);
}

const fonte = readFileSync(fontePath, 'utf8');
const garimpo = readFileSync(garimpoPath, 'utf8');

let falhou = false;
for (const resultado of rodarGates(fonte, garimpo)) {
  const status = resultado.naoAplicavel ? '·' : resultado.ok ? '✓' : '✗';
  console.log(`${status} ${resultado.gate}${resultado.naoAplicavel ? ' (fonte sem timestamps — não se aplica)' : ''}`);
  for (const problema of resultado.problemas) console.log(`    ${problema}`);
  if (!resultado.ok) falhou = true;
}
process.exit(falhou ? 1 : 0);
