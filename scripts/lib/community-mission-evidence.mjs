import { readdirSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { matchesSchema } from './community-mcp-protocol.mjs';
import { communityHash, readCommunityFile, safeCommunityName, safeCommunityPath } from './community-package.mjs';
import { validateRunRecord } from './system-protocol.mjs';
import { validateRoutineRunReceipt } from './routine-protocol.mjs';
import { validateCorrectionRunReceipt } from './correction-loop.mjs';
import { validateJudgmentReceipt } from './judgment-protocol.mjs';

const HASH = /^[a-f0-9]{64}$/;
const REF = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const MISSIONS = ['choose_work', 'use_source', 'correct_reuse'];
const KINDS = ['run_record', 'run_record_v2', 'correction_run_receipt'];
const text = (maximum, pattern) => ({ type: 'string', minLength: 1, maxLength: maximum, ...(pattern ? { pattern } : {}) });
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const fields = { mission: { type: 'string', enum: MISSIONS }, receipt_ref: text(160, '^(?:run-record|correction-run):[A-Za-z0-9][A-Za-z0-9_-]{0,127}$') };
const confirmed = { ...fields, evidence_sha256: text(64, '^[a-f0-9]{64}$'), preview_hash: text(32, '^[a-f0-9]{32}$'), confirmar: { type: 'boolean', const: true } };
export const MISSION_EVIDENCE_TOOLS = Object.freeze([
  { name: 'planejar_evidencia_missao', title: 'Conferir recibo de missão', description: 'Use um recibo local escolhido pelo dono para conferir trabalho, uso observado de fonte ou correção. Valida o grafo e os arquivos locais, mas envia ao serviço somente tipo, data, contagens e hash. Mostre a prévia antes de pedir autorização para vincular o recibo à conta. Não certifica resultado externo.', inputSchema: object(fields), annotations: { title: 'Conferir recibo de missão', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } },
  { name: 'registrar_evidencia_missao', title: 'Vincular recibo de missão', description: 'Após aprovação explícita da prévia, relê e verifica o mesmo recibo local e envia somente o hash e metadados mínimos ao serviço. A plataforma vincula a declaração ao membro autenticado e revalida Society. Não envia caminhos, arquivos, conteúdo ou IDs de fontes.', inputSchema: object(confirmed), annotations: { title: 'Vincular recibo de missão', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true } },
]);
const fail = code => { throw new Error(code); };
const objectValue = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function configuredPath(root, key, fallback, prefix) {
  let layout = {};
  try { layout = JSON.parse(readCommunityFile(root, '.cerebro/layout.json', 16 * 1024)); }
  catch (error) { if (error.code !== 'ENOENT') fail('mission_receipt_invalid'); }
  const path = layout[key] ?? fallback;
  const prefixes = Array.isArray(prefix) ? prefix : [prefix];
  if (typeof path !== 'string' || !prefixes.some(part => path.startsWith(part)) || path.includes('..') || path.includes('\\')) fail('mission_receipt_invalid');
  try { safeCommunityName(path); } catch { fail('mission_receipt_invalid'); }
  return path;
}
function readLocal(root, path, maximum = 1024 * 1024) {
  try { return readCommunityFile(root, path, maximum); }
  catch { fail('mission_receipt_invalid'); }
}
function readJson(root, path) {
  try { const bytes = readLocal(root, path, 256 * 1024); return { value: JSON.parse(bytes), sha256: communityHash(bytes) }; }
  catch { fail('mission_receipt_invalid'); }
}
function time(value) {
  const timestamp = typeof value === 'string' ? Date.parse(value) : NaN;
  if (!Number.isFinite(timestamp) || timestamp > Date.now() + 5 * 60_000) fail('mission_receipt_invalid');
  return new Date(timestamp).toISOString();
}
function outputHash(root, path) {
  if (typeof path !== 'string' || path.startsWith('/') || path.includes('..')) fail('mission_receipt_invalid');
  try { safeCommunityName(path); } catch { fail('mission_receipt_invalid'); }
  return communityHash(readLocal(root, path, 4 * 1024 * 1024));
}
function runEvidence(root, mission, receiptId) {
  const ledger = configuredPath(root, 'runLedger', '.cerebro/ledger/runs.jsonl', ['.cerebro/ledger/', '.cerebro/runtime/ledger/']);
  const lines = readLocal(root, ledger, 8 * 1024 * 1024).toString('utf8').split('\n').filter(Boolean);
  if (lines.length > 10000) fail('mission_receipt_invalid');
  let record, line;
  for (const candidate of lines) {
    let parsed; try { parsed = JSON.parse(candidate); } catch { fail('mission_receipt_invalid'); }
    if (parsed?.run_id === receiptId) { record = parsed; line = candidate; }
  }
  if (!record || validateRunRecord(record).length || record.status !== 'completed' || record.eval?.passed === false
    || !Array.isArray(record.output_refs)
    || !record.output_refs.length || record.output_refs.length > 1000) fail('mission_receipt_invalid');
  if (Date.parse(record.started_at) > Date.parse(record.completed_at)) fail('mission_receipt_invalid');
  if (record.protocol_version === 2 && (record.mode === 'replay'
    || (record.experiment_ref && record.mode !== 'live')
    || Date.parse(record.context_snapshot.observed_at) < Date.parse(record.started_at)
    || Date.parse(record.context_snapshot.observed_at) > Date.parse(record.completed_at))) fail('mission_receipt_invalid');
  if (mission === 'use_source' && (record.protocol_version !== 2 || !Array.isArray(record.context_snapshot?.accesses)
    || !record.context_snapshot.accesses.length || record.context_snapshot.accesses.some(access =>
      !Array.isArray(access.selected_refs) || !access.selected_refs.length
      || !record.source_refs?.some(source => source.role === access.source_ref?.role && source.id === access.source_ref?.id)))) fail('mission_source_not_observed');
  const graph = [{ role: 'run_record', sha256: communityHash(line) }];
  if (record.human_decision === 'pending') {
    // Routine executions append a pending Run Record and store the decision in
    // a separate Judgment Receipt. The current judgment must approve this run.
    const routineId = receiptIdFromRun(record);
    const routines = configuredPath(root, 'routineReceipts', '.cerebro/runtime/receipts/routines', '.cerebro/runtime/');
    const judgments = configuredPath(root, 'routineJudgments', '.cerebro/runtime/judgments', '.cerebro/runtime/');
    const routine = readJson(root, `${routines}/${routineId}.json`);
    if (validateRoutineRunReceipt(routine.value).length || routine.value.receipt_id !== routineId
      || routine.value.run_id !== receiptId || routine.value.system_ref !== record.system_id
      || routine.value.status !== 'completed' || !record.output_refs.includes(routine.value.output_ref)) fail('mission_receipt_invalid');
    let names;
    try { names = readdirSync(safeCommunityPath(root, `${judgments}/${routineId}`)).filter(name => name.endsWith('.json')); }
    catch { fail('mission_receipt_invalid'); }
    if (!names.length || names.length > 1000 || names.some(name => !/^[-A-Za-z0-9_]+\.json$/.test(name))) fail('mission_receipt_invalid');
    const history = names.map(name => ({ ...readJson(root, `${judgments}/${routineId}/${name}`), name }));
    for (const item of history) {
      const judgment = item.value;
      if (validateJudgmentReceipt(judgment).length || item.name !== `${judgment.judgment_id}.json`
        || judgment.routine_receipt_ref !== `routine-receipt:${routineId}` || judgment.run_id !== receiptId
        || judgment.routine_id !== routine.value.routine_id || Date.parse(judgment.decided_at) < Date.parse(record.completed_at)) fail('mission_receipt_invalid');
    }
    const latest = history.sort((a, b) => Date.parse(a.value.decided_at) - Date.parse(b.value.decided_at)
      || a.value.judgment_id.localeCompare(b.value.judgment_id)).at(-1);
    if (latest.value.verdict !== 'approved') fail('mission_receipt_invalid');
    time(latest.value.decided_at);
    graph.push({ role: 'routine_receipt', sha256: routine.sha256 }, { role: 'judgment', sha256: latest.sha256 });
  } else if (record.human_decision !== 'approved') fail('mission_receipt_invalid');
  for (const path of record.output_refs) graph.push({ role: 'output', sha256: outputHash(root, path) });
  const source_count = mission === 'use_source' ? record.context_snapshot.accesses.length : 0;
  if (source_count > 1000) fail('mission_receipt_invalid');
  return { receipt_kind: record.protocol_version === 2 ? 'run_record_v2' : 'run_record',
    occurred_at: time(record.completed_at), source_count, output_count: record.output_refs.length, judgment_count: 1, graph };
}
function receiptIdFromRun(record) {
  const ref = record.extensions?.routine_receipt_ref;
  return receiptId(ref, 'routine-receipt');
}
function receiptId(ref, kind) {
  const prefix = `${kind}:`;
  if (typeof ref !== 'string' || !ref.startsWith(prefix) || !REF.test(ref.slice(prefix.length))) fail('mission_receipt_invalid');
  return ref.slice(prefix.length);
}
function correctionEvidence(root, correctionId) {
  const corrections = configuredPath(root, 'routineCorrections', '.cerebro/runtime/corrections', '.cerebro/runtime/');
  const routines = configuredPath(root, 'routineReceipts', '.cerebro/runtime/receipts/routines', '.cerebro/runtime/');
  const judgments = configuredPath(root, 'routineJudgments', '.cerebro/runtime/judgments', '.cerebro/runtime/');
  const correction = readJson(root, `${corrections}/${correctionId}.json`);
  const value = correction.value;
  if (validateCorrectionRunReceipt(value).length || value.correction_id !== correctionId || value.status !== 'completed'
    || value.baseline_routine_receipt_ref === value.resulting_routine_receipt_ref) fail('mission_receipt_invalid');
  const baselineId = receiptId(value.baseline_routine_receipt_ref, 'routine-receipt');
  const resultId = receiptId(value.resulting_routine_receipt_ref, 'routine-receipt');
  const judgmentId = receiptId(value.correction_judgment_ref, 'judgment-receipt');
  const baseline = readJson(root, `${routines}/${baselineId}.json`);
  const result = readJson(root, `${routines}/${resultId}.json`);
  const judgment = readJson(root, `${judgments}/${baselineId}/${judgmentId}.json`);
  for (const [item, id] of [[baseline, baselineId], [result, resultId]]) {
    if (validateRoutineRunReceipt(item.value).length || item.value.receipt_id !== id || item.value.status !== 'completed'
      || item.value.routine_id !== value.routine_id || item.value.system_ref !== value.system_ref || !item.value.output_ref) fail('mission_receipt_invalid');
  }
  if (validateJudgmentReceipt(judgment.value).length || judgment.value.judgment_id !== judgmentId
    || judgment.value.routine_receipt_ref !== value.baseline_routine_receipt_ref || judgment.value.run_id !== baseline.value.run_id
    || judgment.value.routine_id !== value.routine_id || judgment.value.verdict !== 'changes-requested') fail('mission_receipt_invalid');
  if (!Array.isArray(result.value.input_refs) || !result.value.input_refs.includes(value.correction_judgment_ref)) fail('mission_receipt_invalid');
  const completed = time(value.completed_at);
  if (Date.parse(baseline.value.completed_at) > Date.parse(judgment.value.decided_at)
    || Date.parse(judgment.value.decided_at) > Date.parse(value.requested_at)
    || Date.parse(value.requested_at) > Date.parse(result.value.started_at)
    || Date.parse(result.value.completed_at) > Date.parse(completed)) fail('mission_receipt_invalid');
  const graph = [{ role: 'correction', sha256: correction.sha256 }, { role: 'baseline', sha256: baseline.sha256 },
    { role: 'result', sha256: result.sha256 }, { role: 'judgment', sha256: judgment.sha256 },
    { role: 'baseline_output', sha256: outputHash(root, baseline.value.output_ref) },
    { role: 'result_output', sha256: outputHash(root, result.value.output_ref) }];
  return { receipt_kind: 'correction_run_receipt', occurred_at: completed,
    source_count: 0, output_count: 2, judgment_count: 1, graph };
}
export function inspectMissionEvidence({ root, mission, receipt_ref }) {
  if (!MISSIONS.includes(mission) || typeof receipt_ref !== 'string') fail('mission_receipt_invalid');
  let brainRoot; try { brainRoot = realpathSync(resolve(root)); } catch { fail('mission_receipt_invalid'); }
  const run = receipt_ref.startsWith('run-record:');
  const id = receiptId(receipt_ref, run ? 'run-record' : 'correction-run');
  if ((mission === 'correct_reuse') !== !run) fail('mission_receipt_invalid');
  const { graph, ...metadata } = run ? runEvidence(brainRoot, mission, id) : correctionEvidence(brainRoot, id);
  const evidence_sha256 = communityHash(JSON.stringify({ mission, graph: graph.sort((a, b) => a.role.localeCompare(b.role) || a.sha256.localeCompare(b.sha256)) }));
  return { mission, evidence_sha256, ...metadata };
}
export const MISSION_ACTION_SCHEMAS = Object.freeze({
  prepare_mission_evidence: object({ mission: { type: 'string', enum: MISSIONS }, evidence_sha256: text(64, '^[a-f0-9]{64}$'),
    receipt_kind: { type: 'string', enum: KINDS }, occurred_at: text(40), source_count: { type: 'integer', minimum: 0, maximum: 1000 },
    output_count: { type: 'integer', minimum: 1, maximum: 1000 }, judgment_count: { type: 'integer', minimum: 1, maximum: 1000 } }),
  submit_mission_evidence: object({ mission: { type: 'string', enum: MISSIONS }, evidence_sha256: text(64, '^[a-f0-9]{64}$'),
    receipt_kind: { type: 'string', enum: KINDS }, occurred_at: text(40), source_count: { type: 'integer', minimum: 0, maximum: 1000 },
    output_count: { type: 'integer', minimum: 1, maximum: 1000 }, judgment_count: { type: 'integer', minimum: 1, maximum: 1000 },
    preview_hash: text(32, '^[a-f0-9]{32}$'), confirmar: { type: 'boolean', const: true } }),
});
export function validateMissionRequest(action, args) {
  const schema = MISSION_ACTION_SCHEMAS[action];
  if (schema && (!matchesSchema(args, schema) || !Number.isFinite(Date.parse(args.occurred_at)))) fail('invalid_mission_arguments');
}
export function projectMissionResult(action, value, local) {
  if (!objectValue(value) || value.mission !== local.mission || (value.evidence_sha256 && value.evidence_sha256 !== local.evidence_sha256)
    || !['member_attested_local_receipt'].includes(value.evidence_state)) fail('invalid_community_response');
  if (action === 'prepare_mission_evidence') {
    if (!/^[a-f0-9]{32}$/.test(value.preview_hash || '') || value.will_record !== true) fail('invalid_community_response');
    return { mission: local.mission, receipt_kind: local.receipt_kind, occurred_at: local.occurred_at,
      source_count: local.source_count, output_count: local.output_count, judgment_count: local.judgment_count,
      evidence_sha256: local.evidence_sha256, preview_hash: value.preview_hash,
      evidence_state: value.evidence_state, will_record: true,
      disclosure: 'Somente tipo, data, contagens e hash do recibo; sem caminhos, conteúdo ou IDs de fontes.',
      meaning: 'Recibo local vinculado pelo membro; resultado externo não certificado.' };
  }
  if (typeof value.recorded_at !== 'string' || !Number.isFinite(Date.parse(value.recorded_at)) || typeof value.already_recorded !== 'boolean') fail('invalid_community_response');
  return { mission: local.mission, status: 'registrado', evidence_state: value.evidence_state,
    recorded_at: value.recorded_at, already_recorded: value.already_recorded,
    meaning: 'Recibo local vinculado pelo membro; resultado externo não certificado.' };
}
