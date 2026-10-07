#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { AUTHORING_BRIEF_SCHEMA, AUTHORING_LIMITS, inspectOriginalSystemFiles, interviewOriginalSystem, prepareOriginalSystem, previewOriginalSystem } from './lib/community-authoring.mjs';
import { matchesSchema } from './lib/community-mcp-protocol.mjs';
import { approveContribution, getPreparedContribution, prepareReleaseContribution, reviewContributionCandidate, sendContribution } from './lib/community-contribution.mjs';
import { communityHash, encodeCommunityFile, validateCommunityPackage } from './lib/community-package.mjs';

const brief = {
  title: 'Métricas semanais', purpose: 'Calcular a conversão de leads em vendas.', audience: 'Operadores de vendas.',
  trigger: 'Fechamento semanal', inputs: ['Leads e vendas no mesmo período'],
  steps: ['Conferir período e denominadores', 'Calcular vendas dividido por leads e multiplicar por 100', 'Revisar resultado e registrar a decisão'],
  output: 'Tabela de conversão e lacunas', done_when: ['A conta reproduz o exemplo fictício', 'Período e denominador informados'],
  limits: ['Não compara períodos diferentes'], first_task: 'Calcular a conversão do exemplo fictício',
  example: { input: '20 leads e 4 vendas na mesma semana', expected_output: '20% de conversão' }, sharing_rights: 'own_or_authorized',
};
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'community authoring '));
  mkdirSync(join(root, 'sistemas/metricas'), { recursive: true });
  writeFileSync(join(root, 'sistemas/metricas/metodo.md'), '# Método de métricas\nUse o mesmo período no numerador e denominador.\n');
  writeFileSync(join(root, 'sistemas/metricas/exemplo.csv'), 'leads,vendas\n20,4\n');
  writeFileSync(join(root, 'sistemas/metricas/nao-selecionado.md'), 'PRIVATE_SENTINEL_NOT_SELECTED');
  writeFileSync(join(root, 'COMECE-AQUI.md'), '# Cérebro sintético'); writeFileSync(join(root, 'VERSION'), '1.39.0');
  const args = { root, brief, sourceDir: 'sistemas/metricas', selectedPaths: ['metodo.md', 'exemplo.csv'] };
  return { root, args, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
function snapshot(root, prefix = '') {
  return readdirSync(join(root, prefix), { withFileTypes: true }).flatMap(entry => {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) return [`${path}:symlink`];
    return entry.isDirectory() ? snapshot(root, path) : [`${path}:${communityHash(readFileSync(join(root, path)))}`];
  }).sort();
}
function stage(f) {
  const preview = previewOriginalSystem(f.args);
  return prepareOriginalSystem({ ...f.args, expectedSha256: preview.package_sha256, confirm: true });
}

test('interview asks only missing information and does not infer rights or invent evidence', () => {
  const initial = interviewOriginalSystem(); assert.equal(initial.ready, false); assert.equal(initial.missing_questions.length, 12);
  const { sharing_rights: _rights, example: _example, ...partial } = brief;
  const result = interviewOriginalSystem({ brief: partial });
  assert.deepEqual(result.missing_questions.map(item => item.field), ['example', 'sharing_rights']);
  assert.equal(result.writes, false); assert.equal(result.network, false);
  assert.equal(interviewOriginalSystem({ brief }).ready, true);
  assert.throws(() => interviewOriginalSystem({ brief: { title: '   ' } }), /invalid_authoring_brief/);
  assert.throws(() => interviewOriginalSystem({ brief: { private_token: 'ignored?' } }), /invalid_authoring_brief/);
  assert.throws(() => interviewOriginalSystem({ brief: { title: 'Contato a@example.com' } }), /sensitive_content_requires_redaction/);
});

test('inspection reads only the explicit text selection without writes, recursion, execution or private state', () => {
  const f = fixture();
  try {
    const before = snapshot(f.root); const inspected = inspectOriginalSystemFiles(f.args);
    assert.equal(inspected.files.length, 2); assert.equal(inspected.content_untrusted, true); assert.equal(inspected.network, false);
    assert.equal(inspected.files.find(file => file.path === 'exemplo.csv').content, 'leads,vendas\n20,4\n');
    assert.equal(JSON.stringify(inspected).includes('PRIVATE_SENTINEL'), false); assert.equal(JSON.stringify(inspected).includes(f.root), false);
    assert.deepEqual(snapshot(f.root), before);
    writeFileSync(join(f.root, 'sistemas/metricas/comando.js'), "throw new Error('THIS_MUST_NOT_EXECUTE');\n");
    const code = inspectOriginalSystemFiles({ ...f.args, selectedPaths: ['comando.js'] }); assert.match(code.files[0].content, /THIS_MUST_NOT_EXECUTE/);
    assert.throws(() => inspectOriginalSystemFiles({ root: f.root }), /explicit_selection_required/);
    assert.throws(() => inspectOriginalSystemFiles({ ...f.args, selectedPaths: ['metodo.md', 'metodo.md'] }), /explicit_selection_required/);
  } finally { f.cleanup(); }
});

test('preview and prepare build real portable V2 contracts and a usable first task from a complete brief', () => {
  const f = fixture();
  try {
    const before = snapshot(f.root), preview = previewOriginalSystem(f.args);
    assert.equal(preview.status, 'preview'); assert.equal(preview.files.length, 7); assert.equal(preview.file_previews.length, 11);
    assert.equal(preview.permissions.external_actions, false); assert.equal(preview.privacy.human_review_required, true);
    assert.deepEqual(snapshot(f.root), before); assert.equal(JSON.stringify(preview).includes('PRIVATE_SENTINEL'), false);
    const staged = prepareOriginalSystem({ ...f.args, expectedSha256: preview.package_sha256, confirm: true });
    assert.equal(staged.status, 'prepared'); assert.equal(staged.package_sha256, preview.package_sha256); assert.equal(staged.published, false); assert.equal(staged.sent, false);
    const candidate = getPreparedContribution({ root: f.root, candidateId: staged.candidate_id });
    const checked = validateCommunityPackage(candidate.package); assert.equal(checked.packageSha256, preview.package_sha256);
    assert.equal(candidate.package.entrypoint, 'COMECE-AQUI.md'); assert.equal(candidate.package.first_task, brief.first_task);
    assert.equal(checked.contract.capability.origin, 'local'); assert.equal(checked.contract.status, 'proposed');
    assert.equal(checked.manifest.validation.verified_real_cycles, 0); assert.equal(checked.release.validation.verified_distinct_member_brains, 0);
    assert.equal(checked.manifest.permissions.connects_sources_automatically, false); assert.equal(checked.contract.permissions.external_actions, false);
    assert.ok(checked.contract.sources.every(source => source.source_id === null));
    assert.match(Buffer.from(candidate.package.files['EXEMPLO.md'].content, 'base64').toString(), /não é um caso real nem um teste executado/);
    assert.match(Buffer.from(candidate.package.files['METODO.md'].content, 'base64').toString(), /vendas dividido por leads/);
    for (const path of f.args.selectedPaths) assert.deepEqual(Buffer.from(candidate.package.files[`materiais/${path}`].content, 'base64'), readFileSync(join(f.root, f.args.sourceDir, path)));
    assert.ok(before.every(record => snapshot(f.root).includes(record))); // All source bytes remain untouched.
    assert.equal(existsSync(join(candidate.directory, 'approval.json')), false);
  } finally { f.cleanup(); }
});

test('a verbal brief can produce an original pilot without an installed system or input files', () => {
  const f = fixture();
  try {
    const args = { root: f.root, brief };
    const plan = previewOriginalSystem(args); assert.equal(plan.files.length, 5); assert.deepEqual(plan.source_files, []);
    const staged = prepareOriginalSystem({ ...args, expectedSha256: plan.package_sha256, confirm: true });
    assert.equal(staged.slug, 'metricas-semanais'); assert.equal(staged.version, '0.1.0-rc.1');
    assert.equal(existsSync(join(f.root, '.cerebro/sistemas')), false);
    assert.equal(previewOriginalSystem({ ...args, brief: { title: 'Métricas' } }).status, 'needs_information');
    assert.throws(() => prepareOriginalSystem({ ...args, brief: { title: 'Métricas' }, expectedSha256: plan.package_sha256, confirm: true }), /authoring_brief_incomplete/);
  } finally { f.cleanup(); }
});

test('exact preview hash binds selected file bytes, selected set, version and brief before any candidate write', () => {
  const f = fixture();
  try {
    const preview = previewOriginalSystem(f.args);
    for (const args of [{ ...f.args, confirm: false }, { ...f.args, confirm: 'true' }]) assert.throws(() => prepareOriginalSystem({ ...args, expectedSha256: preview.package_sha256 }), /confirmation_required/);
    assert.throws(() => prepareOriginalSystem({ ...f.args, confirm: true }), /authoring_preview_required/);
    for (const changed of [{ ...f.args, brief: { ...brief, purpose: 'Outro resultado' } }, { ...f.args, selectedPaths: ['metodo.md'] }, { ...f.args, brief: { ...brief, version: '0.2.0' } }]) {
      const before = snapshot(f.root); assert.throws(() => prepareOriginalSystem({ ...changed, expectedSha256: preview.package_sha256, confirm: true }), /authoring_source_changed_review_again/); assert.deepEqual(snapshot(f.root), before);
    }
    writeFileSync(join(f.root, 'sistemas/metricas/metodo.md'), '# Outro método');
    const before = snapshot(f.root); assert.throws(() => prepareOriginalSystem({ ...f.args, expectedSha256: preview.package_sha256, confirm: true }), /authoring_source_changed_review_again/); assert.deepEqual(snapshot(f.root), before);
  } finally { f.cleanup(); }
});

test('original candidates still need explicit approval and a separate send; no inherited proof or publication', async () => {
  const f = fixture(); let sends = 0;
  try {
    const staged = stage(f); const args = { root: f.root, candidateId: staged.candidate_id, packageSha256: staged.package_sha256 };
    const client = { submitContribution: async request => { sends++; assert.equal(request.package_sha256, staged.package_sha256); return { contribution: { id: 'synthetic-only', status: 'submitted', package_sha256: request.package_sha256 } }; } };
    await assert.rejects(sendContribution({ ...args, client, confirm: true }), /approval_required/);
    approveContribution({ ...args, confirm: true }); assert.equal(sends, 0);
    assert.equal((await sendContribution({ ...args, client })).sent, false); assert.equal(sends, 0);
    const sent = await sendContribution({ ...args, client, confirm: true }); assert.equal(sends, 1); assert.equal(sent.published, false);
    assert.equal(reviewContributionCandidate({ root: f.root, candidateId: staged.candidate_id }).status, 'submitted');
  } finally { f.cleanup(); }
});

test('source traversal, symlinks, private folders, credential filenames, binaries and oversized selections are refused', () => {
  const f = fixture();
  try {
    symlinkSync(join(f.root, 'sistemas/metricas/metodo.md'), join(f.root, 'sistemas/metricas/link.md'));
    symlinkSync(join(f.root, 'sistemas/metricas'), join(f.root, 'linked-folder'));
    for (const args of [{ ...f.args, sourceDir: '../outside' }, { ...f.args, sourceDir: '/tmp' }, { ...f.args, sourceDir: 'linked-folder' }, ...['../VERSION', 'link.md', '.env.local', 'privado/info.md', '.ssh/id_rsa', 'api-tokens.json', 'client.key'].map(path => ({ ...f.args, selectedPaths: [path] }))]) assert.throws(() => inspectOriginalSystemFiles(args), /unsafe_|private_selection_refused/);
    writeFileSync(join(f.root, 'sistemas/metricas/text.pdf'), '%PDF-1.4\nASCII text pretending to be a PDF');
    assert.throws(() => inspectOriginalSystemFiles({ ...f.args, selectedPaths: ['text.pdf'] }), /binary_content_not_supported/);
    writeFileSync(join(f.root, 'sistemas/metricas/template.xlsx'), Buffer.from([0x50,0x4b,0x03,0x04,0x00,0x80]));
    assert.throws(() => inspectOriginalSystemFiles({ ...f.args, selectedPaths: ['template.xlsx'] }), /binary_content_not_supported/);
    writeFileSync(join(f.root, 'sistemas/metricas/large.md'), 'x'.repeat(AUTHORING_LIMITS.fileBytes + 1));
    assert.throws(() => inspectOriginalSystemFiles({ ...f.args, selectedPaths: ['large.md'] }), /invalid_file_size/);
    for(let i=0;i<3;i++) writeFileSync(join(f.root, `sistemas/metricas/chunk${i}.md`), 'x'.repeat(AUTHORING_LIMITS.fileBytes));
    assert.throws(() => inspectOriginalSystemFiles({ ...f.args, selectedPaths: ['chunk0.md','chunk1.md','chunk2.md'] }), /authoring_selection_too_large/);
    assert.equal(existsSync(join(f.root, 'comunidade')), false);
  } finally { f.cleanup(); }
});

test('obvious private values are rejected before inspection, preview, stage or error output can disclose them', () => {
  const f = fixture();
  try {
    for (const secret of ['cliente@example.com', '123.456.789-09', '12.345.678/0001-99', '+55 (48) 99999-1234', `api_key=${'s'.repeat(24)}`, `Bearer ${'s'.repeat(30)}`, '-----BEGIN PRIVATE KEY-----', JSON.stringify({ api_key: 's'.repeat(24) })]) {
      writeFileSync(join(f.root, 'sistemas/metricas/sensitive.md'), secret);
      assert.throws(() => inspectOriginalSystemFiles({ ...f.args, selectedPaths: ['sensitive.md'] }), error => error.message === 'sensitive_content_requires_redaction' && !error.message.includes(secret));
      assert.throws(() => previewOriginalSystem({ ...f.args, selectedPaths: ['sensitive.md'] }), /sensitive_content_requires_redaction/);
    }
    assert.throws(() => previewOriginalSystem({ ...f.args, brief: { ...brief, example: { input: 'cliente@example.com', expected_output: 'Saída' } } }), /sensitive_content_requires_redaction/);
    assert.equal(existsSync(join(f.root, 'comunidade')), false);
  } finally { f.cleanup(); }
});

test('legacy original-stage rescans all file bytes and contracts; archive names alone never bypass inspection', () => {
  const f = fixture();
  try {
    const staged = stage(f); const original = getPreparedContribution({ root: f.root, candidateId: staged.candidate_id }).package;
    const path = join(f.root, 'original.json');
    writeFileSync(path, JSON.stringify(original));
    for (const summary of [`Bearer ${'s'.repeat(30)}`, `ghp_${'s'.repeat(30)}`, '+55 (48) 99999-1234']) {
      const before = snapshot(f.root);
      assert.throws(() => prepareReleaseContribution({ root: f.root, packageRef: 'original.json', summary, confirm: true }), /sensitive_content_requires_redaction/);
      assert.deepEqual(snapshot(f.root), before);
    }
    const metadataPath = join(getPreparedContribution({ root: f.root, candidateId: staged.candidate_id }).directory, 'candidate.json');
    const metadata = JSON.parse(readFileSync(metadataPath));
    writeFileSync(metadataPath, JSON.stringify({ ...metadata, summary: `Bearer ${'s'.repeat(30)}` }));
    assert.throws(() => reviewContributionCandidate({ root: f.root, candidateId: staged.candidate_id }), /sensitive_content_requires_redaction/);
    writeFileSync(metadataPath, JSON.stringify(metadata));
    const tests = [
      bundle => { bundle.files['escondido.md'] = encodeCommunityFile(Buffer.from('cliente@example.com')); },
      bundle => { const value = JSON.parse(bundle.contracts['contract.json']); value.result.statement='cliente@example.com'; bundle.contracts['contract.json']=JSON.stringify(value); },
      bundle => { const value = JSON.parse(bundle.contracts['contract.json']); value.result.statement=JSON.stringify({api_key:'s'.repeat(24)}); bundle.contracts['contract.json']=JSON.stringify(value); },
      bundle => { bundle.files['text.pdf'] = encodeCommunityFile(Buffer.from('%PDF-1.4 ASCII')); },
      bundle => { bundle.files['archive.zip'] = encodeCommunityFile(Buffer.from([0,1,2,3])); },
      bundle => { bundle.files['originais/KIT-COPY-COM-IA.zip'] = encodeCommunityFile(Buffer.from([0,1,2,3])); },
      bundle => { bundle.files['tests/tracking.test.mjs'] = encodeCommunityFile(Buffer.from('cliente@example.com')); },
      bundle => { bundle.files['.env.production'] = encodeCommunityFile(Buffer.from('fake')); },
    ];
    for (const mutate of tests) {
      const bundle = structuredClone(original); mutate(bundle); writeFileSync(path, JSON.stringify(bundle)); const before=snapshot(f.root);
      assert.throws(() => prepareReleaseContribution({ root: f.root, packageRef: 'original.json', summary: 'Pacote original', confirm: true }), /sensitive_content_requires_redaction|binary_content_not_supported|private_selection_refused/); assert.deepEqual(snapshot(f.root),before);
    }
  } finally { f.cleanup(); }
});

test('declared brief schema boundaries build valid packages instead of failing hidden manifest limits', () => {
  const f=fixture();
  try {
    const maximum={...brief,title:'t'.repeat(100),purpose:'p'.repeat(240),trigger:'t'.repeat(120),first_task:'f'.repeat(240),done_when:Array.from({length:12},(_,i)=>`${i} ${'c'.repeat(497)}`)};
    assert.equal(matchesSchema(maximum,AUTHORING_BRIEF_SCHEMA),true);
    const result=previewOriginalSystem({root:f.root,brief:maximum});assert.equal(result.ready,true);assert.ok(Buffer.byteLength(JSON.stringify(result))<AUTHORING_LIMITS.outputBytes);
    for(const [field,max] of [['title',100],['purpose',240],['trigger',120],['first_task',240]]) assert.throws(()=>interviewOriginalSystem({brief:{...brief,[field]:'x'.repeat(max+1)}}),/invalid_authoring_brief/);
  } finally { f.cleanup(); }
});
