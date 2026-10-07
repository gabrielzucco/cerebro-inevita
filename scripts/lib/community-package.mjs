import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, openSync, fstatSync, closeSync, constants, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { validateCapabilityContract, validateSystemContract } from './system-protocol.mjs';
import { validateReleaseManifest } from './release-manifest.mjs';
import { validateSocietyPackageManifest } from './society-catalog-read-model.mjs';

export const COMMUNITY_LIMITS = Object.freeze({ files: 512, fileBytes: 1048576, totalBytes: 4194304, jsonBytes: 6291456 });
export const COMMUNITY_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const COMMUNITY_SHA_RE = /^[a-f0-9]{64}$/;
const VERSION_RE = /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/;
const CONTRACT_NAMES = ['manifest.json', 'release.json', 'contract.json', 'capability.json'];
export function communityAssert(ok, code) { if (!ok) throw new Error(code); }
export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export const communityHash = (value) => createHash('sha256').update(value).digest('hex');
export const hashCommunityPackage = (value) => communityHash(stableStringify(value));
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
function closed(value, allowed) {
  communityAssert(object(value) && Object.keys(value).every((key) => allowed.includes(key)), 'invalid_package_fields');
}
export function safeCommunityName(name) {
  communityAssert(typeof name === 'string' && name.length > 0 && name.length <= 512 && name === name.normalize('NFC'), 'unsafe_path');
  communityAssert(!/[\\:\x00-\x1f\x7f<>"|?*]/.test(name), 'unsafe_path');
  for (const part of name.split('/')) {
    communityAssert(part && !['.', '..'].includes(part.toLowerCase()) && !/[ .]$/.test(part), 'unsafe_path');
    communityAssert(!/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part), 'unsafe_path');
  }
  return name;
}
// Reject links in every existing component. Never use realpath to silently follow a link.
export function safeCommunityPath(root, name) {
  const base = resolve(root);
  if (existsSync(base)) communityAssert(lstatSync(base).isDirectory() && !lstatSync(base).isSymbolicLink(), 'unsafe_root');
  safeCommunityName(name);
  let current = base;
  const parts = name.split('/');
  for (let index = 0; index < parts.length; index += 1) {
    current = join(current, parts[index]);
    // lstat also catches dangling symlinks.
    let stat; try { stat = lstatSync(current); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat) communityAssert(!stat.isSymbolicLink() && (index === parts.length - 1 || stat.isDirectory()), 'unsafe_target');
  }
  return current;
}
export function readCommunityFile(root, name, limit = COMMUNITY_LIMITS.fileBytes) {
  const path = safeCommunityPath(root, name);
  const fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
  try {
    const stat = fstatSync(fd);
    communityAssert(stat.isFile() && stat.size <= limit, 'invalid_file_size');
    const bytes = readFileSync(fd);
    communityAssert(bytes.length <= limit, 'invalid_file_size');
    return bytes;
  } finally { closeSync(fd); }
}
export function encodeCommunityFile(bytes) {
  return { encoding: 'base64', content: bytes.toString('base64'), sha256: communityHash(bytes), bytes: bytes.length };
}
function verifyNames(names) {
  const seen = new Map();
  for (const name of names) {
    safeCommunityName(name);
    communityAssert(!name.split('/').some((part) => ['.git', '.cerebro', '.env'].includes(part.toLowerCase())), 'private_package_path');
    const folded = name.toUpperCase().toLowerCase();
    communityAssert(!seen.has(folded), 'case_collision');
    seen.set(folded, name);
  }
  for (const name of seen.keys()) {
    const parts = name.split('/');
    for (let index = 1; index < parts.length; index += 1) communityAssert(!seen.has(parts.slice(0, index).join('/')), 'file_ancestor');
  }
  // Directory spelling must also agree on case-sensitive platforms.
  const directories = new Map();
  for (const name of names) {
    const parts = name.split('/');
    for (let index = 1; index < parts.length; index += 1) {
      const dir = parts.slice(0, index).join('/'); const key = dir.toUpperCase().toLowerCase();
      communityAssert(!directories.has(key) || directories.get(key) === dir, 'case_collision'); directories.set(key, dir);
    }
  }
}
export function validateCommunityPackage(bundle) {
  closed(bundle, ['schema_version', 'slug', 'system_id', 'version', 'title', 'entrypoint', 'first_task', 'files', 'contracts', 'provenance']);
  communityAssert(bundle.schema_version === 2 && typeof bundle.slug === 'string' && typeof bundle.system_id === 'string' && COMMUNITY_ID_RE.test(bundle.slug) && COMMUNITY_ID_RE.test(bundle.system_id), 'invalid_package_identity');
  communityAssert(typeof bundle.version === 'string' && bundle.version.length <= 64 && VERSION_RE.test(bundle.version), 'invalid_package_version');
  for (const key of ['title', 'first_task']) communityAssert(typeof bundle[key] === 'string' && bundle[key].trim() && bundle[key].length <= (key === 'title' ? 200 : 2000), 'invalid_package_text');
  communityAssert(Buffer.byteLength(stableStringify(bundle)) <= COMMUNITY_LIMITS.jsonBytes, 'package_too_large');
  communityAssert(object(bundle.files), 'invalid_package_files');
  const names = Object.keys(bundle.files);
  communityAssert(names.length > 0 && names.length <= COMMUNITY_LIMITS.files, 'invalid_file_count');
  verifyNames(names);
  communityAssert(names.includes(safeCommunityName(bundle.entrypoint)), 'missing_entrypoint');
  let totalBytes = 0;
  for (const entry of Object.values(bundle.files)) {
    closed(entry, ['encoding', 'content', 'sha256', 'bytes']);
    communityAssert(entry.encoding === 'base64' && typeof entry.content === 'string' && Number.isInteger(entry.bytes) && entry.bytes >= 0 && entry.bytes <= COMMUNITY_LIMITS.fileBytes, 'invalid_file_encoding');
    communityAssert(entry.content.length <= Math.ceil(COMMUNITY_LIMITS.fileBytes / 3) * 4 && COMMUNITY_SHA_RE.test(entry.sha256), 'invalid_file_encoding');
    const bytes = Buffer.from(entry.content, 'base64');
    communityAssert(bytes.toString('base64') === entry.content && bytes.length === entry.bytes && communityHash(bytes) === entry.sha256, 'file_hash_mismatch');
    totalBytes += bytes.length;
  }
  communityAssert(totalBytes <= COMMUNITY_LIMITS.totalBytes, 'package_too_large');
  closed(bundle.contracts, CONTRACT_NAMES);
  communityAssert(CONTRACT_NAMES.every((name) => typeof bundle.contracts[name] === 'string'), 'missing_contract');
  let manifest, release, contract, capability;
  try { [manifest, release, contract, capability] = CONTRACT_NAMES.map((name) => JSON.parse(bundle.contracts[name])); }
  catch { throw new Error('invalid_contract_json'); }
  communityAssert(![...validateSocietyPackageManifest(manifest), ...validateReleaseManifest(release), ...validateSystemContract(contract), ...validateCapabilityContract(capability)].length, 'invalid_contract');
  communityAssert(manifest.system_id === bundle.system_id && manifest.release.version === bundle.version && release.system_ref === bundle.system_id && contract.system_id === bundle.system_id && release.version === bundle.version && contract.version === bundle.version && contract.capability.capability_id === capability.capability_id && contract.capability.version === capability.version, 'contract_mismatch');
  communityAssert(release.contracts.system_contract_ref === 'contract.json' && release.contracts.capability_contract_ref === 'capability.json' && !release.contracts.experience_manifest_ref, 'unsupported_contract_ref');
  if (bundle.provenance !== undefined) {
    closed(bundle.provenance, ['base_package_sha256', 'source', 'changes']);
    for (const value of Object.values(bundle.provenance)) communityAssert(typeof value === 'string' && value.length <= 4000, 'invalid_provenance');
    if (bundle.provenance.base_package_sha256 !== undefined) communityAssert(COMMUNITY_SHA_RE.test(bundle.provenance.base_package_sha256), 'invalid_provenance');
  }
  return { packageSha256: hashCommunityPackage(bundle), fileCount: names.length, totalBytes, manifest, release, contract, capability };
}
export function communityPrivacyIgnore(root) {
  const target = safeCommunityPath(root, '.gitignore');
  const original = existsSync(target) ? readCommunityFile(root, '.gitignore').toString() : '';
  const rules = ['sistemas/outros-instalados/*/workspace/', 'sistemas/outros-instalados/*/releases/', 'sistemas/outros-instalados/.community-stage-*/', 'sistemas/outros-instalados/.*.install.lock', '.cerebro/sistemas/', 'comunidade/minhas-contribuicoes/propostas/*'];
  const lines = new Set(original.split(/\r?\n/));
  const missing = rules.filter((rule) => !lines.has(rule));
  return { path: target, original, content: missing.length ? `${original}${original.endsWith('\n') || !original ? '' : '\n'}\n# CS1: local package state, private workspace and proposals\n${missing.join('\n')}\n` : original, changed: missing.length > 0 };
}
function atLeast(current, minimum) {
  const a = current.match(/^(\d+)\.(\d+)\.(\d+)/)?.slice(1).map(Number);
  const b = minimum.match(/^(\d+)\.(\d+)\.(\d+)/)?.slice(1).map(Number);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
}
function locations(root, bundle, hash) {
  const system = `sistemas/outros-instalados/${bundle.slug}`;
  const release = `${system}/releases/${bundle.version}-${hash}`;
  return { system, release, bundle: `${release}/bundle`, workspace: `${system}/workspace`, state: `.cerebro/sistemas/${bundle.slug}.json`, receipt: `${release}/installation.json` };
}
function readState(root, slug) {
  const path = safeCommunityPath(root, `.cerebro/sistemas/${slug}.json`);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}
export function planCommunityInstall({ root, package: bundle, expectedSha256 }) {
  const validation = validateCommunityPackage(bundle);
  communityAssert(!expectedSha256 || validation.packageSha256 === expectedSha256, 'package_hash_mismatch');
  communityAssert(existsSync(safeCommunityPath(root, 'COMECE-AQUI.md')), 'brain_not_recognized');
  const brainVersion = readCommunityFile(root, 'VERSION', 256).toString().trim();
  communityAssert(atLeast(brainVersion, validation.release.compatibility.minimum_brain_version), 'brain_version_incompatible');
  const refs = locations(root, bundle, validation.packageSha256);
  for (const ref of Object.values(refs)) safeCommunityPath(root, ref);
  for (const name of CONTRACT_NAMES) safeCommunityPath(root, `${refs.system}/${name}`);
  safeCommunityPath(root, `${refs.system}/manifest.md`);
  const previous = readState(root, bundle.slug);
  if (previous) {
    communityAssert(previous.package_schema_version === 2, 'existing_system_requires_migration');
    // Source bindings/customizations live outside the distributed wrapper. A changed
    // wrapper is a conflict, never permission to silently overwrite member edits.
    verifyInstalledCommunityPackage({ root, slug: bundle.slug });
  } else {
    for (const name of [...CONTRACT_NAMES, 'manifest.md']) communityAssert(!existsSync(safeCommunityPath(root, `${refs.system}/${name}`)), 'unmanaged_system_conflict');
  }
  communityPrivacyIgnore(root);
  return { schema_version: 1, action: 'install', slug: bundle.slug, system_id: bundle.system_id, version: bundle.version, package_sha256: validation.packageSha256, file_count: validation.fileCount, total_bytes: validation.totalBytes, refs, first_task: bundle.first_task, entrypoint: `${refs.bundle}/${bundle.entrypoint}`, previous_package_sha256: previous?.package_sha256 || null, same_release: previous?.package_sha256 === validation.packageSha256 && previous?.package_version === bundle.version, status: 'preview', writes: false, executes_package: false, private_workspace_preserved: true, source_bindings: 'not-connected' };
}
function treeFiles(root, prefix = '') {
  return readdirSync(join(root, prefix), { withFileTypes: true }).flatMap((entry) => {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    communityAssert(!entry.isSymbolicLink() && (entry.isDirectory() || entry.isFile()), 'unsafe_installed_file');
    return entry.isDirectory() ? treeFiles(root, name) : [name];
  });
}
export function verifyInstalledCommunityPackage({ root, slug, expectedSha256 }) {
  communityAssert(COMMUNITY_ID_RE.test(slug), 'invalid_slug');
  const state = readState(root, slug);
  communityAssert(state?.package_schema_version === 2 && COMMUNITY_SHA_RE.test(state.package_sha256), 'package_not_installed');
  const refs = locations(root, { slug, version: state.package_version }, state.package_sha256);
  const bundle = JSON.parse(readCommunityFile(root, `${refs.release}/package.json`, COMMUNITY_LIMITS.jsonBytes));
  const checked = validateCommunityPackage(bundle);
  communityAssert(bundle.slug === slug && checked.packageSha256 === state.package_sha256 && (!expectedSha256 || checked.packageSha256 === expectedSha256), 'installed_hash_mismatch');
  const bundleRoot = safeCommunityPath(root, refs.bundle);
  const names = treeFiles(bundleRoot);
  communityAssert(names.length === Object.keys(bundle.files).length, 'installed_file_mismatch');
  for (const [name, entry] of Object.entries(bundle.files)) communityAssert(communityHash(readCommunityFile(bundleRoot, name)) === entry.sha256, 'installed_file_mismatch');
  communityAssert(readCommunityFile(root, `${refs.system}/manifest.md`).toString() === installedManifestText(bundle, refs, checked.packageSha256), 'installed_wrapper_modified_conflict');
  for (const name of CONTRACT_NAMES) {
    communityAssert(readCommunityFile(root, `${refs.release}/contracts/${name}`).toString() === bundle.contracts[name], 'installed_contract_mismatch');
    communityAssert(readCommunityFile(root, `${refs.system}/${name}`).toString() === bundle.contracts[name], 'installed_contract_modified_conflict');
  }
  return { package: bundle, state, refs, package_sha256: checked.packageSha256 };
}
function installedManifestText(bundle, refs, packageSha256) {
  return `# ${bundle.title}\n\nPacote adicionado; configuração e aprovação ainda pendentes.\n\n- Versão: ${bundle.version}\n- Entrada: [${bundle.entrypoint}](releases/${bundle.version}-${packageSha256}/bundle/${bundle.entrypoint})\n- Próxima tarefa: ${bundle.first_task}\n- Workspace privado reservado: workspace/ (inicialize pelo método do pacote, após revisão).\n`;
}
export function recordCommunityInstallationReceipt({ root, slug }) {
  const installed = verifyInstalledCommunityPackage({ root, slug });
  const path = safeCommunityPath(root, installed.refs.receipt);
  const receipt = JSON.parse(readCommunityFile(root, installed.refs.receipt));
  const temporary = `${path}.${randomUUID()}`;
  try {
    writeFileSync(temporary, JSON.stringify({ ...receipt, remote_receipt: 'confirmed', confirmed_at: new Date().toISOString() }), { flag: 'wx', mode: 0o600 });
    renameSync(temporary, path);
  } finally { rmSync(temporary, { force: true }); }
}
// Files remain immutable below releases/. The state is the last transaction write.
// Rollback handles synchronous I/O failures; previous releases and workspace are never removed.
export function installCommunityPackage({ root, package: bundle, expectedSha256, confirm = false, faultInjector }) {
  communityAssert(typeof confirm === 'boolean', 'invalid_confirmation');
  const plan = planCommunityInstall({ root, package: bundle, expectedSha256 });
  if (!confirm) return plan;
  if (plan.same_release) {
    verifyInstalledCommunityPackage({ root, slug: bundle.slug, expectedSha256: plan.package_sha256 });
    return { ...plan, status: 'installed', writes: false, already_installed: true };
  }
  const parent = safeCommunityPath(root, 'sistemas/outros-instalados');
  mkdirSync(parent, { recursive: true });
  const lock = safeCommunityPath(root, `sistemas/outros-instalados/.${bundle.slug}.install.lock`);
  const stage = join(parent, `.community-stage-${randomUUID()}`);
  try { writeFileSync(lock, JSON.stringify({ pid: process.pid, created_at: new Date().toISOString(), slug: bundle.slug, package_sha256: plan.package_sha256, stage: relative(root, stage) }), { flag: 'wx', mode: 0o600 }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    let owner;
    try { owner = JSON.parse(readCommunityFile(root, `sistemas/outros-instalados/.${bundle.slug}.install.lock`, 4096)); } catch { throw new Error('installation_interrupted_review_required'); }
    try { communityAssert(Number.isInteger(owner.pid) && owner.pid > 0, 'invalid_lock'); process.kill(owner.pid, 0); }
    catch (cause) { if (cause.code !== 'EPERM') throw new Error('installation_interrupted_review_required'); }
    throw new Error('installation_in_progress');
  }
  const backups = []; let promoted = false;
  try {
    // A competing process might have changed state after preview.
    const current = readState(root, bundle.slug);
    communityAssert((current?.package_sha256 || null) === plan.previous_package_sha256, 'installation_changed_review_again');
    if (current) verifyInstalledCommunityPackage({ root, slug: bundle.slug });
    communityAssert(!current || current.package_version !== bundle.version || current.package_sha256 === plan.package_sha256, 'version_conflict');
    mkdirSync(stage, { mode: 0o700 });
    const writeStage = (name, bytes) => { const dest = safeCommunityPath(stage, name); mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, bytes, { flag: 'wx', mode: 0o600 }); };
    for (const [name, entry] of Object.entries(bundle.files)) writeStage(`bundle/${name}`, Buffer.from(entry.content, 'base64'));
    for (const name of CONTRACT_NAMES) writeStage(`contracts/${name}`, bundle.contracts[name]);
    writeStage('package.json', stableStringify(bundle));
    writeStage('installation.json', JSON.stringify({ package_sha256: plan.package_sha256, slug: bundle.slug, version: bundle.version, file_count: plan.file_count, installed_at: new Date().toISOString(), remote_receipt: 'pending', executes_package: false }));
    faultInjector?.('staged');
    const releasePath = safeCommunityPath(root, plan.refs.release);
    communityAssert(!existsSync(releasePath), 'release_directory_exists');
    mkdirSync(dirname(releasePath), { recursive: true });
    renameSync(stage, releasePath); promoted = true;
    const checked = validateCommunityPackage(bundle);
    const sources = checked.contract.sources || [];
    const state = { slug: bundle.slug, system_id: bundle.system_id, package_schema_version: 2, package_version: bundle.version, package_sha256: plan.package_sha256, status: 'package_added', release_channel: checked.release.channel, validation_stage: checked.release.publication.status, capability: { capability_id: checked.capability.capability_id, version: checked.capability.version, origin: 'inevita' }, source_bindings: { total_roles: sources.length, required_roles: sources.filter((source) => source.required).length, ready_roles: 0, status: sources.length ? 'unbound' : 'not-required' }, bundle_ref: plan.refs.bundle, workspace_ref: plan.refs.workspace, package_ref: `${plan.refs.release}/package.json`, first_task: bundle.first_task, updated_at: new Date().toISOString() };
    const privacy = communityPrivacyIgnore(root);
    const writes = CONTRACT_NAMES.map((name) => [`${plan.refs.system}/${name}`, bundle.contracts[name]]);
    writes.push([`${plan.refs.system}/manifest.md`, installedManifestText(bundle, plan.refs, plan.package_sha256)]);
    if (privacy.changed) writes.push(['.gitignore', privacy.content]);
    writes.push([plan.refs.state, `${JSON.stringify(state, null, 2)}\n`]);
    for (const [ref, bytes] of writes) {
      const dest = safeCommunityPath(root, ref);
      communityAssert(!existsSync(dest) || lstatSync(dest).isFile(), 'unsafe_target');
      backups.push([dest, existsSync(dest) ? readFileSync(dest) : null]);
      mkdirSync(dirname(dest), { recursive: true });
      const temp = `${dest}.community-${randomUUID()}`;
      try { writeFileSync(temp, bytes, { flag: 'wx', mode: 0o600 }); renameSync(temp, dest); }
      finally { rmSync(temp, { force: true }); }
      faultInjector?.(ref);
    }
    return { ...plan, status: 'installed', writes: true, already_installed: false };
  } catch (error) {
    for (const [dest, before] of backups.reverse()) { if (before === null) rmSync(dest, { force: true }); else writeFileSync(dest, before, { mode: 0o600 }); }
    if (promoted) rmSync(safeCommunityPath(root, plan.refs.release), { recursive: true, force: true });
    throw error;
  } finally { rmSync(stage, { recursive: true, force: true }); rmSync(lock, { force: true }); }
}
export async function installCommunityRelease({ root, slug, client, confirm = false, expectedSha256, runtime = 'codex' }) {
  communityAssert(typeof confirm === 'boolean', 'invalid_confirmation');
  communityAssert(typeof slug === 'string' && COMMUNITY_ID_RE.test(slug), 'invalid_slug');
  const metadata = await client.getRelease({ slug });
  const release = metadata.release;
  communityAssert(release?.slug === slug && COMMUNITY_SHA_RE.test(release.package_sha256), 'invalid_release');
  if (expectedSha256) communityAssert(expectedSha256 === release.package_sha256, 'release_changed');
  if (!confirm) return { status: 'preview', writes: false, grant_consumed: false, release };
  communityAssert(COMMUNITY_SHA_RE.test(expectedSha256 || ''), 'reviewed_hash_required');
  const grant = await client.issueGrant({ slug });
  if (grant.release?.package_sha256) communityAssert(grant.release.package_sha256 === expectedSha256, 'release_changed');
  const response = await client.redeemGrant({ grant_token: grant.grant_token });
  const envelope = await client.resolvePackage(response);
  communityAssert(envelope.package?.slug === slug, 'package_slug_mismatch');
  const installed = envelope.package.schema_version === 1
    ? (await import('../install-system.mjs')).installLegacyCommunityPackage({ root, package: envelope.package, expectedSha256, confirm: true, distributionAuthorized: true })
    : installCommunityPackage({ root, package: envelope.package, expectedSha256, confirm: true });
  try { await client.installationReceipt({ grant_token: grant.grant_token, runtime }); if (envelope.package.schema_version === 2) recordCommunityInstallationReceipt({ root, slug }); return { ...installed, remote_receipt: 'confirmed' }; }
  catch { return { ...installed, remote_receipt: 'pending', recovery: 'repeat_install_for_current_release' }; }
}
