import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { COMMUNITY_TOOLS, communityMetadata, createCommunityToolHandler } from './lib/community-mcp.mjs';
import { createMcpSession, serveMcpStdio } from './lib/community-mcp-protocol.mjs';
import { communityMcpConfiguration } from './community-mcp-config.mjs';
import { parseCommunityMcpArguments } from './community-mcp.mjs';
import { funilContracts } from './build-funil-community-package.mjs';
import { encodeCommunityFile, installCommunityPackage } from './lib/community-package.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const initialize = { jsonrpc: '2.0', id: 1, method: 'initialize', params: {
  protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'synthetic-test', version: '1' },
} };
const initialized = { jsonrpc: '2.0', method: 'notifications/initialized' };
const request = (id, name, args = {}) => ({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });
async function ready(callTool = async () => ({ content: [] })) {
  const handle = createMcpSession({ tools: COMMUNITY_TOOLS, callTool });
  await handle(initialize); await handle(initialized); return handle;
}
async function framed(chunks, options = {}) {
  let output = '';
  const stream = new Writable({ write(chunk, encoding, callback) { output += chunk; callback(); } });
  const handle = createMcpSession({ tools: COMMUNITY_TOOLS, callTool: async () => ({ content: [] }) });
  await serveMcpStdio({ input: Readable.from(chunks), output: stream, handle, ...options });
  return output.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
}

test('lifecycle requires initialize and initialized before tools; negotiates preferred supported protocol', async () => {
  const handle = createMcpSession({ tools: COMMUNITY_TOOLS, callTool: async () => ({ content: [] }) });
  assert.equal((await handle(request(2, 'listar_sistemas_comunidade'))).error.code, -32002);
  assert.equal((await handle({ ...initialize, params: { ...initialize.params, protocolVersion: '2099-01-01' } })).result.protocolVersion, '2025-06-18');
  assert.equal((await handle(request(3, 'listar_sistemas_comunidade'))).error.code, -32002);
  assert.deepEqual((await handle({ jsonrpc: '2.0', id: 4, method: 'ping' })).result, {});
  assert.equal(await handle(initialized), null);
  assert.ok((await handle(request(5, 'listar_sistemas_comunidade'))).result);
  assert.equal((await handle(initialize)).error.code, -32600);
});

test('tools list has only member community operations, and enterprise/curator calls are refused', async () => {
  let calls = 0;
  const handle = await ready(async () => { calls++; return { content: [] }; });
  const result = await handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.equal(result.result.tools.length, 10);
  for (const name of ['minhas_tarefas', 'buscar', 'ler', 'solicitar_vinculo_trabalho', 'review_contribution', 'publish_contribution', 'publicar_sistema_comunidade']) {
    assert.ok(!result.result.tools.some(tool => tool.name === name));
    assert.equal((await handle(request(3, name))).error.code, -32602);
  }
  assert.equal(calls, 0);
});

test('invalid args, missing consent, identity injection and tool notifications cannot mutate', async () => {
  let calls = 0;
  const handle = await ready(async () => { calls++; return { content: [] }; });
  const base = { slug: 'funil-e-crescimento', package_sha256: 'a'.repeat(64), confirmar: true };
  for (const args of [{ ...base, confirmar: false }, { ...base, confirmar: 'true' }, { ...base, package_sha256: 'wrong' },
    { ...base, member_id: 'other-person' }, { ...base, install_credential: 'fixture-secret' },
    { ...base, endpoint: 'https://evil.example' }, [], null]) {
    assert.equal((await handle(request(4, 'instalar_sistema_comunidade', args))).error.code, -32602);
  }
  const notification = request(5, 'instalar_sistema_comunidade', base); delete notification.id;
  assert.equal(await handle(notification), null);
  assert.equal(calls, 0);
  assert.equal((await handle(request(7, 'listar_sistemas_comunidade', null))).error.code, -32602);
  await handle(request(6, 'instalar_sistema_comunidade', base));
  assert.equal(calls, 1);
});

test('stdio framing bounds bytes, rejects invalid UTF-8 and recovers for the next message', async () => {
  const rows = await framed([Buffer.from('x'.repeat(100) + '\n'), Buffer.from([0xff, 10]), Buffer.from('{oops}\n'),
    Buffer.from(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'ping' }) + '\n')], { maxInputBytes: 80 });
  assert.deepEqual(rows.map(row => row.error.code), [-32600, -32700, -32700, -32002]);
  const split = Buffer.from(JSON.stringify(initialize) + '\n' + JSON.stringify(initialized) + '\n', 'utf8');
  assert.equal((await framed([split.subarray(0, 9), split.subarray(9)])).length, 1);
  assert.equal((await framed([Buffer.from('{}')]))[0].error.code, -32700);
});

test('protocol errors and handler exceptions do not echo supplied secrets', async () => {
  const handle = await ready(async () => { throw new Error('secret-install-credential'); });
  const out = await handle(request(4, 'listar_sistemas_comunidade'));
  assert.equal(out.result.isError, true);
  assert.ok(!JSON.stringify(out).includes('secret-install-credential'));
  assert.equal((await handle([{ jsonrpc: '2.0', id: 1, method: 'ping' }])).error.code, -32600);
  assert.equal((await handle({ jsonrpc: '2.0', id: null, method: 'ping' })).error.code, -32600);
});

test('oversized result produces a bounded protocol error instead of partial content', async () => {
  const rows = await framed([Buffer.from('{}\n')], { handle: async () => ({ jsonrpc: '2.0', id: 9, result: { content: 'x'.repeat(1000) } }), maxOutputBytes: 200 });
  assert.equal(rows[0].id, 9);
  assert.equal(rows[0].error.code, -32603);
  assert.ok(Buffer.byteLength(JSON.stringify(rows[0])) < 200);
});

test('adapter delegates to shared services and never exposes grants, credentials or package bytes', async () => {
  const calls = [];
  const services = {
    list: async () => ({ releases: [{ slug: 'funil', version: '0.2.0', grant_token: 'secret', package: { private: 'sentinel' } }], install_credential: 'secret' }),
    details: async slug => ({ release: { slug, title: 'Funil', package_sha256: 'a'.repeat(64) } }),
    install: async args => { calls.push(['install', args]); return { installed: args.confirm, grant_token: 'secret' }; },
    prepare: async args => { calls.push(['prepare', args]); return { candidate_id: 'candidate-1', package_sha256: 'b'.repeat(64) }; },
    localReview: async candidateId => ({ candidate_id: candidateId, files: [{ path: 'metodo/regra.md', bytes: 10, content: 'private-selected-bytes' }], risks: [] }),
    approve: async args => { calls.push(['approve', args]); return { approved: true }; },
    send: async args => { calls.push(['send', args]); return { sent: true, contribution: { id: 'remote-1', status: 'submitted' } }; },
    contributions: async () => ({ contributions: [], can_review: false }),
    contribution: async id => ({ contribution: { id, status: 'submitted' }, package: { content: 'secret-package' } }),
  };
  const handler = createCommunityToolHandler({ root: ROOT, services });
  const list = await handler('listar_sistemas_comunidade', {});
  assert.ok(!JSON.stringify(list).includes('secret'));
  assert.ok(!JSON.stringify(list).includes('sentinel'));
  await handler('planejar_instalacao_sistema', { slug: 'funil' });
  await handler('instalar_sistema_comunidade', { slug: 'funil', package_sha256: 'a'.repeat(64), confirmar: true });
  assert.deepEqual(calls.slice(0, 2), [['install', { slug: 'funil', confirm: false }], ['install', { slug: 'funil', expectedSha256: 'a'.repeat(64), confirm: true }]]);
  const review = await handler('revisar_contribuicao_local', { candidate_id: 'candidate-1' });
  assert.ok(!JSON.stringify(review).includes('private-selected-bytes'));
  await handler('autorizar_envio_contribuicao', { candidate_id: 'candidate-1', package_sha256: 'b'.repeat(64), confirmar: true });
  assert.equal(calls.at(-1)[0], 'approve');
  assert.ok(!calls.some(([kind]) => kind === 'send'));
  await handler('enviar_contribuicao', { candidate_id: 'candidate-1', package_sha256: 'b'.repeat(64), confirmar: true });
  assert.deepEqual(calls.at(-1), ['send', { candidateId: 'candidate-1', packageSha256: 'b'.repeat(64), confirm: true }]);
  assert.ok(!JSON.stringify(await handler('status_contribuicao', { contribution_id: 'remote-1' })).includes('secret-package'));
});

test('shared service failure after revocation is not cached as success and errors are safe', async () => {
  let permitted = true, calls = 0;
  const handler = createCommunityToolHandler({ root: ROOT, services: { list: async () => {
    calls++;
    if (!permitted) throw Object.assign(new Error('credential=hidden'), { code: 'access_denied' });
    return { releases: [{ slug: 'funil' }] };
  } } });
  assert.equal((await handler('listar_sistemas_comunidade', {})).isError, false);
  permitted = false;
  const denied = await handler('listar_sistemas_comunidade', {});
  assert.equal(denied.isError, true);
  assert.equal(calls, 2);
  assert.ok(!JSON.stringify(denied).includes('credential'));
});

test('real subprocess stdio emits protocol only, never global configuration or environment', async () => {
  const root = mkdtempSync(join(tmpdir(), 'mcp comunidade '));
  try {
    const frames = [initialize, initialized, { jsonrpc: '2.0', id: 2, method: 'tools/list' }, request(3, 'publish_contribution')];
    const result = await new Promise((accept, reject) => {
      const child = spawn(process.execPath, [join(ROOT, 'scripts/community-mcp.mjs'), `--root=${root}`], {
        stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, CEREBRO_TEST_SECRET: 'never-output-this-fixture' },
      });
      let stdout = '', stderr = '';
      child.stdout.on('data', chunk => { stdout += chunk; });
      child.stderr.on('data', chunk => { stderr += chunk; });
      child.on('error', reject);
      child.on('close', code => accept({ stdout, stderr, code }));
      child.stdin.end(frames.map(frame => JSON.stringify(frame)).join('\n') + '\n');
    });
    assert.equal(result.code, 0);
    assert.equal(result.stderr, '');
    assert.ok(!result.stdout.includes('never-output-this-fixture'));
    const rows = result.stdout.trim().split('\n').map(line => JSON.parse(line));
    assert.equal(rows.length, 3);
    assert.equal(rows[1].result.tools.length, 10);
    assert.equal(rows[2].error.code, -32602);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('configuration is generated without secrets or writes and CLI never accepts credentials', () => {
  const before = readFileSync(join(ROOT, 'AGENTS.md'));
  const config = communityMcpConfiguration({ root: ROOT });
  const server = config.mcpServers['inevita-comunidade'];
  assert.equal(server.command, process.execPath);
  assert.deepEqual(server.args, [join(ROOT, 'scripts/community-mcp.mjs'), `--root=${ROOT}`]);
  assert.deepEqual(readFileSync(join(ROOT, 'AGENTS.md')), before);
  assert.throws(() => parseCommunityMcpArguments(['--credential=secret']), /arguments-invalid/);
  assert.throws(() => parseCommunityMcpArguments(['--root=a', '--root=b']), /arguments-invalid/);
  assert.throws(() => parseCommunityMcpArguments([]), /root-required/);
  assert.deepEqual(communityMetadata({ install_credential: 'x', grant_token: 'y', package: { files: {} }, actor: 'private', status: 'submitted' }), { status: 'submitted' });
});

test('real stdio client uses installation service identity and rechecks access after revocation', { timeout: 10000 }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'mcp comunidade rede '));
  const credential = 'x'.repeat(43), id = 'a69783b0-5c33-4995-b638-492dd20c02a5';
  mkdirSync(join(root, '.cerebro'));
  writeFileSync(join(root, '.cerebro/id'), id);
  writeFileSync(join(root, '.cerebro/install-credential'), credential, { mode: 0o600 });
  let permitted = true, echoSecret = false;
  const actions = [];
  const server = createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const payload = JSON.parse(raw);
    actions.push(payload.action);
    assert.equal(payload.install_id, id);
    assert.equal(payload.install_credential, credential);
    assert.equal(payload.member_id, undefined);
    res.setHeader('content-type', 'application/json');
    if (!permitted) { res.statusCode = 403; res.end(JSON.stringify({ error: 'access_denied' })); return; }
    res.end(JSON.stringify({ releases: [{ slug: 'funil-e-crescimento', title: echoSecret ? credential : 'Funil', version: '0.2.0-rc.1', first_task: 'Conferir a oferta', package_sha256: 'a'.repeat(64) }] }));
  });
  await new Promise(accept => server.listen(0, '127.0.0.1', accept));
  const child = spawn(process.execPath, [join(ROOT, 'scripts/community-mcp.mjs'), `--root=${root}`, `--endpoint=http://127.0.0.1:${server.address().port}`], {
    stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, CEREBRO_COMMUNITY_ALLOW_LOCALHOST: 'true' },
  });
  let output = '', buffer = '', stderr = '';
  const pending = new Map();
  child.stderr.on('data', chunk => { stderr += chunk; });
  child.stdout.on('data', chunk => {
    output += chunk; buffer += chunk;
    let index;
    while ((index = buffer.indexOf('\n')) >= 0) {
      const row = JSON.parse(buffer.slice(0, index)); buffer = buffer.slice(index + 1);
      const complete = pending.get(row.id); if (complete) { pending.delete(row.id); complete(row); }
    }
  });
  const send = message => new Promise(accept => { pending.set(message.id, accept); child.stdin.write(JSON.stringify(message) + '\n'); });
  try {
    await send(initialize);
    child.stdin.write(JSON.stringify(initialized) + '\n');
    const listed = await send(request(2, 'listar_sistemas_comunidade'));
    assert.equal(listed.result.isError, false);
    assert.equal(listed.result.structuredContent.releases[0].slug, 'funil-e-crescimento');
    permitted = false;
    assert.equal((await send(request(3, 'listar_sistemas_comunidade'))).result.isError, true);
    permitted = true; echoSecret = true;
    assert.equal((await send(request(4, 'listar_sistemas_comunidade'))).result.isError, true);
    assert.deepEqual(actions, ['list_releases', 'list_releases', 'list_releases']);
    assert.ok(!output.includes(credential));
    assert.ok(!output.includes(id));
    assert.equal(stderr, '');
  } finally {
    child.stdin.end();
    await new Promise(accept => child.once('close', accept));
    await new Promise(accept => server.close(accept));
    rmSync(root, { recursive: true, force: true });
  }
});

test('MCP uses real contribution services: selected change, local review, exact approval and separate send', { timeout: 10000 }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'mcp contribuição '));
  const write = (relative, content) => { mkdirSync(dirname(join(root, relative)), { recursive: true }); writeFileSync(join(root, relative), content); };
  write('COMECE-AQUI.md', '# Cérebro sintético'); write('VERSION', '1.38.0');
  write('.cerebro/id', 'a69783b0-5c33-4995-b638-492dd20c02a5'); write('.cerebro/install-credential', 'x'.repeat(43));
  const packet = { schema_version: 2, slug: 'funil-e-crescimento', system_id: 'sistema-funil-inevita',
    version: '0.2.0-rc.1', title: 'Funil de teste sintético', entrypoint: 'COMECE-AQUI.md', first_task: 'Conferir a oferta',
    files: { 'COMECE-AQUI.md': encodeCommunityFile(Buffer.from('# Comece')), 'metodo/oferta.md': encodeCommunityFile(Buffer.from('Regra anterior.')) },
    contracts: funilContracts('0.2.0-rc.1') };
  const installed = installCommunityPackage({ root, package: packet, confirm: true });
  write(`${installed.refs.workspace}/metodo/oferta.md`, 'Abra com o trabalho concreto que o comprador quer resolver.');
  write(`${installed.refs.workspace}/contexto/segredo.md`, 'PRIVATE_SENTINEL_NEVER_SHARE');
  let submissions = 0, received;
  const server = createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    received = JSON.parse(raw); submissions++;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ contribution: { id: 'a69783b0-5c33-4995-b638-492dd20c02a6', status: 'submitted', package_sha256: received.package_sha256 } }));
  });
  await new Promise(accept => server.listen(0, '127.0.0.1', accept));
  const handler = createCommunityToolHandler({ root, endpoint: `http://127.0.0.1:${server.address().port}`, allowLocalhost: true });
  const handle = await ready(handler);
  try {
    const prepared = (await handle(request(2, 'preparar_contribuicao', { slug: packet.slug, source_dir: installed.refs.workspace,
      selected_paths: ['metodo/oferta.md'], version: '0.2.1', summary: 'Abertura concreta na oferta.', confirmar: true }))).result;
    assert.equal(prepared.isError, false, JSON.stringify(prepared));
    const { candidate_id, package_sha256 } = prepared.structuredContent;
    const reviewed = (await handle(request(3, 'revisar_contribuicao_local', { candidate_id }))).result;
    assert.equal(reviewed.isError, false);
    assert.equal(reviewed.structuredContent.package_sha256, package_sha256);
    assert.ok(reviewed.structuredContent.package_ref);
    assert.deepEqual(reviewed.structuredContent.selected_paths, ['metodo/oferta.md']);
    assert.ok(!JSON.stringify(reviewed).includes('PRIVATE_SENTINEL_NEVER_SHARE'));
    assert.ok(!JSON.stringify(reviewed).includes('Abra com o trabalho concreto'));
    const consent = { candidate_id, package_sha256, confirmar: true };
    assert.equal((await handle(request(4, 'enviar_contribuicao', consent))).result.isError, true);
    assert.equal(submissions, 0);
    assert.equal((await handle(request(5, 'autorizar_envio_contribuicao', consent))).result.structuredContent.status, 'approved_for_submission');
    assert.equal(submissions, 0);
    const sent = (await handle(request(6, 'enviar_contribuicao', consent))).result;
    assert.equal(sent.structuredContent.status, 'submitted');
    assert.equal(sent.structuredContent.published, false);
    assert.equal(submissions, 1);
    assert.equal(received.action, 'submit_contribution');
    assert.equal(received.share_confirmed, true);
    assert.equal(received.package_sha256, package_sha256);
    assert.ok(!JSON.stringify(received.package).includes('PRIVATE_SENTINEL_NEVER_SHARE'));
    assert.ok(!JSON.stringify(sent).includes('x'.repeat(43)));
  } finally {
    await new Promise(accept => server.close(accept));
    rmSync(root, { recursive: true, force: true });
  }
});
