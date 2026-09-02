#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  validateAccessGrant,
  validateCapabilityContract,
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
import { validateDecisionCaseReceipt } from './lib/decision-case.mjs';
import {
  validateCorrectionRunReceipt,
  validateLearningCandidate,
} from './lib/correction-loop.mjs';
import { validateExecutionTraceEvent } from './lib/execution-trace-runtime.mjs';
import { validateExperimentContract, validateExperimentState } from './lib/experiment-protocol.mjs';
import { validateHandoffContract, validateHandoffReceipt } from './lib/handoff-protocol.mjs';
import { validateBrainManifest } from './lib/compatibility-diagnostic.mjs';
import { validateRetrievalProviderContract } from './lib/retrieval-provider-protocol.mjs';
import { validateSystemRuntimeBinding } from './lib/system-runtime-binding.mjs';
import { validateSystemSourceBinding } from './lib/system-source-binding.mjs';
import { validateExperienceManifest } from './lib/experience-manifest.mjs';
import { validateSocietyPackageManifest } from './lib/society-catalog-read-model.mjs';
import { validateReleaseManifest } from './lib/release-manifest.mjs';

const ROOT = resolve(process.cwd());
const errors = [];
const required = [
  'METODO-SISTEMAS.md', 'METODO-EXPERIMENTOS.md',
  'templates/experimento.md',
  'templates/sistema/manifest.md', 'templates/sistema/configuracao.md',
  'templates/sistema/pipeline.md', 'templates/sistema/rotinas.md',
  'templates/sistema/skill-contract.md', 'templates/sistema/evals.md',
  'templates/sistema/feedback.md', 'templates/sistema/changelog.md',
  'templates/sistema/contract.json', 'templates/sistema/capability.json',
  'protocol/README.md', 'protocol/brain-manifest.schema.json', 'protocol/capability-contract.schema.json',
  'protocol/system-contract.schema.json', 'protocol/run-record.schema.json',
  'protocol/source-contract.schema.json', 'protocol/system-contract-v2.schema.json',
  'protocol/run-record-v2.schema.json', 'protocol/access-grant.schema.json',
  'protocol/access-receipt.schema.json',
  'protocol/routine-contract.schema.json', 'protocol/executor-binding.schema.json',
  'protocol/routine-run-receipt.schema.json',
  'protocol/routine-migration.schema.json',
  'protocol/collector-binding.schema.json',
  'protocol/judgment-receipt.schema.json',
  'protocol/decision-case-receipt.schema.json',
  'protocol/correction-run-receipt.schema.json',
  'protocol/learning-candidate.schema.json',
  'protocol/execution-trace-event.schema.json',
  'protocol/experiment-contract.schema.json', 'protocol/experiment-state.schema.json',
  'protocol/handoff-contract.schema.json', 'protocol/handoff-receipt.schema.json',
  'protocol/retrieval-provider-contract.schema.json',
  'protocol/system-runtime-binding.schema.json',
  'protocol/system-source-binding.schema.json',
  'protocol/experience-manifest.schema.json',
  'protocol/release-manifest.schema.json',
  'protocol/artifacts/creative-brief.schema.json', 'protocol/artifacts/funnel-reading.schema.json',
  'protocol/examples/brain-manifest.v1.json',
  'protocol/examples/source-contract.v1.json', 'protocol/examples/system-contract.v2.json',
  'protocol/examples/run-record.v2.json', 'protocol/examples/access-grant.v1.json',
  'protocol/examples/access-receipt.v1.json',
  'protocol/examples/routine-contract.v1.json', 'protocol/examples/executor-binding.v1.json',
  'protocol/examples/routine-run-receipt.v1.json',
  'protocol/examples/routine-migration.v1.json',
  'protocol/examples/collector-binding.v1.json',
  'protocol/examples/judgment-receipt.v1.json',
  'protocol/examples/decision-case-receipt.v1.json',
  'protocol/examples/correction-run-receipt.v1.json',
  'protocol/examples/learning-candidate.v1.json',
  'protocol/examples/execution-trace-event.v1.json',
  'protocol/examples/experiment-contract.v1.json', 'protocol/examples/experiment-state.v1.json',
  'protocol/examples/handoff-contract.v1.json', 'protocol/examples/handoff-receipt.v1.json',
  'protocol/examples/retrieval-provider-contract.v1.json',
  'protocol/examples/system-runtime-binding.v1.json',
  'protocol/examples/system-source-binding.v1.json',
  'protocol/examples/experience-manifest.v1.json',
  'meu-negocio', 'sistemas/_CATALOGO.md', 'skills/_CATALOGO.md', 'conexoes/_CATALOGO.md',
  'operacao/_LEIA.md', 'comunidade/inevita/_CATALOGO.md',
  'comunidade/minhas-contribuicoes/_LEIA.md', '.cerebro/seed.manifest', '.cerebro/layout.json',
  '.cerebro/manifest.json',
  'sistemas/calls/manifest.md', 'sistemas/calls/pipeline.md', 'sistemas/calls/rotinas.md',
  'sistemas/calls/evals.md', 'sistemas/calls/feedback.md', 'sistemas/calls/changelog.md',
  'sistemas/calls/capability.json', 'sistemas/calls/contract.json',
  'sistemas/cerebro-base/manifest.md', 'sistemas/cerebro-base/pipeline.md',
  'sistemas/cerebro-base/rotinas.md', 'sistemas/cerebro-base/evals.md',
  'sistemas/cerebro-base/feedback.md', 'sistemas/cerebro-base/changelog.md',
  'sistemas/cerebro-base/capability.json', 'sistemas/cerebro-base/contract.json',
  'sistemas/next-best-gtm/manifest.md', 'sistemas/next-best-gtm/pipeline.md',
  'sistemas/next-best-gtm/evals.md', 'sistemas/next-best-gtm/changelog.md',
  'sistemas/next-best-gtm/capability.json', 'sistemas/next-best-gtm/contract.json',
  'sistemas/next-best-gtm/experience.json',
  '.claude/skills/operar/SKILL.md',
  '.claude/skills/fonte/SKILL.md',
  '.claude/skills/arquiteto/SKILL.md',
  '.claude/skills/arquiteto/agents/openai.yaml',
  '.claude/skills/arquiteto/references/architect-spec.schema.json',
  '.claude/skills/arquiteto/references/architect-spec.example.json',
  '.claude/skills/arquiteto/scripts/render-map.mjs',
  '.claude/skills/sistematizar/SKILL.md',
  '.claude/skills/sistematizar/agents/openai.yaml',
  '.claude/skills/sistematizar/references/commissioning-spec.schema.json',
  '.claude/skills/sistematizar/references/jornada-ponta-a-ponta.example.json',
  '.claude/skills/company-brain-sprint/SKILL.md',
  '.claude/skills/company-brain-sprint/references/output-contract.md',
  'operacao/arquitetura/_LEIA.md',
  'scripts/test-architect.mjs',
  'scripts/commission-system.mjs', 'scripts/test-commission-system.mjs',
  'scripts/system-source-binding.mjs', 'scripts/test-system-source-binding-v1.mjs',
  'scripts/installation-compatibility.mjs', 'scripts/test-installation-compatibility-v1.mjs',
  'scripts/discover-context.mjs', 'scripts/register-source.mjs',
  'scripts/concierge-run.mjs', 'scripts/test-concierge-run.mjs',
  'scripts/test-context-discovery.mjs',
  'scripts/build-company-brain-starter.mjs', 'scripts/test-company-brain-starter.mjs',
  'profiles/company-brain-starter-en/START-HERE.md',
  'scripts/install-system.mjs', 'scripts/system-state.mjs', 'scripts/test-install-system.mjs',
  'scripts/system-run.mjs', 'scripts/generate-operating-brief.mjs',
  'scripts/system-contract.mjs', 'scripts/entity.mjs', 'scripts/system-learn.mjs',
  'scripts/source-contract.mjs', 'scripts/protocol-validate.mjs',
  'scripts/runtime-secret.mjs', 'scripts/runtime-access.mjs',
  'scripts/lib/system-protocol.mjs', 'scripts/lib/company-brain-protocol-v2.mjs',
  'scripts/lib/secret-provider.mjs', 'scripts/lib/access-runtime.mjs',
  'scripts/lib/routine-protocol.mjs', 'scripts/lib/model-executors.mjs',
  'scripts/lib/routine-runtime.mjs', 'scripts/lib/context-snapshot-runtime.mjs',
  'scripts/lib/execution-trace-runtime.mjs', 'scripts/lib/evaluation-runtime.mjs',
  'scripts/lib/experiment-protocol.mjs', 'scripts/import-legacy-experiments.mjs',
  'scripts/lib/handoff-protocol.mjs', 'scripts/lib/compatibility-diagnostic.mjs',
  'scripts/lib/retrieval-provider-protocol.mjs',
  'scripts/lib/system-runtime-binding.mjs',
  'scripts/lib/installation-compatibility.mjs',
  'scripts/lib/experience-manifest.mjs',
  'scripts/lib/society-catalog-read-model.mjs',
  'scripts/lib/release-manifest.mjs',
  'scripts/lib/skill-read-model.mjs',
  'scripts/lib/json-schema-runtime.mjs', 'scripts/lib/replay-runtime.mjs',
  'scripts/compatibility-diagnostic.mjs',
  'scripts/lib/graph-read-model.mjs', 'scripts/lib/canvas-layout-runtime.mjs',
  'scripts/routine-runtime.mjs',
  'scripts/lib/judgment-protocol.mjs',
  'scripts/lib/decision-case.mjs', 'scripts/test-decision-case.mjs',
  'scripts/lib/correction-loop.mjs',
  'scripts/lib/console-read-model.mjs', 'scripts/console-server.mjs', 'scripts/console-bootstrap.mjs',
  'console/index.html', 'console/app.js', 'console/canvas.js', 'console/canvas-layout-policy.js',
  'console/canvas.bundle.js', 'console/styles.css',
  'society/catalog.v1.json',
  'scripts/test-system-protocol.mjs', 'scripts/test-company-brain-protocol-v2.mjs',
  'scripts/test-access-runtime.mjs',
  'scripts/test-routine-runtime.mjs',
  'scripts/test-context-snapshot-runtime.mjs',
  'scripts/test-execution-trace.mjs', 'scripts/test-evaluation-runtime.mjs',
  'scripts/migrate-execution-traces.mjs', 'scripts/test-migrate-execution-traces.mjs',
  'scripts/test-graph-read-model.mjs',
  'scripts/test-canvas-layout-readability.mjs',
  'scripts/test-judgment-protocol.mjs',
  'scripts/test-correction-loop.mjs',
  'scripts/test-console-server.mjs',
  'scripts/test-system-launcher-workspace.mjs',
  'scripts/test-system-workspace-dedup-v1.mjs',
  'scripts/test-company-brain-skills-v1.mjs',
  'scripts/test-company-brain-product-cut-v1.mjs',
  'scripts/test-company-brain-launcher-hierarchy-v1.mjs',
  'scripts/test-company-brain-orientation-v1.mjs',
  'scripts/test-company-brain-native-capabilities-v0.mjs',
  'scripts/test-company-brain-product-polish-v1.mjs',
  'scripts/test-company-brain-lived-overview-v2.mjs',
  'scripts/test-experience-manifest-v1.mjs',
  'scripts/test-society-catalog-v0.mjs',
  'scripts/test-release-manifest-v1.mjs',
  'scripts/test-gtm-console-integration.mjs',
  'scripts/test-operating-brief.mjs',
  'scripts/system-experiment.mjs', 'scripts/test-system-experiment.mjs',
  'scripts/test-experiment-protocol.mjs',
  'scripts/test-handoff-protocol.mjs', 'scripts/test-compatibility-diagnostic.mjs',
  'scripts/test-retrieval-provider-protocol.mjs',
  'scripts/test-replay-runtime.mjs',
  '.cerebro/private-ignore.manifest',
  '.claude/scripts/ensure-private-ignore.sh',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/manifest.json',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/release.json',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/contract.json',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/manifest.md',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/pipeline.md',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/rotinas.md',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/evals.md',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/changelog.md',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/feedback.template.md',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/configuracao.template.md',
  'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/capability.json',
];

for (const item of required) {
  if (!existsSync(join(ROOT, item))) errors.push(`faltando: ${item}`);
}

if (existsSync(join(ROOT, 'society', 'catalog.v1.json'))) {
  const catalog = JSON.parse(readFileSync(join(ROOT, 'society', 'catalog.v1.json'), 'utf8'));
  if (catalog.protocol_version !== 1 || catalog.catalog_id !== 'inevita-society-systems' || !Array.isArray(catalog.systems)) {
    errors.push('catálogo Society inválido: envelope incompatível');
  }
  for (const [index, system] of (catalog.systems || []).entries()) {
    if (!system.system_id || !system.stage || typeof system.checkout?.available !== 'boolean') {
      errors.push(`catálogo Society inválido: sistema ${index} incompleto`);
    }
    for (const field of ['companies', 'runs', 'approved_runs', 'judged_outcomes']) {
      if (!Number.isInteger(system.evidence?.[field]) || system.evidence[field] < 0) {
        errors.push(`catálogo Society inválido: sistema ${index} com evidence.${field} inválido`);
      }
    }
  }
}

for (const [label, path, validate] of [
  ['example Brain Manifest v1', 'protocol/examples/brain-manifest.v1.json', validateBrainManifest],
  ['Brain Manifest do produto', '.cerebro/manifest.json', validateBrainManifest],
  ['Brain Manifest do starter', 'profiles/company-brain-starter-en/.cerebro/manifest.json', validateBrainManifest],
  ['template capability', 'templates/sistema/capability.json', validateCapabilityContract],
  ['template system contract', 'templates/sistema/contract.json', validateSystemContract],
  ['calls capability', 'sistemas/calls/capability.json', validateCapabilityContract],
  ['calls system contract', 'sistemas/calls/contract.json', validateSystemContract],
  ['cerebro-base capability', 'sistemas/cerebro-base/capability.json', validateCapabilityContract],
  ['cerebro-base system contract', 'sistemas/cerebro-base/contract.json', validateSystemContract],
  ['briefing capability', 'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/capability.json', validateCapabilityContract],
  ['example source contract v1', 'protocol/examples/source-contract.v1.json', validateSourceContract],
  ['example system contract v2', 'protocol/examples/system-contract.v2.json', validateSystemContract],
  ['example run record v2', 'protocol/examples/run-record.v2.json', validateRunRecord],
  ['example access grant v1', 'protocol/examples/access-grant.v1.json', validateAccessGrant],
  ['example access receipt v1', 'protocol/examples/access-receipt.v1.json', validateAccessReceipt],
  ['example routine contract v1', 'protocol/examples/routine-contract.v1.json', validateRoutineContract],
  ['example executor binding v1', 'protocol/examples/executor-binding.v1.json', validateExecutorBinding],
  ['example routine run receipt v1', 'protocol/examples/routine-run-receipt.v1.json', validateRoutineRunReceipt],
  ['example routine migration v1', 'protocol/examples/routine-migration.v1.json', validateRoutineMigration],
  ['example collector binding v1', 'protocol/examples/collector-binding.v1.json', validateCollectorBinding],
  ['example judgment receipt v1', 'protocol/examples/judgment-receipt.v1.json', validateJudgmentReceipt],
  ['example decision case receipt v1', 'protocol/examples/decision-case-receipt.v1.json', validateDecisionCaseReceipt],
  ['example correction receipt v1', 'protocol/examples/correction-run-receipt.v1.json', validateCorrectionRunReceipt],
  ['example learning candidate v1', 'protocol/examples/learning-candidate.v1.json', validateLearningCandidate],
  ['example execution trace event v1', 'protocol/examples/execution-trace-event.v1.json', validateExecutionTraceEvent],
  ['example experiment contract v1', 'protocol/examples/experiment-contract.v1.json', validateExperimentContract],
  ['example experiment state v1', 'protocol/examples/experiment-state.v1.json', validateExperimentState],
  ['example handoff contract v1', 'protocol/examples/handoff-contract.v1.json', validateHandoffContract],
  ['example handoff receipt v1', 'protocol/examples/handoff-receipt.v1.json', validateHandoffReceipt],
  ['example retrieval provider v1', 'protocol/examples/retrieval-provider-contract.v1.json', validateRetrievalProviderContract],
  ['example system runtime binding v1', 'protocol/examples/system-runtime-binding.v1.json', validateSystemRuntimeBinding],
  ['example system source binding v1', 'protocol/examples/system-source-binding.v1.json', validateSystemSourceBinding],
  ['example experience manifest v1', 'protocol/examples/experience-manifest.v1.json', validateExperienceManifest],
  ['GTM experience manifest', 'sistemas/next-best-gtm/experience.json', validateExperienceManifest],
  ['Society briefing package manifest', 'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/manifest.json', validateSocietyPackageManifest],
  ['Society briefing Release Manifest', 'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/release.json', validateReleaseManifest],
  ['Society briefing System Contract', 'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/contract.json', validateSystemContract],
]) {
  if (!existsSync(join(ROOT, path))) continue;
  const validationErrors = validate(JSON.parse(readFileSync(join(ROOT, path), 'utf8')));
  for (const error of validationErrors) errors.push(`${label} inválido: ${error}`);
}

const systemsMethod = readFileSync(join(ROOT, 'METODO-SISTEMAS.md'), 'utf8');
for (const contract of [
  'As oito unidades do contrato',
  'Motor compartilhável × configuração privada',
  'O método circula. Os dados não.',
  'A IA organiza evidência e opções; o humano dá o',
  'O que é aberto e o que a Society acrescenta',
]) {
  if (!systemsMethod.includes(contract)) errors.push(`método de sistemas sem contrato: ${contract}`);
}

const experimentsMethod = readFileSync(join(ROOT, 'METODO-EXPERIMENTOS.md'), 'utf8');
for (const contract of [
  'Critério vem antes do dado',
  'Ler diariamente protege o experimento',
  'O martelo permanece humano',
  'o que NÃO ficou provado',
  'system-experiment.mjs meu-sistema freeze',
]) {
  if (!experimentsMethod.includes(contract)) errors.push(`método de experimentos sem contrato: ${contract}`);
}

const experimentTemplate = readFileSync(join(ROOT, 'templates', 'experimento.md'), 'utf8');
for (const contract of [
  '## EXP-001', '### Pré-registro', '### Emendas',
  '- dono da leitura:', '- baseline:', '- hipótese:', '- mudança única:',
  '- métrica primária:', '- guardrail:', '- janela de leitura:', '- regra de decisão:',
  '- o que NÃO ficou provado:', '- decisão: manter | corrigir | descartar | inconclusivo',
]) {
  if (!experimentTemplate.includes(contract)) errors.push(`template de experimento incompatível: ${contract}`);
}

// Todo pacote presente em sistemas-disponiveis precisa estar completo — inclusive pacotes
// entregues fora do catálogo público, quando dropados na árvore para comissionamento/RC.
const availablePackagesRoot = join(ROOT, 'comunidade', 'inevita', 'sistemas-disponiveis');
if (existsSync(availablePackagesRoot)) {
  for (const entry of readdirSync(availablePackagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of ['manifest.json', 'manifest.md', 'pipeline.md', 'rotinas.md', 'evals.md',
      'changelog.md', 'feedback.template.md', 'configuracao.template.md', 'capability.json']) {
      if (!existsSync(join(availablePackagesRoot, entry.name, file))) {
        errors.push(`pacote ${entry.name} incompleto: ${file}`);
      }
    }
  }
}
function files(root, base = root) {
  if (!existsSync(root)) return [];
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? files(path, base) : [path.slice(base.length + 1)];
  }).sort();
}

const claudeFiles = files(join(ROOT, '.claude', 'skills'));
const agentFiles = files(join(ROOT, '.agents', 'skills'));
if (JSON.stringify(claudeFiles) !== JSON.stringify(agentFiles)) {
  errors.push('listas de skills .claude e .agents divergem');
} else {
  for (const file of claudeFiles) {
    const a = readFileSync(join(ROOT, '.claude', 'skills', file));
    const b = readFileSync(join(ROOT, '.agents', 'skills', file));
    if (!a.equals(b)) errors.push(`skill fora de sincronia: ${file}`);
  }
}

for (const file of claudeFiles.filter((name) => name.endsWith('SKILL.md'))) {
  const content = readFileSync(join(ROOT, '.claude', 'skills', file), 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    errors.push(`skill sem frontmatter: ${file}`);
    continue;
  }
  const lines = match[1].split('\n').filter(Boolean);
  const keys = lines.map((line) => line.split(':', 1)[0].trim());
  if (keys.join(',') !== 'name,description') errors.push(`frontmatter inválido em ${file}`);
  const name = lines.find((line) => line.startsWith('name:'))?.slice(5).trim() ?? '';
  if (!/^[a-z0-9-]+$/.test(name)) errors.push(`nome de skill inválido em ${file}`);
  const description = lines.find((line) => line.startsWith('description:'))?.slice(12).trim() ?? '';
  if (!description) errors.push(`descrição vazia em ${file}`);
}

const motor = readFileSync(join(ROOT, '.cerebro', 'motor.manifest'), 'utf8');
for (const forbidden of [
  'meu-negocio/',
  'operacao/',
  'sistemas/cerebro-base/feedback.md',
  'sistemas/calls/feedback.md',
  'comunidade/minhas-contribuicoes/',
]) {
  if (motor.split('\n').some((line) => line.trim().startsWith(forbidden))) {
    errors.push(`motor tenta sobrescrever caminho do dono: ${forbidden}`);
  }
}

const update = readFileSync(join(ROOT, '.claude', 'scripts', 'update.sh'), 'utf8');
for (const guard of ['operacao*', 'sistemas/*/feedback.md', 'comunidade/minhas-contribuicoes*', 'SEED_MANIFEST']) {
  if (!update.includes(guard)) errors.push(`update sem guarda: ${guard}`);
}

const ping = readFileSync(join(ROOT, '.agents', 'scripts', 'ping.mjs'), 'utf8');
for (const event of [
  'proof_delivered', 'first_value_confirmed', 'contribution_prepared', 'contribution_approved',
  'system_installed', 'system_commissioning', 'system_first_run', 'system_activated',
  'system_needs_attention',
  'system_run_started', 'system_run_completed', 'system_value_confirmed',
  'architect_map_generated',
]) {
  if (!ping.includes(event)) errors.push(`ping sem evento: ${event}`);
}

const comecar = readFileSync(join(ROOT, '.claude', 'skills', 'comecar', 'SKILL.md'), 'utf8');
for (const contract of [
  'Use sempre `você`, `seu` e `sua`',
  'A pasta local é o cérebro',
  'Não abra com e-mail',
  'Qual trabalho real este cérebro deve compreender primeiro',
  'menor amostra real',
  'Você usaria isso do jeito que está ou mudaria alguma coisa antes?',
  'operacao/decisoes-pendentes/onboarding.md',
  'Descobrir sem invadir',
  'discover-context.mjs',
  'register-source.mjs',
  'não é uma conexão automática',
  'não despeje o bruto no prompt',
  'Isso aproveitou o que já estava no cérebro',
  'Somente depois do output útil',
  'V3 só existe',
  'Activation Contract',
  'primeiro Run Record',
  'replay, aprovação humana, nova versão e rollback',
  'resultado → fonte mínima',
  'rastro → observação → resultado',
  'Registrar fonte ≠ conectar fonte',
  'T4 não implica V3',
  'Nunca responda à incerteza pedindo para',
]) {
  if (!comecar.includes(contract)) errors.push(`comecar sem contrato de retomada: ${contract}`);
}
for (const regression of [
  'Fale como operador, em `tu/teu`',
  'Isso te ajuda a decidir ou agir agora?',
  'Duas notas de honestidade',
  'a PRIMEIRA interação é vincular o acesso',
]) {
  if (comecar.includes(regression)) errors.push(`comecar regrediu para linguagem antiga: ${regression}`);
}

const start = readFileSync(join(ROOT, 'COMECE-AQUI.md'), 'utf8');
for (const contract of [
  'Não troque de ferramenta nem de sessão',
  'atalho, não um requisito',
  'nunca decide sozinho',
  'Cérebro existente não é a mesma coisa que contexto existente',
  'sem cópia, mudança ou sync automático',
]) {
  if (!start.includes(contract)) errors.push(`COMECE-AQUI sem ativação na mesma sessão: ${contract}`);
}

const agentEntry = readFileSync(join(ROOT, 'AGENTS.md'), 'utf8');
const geminiEntry = readFileSync(join(ROOT, 'GEMINI.md'), 'utf8');
for (const [name, entry] of [['AGENTS', agentEntry], ['GEMINI', geminiEntry]]) {
  if (entry.includes('node .agents/scripts/ping.mjs sessao')) {
    errors.push(`${name} voltou a bloquear a abertura com ping`);
  }
  for (const contract of ['primeira resposta útil', 'which node', 'PATH', 'Telemetria']) {
    if (!entry.includes(contract)) errors.push(`${name} sem fallback de runtime: ${contract}`);
  }
}
for (const contract of [
  'Compatibilidade — valor antes do runtime',
  'No Antigravity',
  'scripts auxiliares só podem rodar depois',
  'which node',
  'caso contrário, pule',
]) {
  if (!comecar.includes(contract)) errors.push(`comecar sem bootstrap não bloqueante: ${contract}`);
}
if (comecar.includes('Ao iniciar, rode em silêncio SOMENTE')) {
  errors.push('comecar voltou a executar telemetria antes de responder');
}

const brainContract = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8');
for (const contract of [
  'brief vivo em `_HOJE.md`',
  'recupere até três caminhos aprovados comparáveis',
  'um run aprovado pode virar procedimento candidato',
  'diff e replay antes da decisão humana',
]) {
  if (!brainContract.includes(contract)) errors.push(`CLAUDE sem contrato vivo/procedural: ${contract}`);
}

const architect = readFileSync(join(ROOT, '.claude', 'skills', 'arquiteto', 'SKILL.md'), 'utf8');
for (const contract of [
  'V0 · declarado',
  'V1 · evidência parcial',
  'V2 · verificado',
  'V3 · validado',
  'human-proposed-v0',
  'reason_codes',
  'HTML, SVG ou Excalidraw escrito livremente',
  'execute `/prototipar`',
  'Execute `/fonte`',
  'execute `/operar`',
]) {
  if (!architect.includes(contract)) errors.push(`arquiteto sem contrato: ${contract}`);
}
const architectRenderer = readFileSync(join(ROOT, '.claude', 'skills', 'arquiteto', 'scripts', 'render-map.mjs'), 'utf8');
for (const contract of [
  "const LEVELS = ['V0', 'V1', 'V2', 'V3']",
  'human-proposed-v0',
  'exige validation.human_confirmation',
  'V3 exige validation.run',
  'frameworks-visuais',
  'architect_map_generated',
]) {
  if (!architectRenderer.includes(contract)) errors.push(`engine do arquiteto sem guarda: ${contract}`);
}

const systematize = readFileSync(join(ROOT, '.claude', 'skills', 'sistematizar', 'SKILL.md'), 'utf8');
for (const contract of [
  'Cérebro Base T4 → resultado confirmado → caso real observado',
  'Registrar fonte ≠ conectar fonte',
  'declared:',
  'observed:',
  'gap:',
  'não crie conexão, agenda ou ação externa',
  'três runs comparáveis',
  'commission-system.mjs',
  '/operar <system-id>',
]) {
  if (!systematize.toLowerCase().includes(contract.toLowerCase())) {
    errors.push(`sistematizar sem contrato: ${contract}`);
  }
}
const commissionEngine = readFileSync(join(ROOT, 'scripts', 'commission-system.mjs'), 'utf8');
for (const contract of [
  "const ALLOWED_ACCESS = new Set(['manual', 'read-only'])",
  'Cérebro Base ainda não chegou a T4',
  'comissionamento nunca sobrescreve pacote local',
  "status: 'configuring'",
  'connected_sources: 0',
  'spec contém PII óbvia',
  'permissions.external_actions precisa ser false',
]) {
  if (!commissionEngine.includes(contract)) errors.push(`engine de sistematização sem guarda: ${contract}`);
}

const motorManifest = readFileSync(join(ROOT, '.cerebro', 'motor.manifest'), 'utf8');
for (const contract of [
  '.cerebro/private-ignore.manifest',
  '.claude/skills/briefing-comercial',
  '.claude/skills/arquiteto',
  '.claude/skills/sistematizar',
  '.claude/skills/company-brain-sprint',
  '.claude/skills/fonte',
  '.cerebro/layout.json',
  'profiles/company-brain-starter-en',
  '.claude/skills/society',
  'METODO-SISTEMAS.md',
  'METODO-EXPERIMENTOS.md',
  'templates',
]) {
  if (!motorManifest.includes(contract)) errors.push(`manifesto do motor sem upgrade: ${contract}`);
}
const updater = readFileSync(join(ROOT, '.claude', 'scripts', 'update.sh'), 'utf8');
for (const contract of ['ensure-private-ignore.sh', 'preserva integralmente o']) {
  if (!updater.includes(contract)) errors.push(`atualizador sem proteção incremental: ${contract}`);
}
const legacyPing = readFileSync(join(ROOT, '.claude', 'scripts', 'ping.sh'), 'utf8');
if (!legacyPing.includes('ensure-private-ignore.sh')) {
  errors.push('ping legado não fecha proteção privada na primeira passagem');
}

const operate = readFileSync(join(ROOT, '.claude', 'skills', 'operar', 'SKILL.md'), 'utf8');
for (const contract of [
  'Recuperar caminhos que já funcionaram',
  'três recibos aprovados',
  'Falha não vira procedimento',
  'procedimento candidato',
  'replay nos casos anteriores',
  'generate-operating-brief.mjs',
]) {
  if (!operate.includes(contract)) errors.push(`operar sem memória procedural: ${contract}`);
}

const reindex = readFileSync(join(ROOT, '.claude', 'skills', 'reindex', 'SKILL.md'), 'utf8');
for (const contract of [
  'Memória procedural',
  'três runs comparáveis',
  'Candidato isolado continua candidato',
  'generate-operating-brief.mjs',
]) {
  if (!reindex.includes(contract)) errors.push(`reindex sem revisão procedural: ${contract}`);
}

const discovery = readFileSync(join(ROOT, 'scripts', 'discover-context.mjs'), 'utf8');
for (const contract of ['readOnly: true', 'nenhum conteúdo de arquivo', 'lstatSync', 'realpathSync']) {
  if (!discovery.includes(contract)) errors.push(`descoberta sem guarda: ${contract}`);
}

const register = readFileSync(join(ROOT, 'scripts', 'register-source.mjs'), 'utf8');
for (const contract of [
  "access: 'read-only'",
  'sourceOfTruth: true',
  "refresh: 'manual'",
  'copied: false',
  '!options.confirm',
]) {
  if (!register.includes(contract)) errors.push(`registro de fonte sem guarda: ${contract}`);
}
const sourceSkill = readFileSync(join(ROOT, '.claude', 'skills', 'fonte', 'SKILL.md'), 'utf8');
for (const contract of [
  'Registrar cria o ponteiro legado, não inventa governança',
  'source-contract.mjs migrate-registry',
  'autoridade, PII, retenção, custódia e garantia',
  'só aplique com `--confirm` depois do readback humano',
  'o contrato novo não bloqueia o primeiro valor',
]) {
  if (!sourceSkill.includes(contract)) errors.push(`fonte sem Source Contract honesto: ${contract}`);
}

const ignore = readFileSync(join(ROOT, '.gitignore'), 'utf8');
if (!ignore.includes('conexoes/configuradas/*')) {
  errors.push('registro local de fontes não está protegido pelo .gitignore');
}
if (!ignore.includes('.cerebro/concierge-runs/')) {
  errors.push('relógios privados do concierge não estão protegidos pelo .gitignore');
}
if (!ignore.includes('.cerebro/sistemas/')) {
  errors.push('estado privado dos sistemas não está protegido pelo .gitignore');
}
for (const privatePath of ['.cerebro/runtime', '.cerebro/contracts/', '.cerebro/ledger/', '.cerebro/learning/']) {
  if (!ignore.includes(privatePath)) errors.push(`estado privado sem ignore: ${privatePath}`);
}
const privateIgnore = readFileSync(join(ROOT, '.cerebro', 'private-ignore.manifest'), 'utf8');
if (!privateIgnore.includes('.cerebro/runtime')) errors.push('manifesto privado não protege runtime');
if (!ignore.includes('operacao/arquitetura/*')) {
  errors.push('mapas privados do Architect não estão protegidos pelo .gitignore');
}

const secretProvider = readFileSync(join(ROOT, 'scripts', 'lib', 'secret-provider.mjs'), 'utf8');
for (const contract of [
  'macos-keychain', 'linux-secret-service', 'windows-dpapi',
  'memory-provider-forbidden', "input: secret", "join(this.root, '.cerebro', 'runtime', 'secrets'",
]) {
  if (!secretProvider.includes(contract)) errors.push(`provider de segredos sem guarda: ${contract}`);
}
const accessRuntime = readFileSync(join(ROOT, 'scripts', 'lib', 'access-runtime.mjs'), 'utf8');
for (const contract of [
  'credential-exfiltration-blocked', 'runtime-enforced exige credential_ref namespaced',
  'direct-access-not-runtime-enforced', 'export-not-revocable', 'human-revocation',
  "credential_status: 'not-checked'",
]) {
  if (!accessRuntime.includes(contract)) errors.push(`runtime de acesso sem guarda: ${contract}`);
}
const routineRuntime = readFileSync(join(ROOT, 'scripts', 'lib', 'routine-runtime.mjs'), 'utf8');
for (const contract of [
  'runtime-connector-not-bound', 'routine-already-running', 'activation-evidence-invalid',
  'destination-not-private', 'scheduledSlotsBetween',
]) {
  if (!routineRuntime.includes(contract)) errors.push(`runtime de Rotinas sem guarda: ${contract}`);
}
const modelExecutors = readFileSync(join(ROOT, 'scripts', 'lib', 'model-executors.mjs'), 'utf8');
for (const contract of [
  "'codex-cli': 'codex'", "'claude-code': 'claude'", 'input: prompt',
  'executor-timeout', '--no-session-persistence',
]) {
  if (!modelExecutors.includes(contract)) errors.push(`adapter de modelo sem guarda: ${contract}`);
}

const baseManifest = readFileSync(join(ROOT, 'sistemas', 'cerebro-base', 'manifest.md'), 'utf8');
for (const contract of ['fonte real', 'artefato aprovado', 'T0', 'T4', 'segunda utilização']) {
  if (!baseManifest.includes(contract)) errors.push(`cerebro-base sem contrato: ${contract}`);
}

const layout = JSON.parse(readFileSync(join(ROOT, '.cerebro', 'layout.json'), 'utf8'));
if (layout.version !== 3) errors.push('layout precisa estar no protocolo v3');
for (const key of [
  'activationBrief', 'configuration', 'activationContract', 'systemContract', 'sourceContracts',
  'experienceManifests',
  'accessGrants', 'accessReceipts', 'runLedger', 'learningRegister',
  'routineContracts', 'executorBindings', 'routineReceipts', 'routineState', 'routineOutputs',
  'routineJudgments',
  'routineCorrections', 'learningCandidates',
  'executionTraces', 'canvasLayouts',
  'experimentContracts', 'experimentStates',
]) {
  if (!layout[key] || layout[key].startsWith('/') || layout[key].includes('..')) {
    errors.push(`layout sem caminho seguro: ${key}`);
  }
}
for (const [canonical, legacy] of [
  ['activationBrief', 'firstSystemBrief'],
  ['configuration', 'contextPack'],
  ['activationContract', 'systemContract'],
]) {
  if (layout[canonical] !== layout[legacy]) {
    errors.push(`layout v3 precisa preservar alias: ${canonical} → ${legacy}`);
  }
}

const sprint = readFileSync(join(ROOT, '.claude', 'skills', 'company-brain-sprint', 'SKILL.md'), 'utf8');
for (const contract of [
  'orientation → source register',
  'opaque `source-id`',
  'one completed Run Record',
  'three comparable runs, replay',
  'source-first route',
  'Registering a source',
  'first business System',
  'CONFIGURATION',
  'capability.capability_id: ativar-recorte-operacional',
  'result.output_type: cerebro-base-ativado',
]) {
  if (!sprint.includes(contract)) errors.push(`company-brain-sprint sem protocolo comum: ${contract}`);
}
const sprintOutputContract = readFileSync(join(ROOT, '.claude', 'skills', 'company-brain-sprint', 'references', 'output-contract.md'), 'utf8');
for (const contract of [
  '`system_id`: `cerebro-base`',
  '`capability.capability_id`: `ativar-recorte-operacional`',
  '`result.output_type`: `cerebro-base-ativado`',
  'becomes `active` only after T4',
]) {
  if (!sprintOutputContract.includes(contract)) errors.push(`output contract sem identidade estável: ${contract}`);
}

const clock = readFileSync(join(ROOT, 'scripts', 'concierge-run.mjs'), 'utf8');
for (const contract of [
  "const MILESTONES = ['T0', 'T1', 'T2', 'T3', 'T4']",
  'registre ${previous} antes',
  "join(root, '.cerebro', 'concierge-runs'",
  'withinContract',
]) {
  if (!clock.includes(contract)) errors.push(`relógio do concierge sem guarda: ${contract}`);
}

const brief = readFileSync(join(ROOT, 'scripts', 'generate-operating-brief.mjs'), 'utf8');
for (const contract of [
  "'operacao', '_HOJE.md'",
  'Nenhum conteúdo foi enviado à INEVITA',
  'Disponível” confirma somente',
  'Caminho bem-sucedido só vira pipeline ou skill',
]) {
  if (!brief.includes(contract)) errors.push(`brief operacional sem contrato: ${contract}`);
}
for (const script of [
  'concierge-run.mjs',
  'register-source.mjs',
  'system-run.mjs',
  'system-state.mjs',
]) {
  const content = readFileSync(join(ROOT, 'scripts', script), 'utf8');
  if (!content.includes('generate-operating-brief.mjs')) {
    errors.push(`${script} não atualiza o brief operacional`);
  }
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`✓ protocolo válido · 22 envelopes · 3 sistemas · ${claudeFiles.length} arquivos de skills sincronizados`);
