#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { validateHandoffContract, validateHandoffReceipt } from './lib/handoff-protocol.mjs';

const ROOT = resolve(process.cwd());

function example(name) {
  return JSON.parse(readFileSync(join(ROOT, 'protocol', 'examples', name), 'utf8'));
}

function clone(value) {
  return structuredClone(value);
}

const contract = example('handoff-contract.v1.json');
const receipt = example('handoff-receipt.v1.json');

assert.deepEqual(validateHandoffContract(contract), []);
assert.deepEqual(validateHandoffReceipt(receipt), []);

const sameSystem = clone(contract);
sameSystem.consumer.system_ref = sameSystem.producer.system_ref;
assert(validateHandoffContract(sameSystem).some((error) => error.includes('Sistemas diferentes')),
  'handoff dentro do mesmo Sistema precisa reprovar');

const copyTransfer = clone(contract);
copyTransfer.permissions.transfer = 'copy';
assert(validateHandoffContract(copyTransfer).some((error) => error.includes('reference-only')),
  'transferência que não é reference-only precisa reprovar');

const badRange = clone(contract);
badRange.artifact.accepted_versions = ['banana'];
assert(validateHandoffContract(badRange).some((error) => error.includes('accepted_versions')),
  'faixa de versão inválida precisa reprovar');

const acceptedWithoutConsumer = clone(receipt);
acceptedWithoutConsumer.consumer_run_ref = null;
assert(validateHandoffReceipt(acceptedWithoutConsumer).some((error) => error.includes('accepted exige consumer_run_ref')),
  'accepted sem Run consumidor precisa reprovar');

const passedWithoutSchema = clone(receipt);
passedWithoutSchema.artifact.schema_validated = false;
assert(validateHandoffReceipt(passedWithoutSchema).some((error) => error.includes('schema validado')),
  'gate aprovado sem schema validado precisa reprovar');

const invalidMode = clone(receipt);
invalidMode.mode = 'test';
assert(validateHandoffReceipt(invalidMode).some((error) => error.includes('replay ou live')),
  'mode fora de replay|live precisa reprovar — replay nunca se apresenta como live');

const deliveredWithConsumer = clone(receipt);
deliveredWithConsumer.status = 'delivered';
assert(validateHandoffReceipt(deliveredWithConsumer).some((error) => error.includes('delivered')),
  'delivered com Run consumidor precisa reprovar');

const failedCheckButPassed = clone(receipt);
failedCheckButPassed.gate.checks[0].passed = false;
assert(validateHandoffReceipt(failedCheckButPassed).some((error) => error.includes('check reprovado')),
  'gate não pode passar com check reprovado');

const timeTravel = clone(receipt);
timeTravel.consumed_at = '2026-08-24T11:00:00.000Z';
assert(validateHandoffReceipt(timeTravel).some((error) => error.includes('consumed_at')),
  'consumo antes do gate precisa reprovar');

function cli(kind, path) {
  return execFileSync(process.execPath, [join(ROOT, 'scripts', 'protocol-validate.mjs'), kind, path], {
    cwd: ROOT, encoding: 'utf8',
  });
}

assert(cli('handoff', 'protocol/examples/handoff-contract.v1.json').includes('válido'));
assert(cli('handoff-receipt', 'protocol/examples/handoff-receipt.v1.json').includes('válido'));

console.log('✓ Handoff é contrato + recibo: a aresta entre Sistemas só existe declarada e só acende com prova');
