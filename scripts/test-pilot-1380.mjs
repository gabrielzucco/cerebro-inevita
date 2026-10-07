#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';
import { applyPlan, extrairTarGz, hash, planUpdate } from './update.mjs';
import { installPackage } from './install.mjs';

const product = resolve(import.meta.dirname, '..');
// Keep the historical 1.36.1 baseline; exercise the current candidate, not a stale tag.
const targetVersion = readFileSync(join(product, 'VERSION'), 'utf8').trim();
const tag = `v${targetVersion}`;
const baseCommit = '12a3395917b72f8ca88b65c2fc14e8156288d252';
const sandbox = mkdtempSync(join(tmpdir(), 'inevita-pilot-1380-'));
function digestTree(root) {
  const files = {};
  function visit(dir, relative = '') {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const ref = relative ? `${relative}/${item.name}` : item.name;
      if (ref.startsWith('.cerebro/update-backups') || ref === '.cerebro/update.lock') continue;
      if (item.isDirectory()) visit(join(dir, item.name), ref);
      else files[ref] = hash(readFileSync(join(dir, item.name)));
    }
  }
  visit(root);
  return files;
}

try {
  const fresh = join(sandbox, 'fresh');
  assert.equal(installPackage(fresh, product, tag).status, 'preview');
  assert.equal(installPackage(fresh, product, tag, { apply: true }).version, targetVersion);
  console.log(`PASS fresh-install: ${targetVersion}`);

  const baseline = join(sandbox, 'baseline-1361');
  mkdirSync(baseline);
  const tar = execFileSync('git', ['archive', baseCommit], { cwd: product, maxBuffer: 100 * 1024 * 1024 });
  extrairTarGz(gzipSync(tar), baseline);
  assert.equal(readFileSync(join(baseline, 'VERSION'), 'utf8').trim(), '1.36.1');
  const member = join(sandbox, 'member-1361');
  cpSync(baseline, member, { recursive: true });
  mkdirSync(join(member, '.agents/skills/minha-skill'), { recursive: true });
  writeFileSync(join(member, '.agents/skills/minha-skill/SKILL.md'), 'skill própria\n');
  writeFileSync(join(member, 'CLAUDE.md'), `${readFileSync(join(member, 'CLAUDE.md'), 'utf8')}\nREGRA LOCAL DO MEMBRO\n`);
  const beforePreview = digestTree(member);
  let plan = planUpdate(member, product, tag, { baseline });
  assert.deepEqual(plan.conflicts, []);
  assert.deepEqual(digestTree(member), beforePreview);
  console.log(`PASS preview-1361: ${plan.summary.length} arquivos planejados, 0 conflitos, 0 escritas`);

  writeFileSync(join(member, 'scripts/update.mjs'), 'alteração local\n');
  const conflictSnapshot = digestTree(member);
  plan = planUpdate(member, product, tag, { baseline });
  assert(plan.conflicts.includes('scripts/update.mjs'));
  assert.throws(() => applyPlan(member, plan, { approvePlan: plan.digest }), /update-conflicts/);
  assert.deepEqual(digestTree(member), conflictSnapshot);
  console.log('PASS conflict: cancelou antes da primeira escrita, inclusive com hash aprovado');

  cpSync(join(baseline, 'scripts/update.mjs'), join(member, 'scripts/update.mjs'));
  plan = planUpdate(member, product, tag, { baseline });
  assert.deepEqual(plan.conflicts, []);
  const beforeFailure = digestTree(member);
  let writes = 0;
  assert.throws(() => applyPlan(member, plan, { approvePlan: plan.digest, write(path, bytes) {
    mkdirSync(resolve(path, '..'), { recursive: true });
    writeFileSync(path, bytes);
    if (++writes === 4) throw new Error('injected-failure');
  } }), /injected-failure/);
  assert.deepEqual(digestTree(member), beforeFailure);
  console.log('PASS rollback: falha na quarta escrita restaurou todos os bytes do alvo');

  plan = planUpdate(member, product, tag, { baseline });
  applyPlan(member, plan, { approvePlan: plan.digest });
  assert.equal(readFileSync(join(member, 'VERSION'), 'utf8').trim(), targetVersion);
  assert.equal(readFileSync(join(member, '.agents/skills/minha-skill/SKILL.md'), 'utf8'), 'skill própria\n');
  assert(readFileSync(join(member, 'CLAUDE.md'), 'utf8').includes('REGRA LOCAL DO MEMBRO\n'));
  const afterUpdate = digestTree(member);
  plan = planUpdate(member, product, tag);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(applyPlan(member, plan), null);
  assert.deepEqual(digestTree(member), afterUpdate);
  console.log(`PASS update-1361: contexto preservado, ${targetVersion}; reexecução idempotente`);
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
