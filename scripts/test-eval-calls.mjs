#!/usr/bin/env node
// O harness testa a si mesmo nos DOIS sentidos: os gates precisam passar no
// garimpo honesto E reprovar no desonesto. Um checker que só sabe aprovar é
// teatro — cada fixture declara em esperado.json o veredito exigido por gate.
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { rodarGates } from './lib/eval-calls-gates.mjs';

const BASE = resolve(process.cwd(), 'tests', 'fixtures', 'eval-calls');
const casos = readdirSync(BASE, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (casos.length < 5) {
  throw new Error(`esperava pelo menos 5 fixtures, encontrei ${casos.length}`);
}

let falhas = 0;
for (const caso of casos) {
  const fonte = readFileSync(join(BASE, caso, 'fonte.md'), 'utf8');
  const garimpo = readFileSync(join(BASE, caso, 'garimpo.md'), 'utf8');
  const esperado = JSON.parse(readFileSync(join(BASE, caso, 'esperado.json'), 'utf8'));
  const resultados = rodarGates(fonte, garimpo);

  for (const resultado of resultados) {
    if (!(resultado.gate in esperado)) {
      console.error(`✗ ${caso}: gate ${resultado.gate} sem veredito esperado no esperado.json`);
      falhas++;
      continue;
    }
    if (resultado.ok !== esperado[resultado.gate]) {
      console.error(`✗ ${caso}: ${resultado.gate} devia ser ${esperado[resultado.gate] ? 'PASS' : 'FAIL'} e foi ${resultado.ok ? 'PASS' : 'FAIL'}`);
      for (const problema of resultado.problemas) console.error(`    ${problema}`);
      falhas++;
    }
  }
}

if (falhas > 0) {
  console.error(`✗ harness de calls: ${falhas} divergência(s)`);
  process.exit(1);
}
console.log(`✓ harness de calls: ${casos.length} fixtures, gates corretos nos dois sentidos (aprovam o honesto, reprovam o slop)`);
