#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';
import { applyPlan, extrairTarGz, hash, planUpdate } from './update.mjs';
import { installPackage } from './install.mjs';
const product = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = readFileSync(join(product, 'VERSION'), 'utf8').trim();
const tag = `v${version}`;
const sandbox = mkdtempSync(join(tmpdir(), 'community-release-'));
const guides = ['docs/guides/community-mcp.md', 'docs/guides/community-systems.md', 'docs/guides/community-release.md'];
const releaseNotes = ['docs/releases/1.38.0.md', 'docs/releases/1.39.0.md'];
const distributedDocs = [...guides, ...releaseNotes];
try {
  assert.equal(version, '1.39.0');
  const fresh = join(sandbox, 'fresh');
  assert.equal(installPackage(fresh, product, tag).written, false);
  assert.equal(existsSync(fresh), false);
  installPackage(fresh, product, tag, { apply: true });
  for (const path of distributedDocs) assert.deepEqual(readFileSync(join(fresh, path)), readFileSync(join(product, path)));
  const help = execFileSync(process.execPath, [join(fresh, 'scripts/community.mjs'), '--help'], { encoding: 'utf8' });
  assert.match(help, /--sha256/);
  const baseline = join(sandbox, 'baseline-1380'); mkdirSync(baseline);
  const archive = execFileSync('git', ['archive', 'ff1d40e003f548ed050f727f1f64eff411d122e0'], { cwd: product, maxBuffer: 100 * 1024 * 1024 });
  extrairTarGz(gzipSync(archive), baseline);
  assert.equal(readFileSync(join(baseline, 'VERSION'), 'utf8').trim(), '1.38.0');
  const member = join(sandbox, 'member'); cpSync(baseline, member, { recursive: true });
  const sentinels = {
    'meu-negocio/oferta.md': 'PRIVATE_OFFER', '.cerebro/install-credential': 'PRIVATE_CREDENTIAL',
    '.cerebro/id': 'LOCAL_ID', '.cerebro/sistemas/custom.json': '{"private":true}',
    'sistemas/outros-instalados/funil-e-crescimento/workspace/contexto/empresa.md': 'PRIVATE_WORKSPACE',
    'comunidade/minhas-contribuicoes/propostas/local/package.json': '{"private":true}',
    '.agents/skills/minha-skill/SKILL.md': 'MY_SKILL',
  };
  for (const [path, value] of Object.entries(sentinels)) { mkdirSync(dirname(join(member, path)), { recursive: true }); writeFileSync(join(member, path), value); }
  const claude = `${readFileSync(join(member, 'CLAUDE.md'), 'utf8')}\nREGRA PRIVADA DO DONO\n`; writeFileSync(join(member, 'CLAUDE.md'), claude);
  const sourceBefore = hash(readFileSync(join(member, '.cerebro/source')));
  const plan = planUpdate(member, product, tag, { baseline });
  assert.deepEqual(plan.conflicts, []);
  for (const path of guides) assert(plan.entries.some((entry) => entry.path === path && entry.action === 'create'));
  assert.equal(readFileSync(join(member, 'VERSION'), 'utf8').trim(), '1.38.0');
  applyPlan(member, plan, { approvePlan: plan.digest });
  assert.equal(readFileSync(join(member, 'VERSION'), 'utf8').trim(), version);
  for (const [path, value] of Object.entries(sentinels)) assert.equal(readFileSync(join(member, path), 'utf8'), value);
  assert.equal(readFileSync(join(member, 'CLAUDE.md'), 'utf8'), claude);
  assert.equal(hash(readFileSync(join(member, '.cerebro/source'))), sourceBefore);
  for (const path of distributedDocs) assert.deepEqual(readFileSync(join(member, path)), readFileSync(join(product, path)));
  const replay = planUpdate(member, product, tag); assert.deepEqual(replay.conflicts, []); assert.equal(applyPlan(member, replay), null);
  console.log(JSON.stringify({ status: 'passed', version, installed_guides: guides.length, installed_release_notes: releaseNotes.length, private_sentinels_preserved: Object.keys(sentinels).length, local_claude_preserved: true, channel_unchanged: true, idempotent: true }));
} finally { rmSync(sandbox, { recursive: true, force: true }); }
