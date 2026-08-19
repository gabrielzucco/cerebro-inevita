#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ID_RE,
  VERSION_RE,
  readJson,
  safeRelativePath,
  validateCapabilityContract,
  validateSystemContract,
  writeJsonAtomic,
} from './lib/system-protocol.mjs';

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const specArg = args.find((arg) => !arg.startsWith('--')) || '';
const confirmed = args.includes('--confirm');
const brainArg = args.find((arg) => arg.startsWith('--brain='))?.slice('--brain='.length);
const ROOT = resolve(brainArg || process.env.CEREBRO_INSTALL_ROOT || process.cwd());
const ALLOWED_ACCESS = new Set(['manual', 'read-only']);
const PII_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\+?55\s?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/,
  /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/,
];
const PRIVATE_PATTERNS = [
  'sistemas/outros-instalados/*/configuracao.md',
  'sistemas/outros-instalados/*/feedback.md',
];

function fail(message, code = 1) {
  console.error(`✗ ${message}`);
  process.exit(code);
}

function text(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function list(value, minimum = 1) {
  return Array.isArray(value) && value.length >= minimum;
}

function safeInline(value) {
  return String(value).replaceAll('\n', ' ').replaceAll('|', '\\|').trim();
}

function bullets(values) {
  return values.map((value) => `- ${safeInline(value)}`).join('\n');
}

function writeTextAtomic(path, content, mode = 0o644) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, content.endsWith('\n') ? content : `${content}\n`, { mode });
  renameSync(temporary, path);
  chmodSync(path, mode);
}

function ensureBrain() {
  for (const required of ['VERSION', '.cerebro']) {
    if (!existsSync(join(ROOT, required))) fail(`pasta não é uma instalação do Cérebro: faltando ${required}`);
  }
}

function baseBrainActivated() {
  const statePath = join(ROOT, '.cerebro', 'sistemas', 'cerebro-base.json');
  if (existsSync(statePath)) {
    try {
      const state = readJson(statePath, 'estado do Cérebro Base');
      if (state.status === 'active' || state.first_value_confirmed === true) return true;
    } catch {
      return false;
    }
  }
  const runsDir = join(ROOT, '.cerebro', 'concierge-runs');
  if (!existsSync(runsDir)) return false;
  return readdirSync(runsDir).some((name) => {
    if (!name.endsWith('.json')) return false;
    try {
      const run = readJson(join(runsDir, name), 'recibo T0–T4');
      return Boolean(run?.milestones?.T4);
    } catch {
      return false;
    }
  });
}

function validateSpec(spec) {
  const errors = [];
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return ['spec precisa ser objeto'];
  if (spec.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!ID_RE.test(spec.system_id || '')) errors.push('system_id inválido');
  if (!text(spec.name)) errors.push('name obrigatório');
  if (!VERSION_RE.test(spec.version || '')) errors.push('version precisa ser semver');

  if (spec.evidence?.state !== 'observed') errors.push('evidence.state precisa ser observed');
  if (!list(spec.evidence?.refs)) errors.push('evidence.refs exige ao menos um caso real');

  const result = spec.result || {};
  for (const field of ['statement', 'non_success', 'definition_of_done', 'owner', 'human_gate']) {
    if (!text(result[field])) errors.push(`result.${field} obrigatório`);
  }
  if (!ID_RE.test(result.output_type || '')) errors.push('result.output_type inválido');

  if (!['manual', 'event'].includes(spec.trigger?.type)) {
    errors.push('primeiro comissionamento aceita trigger manual ou event; agenda vem depois');
  }
  if (!text(spec.trigger?.description)) errors.push('trigger.description obrigatório');

  const capability = spec.capability || {};
  if (!ID_RE.test(capability.capability_id || '')) errors.push('capability.capability_id inválido');
  for (const field of ['name', 'task']) if (!text(capability[field])) errors.push(`capability.${field} obrigatório`);
  for (const field of ['when_to_use', 'when_not_to_use']) {
    if (!list(capability[field])) errors.push(`capability.${field} exige ao menos um item`);
  }

  if (!list(spec.entities)) errors.push('entities exige ao menos uma entidade');
  if (!list(spec.sources)) errors.push('sources exige ao menos uma fonte');
  if (list(spec.sources) && !spec.sources.some((source) => source.required === true)) {
    errors.push('ao menos uma fonte precisa ser required');
  }
  for (const [index, source] of (spec.sources || []).entries()) {
    if (!ID_RE.test(source.role || '')) errors.push(`sources[${index}].role inválido`);
    if (!ALLOWED_ACCESS.has(source.access)) {
      errors.push(`sources[${index}].access precisa ser manual ou read-only no primeiro comissionamento`);
    }
    for (const field of ['freshness', 'purpose', 'truth_home']) {
      if (!text(source[field])) errors.push(`sources[${index}].${field} obrigatório`);
    }
  }
  const sourceRoles = new Set((spec.sources || []).map((source) => source.role));
  for (const [index, ref] of (spec.evidence?.refs || []).entries()) {
    if (!ID_RE.test(ref.role || '')) errors.push(`evidence.refs[${index}].role inválido`);
    if (!sourceRoles.has(ref.role)) errors.push(`evidence.refs[${index}].role não existe em sources`);
    if (!text(ref.purpose)) errors.push(`evidence.refs[${index}].purpose obrigatório`);
    try {
      safeRelativePath(ROOT, ref.path, { mustExist: true });
    } catch (error) {
      errors.push(`evidence.refs[${index}].path: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!list(spec.pipeline, 3)) errors.push('pipeline exige ao menos três estados');
  if (!list(spec.routines)) errors.push('routines exige ao menos uma rotina manual');
  for (const [index, routine] of (spec.routines || []).entries()) {
    for (const field of ['trigger', 'owner', 'input', 'output', 'gate']) {
      if (!text(routine[field])) errors.push(`routines[${index}].${field} obrigatório`);
    }
  }
  if (spec.permissions?.external_actions !== false) {
    errors.push('permissions.external_actions precisa ser false no primeiro comissionamento');
  }
  if (!Array.isArray(spec.permissions?.read) || !Array.isArray(spec.permissions?.write)) {
    errors.push('permissions.read e permissions.write precisam ser listas');
  }
  if (!VERSION_RE.test(spec.eval?.version || '')) errors.push('eval.version precisa ser semver');
  if (!list(spec.eval?.deterministic_gates)) errors.push('eval.deterministic_gates exige itens');
  if (!list(spec.eval?.human_questions)) errors.push('eval.human_questions exige itens');
  if (!ID_RE.test(spec.eval?.outcome_measure || '')) errors.push('eval.outcome_measure inválido');
  if (spec.learning?.correction_policy !== 'candidate-first') errors.push('learning.correction_policy inválido');
  if (!Number.isInteger(spec.learning?.promotion_threshold) || spec.learning.promotion_threshold < 3) {
    errors.push('learning.promotion_threshold precisa ser >= 3');
  }
  if (spec.learning?.requires_replay !== true || spec.learning?.requires_human_approval !== true) {
    errors.push('aprendizado exige replay e aprovação humana');
  }
  for (const field of ['local', 'derived', 'forbidden']) {
    if (!list(spec.frontier?.[field])) errors.push(`frontier.${field} exige ao menos um item`);
  }
  if (!ID_RE.test(spec.baseline?.measure || '')) errors.push('baseline.measure inválido');
  for (const field of ['period', 'source']) if (!text(spec.baseline?.[field])) errors.push(`baseline.${field} obrigatório`);
  if (!['string', 'number', 'boolean'].includes(typeof spec.baseline?.value)) errors.push('baseline.value obrigatório');

  const serialized = JSON.stringify(spec);
  if (PII_PATTERNS.some((pattern) => pattern.test(serialized))) {
    errors.push('spec contém PII óbvia; use papéis e IDs opacos');
  }
  return errors;
}

function capabilityFrom(spec) {
  return {
    protocol_version: 1,
    capability_id: spec.capability.capability_id,
    name: spec.capability.name,
    version: spec.version,
    task: spec.capability.task,
    when_to_use: spec.capability.when_to_use,
    when_not_to_use: spec.capability.when_not_to_use,
    input_roles: spec.sources.map((source) => ({
      role: source.role,
      required: source.required,
      purpose: source.purpose,
    })),
    output: {
      type: spec.result.output_type,
      definition_of_done: spec.result.definition_of_done,
    },
    permissions: spec.permissions,
    human_authority: [spec.result.human_gate],
    evals: [...spec.eval.deterministic_gates, ...spec.eval.human_questions],
    extensions: { commissioning: 'observed-case' },
  };
}

function contractFrom(spec) {
  return {
    protocol_version: 1,
    system_id: spec.system_id,
    name: spec.name,
    version: spec.version,
    status: 'confirmed',
    result: spec.result,
    trigger: spec.trigger,
    capability: {
      capability_id: spec.capability.capability_id,
      version: spec.version,
      origin: 'local',
    },
    entities: spec.entities,
    sources: spec.sources.map(({ truth_home: _truthHome, ...source }) => source),
    pipeline: spec.pipeline,
    permissions: spec.permissions,
    eval: spec.eval,
    learning: spec.learning,
  };
}

function manifestOf(spec) {
  return `# Manifest — ${safeInline(spec.name)}

\`\`\`yaml
system_id: ${spec.system_id}
name: ${safeInline(spec.name)}
version: ${spec.version}
status: beta
owner: ${safeInline(spec.result.owner)}
result: ${safeInline(spec.result.statement)}
output: ${spec.result.output_type}
skill: skill-contract.md
setpoint: ${safeInline(spec.result.definition_of_done)}
privacy: local-first
\`\`\`

## O que conta como resultado

${safeInline(spec.result.definition_of_done)}

## O que não conta

${safeInline(spec.result.non_success)}

## Evidência de comissionamento

- estado: observed;
- casos observados: ${spec.evidence.refs.length};
- papéis de evidência: ${[...new Set(spec.evidence.refs.map((ref) => ref.role))].join(', ')};
- conteúdo e caminhos locais permanecem na CONFIGURAÇÃO privada.

## Fronteira

**Fica local**
${bullets(spec.frontier.local)}

**Pode virar derivado aprovado**
${bullets(spec.frontier.derived)}

**Proibido**
${bullets(spec.frontier.forbidden)}

## Maturidade

O pacote está comissionado e pronto para o primeiro run manual. Um run aprovado pode ativar o
Sistema local; validação exige repetição comparável, outcome e aprendizado versionado.
`;
}

function configurationOf(spec) {
  const sources = spec.sources.map((source) =>
    `| ${source.role} | ${source.source_id || 'não vinculado'} | ${source.purpose} | ${source.truth_home} | ${source.access} | ${source.freshness} |`,
  ).join('\n');
  const evidence = spec.evidence.refs.map((ref) =>
    `| ${ref.role} | ${safeRelativePath(ROOT, ref.path, { mustExist: true })} | ${ref.purpose} |`,
  ).join('\n');
  return `# CONFIGURAÇÃO local — ${safeInline(spec.name)}

> Arquivo privado do dono. Guarde referências e contratos; nunca token, senha, PII ou base bruta.

## Resultado local

- objetivo: ${safeInline(spec.result.statement)}
- dono: ${safeInline(spec.result.owner)}
- gate humano: ${safeInline(spec.result.human_gate)}
- setpoint: ${safeInline(spec.result.definition_of_done)}
- não-sucesso: ${safeInline(spec.result.non_success)}

## Evidência observada

| Papel | Referência local | Propósito |
|---|---|---|
${evidence}

## Fontes registradas — não significa conectadas

| Papel | Source ID | Propósito | Fonte de verdade | Acesso | Frescor |
|---|---|---|---|---|---|
${sources}

## Fronteira

### Fica local
${bullets(spec.frontier.local)}

### Pode virar derivado aprovado
${bullets(spec.frontier.derived)}

### Proibido
${bullets(spec.frontier.forbidden)}

## Baseline

- medida: ${spec.baseline.measure}
- valor: ${safeInline(spec.baseline.value)}
- período: ${safeInline(spec.baseline.period)}
- fonte: ${safeInline(spec.baseline.source)}

## Vocabulário e exceções

- termos próprios: não consta ainda;
- exceções observadas: não consta ainda;
- afirmações que exigem confirmação: toda mudança de etapa e toda próxima ação.
`;
}

function pipelineOf(spec) {
  const rows = spec.pipeline.map((state) =>
    `| ${state.state} | ${safeInline(state.input)} | ${safeInline(state.output)} | ${safeInline(state.gate)} |`,
  ).join('\n');
  return `# Pipeline — ${safeInline(spec.name)}

| Estado | Entrada | Saída | Gate |
|---|---|---|---|
${rows}

O primeiro run é manual. Retorno, exceção e falha permanecem visíveis no recibo; nenhuma etapa
avança só para completar o desenho.
`;
}

function routinesOf(spec) {
  const rows = spec.routines.map((routine) =>
    `| ${safeInline(routine.trigger)} | ${safeInline(routine.owner)} | ${safeInline(routine.input)} | ${safeInline(routine.output)} | ${safeInline(routine.gate)} | manual |`,
  ).join('\n');
  return `# Rotinas — ${safeInline(spec.name)}

| Gatilho | Dono | Entrada | Saída | Gate | Estado |
|---|---|---|---|---|---|
${rows}

Conexão recorrente ou agenda só entra depois que runs comparáveis provarem o trigger, a fonte e a
régua. O primeiro run não autoriza ação externa.
`;
}

function skillContractOf(spec) {
  const inputs = spec.sources.map((source) =>
    `- **${source.role}${source.required ? ' · obrigatória' : ''}:** ${safeInline(source.purpose)}`,
  ).join('\n');
  return `# Contrato da skill local — ${safeInline(spec.capability.name)}

## Tarefa

${safeInline(spec.capability.task)}

## Quando usar

${bullets(spec.capability.when_to_use)}

## Quando não usar

${bullets(spec.capability.when_not_to_use)}

## Entradas por papel

${inputs}

## Saída e pronto

- tipo: ${spec.result.output_type}
- pronto: ${safeInline(spec.result.definition_of_done)}

## Julgamento e limites

- ler a CONFIGURAÇÃO local antes do run;
- separar declarado, observado e lacuna;
- nunca inventar etapa para fechar o pipeline;
- mostrar derivados antes de gravar;
- escalar para: ${safeInline(spec.result.human_gate)};
- não executar ação externa.

Este contrato ainda não é uma skill especializada promovida. Três runs comparáveis, replay e
aprovação humana podem transformar o caminho aprovado em motor versionado.
`;
}

function evalsOf(spec) {
  return `# Evals — ${safeInline(spec.name)}

## Gates determinísticos

${spec.eval.deterministic_gates.map((gate) => `- [ ] ${safeInline(gate)}`).join('\n')}

## Régua humana

${spec.eval.human_questions.map((question) => `- ${safeInline(question)}`).join('\n')}

## Outcome

- medida: ${spec.eval.outcome_measure}
- baseline: ${safeInline(spec.baseline.value)} · ${safeInline(spec.baseline.period)}
- fonte: ${safeInline(spec.baseline.source)}

Run aprovado ativa o Sistema local, mas não prova outcome nem valida o motor. Registre o que mudou
na operação e compare somente quando houver janela e fonte reais.
`;
}

function feedbackOf(spec) {
  return `# Feedback privado — ${safeInline(spec.name)}

> Uma correção por bloco, sempre ligada a run e versão. Não cole PII ou fonte bruta.

## Correções candidatas

<!--
### AAAA-MM-DD · <run-id> · ${spec.version}
- correção humana:
- efeito esperado no próximo run:
- casos comparáveis:
- replay:
- decisão:
-->

## Política

- promoção: ${spec.learning.promotion_threshold} runs comparáveis;
- replay obrigatório: sim;
- aprovação humana: sim;
- rollback: preservar sempre a versão anterior.
`;
}

function changelogOf(spec) {
  return `# Changelog — ${safeInline(spec.name)}

## ${spec.version} — ${new Date().toISOString().slice(0, 10)}

- contrato inicial baseado em ${spec.evidence.refs.length} caso(s) observado(s);
- pipeline e rotina manual;
- CONFIGURAÇÃO, fronteira e eval locais;
- primeiro run ainda pendente.

## Próxima versão candidata

- problema observado:
- runs que sustentam a mudança:
- menor mudança proposta:
- replay executado:
- decisão humana:
- rollback:
`;
}

function ensurePrivateIgnore() {
  const path = join(ROOT, '.gitignore');
  const current = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const missing = PRIVATE_PATTERNS.filter((pattern) => !current.split('\n').includes(pattern));
  if (!missing.length) return;
  const prefix = current && !current.endsWith('\n') ? '\n' : '';
  appendFileSync(path, `${prefix}${missing.join('\n')}\n`);
}

function localCatalog() {
  const root = join(ROOT, 'sistemas', 'outros-instalados');
  mkdirSync(root, { recursive: true });
  const rows = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const contractPath = join(root, entry.name, 'contract.json');
    if (!existsSync(contractPath) || !statSync(contractPath).isFile()) continue;
    try {
      const contract = readJson(contractPath, `contract ${entry.name}`);
      const statePath = join(ROOT, '.cerebro', 'sistemas', `${contract.system_id}.json`);
      const state = existsSync(statePath) ? readJson(statePath, `state ${entry.name}`) : {};
      rows.push({
        id: contract.system_id,
        name: contract.name,
        status: state.status || contract.status,
        result: contract.result.statement,
      });
    } catch {
      // Pacote inválido continua visível no filesystem; o catálogo não finge que ele opera.
    }
  }
  rows.sort((a, b) => a.id.localeCompare(b.id));
  const content = `# Sistemas proprietários locais

> Gerado por \`scripts/commission-system.mjs\`. O motor da INEVITA não sobrescreve esta pasta.

| Sistema | Estado local | Resultado |
|---|---|---|
${rows.length ? rows.map((row) => `| [${safeInline(row.name)}](${row.id}/manifest.md) | ${row.status} | ${safeInline(row.result)} |`).join('\n') : '| — | — | nenhum Sistema comissionado |'}

\`configuracao.md\`, \`feedback.md\`, runs e contratos do control plane permanecem privados.
`;
  writeTextAtomic(join(root, '_CATALOGO.md'), content);
}

function ping(systemId) {
  const script = join(ROOT, '.agents', 'scripts', 'ping.mjs');
  if (!existsSync(script)) return;
  spawnSync(process.execPath, [script, 'system_commissioning', systemId], {
    cwd: ROOT,
    env: process.env,
    stdio: 'ignore',
    timeout: 2500,
  });
}

if (!specArg) fail('informe o caminho relativo do commissioning spec');
ensureBrain();
let specPath;
try {
  specPath = resolve(ROOT, safeRelativePath(ROOT, specArg, { mustExist: true }));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
const spec = readJson(specPath, 'commissioning spec');
const specErrors = validateSpec(spec);
if (specErrors.length) fail(`spec inválido: ${specErrors.join(' · ')}`);
const capability = capabilityFrom(spec);
const contract = contractFrom(spec);
const contractErrors = validateSystemContract(contract);
const capabilityErrors = validateCapabilityContract(capability);
if (contractErrors.length || capabilityErrors.length) {
  fail(`contratos inválidos: ${[...contractErrors, ...capabilityErrors].join(' · ')}`);
}

const packageRoot = join(ROOT, 'sistemas', 'outros-instalados', spec.system_id);
if (existsSync(packageRoot)) fail(`Sistema já existe: ${spec.system_id}; comissionamento nunca sobrescreve pacote local`);
if (!baseBrainActivated()) fail('Cérebro Base ainda não chegou a T4; conclua /comecar antes de instalar o Sistema');

if (!confirmed) {
  console.log([
    `Sistema: ${spec.name} (${spec.system_id}@${spec.version})`,
    `Resultado: ${spec.result.statement}`,
    `Caso(s) observado(s): ${spec.evidence.refs.length}`,
    `Fontes registradas: ${spec.sources.length} · conectadas: 0`,
    `Pipeline: ${spec.pipeline.length} estados · rotina inicial: manual`,
    'Nenhum arquivo foi criado.',
    `Confirme com: node scripts/commission-system.mjs ${safeRelativePath(ROOT, specArg)} --confirm`,
  ].join('\n'));
  process.exit(2);
}

mkdirSync(packageRoot, { recursive: true });
writeTextAtomic(join(packageRoot, 'manifest.md'), manifestOf(spec));
writeJsonAtomic(join(packageRoot, 'capability.json'), capability);
writeJsonAtomic(join(packageRoot, 'contract.json'), contract);
writeTextAtomic(join(packageRoot, 'configuracao.md'), configurationOf(spec), 0o600);
writeTextAtomic(join(packageRoot, 'pipeline.md'), pipelineOf(spec));
writeTextAtomic(join(packageRoot, 'rotinas.md'), routinesOf(spec));
writeTextAtomic(join(packageRoot, 'skill-contract.md'), skillContractOf(spec));
writeTextAtomic(join(packageRoot, 'evals.md'), evalsOf(spec));
writeTextAtomic(join(packageRoot, 'feedback.md'), feedbackOf(spec), 0o600);
writeTextAtomic(join(packageRoot, 'changelog.md'), changelogOf(spec));

const now = new Date().toISOString();
const contractPath = join(ROOT, '.cerebro', 'contracts', `${spec.system_id}.json`);
const statePath = join(ROOT, '.cerebro', 'sistemas', `${spec.system_id}.json`);
writeJsonAtomic(contractPath, contract, 0o600);
writeJsonAtomic(statePath, {
  slug: spec.system_id,
  system_id: spec.system_id,
  package_version: spec.version,
  capability: {
    capability_id: capability.capability_id,
    version: capability.version,
    origin: 'local',
  },
  contract_path: `.cerebro/contracts/${spec.system_id}.json`,
  contract_status: 'confirmed',
  status: 'configuring',
  connected_sources: 0,
  commissioned_from: 'observed-case',
  updated_at: now,
}, 0o600);

ensurePrivateIgnore();
localCatalog();
const receiptPath = join(
  ROOT,
  'operacao',
  'execucoes',
  `${now.replaceAll(':', '-').replaceAll('.', '-')}-comissionamento-${spec.system_id}.md`,
);
writeTextAtomic(receiptPath, `# Sistema comissionado — ${safeInline(spec.name)}

- quando: ${now}
- system-id: ${spec.system_id}
- versão: ${spec.version}
- estado: configuring
- casos observados: ${spec.evidence.refs.length}
- fontes registradas: ${spec.sources.length}
- fontes conectadas: 0
- contrato validado: sim
- aprovação humana antes da escrita: sim
- conteúdo enviado à INEVITA: não
- próximo passo: primeiro run manual com /operar ${spec.system_id}
`, 0o600);
ping(spec.system_id);
console.log(`✓ ${spec.system_id}@${spec.version} comissionado · estado=configuring · fontes conectadas=0`);
