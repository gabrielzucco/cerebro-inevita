#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import {
  experimentDirectories,
  validateExperimentContract,
  validateExperimentState,
} from './lib/experiment-protocol.mjs';
import { writeJsonAtomic } from './lib/system-protocol.mjs';

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) || '';
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function safePath(root, path) {
  const rel = relative(root, path);
  if (!rel || rel.startsWith('..') || rel.startsWith('/')) throw new Error('registry precisa estar dentro do Cérebro');
  return rel.replaceAll('\\', '/');
}

function metricId(value) {
  const normalized = String(value || '').trim().toLowerCase().replaceAll('_', '-');
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(normalized)) throw new Error(`métrica inválida: ${value}`);
  return normalized;
}

function ref(value, label) {
  const normalized = String(value || '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(normalized)) throw new Error(`${label} inválida: ${value}`);
  return normalized;
}

function arms(effective) {
  const raw = effective?.arms;
  const values = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw) : [];
  return values.map((value) => ({ arm_id: ref(value, 'arm'), role: values.length === 1 ? 'single' : 'unspecified', label: null }));
}

function status(value) {
  if (value === 'concluido') return 'decided';
  if (value === 'encerrado_sem_execucao') return 'cancelled';
  if (value === 'coletando_ate_data_leitura') return 'running';
  if (value === 'pronto_para_leitura') return 'ready-for-read';
  if (value === 'bloqueado') return 'blocked';
  return 'queued';
}

function phase(value) {
  if (value === 'concluido' || value === 'encerrado_sem_execucao') return 'learning';
  if (value === 'coletando_ate_data_leitura') return 'measurement';
  if (value === 'pronto_para_leitura') return 'decision';
  return 'contract';
}

function measurementStatus(value) {
  if (value === 'concluido') return 'complete';
  if (value === 'encerrado_sem_execucao' || value === 'bloqueado') return 'blocked';
  if (value === 'coletando_ate_data_leitura') return 'collecting';
  if (value === 'pronto_para_leitura') return 'ready';
  return 'not-started';
}

function canonicalHash(value) {
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
}

function contractFrom(experiment, sourceRef) {
  const effectiveArms = arms(experiment.effective);
  const primary = metricId(experiment.effective?.primary_metric);
  const queryRef = experiment.effective?.metric_query_id ? ref(experiment.effective.metric_query_id, 'metric_query_id') : null;
  const guardrailRule = String(experiment.frozen?.original_guards || '').trim() || null;
  const decisionRule = String(experiment.frozen?.original_decision || '').trim() || null;
  const gaps = [
    ...(!effectiveArms.length ? ['arms-not-structured'] : []),
    ...(!guardrailRule ? ['guardrail-rule-missing'] : []),
    ...(!decisionRule ? ['decision-rule-missing'] : []),
  ];
  const contract = {
    protocol_version: 1,
    experiment_id: ref(experiment.id, 'experiment_id'),
    name: String(experiment.name || '').trim(),
    version: '1.0.0',
    lifecycle: 'frozen',
    contract_status: gaps.length ? 'legacy-incomplete' : 'complete',
    gaps,
    system_ref: metricId(experiment.sistema_palco),
    measurement_system_refs: [...new Set((experiment.sistemas_leitura || [experiment.sistema_palco]).map(metricId))],
    owner_ref: 'role-experiment-owner',
    offer_ref: experiment.oferta_id ? ref(experiment.oferta_id, 'oferta_id') : null,
    baseline: null,
    hypothesis: String(experiment.frozen?.hypothesis || '').trim(),
    change: String(experiment.frozen?.variable || '').trim(),
    preconditions: experiment.frozen?.original_precondition ? String(experiment.frozen.original_precondition) : null,
    arms_status: effectiveArms.length ? 'structured' : 'not-structured',
    arms: effectiveArms,
    primary_metric: {
      metric_id: primary,
      definition: String(experiment.frozen?.original_metric || primary).trim(),
      query_ref: queryRef,
    },
    guardrails: {
      rule: guardrailRule,
      metric_refs: [...new Set((experiment.effective?.guardrails || []).map(metricId))],
    },
    diagnostic_refs: [...new Set((experiment.effective?.diagnostics || []).map(metricId))],
    decision_rule: decisionRule,
    window: { started_on: experiment.start_date || null, read_on: experiment.read_date || null },
    source_refs: ['funnel-experiments'],
    freeze: {
      kind: 'legacy-attested',
      frozen_at: null,
      source_ref: sourceRef,
      source_sha256: canonicalHash(experiment),
    },
    privacy: {
      content_shared_with_inevita: false,
      summary_safe: true,
      detail_requires_explicit_read: true,
    },
  };
  const errors = validateExperimentContract(contract);
  if (errors.length) throw new Error(`${experiment.id}: ${errors.join(' · ')}`);
  return contract;
}

function stateFrom(experiment, observedAt) {
  const amendments = (experiment.amendments || []).map((item) => ({
    amendment_id: ref(item.id, 'amendment_id'),
    on: item.date || null,
    reason: String(item.reason || ''),
    change_count: Array.isArray(item.changes) ? item.changes.length : 0,
  }));
  const decided = typeof experiment.verdict === 'string' && experiment.verdict.trim();
  const cancelled = experiment.status === 'encerrado_sem_execucao';
  const state = {
    protocol_version: 1,
    experiment_id: ref(experiment.id, 'experiment_id'),
    status: status(experiment.status),
    phase: phase(experiment.status),
    started_on: experiment.start_date || null,
    read_on: experiment.read_date || null,
    closed_on: experiment.closed_on || null,
    amendment_count: amendments.length,
    amendments,
    run_refs: [],
    measurement: {
      status: measurementStatus(experiment.status),
      primary_metric_ref: metricId(experiment.effective?.primary_metric),
      diagnostic_refs: [...new Set((experiment.effective?.diagnostics || []).map(metricId))],
    },
    verdict: {
      status: cancelled ? 'not-executed' : decided ? 'recorded' : 'pending',
      decided_on: experiment.closed_on || null,
      summary: decided || null,
    },
    learning: {
      status: cancelled ? 'not-applicable' : decided ? 'unlinked' : 'pending',
      ref: null,
    },
    observed_at: observedAt,
    privacy: {
      content_shared_with_inevita: false,
      verdict_in_summary: false,
    },
  };
  const errors = validateExperimentState(state);
  if (errors.length) throw new Error(`${experiment.id}: ${errors.join(' · ')}`);
  return state;
}

const root = resolve(option('root') || process.cwd());
const registryPath = resolve(root, option('registry') || '.automacao/experimentos_funil.json');
if (!existsSync(registryPath)) fail(`registry não encontrado: ${registryPath}`);

try {
  const sourceRef = safePath(root, registryPath);
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  if (!Array.isArray(registry.experiments)) throw new Error('registry.experiments precisa ser lista');
  const observedAt = statSync(registryPath).mtime.toISOString();
  const compiled = registry.experiments.map((experiment) => ({
    contract: contractFrom(experiment, sourceRef),
    state: stateFrom(experiment, observedAt),
  }));
  console.log(JSON.stringify({
    status: process.argv.includes('--confirm') ? 'ready-to-write' : 'preview',
    source_ref: sourceRef,
    experiment_count: compiled.length,
    decided: compiled.filter((item) => item.state.status === 'decided').length,
    running: compiled.filter((item) => item.state.status === 'running').length,
    contracts_with_unstructured_arms: compiled.filter((item) => item.contract.arms_status === 'not-structured').length,
    writes_external_action: false,
  }, null, 2));
  if (!process.argv.includes('--confirm')) process.exit(0);
  const directories = experimentDirectories(root);
  for (const item of compiled) {
    const filename = `${item.contract.experiment_id.toLowerCase()}.json`;
    writeJsonAtomic(resolve(directories.contracts, filename), item.contract);
    writeJsonAtomic(resolve(directories.states, filename), item.state);
  }
  console.log(`✓ ${compiled.length} Experimentos importados como projeção privada; ledger humano intacto`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
