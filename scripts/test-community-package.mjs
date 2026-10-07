#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createCommunityClient } from './lib/community-client.mjs';
import { prepareContribution, approveContribution, sendContribution, reviewContributionCandidate } from './lib/community-contribution.mjs';
import { communityHash, encodeCommunityFile, hashCommunityPackage, validateCommunityPackage, installCommunityPackage, verifyInstalledCommunityPackage, installCommunityRelease } from './lib/community-package.mjs';
import { funilContracts, buildFunilCommunityPackage } from './build-funil-community-package.mjs';

const temp = mkdtempSync(join(tmpdir(), 'community-cs1-'));
const write = (root, path, content) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), content); };
function brain(name) {
  const root = join(temp, name); mkdirSync(root);
  write(root, 'COMECE-AQUI.md', '# Brain'); write(root, 'VERSION', '1.39.0');
  write(root, '.cerebro/id', '3f2504e0-4f89-41d3-9a0c-0305e82c3301'); write(root, '.cerebro/install-credential', 'a'.repeat(43));
  return root;
}
function snapshot(root, prefix = '') {
  return readdirSync(join(root, prefix), { withFileTypes: true }).flatMap((entry) => {
    const ref = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? snapshot(root, ref) : [`${ref}:${communityHash(readFileSync(join(root, ref)))}`];
  }).sort();
}
const packet = () => ({ schema_version: 2, slug: 'funil-e-crescimento', system_id: 'sistema-funil-inevita', version: '0.2.0-rc.1', title: 'Funil e Crescimento', entrypoint: 'COMECE-AQUI.md', first_task: 'Revisar o contexto autorizado', files: { 'COMECE-AQUI.md': encodeCommunityFile(Buffer.from('# Comece')), 'metodo/oferta.md': encodeCommunityFile(Buffer.from('Use o contexto anterior.')), 'originais/binary.zip': encodeCommunityFile(Buffer.from([0, 255, 22, 12])) }, contracts: funilContracts('0.2.0-rc.1') });
function invalid(mutator, code) { const bundle = packet(); mutator(bundle); assert.throws(() => validateCommunityPackage(bundle), code); }
let checks = 0;
try {
  const a = brain('A'); const b = brain('B'); let bundle = packet();
  assert.equal(validateCommunityPackage(bundle).fileCount, 3); checks++;
  for (const name of ['../secret', '/tmp/secret', 'a\\b', '.env', '.git/config', 'x/../y', 'a\u0000b', 'foo:', 'CON.txt']) invalid((p) => { p.files[name] = p.files['COMECE-AQUI.md']; }, /path/);
  invalid((p) => { p.files['comece-aqui.md'] = p.files['COMECE-AQUI.md']; }, /collision/);
  invalid((p) => { p.files['DIR/a'] = p.files['COMECE-AQUI.md']; p.files['dir/b'] = p.files['COMECE-AQUI.md']; }, /collision/);
  invalid((p) => { p.files.metodo = p.files['COMECE-AQUI.md']; }, /ancestor/);
  invalid((p) => { p.files['COMECE-AQUI.md'].content += ' '; }, /mismatch/);
  invalid((p) => { p.files['COMECE-AQUI.md'].bytes = 1048577; }, /encoding/);
  invalid((p) => { for (let i = 0; i < 513; i++) p.files[`extra-${i}`] = p.files['COMECE-AQUI.md']; }, /count/);
  invalid((p) => { for (let i = 0; i < 4; i++) p.files[`large-${i}`] = encodeCommunityFile(Buffer.alloc(1048576)); }, /large/);
  invalid((p) => { p.install_credential = 'secret'; }, /fields/); checks++;
  write(a, 'VERSION', '1.38.0');
  const oldClient = snapshot(a);
  assert.throws(() => installCommunityPackage({ root: a, package: bundle, confirm: true }), /brain_version_incompatible/);
  assert.deepEqual(snapshot(a), oldClient); write(a, 'VERSION', '1.39.0'); checks++;
  const before = snapshot(a);
  assert.equal(installCommunityPackage({ root: a, package: bundle }).status, 'preview');
  assert.deepEqual(snapshot(a), before); checks++;
  // An apply failure after changing a wrapper rolls it back and leaves no release/state.
  assert.throws(() => installCommunityPackage({ root: a, package: bundle, confirm: true, faultInjector: (step) => { if (step.endsWith('/manifest.json')) throw new Error('injected_io_failure'); } }), /injected/);
  assert.deepEqual(snapshot(a), before); checks++;
  const result = installCommunityPackage({ root: a, package: bundle, confirm: true });
  assert.equal(result.status, 'installed'); assert.equal(result.file_count, 3);
  verifyInstalledCommunityPackage({ root: a, slug: bundle.slug });
  assert.equal(existsSync(join(a, '.agents/skills')), false);
  write(a, `${result.refs.workspace}/contexto/segredo.md`, 'PRIVATE_SENTINEL_A');
  write(a, 'AGENTS.md', 'OWNER_GLOBAL_INSTRUCTIONS');
  const firstSnapshot = snapshot(a);
  assert.equal(installCommunityPackage({ root: a, package: bundle, confirm: true }).already_installed, true);
  assert.deepEqual(snapshot(a), firstSnapshot); checks++;
  const source = `${result.refs.workspace}`;
  write(a, `${source}/metodo/oferta.md`, 'Comece pela situação concreta e reutilize revisões anteriores.');
  const prepareArgs = { root: a, slug: bundle.slug, sourceDir: source, selectedPaths: ['metodo/oferta.md'], version: '0.2.1', summary: 'Abertura concreta reaplica contexto e revisão.' };
  const prePrepare = snapshot(a);
  prepareContribution(prepareArgs); assert.deepEqual(snapshot(a), prePrepare);
  assert.throws(() => prepareContribution({ ...prepareArgs, selectedPaths: ['contexto/segredo.md'] }), /shareable/);
  const candidate = prepareContribution({ ...prepareArgs, confirm: true });
  const review = reviewContributionCandidate({ root: a, candidateId: candidate.candidate_id });
  assert.deepEqual(review.selected_paths, ['metodo/oferta.md']);
  const saved = JSON.parse(readFileSync(join(a, review.package_ref)));
  assert.equal(JSON.stringify(saved).includes('PRIVATE_SENTINEL_A'), false); checks++;
  const consent = { root: a, candidateId: candidate.candidate_id, packageSha256: candidate.package_sha256 };
  let submitted;
  const sender = { submitContribution: async (body) => { submitted = body; return { contribution: { id: 'fixture-contribution', status: 'submitted', package_sha256: body.package_sha256 } }; } };
  await assert.rejects(sendContribution({ ...consent, client: sender, confirm: true }), /approval_required/);
  approveContribution({ ...consent, confirm: true });
  assert.equal((await sendContribution({ ...consent, client: sender })).sent, false); assert.equal(submitted, undefined);
  await sendContribution({ ...consent, client: sender, confirm: true });
  assert.equal(submitted.share_confirmed, true); assert.equal(submitted.idempotency_key, candidate.candidate_id);
  assert.equal(JSON.stringify(submitted).includes('PRIVATE_SENTINEL_A'), false); checks++;
  const second = installCommunityPackage({ root: b, package: submitted.package, expectedSha256: candidate.package_sha256, confirm: true });
  assert.equal(readFileSync(join(b, second.refs.bundle, 'metodo/oferta.md'), 'utf8'), 'Comece pela situação concreta e reutilize revisões anteriores.');
  assert.equal(snapshot(b).join('\n').includes('segredo'), false);
  // Edited distributed contracts are conflicts; private customizations are not overwritten.
  const contractPath = join(a, result.refs.system, 'contract.json'); const originalContract = readFileSync(contractPath);
  writeFileSync(contractPath, `${originalContract.toString()}\n`);
  const conflictBefore = snapshot(a);
  assert.throws(() => installCommunityPackage({ root: a, package: submitted.package, confirm: true }), /modified_conflict/);
  assert.deepEqual(snapshot(a), conflictBefore); writeFileSync(contractPath, originalContract); checks++;
  // Active and stale locks are never silently deleted, and no staging work starts.
  const lockRef = `sistemas/outros-instalados/.${bundle.slug}.install.lock`;
  for (const [pid, pattern] of [[process.pid, /in_progress/], [2147483647, /interrupted_review_required/]]) {
    write(a, lockRef, JSON.stringify({ pid })); const lockedBefore = snapshot(a);
    assert.throws(() => installCommunityPackage({ root: a, package: submitted.package, confirm: true }), pattern);
    assert.deepEqual(snapshot(a), lockedBefore); rmSync(join(a, lockRef));
  }
  checks++;
  const updateBefore = snapshot(a);
  assert.throws(() => installCommunityPackage({ root: a, package: submitted.package, confirm: true, faultInjector: (step) => { if (step.endsWith('/contract.json')) throw new Error('disk_failure'); } }), /disk_failure/);
  assert.deepEqual(snapshot(a), updateBefore);
  installCommunityPackage({ root: a, package: submitted.package, confirm: true });
  assert.equal(readFileSync(join(a, source, 'contexto/segredo.md'), 'utf8'), 'PRIVATE_SENTINEL_A');
  assert.equal(readFileSync(join(a, 'AGENTS.md'), 'utf8'), 'OWNER_GLOBAL_INSTRUCTIONS'); checks++;
  // Same-release retries inspect every actual file, rather than trusting state alone.
  write(b, `${second.refs.bundle}/metodo/oferta.md`, 'tampered');
  assert.throws(() => installCommunityPackage({ root: b, package: submitted.package, confirm: true }), /installed_file_mismatch/); checks++;
  // Candidate changes invalidate the already approved hash.
  const candidatePath = join(a, review.package_ref); const original = readFileSync(candidatePath);
  const tampered = JSON.parse(original); tampered.files['metodo/oferta.md'] = encodeCommunityFile(Buffer.from('Changed after approval'));
  writeFileSync(candidatePath, JSON.stringify(tampered));
  await assert.rejects(sendContribution({ ...consent, client: sender, confirm: true }), /candidate_hash_mismatch/); writeFileSync(candidatePath, original); checks++;
  // Never follow a private-target symlink during plan or apply.
  const linked = brain('links'); mkdirSync(join(linked, 'sistemas')); symlinkSync(b, join(linked, 'sistemas/outros-instalados'));
  assert.throws(() => installCommunityPackage({ root: linked, package: bundle }), /unsafe_target/); checks++;
  const calls = [];
  const client = createCommunityClient({ root: a, endpoint: 'https://fixture.example/distribution', fetchImpl: async (url, options) => {
    const body = JSON.parse(options.body); calls.push({ url, body });
    assert.equal(body.install_credential, 'a'.repeat(43));
    return new Response(JSON.stringify({ releases: [] }), { status: 200 });
  } });
  await client.request('list_releases', { install_id: 'forged', install_credential: 'forged', member_id: 'forged' });
  assert.equal(calls[0].body.install_id, '3f2504e0-4f89-41d3-9a0c-0305e82c3301'); assert.equal(calls[0].body.member_id, undefined);
  const revoked = createCommunityClient({ root: a, fetchImpl: async () => new Response(JSON.stringify({ error: 'access_denied', private: 'RAW_SECRET' }), { status: 403 }) });
  await assert.rejects(revoked.listReleases(), (error) => error.status === 403 && !error.message.includes('RAW_SECRET')); checks++;
  // Artifact bytes/hash differ from canonical-envelope hash; no identity forwarded to download.
  const artifactBytes = Buffer.from(JSON.stringify(bundle, null, 2)); let artifactOptions;
  const downloader = createCommunityClient({ root: a, fetchImpl: async (url, options) => { artifactOptions = options; return new Response(artifactBytes); } });
  assert.equal((await downloader.resolvePackage({ artifact: { url: 'https://files.example/package', sha256: communityHash(artifactBytes), bytes: artifactBytes.length }, package_sha256: hashCommunityPackage(bundle) })).package.version, bundle.version);
  assert.equal(artifactOptions.body, undefined); assert.equal(artifactOptions.headers, undefined);
  await assert.rejects(downloader.resolvePackage({ artifact: { url: 'http://files.example/package', sha256: communityHash(artifactBytes), bytes: artifactBytes.length }, package_sha256: hashCommunityPackage(bundle) }), /insecure/); checks++;
  const remoteRoot = brain('remote'); const actions = [];
  const remote = {
    getRelease: async () => { actions.push('get'); return { release: { slug: bundle.slug, package_sha256: hashCommunityPackage(bundle) } }; },
    issueGrant: async () => { actions.push('issue'); return { grant_token: 'secret-token' }; },
    redeemGrant: async () => { actions.push('redeem'); return { package: bundle, package_sha256: hashCommunityPackage(bundle) }; },
    resolvePackage: async (data) => data,
    installationReceipt: async () => { actions.push('receipt'); throw new Error('offline'); },
  };
  const remoteBefore = snapshot(remoteRoot);
  await installCommunityRelease({ root: remoteRoot, slug: bundle.slug, client: remote });
  assert.deepEqual(actions, ['get']); assert.deepEqual(snapshot(remoteRoot), remoteBefore);
  const installedRemote = await installCommunityRelease({ root: remoteRoot, slug: bundle.slug, client: remote, confirm: true, expectedSha256: hashCommunityPackage(bundle) });
  assert.equal(installedRemote.remote_receipt, 'pending'); assert.equal(JSON.stringify(installedRemote).includes('secret-token'), false); checks++;
  const fullSource = process.argv.find((arg) => arg.startsWith('--funil='))?.slice(8);
  if (fullSource) {
    const full = buildFunilCommunityPackage({ sourceDir: fullSource });
    const fullRoot = brain('full'); const fullResult = installCommunityPackage({ root: fullRoot, package: full, confirm: true });
    assert.equal(fullResult.file_count, 99);
    for (const name of Object.keys(full.files)) assert.deepEqual(readFileSync(join(fullRoot, fullResult.refs.bundle, name)), readFileSync(join(fullSource, name)));
    write(fullRoot, `${fullResult.refs.workspace}/metodo/oferta.md`, `${readFileSync(join(fullSource, 'metodo/oferta.md'), 'utf8')}\nCorreção sintética explicitamente selecionada.\n`);
    const fullCandidate = prepareContribution({ root: fullRoot, slug: full.slug, sourceDir: fullResult.refs.workspace, selectedPaths: ['metodo/oferta.md'], version: '0.2.1-rc.1', summary: 'Correção sintética de método para teste de distribuição.', confirm: true });
    const newFull = JSON.parse(readFileSync(join(fullRoot, fullCandidate.package_ref)));
    const installedFull = installCommunityPackage({ root: fullRoot, package: newFull, confirm: true });
    // Package-owned checker runs only in this explicit verification, never during install.
    const python = spawnSync('python3', ['-B', '-c', 'import sys; sys.path.insert(0,sys.argv[1]+"/scripts"); from package_integrity import validate_bundle; print(validate_bundle(sys.argv[1]))', join(fullRoot, installedFull.refs.bundle)], { encoding: 'utf8' });
    assert.equal(python.status, 0, python.stderr); checks++;
  }
  console.log(JSON.stringify({ status: 'passed', checks, full_bundle: Boolean(fullSource), private_sentinel_shared: false, human_or_market_approval_claimed: false }));
} finally { rmSync(temp, { recursive: true, force: true }); }
