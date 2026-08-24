const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const REF_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const LOCAL_REF_RE = /^(?!.*\.\.(?:\/|$))[A-Za-z0-9.][A-Za-z0-9_./:-]{0,255}$/;
const VERSION_RE = /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/;
const ACCEPTED_VERSION_RE = /^\d+(?:\.x|\.\d+(?:\.x|\.\d+)?)?$/;
const ASSURANCES = new Set(['runtime-enforced', 'receipt-audited', 'exported']);
const OPAQUE_REF_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const EXPERIMENT_ID_RE = /^EXP-[A-Za-z0-9_-]{1,48}$/;
const LOCAL_SOURCE_TYPES = new Set([
  'local-folder', 'local-file', 'obsidian', 'git-repository', 'meetings-folder',
  'knowledge-workspace',
]);
const SECRET_VALUE_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/i,
  /\b(?:sk|ghp|github_pat|xox[baprs]|AKIA)[-_A-Za-z0-9]{12,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  /https?:\/\/[^\s/:]+:[^\s/@]+@/,
];
const FORBIDDEN_PAYLOAD_TERMS = [
  'raw', 'bruto', 'content', 'body', 'transcript', 'transcription', 'secret', 'token',
  'password', 'apikey', 'privatekey',
];

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function closed(errors, value, path, keys) {
  if (!object(value)) return;
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${path}.${key} não é permitido`);
  }
}

function string(errors, value, path) {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${path} precisa ser texto não vazio`);
}

function list(errors, value, path, minimum = 0) {
  if (!Array.isArray(value)) errors.push(`${path} precisa ser lista`);
  else if (value.length < minimum) errors.push(`${path} precisa ter pelo menos ${minimum} item(ns)`);
}

function stringList(errors, value, path, minimum = 0) {
  list(errors, value, path, minimum);
  if (!Array.isArray(value)) return;
  for (const [index, item] of value.entries()) string(errors, item, `${path}[${index}]`);
}

function date(errors, value, path, nullable = false) {
  if (nullable && value === null) return;
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) errors.push(`${path} inválido`);
}

function unique(errors, values, path) {
  if (Array.isArray(values) && new Set(values).size !== values.length) {
    errors.push(`${path} não pode repetir valores`);
  }
}

function referenceOnly(errors, value, path) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => referenceOnly(errors, item, `${path}[${index}]`));
    return;
  }
  if (!object(value)) {
    if (typeof value === 'string' && SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(`${path} parece conter segredo; use referência opaca`);
    }
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    const normalized = key.replaceAll('_', '').replaceAll('-', '').toLowerCase();
    const forbidden = key !== 'content_shared_with_inevita'
      && FORBIDDEN_PAYLOAD_TERMS.some((term) => normalized === term
        || normalized.startsWith(term) || normalized.endsWith(term));
    if (forbidden) {
      errors.push(`${path}.${key} carrega payload/segredo; contrato aceita somente referência`);
      continue;
    }
    referenceOnly(errors, item, `${path}.${key}`);
  }
}

function validateRef(errors, value, path) {
  if (!object(value)) {
    errors.push(`${path} precisa ser objeto`);
    return;
  }
  closed(errors, value, path, ['role', 'id']);
  if (!ID_RE.test(value.role || '')) errors.push(`${path}.role inválido`);
  if (!REF_RE.test(value.id || '')) errors.push(`${path}.id inválido`);
}

function validateSystemShape(errors, value, version) {
  const top = [
    'protocol_version', 'system_id', 'name', 'version', 'status', 'result', 'trigger',
    'capability', 'entities', 'sources', 'pipeline', 'permissions', 'eval', 'learning',
    'extensions',
  ];
  if (version === 2) top.push('retrieval', 'artifacts');
  closed(errors, value, 'system_contract', top);
  closed(errors, value.result, 'result', [
    'statement', 'non_success', 'output_type', 'definition_of_done', 'owner', 'human_gate',
  ]);
  closed(errors, value.trigger, 'trigger', ['type', 'description']);
  closed(errors, value.capability, 'capability', ['capability_id', 'version', 'origin']);
  for (const [index, entity] of (Array.isArray(value.entities) ? value.entities : []).entries()) {
    closed(errors, entity, `entities[${index}]`, ['type', 'role', 'required']);
  }
  for (const [index, source] of (Array.isArray(value.sources) ? value.sources : []).entries()) {
    closed(errors, source, `sources[${index}]`, [
      'role', 'source_id', 'required', 'access', 'freshness', 'purpose',
    ]);
  }
  for (const [index, state] of (Array.isArray(value.pipeline) ? value.pipeline : []).entries()) {
    closed(errors, state, `pipeline[${index}]`, ['state', 'input', 'output', 'gate']);
  }
  closed(errors, value.permissions, 'permissions', ['read', 'write', 'external_actions']);
  closed(errors, value.eval, 'eval', [
    'version', 'deterministic_gates', 'human_questions', 'outcome_measure', 'baseline',
  ]);
  closed(errors, value.learning, 'learning', [
    'correction_policy', 'promotion_threshold', 'requires_replay', 'requires_human_approval',
  ]);
  if (value.extensions !== undefined && !object(value.extensions)) errors.push('extensions precisa ser objeto');
}

function validateRetrieval(errors, retrieval, sources) {
  if (!object(retrieval)) {
    errors.push('retrieval precisa ser objeto');
    return;
  }
  closed(errors, retrieval, 'retrieval', [
    'version', 'source_roles', 'conflict_policy', 'fallback', 'stop_conditions',
    'context_budget', 'evidence',
  ]);
  if (!VERSION_RE.test(retrieval.version || '')) errors.push('retrieval.version precisa ser semver');
  list(errors, retrieval.source_roles, 'retrieval.source_roles', 1);
  const declaredRoles = new Set((Array.isArray(sources) ? sources : []).map((source) => source?.role));
  const roles = [];
  const priorities = [];
  for (const [index, item] of (Array.isArray(retrieval.source_roles) ? retrieval.source_roles : []).entries()) {
    const path = `retrieval.source_roles[${index}]`;
    if (!object(item)) {
      errors.push(`${path} precisa ser objeto`);
      continue;
    }
    closed(errors, item, path, [
      'role', 'priority', 'selection', 'filters', 'window', 'required_freshness', 'on_unavailable',
    ]);
    if (!ID_RE.test(item.role || '')) errors.push(`${path}.role inválido`);
    else if (!declaredRoles.has(item.role)) errors.push(`${path}.role não existe em sources`);
    roles.push(item.role);
    if (!Number.isInteger(item.priority) || item.priority < 1) errors.push(`${path}.priority precisa ser inteiro >= 1`);
    priorities.push(item.priority);
    if (!['explicit', 'recent', 'relevant', 'mixed'].includes(item.selection)) errors.push(`${path}.selection inválido`);
    stringList(errors, item.filters, `${path}.filters`);
    string(errors, item.window, `${path}.window`);
    string(errors, item.required_freshness, `${path}.required_freshness`);
    if (!['stop', 'fallback', 'continue-with-gap'].includes(item.on_unavailable)) {
      errors.push(`${path}.on_unavailable inválido`);
    }
  }
  unique(errors, roles, 'retrieval.source_roles.role');
  unique(errors, priorities, 'retrieval.source_roles.priority');
  for (const source of (Array.isArray(sources) ? sources : [])) {
    if (source?.required && !roles.includes(source.role)) {
      errors.push(`retrieval não declara a fonte obrigatória ${source.role}`);
    }
  }
  string(errors, retrieval.conflict_policy, 'retrieval.conflict_policy');
  if (!object(retrieval.fallback)) errors.push('retrieval.fallback precisa ser objeto');
  else {
    closed(errors, retrieval.fallback, 'retrieval.fallback', ['enabled', 'order', 'on_exhausted']);
    if (typeof retrieval.fallback.enabled !== 'boolean') errors.push('retrieval.fallback.enabled precisa ser booleano');
    list(errors, retrieval.fallback.order, 'retrieval.fallback.order', retrieval.fallback.enabled ? 1 : 0);
    for (const [index, role] of (Array.isArray(retrieval.fallback.order) ? retrieval.fallback.order : []).entries()) {
      if (!ID_RE.test(role || '') || !declaredRoles.has(role)) errors.push(`retrieval.fallback.order[${index}] inválido`);
    }
    unique(errors, retrieval.fallback.order, 'retrieval.fallback.order');
    if (!['stop', 'continue-with-gap'].includes(retrieval.fallback.on_exhausted)) {
      errors.push('retrieval.fallback.on_exhausted inválido');
    }
  }
  stringList(errors, retrieval.stop_conditions, 'retrieval.stop_conditions', 1);
  if (!object(retrieval.context_budget)) errors.push('retrieval.context_budget precisa ser objeto');
  else {
    closed(errors, retrieval.context_budget, 'retrieval.context_budget', ['unit', 'maximum', 'per_source_maximum']);
    if (!['tokens', 'items', 'characters'].includes(retrieval.context_budget.unit)) errors.push('retrieval.context_budget.unit inválido');
    if (!Number.isInteger(retrieval.context_budget.maximum) || retrieval.context_budget.maximum < 1) {
      errors.push('retrieval.context_budget.maximum precisa ser inteiro >= 1');
    }
    const perSource = retrieval.context_budget.per_source_maximum;
    if (perSource !== null && (!Number.isInteger(perSource) || perSource < 1)) {
      errors.push('retrieval.context_budget.per_source_maximum precisa ser null ou inteiro >= 1');
    }
    if (Number.isInteger(perSource) && Number.isInteger(retrieval.context_budget.maximum)
      && perSource > retrieval.context_budget.maximum) {
      errors.push('retrieval.context_budget.per_source_maximum não pode exceder maximum');
    }
  }
  if (!object(retrieval.evidence)) errors.push('retrieval.evidence precisa ser objeto');
  else {
    closed(errors, retrieval.evidence, 'retrieval.evidence', ['required', 'provenance', 'minimum_refs']);
    if (retrieval.evidence.required !== true) errors.push('retrieval.evidence.required precisa ser true');
    if (!['per-item', 'per-claim'].includes(retrieval.evidence.provenance)) errors.push('retrieval.evidence.provenance inválido');
    if (!Number.isInteger(retrieval.evidence.minimum_refs) || retrieval.evidence.minimum_refs < 1) {
      errors.push('retrieval.evidence.minimum_refs precisa ser inteiro >= 1');
    }
  }
  referenceOnly(errors, retrieval, 'retrieval');
}

function validateArtifacts(errors, artifacts) {
  if (!object(artifacts)) {
    errors.push('artifacts precisa ser objeto');
    return;
  }
  closed(errors, artifacts, 'artifacts', ['produces', 'consumes']);
  list(errors, artifacts.produces, 'artifacts.produces');
  list(errors, artifacts.consumes, 'artifacts.consumes');
  if (Array.isArray(artifacts.produces) && Array.isArray(artifacts.consumes)
    && artifacts.produces.length + artifacts.consumes.length === 0) {
    errors.push('artifacts precisa declarar ao menos um produces ou consumes');
  }
  const produceRoles = [];
  for (const [index, item] of (Array.isArray(artifacts.produces) ? artifacts.produces : []).entries()) {
    const path = `artifacts.produces[${index}]`;
    if (!object(item)) {
      errors.push(`${path} precisa ser objeto`);
      continue;
    }
    closed(errors, item, path, ['role', 'artifact_type', 'schema_ref', 'schema_version', 'sensitivity']);
    if (!ID_RE.test(item.role || '')) errors.push(`${path}.role inválido`);
    produceRoles.push(item.role);
    if (!ID_RE.test(item.artifact_type || '')) errors.push(`${path}.artifact_type inválido`);
    if (!LOCAL_REF_RE.test(item.schema_ref || '')) errors.push(`${path}.schema_ref inválido`);
    if (!VERSION_RE.test(item.schema_version || '')) errors.push(`${path}.schema_version precisa ser semver`);
    if (!['private', 'team', 'public'].includes(item.sensitivity)) errors.push(`${path}.sensitivity inválido`);
  }
  unique(errors, produceRoles, 'artifacts.produces.role');
  const consumeRoles = [];
  for (const [index, item] of (Array.isArray(artifacts.consumes) ? artifacts.consumes : []).entries()) {
    const path = `artifacts.consumes[${index}]`;
    if (!object(item)) {
      errors.push(`${path} precisa ser objeto`);
      continue;
    }
    closed(errors, item, path, ['role', 'artifact_type', 'schema_ref', 'accepted_versions', 'required']);
    if (!ID_RE.test(item.role || '')) errors.push(`${path}.role inválido`);
    consumeRoles.push(item.role);
    if (!ID_RE.test(item.artifact_type || '')) errors.push(`${path}.artifact_type inválido`);
    if (!LOCAL_REF_RE.test(item.schema_ref || '')) errors.push(`${path}.schema_ref inválido`);
    list(errors, item.accepted_versions, `${path}.accepted_versions`, 1);
    for (const [rangeIndex, range] of (Array.isArray(item.accepted_versions) ? item.accepted_versions : []).entries()) {
      if (!ACCEPTED_VERSION_RE.test(range || '')) errors.push(`${path}.accepted_versions[${rangeIndex}] inválido`);
    }
    unique(errors, item.accepted_versions, `${path}.accepted_versions`);
    if (typeof item.required !== 'boolean') errors.push(`${path}.required precisa ser booleano`);
  }
  unique(errors, consumeRoles, 'artifacts.consumes.role');
  referenceOnly(errors, artifacts, 'artifacts');
}

export function validateSystemContractVersion(value, validateV1) {
  if (!object(value)) return ['system contract precisa ser objeto'];
  if (value.protocol_version === 1) {
    const errors = validateV1(value);
    validateSystemShape(errors, value, 1);
    return [...new Set(errors)];
  }
  if (value.protocol_version !== 2) return ['protocol_version de System Contract suportada: 1 ou 2'];
  const base = { ...value, protocol_version: 1 };
  delete base.retrieval;
  delete base.artifacts;
  const errors = validateV1(base).filter((error) => error !== 'protocol_version precisa ser 1');
  validateSystemShape(errors, value, 2);
  list(errors, value.sources, 'sources', 1);
  validateRetrieval(errors, value.retrieval, value.sources);
  if (value.artifacts !== undefined) validateArtifacts(errors, value.artifacts);
  return [...new Set(errors)];
}

function validateRunShape(errors, value, version) {
  const top = [
    'protocol_version', 'run_id', 'system_id', 'system_version', 'capability', 'status',
    'started_at', 'completed_at', 'entity_refs', 'source_refs', 'output_refs', 'eval',
    'human_decision', 'correction_ref', 'outcomes', 'privacy', 'extensions',
  ];
  if (version === 2) top.push('context_snapshot', 'chain_id', 'mode', 'experiment_ref', 'handoff_refs');
  closed(errors, value, 'run_record', top);
  if (value.capability !== undefined && value.capability !== null) {
    if (!object(value.capability)) errors.push('capability precisa ser objeto ou null');
    else {
      closed(errors, value.capability, 'capability', ['capability_id', 'version']);
      if (!ID_RE.test(value.capability.capability_id || '')) errors.push('capability.capability_id inválido');
      string(errors, value.capability.version, 'capability.version');
    }
  }
  for (const [index, ref] of (Array.isArray(value.entity_refs) ? value.entity_refs : []).entries()) {
    validateRef(errors, ref, `entity_refs[${index}]`);
  }
  for (const [index, ref] of (Array.isArray(value.source_refs) ? value.source_refs : []).entries()) {
    validateRef(errors, ref, `source_refs[${index}]`);
  }
  stringList(errors, value.output_refs, 'output_refs');
  if (!object(value.eval)) errors.push('eval precisa ser objeto');
  else {
    closed(errors, value.eval, 'eval', ['version', 'passed']);
    string(errors, value.eval.version, 'eval.version');
    if (value.eval.passed !== null && typeof value.eval.passed !== 'boolean') {
      errors.push('eval.passed precisa ser booleano ou null');
    }
  }
  if (value.completed_at !== undefined && value.completed_at !== null) date(errors, value.completed_at, 'completed_at');
  if (value.correction_ref !== undefined && value.correction_ref !== null) string(errors, value.correction_ref, 'correction_ref');
  list(errors, value.outcomes || [], 'outcomes');
  for (const [index, outcome] of (Array.isArray(value.outcomes) ? value.outcomes : []).entries()) {
    const path = `outcomes[${index}]`;
    if (!object(outcome)) errors.push(`${path} precisa ser objeto`);
    else {
      closed(errors, outcome, path, ['measure', 'value']);
      if (!ID_RE.test(outcome.measure || '')) errors.push(`${path}.measure inválido`);
      if (!['string', 'number', 'boolean'].includes(typeof outcome.value)) errors.push(`${path}.value inválido`);
    }
  }
  if (!object(value.privacy)) errors.push('privacy precisa ser objeto');
  else closed(errors, value.privacy, 'privacy', ['content_shared_with_inevita']);
  if (value.extensions !== undefined && !object(value.extensions)) errors.push('extensions precisa ser objeto');
  if (version === 2) {
    const lineageDeclared = ['chain_id', 'mode', 'experiment_ref', 'handoff_refs']
      .some((key) => Object.hasOwn(value, key));
    if (lineageDeclared) {
      if (value.chain_id !== null && !OPAQUE_REF_RE.test(value.chain_id || '')) errors.push('chain_id inválido');
      if (value.chain_id === null && value.mode !== null) errors.push('mode exige chain_id');
      if (value.chain_id !== null && !['replay', 'live'].includes(value.mode)) errors.push('chain_id exige mode replay ou live');
      if (value.mode !== null && value.mode !== undefined && !['replay', 'live'].includes(value.mode)) errors.push('mode inválido');
      if (value.experiment_ref !== null && value.experiment_ref !== undefined
        && !EXPERIMENT_ID_RE.test(value.experiment_ref || '')) errors.push('experiment_ref inválido');
      if (value.experiment_ref && !value.chain_id) errors.push('experiment_ref exige chain_id');
      stringList(errors, value.handoff_refs, 'handoff_refs');
      unique(errors, value.handoff_refs, 'handoff_refs');
      for (const [index, ref] of (Array.isArray(value.handoff_refs) ? value.handoff_refs : []).entries()) {
        if (!LOCAL_REF_RE.test(ref || '')) errors.push(`handoff_refs[${index}] inválido`);
      }
    }
  }
}

function validateContextSnapshot(errors, snapshot, run) {
  if (!object(snapshot)) {
    errors.push('context_snapshot precisa ser objeto');
    return;
  }
  closed(errors, snapshot, 'context_snapshot', [
    'system_contract_version', 'retrieval_version', 'observed_at', 'accesses', 'gaps',
    'fallbacks', 'conflicts',
  ]);
  string(errors, snapshot.system_contract_version, 'context_snapshot.system_contract_version');
  if (snapshot.system_contract_version !== run.system_version) {
    errors.push('context_snapshot.system_contract_version precisa corresponder a system_version');
  }
  string(errors, snapshot.retrieval_version, 'context_snapshot.retrieval_version');
  date(errors, snapshot.observed_at, 'context_snapshot.observed_at');
  list(errors, snapshot.accesses, 'context_snapshot.accesses', 1);
  const runSourceRefs = new Set((Array.isArray(run.source_refs) ? run.source_refs : [])
    .map((ref) => `${ref?.role}:${ref?.id}`));
  for (const [index, access] of (Array.isArray(snapshot.accesses) ? snapshot.accesses : []).entries()) {
    const path = `context_snapshot.accesses[${index}]`;
    if (!object(access)) {
      errors.push(`${path} precisa ser objeto`);
      continue;
    }
    closed(errors, access, path, [
      'source_ref', 'selected_refs', 'query', 'filters', 'window', 'freshness_marker', 'assurance',
    ]);
    validateRef(errors, access.source_ref, `${path}.source_ref`);
    if (object(access.source_ref)
      && !runSourceRefs.has(`${access.source_ref.role}:${access.source_ref.id}`)) {
      errors.push(`${path}.source_ref não existe em source_refs`);
    }
    stringList(errors, access.selected_refs, `${path}.selected_refs`, 1);
    string(errors, access.query, `${path}.query`);
    stringList(errors, access.filters, `${path}.filters`);
    string(errors, access.window, `${path}.window`);
    if (access.freshness_marker !== null) string(errors, access.freshness_marker, `${path}.freshness_marker`);
    if (!ASSURANCES.has(access.assurance)) errors.push(`${path}.assurance inválido`);
  }
  list(errors, snapshot.gaps, 'context_snapshot.gaps');
  for (const [index, gap] of (Array.isArray(snapshot.gaps) ? snapshot.gaps : []).entries()) {
    const path = `context_snapshot.gaps[${index}]`;
    if (!object(gap)) errors.push(`${path} precisa ser objeto`);
    else {
      closed(errors, gap, path, ['source_role', 'reason_code', 'detail_ref']);
      if (!ID_RE.test(gap.source_role || '')) errors.push(`${path}.source_role inválido`);
      if (!ID_RE.test(gap.reason_code || '')) errors.push(`${path}.reason_code inválido`);
      if (gap.detail_ref !== null) string(errors, gap.detail_ref, `${path}.detail_ref`);
    }
  }
  list(errors, snapshot.fallbacks, 'context_snapshot.fallbacks');
  for (const [index, fallback] of (Array.isArray(snapshot.fallbacks) ? snapshot.fallbacks : []).entries()) {
    const path = `context_snapshot.fallbacks[${index}]`;
    if (!object(fallback)) errors.push(`${path} precisa ser objeto`);
    else {
      closed(errors, fallback, path, ['from_role', 'to_role', 'reason_code']);
      for (const field of ['from_role', 'to_role', 'reason_code']) {
        if (!ID_RE.test(fallback[field] || '')) errors.push(`${path}.${field} inválido`);
      }
    }
  }
  list(errors, snapshot.conflicts, 'context_snapshot.conflicts');
  for (const [index, conflict] of (Array.isArray(snapshot.conflicts) ? snapshot.conflicts : []).entries()) {
    const path = `context_snapshot.conflicts[${index}]`;
    if (!object(conflict)) errors.push(`${path} precisa ser objeto`);
    else {
      closed(errors, conflict, path, ['source_roles', 'resolution', 'decision_ref']);
      list(errors, conflict.source_roles, `${path}.source_roles`, 2);
      for (const [roleIndex, role] of (Array.isArray(conflict.source_roles) ? conflict.source_roles : []).entries()) {
        if (!ID_RE.test(role || '')) errors.push(`${path}.source_roles[${roleIndex}] inválido`);
      }
      if (!['authority-wins', 'freshest-wins', 'human-decision', 'unresolved'].includes(conflict.resolution)) {
        errors.push(`${path}.resolution inválido`);
      }
      if (conflict.resolution === 'human-decision' && !conflict.decision_ref) {
        errors.push(`${path}.decision_ref obrigatório para decisão humana`);
      }
      if (conflict.decision_ref !== null) string(errors, conflict.decision_ref, `${path}.decision_ref`);
    }
  }
  referenceOnly(errors, snapshot, 'context_snapshot');
}

export function validateRunRecordVersion(value, validateV1) {
  if (!object(value)) return ['run record precisa ser objeto'];
  if (value.protocol_version === 1) {
    const errors = validateV1(value);
    validateRunShape(errors, value, 1);
    return [...new Set(errors)];
  }
  if (value.protocol_version !== 2) return ['protocol_version de Run Record suportada: 1 ou 2'];
  const base = { ...value, protocol_version: 1 };
  delete base.context_snapshot;
  delete base.chain_id;
  delete base.mode;
  delete base.experiment_ref;
  delete base.handoff_refs;
  const errors = validateV1(base).filter((error) => error !== 'protocol_version precisa ser 1');
  validateRunShape(errors, value, 2);
  validateContextSnapshot(errors, value.context_snapshot, value);
  return [...new Set(errors)];
}

export function validateSourceContract(value) {
  const errors = [];
  if (!object(value)) return ['source contract precisa ser objeto'];
  closed(errors, value, 'source_contract', [
    'protocol_version', 'source_id', 'name', 'type', 'status', 'truth', 'authority', 'scope',
    'sensitivity', 'pii', 'modes', 'freshness', 'retention', 'revocation', 'connector',
    'authorized_consumers', 'assurance', 'extensions',
  ]);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!ID_RE.test(value.source_id || '')) errors.push('source_id inválido');
  string(errors, value.name, 'name');
  if (!ID_RE.test(value.type || '')) errors.push('type inválido');
  if (!['mapped', 'active', 'degraded', 'revoked'].includes(value.status)) errors.push('status inválido');
  if (!object(value.truth)) errors.push('truth precisa ser objeto');
  else {
    closed(errors, value.truth, 'truth', ['home_ref', 'source_of_truth']);
    string(errors, value.truth.home_ref, 'truth.home_ref');
    if (typeof value.truth.source_of_truth !== 'boolean') errors.push('truth.source_of_truth precisa ser booleano');
  }
  if (!object(value.authority)) errors.push('authority precisa ser objeto');
  else {
    closed(errors, value.authority, 'authority', ['owner_ref', 'status']);
    if (value.authority.owner_ref !== null && !REF_RE.test(value.authority.owner_ref || '')) errors.push('authority.owner_ref inválido');
    if (!['confirmed', 'unconfirmed'].includes(value.authority.status)) errors.push('authority.status inválido');
    if (value.authority.status === 'confirmed' && value.authority.owner_ref === null) errors.push('authority.owner_ref obrigatório quando confirmado');
  }
  if (!object(value.scope)) errors.push('scope precisa ser objeto');
  else {
    closed(errors, value.scope, 'scope', ['purpose', 'entity_types', 'boundaries']);
    string(errors, value.scope.purpose, 'scope.purpose');
    list(errors, value.scope.entity_types, 'scope.entity_types');
    for (const [index, entity] of (Array.isArray(value.scope.entity_types) ? value.scope.entity_types : []).entries()) {
      if (!ID_RE.test(entity || '')) errors.push(`scope.entity_types[${index}] inválido`);
    }
    stringList(errors, value.scope.boundaries, 'scope.boundaries');
  }
  if (!['private', 'team', 'public'].includes(value.sensitivity)) errors.push('sensitivity inválido');
  if (!object(value.pii)) errors.push('pii precisa ser objeto');
  else {
    closed(errors, value.pii, 'pii', ['classification', 'handling']);
    if (!['unknown', 'none', 'possible', 'contains'].includes(value.pii.classification)) errors.push('pii.classification inválido');
    if (!['reference-only', 'local-processing', 'not-applicable'].includes(value.pii.handling)) errors.push('pii.handling inválido');
  }
  list(errors, value.modes, 'modes', 1);
  for (const [index, mode] of (Array.isArray(value.modes) ? value.modes : []).entries()) {
    if (!['read', 'propose', 'write-with-approval', 'external-action'].includes(mode)) errors.push(`modes[${index}] inválido`);
  }
  unique(errors, value.modes, 'modes');
  if (!object(value.freshness)) errors.push('freshness precisa ser objeto');
  else {
    closed(errors, value.freshness, 'freshness', ['policy', 'observed_at']);
    string(errors, value.freshness.policy, 'freshness.policy');
    date(errors, value.freshness.observed_at, 'freshness.observed_at', true);
  }
  if (!object(value.retention)) errors.push('retention precisa ser objeto');
  else {
    closed(errors, value.retention, 'retention', ['policy', 'until']);
    string(errors, value.retention.policy, 'retention.policy');
    date(errors, value.retention.until, 'retention.until', true);
  }
  if (!object(value.revocation)) errors.push('revocation precisa ser objeto');
  else {
    closed(errors, value.revocation, 'revocation', ['method', 'effect', 'revocable']);
    string(errors, value.revocation.method, 'revocation.method');
    if (!['future-only', 'receipt-only', 'irreversible-export'].includes(value.revocation.effect)) errors.push('revocation.effect inválido');
    if (typeof value.revocation.revocable !== 'boolean') errors.push('revocation.revocable precisa ser booleano');
  }
  if (!object(value.connector)) errors.push('connector precisa ser objeto');
  else {
    closed(errors, value.connector, 'connector', ['kind', 'binding_ref', 'credential_ref', 'custody']);
    if (!ID_RE.test(value.connector.kind || '')) errors.push('connector.kind inválido');
    if (value.connector.binding_ref !== null) string(errors, value.connector.binding_ref, 'connector.binding_ref');
    if (value.connector.credential_ref !== null && !LOCAL_REF_RE.test(value.connector.credential_ref || '')) errors.push('connector.credential_ref inválido');
    if (!['runtime-exclusive', 'agent-direct', 'none'].includes(value.connector.custody)) errors.push('connector.custody inválido');
  }
  list(errors, value.authorized_consumers, 'authorized_consumers');
  for (const [index, consumer] of (Array.isArray(value.authorized_consumers) ? value.authorized_consumers : []).entries()) {
    const path = `authorized_consumers[${index}]`;
    if (!object(consumer)) errors.push(`${path} precisa ser objeto`);
    else {
      closed(errors, consumer, path, ['subject_type', 'subject_ref']);
      if (!['system', 'agent', 'role', 'person'].includes(consumer.subject_type)) errors.push(`${path}.subject_type inválido`);
      if (!REF_RE.test(consumer.subject_ref || '')) errors.push(`${path}.subject_ref inválido`);
    }
  }
  if (!ASSURANCES.has(value.assurance)) errors.push('assurance inválido');
  if (value.assurance === 'runtime-enforced') {
    if (LOCAL_SOURCE_TYPES.has(value.type)) errors.push('fonte local não pode declarar runtime-enforced');
    if (value.connector?.custody !== 'runtime-exclusive') errors.push('runtime-enforced exige connector.custody runtime-exclusive');
    if (!value.connector?.credential_ref) errors.push('runtime-enforced exige connector.credential_ref opaco');
  }
  if (value.assurance === 'exported') {
    if (value.revocation?.effect !== 'irreversible-export' || value.revocation?.revocable !== false) {
      errors.push('exported exige revogação marcada como cópia irreversível e não revogável');
    }
    if (value.connector?.custody !== 'none') errors.push('exported exige connector.custody none');
  }
  if (value.revocation?.effect === 'irreversible-export' && value.revocation?.revocable !== false) {
    errors.push('irreversible-export não pode ser revogável');
  }
  if (value.extensions !== undefined && !object(value.extensions)) errors.push('extensions precisa ser objeto');
  referenceOnly(errors, value, 'source_contract');
  return [...new Set(errors)];
}

export function validateAccessGrant(value) {
  const errors = [];
  if (!object(value)) return ['access grant precisa ser objeto'];
  closed(errors, value, 'access_grant', [
    'protocol_version', 'grant_id', 'subject', 'scope', 'mode', 'assurance', 'custody',
    'reason', 'issued_at', 'expires_at', 'revoked_at', 'approved_by', 'credential_ref',
    'receipts', 'extensions',
  ]);
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!REF_RE.test(value.grant_id || '')) errors.push('grant_id inválido');
  if (!object(value.subject)) errors.push('subject precisa ser objeto');
  else {
    closed(errors, value.subject, 'subject', ['type', 'ref']);
    if (!['system', 'agent', 'role', 'person'].includes(value.subject.type)) errors.push('subject.type inválido');
    if (!REF_RE.test(value.subject.ref || '')) errors.push('subject.ref inválido');
  }
  if (!object(value.scope)) errors.push('scope precisa ser objeto');
  else {
    closed(errors, value.scope, 'scope', ['company_ref', 'unit_ref', 'system_refs', 'source_refs', 'actions']);
    if (!REF_RE.test(value.scope.company_ref || '')) errors.push('scope.company_ref inválido');
    if (value.scope.unit_ref !== null && !REF_RE.test(value.scope.unit_ref || '')) errors.push('scope.unit_ref inválido');
    list(errors, value.scope.system_refs, 'scope.system_refs', 1);
    for (const [index, ref] of (Array.isArray(value.scope.system_refs) ? value.scope.system_refs : []).entries()) {
      if (!ID_RE.test(ref || '')) errors.push(`scope.system_refs[${index}] inválido`);
    }
    list(errors, value.scope.source_refs, 'scope.source_refs', 1);
    for (const [index, ref] of (Array.isArray(value.scope.source_refs) ? value.scope.source_refs : []).entries()) {
      if (!REF_RE.test(ref || '')) errors.push(`scope.source_refs[${index}] inválido`);
    }
    list(errors, value.scope.actions, 'scope.actions', 1);
    for (const [index, action] of (Array.isArray(value.scope.actions) ? value.scope.actions : []).entries()) {
      if (!ID_RE.test(action || '')) errors.push(`scope.actions[${index}] inválido`);
    }
  }
  if (!['read', 'propose', 'write-with-approval', 'external-action'].includes(value.mode)) errors.push('mode inválido');
  if (!ASSURANCES.has(value.assurance)) errors.push('assurance inválido');
  if (!['runtime-exclusive', 'agent-direct', 'exported-copy'].includes(value.custody)) errors.push('custody inválido');
  string(errors, value.reason, 'reason');
  date(errors, value.issued_at, 'issued_at');
  date(errors, value.expires_at, 'expires_at', true);
  date(errors, value.revoked_at, 'revoked_at', true);
  if (!REF_RE.test(value.approved_by || '')) errors.push('approved_by obrigatório e precisa ser referência opaca');
  if (value.credential_ref !== null && !LOCAL_REF_RE.test(value.credential_ref || '')) errors.push('credential_ref inválido');
  if (!object(value.receipts)) errors.push('receipts precisa ser objeto');
  else {
    closed(errors, value.receipts, 'receipts', ['use_refs', 'revocation_ref']);
    stringList(errors, value.receipts.use_refs, 'receipts.use_refs');
    if (value.receipts.revocation_ref !== null) string(errors, value.receipts.revocation_ref, 'receipts.revocation_ref');
  }
  const issued = Date.parse(value.issued_at || '');
  if (value.expires_at && Date.parse(value.expires_at) <= issued) errors.push('expires_at precisa ser posterior a issued_at');
  if (value.revoked_at && Date.parse(value.revoked_at) < issued) errors.push('revoked_at não pode ser anterior a issued_at');
  if (value.revoked_at && !value.receipts?.revocation_ref) errors.push('grant revogado exige receipts.revocation_ref');
  if (value.assurance === 'runtime-enforced') {
    if (value.custody !== 'runtime-exclusive') errors.push('runtime-enforced exige custody runtime-exclusive');
    if (!value.credential_ref) errors.push('runtime-enforced exige credential_ref opaco');
  }
  if (value.assurance === 'receipt-audited' && value.custody === 'exported-copy') {
    errors.push('receipt-audited não pode declarar custody exported-copy');
  }
  if (value.assurance === 'exported') {
    if (value.custody !== 'exported-copy') errors.push('exported exige custody exported-copy');
    if (value.credential_ref !== null) errors.push('cópia exportada não carrega credential_ref');
  }
  if (value.extensions !== undefined && !object(value.extensions)) errors.push('extensions precisa ser objeto');
  referenceOnly(errors, value, 'access_grant');
  return [...new Set(errors)];
}
