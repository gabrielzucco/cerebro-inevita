import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { COMMUNITY_LIMITS, COMMUNITY_SHA_RE, communityPrivacyIgnore, communityAssert, safeCommunityName, safeCommunityPath, readCommunityFile, encodeCommunityFile, validateCommunityPackage, hashCommunityPackage, stableStringify, verifyInstalledCommunityPackage } from './community-package.mjs';

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const PREFIX = 'comunidade/minhas-contribuicoes/propostas';
const GENERATED = new Set(['manifest.json', 'INVENTARIO.json', 'PROVENIENCIA.json']);
function candidateRoot(root, id) { communityAssert(UUID_RE.test(id || ''), 'invalid_candidate_id'); return safeCommunityPath(root, `${PREFIX}/${id}`); }
function jsonBytes(value) { return Buffer.from(`${JSON.stringify(value, null, 2)}\n`); }
function recordAtomic(path, data) {
  const temp = `${path}.${randomUUID()}`;
  try { writeFileSync(temp, jsonBytes(data), { flag: 'wx', mode: 0o600 }); renameSync(temp, path); }
  finally { rmSync(temp, { force: true }); }
}
function selectedSource(root, sourceDir) {
  communityAssert(typeof sourceDir === 'string' && sourceDir.length, 'source_directory_required');
  const ref = relative(resolve(root), resolve(root, sourceDir)).split('\\').join('/');
  // All reads are scoped to this member's Brain; no arbitrary machine path from MCP.
  return safeCommunityPath(root, ref);
}
function obviousSensitive(text) {
  return /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk-[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{30,}\.)|(?:install_credential|grant_token|api_key|password)\s*["']?\s*[:=]\s*["']?[A-Za-z0-9_-]{16,}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/i.test(text);
}
function loadBase({ root, basePackage, slug }) {
  if (slug) return verifyInstalledCommunityPackage({ root, slug }).package;
  if (typeof basePackage === 'string') return JSON.parse(readCommunityFile(root, basePackage, COMMUNITY_LIMITS.jsonBytes));
  communityAssert(basePackage && typeof basePackage === 'object', 'base_package_required');
  return basePackage;
}
function bumpMetadata(bundle, version) {
  bundle.version = version;
  for (const name of ['manifest.json', 'release.json', 'contract.json']) {
    const value = JSON.parse(bundle.contracts[name]);
    if (name === 'manifest.json') {
      value.release.version = version; value.release.channel = 'pilot';
      Object.assign(value.validation, { stage: 'pilot', listed: false, validation_lab_visible: true, verified_real_cycles: 0, verified_distinct_member_brains: 0 });
      Object.assign(value.publication, { status: 'pilot', public_catalog: false, validation_lab: true });
    } else value.version = version;
    if (name === 'contract.json') value.status = 'proposed';
    if (name === 'release.json') {
      value.channel = 'pilot'; value.publication.status = 'pilot'; value.publication.catalog_visibility = 'validation-lab';
      value.validation.verified_real_cycles = 0; value.validation.verified_distinct_member_brains = 0;
    }
    if (name === 'release.json') value.release_id = `${bundle.slug.slice(0, 32)}-${version.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}`.slice(0, 64);
    bundle.contracts[name] = jsonBytes(value).toString();
  }
  // Funil keeps its original kit intact. Only release metadata and inventory are regenerated.
  if (bundle.system_id === 'sistema-funil-inevita' && bundle.files['INVENTARIO.json']) {
    // The RC's checker pins its engine version. Distribution version lives in the
    // envelope/contracts; never silently patch executable code or its engine manifest.
    const inventory = JSON.parse(Buffer.from(bundle.files['INVENTARIO.json'].content, 'base64'));
    inventory.files = Object.keys(bundle.files).filter((name) => name !== 'INVENTARIO.json').sort().map((path) => ({ path, bytes: bundle.files[path].bytes, sha256: bundle.files[path].sha256 }));
    bundle.files['INVENTARIO.json'] = encodeCommunityFile(jsonBytes(inventory));
  }
}
function requireSubmissionPolicy({ manifest, release, contract, capability }) {
  communityAssert(manifest.release.channel === 'pilot' && manifest.validation.stage === 'pilot'
    && manifest.validation.listed === false && manifest.validation.validation_lab_visible === true
    && ['public', 'society_members'].includes(manifest.validation.access_mode)
    && manifest.validation.application_required === false && manifest.publication.status === 'pilot'
    && manifest.publication.public_catalog === false && manifest.publication.validation_lab === true
    && release.channel === 'pilot' && release.publication.status === 'pilot'
    && release.publication.catalog_visibility === 'validation-lab' && release.publication.access_mode === 'public'
    && release.publication.application_required === false && contract.status === 'proposed', 'submission_requires_unpublished_pilot');
  for (const validation of [manifest.validation, release.validation]) {
    communityAssert(validation.verified_real_cycles === 0 && validation.verified_distinct_member_brains === 0,
      'submission_requires_zero_evidence');
    communityAssert(validation.requires_repeat_use === true && validation.requires_eval_pass === true
      && validation.requires_human_approval === true, 'submission_requires_human_review');
  }
  communityAssert(contract.protocol_version === 1 && capability.protocol_version === 1
    && manifest.permissions.connects_sources_automatically === false
    && manifest.permissions.writes_external_systems_automatically === false
    && manifest.permissions.requires_source_by_source_consent === true
    && manifest.requirements.human_approval_before_external_write === true
    && contract.permissions.external_actions === false && capability.permissions.external_actions === false,
  'submission_permissions_unsupported');
  communityAssert(contract.sources.every(source => source.source_id === null || source.source_id === undefined),
    'private_source_binding_forbidden');
}
function stageCandidate({ root, bundle, metadata, confirm }) {
  if (!confirm) return { ...metadata, status: 'preview', writes: false, sent: false, published: false };
  const privacy = communityPrivacyIgnore(root);
  const dir = candidateRoot(root, metadata.candidate_id); mkdirSync(dirname(dir), { recursive: true });
  const stage = `${dir}.stage`; mkdirSync(stage, { mode: 0o700 });
  try {
    writeFileSync(`${stage}/package.json`, stableStringify(bundle), { flag: 'wx', mode: 0o600 });
    writeFileSync(`${stage}/candidate.json`, jsonBytes(metadata), { flag: 'wx', mode: 0o600 });
    if (privacy.changed) writeFileSync(privacy.path, privacy.content, { mode: 0o600 });
    renameSync(stage, dir);
  } finally { rmSync(stage, { recursive: true, force: true }); }
  return { ...metadata, writes: true, sent: false, published: false, package_ref: `${PREFIX}/${metadata.candidate_id}/package.json` };
}
// Stage the complete, explicitly selected release envelope without deriving a
// new version or changing bundle bytes, contracts or the canonical hash. Consent is recorded later by
// the same review → approve → send services used for member improvements.
export function prepareReleaseContribution({ root, packageRef, summary, confirm = false }) {
  communityAssert(typeof confirm === 'boolean', 'invalid_confirmation');
  communityAssert(typeof packageRef === 'string' && packageRef.length > 0, 'package_reference_required');
  communityAssert(typeof summary === 'string' && summary.trim() && summary.length <= 2000
    && !obviousSensitive(summary), 'invalid_or_sensitive_summary');
  const bytes = readCommunityFile(root, packageRef, COMMUNITY_LIMITS.jsonBytes);
  let bundle;
  try { bundle = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new Error('invalid_release_package_json'); }
  const checked = validateCommunityPackage(bundle);
  requireSubmissionPolicy(checked);
  const metadata = { schema_version: 1, kind: 'original-release', candidate_id: randomUUID(), status: 'prepared',
    slug: bundle.slug, system_id: bundle.system_id, version: bundle.version, title: bundle.title,
    summary: summary.trim(), package_sha256: checked.packageSha256, base_package_sha256: null,
    selected_paths: Object.keys(bundle.files).sort(), generated_paths: [], changes: [],
    file_count: checked.fileCount, total_bytes: checked.totalBytes, created_at: new Date().toISOString(), content_review_required: true };
  return stageCandidate({ root, bundle, metadata, confirm });
}
export function prepareContribution({ root, basePackage, slug, sourceDir, selectedPaths, version, summary, confirm = false }) {
  communityAssert(typeof confirm === 'boolean', 'invalid_confirmation');
  const base = loadBase({ root, basePackage, slug }); validateCommunityPackage(base);
  communityAssert(Array.isArray(selectedPaths) && selectedPaths.length > 0 && selectedPaths.length <= COMMUNITY_LIMITS.files && new Set(selectedPaths).size === selectedPaths.length, 'explicit_selection_required');
  communityAssert(typeof summary === 'string' && summary.trim() && summary.length <= 2000 && !obviousSensitive(summary), 'invalid_or_sensitive_summary');
  communityAssert(typeof version === 'string' && version !== base.version, 'new_version_required');
  const source = selectedSource(root, sourceDir);
  const bundle = structuredClone(base); const changes = [];
  for (const name of selectedPaths) {
    safeCommunityName(name);
    communityAssert(Object.hasOwn(base.files, name) && !GENERATED.has(name) && !name.startsWith('originais/') && !(base.system_id === 'sistema-funil-inevita' && name.startsWith('copy/')), 'path_not_shareable');
    communityAssert(!name.split('/').some((part) => /^(?:\.env(?:\..*)?|\.cerebro|\.git|workspace|privado|capturas|contexto|pecas|dados)$/i.test(part)), 'private_selection_refused');
    const bytes = readCommunityFile(source, name);
    communityAssert(!obviousSensitive(bytes.toString('utf8')), 'sensitive_content_requires_redaction');
    const entry = encodeCommunityFile(bytes);
    communityAssert(entry.sha256 !== base.files[name].sha256, 'selection_has_no_change');
    bundle.files[name] = entry;
    changes.push({ path: name, before_sha256: base.files[name].sha256, after_sha256: entry.sha256, bytes: entry.bytes });
  }
  bumpMetadata(bundle, version);
  bundle.provenance = { base_package_sha256: hashCommunityPackage(base), source: 'member-selected-public-method-patches', changes: selectedPaths.join(', ') };
  const validated = validateCommunityPackage(bundle);
  requireSubmissionPolicy(validated);
  const metadata = { schema_version: 1, candidate_id: randomUUID(), status: 'prepared', slug: bundle.slug, system_id: bundle.system_id, version, title: bundle.title, summary: summary.trim(), package_sha256: validated.packageSha256, base_package_sha256: hashCommunityPackage(base), selected_paths: [...selectedPaths], generated_paths: Object.keys(bundle.files).filter((name) => !selectedPaths.includes(name) && bundle.files[name].sha256 !== base.files[name]?.sha256), changes, file_count: validated.fileCount, total_bytes: validated.totalBytes, created_at: new Date().toISOString(), content_review_required: true };
  return stageCandidate({ root, bundle, metadata, confirm });
}
export function getPreparedContribution({ root, candidateId }) {
  const dir = candidateRoot(root, candidateId);
  const metadata = JSON.parse(readCommunityFile(dir, 'candidate.json', COMMUNITY_LIMITS.jsonBytes));
  const bundle = JSON.parse(readCommunityFile(dir, 'package.json', COMMUNITY_LIMITS.jsonBytes));
  const checked = validateCommunityPackage(bundle);
  requireSubmissionPolicy(checked);
  communityAssert(metadata.candidate_id === candidateId && metadata.package_sha256 === checked.packageSha256 && metadata.slug === bundle.slug && metadata.version === bundle.version, 'candidate_hash_mismatch');
  communityAssert(typeof metadata.summary === 'string' && metadata.summary.length <= 2000 && !obviousSensitive(metadata.summary), 'invalid_or_sensitive_summary');
  return { metadata, package: bundle, directory: dir };
}
function readCandidateRecord(directory, name, errorCode) {
  try {
    if (!existsSync(safeCommunityPath(directory, name))) return null;
    const value = JSON.parse(readCommunityFile(directory, name, 16 * 1024));
    communityAssert(value && typeof value === 'object' && !Array.isArray(value), errorCode);
    return value;
  } catch { throw new Error(errorCode); }
}
function readCandidateApproval(candidate, required = false) {
  const approval = readCandidateRecord(candidate.directory, 'approval.json', 'invalid_approval_record');
  if (!approval) {
    communityAssert(!required, 'approval_required');
    return null;
  }
  const { metadata } = candidate;
  communityAssert(approval.candidate_id === metadata.candidate_id && approval.consent === 'explicit-approval-for-submission', 'approval_consent_invalid');
  communityAssert(approval.package_sha256 === metadata.package_sha256 && approval.summary === metadata.summary, 'approval_hash_mismatch');
  communityAssert(typeof approval.approved_at === 'string' && Number.isFinite(Date.parse(approval.approved_at)), 'invalid_approval_record');
  return approval;
}
function readCandidateSubmission(candidate, approval) {
  const receipt = readCandidateRecord(candidate.directory, 'submission.json', 'invalid_submission_record');
  if (!receipt) return null;
  const { metadata } = candidate;
  communityAssert(receipt.candidate_id === metadata.candidate_id && receipt.package_sha256 === metadata.package_sha256
    && receipt.contribution?.package_sha256 === metadata.package_sha256, 'submission_record_mismatch');
  communityAssert(typeof receipt.contribution?.id === 'string' && receipt.contribution.id.trim().length > 0
    && typeof receipt.submitted_at === 'string' && Number.isFinite(Date.parse(receipt.submitted_at)), 'invalid_submission_record');
  communityAssert(approval, 'submission_without_approval');
  return receipt;
}
export function reviewContributionCandidate({ root, candidateId }) {
  const candidate = getPreparedContribution({ root, candidateId });
  const { metadata, package: bundle } = candidate;
  const approved = readCandidateApproval(candidate);
  const sent = readCandidateSubmission(candidate, approved);
  return { ...metadata, status: sent ? 'submitted' : approved ? 'approved_for_submission' : 'prepared', files: Object.entries(bundle.files).map(([path, entry]) => ({ path, sha256: entry.sha256, bytes: entry.bytes })), contracts: Object.keys(bundle.contracts), package_ref: `${PREFIX}/${candidateId}/package.json`, risks: ['Revise o conteúdo completo do payload local; detecção automática não garante ausência de informação privada.', 'Aprovação local autoriza este hash para envio, não publicação nem validação de mercado.'], writes: false };
}
export function approveContribution({ root, candidateId, packageSha256, confirm = false }) {
  communityAssert(typeof confirm === 'boolean', 'invalid_confirmation');
  const candidate = getPreparedContribution({ root, candidateId });
  communityAssert(COMMUNITY_SHA_RE.test(packageSha256 || '') && candidate.metadata.package_sha256 === packageSha256, 'candidate_hash_mismatch');
  if (!confirm) return { candidate_id: candidateId, package_sha256: packageSha256, status: 'approval_preview', writes: false };
  const approval = { candidate_id: candidateId, package_sha256: packageSha256, summary: candidate.metadata.summary, consent: 'explicit-approval-for-submission', approved_at: new Date().toISOString() };
  recordAtomic(safeCommunityPath(candidate.directory, 'approval.json'), approval);
  return { candidate_id: candidateId, package_sha256: packageSha256, status: 'approved_for_submission', writes: true, sent: false };
}
export async function sendContribution({ root, candidateId, packageSha256, client, confirm = false }) {
  communityAssert(typeof confirm === 'boolean', 'invalid_confirmation');
  const candidate = getPreparedContribution({ root, candidateId });
  communityAssert(COMMUNITY_SHA_RE.test(packageSha256 || '') && candidate.metadata.package_sha256 === packageSha256, 'candidate_hash_mismatch');
  readCandidateApproval(candidate, true);
  if (!confirm) return { candidate_id: candidateId, package_sha256: packageSha256, status: 'send_preview', sent: false, writes: false };
  const response = await client.submitContribution({ package: candidate.package, package_sha256: packageSha256, idempotency_key: candidateId, summary: candidate.metadata.summary, share_confirmed: true });
  communityAssert(response.contribution?.package_sha256 === packageSha256, 'submission_hash_mismatch');
  const receipt = { candidate_id: candidateId, package_sha256: packageSha256, contribution: response.contribution, submitted_at: new Date().toISOString() };
  recordAtomic(safeCommunityPath(candidate.directory, 'submission.json'), receipt);
  return { ...receipt, status: 'submitted', sent: true, writes: true, published: false };
}
