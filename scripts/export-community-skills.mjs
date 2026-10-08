#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'scripts', 'community-skills-release.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function git(root, ...args) { return execFileSync('git', args, { cwd: root, maxBuffer: 2 * 1024 * 1024 }); }
function releaseRef(ref) {
  if (typeof ref !== 'string' || !/^v[0-9]+\.[0-9]+\.[0-9]+$/.test(ref)) throw new Error('release-ref-invalid');
  return ref;
}
function treeFiles(root, commit, prefix) {
  const tree = git(root, 'ls-tree', '-r', commit, '--', prefix).toString('utf8');
  return tree.trim().split('\n').filter(Boolean).map(line => {
    const match = /^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/.exec(line);
    if (!match || !match[3].startsWith(`${prefix}/`)) throw new Error('skill-source-unsafe');
    const path = match[3].slice(prefix.length + 1);
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*(?:\/[A-Za-z0-9][A-Za-z0-9_.-]*)*$/.test(path)) throw new Error('skill-source-path-unsafe');
    const bytes = git(root, 'cat-file', 'blob', match[2]);
    const content = bytes.toString('utf8');
    if (!Buffer.from(content, 'utf8').equals(bytes)) throw new Error('skill-source-not-utf8');
    return { path, content, sha256: digest(bytes), size_bytes: bytes.length };
  }).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}
function frontmatter(content, slug) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(content || '');
  if (!match) throw new Error(`skill-frontmatter-missing:${slug}`);
  const name = /^name:\s*(.+)$/m.exec(match[1])?.[1]?.trim();
  const description = /^description:\s*(.+)$/m.exec(match[1])?.[1]?.trim();
  if (name !== slug || !description) throw new Error(`skill-frontmatter-invalid:${slug}`);
  return { name, description };
}
export function skillSlugsFromMotorManifest(manifest) {
  const slugs = [...manifest.matchAll(/^\.claude\/skills\/([a-z0-9][a-z0-9-]{0,63})\s*$/gm)].map(match => match[1]);
  if (!slugs.length || new Set(slugs).size !== slugs.length) throw new Error('release-skills-manifest-invalid');
  return slugs.sort();
}
export function buildCommunitySkillRelease(root = ROOT, { ref = 'v1.40.0' } = {}) {
  releaseRef(ref);
  const commit = git(root, 'rev-parse', '--verify', `${ref}^{commit}`).toString('utf8').trim();
  const version = git(root, 'show', `${commit}:VERSION`).toString('utf8').trim();
  if (`v${version}` !== ref) throw new Error('release-ref-version-mismatch');
  const manifest = git(root, 'show', `${commit}:.cerebro/motor.manifest`).toString('utf8');
  const skills = skillSlugsFromMotorManifest(manifest).map(slug => {
    const sourceFiles = treeFiles(root, commit, `.claude/skills/${slug}`);
    const portableFiles = treeFiles(root, commit, `.agents/skills/${slug}`);
    if (JSON.stringify(sourceFiles) !== JSON.stringify(portableFiles)) throw new Error(`release-skill-parity:${slug}`);
    const metadata = frontmatter(sourceFiles.find(file => file.path === 'SKILL.md')?.content, slug);
    const envelope = sourceFiles.map(({ path, sha256, size_bytes }) => ({ path, sha256, size_bytes }));
    return { slug, ...metadata, task: metadata.description, when_to_use: metadata.description,
      author: 'INEVITA', origin: 'cerebro-inevita', license: 'MIT', version, requirements: '', example: '',
      evidence_state: 'tested', source_kind: 'hosted', source_url: null,
      publication_state: 'published', authorization_state: 'authorized',
      files: sourceFiles, bundle_sha256: digest(Buffer.from(JSON.stringify(envelope))) };
  });
  return { schema_version: 1, release_version: version, source_ref: ref, source_commit: commit, skills };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && !args[0].startsWith('--ref='))) throw new Error('usage: export-community-skills.mjs [--ref=vX.Y.Z]');
  const ref = args.length ? args[0].slice(6) : 'v1.40.0';
  const data = buildCommunitySkillRelease(ROOT, { ref });
  writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
  process.stdout.write(`Exportadas ${data.skills.length} skills de ${data.source_ref} (${data.source_commit}) para ${OUT}\n`);
}
