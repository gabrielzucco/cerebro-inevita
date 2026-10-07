#!/usr/bin/env node
// deno-lint-ignore-file require-await
// The remote-client fake deliberately resolves without network or an extra await.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildFunilCommunityPackage, funilContracts } from './build-funil-community-package.mjs';
import { approveContribution, prepareReleaseContribution, reviewContributionCandidate, sendContribution } from './lib/community-contribution.mjs';
import { communityHash, encodeCommunityFile, hashCommunityPackage, stableStringify } from './lib/community-package.mjs';
import { runStageReleaseCommand } from './stage-community-release.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fullSource = process.argv.find(arg => arg.startsWith('--funil='))?.slice(8);
function packet() {
  if (fullSource) return buildFunilCommunityPackage({ sourceDir: fullSource });
  const files = { 'COMECE-AQUI.md': encodeCommunityFile(Buffer.from('# Synthetic release')) };
  for (let index = 1; index < 99; index++) files[`metodo/regra-${index}.md`] = encodeCommunityFile(Buffer.from(`Synthetic rule ${index}`));
  return { schema_version: 2, slug: 'funil-e-crescimento', system_id: 'sistema-funil-inevita', version: '0.2.0-rc.1', title: 'Funil',
    entrypoint: 'COMECE-AQUI.md', first_task: 'Revisar contexto autorizado', files, contracts: funilContracts('0.2.0-rc.1') };
}
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'community original '));
  mkdirSync(join(root, 'entregas'));
  writeFileSync(join(root, 'COMECE-AQUI.md'), '# Synthetic Brain');
  writeFileSync(join(root, 'VERSION'), '1.39.0');
  writeFileSync(join(root, 'privado.txt'), 'PRIVATE_SENTINEL_NOT_SELECTED');
  // The submission boundary is JSON; object prototypes are not package bytes.
  const bundle = JSON.parse(JSON.stringify(packet()));
  writeFileSync(join(root, 'entregas/original.json'), JSON.stringify(bundle, null, 2));
  return { root, bundle, args: { root, packageRef: 'entregas/original.json', summary: 'Pacote original para revisão independente.' }, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
function snapshot(root, prefix = '') {
  return readdirSync(join(root, prefix), { withFileTypes: true }).flatMap(entry => {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? snapshot(root, name) : [`${name}:${communityHash(readFileSync(join(root, name)))}`];
  }).sort();
}

test('original release preview writes nothing; staging preserves all 99 files and the exact envelope hash', () => {
  const f = fixture();
  try {
    const before = snapshot(f.root);
    const preview = prepareReleaseContribution(f.args);
    assert.equal(preview.status, 'preview'); assert.equal(preview.writes, false); assert.equal(preview.sent, false);
    assert.equal(preview.file_count, 99); assert.equal(preview.package_sha256, hashCommunityPackage(f.bundle));
    assert.deepEqual(snapshot(f.root), before);
    const staged = prepareReleaseContribution({ ...f.args, confirm: true });
    assert.equal(staged.status, 'prepared'); assert.equal(staged.published, false);
    assert.equal(staged.package_sha256, preview.package_sha256);
    const saved = JSON.parse(readFileSync(join(f.root, staged.package_ref)));
    assert.deepEqual(saved, f.bundle); assert.equal(stableStringify(saved), stableStringify(f.bundle));
    assert.equal(readFileSync(join(f.root, staged.package_ref), 'utf8').includes('PRIVATE_SENTINEL_NOT_SELECTED'), false);
    for (const [path, value] of Object.entries(saved.files)) assert.deepEqual(value, f.bundle.files[path]);
    const reviewed = reviewContributionCandidate({ root: f.root, candidateId: staged.candidate_id });
    assert.equal(reviewed.status, 'prepared'); assert.equal(reviewed.kind, 'original-release');
    assert.equal(reviewed.files.length, 99); assert.deepEqual(reviewed.generated_paths, []); assert.deepEqual(reviewed.changes, []);
    const directory = dirname(join(f.root, staged.package_ref));
    assert.equal(existsSync(join(directory, 'approval.json')), false); assert.equal(existsSync(join(directory, 'submission.json')), false);
    assert.equal(communityHash(readFileSync(join(f.root, 'entregas/original.json'))), before.find(line => line.startsWith('entregas/original.json:')).split(':').at(-1));
  } finally { f.cleanup(); }
});

test('approval and send are separate; a new staging never inherits prior consent or remote status', async () => {
  const f = fixture(); let sends = 0;
  const client = { submitContribution: async payload => { sends++; assert.deepEqual(payload.package, f.bundle); assert.equal(payload.share_confirmed, true);
    return { contribution: { id: 'synthetic-remote', status: 'submitted', package_sha256: payload.package_sha256 } }; } };
  try {
    const staged = prepareReleaseContribution({ ...f.args, confirm: true });
    const consent = { root: f.root, candidateId: staged.candidate_id, packageSha256: staged.package_sha256 };
    await assert.rejects(sendContribution({ ...consent, client, confirm: true }), /approval_required/);
    approveContribution(consent); await assert.rejects(sendContribution({ ...consent, client, confirm: true }), /approval_required/);
    assert.equal(sends, 0);
    approveContribution({ ...consent, confirm: true });
    assert.equal((await sendContribution({ ...consent, client })).sent, false); assert.equal(sends, 0);
    assert.equal((await sendContribution({ ...consent, client, confirm: true })).status, 'submitted'); assert.equal(sends, 1);
    const second = prepareReleaseContribution({ ...f.args, confirm: true });
    assert.notEqual(second.candidate_id, staged.candidate_id); assert.equal(second.package_sha256, staged.package_sha256);
    assert.equal(reviewContributionCandidate({ root: f.root, candidateId: second.candidate_id }).status, 'prepared');
    const secondConsent = { root: f.root, candidateId: second.candidate_id, packageSha256: second.package_sha256 };
    await assert.rejects(sendContribution({ ...secondConsent, client, confirm: true }), /approval_required/);
    const copiedApproval = JSON.parse(readFileSync(join(dirname(join(f.root, staged.package_ref)), 'approval.json')));
    writeFileSync(join(dirname(join(f.root, second.package_ref)), 'approval.json'), JSON.stringify(copiedApproval));
    await assert.rejects(sendContribution({ ...secondConsent, client, confirm: true }), /approval_consent_invalid/);
    assert.throws(() => reviewContributionCandidate({ root: f.root, candidateId: second.candidate_id }), /approval_consent_invalid/);
    approveContribution({ ...secondConsent, confirm: true });
    const copiedReceipt = readFileSync(join(dirname(join(f.root, staged.package_ref)), 'submission.json'));
    writeFileSync(join(dirname(join(f.root, second.package_ref)), 'submission.json'), copiedReceipt);
    assert.throws(() => reviewContributionCandidate({ root: f.root, candidateId: second.candidate_id }), /submission_record_mismatch/);
    assert.equal(sends, 1);
  } finally { f.cleanup(); }
});

test('local review derives status only from valid exact approval and submission records without writes or network', async () => {
  const f = fixture(); let sends = 0;
  try {
    const staged = prepareReleaseContribution({ ...f.args, confirm: true });
    const consent = { root: f.root, candidateId: staged.candidate_id, packageSha256: staged.package_sha256 };
    const review = () => reviewContributionCandidate({ root: f.root, candidateId: staged.candidate_id });
    const directory = dirname(join(f.root, staged.package_ref));
    const approvalPath = join(directory, 'approval.json'), receiptPath = join(directory, 'submission.json');
    assert.equal(review().status, 'prepared');
    approveContribution({ ...consent, confirm: true });
    const approvalBytes = readFileSync(approvalPath), approval = JSON.parse(approvalBytes);
    assert.equal(review().status, 'approved_for_submission');
    for (const patch of [
      { candidate_id: 'another-candidate' }, { package_sha256: '0'.repeat(64) },
      { summary: 'Unreviewed summary' }, { consent: 'not-approved' }, { approved_at: 'invalid' },
    ]) {
      writeFileSync(approvalPath, JSON.stringify({ ...approval, ...patch }));
      const before = snapshot(f.root);
      assert.throws(review, /approval_/); assert.deepEqual(snapshot(f.root), before);
    }
    writeFileSync(approvalPath, '{PRIVATE_SENTINEL_INVALID_APPROVAL');
    assert.throws(review, error => error.message === 'invalid_approval_record');
    writeFileSync(approvalPath, approvalBytes);
    const client = { submitContribution: async payload => { sends++;
      return { contribution: { id: 'synthetic-remote', status: 'submitted', package_sha256: payload.package_sha256 } }; } };
    await sendContribution({ ...consent, client, confirm: true });
    const receiptBytes = readFileSync(receiptPath), receipt = JSON.parse(receiptBytes);
    assert.equal(review().status, 'submitted');
    for (const patch of [
      { candidate_id: 'another-candidate' }, { package_sha256: '0'.repeat(64) },
      { contribution: { ...receipt.contribution, package_sha256: '0'.repeat(64) } },
      { contribution: { ...receipt.contribution, id: '' } }, { submitted_at: 'invalid' },
    ]) {
      writeFileSync(receiptPath, JSON.stringify({ ...receipt, ...patch }));
      const before = snapshot(f.root);
      assert.throws(review, /submission_/); assert.deepEqual(snapshot(f.root), before);
    }
    for (const invalid of ['{PRIVATE_SENTINEL_INVALID_RECEIPT', 'x'.repeat(16 * 1024 + 1)]) {
      writeFileSync(receiptPath, invalid);
      assert.throws(review, error => error.message === 'invalid_submission_record');
    }
    writeFileSync(receiptPath, receiptBytes); rmSync(approvalPath);
    assert.throws(review, /submission_without_approval/);
    writeFileSync(approvalPath, approvalBytes);
    const before = snapshot(f.root);
    assert.equal(review().status, 'submitted'); assert.equal(sends, 1);
    assert.deepEqual(snapshot(f.root), before);
  } finally { f.cleanup(); }
});

test('invalid packages and inherited publication, evidence, external permissions or private bindings are refused without writes', () => {
  const f = fixture();
  try {
    const mutations = [
      p => { p.approval = { status: 'approved' }; },
      p => { p.files['COMECE-AQUI.md'].sha256 = '0'.repeat(64); },
      p => { p.files['.env'] = p.files['COMECE-AQUI.md']; },
      p => { const v = JSON.parse(p.contracts['manifest.json']); v.publication.status = 'published'; p.contracts['manifest.json'] = JSON.stringify(v); },
      p => { const v = JSON.parse(p.contracts['contract.json']); v.status = 'active'; p.contracts['contract.json'] = JSON.stringify(v); },
      ...['manifest.json', 'release.json'].flatMap(name => ['verified_real_cycles', 'verified_distinct_member_brains'].map(key => p => {
        const v = JSON.parse(p.contracts[name]); v.validation[key] = 1; p.contracts[name] = JSON.stringify(v);
      })),
      p => { const v = JSON.parse(p.contracts['release.json']); v.publication.access_mode = 'approved-participants'; p.contracts['release.json'] = JSON.stringify(v); },
      p => { const v = JSON.parse(p.contracts['manifest.json']); v.permissions.connects_sources_automatically = true; p.contracts['manifest.json'] = JSON.stringify(v); },
      p => { const v = JSON.parse(p.contracts['capability.json']); v.permissions.external_actions = true; p.contracts['capability.json'] = JSON.stringify(v); },
      p => { const v = JSON.parse(p.contracts['contract.json']); v.sources[0].source_id = 'private-source'; p.contracts['contract.json'] = JSON.stringify(v); },
    ];
    for (const mutate of mutations) {
      const bundle = structuredClone(f.bundle); mutate(bundle);
      writeFileSync(join(f.root, 'entregas/original.json'), JSON.stringify(bundle));
      const before = snapshot(f.root);
      assert.throws(() => prepareReleaseContribution({ ...f.args, confirm: true }));
      assert.deepEqual(snapshot(f.root), before);
    }
    writeFileSync(join(f.root, 'entregas/original.json'), '{invalid');
    assert.throws(() => prepareReleaseContribution(f.args), /invalid_release_package_json/);
    assert.throws(() => prepareReleaseContribution({ ...f.args, packageRef: '../outside.json' }), /unsafe_path/);
    assert.throws(() => prepareReleaseContribution({ ...f.args, confirm: 'true' }), /invalid_confirmation/);
  } finally { f.cleanup(); }
});

test('CLI previews without network or identity and runs through a symlinked parent directory', () => {
  const f = fixture();
  const alias = join(f.root, 'client'); symlinkSync(ROOT, alias, 'junction');
  try {
    const args = ['--package=entregas/original.json', '--summary=Pacote original'];
    const result = spawnSync(process.execPath, [join(alias, 'scripts/stage-community-release.mjs'), ...args], {
      env: { ...process.env, CEREBRO_INSTALL_ROOT: f.root, CEREBRO_DISTRIBUTION_URL: 'invalid-network-must-not-be-used' }, encoding: 'utf8', timeout: 10000,
    });
    assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).writes, false);
    assert.equal(existsSync(join(f.root, 'comunidade')), false);
    assert.throws(() => runStageReleaseCommand({ root: f.root, args: [...args, '--confirm=true'] }), /invalid_stage_release_arguments/);
    assert.throws(() => runStageReleaseCommand({ root: f.root, args: [...args, '--package=duplicate.json'] }), /invalid_stage_release_arguments/);
    assert.ok(runStageReleaseCommand({ root: f.root, args: ['--help'] }).help.includes('stage-release'));
  } finally { f.cleanup(); }
});
