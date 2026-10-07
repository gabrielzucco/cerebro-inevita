#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { installPackage } from './install.mjs';
import { applyPlan, extrairTarGz, planUpdate } from './update.mjs';

const product = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = mkdtempSync(join(tmpdir(), 'member panel release '));
const tag = 'v1.40.0';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const manifestBytes = readFileSync(join(product, 'panel-manifest.json'));
const manifest = JSON.parse(manifestBytes);
const write = (root, path, value) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), typeof value === 'string' ? value : JSON.stringify(value)); };
function checkPackage(root) {
  assert.equal(digest(readFileSync(join(root, 'panel-manifest.json'))), '4bc963ca9c884e557ede9db6de6d1c5561428d5d707595cf58f1a070c5980786');
  assert.equal(manifest.files.length, 62);
  assert.equal(manifest.minimum_node, 20);
  assert.equal(manifest.member_data_included, false);
  assert.equal(manifest.operator_adapters_included, false);
  assert.equal(manifest.requires_explicit_root, true);
  assert.equal(new Set(manifest.files.map(file => file.path)).size, 62);
  for (const file of manifest.files) {
    assert.match(file.path, /^(?:console\/(?:painel|protocol)\/|scripts\/painel\.mjs$)/);
    assert(!file.path.split('/').includes('..'));
    const bytes = readFileSync(join(root, file.path));
    assert.equal(bytes.length, file.bytes, file.path);
    assert.equal(digest(bytes), file.sha256, file.path);
  }
  assert(!existsSync(join(root, 'installation-proof.json')));
}
async function listen(server) {
  await new Promise((res, rej) => { server.once('error', rej); server.listen(0, '127.0.0.1', res); });
  return server.address().port;
}
async function closeServer(server) {
  server.closeAllConnections?.();
  await new Promise(resolveClose => server.close(resolveClose));
}
async function smoke(engine, dataRoot) {
  const { createPortablePanel } = await import(pathToFileURL(join(engine, 'console/painel/server/server.mjs')));
  const panel = createPortablePanel({ root: dataRoot, staticRoot: join(engine, 'console/painel/web'),
    updateReader: { read: async () => ({ state: 'unavailable', reason: 'offline-fixture' }) }, collectIntervalMs: 60000 });
  try {
    const port = await listen(panel.server);
    const url = `http://127.0.0.1:${port}`;
    const get = async path => { const response = await fetch(url + path); assert.equal(response.status, 200, path); return response.json(); };
    const html = await fetch(url); assert.equal(html.status, 200); assert.match(await html.text(), /<div id="root"/);
    for (const file of manifest.files.filter(file => file.path.startsWith('console/painel/web/'))) {
      const response = await fetch(url + '/' + file.path.slice('console/painel/web/'.length));
      assert.equal(response.status, 200, file.path);
      assert.equal(digest(Buffer.from(await response.arrayBuffer())), file.sha256, file.path);
    }
    const installed = await get('/api/painel/installed-systems');
    assert.equal(installed.available, true);
    assert(installed.systems.some(system => system.id === 'calls-decisoes'));
    assert(installed.systems.some(system => system.id === 'cerebro-base'));
    assert.equal(installed.systems.find(system => system.id === 'calls-decisoes').runs_total, 0);
    const catalog = await get('/api/catalog'); assert.equal(catalog.setup_required, true);
    const empty = await get('/api/painel/metrics/overview'); assert.deepEqual(empty.indicators, []);
    write(dataRoot, 'meu-negocio/nota-local.txt', 'Uma nota local em texto simples.');
    const note = await get('/api/cerebro/note?path=meu-negocio%2Fnota-local.txt');
    assert.equal(note.ok, true); assert.match(note.body, /Uma nota local/);
    write(dataRoot, '.cerebro/metrics/definitions.json', [{ key: 'sem-leitura', label: 'Aguardando fonte', unit: 'count', definition: 'Definição sem medição', source_ref: 'fonte-local' }]);
    for (const [day, value] of [[1, 4], [2, 5]]) write(dataRoot, `.cerebro/metrics/snapshots/dia-${day}.json`, {
      snapshot_id: `snapshot-${day}`, observed_at: `2026-10-0${day}T12:00:00Z`,
      source: { id: 'fonte-local', label: 'Registro aprovado' }, period: { start: `2026-10-0${day}`, end: `2026-10-0${day}`, timezone: 'UTC' },
      metrics: [{ key: 'entregas', label: 'Entregas aprovadas', unit: 'count', value, state: 'measured', definition: 'Entregas com aprovação registrada', numerator: value, denominator: 6 }],
    });
    const metrics = await get('/api/painel/metrics/overview');
    assert.equal(metrics.coverage.measured, 1); assert.equal(metrics.coverage.without_value, 1);
    const measured = metrics.indicators.find(item => item.key === 'entregas');
    assert.equal(measured.value, 5); assert.equal(measured.history_count, 2); assert.equal(measured.source.id, 'fonte-local');
    assert.equal(measured.period.start, '2026-10-02'); assert.equal(measured.numerator, 5); assert.equal(measured.denominator, 6);
    assert.equal(measured.workflow_effect, 'not_asserted'); assert.equal(measured.target_state, 'not-defined');
    assert.equal(metrics.indicators.find(item => item.key === 'sem-leitura').value, null);
    assert.equal((await get('/api/painel/metrics/overview?system=outro-sistema')).indicators.length, 0);
    assert.equal((await get('/api/painel/update')).reason, 'offline-fixture');
    assert.equal((await fetch(url + '/api/painel/webinar')).status, 404);
    write(dataRoot, 'privado/segredo.txt', 'SENTINEL_PRIVATE_CONTENT');
    const denied = await fetch(url + '/api/cerebro/note?path=privado%2Fsegredo.txt');
    assert.equal(denied.status, 404); assert.doesNotMatch(await denied.text(), /SENTINEL_PRIVATE_CONTENT/);
    // A mesma engine servindo outro diretório não pode reaproveitar métricas/contexto.
    return { engine_separate_from_data: engine !== dataRoot, assets: 11, installed_contracts: installed.systems.length, local_metrics: 2 };
  } finally { panel.collector.stop(); await closeServer(panel.server); }
}
async function cli(engine, root) {
  const script = join(engine, 'scripts/painel.mjs');
  assert.match(execFileSync(process.execPath, [script, '--help'], { encoding: 'utf8' }), /--root.*--no-open/);
  assert.throws(() => execFileSync(process.execPath, [script, '--no-open'], { stdio: 'pipe' }), /Use node scripts\/painel.mjs --root/);
  const occupied = createServer(); const occupiedPort = await listen(occupied);
  try {
    assert.throws(() => execFileSync(process.execPath, [script, '--root', root, '--port', String(occupiedPort), '--no-open'], { timeout: 10000, stdio: 'pipe' }), /Esta porta já está em uso/);
    assert.equal(occupied.listening, true);
  } finally { await closeServer(occupied); }
  const reservation = createServer(); const port = await listen(reservation); await closeServer(reservation);
  const child = spawn(process.execPath, [script, '--root', root, '--port', String(port), '--no-open'], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let output = '';
  const stopped = new Promise(resolveExit => child.once('exit', resolveExit));
  try {
    await new Promise((resolveReady, reject) => {
      const timer = setTimeout(() => reject(new Error('launcher-timeout')), 10000);
      child.on('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`launcher-exit:${code}:${output}`)); });
      child.stderr.on('data', chunk => { output += chunk; });
      child.stdout.on('data', chunk => { output += chunk; if (output.includes(`Painel: http://127.0.0.1:${port}`)) { clearTimeout(timer); resolveReady(); } });
    });
    assert.equal((await fetch(`http://127.0.0.1:${port}`)).status, 200);
  } finally { child.kill('SIGTERM'); await stopped; }
}
try {
  checkPackage(product);
  const fresh = join(sandbox, 'instalacao nova');
  assert.equal(installPackage(fresh, product, tag).written, false); assert(!existsSync(fresh));
  installPackage(fresh, product, tag, { apply: true }); checkPackage(fresh);
  const freshSmoke = await smoke(fresh, fresh); await cli(fresh, fresh);
  const baseline = join(sandbox, 'baseline'); mkdirSync(baseline);
  extrairTarGz(gzipSync(execFileSync('git', ['archive', '3b9a23018ff67d9a273d5019a51616d6130430c1'], { cwd: product, maxBuffer: 100 * 1024 * 1024 })), baseline);
  const member = join(sandbox, 'instalacao existente'); cpSync(baseline, member, { recursive: true });
  const sentinels = { 'meu-negocio/oferta.md': 'CONTEXT', '.cerebro/id': 'ID', '.cerebro/install-credential': 'CREDENTIAL',
    '.cerebro/source': readFileSync(join(member, '.cerebro/source'), 'utf8'), '.mcp.json': '{"mcpServers":{"existing":{}}}',
    '.agents/skills/pessoal/SKILL.md': 'OWN_SKILL', '.cerebro/contracts/sources/pessoal.json': '{"source_id":"own-source"}',
    'sistemas/outros-instalados/proprio/workspace/contexto.md': 'OWN_SYSTEM', 'comunidade/minhas-contribuicoes/propostas/local.txt': 'OWN_CONTRIBUTION' };
  for (const [path, value] of Object.entries(sentinels)) write(member, path, value);
  const claude = readFileSync(join(member, 'CLAUDE.md'), 'utf8') + '\nREGRA PRIVADA\n'; write(member, 'CLAUDE.md', claude);
  const legacyBefore = readFileSync(join(member, 'scripts/cockpit.mjs'));
  const plan = planUpdate(member, product, tag, { baseline }); assert.deepEqual(plan.conflicts, []);
  assert.equal(readFileSync(join(member, 'VERSION'), 'utf8').trim(), '1.39.1');
  applyPlan(member, plan, { approvePlan: plan.digest }); checkPackage(member);
  assert.equal(readFileSync(join(member, 'VERSION'), 'utf8').trim(), '1.40.0');
  for (const [path, value] of Object.entries(sentinels)) assert.equal(readFileSync(join(member, path), 'utf8'), value, path);
  assert.equal(readFileSync(join(member, 'CLAUDE.md'), 'utf8'), claude);
  assert.deepEqual(readFileSync(join(member, 'scripts/cockpit.mjs')), legacyBefore);
  const upgradedSmoke = await smoke(fresh, member);
  const replay = planUpdate(member, product, tag); assert.deepEqual(replay.conflicts, []); assert.equal(applyPlan(member, replay), null);
  console.log(JSON.stringify({ status: 'passed', version: '1.40.0', package_files: manifest.files.length, fresh: freshSmoke, upgrade: upgradedSmoke,
    private_sentinels_preserved: Object.keys(sentinels).length, claude_preserved: true, cockpit_preserved: true, idempotent: true, launcher: ['explicit-root', 'spaces', 'no-open', 'occupied-port'] }));
} finally { rmSync(sandbox, { recursive: true, force: true }); }
