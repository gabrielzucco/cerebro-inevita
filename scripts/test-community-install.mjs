#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runCommunityCommand } from './community.mjs';
import { funilContracts } from './build-funil-community-package.mjs';
import { encodeCommunityFile, hashCommunityPackage, installCommunityRelease } from './lib/community-package.mjs';
const source = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const grant = 'g'.repeat(43); const credential = 'c'.repeat(43);
const envelope = { schema_version: 2, slug: 'funil-e-crescimento', system_id: 'sistema-funil-inevita', version: '0.2.0-rc.1', title: 'Funil', entrypoint: 'COMECE-AQUI.md', first_task: 'Revisar contexto', files: { 'COMECE-AQUI.md': encodeCommunityFile(Buffer.from('# entrada')), 'bin.zip': encodeCommunityFile(Buffer.from([0, 255, 22])) }, contracts: funilContracts('0.2.0-rc.1') };
const hash = hashCommunityPackage(envelope);
const write = (root, path, value) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), value); };
function brain() { const root = mkdtempSync(join(tmpdir(), 'community-install-')); write(root, 'COMECE-AQUI.md', '# Brain'); write(root, 'VERSION', '1.39.0'); return root; }
function cli(root, args, endpoint) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [join(source, 'scripts/install-system.mjs'), ...args], { env: { ...process.env, CEREBRO_INSTALL_ROOT: root, CEREBRO_DISTRIBUTION_URL: endpoint || '', CEREBRO_COMMUNITY_ALLOW_LOCALHOST: '1', CEREBRO_TELEMETRY: 'off' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = ''; child.stdout.on('data', (chunk) => { output += chunk; }); child.stderr.on('data', (chunk) => { output += chunk; }); child.on('error', reject); child.on('close', (code) => resolveRun({ code, output }));
  });
}
test('official CLI V2 grant, integrity recovery after 409, receipt and credential privacy', async () => {
  const root = brain(); let redeemed = false; const requests = [];
  write(root, '.cerebro/id', '3f2504e0-4f89-41d3-9a0c-0305e82c3301'); write(root, '.cerebro/install-credential', credential);
  const server = createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw); requests.push(body); res.setHeader('content-type', 'application/json');
    if (body.action === 'redeem_grant' && !redeemed) { redeemed = true; res.end(JSON.stringify({ package: envelope, package_sha256: hash })); }
    else if (body.action === 'redeem_grant') { res.statusCode = 409; res.end(JSON.stringify({ error: 'grant_already_used' })); }
    else res.end(JSON.stringify({ installed: true }));
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const endpoint = `http://127.0.0.1:${server.address().port}`;
  const args = [envelope.slug, '--confirm', `--grant=${grant}`, `--sha256=${hash}`];
  try {
    const first = await cli(root, args, endpoint); assert.equal(first.code, 0, first.output);
    assert.equal(requests.length, 2); assert.ok(requests.every((body) => body.install_credential === credential));
    assert.ok(!first.output.includes(credential) && !first.output.includes(grant));
    const state = JSON.parse(readFileSync(join(root, `.cerebro/sistemas/${envelope.slug}.json`)));
    assert.deepEqual(readFileSync(join(root, state.bundle_ref, 'bin.zip')), Buffer.from([0, 255, 22]));
    assert.equal(JSON.parse(readFileSync(join(root, state.bundle_ref, '../installation.json'))).remote_receipt, 'confirmed');
    assert.equal((await cli(root, args, endpoint)).code, 0);
    write(root, `${state.bundle_ref}/bin.zip`, 'corrupt');
    const retried = await cli(root, args, endpoint); assert.equal(retried.code, 1); assert.match(retried.output, /installed_file_mismatch/);
    assert.equal(requests.filter((body) => body.action === 'installation_receipt').length, 2);
  } finally { await new Promise((done) => server.close(done)); rmSync(root, { recursive: true, force: true }); }
});
test('official CLI preview v1 and v2 never creates installation ID or consumes grant', async () => {
  const root = brain(); const packet = join(root, 'package.json'); writeFileSync(packet, JSON.stringify(envelope));
  try {
    for (const args of [['calls-decisoes', '--confirm', '--dry-run'], [envelope.slug, '--confirm', '--dry-run', `--package=${packet}`]]) {
      const run = await cli(root, args); assert.equal(run.code, 0, run.output);
      assert.equal(existsSync(join(root, '.cerebro')), false); assert.equal(existsSync(join(root, 'sistemas')), false);
    }
    assert.equal((await cli(root, [envelope.slug, '--confirm', '--dry-run', `--grant=${grant}`])).code, 1);
    assert.equal(existsSync(join(root, '.cerebro')), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('community service routes legacy Calls through official installer using existing server authorization', async () => {
  const root = brain(); const files = {};
  const docs = ['manifest.json', 'manifest.md', 'pipeline.md', 'rotinas.md', 'evals.md', 'changelog.md', 'feedback.template.md', 'configuracao.template.md', 'contract.json', 'capability.json', 'release.json'];
  for (const name of docs) files[name] = readFileSync(join(source, 'comunidade/inevita/sistemas-disponiveis/calls-decisoes', name), 'utf8');
  const legacy = { schema_version: 1, slug: 'calls-decisoes', system_id: 'calls-decisoes', version: JSON.parse(files['release.json']).version, files };
  const expected = hashCommunityPackage(legacy);
  const client = { getRelease: async () => ({ release: { slug: legacy.slug, package_sha256: expected } }), issueGrant: async () => ({ grant_token: grant }), redeemGrant: async () => ({ package: legacy, package_sha256: expected }), resolvePackage: async (data) => data, installationReceipt: async () => ({ installed: true }) };
  try {
    const result = await installCommunityRelease({ root, slug: legacy.slug, client, expectedSha256: expected, confirm: true });
    assert.equal(result.status, 'installed'); assert.equal(result.remote_receipt, 'confirmed');
    assert.equal(existsSync(join(root, '.cerebro/member-id')), false);
    assert.equal(readFileSync(join(root, 'sistemas/outros-instalados/calls-decisoes/contract.json'), 'utf8'), files['contract.json']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('CLI help documents flags and test runner without loading client or writing', async () => {
  const result = await runCommunityCommand({ args: ['--help'], root: '/unused', client: null });
  assert.match(result.help, /--source-dir/); assert.match(result.help, /--sha256/); assert.match(result.help, /test-community-all/);
});
