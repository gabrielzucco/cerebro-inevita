#!/usr/bin/env node
import { existsSync, realpathSync, readFileSync, readdirSync, lstatSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { communityAssert, communityHash, readCommunityFile, safeCommunityPath, encodeCommunityFile, validateCommunityPackage, stableStringify } from './lib/community-package.mjs';

export function funilContracts(version) {
  const systemId = 'sistema-funil-inevita';
  const result = 'Preparar e revisar o funil com contexto autorizado, evidências e decisões humanas registradas';
  const roles = [{ role: 'contexto-autorizado', label: 'Contexto autorizado do negócio', required: true, examples: ['arquivo local selecionado'] }];
  const permissions = { read: ['fontes selecionadas pelo dono'], write: ['workspace privado após aprovação'], external_actions: false };
  const validation = { program_key: 'funil-e-crescimento', required_real_cycles: 3, verified_real_cycles: 0, required_distinct_member_brains: 2, verified_distinct_member_brains: 0, requires_repeat_use: true, requires_eval_pass: true, requires_human_approval: true };
  const capability = { protocol_version: 1, capability_id: 'operar-funil-com-contexto', name: 'Operar funil com contexto', version: '0.2.0', task: result, input_roles: roles.map(({ role, required }) => ({ role, required, purpose: 'Sustentar o trabalho sem inventar fatos' })), output: { type: 'peca-revisada', definition_of_done: 'Peça revisável com fontes, limites e decisão pendente ou registrada' }, permissions, human_authority: ['Aprovar proposta, execução externa e aprendizado'], evals: ['Integridade do pacote', 'Rastreabilidade de afirmações', 'Revisão humana distinta de gate técnico'] };
  const contract = { protocol_version: 1, system_id: systemId, name: 'Funil e Crescimento', version, status: 'proposed', result: { statement: result, non_success: 'Inventar pesquisa, aprovação ou resultado de mercado', output_type: 'peca-revisada', definition_of_done: capability.output.definition_of_done, owner: 'dono-do-cerebro', human_gate: 'Revisar conteúdo e decidir próximo passo' }, trigger: { type: 'manual', description: 'Pedido autorizado do dono' }, capability: { capability_id: capability.capability_id, version: capability.version, origin: 'inevita' }, entities: [], sources: [{ role: 'contexto-autorizado', source_id: null, required: true, access: 'manual', freshness: 'Contexto confirmado para o pedido', purpose: 'Sustentar o trabalho com fonte' }], pipeline: [{ state: 'preparar', input: 'Pedido e contexto autorizado', output: 'Brief e lacunas', gate: 'Fonte e limites explícitos' }, { state: 'produzir', input: 'Brief revisado', output: 'Peça candidata', gate: 'Afirmações sustentadas' }, { state: 'revisar', input: 'Peça candidata', output: 'Decisão e aprendizado candidato', gate: 'Aprovação humana separada' }], permissions, eval: { version: '0.2.0', deterministic_gates: capability.evals, human_questions: ['O texto representa a oferta e ajuda o comprador a decidir?'], outcome_measure: 'uso-confirmado', baseline: null }, learning: { correction_policy: 'candidate-first', promotion_threshold: 3, requires_replay: true, requires_human_approval: true } };
  const release = { protocol_version: 1, release_id: `funil-${version.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}`, system_ref: systemId, version, channel: 'pilot', compatibility: { minimum_brain_version: '1.39.0' }, contracts: { system_contract_ref: 'contract.json', capability_contract_ref: 'capability.json' }, publication: { status: 'pilot', catalog_visibility: 'validation-lab', access_mode: 'public', application_required: false }, validation, privacy: { mode: 'local-first', telemetry_content: false } };
  const manifest = { schema_version: 1, system_id: systemId, name: contract.name, release: { version, channel: 'pilot', minimum_brain_version: '1.39.0' }, validation: { ...validation, stage: 'pilot', listed: false, validation_lab_visible: true, access_mode: 'society_members', application_required: false }, publication: { status: 'pilot', public_catalog: false, validation_lab: true }, result, setpoint: 'Reaproveitar contexto e revisões ao produzir e revisar peças do funil', first_value: 'Primeira peça revisável com fontes, lacunas e próximo passo explícitos', privacy: 'local-first', permissions: { connects_sources_automatically: false, writes_external_systems_automatically: false, requires_source_by_source_consent: true }, requirements: { real_event: 'Pedido real de peça do funil e contexto autorizado', source_roles: roles, human_approval_before_external_write: true } };
  return Object.fromEntries(Object.entries({ 'manifest.json': manifest, 'release.json': release, 'contract.json': contract, 'capability.json': capability }).map(([name, value]) => [name, `${JSON.stringify(value, null, 2)}\n`]));
}
export function buildFunilCommunityPackage({ sourceDir }) {
  const root = resolve(sourceDir);
  const inventory = JSON.parse(readCommunityFile(root, 'INVENTARIO.json'));
  const manifest = JSON.parse(readCommunityFile(root, 'manifest.json'));
  communityAssert(manifest.name === 'sistema-funil-inevita' && manifest.version === '0.2.0-rc.1' && manifest.published === false, 'unexpected_funil_release');
  const expected = new Map(inventory.files.map((entry) => [entry.path, entry]));
  communityAssert(expected.size === 98 && inventory.files.length === 98, 'funil_inventory_invalid');
  const paths = [];
  function walk(prefix = '') {
    for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;
      safeCommunityPath(root, name); communityAssert(!entry.isSymbolicLink(), 'unsafe_source');
      if (entry.isDirectory()) walk(name); else { communityAssert(entry.isFile(), 'unsafe_source'); paths.push(name); }
    }
  }
  walk(); communityAssert(paths.length === 99 && paths.every((path) => path === 'INVENTARIO.json' || expected.has(path)), 'funil_files_mismatch');
  const files = Object.create(null);
  for (const name of paths.sort()) {
    const bytes = readCommunityFile(root, name); const entry = encodeCommunityFile(bytes);
    if (name !== 'INVENTARIO.json') communityAssert(entry.sha256 === expected.get(name).sha256 && entry.bytes === expected.get(name).bytes, 'funil_integrity_mismatch');
    files[name] = entry;
  }
  communityAssert(files['originais/KIT-COPY-COM-IA.zip']?.sha256 === '0a7ad861597adea97c50e966d26cb6e999b762df932626f476d7796939826a33', 'original_kit_mismatch');
  const bundle = { schema_version: 2, slug: 'funil-e-crescimento', system_id: manifest.name, version: manifest.version, title: 'Funil e Crescimento', entrypoint: manifest.entrypoint, first_task: 'Leia COMECE-AQUI.md; revise o plano de inicialização do workspace privado antes de preparar a primeira peça.', files, contracts: funilContracts(manifest.version), provenance: { source: 'funil-0.2.0-rc.1-integral', changes: 'Nenhum byte do bundle original alterado; contratos somente no envelope externo.' } };
  validateCommunityPackage(bundle); return bundle;
}
if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const option = (key) => process.argv.find((arg) => arg.startsWith(`--${key}=`))?.slice(key.length + 3);
    communityAssert(option('source'), 'source_required');
    const bundle = buildFunilCommunityPackage({ sourceDir: option('source') });
    const validation = validateCommunityPackage(bundle);
    if (process.argv.includes('--confirm')) {
      communityAssert(option('out'), 'out_required');
      const output = resolve(option('out')); // Explicit artifact destination; never an automatic repo/package write.
      writeFileSync(output, stableStringify(bundle), { flag: 'wx', mode: 0o600 });
    }
    console.log(JSON.stringify({ package_sha256: validation.packageSha256, files: validation.fileCount, bytes: validation.totalBytes, writes: process.argv.includes('--confirm') }));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
