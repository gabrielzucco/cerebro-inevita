#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateJudgmentReceipt } from './lib/judgment-protocol.mjs';

const example = JSON.parse(readFileSync(new URL('../protocol/examples/judgment-receipt.v1.json', import.meta.url), 'utf8'));

assert.deepEqual(validateJudgmentReceipt(example), []);
assert(validateJudgmentReceipt({ ...example, output: 'conteúdo proibido' }).some((error) => error.includes('não é permitido')));
assert(validateJudgmentReceipt({ ...example, prompt: 'conteúdo proibido' }).some((error) => error.includes('não é permitido')));
assert(validateJudgmentReceipt({ ...example, note: 'Bearer token-nao-pode-entrar-aqui' }).some((error) => error.includes('segredo')));
assert(validateJudgmentReceipt({
  ...example,
  verdict: 'rejected',
  action_intent: 'none',
  note: '',
}).some((error) => error.includes('note obrigatória')));
assert(validateJudgmentReceipt({
  ...example,
  verdict: 'rejected',
  action_intent: 'propose-action',
  note: 'Executar depois de revisar.',
}).some((error) => error.includes('propose-action exige')));
assert(validateJudgmentReceipt({
  ...example,
  privacy: { ...example.privacy, external_action_executed: true },
}).some((error) => error.includes('não executa ação externa')));

console.log('✓ Judgment Receipt fechado, privado e sem autorização externa implícita');
