#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSkillReadModel } from './lib/skill-read-model.mjs';

const root = mkdtempSync(join(tmpdir(), 'company-brain-skills-'));
const engineRoot = mkdtempSync(join(tmpdir(), 'company-brain-motor-skills-'));

function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

function skill(base, runtime, id, description = `Executa ${id}.`, { name = id, body = '' } = {}) {
  const content = `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${id}\n${body}`;
  write(join(base, runtime, 'skills', id, 'SKILL.md'), content);
  return content;
}

const call = skill(root, '.claude', 'call');
write(join(root, '.agents', 'skills', 'call', 'SKILL.md'), call);
skill(root, '.claude', 'private-skill');
skill(root, '.agents', 'private-skill', 'Runtime divergente.');
const broken = '# sem frontmatter canônico\n';
write(join(root, '.claude', 'skills', 'broken', 'SKILL.md'), broken);
write(join(root, '.agents', 'skills', 'broken', 'SKILL.md'), broken);

const engineCall = skill(engineRoot, '.claude', 'call', 'Call publicada pelo motor.');
write(join(engineRoot, '.agents', 'skills', 'call', 'SKILL.md'), engineCall);
const engineOnly = skill(engineRoot, '.claude', 'engine-only');
write(join(engineRoot, '.agents', 'skills', 'engine-only', 'SKILL.md'), engineOnly);
write(join(engineRoot, '.cerebro', 'motor.manifest'), '.claude/skills/call\n.claude/skills/engine-only\n.agents/skills\n');

write(join(root, '.cerebro', 'layout.json'), {
  version: 3,
  executorBindings: '.cerebro/runtime/executors',
});
write(join(root, '.cerebro', 'runtime', 'executors', 'executor-test.json'), {
  protocol_version: 1,
  binding_id: 'executor-test',
  adapter: 'codex-cli',
  host_ref: 'host-local',
  workspace_ref: 'brain-local',
  workspace_path: '.',
  auth: { type: 'provider-session', status: 'ready' },
  model_policy: { default_model: 'model-test', allowed_models: [] },
  permission_profile: 'read-only',
  observed_at: '2026-08-27T12:00:00.000Z',
  privacy: { credential_stored: false, content_shared_with_inevita: false },
});

write(join(root, 'systems', 'calls.md'), `# Calls\n\n## Skills e interfaces\n\n- **Principal:** \`call\`. private-skill é só texto, não declaração contratual.\n\n## Outra seção\n\n\`engine-only\` fora da seção não cria vínculo.\n`);

const model = buildSkillReadModel(root, {
  engineRoot,
  systems: [{ system_id: 'calls', source_manifest_ref: 'systems/calls.md' }],
});

assert.deepEqual(model.counts, {
  unique: 4,
  company: 3,
  engine: 2,
  shared: 1,
  available: 1,
  degraded: 2,
  linked: 1,
});
assert.deepEqual(model.skills.find((item) => item.skill_id === 'call').origins, ['company', 'engine']);
assert.deepEqual(model.skills.find((item) => item.skill_id === 'call').system_refs, ['calls']);
assert.deepEqual(model.skills.find((item) => item.skill_id === 'private-skill').system_refs, []);
assert.deepEqual(model.skills.find((item) => item.skill_id === 'engine-only').system_refs, []);
assert.equal(model.skills.find((item) => item.skill_id === 'engine-only').installation_status, 'motor-only');
assert.equal(model.skills.find((item) => item.skill_id === 'private-skill').installation_status, 'degraded');
assert(model.issues.some((issue) => issue.reason_code === 'skill-runtime-diverged' && issue.ref.includes('private-skill')));
assert(model.issues.some((issue) => issue.reason_code === 'skill-metadata-invalid' && issue.ref.includes('broken')));
assert.equal(model.executors.length, 1);
assert.deepEqual(model.executors[0], {
  binding_id: 'executor-test',
  adapter: 'codex-cli',
  auth_status: 'ready',
  default_model: 'model-test',
  allowed_models: [],
  permission_profile: 'read-only',
  observed_at: '2026-08-27T12:00:00.000Z',
  credential_stored: false,
  content_shared_with_inevita: false,
});
assert.deepEqual(model.privacy, {
  skill_body_exposed: false,
  credentials_exposed: false,
  reference_only: true,
});

const product = resolve(process.cwd());
const app = readFileSync(join(product, 'console', 'app.js'), 'utf8');
const index = readFileSync(join(product, 'console', 'index.html'), 'utf8');
const styles = readFileSync(join(product, 'console', 'styles.css'), 'utf8');
const server = readFileSync(join(product, 'scripts', 'console-server.mjs'), 'utf8');
const consoleReadModel = readFileSync(join(product, 'scripts', 'lib', 'console-read-model.mjs'), 'utf8');
assert.match(index, /data-view="skills"/, 'Skills precisam de navegação própria');
assert.match(app, /function renderSkills\(/, 'catálogo precisa de renderer próprio');
assert.match(app, /Modelos não são Skills/, 'modelos precisam manter a fronteira de bindings');
assert.match(app, /O corpo privado da Skill não é enviado ao navegador/, 'inspetor precisa declarar a fronteira reference-only');
assert.match(app, /getJson\('\/api\/skills'\)/, 'catálogo completo precisa carregar apenas ao abrir Skills');
assert.match(server, /url\.pathname === '\/api\/skills'/, 'servidor precisa de endpoint local dedicado');
assert.match(consoleReadModel, /countInstalledSkills\(root\)/, 'estado inicial deve carregar só a contagem da navegação');
assert.doesNotMatch(consoleReadModel, /skillModel\.skills/, 'descrições não podem pesar no estado inicial do Cockpit');
assert.match(styles, /\.skills-grid/, 'catálogo precisa da gramática visual do Cockpit');

console.log('company-brain-skills-v1: ok');
