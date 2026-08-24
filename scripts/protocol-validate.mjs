#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  validateAccessGrant,
  validateRunRecord,
  validateSourceContract,
  validateSystemContract,
} from './lib/system-protocol.mjs';
import { validateAccessReceipt } from './lib/access-runtime.mjs';
import {
  validateCollectorBinding,
  validateExecutorBinding,
  validateRoutineContract,
  validateRoutineMigration,
  validateRoutineRunReceipt,
} from './lib/routine-protocol.mjs';
import { validateJudgmentReceipt } from './lib/judgment-protocol.mjs';
import {
  validateCorrectionRunReceipt,
  validateLearningCandidate,
} from './lib/correction-loop.mjs';
import { validateExecutionTraceEvent } from './lib/execution-trace-runtime.mjs';
import { validateExperimentContract, validateExperimentState } from './lib/experiment-protocol.mjs';
import { validateHandoffContract, validateHandoffReceipt } from './lib/handoff-protocol.mjs';
import { validateBrainManifest } from './lib/compatibility-diagnostic.mjs';

const [kind = '', path = ''] = process.argv.slice(2);
const validators = {
  source: validateSourceContract,
  system: validateSystemContract,
  run: validateRunRecord,
  grant: validateAccessGrant,
  receipt: validateAccessReceipt,
  routine: validateRoutineContract,
  executor: validateExecutorBinding,
  collector: validateCollectorBinding,
  'routine-receipt': validateRoutineRunReceipt,
  'routine-migration': validateRoutineMigration,
  judgment: validateJudgmentReceipt,
  correction: validateCorrectionRunReceipt,
  learning: validateLearningCandidate,
  trace: validateExecutionTraceEvent,
  experiment: validateExperimentContract,
  'experiment-state': validateExperimentState,
  handoff: validateHandoffContract,
  'handoff-receipt': validateHandoffReceipt,
  'brain-manifest': validateBrainManifest,
};

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!validators[kind]) fail('tipo válido: brain-manifest, source, system, run, grant, receipt, routine, executor, collector, routine-receipt, routine-migration, judgment, correction, learning, trace, experiment, experiment-state, handoff ou handoff-receipt');
if (!path) fail('informe o caminho do JSON');

try {
  const value = JSON.parse(readFileSync(resolve(path), 'utf8'));
  const errors = validators[kind](value);
  if (errors.length) fail(errors.join(' · '));
  console.log(`✓ ${kind} válido · protocol_version=${value.protocol_version || value.manifest_version}`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
