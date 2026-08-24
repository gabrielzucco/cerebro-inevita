#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  validateCorrectionRunReceipt,
  validateLearningCandidate,
} from './lib/correction-loop.mjs';

const correction = JSON.parse(readFileSync(
  new URL('../protocol/examples/correction-run-receipt.v1.json', import.meta.url),
  'utf8',
));
const learning = JSON.parse(readFileSync(
  new URL('../protocol/examples/learning-candidate.v1.json', import.meta.url),
  'utf8',
));

assert.deepEqual(validateCorrectionRunReceipt(correction), []);
assert.deepEqual(validateLearningCandidate(learning), []);
assert(validateCorrectionRunReceipt({ ...correction, note: 'conteúdo privado' })
  .some((error) => error.includes('não é permitido')));
assert(validateCorrectionRunReceipt({ ...correction, output: 'conteúdo privado' })
  .some((error) => error.includes('não é permitido')));
assert(validateCorrectionRunReceipt({
  ...correction,
  privacy: { ...correction.privacy, external_action_executed: true },
}).some((error) => error.includes('não executa ação externa')));
assert(validateLearningCandidate({ ...learning, occurrences: 3 })
  .some((error) => error.includes('nascer com 1')));
assert(validateLearningCandidate({
  ...learning,
  privacy: { ...learning.privacy, motor_changed: true },
}).some((error) => error.includes('motor_changed')));
assert(validateLearningCandidate({ ...learning, correction: 'texto proibido' })
  .some((error) => error.includes('não é permitido')));

console.log('✓ correção é reference-only e aprendizado nasce candidato 1/3 sem mudar o motor');
