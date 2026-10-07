#!/usr/bin/env node
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { applyPlan, BEGIN, END, hash, mergeClaude, planUpdate, releaseUrl } from './update.mjs';
import { installationChoices, installPackage } from './install.mjs';

const product = resolve(import.meta.dirname, '..');
const tag = 'v1.36.0';
function write(root, path, text) { mkdirSync(join(root, path, '..'), { recursive: true }); writeFileSync(join(root, path), text); }
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'inevita-update-proof-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, 'package'), brain = join(root, 'member'), baseline = join(root, 'baseline');
  mkdirSync(source); mkdirSync(brain); mkdirSync(baseline);
  write(source, 'VERSION', '1.36.0\n');
  write(source, 'CLAUDE.md', `${BEGIN}\nMOTOR NOVO\n${END}\n`);
  write(source, 'COMECE-AQUI.md', 'fixture');
  write(source, '.agents/skills/oficial/SKILL.md', 'skill oficial nova');
  write(source, 'scripts/runtime.mjs', 'motor novo');
  write(source, '.cerebro/motor.manifest', 'VERSION\nCLAUDE.md\nCOMECE-AQUI.md\n.agents/skills\nscripts\n');
  write(source, '.cerebro/seed.manifest', 'meu-negocio/fontes\n');
  write(source, 'meu-negocio/fontes/seed.md', 'seed novo');
  write(brain, 'VERSION', '1.34.2\n');
  write(brain, 'CLAUDE.md', 'MINHA INSTRUÇÃO LOCAL\n');
  write(brain, '.agents/skills/minha/SKILL.md', 'MINHA SKILL\n');
  write(brain, '.agents/skills/oficial/extra.md', 'EXTENSÃO DO MEMBRO\n');
  write(brain, 'scripts/runtime.mjs', 'motor personalizado');
  write(brain, 'meu-negocio/fontes/meu.md', 'minha fonte');
  write(baseline, 'VERSION', '1.34.2\n');
  write(baseline, 'scripts/runtime.mjs', 'motor antigo');
  return { root, source, brain, baseline };
}
function snapshot(root) {
  const out = {};
  function visit(path, ref = '') {
    for (const dirent of readdirSync(path, { withFileTypes: true })) {
      const next = ref ? `${ref}/${dirent.name}` : dirent.name;
      if (dirent.isDirectory()) visit(join(path, dirent.name), next);
      else out[next] = hash(readFileSync(join(path, dirent.name)));
    }
  }
  visit(root); return out;
}
for (const runner of ['node', 'bash']) {
  test(`${runner}: regressão 14/09 preserva skill própria e CLAUDE legado; prévia não escreve`, t => {
    const { source, brain, baseline } = fixture(t);
    write(brain, '.cerebro/source', 'REPO=example/package\n');
    cpSync(join(product, 'scripts/update.mjs'), join(brain, 'scripts/update.mjs'));
    mkdirSync(join(brain, '.claude/scripts'), { recursive: true });
    cpSync(join(product, '.claude/scripts/update.sh'), join(brain, '.claude/scripts/update.sh'));
    const command = runner === 'node' ? process.execPath : 'bash';
    const script = join(brain, runner === 'node' ? 'scripts/update.mjs' : '.claude/scripts/update.sh');
    const env = { ...process.env, CEREBRO_UPDATE_SOURCE_DIR: source, CEREBRO_TELEMETRY: 'off' };
    const before = snapshot(brain);
    const args = ['--tag', tag, '--baseline-dir', baseline];
    const preview = JSON.parse(execFileSync(command, [script, ...args], { env }).toString());
    assert.deepEqual(snapshot(brain), before);
    assert(preview.conflicts.includes('scripts/runtime.mjs'));
    const blocked = spawnSync(command, [script, ...args, '--apply'], { env });
    assert.notEqual(blocked.status, 0);
    assert.deepEqual(snapshot(brain), before);
    const approvedConflict = spawnSync(command, [script, ...args, '--apply', '--approve-plan', preview.plan_hash], { env });
    assert.notEqual(approvedConflict.status, 0);
    assert.deepEqual(snapshot(brain), before);
    write(brain, 'scripts/runtime.mjs', 'motor antigo');
    const safePreview = JSON.parse(execFileSync(command, [script, ...args], { env }).toString());
    assert.deepEqual(safePreview.conflicts, []);
    execFileSync(command, [script, ...args, '--apply', '--approve-plan', safePreview.plan_hash], { env });
    assert.equal(readFileSync(join(brain, '.agents/skills/minha/SKILL.md'), 'utf8'), 'MINHA SKILL\n');
    assert.equal(readFileSync(join(brain, '.agents/skills/oficial/extra.md'), 'utf8'), 'EXTENSÃO DO MEMBRO\n');
    assert.match(readFileSync(join(brain, 'CLAUDE.md'), 'utf8'), /^MINHA INSTRUÇÃO LOCAL\n\n<!-- INEVITA:MANAGED:BEGIN -->/);
    assert.equal(readFileSync(join(brain, 'VERSION'), 'utf8'), '1.36.0\n');
  });
}
test('CLAUDE preserva bytes fora do bloco e recusa marcadores ambíguos', () => {
  const original = Buffer.from(`antes\r\n${BEGIN}\nvelho\n${END}\r\ndepois sem newline`);
  assert.equal(mergeClaude(original, Buffer.from(`${BEGIN}\nnovo\n${END}\n`)).toString(), `antes\r\n${BEGIN}\nnovo\n${END}\r\ndepois sem newline`);
  assert.throws(() => mergeClaude(Buffer.from(`${BEGIN}duplicado${BEGIN}${END}`), Buffer.from('novo')), /markers-invalid/);
});
test('recibo distingue update oficial de modificação local; reexecução é idempotente', t => {
  const { source, brain, baseline } = fixture(t);
  write(brain, 'scripts/runtime.mjs', 'motor antigo');
  let plan = planUpdate(brain, source, tag, { baseline });
  assert.deepEqual(plan.conflicts, []);
  assert.throws(() => applyPlan(brain, plan), /preview-approval-required/);
  applyPlan(brain, plan, { approvePlan: plan.digest });
  const before = snapshot(brain);
  plan = planUpdate(brain, source, tag);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(applyPlan(brain, plan), null);
  assert.deepEqual(snapshot(brain), before);
  write(source, 'scripts/runtime.mjs', 'outra versão oficial');
  plan = planUpdate(brain, source, tag);
  assert.deepEqual(plan.conflicts, []);
  write(brain, 'scripts/runtime.mjs', 'mudança local');
  assert(planUpdate(brain, source, tag).conflicts.includes('scripts/runtime.mjs'));
  assert.throws(() => applyPlan(brain, plan, { approvePlan: plan.digest }), /destination-changed/);
});
test('aprovação vencida bloqueia mudanças no pacote e destino antes da escrita', t => {
  const { source, brain, baseline } = fixture(t);
  write(brain, 'scripts/runtime.mjs', 'motor antigo');
  const approved = planUpdate(brain, source, tag, { baseline });
  write(source, 'scripts/runtime.mjs', 'pacote alterado');
  const before = snapshot(brain);
  assert.throws(() => applyPlan(brain, planUpdate(brain, source, tag, { baseline }), { approvePlan: approved.digest }), /approval|plan-changed/);
  assert.deepEqual(snapshot(brain), before);
});
test('falha parcial restaura bytes; backups contêm personalização anterior', t => {
  const { source, brain, baseline } = fixture(t);
  write(brain, 'scripts/runtime.mjs', 'motor antigo');
  const before = snapshot(brain);
  const plan = planUpdate(brain, source, tag, { baseline });
  let count = 0;
  assert.throws(() => applyPlan(brain, plan, { approvePlan: plan.digest, write(path, bytes) {
    mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, bytes);
    if (++count === 3) throw new Error('disk-failure');
  } }), /disk-failure/);
  const after = snapshot(brain);
  for (const [path, digest] of Object.entries(before)) assert.equal(after[path], digest);
  assert.equal(existsSync(join(brain, '.cerebro/update.lock')), false);
  const backup = readdirSync(join(brain, '.cerebro/update-backups'))[0];
  assert.equal(readFileSync(join(brain, '.cerebro/update-backups', backup, 'files/CLAUDE.md'), 'utf8'), 'MINHA INSTRUÇÃO LOCAL\n');
});
test('manifestações amplas não sobrescrevem contexto, feedback ou seeds existentes', t => {
  const { source, brain, baseline } = fixture(t);
  write(brain, 'scripts/runtime.mjs', 'motor antigo');
  write(source, '.cerebro/motor.manifest', 'VERSION\nCLAUDE.md\nsistemas\nmeu-negocio\n');
  write(source, 'sistemas/um/feedback.md', 'feedback do pacote');
  write(brain, 'sistemas/um/feedback.md', 'feedback privado');
  write(source, 'meu-negocio/mapa.md', 'mapa do pacote');
  write(brain, 'meu-negocio/mapa.md', 'mapa privado');
  write(brain, 'meu-negocio/fontes/seed.md', 'seed personalizado');
  const plan = planUpdate(brain, source, tag, { baseline });
  applyPlan(brain, plan, { approvePlan: plan.digest });
  assert.equal(readFileSync(join(brain, 'sistemas/um/feedback.md'), 'utf8'), 'feedback privado');
  assert.equal(readFileSync(join(brain, 'meu-negocio/mapa.md'), 'utf8'), 'mapa privado');
  assert.equal(readFileSync(join(brain, 'meu-negocio/fontes/seed.md'), 'utf8'), 'seed personalizado');
});
test('symlink no destino ou pacote, traversal e colisão com diretório recusados', t => {
  const { source, brain, root } = fixture(t);
  rmSync(join(brain, '.agents'), { recursive: true });
  const outside = join(root, 'outside'); mkdirSync(outside);
  symlinkSync(outside, join(brain, '.agents'), 'dir');
  assert.throws(() => planUpdate(brain, source, tag), /symlink-blocked/);
  rmSync(join(brain, '.agents'));
  symlinkSync(outside, join(source, 'scripts/link'), 'dir');
  assert.throws(() => planUpdate(brain, source, tag), /symlink-blocked/);
  rmSync(join(source, 'scripts/link'));
  write(source, '.cerebro/motor.manifest', '../escape\nVERSION');
  assert.throws(() => planUpdate(brain, source, tag), /unsafe-package-path/);
  write(source, '.cerebro/motor.manifest', 'VERSION\nCLAUDE.md');
  rmSync(join(brain, 'CLAUDE.md')); mkdirSync(join(brain, 'CLAUDE.md'));
  assert.throws(() => planUpdate(brain, source, tag), /not-regular-file/);
});
test('tag explícita e VERSION exata; não há fallback para main/latest', t => {
  const { source, brain, baseline } = fixture(t);
  for (const invalid of [undefined, 'main', 'latest', 'v1.2', '../main']) assert.throws(() => planUpdate(brain, source, invalid), /explicit-tag/);
  assert.throws(() => planUpdate(brain, source, 'v1.35.0'), /version-mismatch/);
  write(baseline, 'VERSION', '1.36.1\n');
  assert.throws(() => planUpdate(brain, source, tag, { baseline }), /baseline-version-mismatch/);
  assert.equal(releaseUrl('example/repo', tag), 'https://github.com/example/repo/archive/refs/tags/v1.36.0.tar.gz');
});
test('lock existente impede segundo atualizador sem alterar arquivos', t => {
  const { source, brain, baseline } = fixture(t);
  write(brain, 'scripts/runtime.mjs', 'motor antigo');
  write(brain, '.cerebro/update.lock', 'outro processo');
  const plan = planUpdate(brain, source, tag, { baseline }), before = snapshot(brain);
  assert.throws(() => applyPlan(brain, plan, { approvePlan: plan.digest }), /EEXIST/);
  assert.deepEqual(snapshot(brain), before);
});
test('instalar em pasta nova por tag; existente oferece três caminhos sem escrever', t => {
  const { source, brain, root } = fixture(t);
  const destination = join(root, 'new');
  assert.equal(installPackage(destination, source, tag).status, 'preview');
  assert.equal(existsSync(destination), false);
  assert.equal(installPackage(destination, source, tag, { apply: true }).version, '1.36.0');
  const before = snapshot(destination);
  const choices = installPackage(destination, source, tag, { apply: true });
  assert.equal(choices.status, 'existing-brain');
  assert.deepEqual(choices.choices.map(x => x.action), ['use-existing', 'new-folder', 'migrate']);
  assert.deepEqual(snapshot(destination), before);
  assert.equal(installationChoices(brain).status, 'existing-folder');
});

test('instalação do pacote completo inclui privacidade, manifesto, skills e seeds', t => {
  const { root } = fixture(t);
  const target = join(root, 'full-install');
  const result = installPackage(target, product, `v${readFileSync(join(product, 'VERSION'), 'utf8').trim()}`, { apply: true });
  assert.equal(result.status, 'installed');
  for (const file of ['.cerebro/manifest.json', 'LICENSE', 'README.md', 'meu-negocio/mapa.md',
    '.agents/skills/auditar-cerebro/SKILL.md', '.claude/skills/migrar-cerebro/SKILL.md']) {
    assert(existsSync(join(target, file)), `pacote incompleto: ${file}`);
  }
  const ignore = readFileSync(join(target, '.gitignore'), 'utf8');
  for (const rule of ['privado/*', 'capturas/*', '.cerebro/update-backups/', '.cerebro/install-credential']) assert(ignore.includes(rule));
});
