import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { createCommunityToolHandler } from './lib/community-mcp.mjs';
import { buildCommunitySkillRelease, skillSlugsFromMotorManifest } from './export-community-skills.mjs';
import { installSkill, planSkillInstallation, projectSkillList, validateSkillBundle } from './lib/community-skill.mjs';
import { prepareSkillContribution, validateSkillContributionPackage, reviewContributionCandidate, approveContribution, sendContribution } from './lib/community-contribution.mjs';
import { hashCommunityPackage } from './lib/community-package.mjs';
import { syncAgentSkills } from './sync-agent-skills.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const uid = '86d68146-8358-4f09-9d31-d4711afc57eb';
function skill(overrides = {}) {
  const content = '# Example\nUse a source, then test a result.\n';
  const files = [{ path: 'SKILL.md', content, sha256: sha(content), size_bytes: Buffer.byteLength(content) }];
  return { skill_id: uid, slug: 'example-skill', name: 'Example skill', description: 'Reviews a source.', task: 'Review a source.', when_to_use: 'When a source is available.', author: 'Member',
    origin: 'society-member', license: 'CC BY-NC', version: '1.0.0', evidence_state: 'tested', source_kind: 'hosted',
    source_url: null, requirements: null, example: null, files,
    bundle_sha256: sha(JSON.stringify(files.map(({ path, sha256, size_bytes }) => ({ path, sha256, size_bytes })))), ...overrides };
}
const temporary = () => mkdtempSync(join(tmpdir(), 'community-skills-'));
function expectCode(fn, code) { assert.throws(fn, error => error.message === code); }

test('release skill export follows motor manifest, stays deterministic and has Claude/Agents parity', () => {
  const first = buildCommunitySkillRelease(resolve('.'));
  const second = buildCommunitySkillRelease(resolve('.'));
  assert.deepEqual(first, second);
  assert.equal(first.skills.length, 21);
  assert.equal(first.source_ref, 'v1.40.0');
  assert.match(first.source_commit, /^[a-f0-9]{40}$/);
  assert.equal(first.release_version, readFileSync('VERSION', 'utf8').trim());
  assert.equal(first.skills.find(item => item.slug === 'frameworks-visuais').files.some(file => file.path === 'SKILL.md'), true);
  assert.equal(first.skills.every(item => item.version === first.release_version && item.license === 'MIT'), true);
  assert.deepEqual(skillSlugsFromMotorManifest('.claude/skills/one\n.claude/skills/two\n'), ['one', 'two']);
  expectCode(() => skillSlugsFromMotorManifest('.claude/skills/one\n.claude/skills/one\n'), 'release-skills-manifest-invalid');
});

test('official skill sync preserves installed extras and blocks official-name replacement', () => {
  const root = temporary();
  const write = (name, body) => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), body); };
  try {
    write('.claude/skills/official/SKILL.md', '# Official\n');
    write('.agents/skills/official/SKILL.md', '# Official\n');
    write('.agents/skills/member-added/SKILL.md', '# Member\n');
    write('.agents/skills/member-added/.inevita-skill-origin.json', '{}\n');
    assert.equal(syncAgentSkills(root, { checkOnly: true }).official_skills, 1);
    syncAgentSkills(root);
    assert.equal(readFileSync(join(root, '.agents/skills/member-added/SKILL.md'), 'utf8'), '# Member\n');
    write('.agents/skills/official/.inevita-skill-origin.json', '{}\n');
    expectCode(() => syncAgentSkills(root), 'skill-official-overwrite-conflict:official');
    assert.equal(readFileSync(join(root, '.agents/skills/official/SKILL.md'), 'utf8'), '# Official\n');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('skill install verifies bytes and bundle, blocks traversal and never overwrites without exact existing hash', () => {
  const root = temporary();
  try {
    const candidate = skill();
    const plan = planSkillInstallation({ root, skill: candidate });
    assert.equal(plan.exists, false);
    assert.equal(existsSync(join(root, '.agents')), false);
    expectCode(() => installSkill({ root, skill: candidate, expectedSha256: '0'.repeat(64), expectedPlanSha256: plan.installation_plan_sha256, confirm: true }), 'skill_hash_mismatch');
    expectCode(() => installSkill({ root, skill: { ...candidate, origin: 'another-authorized-origin' },
      expectedSha256: candidate.bundle_sha256, expectedPlanSha256: plan.installation_plan_sha256, confirm: true }), 'skill_plan_changed');
    const installed = installSkill({ root, skill: candidate, expectedSha256: candidate.bundle_sha256, expectedPlanSha256: plan.installation_plan_sha256, confirm: true });
    assert.equal(installed.installed, true);
    assert.equal(readFileSync(join(root, '.agents/skills/example-skill/SKILL.md'), 'utf8'), candidate.files[0].content);
    const after = planSkillInstallation({ root, skill: candidate });
    assert.equal(after.exists, true);
    expectCode(() => installSkill({ root, skill: candidate, expectedSha256: candidate.bundle_sha256, expectedPlanSha256: after.installation_plan_sha256, confirm: true }), 'skill_overwrite_confirmation_required');
    expectCode(() => installSkill({ root, skill: candidate, expectedSha256: candidate.bundle_sha256, expectedPlanSha256: after.installation_plan_sha256, confirm: true,
      replaceExisting: true, existingTreeSha256: '0'.repeat(64) }), 'skill_overwrite_confirmation_required');
    const replaced = installSkill({ root, skill: candidate, expectedSha256: candidate.bundle_sha256, expectedPlanSha256: after.installation_plan_sha256, confirm: true,
      replaceExisting: true, existingTreeSha256: after.existing_tree_sha256 });
    assert.equal(replaced.replaced, true);
    expectCode(() => validateSkillBundle(skill({ files: [{ ...candidate.files[0], path: '../escape' }] })), 'invalid_skill_path');
    expectCode(() => validateSkillBundle(skill({ files: [{ ...candidate.files[0], content: 'changed' }] })), 'skill_hash_mismatch');
    expectCode(() => validateSkillBundle(skill({ version: '../invalid' })), 'invalid_skill_response');
    const caseFiles = [{ ...candidate.files[0] }, { path: 'skill.md', content: 'Other', sha256: sha('Other'), size_bytes: 5 }];
    expectCode(() => validateSkillBundle(skill({ files: caseFiles })), 'invalid_skill_response');
    const linked = skill({ source_kind: 'link', version: 'upstream/main', files: [], bundle_sha256: null, source_url: 'https://example.org/skill' });
    assert.equal(validateSkillBundle(linked).files.length, 0);
    expectCode(() => installSkill({ root, skill: linked, confirm: true }), 'skill_link_only');
    expectCode(() => validateSkillBundle({ ...linked, files: candidate.files }), 'skill_link_only');
    expectCode(() => projectSkillList({ items: [{ ...linked, bundle_sha256: candidate.bundle_sha256 }], limit: 12, offset: 0 }), 'invalid_skill_response');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('symlinks at destination or in skill file selection are refused', () => {
  const root = temporary(), outside = temporary();
  try {
    mkdirSync(join(root, '.agents')); symlinkSync(outside, join(root, '.agents/skills'));
    expectCode(() => planSkillInstallation({ root, skill: skill() }), 'skill_destination_unsafe');
    mkdirSync(join(root, 'selected')); writeFileSync(join(root, 'selected/SKILL.md'), '# Safe\n');
    symlinkSync(join(outside, 'outside.md'), join(root, 'selected/linked.md'));
    expectCode(() => prepareSkillContribution({ root, slug: 'mine', sourceDir: 'selected', selectedPaths: ['SKILL.md', 'linked.md'],
      version: '1.0.0', title: 'Mine', firstTask: 'Review source.', author: 'Member', license: 'MIT', whenToUse: 'When a source is available.',
      example: 'Sample input becomes a reviewed result.', summary: 'My method.', sharingRights: 'own_or_authorized', confirm: true }), 'unsafe_target');
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

test('dangling target is refused and a symlinked owner-selected root resolves safely', () => {
  const root = temporary(), outside = temporary();
  try {
    mkdirSync(join(root, '.agents/skills'), { recursive: true });
    symlinkSync(join(outside, 'missing'), join(root, '.agents/skills/example-skill'));
    expectCode(() => planSkillInstallation({ root, skill: skill() }), 'skill_destination_unsafe');
    symlinkSync(root, join(outside, 'linked'));
    rmSync(join(root, '.agents/skills/example-skill'));
    assert.equal(planSkillInstallation({ root: join(outside, 'linked'), skill: skill() }).exists, false);
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

test('skill contribution uses exact local review, approval and separate submission without private files', async () => {
  const root = temporary();
  const write = (name, text) => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), text); };
  try {
    write('method/SKILL.md', '# Review\nCheck a public example.\n');
    write('method/tests/example.md', 'Input: sample. Output: reviewed.\n');
    write('method/private.md', 'PRIVATE_SENTINEL');
    const args = { root, slug: 'review-sample', sourceDir: 'method', selectedPaths: ['SKILL.md', 'tests/example.md'],
      version: '1.0.0', title: 'Review sample', firstTask: 'Review a sample.', author: 'Member', license: 'MIT',
      whenToUse: 'When a sample needs review.', requirements: '', example: 'Input sample; expected reviewed sample.',
      summary: 'Public method.', sharingRights: 'own_or_authorized', confirm: true };
    const prepared = prepareSkillContribution(args);
    const reviewed = reviewContributionCandidate({ root, candidateId: prepared.candidate_id });
    const payload = JSON.parse(readFileSync(join(root, prepared.package_ref), 'utf8'));
    assert.equal(payload.kind, 'skill'); assert.equal(payload.files['private.md'], undefined);
    assert.equal(payload.requirements, '');
    expectCode(() => validateSkillContributionPackage({ ...payload, files: { ...payload.files,
      'skill.md': { content: 'Other', sha256: sha('Other'), size_bytes: 5 } } }), 'invalid_skill_package');
    expectCode(() => validateSkillContributionPackage({ ...payload, files: { ...payload.files,
      'tests': { content: 'Other', sha256: sha('Other'), size_bytes: 5 } } }), 'invalid_skill_package');
    assert.equal(reviewed.package_sha256, hashCommunityPackage(payload));
    assert.equal(reviewed.file_count, 2);
    expectCode(() => prepareSkillContribution({ ...args, selectedPaths: ['tests/example.md'] }), 'explicit_selection_required');
    expectCode(() => prepareSkillContribution({ ...args, sharingRights: undefined }), 'sharing_rights_required');
    write('.agents/skills/third-party/SKILL.md', '# External\n');
    expectCode(() => prepareSkillContribution({ ...args, sourceDir: '.agents/skills/third-party', selectedPaths: ['SKILL.md'] }), 'third_party_skill_source_refused');
    write('method/big.md', 'a'.repeat(64 * 1024 + 1));
    expectCode(() => prepareSkillContribution({ ...args, selectedPaths: ['SKILL.md', 'big.md'] }), 'invalid_file_size');
    const calls = [];
    const client = { submitContribution: async body => { calls.push(body); return { contribution: { id: uid, package_sha256: body.package_sha256 } }; } };
    await assert.rejects(sendContribution({ root, candidateId: prepared.candidate_id, packageSha256: prepared.package_sha256, client, confirm: true }), /approval_required/);
    approveContribution({ root, candidateId: prepared.candidate_id, packageSha256: prepared.package_sha256, confirm: true });
    const sent = await sendContribution({ root, candidateId: prepared.candidate_id, packageSha256: prepared.package_sha256, client, confirm: true });
    assert.equal(sent.published, false); assert.equal(calls[0].kind, 'skill'); assert.equal(calls[0].package.kind, 'skill');
    assert.equal(JSON.stringify(calls[0]).includes('PRIVATE_SENTINEL'), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('skill guidance and contribution controls survive the MCP tool handler and HTTP transport', async () => {
  const root = temporary();
  const submitted = [];
  const server = createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    submitted.push(JSON.parse(body));
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ contribution: { id: uid, package_sha256: submitted.at(-1).package_sha256 } }));
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  try {
    mkdirSync(join(root, 'method')); writeFileSync(join(root, 'method/SKILL.md'), '# A method\nReview a synthetic example.\n');
    mkdirSync(join(root, '.cerebro')); writeFileSync(join(root, '.cerebro/id'), uid);
    writeFileSync(join(root, '.cerebro/install-credential'), 'x'.repeat(43));
    const handler = createCommunityToolHandler({ root, endpoint: `http://127.0.0.1:${server.address().port}`, allowLocalhost: true });
    const questions = await handler('orientar_nova_skill', {});
    assert.equal(questions.isError, false);
    assert.equal(questions.structuredContent.ready, false);
    assert.equal(questions.structuredContent.missing_questions.length, 8);
    const ready = await handler('orientar_nova_skill', { title: 'Review sample', author: 'Member', license: 'MIT',
      use_case: 'Review a sample.', when_to_use: 'When a sample needs review.', method_steps: ['Read', 'Check'],
      test_example: 'Input sample; expected reviewed sample.', sharing_rights: 'own_or_authorized' });
    assert.equal(ready.structuredContent.ready, true);
    assert.deepEqual(ready.structuredContent.missing_questions, []);
    const prepared = await handler('preparar_skill', { slug: 'review-sample', source_dir: 'method', selected_paths: ['SKILL.md'],
      version: '1.0.0', title: 'Review sample', first_task: 'Review a sample.', author: 'Member', license: 'MIT',
      when_to_use: 'When a sample needs review.', example: 'Input sample; expected reviewed sample.',
      summary: 'Public method.', sharing_rights: 'own_or_authorized', confirmar: true });
    assert.equal(prepared.isError, false);
    const candidateId = prepared.structuredContent.candidate_id;
    const reviewed = await handler('revisar_contribuicao_local', { candidate_id: candidateId });
    assert.equal(reviewed.isError, false);
    const packageSha256 = reviewed.structuredContent.package_sha256;
    const approved = await handler('autorizar_envio_contribuicao', { candidate_id: candidateId, package_sha256: packageSha256, confirmar: true });
    assert.equal(approved.isError, false);
    const sent = await handler('enviar_contribuicao', { candidate_id: candidateId, package_sha256: packageSha256, confirmar: true });
    assert.equal(sent.isError, false);
    assert.equal(submitted.length, 1);
    assert.equal(submitted[0].action, 'submit_contribution');
    assert.equal(submitted[0].kind, 'skill');
    assert.equal(submitted[0].package.author, 'Member');
    assert.equal(submitted[0].package.requirements, '');
    assert.equal(submitted[0].package.files['SKILL.md'].content, '# A method\nReview a synthetic example.\n');
  } finally { await new Promise(done => server.close(done)); rmSync(root, { recursive: true, force: true }); }
});

test('MCP revalidates Society for list, detail and install and never writes a third-party link', async () => {
  const root = temporary();
  const requests = [];
  const server = createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    const input = JSON.parse(body); requests.push(input.action);
    res.setHeader('content-type', 'application/json');
    if (requests.length > 3) { res.statusCode = 403; res.end(JSON.stringify({ error: 'society_access_required' })); return; }
    if (input.action === 'list_skills') res.end(JSON.stringify({ items: [skill({ files: undefined })], limit: 12, offset: 0 }));
    else res.end(JSON.stringify(skill()));
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  try {
    writeFileSync(join(root, 'VERSION'), '1.40.0');
    mkdirSync(join(root, '.cerebro')); writeFileSync(join(root, '.cerebro/id'), uid);
    writeFileSync(join(root, '.cerebro/install-credential'), 'x'.repeat(43));
    const handler = createCommunityToolHandler({ root, endpoint: `http://127.0.0.1:${server.address().port}`, allowLocalhost: true });
    const listed = await handler('listar_skills', {}); assert.equal(listed.isError, false);
    const detail = await handler('obter_skill', { skill_id: uid }); assert.equal(detail.isError, false);
    assert.equal(detail.structuredContent.files[0].path, 'SKILL.md');
    const plan = await handler('planejar_instalacao_skill', { skill_id: uid }); assert.equal(plan.isError, false);
    const denied = await handler('instalar_skill', { skill_id: uid, bundle_sha256: skill().bundle_sha256,
      installation_plan_sha256: plan.structuredContent.installation_plan_sha256, confirmar: true });
    assert.equal(denied.isError, true); assert.equal(existsSync(join(root, '.agents')), false);
    assert.deepEqual(requests, ['list_skills', 'get_skill', 'get_skill', 'get_skill']);
  } finally { await new Promise(done => server.close(done)); rmSync(root, { recursive: true, force: true }); }
});
