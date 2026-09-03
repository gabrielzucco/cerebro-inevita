import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve, sep } from 'node:path';
import {
  layout,
  readJson,
  validateSourceContract,
  validateSystemContract,
} from './system-protocol.mjs';
import {
  normalizeBusinessFunction,
  normalizeOperatingArea,
} from './system-taxonomy.mjs';

const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const STAGES = new Set(['mapped', 'configured', 'active']);
const HUMAN_STATUS = new Map([
  ['rascunho', { contract: 'proposed', stage: 'mapped' }],
  ['operado', { contract: 'confirmed', stage: 'configured' }],
  ['repetivel', { contract: 'confirmed', stage: 'configured' }],
  ['instrumentado', { contract: 'confirmed', stage: 'configured' }],
]);

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function fail(message) {
  throw new Error(`importação dos Sistemas: ${message}`);
}

function within(root, path, label) {
  const base = resolve(root);
  const target = resolve(root, path);
  const rel = relative(base, target);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) fail(`${label} aponta para fora do Cérebro`);
  return target;
}

function normalizedPath(root, path) {
  return relative(root, path).replaceAll('\\', '/');
}

function parseScalar(raw) {
  const value = raw.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  return value;
}

export function parseSystemManifest(markdown, manifestRef = 'manifest.md') {
  if (typeof markdown !== 'string' || !markdown.startsWith('---\n')) fail(`${manifestRef} não possui frontmatter`);
  const end = markdown.indexOf('\n---\n', 4);
  if (end < 0) fail(`${manifestRef} possui frontmatter sem fechamento`);
  const frontmatter = {};
  for (const line of markdown.slice(4, end).split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const separator = line.indexOf(':');
    if (separator < 1) fail(`${manifestRef} contém frontmatter não suportado: ${line}`);
    frontmatter[line.slice(0, separator).trim()] = parseScalar(line.slice(separator + 1));
  }
  const body = markdown.slice(end + 5);
  const field = (label) => {
    const lines = body.split('\n');
    const start = lines.findIndex((line) => new RegExp(`^- \\*\\*${label}:\\*\\*`, 'i').test(line.trim()));
    if (start < 0) fail(`${manifestRef} não declara ${label}`);
    const parts = [lines[start].replace(new RegExp(`^- \\*\\*${label}:\\*\\*\\s*`, 'i'), '').trim()];
    for (let index = start + 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line.trim() || /^\s*-\s+\*\*/.test(line) || /^##\s/.test(line)) break;
      parts.push(line.trim());
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };
  const required = ['sistema-id', 'nome', 'estado', 'versao', 'resultado', 'proximo-gate'];
  for (const key of required) {
    if (typeof frontmatter[key] !== 'string' || !frontmatter[key].trim()) fail(`${manifestRef} não declara ${key}`);
  }
  if (!ID_RE.test(frontmatter['sistema-id'])) fail(`${manifestRef} possui sistema-id inválido`);
  if (!HUMAN_STATUS.has(frontmatter.estado)) fail(`${manifestRef} possui estado humano não mapeado: ${frontmatter.estado}`);
  return {
    frontmatter,
    human: {
      job: field('Job'),
      output: field('Output verificável'),
      setpoint: field('Setpoint(?: inicial)?'),
      nonSuccess: field('Não é sucesso'),
    },
  };
}

function readConfig(root, configPath) {
  const path = within(root, configPath, 'configuração');
  if (!existsSync(path)) fail(`configuração não encontrada: ${configPath}`);
  const value = readJson(path, 'configuração de migração');
  if (!object(value) || value.protocol_version !== 1) fail('configuração precisa usar protocol_version 1');
  if (typeof value.company_ref !== 'string' || !value.company_ref.trim()) fail('company_ref obrigatório');
  if (!Array.isArray(value.sources) || !Array.isArray(value.systems) || value.systems.length < 1) {
    fail('configuração precisa declarar sources e systems');
  }
  const ids = new Set();
  for (const system of value.systems) {
    if (!object(system) || !ID_RE.test(system.system_id || '')) fail('system_id inválido na configuração');
    if (ids.has(system.system_id)) fail(`system_id repetido: ${system.system_id}`);
    ids.add(system.system_id);
    if (typeof system.manifest_ref !== 'string' || !system.manifest_ref.trim()) fail(`${system.system_id} sem manifest_ref`);
    const operatingArea = normalizeOperatingArea(system.operating_area || system.area_ref);
    if (!ID_RE.test(operatingArea)) fail(`${system.system_id} sem operating_area válida`);
    const businessFunction = normalizeBusinessFunction(system.business_function);
    if (system.business_function !== undefined && businessFunction === 'unclassified') {
      fail(`${system.system_id} possui business_function inválida`);
    }
    if (system.contract_alias !== undefined && !ID_RE.test(system.contract_alias || '')) fail(`${system.system_id} possui contract_alias inválido`);
    if (system.stage !== undefined && !STAGES.has(system.stage)) fail(`${system.system_id} possui stage inválido`);
    if (!Array.isArray(system.source_refs)) fail(`${system.system_id} precisa declarar source_refs`);
    for (const sourceRef of system.source_refs) {
      if (!ID_RE.test(sourceRef || '')) fail(`${system.system_id} possui source_ref inválida: ${sourceRef}`);
    }
  }
  return { path, value };
}

function sourceRole(sourceId, index) {
  return {
    role: sourceId,
    source_id: sourceId,
    required: index === 0,
    access: 'read-only',
    freshness: 'vigente no momento do run',
    purpose: 'Sustentar o resultado com evidência da casa de verdade declarada.',
  };
}

function reconstructedSource(sourceId) {
  return {
    protocol_version: 1,
    source_id: sourceId,
    name: sourceId.replaceAll('-', ' ').replace(/(^|\s)\S/g, (value) => value.toUpperCase()),
    type: 'legacy-reference',
    status: 'mapped',
    truth: { home_ref: `legacy-map:${sourceId}`, source_of_truth: false },
    authority: { owner_ref: 'role-founders', status: 'unconfirmed' },
    scope: {
      purpose: 'Preservar o papel de fonte declarado no mapa versionado até o conector vivo fornecer o readback.',
      entity_types: ['evidence'],
      boundaries: ['Não representa conexão ativa', 'Conteúdo bruto não é copiado para o runtime'],
    },
    sensitivity: 'private',
    pii: { classification: 'unknown', handling: 'reference-only' },
    modes: ['read'],
    freshness: { policy: 'aguarda readback do control plane', observed_at: null },
    retention: { policy: 'somente contrato reconstruível', until: null },
    revocation: { method: 'remover o vínculo do mapa versionado', effect: 'receipt-only', revocable: true },
    connector: { kind: 'unbound', binding_ref: null, credential_ref: null, custody: 'none' },
    authorized_consumers: [],
    assurance: 'receipt-audited',
    extensions: { migration: { kind: 'manifest-map-reconstruction', protocol_version: 1 } },
  };
}

function outputType(systemId) {
  const direct = `${systemId}-result`;
  if (ID_RE.test(direct)) return direct;
  const digest = createHash('sha256').update(systemId).digest('hex').slice(0, 8);
  return `${systemId.slice(0, 47)}-${digest}-result`;
}

function generatedSystem(manifest, item) {
  const { frontmatter, human } = manifest;
  const mapped = HUMAN_STATUS.get(frontmatter.estado);
  const stage = item.stage || mapped.stage;
  const sources = item.source_refs.map(sourceRole);
  if (sources.length < 1) fail(`${item.system_id} precisa de ao menos uma Fonte para declarar retrieval`);
  return {
    protocol_version: 2,
    system_id: item.system_id,
    name: frontmatter.nome,
    version: frontmatter.versao,
    status: mapped.contract,
    result: {
      statement: frontmatter.resultado,
      non_success: human.nonSuccess,
      output_type: outputType(item.system_id),
      definition_of_done: human.output,
      owner: item.owner_ref || 'role-system-owner',
      human_gate: frontmatter['proximo-gate'],
    },
    trigger: {
      type: 'manual',
      description: 'Execução iniciada por decisão explícita do responsável até existir Routine Contract aprovado.',
    },
    capability: { capability_id: item.system_id, version: frontmatter.versao, origin: 'local' },
    entities: [],
    sources,
    retrieval: {
      version: '1.0.0',
      source_roles: sources.map((source, index) => ({
        role: source.role,
        priority: index + 1,
        selection: 'mixed',
        filters: [`manifest-ref:${item.manifest_ref}`],
        window: 'recorte vigente no momento do run',
        required_freshness: source.freshness,
        on_unavailable: source.required ? 'stop' : 'continue-with-gap',
      })),
      conflict_policy: 'A casa de verdade declarada prevalece; conflito sem resolução interrompe o claim afetado.',
      fallback: { enabled: false, order: [], on_exhausted: 'stop' },
      stop_conditions: ['Fonte obrigatória ausente, sem autoridade confirmada ou sem proveniência verificável.'],
      context_budget: { unit: 'items', maximum: 40, per_source_maximum: 10 },
      evidence: { required: true, provenance: 'per-claim', minimum_refs: 1 },
    },
    pipeline: [
      {
        state: 'recuperar-contexto',
        input: item.source_refs.join(', '),
        output: 'Referências de contexto selecionadas com proveniência e lacunas explícitas.',
        gate: 'Toda Fonte obrigatória está disponível ou o run para antes do modelo.',
      },
      {
        state: 'produzir-resultado',
        input: human.job,
        output: human.output,
        gate: human.setpoint,
      },
      {
        state: 'julgar-resultado',
        input: human.output,
        output: 'Decisão humana e próximo ciclo registrados por referência.',
        gate: frontmatter['proximo-gate'],
      },
    ],
    permissions: {
      read: item.source_refs.map((sourceRef) => `source:${sourceRef}`),
      write: [`result:${item.system_id}`],
      external_actions: false,
    },
    eval: {
      version: '1.0.0',
      deterministic_gates: [human.setpoint],
      human_questions: [`O próximo gate foi cumprido: ${frontmatter['proximo-gate']}?`],
      outcome_measure: human.setpoint,
      baseline: null,
    },
    learning: {
      correction_policy: 'candidate-first',
      promotion_threshold: 3,
      requires_replay: true,
      requires_human_approval: true,
    },
    extensions: migrationExtensions(manifest, item, stage),
  };
}

function migrationExtensions(manifest, item, stage) {
  const meta = manifest.frontmatter;
  return {
    operating_area: normalizeOperatingArea(item.operating_area || item.area_ref),
    business_function: normalizeBusinessFunction(item.business_function),
    portfolio_system_ref: item.system_id,
    portfolio_name: meta.nome,
    migration_stage: stage,
    source_manifest_ref: item.manifest_ref,
    human_maturity: meta.estado,
    component_statuses: {
      pipeline: meta['pipeline-status'] || 'nao-declarado',
      routines: meta['rotinas-status'] || 'nao-declarado',
      skills: meta['skills-status'] || 'nao-declarado',
      interfaces: meta['interfaces-status'] || 'nao-declarado',
      gates: meta['gates-status'] || 'nao-declarado',
      evals: meta['evals-status'] || 'nao-declarado',
      learning: meta['melhoria-status'] || 'nao-declarado',
    },
    publication: meta.publicacao || 'nao-declarado',
    next_gate: meta['proximo-gate'],
    migration: { kind: 'manifest-link', protocol_version: 1 },
  };
}

function stable(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function planWrite(root, path, value, kind, id, { managed = false } = {}) {
  const next = stable(value);
  if (!existsSync(path)) return { action: 'create', path, value, next, kind, id };
  const current = readFileSync(path, 'utf8');
  if (current === next) return { action: 'no-change', path, value, next, kind, id };
  if (!managed) fail(`conflito em ${normalizedPath(root, path)}; importador não sobrescreve contrato não gerenciado`);
  return { action: 'update', path, value, next, kind, id };
}

function atomicWrite(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, value, { mode: 0o600 });
  renameSync(temporary, path);
}

export function previewLegacySystemImport(root, {
  configPath = '.cerebro/migration/system-map.v1.json',
  reconstruct = false,
} = {}) {
  const brain = resolve(root);
  const { value: config } = readConfig(brain, configPath);
  const configuredLayout = layout(brain);
  const systemDirectory = within(brain, configuredLayout.systemContracts || '.cerebro/contracts/systems', 'systemContracts');
  const sourceDirectory = within(brain, configuredLayout.sourceContracts || '.cerebro/contracts/sources', 'sourceContracts');
  const configuredSourceIds = new Set(config.sources.map((source) => source.source_id));
  if (configuredSourceIds.size !== config.sources.length) fail('source_id repetido na configuração');
  const missingSourceIds = [...new Set(config.systems.flatMap((system) => system.source_refs))]
    .filter((sourceId) => !configuredSourceIds.has(sourceId));
  const sources = reconstruct
    ? [...config.sources, ...missingSourceIds.map(reconstructedSource)]
    : config.sources;
  const sourceIds = new Set(sources.map((source) => source.source_id));
  const operations = [];

  for (const source of sources) {
    const errors = validateSourceContract(source);
    if (errors.length) fail(`Source Contract ${source.source_id} inválido: ${errors.join(' · ')}`);
    const target = join(sourceDirectory, `${source.source_id}.json`);
    const managed = existsSync(target)
      && readJson(target, 'Source Contract existente').extensions?.migration?.kind === 'manifest-map';
    operations.push(planWrite(brain, target, source, 'source', source.source_id, { managed }));
  }

  for (const item of config.systems) {
    const manifestPath = within(brain, item.manifest_ref, `${item.system_id}.manifest_ref`);
    if (!existsSync(manifestPath)) fail(`manifesto não encontrado: ${item.manifest_ref}`);
    const manifest = parseSystemManifest(readFileSync(manifestPath, 'utf8'), item.manifest_ref);
    if (manifest.frontmatter['sistema-id'] !== item.system_id) fail(`${item.manifest_ref} não corresponde a ${item.system_id}`);
    for (const sourceRef of item.source_refs) {
      const target = join(sourceDirectory, `${sourceRef}.json`);
      if (!sourceIds.has(sourceRef) && !existsSync(target)) fail(`${item.system_id} referencia Fonte inexistente: ${sourceRef}`);
    }
    const contractId = item.contract_alias || item.system_id;
    const target = join(systemDirectory, `${contractId}.json`);
    let contract;
    let managed = false;
    if (item.contract_alias) {
      if (!existsSync(target)) {
        if (!reconstruct) fail(`${item.system_id} aponta para alias ausente: ${item.contract_alias}`);
        contract = { ...generatedSystem(manifest, item), system_id: item.contract_alias };
      } else {
        const existing = readJson(target, 'System Contract existente');
        const currentErrors = validateSystemContract(existing);
        if (currentErrors.length) fail(`alias ${item.contract_alias} inválido: ${currentErrors.join(' · ')}`);
        const declaredSourceRefs = existing.sources.map((source) => source.source_id).filter(Boolean).sort();
        const mappedSourceRefs = [...item.source_refs].sort();
        if (mappedSourceRefs.length < 1 || JSON.stringify(mappedSourceRefs) !== JSON.stringify(declaredSourceRefs)) {
          fail(`${item.system_id} precisa repetir exatamente as Fontes declaradas pelo alias ${item.contract_alias}`);
        }
        const mapped = HUMAN_STATUS.get(manifest.frontmatter.estado);
        const stage = item.stage || (existing.status === 'active' ? 'active' : mapped.stage);
        contract = {
          ...existing,
          extensions: { ...existing.extensions, ...migrationExtensions(manifest, item, stage) },
        };
        managed = true;
      }
    } else {
      contract = generatedSystem(manifest, item);
      managed = existsSync(target)
        && readJson(target, 'System Contract existente').extensions?.migration?.kind === 'manifest-link';
    }
    const errors = validateSystemContract(contract);
    if (errors.length) fail(`System Contract ${contractId} inválido: ${errors.join(' · ')}`);
    operations.push(planWrite(brain, target, contract, 'system', item.system_id, { managed }));
  }

  const count = (action, kind) => operations.filter((item) => item.action === action && (!kind || item.kind === kind)).length;
  return {
    status: count('create') + count('update') > 0 ? 'ready' : 'no-change',
    company_ref: config.company_ref,
    systems: config.systems.length,
    sources: sources.length,
    operations: operations.map((item) => ({
      action: item.action,
      kind: item.kind,
      id: item.id,
      ref: normalizedPath(brain, item.path),
    })),
    counts: {
      create: count('create'),
      update: count('update'),
      no_change: count('no-change'),
      system_contracts: operations.filter((item) => item.kind === 'system').length,
      source_contracts: operations.filter((item) => item.kind === 'source').length,
    },
    guarantees: {
      duplicate_brain_created: false,
      manifest_edited: false,
      source_moved_or_copied: false,
      raw_opened_or_embedded: false,
    },
    _operations: operations,
  };
}

export function importLegacySystemManifests(root, options = {}) {
  const { confirm = false, ...previewOptions } = options;
  const preview = previewLegacySystemImport(root, previewOptions);
  if (!confirm) return { ...preview, _operations: undefined, status: preview.status === 'no-change' ? 'no-change' : 'preview-only' };
  for (const operation of preview._operations) {
    if (operation.action !== 'no-change') atomicWrite(operation.path, operation.next);
  }
  return {
    ...preview,
    _operations: undefined,
    status: preview.status === 'no-change' ? 'no-change' : 'imported',
  };
}
