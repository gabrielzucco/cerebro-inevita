#!/usr/bin/env node

import assert from 'node:assert/strict';
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createExecutionTracer,
  latestStepStates,
  readExecutionTrace,
  validateExecutionTraceEvent,
} from './lib/execution-trace-runtime.mjs';

const root = mkdtempSync(join(tmpdir(), 'execution-trace-v1-'));

try {
  writeFileSync(join(root, '.cerebro-layout-placeholder'), 'fixture\n');
  const example = JSON.parse(readFileSync(new URL('../protocol/examples/execution-trace-event.v1.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateExecutionTraceEvent(example), []);
  assert(validateExecutionTraceEvent({ ...example, payload: 'PRIVATE' }).some((error) => error.includes('payload')));
  assert(validateExecutionTraceEvent({ ...example, evidence_ref: null }).includes('skill concluída exige skill_ref e evidência sha256'));
  assert(validateExecutionTraceEvent({ ...example, step_type: 'output' }).includes('skill_ref só existe em step_type skill'));

  const moments = [
    '2026-08-24T10:00:00.000Z',
    '2026-08-24T10:00:01.000Z',
    '2026-08-24T10:00:02.000Z',
  ];
  const tracer = createExecutionTracer(root, {
    runId: 'routine-run-trace-test-001',
    systemRef: 'calls',
    routineRef: 'routine:call-em-decisoes-manual:1.0.0',
    clock: () => new Date(moments.shift()),
  });
  tracer.emit({ stepId: 'run', stepType: 'run', state: 'running', parentStepId: null });
  tracer.emit({
    stepId: 'skill-calls', stepType: 'skill', state: 'completed',
    skillRef: '.claude/skills/calls/SKILL.md',
    evidenceRef: 'sha256:7c9d01bbfce5f44c4e66f8a23e40fc7dd495a1dbde36b1f22ef7845ff8e4ba91',
  });
  tracer.emit({ stepId: 'run', stepType: 'run', state: 'completed', parentStepId: null });

  const events = readExecutionTrace(root, 'routine-run-trace-test-001');
  assert.deepEqual(events.map((event) => event.sequence), [1, 2, 3]);
  assert.equal(latestStepStates(events).get('run').state, 'completed');
  assert.equal(events[1].privacy.payload_recorded, false);
  assert.equal(JSON.stringify(events).includes('PRIVATE'), false);

  appendFileSync(tracer.path, `${JSON.stringify({ ...events[2], sequence: 8 })}\n`);
  assert.throws(() => readExecutionTrace(root, 'routine-run-trace-test-001'), /trace-sequence-invalid/);
  console.log('✓ Execution Trace V1 é ordenado, reference-only e exige prova para skill carregada');
} finally {
  rmSync(root, { recursive: true, force: true });
}
