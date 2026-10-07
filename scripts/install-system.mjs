#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCapabilityContract, validateSystemContract } from './lib/system-protocol.mjs';
import { validateExperienceManifest } from './lib/experience-manifest.mjs';
import { validateReleaseManifest } from './lib/release-manifest.mjs';
import { summarizeSystemSourceBindings } from './lib/system-source-binding.mjs';

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET_ROOT = resolve(process.env.CEREBRO_INSTALL_ROOT || SOURCE_ROOT);
const DEFAULT_DISTRIBUTION_URL = 'https://inevitasociety.com/supabase/functions/v1/cerebro-system-distribution';
const slug = String(process.argv[2] || '').trim().toLowerCase();
const confirmed = process.argv.includes('--confirm');
const dryRun = process.argv.includes('--dry-run');
const option = (name) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? '';
};
const memberIdArg = option('member-id').trim().toLowerCase();
const grantToken = option('grant').trim();
const expectedSha256 = option('sha256').trim().toLowerCase();
const runtime = option('runtime').trim().toLowerCase();
const distributionUrl = option('distribution-url').trim()
  || process.env.CEREBRO_DISTRIBUTION_URL
  || DEFAULT_DISTRIBUTION_URL;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_RE = /^[0-9a-f]{64}$/;
const GRANT_RE = /^[A-Za-z0-9_-]{40,96}$/;
const RUNTIMES = new Set(['claude-code', 'codex', 'gemini-cli', 'antigravity', 'outro']);
const PACKAGE_FILES = ['manifest.json', 'manifest.md', 'pipeline.md', 'rotinas.md', 'evals.md', 'changelog.md'];
const OPTIONAL_PACKAGE_FILES = ['capability.json', 'contract.json', 'release.json', 'experience.json'];
const TEMPLATE_FILES = [
  ['feedback.template.md', 'feedback.md'],
  ['configuracao.template.md', 'configuracao.md'],
  ['experimento.template.md', 'experimento.md'],
];

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function versionCore(value) {
  const match = String(value).trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1, 4).map(Number) : null;
}

function atLeast(current, minimum) {
  const a = versionCore(current);
  const b = versionCore(minimum);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true;
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    fail(`${label} inválido`);
  }
}

function ensureBrain() {
  if (!existsSync(join(TARGET_ROOT, 'COMECE-AQUI.md')) || !existsSync(join(TARGET_ROOT, 'VERSION'))) {
    fail('a pasta de destino não é um Cérebro INEVITA reconhecido');
  }
}

function ensureInstallId() {
  const path = join(TARGET_ROOT, '.cerebro', 'id');
  const current = existsSync(path) ? readFileSync(path, 'utf8').trim().toLowerCase() : '';
  if (UUID_RE.test(current)) return current;
  const created = randomUUID();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${created}\n`, { mode: 0o600 });
  return created;
}

function validatePackageProtocol(files, legacyManifest) {
  if (typeof files['release.json'] !== 'string') {
    return { release: null, contract: null, systemId: legacyManifest.system_id, version: legacyManifest.release?.version || '' };
  }
  let release;
  try { release = JSON.parse(files['release.json']); } catch { fail('release manifest inválido'); }
  const releaseErrors = validateReleaseManifest(release);
  if (releaseErrors.length) fail(`release manifest inválido: ${releaseErrors.join(' · ')}`);
  const systemRef = release.contracts.system_contract_ref;
  const capabilityRef = release.contracts.capability_contract_ref;
  if (typeof files[systemRef] !== 'string' || typeof files[capabilityRef] !== 'string') {
    fail('release manifest aponta para contrato ausente no pacote');
  }
  let contract;
  let capability;
  try {
    contract = JSON.parse(files[systemRef]);
    capability = JSON.parse(files[capabilityRef]);
  } catch { fail('contrato referenciado pelo release manifest é inválido'); }
  const contractErrors = validateSystemContract(contract);
  const capabilityErrors = validateCapabilityContract(capability);
  if (contractErrors.length) fail(`system contract inválido: ${contractErrors.join(' · ')}`);
  if (capabilityErrors.length) fail(`capability contract inválido: ${capabilityErrors.join(' · ')}`);
  if (release.system_ref !== contract.system_id || release.version !== contract.version
    || contract.capability.capability_id !== capability.capability_id
    || contract.capability.version !== capability.version) {
    fail('release, system contract e capability contract divergem; nenhum arquivo foi alterado');
  }
  const experienceRef = release.contracts.experience_manifest_ref;
  if (experienceRef !== undefined) {
    if (typeof files[experienceRef] !== 'string') fail('release manifest aponta para experience manifest ausente');
    let experience;
    try { experience = JSON.parse(files[experienceRef]); } catch { fail('experience manifest inválido'); }
    const experienceErrors = validateExperienceManifest(experience);
    if (experienceErrors.length || experience.system_ref !== release.system_ref) {
      fail(`experience manifest incompatível: ${experienceErrors.join(' · ') || 'system_ref divergente'}`);
    }
  }
  return { release, contract, systemId: release.system_ref, version: release.version };
}

async function postDistribution(action, payload, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(distributionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: { error: error instanceof Error ? error.message : 'network_error' },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function validateRemotePackage(responseBody) {
  const bundle = responseBody?.package;
  const serverHash = String(responseBody?.package_sha256 || '').toLowerCase();
  if (!bundle || bundle.schema_version !== 1 || bundle.slug !== slug || !SLUG_RE.test(bundle.system_id || '')) {
    fail('o Registry devolveu um pacote incompatível com o Sistema solicitado');
  }
  if (!bundle.files || typeof bundle.files !== 'object' || Array.isArray(bundle.files)) {
    fail('o Registry devolveu um pacote sem arquivos');
  }
  for (const file of [...PACKAGE_FILES, 'feedback.template.md', 'configuracao.template.md']) {
    if (typeof bundle.files[file] !== 'string') fail(`pacote remoto incompleto: ${file}`);
  }
  for (const path of Object.keys(bundle.files)) {
    if (path.startsWith('/') || path.includes('..') || path.includes('\\')) {
      fail(`caminho inseguro recusado no pacote: ${path}`);
    }
  }
  const calculated = sha256(stableStringify(bundle));
  if (!SHA256_RE.test(serverHash) || calculated !== serverHash) {
    fail('checksum do pacote não confere; nenhum arquivo foi alterado');
  }
  if (expectedSha256 && (!SHA256_RE.test(expectedSha256) || expectedSha256 !== calculated)) {
    fail('o pacote não confere com a versão autorizada pela plataforma; nenhum arquivo foi alterado');
  }
  const manifest = JSON.parse(bundle.files['manifest.json']);
  const protocol = validatePackageProtocol(bundle.files, manifest);
  if (protocol.systemId !== bundle.system_id || protocol.version !== bundle.version) {
    fail('manifesto e envelope do pacote divergem; nenhum arquivo foi alterado');
  }
  if (typeof bundle.files['capability.json'] === 'string') {
    const capability = JSON.parse(bundle.files['capability.json']);
    const errors = validateCapabilityContract(capability);
    if (errors.length) fail(`capability contract inválido: ${errors.join(' · ')}`);
  }
  return { bundle, manifest, ...protocol, files: bundle.files, packageSha256: calculated };
}

function loadLocalPackage() {
  const source = join(SOURCE_ROOT, 'comunidade', 'inevita', 'sistemas-disponiveis', slug);
  if (!existsSync(source)) fail(`sistema não publicado neste Cérebro: ${slug}`);
  const files = {};
  for (const file of [...PACKAGE_FILES, 'feedback.template.md', 'configuracao.template.md']) {
    const path = join(source, file);
    if (!existsSync(path)) fail(`pacote incompleto: ${file}`);
    files[file] = readFileSync(path, 'utf8');
  }
  for (const optional of ['experimento.template.md', 'recibo-evals.template.md']) {
    const path = join(source, optional);
    if (existsSync(path)) files[optional] = readFileSync(path, 'utf8');
  }
  for (const optional of OPTIONAL_PACKAGE_FILES) {
    const path = join(source, optional);
    if (existsSync(path)) files[optional] = readFileSync(path, 'utf8');
  }
  const skillPath = join(source, 'skill', 'SKILL.md');
  if (existsSync(skillPath)) files['skill/SKILL.md'] = readFileSync(skillPath, 'utf8');
  const manifest = JSON.parse(files['manifest.json']);
  const protocol = validatePackageProtocol(files, manifest);
  return {
    bundle: {
      schema_version: 1,
      slug,
      system_id: protocol.systemId || slug,
      version: protocol.version,
      files,
    },
    manifest,
    ...protocol,
    files,
    packageSha256: sha256(stableStringify({
      schema_version: 1,
      slug,
      system_id: protocol.systemId || slug,
      version: protocol.version,
      files,
    })),
  };
}

function writePackage({ bundle, manifest, release, contract, files, packageSha256 }) {
  const targetVersion = readFileSync(join(TARGET_ROOT, 'VERSION'), 'utf8').trim();
  const minimumBrain = String(release?.compatibility.minimum_brain_version || manifest.release?.minimum_brain_version || '').trim();
  if (minimumBrain && !atLeast(targetVersion, minimumBrain)) {
    fail(`este pacote exige Cérebro >= ${minimumBrain}; o destino está em ${targetVersion}. Atualize antes de instalar.`);
  }

  const memberIdPath = join(TARGET_ROOT, '.cerebro', 'member-id');
  const existingMemberId = existsSync(memberIdPath)
    ? readFileSync(memberIdPath, 'utf8').trim().toLowerCase()
    : '';
  if (memberIdArg && UUID_RE.test(existingMemberId) && existingMemberId !== memberIdArg) {
    fail('este Cérebro já pertence a outro member-id — não reatribua uma instalação; comissione a partir de base limpa');
  }
  const gated = (release?.publication.access_mode || manifest.validation?.access_mode) === 'approved-participants'
    || (!release && manifest.validation?.access_mode === 'approved_participants');
  if (gated && !UUID_RE.test(memberIdArg || existingMemberId)) {
    fail('pacote de acesso restrito exige a costura do participante: rode com --member-id=<uuid> (ou grave .cerebro/member-id antes)');
  }
  if (memberIdArg && existingMemberId !== memberIdArg) {
    mkdirSync(dirname(memberIdPath), { recursive: true });
    writeFileSync(memberIdPath, `${memberIdArg}\n`, { mode: 0o600 });
  }

  const target = join(TARGET_ROOT, 'sistemas', 'outros-instalados', slug);
  mkdirSync(target, { recursive: true });
  for (const file of PACKAGE_FILES) writeFileSync(join(target, file), files[file]);
  for (const file of OPTIONAL_PACKAGE_FILES) {
    if (typeof files[file] === 'string') writeFileSync(join(target, file), files[file]);
  }
  for (const [template, destination] of TEMPLATE_FILES) {
    if (typeof files[template] !== 'string') continue;
    const destinationPath = join(target, destination);
    if (!existsSync(destinationPath)) writeFileSync(destinationPath, files[template], { mode: 0o600 });
  }
  if (typeof files['recibo-evals.template.md'] === 'string') {
    writeFileSync(join(target, 'recibo-evals.template.md'), files['recibo-evals.template.md']);
  }

  const skillName = String(manifest.skill?.name || slug).trim().toLowerCase();
  if (typeof files['skill/SKILL.md'] === 'string' && SLUG_RE.test(skillName)) {
    for (const agent of ['.claude', '.agents']) {
      const skillTarget = join(TARGET_ROOT, agent, 'skills', skillName);
      mkdirSync(skillTarget, { recursive: true });
      writeFileSync(join(skillTarget, 'SKILL.md'), files['skill/SKILL.md']);
    }
  }

  const catalogPath = join(TARGET_ROOT, 'sistemas', 'outros-instalados', '_CATALOGO.md');
  mkdirSync(dirname(catalogPath), { recursive: true });
  const start = `<!-- system:${slug}:start -->`;
  const end = `<!-- system:${slug}:end -->`;
  const entry = `${start}\n- [${contract?.name || manifest.name || slug}](${slug}/manifest.md) · pacote adicionado · \`operar ${slug}\`\n${end}`;
  let catalog = existsSync(catalogPath)
    ? readFileSync(catalogPath, 'utf8')
    : '# Sistemas adicionados\n\nA configuração e o feedback continuam privados neste Cérebro.\n';
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  catalog = pattern.test(catalog) ? catalog.replace(pattern, entry) : `${catalog.trim()}\n\n${entry}\n`;
  writeFileSync(catalogPath, catalog.endsWith('\n') ? catalog : `${catalog}\n`);

  const stateDir = join(TARGET_ROOT, '.cerebro', 'sistemas');
  mkdirSync(stateDir, { recursive: true });
  const statePath = join(stateDir, `${slug}.json`);
  const hadState = existsSync(statePath);
  const previous = hadState ? readJson(statePath, 'estado local do sistema') : {};
  const sameRelease = previous.package_version === bundle.version
    && previous.package_sha256 === packageSha256;
  let capability = previous.capability || null;
  if (typeof files['capability.json'] === 'string') {
    capability = JSON.parse(files['capability.json']);
    const errors = validateCapabilityContract(capability);
    if (errors.length) fail(`capability contract inválido: ${errors.join(' · ')}`);
  }
  const sourceRequirements = Array.isArray(contract?.sources) ? contract.sources : [];
  const sourceBindings = contract
    ? summarizeSystemSourceBindings(TARGET_ROOT, contract)
    : sameRelease && previous.source_bindings ? previous.source_bindings : {
      total_roles: sourceRequirements.length,
      required_roles: sourceRequirements.filter((source) => source.required === true).length,
      ready_roles: 0,
      status: sourceRequirements.length ? 'unbound' : 'not-required',
    };
  writeFileSync(statePath, `${JSON.stringify({
    ...(sameRelease ? previous : {}),
    slug,
    system_id: bundle.system_id,
    package_version: bundle.version,
    package_sha256: packageSha256,
    release_channel: release?.channel || manifest.release?.channel || 'unknown',
    validation_stage: release?.publication.status || manifest.validation?.stage || 'unknown',
    capability: capability ? {
      capability_id: capability.capability_id,
      version: capability.version,
      origin: 'inevita',
    } : null,
    source_bindings: sourceBindings,
    status: sameRelease ? (previous.status || 'package_added') : 'package_added',
    updated_at: new Date().toISOString(),
  }, null, 2)}\n`, { mode: 0o600 });

  const receiptDir = join(TARGET_ROOT, 'operacao', 'execucoes');
  mkdirSync(receiptDir, { recursive: true });
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  writeFileSync(join(receiptDir, `${stamp}-pacote-${slug}.md`), [
    `# Pacote adicionado — ${slug}`,
    '',
    `- quando: ${now.toISOString()}`,
    `- system-id: ${bundle.system_id}`,
    `- versão: ${bundle.version}`,
    '- estado: pacote adicionado; ainda não ativo',
    `- papéis de Fonte: ${sourceBindings.total_roles} (${sourceBindings.required_roles} obrigatórios)`,
    `- bindings prontos: ${sourceBindings.ready_roles}`,
    '- contexto alterado: não',
    '- conteúdo enviado à INEVITA: não',
    `- próximo passo: mapear papéis com \`node scripts/system-source-binding.mjs plan ${bundle.system_id}\``,
    '',
  ].join('\n'));

  return { hadState, statePath };
}

async function main() {
  if (!SLUG_RE.test(slug)) fail('informe um system_id válido');
  if (memberIdArg && !UUID_RE.test(memberIdArg)) fail('--member-id inválido: informe o UUID do participante');
  if (grantToken && !GRANT_RE.test(grantToken)) fail('--grant inválido ou truncado');
  if (expectedSha256 && !SHA256_RE.test(expectedSha256)) fail('--sha256 inválido');
  if (runtime && !RUNTIMES.has(runtime)) fail('--runtime inválido');

  if (!confirmed) {
    console.log(`Sistema: ${slug}`);
    console.log('O pacote será validado e adicionado sem conectar fontes ou alterar o contexto.');
    console.log('Depois, o agente conduz a configuração privada e uma primeira execução real.');
    console.log(`Confirme com: node scripts/install-system.mjs ${slug} --confirm`);
    process.exit(2);
  }
  ensureBrain();
  const installId = ensureInstallId();

  if (dryRun && grantToken) fail('--dry-run não resgata grant remoto; gere uma nova autorização quando for instalar');

  let packageData;
  let receiptOnly = false;
  if (grantToken) {
    const redeemed = await postDistribution('redeem_grant', {
      grant_token: grantToken,
      install_id: installId,
    });
    if (redeemed.ok) {
      packageData = validateRemotePackage(redeemed.body);
    } else if (redeemed.status === 409) {
      const statePath = join(TARGET_ROOT, '.cerebro', 'sistemas', `${slug}.json`);
      const state = existsSync(statePath) ? readJson(statePath, 'estado local do sistema') : null;
      if (!state || state.slug !== slug || (expectedSha256 && state.package_sha256 !== expectedSha256)) {
        fail('esta autorização já foi usada ou revogada; gere uma nova na plataforma');
      }
      receiptOnly = true;
    } else {
      fail(`não foi possível resgatar o pacote (${redeemed.body?.error || `HTTP ${redeemed.status}`})`);
    }
  } else {
    packageData = loadLocalPackage();
  }

  if (packageData && dryRun) {
    console.log(`✓ pacote válido: ${slug}`);
    return;
  }

  const installResult = packageData ? writePackage(packageData) : { hadState: true };
  const state = readJson(join(TARGET_ROOT, '.cerebro', 'sistemas', `${slug}.json`), 'estado local do sistema');

  if (grantToken) {
    const receipt = await postDistribution('installation_receipt', {
      grant_token: grantToken,
      install_id: installId,
      runtime: runtime || undefined,
      brain_version: readFileSync(join(TARGET_ROOT, 'VERSION'), 'utf8').trim(),
    });
    if (!receipt.ok) {
      if (receiptOnly && ['receipt_unavailable', 'receipt_already_used'].includes(receipt.body?.error)) {
        fail('esta autorização já concluiu uma instalação e não pode ser reutilizada; gere uma nova na plataforma');
      }
      fail(`pacote instalado localmente, mas o recibo não fechou (${receipt.body?.error || `HTTP ${receipt.status}`}). Repita o mesmo comando antes de 30 minutos.`);
    }
  }

  if (!installResult.hadState && !receiptOnly) {
    const targetPing = join(TARGET_ROOT, '.agents', 'scripts', 'ping.mjs');
    const pingScript = existsSync(targetPing)
      ? targetPing
      : join(SOURCE_ROOT, '.agents', 'scripts', 'ping.mjs');
    spawnSync(process.execPath, [
      pingScript,
      'system_installed',
      state.system_id || slug,
      `--release-version=${state.package_version || ''}`,
    ], {
      cwd: TARGET_ROOT,
      env: process.env,
      stdio: 'ignore',
      timeout: 2500,
    });
  }

  console.log(`✓ ${state.system_id || slug}@${state.package_version || 'desconhecida'} adicionado; o Sistema ainda não está ativo`);
  console.log(`Próximo passo: mapeie as Fontes com node scripts/system-source-binding.mjs plan ${state.system_id || slug}; só depois rode o primeiro caso real.`);
}

await main();
