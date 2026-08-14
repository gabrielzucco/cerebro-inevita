#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const source = resolve(process.cwd());
const grant = 'a'.repeat(43);
const manifest = {
  schema_version: 1,
  system_id: 'calls-decisoes',
  name: 'Calls em Decisões',
  release: { version: '0.2.0', channel: 'beta', minimum_brain_version: '1.12.2' },
  validation: { stage: 'beta', access_mode: 'society_members' },
  skill: { name: 'call', command: '/call' },
};
const files = {
  'manifest.json': `${JSON.stringify(manifest, null, 2)}\n`,
  'manifest.md': '# Calls em Decisões\n',
  'pipeline.md': '# Pipeline\n',
  'rotinas.md': '# Rotinas\n',
  'evals.md': '# Evals\n',
  'changelog.md': '# Changelog\n',
  'feedback.template.md': '# Feedback privado\n',
  'configuracao.template.md': '# Configuração privada\n',
  'skill/SKILL.md': '---\nname: call\n---\n# /call\n',
};
const bundle = {
  schema_version: 1,
  slug: 'calls',
  system_id: 'calls-decisoes',
  version: '0.2.0',
  files,
};

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const checksum = createHash('sha256').update(stableStringify(bundle)).digest('hex');

function run(args, sandbox, url) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [join(source, 'scripts', 'install-system.mjs'), ...args], {
      cwd: source,
      env: {
        ...process.env,
        CEREBRO_INSTALL_ROOT: sandbox,
        CEREBRO_DISTRIBUTION_URL: url,
        CEREBRO_TELEMETRY: 'off',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolvePromise({ stdout, stderr });
      else reject(new Error(`install-system saiu ${code}: ${stderr || stdout}`));
    });
  });
}

const requests = [];
const server = createServer(async (request, response) => {
  let raw = '';
  for await (const chunk of request) raw += chunk;
  const body = JSON.parse(raw || '{}');
  requests.push(body);
  response.setHeader('Content-Type', 'application/json');
  if (body.action === 'redeem_grant') {
    response.end(JSON.stringify({ package: bundle, package_sha256: checksum }));
    return;
  }
  if (body.action === 'installation_receipt') {
    response.end(JSON.stringify({ installed: true }));
    return;
  }
  response.statusCode = 400;
  response.end(JSON.stringify({ error: 'invalid_action' }));
});

await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('servidor de teste não abriu');
const url = `http://127.0.0.1:${address.port}`;
const sandbox = mkdtempSync(join(tmpdir(), 'cerebro-grant-install-'));

try {
  writeFileSync(join(sandbox, 'COMECE-AQUI.md'), '# teste\n');
  writeFileSync(join(sandbox, 'VERSION'), '1.12.2\n');
  mkdirSync(join(sandbox, '.cerebro'), { recursive: true });
  writeFileSync(join(sandbox, '.cerebro', 'id'), '3f2504e0-4f89-41d3-9a0c-0305e82c3301\n');
  mkdirSync(join(sandbox, '.cerebro', 'sistemas'), { recursive: true });
  writeFileSync(join(sandbox, '.cerebro', 'sistemas', 'calls.json'), `${JSON.stringify({
    slug: 'calls',
    system_id: 'calls-decisoes',
    package_version: '0.1.0',
    package_sha256: 'f'.repeat(64),
    status: 'active',
    run_count: 4,
    approved_run_count: 3,
    first_value_confirmed: true,
  }, null, 2)}\n`);

  await run([
    'calls',
    '--confirm',
    `--grant=${grant}`,
    `--sha256=${checksum}`,
    '--runtime=codex',
  ], sandbox, url);

  if (requests.length !== 2) throw new Error(`esperava redeem + receipt; recebeu ${requests.length}`);
  if (requests[0].action !== 'redeem_grant' || requests[1].action !== 'installation_receipt') {
    throw new Error('ordem do protocolo remoto incorreta');
  }
  if (requests[0].install_id !== requests[1].install_id) throw new Error('recibo mudou install-id');
  if (requests[1].runtime !== 'codex') throw new Error('runtime não chegou ao recibo');

  const statePath = join(sandbox, '.cerebro', 'sistemas', 'calls.json');
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  if (state.slug !== 'calls' || state.system_id !== 'calls-decisoes') throw new Error('slug e system-id foram confundidos');
  if (state.package_version !== '0.2.0' || state.package_sha256 !== checksum) throw new Error('release não foi fixado no estado');
  if (state.status !== 'package_added' || 'first_value_confirmed' in state) {
    throw new Error('release nova herdou prova operacional da release antiga');
  }
  if (JSON.stringify(state).includes(grant)) throw new Error('grant persistido no estado local');
  if (!existsSync(join(sandbox, '.agents', 'skills', 'call', 'SKILL.md'))) throw new Error('skill /call não instalada no Codex');
  if (!existsSync(join(sandbox, '.claude', 'skills', 'call', 'SKILL.md'))) throw new Error('skill /call não instalada no Claude Code');
  if (!existsSync(join(sandbox, 'sistemas', 'outros-instalados', 'calls', 'manifest.md'))) throw new Error('pacote não instalado');

  const stateBeforeTamper = readFileSync(statePath, 'utf8');
  let tamperRefused = false;
  try {
    await run([
      'calls',
      '--confirm',
      `--grant=${'b'.repeat(43)}`,
      `--sha256=${'0'.repeat(64)}`,
      '--runtime=codex',
    ], sandbox, url);
  } catch (error) {
    tamperRefused = String(error).includes('não confere com a versão autorizada');
  }
  if (!tamperRefused) throw new Error('checksum divergente não foi recusado');
  if (readFileSync(statePath, 'utf8') !== stateBeforeTamper) throw new Error('checksum divergente alterou o estado local');
  if (requests.filter((request) => request.action === 'installation_receipt').length !== 1) {
    throw new Error('pacote recusado enviou recibo de instalação');
  }

  console.log('✓ grant remoto: checksum, pacote, skill, recibo e separação slug/system-id');
} finally {
  await new Promise((resolvePromise) => server.close(resolvePromise));
  rmSync(sandbox, { recursive: true, force: true });
}
