import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import {
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import {
  validateAccessGrant,
  validateRunRecord,
  validateSourceContract,
  validateSystemContract,
} from './system-protocol.mjs';
import { validateRoutineContract } from './routine-protocol.mjs';

const MANIFEST_KEYS = [
  'protocol', 'manifest_version', 'profile', 'distribution', 'version_ref', 'identity_ref',
  'layout_ref', 'entrypoints', 'runtime', 'privacy', 'compatibility',
];
const CONTRACT_KINDS = ['source', 'system', 'run', 'access', 'routine', 'trace', 'experiment', 'handoff'];
const REQUIRED_CONTRACT_KINDS = ['source', 'system', 'run'];
const PROFILES = new Set(['full', 'starter', 'legacy-compatible']);
const DISTRIBUTIONS = new Set(['inevita', 'private']);
const RUNTIME_MODES = new Set(['file-only', 'local-optional', 'local-required']);

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function allowedKeys(errors, value, path, keys) {
  if (!object(value)) return;
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${path}.${key} não é permitido`);
  }
}

function relativeRef(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 240
    && !isAbsolute(value) && !value.includes('\\')
    && !value.split('/').includes('..');
}

function versionList(errors, value, path) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} precisa ser lista não vazia`);
    return;
  }
  if (new Set(value).size !== value.length) errors.push(`${path} não pode repetir versões`);
  if (value.some((version) => !Number.isInteger(version) || version < 1)) {
    errors.push(`${path} aceita somente inteiros positivos`);
  }
}

export function validateBrainManifest(value) {
  const errors = [];
  if (!object(value)) return ['Brain Manifest precisa ser objeto'];
  allowedKeys(errors, value, 'manifest', MANIFEST_KEYS);
  if (value.protocol !== 'company-brain') errors.push('protocol precisa ser company-brain');
  if (value.manifest_version !== 1) errors.push('manifest_version precisa ser 1');
  if (!PROFILES.has(value.profile)) errors.push('profile inválido');
  if (!DISTRIBUTIONS.has(value.distribution)) errors.push('distribution inválida');
  for (const field of ['version_ref', 'identity_ref', 'layout_ref']) {
    if (!relativeRef(value[field])) errors.push(`${field} precisa ser referência relativa segura`);
  }
  if (!Array.isArray(value.entrypoints) || value.entrypoints.length === 0) {
    errors.push('entrypoints precisa ser lista não vazia');
  } else {
    if (new Set(value.entrypoints).size !== value.entrypoints.length) errors.push('entrypoints não pode repetir referências');
    if (value.entrypoints.some((entry) => !relativeRef(entry))) errors.push('entrypoints contém referência insegura');
  }
  if (!object(value.runtime)) errors.push('runtime precisa ser objeto');
  else {
    allowedKeys(errors, value.runtime, 'runtime', ['mode', 'provider_control']);
    if (!RUNTIME_MODES.has(value.runtime.mode)) errors.push('runtime.mode inválido');
    if (value.runtime.provider_control !== 'owner-controlled') errors.push('runtime.provider_control precisa ser owner-controlled');
  }
  if (!object(value.privacy)) errors.push('privacy precisa ser objeto');
  else {
    allowedKeys(errors, value.privacy, 'privacy', ['data_plane', 'network_content_sync', 'reference_only_receipts']);
    if (value.privacy.data_plane !== 'local') errors.push('privacy.data_plane precisa ser local');
    if (value.privacy.network_content_sync !== false) errors.push('privacy.network_content_sync precisa ser false');
    if (value.privacy.reference_only_receipts !== true) errors.push('privacy.reference_only_receipts precisa ser true');
  }
  if (!object(value.compatibility)) errors.push('compatibility precisa ser objeto');
  else {
    allowedKeys(errors, value.compatibility, 'compatibility', ['contracts', 'migration_mode', 'unknown_fields']);
    if (value.compatibility.migration_mode !== 'preview-diff-confirm') {
      errors.push('compatibility.migration_mode precisa ser preview-diff-confirm');
    }
    if (value.compatibility.unknown_fields !== 'reject') errors.push('compatibility.unknown_fields precisa ser reject');
    if (!object(value.compatibility.contracts)) errors.push('compatibility.contracts precisa ser objeto');
    else {
      allowedKeys(errors, value.compatibility.contracts, 'compatibility.contracts', CONTRACT_KINDS);
      for (const kind of REQUIRED_CONTRACT_KINDS) {
        if (!(kind in value.compatibility.contracts)) errors.push(`compatibility.contracts.${kind} é obrigatório`);
      }
      for (const [kind, versions] of Object.entries(value.compatibility.contracts)) {
        versionList(errors, versions, `compatibility.contracts.${kind}`);
      }
    }
  }
  return errors;
}

function manifestReferenceErrors(root, manifest) {
  const errors = [];
  const required = [
    ['version_ref', manifest.version_ref],
    ['layout_ref', manifest.layout_ref],
    ...((manifest.entrypoints || []).map((ref, index) => [`entrypoints[${index}]`, ref])),
  ];
  if (manifest.profile !== 'starter') required.push(['identity_ref', manifest.identity_ref]);

  for (const [field, ref] of required) {
    if (!relativeRef(ref)) continue;
    const target = safeInside(root, ref, ref);
    if (!target || !existsSync(target)) {
      errors.push({ reason_code: 'brain-manifest-reference-missing', ref, field });
      continue;
    }
    try {
      const stat = lstatSync(target);
      if (stat.isSymbolicLink() || !stat.isFile()) {
        errors.push({ reason_code: 'brain-manifest-reference-invalid', ref, field });
      }
    } catch {
      errors.push({ reason_code: 'brain-manifest-reference-invalid', ref, field });
    }
  }
  return errors;
}

function technicalJson(path, label, issues) {
  if (!existsSync(path)) return null;
  try {
    if (lstatSync(path).isSymbolicLink()) throw new Error('symlink-not-allowed');
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    issues.push({ reason_code: `${label}-invalid`, ref: label === 'brain-manifest' ? '.cerebro/manifest.json' : null });
    return null;
  }
}

function safeInside(root, configured, fallback) {
  const brain = resolve(root);
  const target = resolve(root, configured || fallback);
  const rel = relative(brain, target);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) return null;
  return target;
}

function technicalJsonFiles(root, directory, issues, label) {
  if (!directory || !existsSync(directory)) return [];
  try {
    if (lstatSync(directory).isSymbolicLink()) throw new Error('symlink-not-allowed');
    return readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => join(directory, entry.name))
      .sort();
  } catch {
    issues.push({ reason_code: `${label}-directory-invalid`, ref: relative(root, directory).replaceAll('\\', '/') });
    return [];
  }
}

function readValidatedFiles(root, paths, validate, label, issues) {
  return paths.flatMap((path) => {
    const value = technicalJson(path, label, issues);
    if (!value) return [];
    const errors = validate(value);
    if (errors.length) {
      issues.push({ reason_code: `${label}-invalid`, ref: relative(root, path).replaceAll('\\', '/') });
      return [];
    }
    return [{ value, ref: relative(root, path).replaceAll('\\', '/') }];
  });
}

function layoutAssessment(root, issues) {
  const ref = '.cerebro/layout.json';
  const value = technicalJson(join(root, ref), 'layout', issues);
  if (!value || !object(value)) return { valid: false, value: {}, ref };
  const refs = Object.entries(value).filter(([, configured]) => typeof configured === 'string');
  const unsafe = refs.filter(([, configured]) => !safeInside(root, configured, configured));
  const hasSystemRef = typeof value.systemContracts === 'string' || typeof value.systemContract === 'string';
  const valid = Number.isInteger(value.version) && value.version >= 1
    && typeof value.sourceContracts === 'string' && hasSystemRef
    && typeof value.runLedger === 'string' && unsafe.length === 0;
  if (!valid) issues.push({ reason_code: 'layout-incompatible', ref });
  return { valid, value, ref };
}

function systemPaths(root, layout, issues) {
  const found = new Set();
  const directory = safeInside(root, layout.systemContracts, '.cerebro/contracts/systems');
  for (const path of technicalJsonFiles(root, directory, issues, 'system-contract')) found.add(path);
  if (typeof layout.systemContract === 'string') {
    const configured = safeInside(root, layout.systemContract, layout.systemContract);
    if (configured && existsSync(configured)) found.add(configured);
  }
  const systemsRoot = join(root, 'sistemas');
  if (existsSync(systemsRoot) && !lstatSync(systemsRoot).isSymbolicLink()) {
    for (const entry of readdirSync(systemsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const path = join(systemsRoot, entry.name, 'contract.json');
      if (existsSync(path)) found.add(path);
    }
  }
  const activation = join(root, 'operacao', 'arquitetura', 'primeiro-sistema.json');
  if (existsSync(activation)) found.add(activation);
  return [...found].sort();
}

function latestSystems(items) {
  const latest = new Map();
  for (const item of items) {
    const current = latest.get(item.value.system_id);
    if (!current || String(current.value.version).localeCompare(String(item.value.version), undefined, { numeric: true }) < 0) {
      latest.set(item.value.system_id, item);
    }
  }
  return [...latest.values()].sort((left, right) => left.value.system_id.localeCompare(right.value.system_id));
}

function readRunRecords(root, layout, issues) {
  const configured = safeInside(root, layout.runLedger, '.cerebro/ledger/runs.jsonl');
  if (!configured || !existsSync(configured)) return [];
  try {
    if (lstatSync(configured).isSymbolicLink()) throw new Error('symlink-not-allowed');
    const latest = new Map();
    for (const [index, line] of readFileSync(configured, 'utf8').split('\n').filter(Boolean).entries()) {
      let record;
      try { record = JSON.parse(line); } catch { throw new Error(`line-${index + 1}`); }
      const errors = validateRunRecord(record);
      if (errors.length) throw new Error(`line-${index + 1}`);
      latest.set(record.run_id, record);
    }
    return [...latest.values()];
  } catch {
    issues.push({ reason_code: 'run-ledger-invalid', ref: relative(root, configured).replaceAll('\\', '/') });
    return [];
  }
}

function check(id, label, status, reasonCode, evidenceRefs = []) {
  return {
    id,
    label,
    status,
    reason_code: reasonCode,
    evidence_refs: [...new Set(evidenceRefs.filter(Boolean))],
  };
}

function systemReadiness(systems, sourceIds) {
  const ready = [];
  const blocked = [];
  for (const { value: system } of systems) {
    const blockers = [];
    const migrationStage = system.extensions?.migration_stage
      || (system.status === 'active' ? 'active' : system.status === 'proposed' ? 'mapped' : 'configured');
    if (migrationStage !== 'active') blockers.push(`system-not-active:${migrationStage}`);
    if (system.protocol_version !== 2) blockers.push('retrieval-not-declared');
    for (const source of system.sources.filter((item) => item.required)) {
      if (!source.source_id) blockers.push(`source-role-unbound:${source.role}`);
      else if (!sourceIds.has(source.source_id)) blockers.push(`source-contract-missing:${source.source_id}`);
    }
    const item = { system_id: system.system_id, blockers };
    if (blockers.length) blocked.push(item); else ready.push({ system_id: system.system_id });
  }
  return { ready, blocked };
}

function recommendations(classification, checks) {
  const preserve = checks.flatMap((item) => item.status === 'met' ? item.evidence_refs : []);
  const adapt = checks.filter((item) => item.status === 'partial').map((item) => item.reason_code);
  const add = checks.filter((item) => item.status === 'missing').map((item) => item.reason_code);
  if (classification === 'partial-brain' && !adapt.includes('canonical-manifest-missing')) {
    adapt.unshift('canonical-manifest-missing');
  }
  return {
    preserve: [...new Set(preserve)],
    adapt: [...new Set(adapt)],
    add: [...new Set(add)],
    do_not_touch: [
      'conteúdo humano e Fontes canônicas',
      'outputs privados e credenciais',
      'histórico Git ou estrutura existente sem preview e confirmação',
    ],
  };
}

export function readBrainManifest(root) {
  const issues = [];
  const ref = '.cerebro/manifest.json';
  const brainRoot = resolve(root);
  const value = technicalJson(join(brainRoot, ref), 'brain-manifest', issues);
  if (!value) return { status: existsSync(join(resolve(root), ref)) ? 'invalid' : 'missing', ref, value: null, errors: issues };
  const schemaErrors = validateBrainManifest(value)
    .map((reason) => ({ reason_code: 'brain-manifest-invalid', ref, reason }));
  const referenceErrors = schemaErrors.length ? [] : manifestReferenceErrors(brainRoot, value);
  const errors = [...schemaErrors, ...referenceErrors];
  return { status: errors.length ? 'invalid' : 'valid', ref, value, errors };
}

export function buildCompatibilityDiagnostic(root, { now = new Date() } = {}) {
  const brainRoot = resolve(root);
  const observedAt = new Date(now);
  if (!Number.isFinite(observedAt.getTime())) throw new Error('relógio inválido');
  const issues = [];
  const manifest = readBrainManifest(brainRoot);
  issues.push(...manifest.errors);
  const layout = layoutAssessment(brainRoot, issues);
  const legacyRef = '.cerebro/legacy-brain.json';
  const legacy = technicalJson(join(brainRoot, legacyRef), 'legacy-marker', issues);
  const legacyValid = legacy?.protocol === 'company-brain' && legacy?.compatibility === 'legacy-vault';

  const sourceDirectory = safeInside(brainRoot, layout.value.sourceContracts, '.cerebro/contracts/sources');
  const sources = readValidatedFiles(
    brainRoot,
    technicalJsonFiles(brainRoot, sourceDirectory, issues, 'source-contract'),
    validateSourceContract,
    'source-contract',
    issues,
  );
  const systems = latestSystems(readValidatedFiles(
    brainRoot,
    systemPaths(brainRoot, layout.value, issues),
    validateSystemContract,
    'system-contract',
    issues,
  ));
  const runs = readRunRecords(brainRoot, layout.value, issues);

  const routineDirectory = safeInside(brainRoot, layout.value.routineContracts, '.cerebro/contracts/routines');
  const routines = readValidatedFiles(
    brainRoot,
    technicalJsonFiles(brainRoot, routineDirectory, issues, 'routine-contract'),
    validateRoutineContract,
    'routine-contract',
    issues,
  );
  const grantDirectory = safeInside(brainRoot, layout.value.accessGrants, '.cerebro/contracts/access-grants');
  const grants = readValidatedFiles(
    brainRoot,
    technicalJsonFiles(brainRoot, grantDirectory, issues, 'access-grant'),
    validateAccessGrant,
    'access-grant',
    issues,
  );

  const entrypoints = ['COMECE-AQUI.md', 'START-HERE.md', 'AGENTS.md', 'CLAUDE.md', '_START.md']
    .filter((ref) => existsSync(join(brainRoot, ref)));
  const contextRef = typeof layout.value.companyMap === 'string' ? layout.value.companyMap : null;
  const contextExists = contextRef && safeInside(brainRoot, contextRef, contextRef)
    ? existsSync(safeInside(brainRoot, contextRef, contextRef)) : false;
  const hasOrganizedContext = contextExists || ['meu-negocio', 'company', 'knowledge', 'conhecimento']
    .some((name) => existsSync(join(brainRoot, name)));
  const hasBrainTechnicalState = existsSync(join(brainRoot, '.cerebro')) || legacyValid
    || sources.length > 0 || systems.length > 0 || runs.length > 0;

  let classification = 'new';
  if (manifest.status === 'valid' && layout.valid) classification = 'inevita-compatible';
  else if (hasBrainTechnicalState) classification = 'partial-brain';
  else if (hasOrganizedContext || entrypoints.length > 0) classification = 'organized-context';

  const retrievalCount = systems.filter((item) => item.value.protocol_version === 2).length;
  const contextRunCount = runs.filter((record) => record.protocol_version === 2).length;
  const manifestEvidence = manifest.status === 'valid' ? [manifest.ref] : legacyValid ? [legacyRef] : [];
  const sourceRefs = sources.map((item) => item.ref);
  const systemRefs = systems.map((item) => item.ref);
  const ledgerRef = runs.length > 0
    ? relative(brainRoot, safeInside(brainRoot, layout.value.runLedger, '.cerebro/ledger/runs.jsonl')).replaceAll('\\', '/') : null;

  const checks = [
    check('manifest', 'Brain Manifest V1', manifest.status === 'valid' ? 'met' : legacyValid ? 'partial' : 'missing',
      manifest.status === 'valid' ? 'canonical-manifest-valid' : legacyValid ? 'legacy-marker-only' : 'canonical-manifest-missing', manifestEvidence),
    check('layout', 'Layout canônico', layout.valid ? 'met' : layout.value && Object.keys(layout.value).length ? 'partial' : 'missing',
      layout.valid ? 'layout-compatible' : 'layout-incompatible', layout.value && Object.keys(layout.value).length ? [layout.ref] : []),
    check('privacy', 'Fronteira local', manifest.status === 'valid' ? 'met' : legacyValid ? 'partial' : 'missing',
      manifest.status === 'valid' ? 'local-privacy-declared' : legacyValid ? 'legacy-privacy-boundary' : 'privacy-profile-missing', manifestEvidence),
    check('context', 'Mapa de contexto', contextExists ? 'met' : hasOrganizedContext || entrypoints.length ? 'partial' : 'missing',
      contextExists ? 'company-map-present' : hasOrganizedContext || entrypoints.length ? 'organized-context-without-canonical-map' : 'company-context-missing', contextExists ? [contextRef] : entrypoints),
    check('sources', 'Contratos de Fonte', sources.length ? 'met' : 'missing',
      sources.length ? 'source-contracts-valid' : 'source-contracts-missing', sourceRefs),
    check('systems', 'Contratos de Sistema', systems.length ? 'met' : 'missing',
      systems.length ? 'system-contracts-valid' : 'system-contracts-missing', systemRefs),
    check('retrieval', 'Recuperação declarada', systems.length && retrievalCount === systems.length ? 'met' : retrievalCount ? 'partial' : 'missing',
      systems.length && retrievalCount === systems.length ? 'retrieval-v2-complete' : retrievalCount ? 'retrieval-v2-partial' : 'retrieval-v2-missing', systemRefs),
    check('runs', 'Execução observada', runs.length ? 'met' : 'missing',
      runs.length ? 'run-records-valid' : 'run-records-missing', ledgerRef ? [ledgerRef] : []),
    check('context-receipts', 'Recibo exato de contexto', runs.length && contextRunCount === runs.length ? 'met' : contextRunCount ? 'partial' : 'missing',
      runs.length && contextRunCount === runs.length ? 'context-snapshots-complete' : contextRunCount ? 'context-snapshots-partial' : 'context-snapshots-missing', ledgerRef ? [ledgerRef] : []),
  ];
  const met = checks.filter((item) => item.status === 'met').length;
  const stage = runs.length ? 'operational' : sources.length || systems.length ? 'contracted' : 'foundation';
  const sourceIds = new Set(sources.map((item) => item.value.source_id));

  return {
    protocol_version: 1,
    generated_at: observedAt.toISOString(),
    target: {
      classification,
      activation_stage: stage,
      recognized_as: manifest.status === 'valid' ? 'manifest-v1' : legacyValid ? 'legacy-vault' : 'unrecognized',
    },
    manifest: {
      status: manifest.status,
      ref: manifest.ref,
      profile: manifest.status === 'valid' ? manifest.value.profile : null,
      version: manifest.status === 'valid' ? manifest.value.manifest_version : null,
      identity_status: manifest.status === 'valid' && existsSync(join(brainRoot, manifest.value.identity_ref)) ? 'assigned' : 'unassigned',
      runtime_mode: manifest.status === 'valid' ? manifest.value.runtime.mode : null,
    },
    score: { percent: Math.round((met / checks.length) * 100), met, applicable: checks.length },
    checks,
    inventory: {
      sources: { valid: sources.length },
      systems: { valid: systems.length, retrieval_v2: retrievalCount },
      runs: { valid: runs.length, context_snapshot_v2: contextRunCount },
      routines: { valid: routines.length },
      access_grants: { valid: grants.length },
    },
    system_readiness: systemReadiness(systems, sourceIds),
    recommendations: recommendations(classification, checks),
    issues,
    guarantees: {
      read_only: true,
      content_files_opened: false,
      source_connected: false,
      migration_performed: false,
      duplicate_brain_created: false,
    },
  };
}
