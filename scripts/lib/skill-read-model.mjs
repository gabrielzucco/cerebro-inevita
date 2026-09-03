import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { layout } from './system-protocol.mjs';
import { loadExecutorBinding } from './routine-protocol.mjs';

const DEFAULT_ENGINE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SKILL_ID_RE = /^[a-z0-9][a-z0-9-]{0,95}$/;

function inside(root, target) {
  const base = resolve(root);
  const absolute = resolve(root, target);
  const rel = relative(base, absolute);
  if (rel.startsWith('..') || rel.startsWith(sep)) throw new Error('referência de Skill aponta para fora do Cérebro');
  return absolute;
}

function skillDirectories(root) {
  const directory = join(root, '.claude', 'skills');
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && SKILL_ID_RE.test(entry.name) && existsSync(join(directory, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort();
}

export function countInstalledSkills(root) {
  return skillDirectories(resolve(root)).length;
}

function engineSkillDirectories(root, issues) {
  const manifestPath = join(root, '.cerebro', 'motor.manifest');
  if (!existsSync(manifestPath)) {
    issues.push({ reason_code: 'skill-engine-manifest-missing', ref: 'motor:.cerebro/motor.manifest' });
    return [];
  }
  const ids = [...readFileSync(manifestPath, 'utf8').matchAll(/^\.claude\/skills\/([a-z0-9][a-z0-9-]{0,95})\s*$/gm)]
    .map((match) => match[1]);
  const unique = [...new Set(ids)].sort();
  for (const skillId of unique) {
    if (!existsSync(join(root, '.claude', 'skills', skillId, 'SKILL.md'))) {
      issues.push({ reason_code: 'skill-engine-package-missing', ref: `engine:${skillId}` });
    }
  }
  return unique.filter((skillId) => existsSync(join(root, '.claude', 'skills', skillId, 'SKILL.md')));
}

function frontmatter(content) {
  if (!content.startsWith('---\n')) return {};
  const end = content.indexOf('\n---', 4);
  if (end < 0) return {};
  const fields = {};
  for (const line of content.slice(4, end).split('\n')) {
    const match = line.match(/^([a-z_]+):\s*(.+?)\s*$/i);
    if (match) fields[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return fields;
}

function skillPackage(root, skillId, origin, issues) {
  const canonicalPath = join(root, '.claude', 'skills', skillId, 'SKILL.md');
  const runtimePath = join(root, '.agents', 'skills', skillId, 'SKILL.md');
  const content = readFileSync(canonicalPath, 'utf8');
  const metadata = frontmatter(content);
  const metadataValid = metadata.name === skillId && typeof metadata.description === 'string' && metadata.description.length > 0;
  if (!metadataValid) issues.push({ reason_code: 'skill-metadata-invalid', ref: `${origin}:${skillId}` });
  const runtimePresent = existsSync(runtimePath);
  const runtimeAligned = runtimePresent && readFileSync(runtimePath, 'utf8') === content;
  if (!runtimePresent) issues.push({ reason_code: 'skill-runtime-missing', ref: `${origin}:${skillId}:agents` });
  else if (!runtimeAligned) issues.push({ reason_code: 'skill-runtime-diverged', ref: `${origin}:${skillId}:agents` });
  return {
    skill_id: skillId,
    name: metadata.name || skillId,
    description: metadata.description || 'Descrição canônica não declarada.',
    metadata_valid: metadataValid,
    canonical_present: true,
    agent_runtime_present: runtimePresent,
    agent_runtime_aligned: runtimeAligned,
    canonical_ref: origin === 'company'
      ? `.claude/skills/${skillId}/SKILL.md`
      : `motor:.claude/skills/${skillId}/SKILL.md`,
  };
}

function explicitSkillSection(content) {
  const start = content.search(/^## Skills e interfaces\s*$/im);
  if (start < 0) return '';
  const bodyStart = content.indexOf('\n', start);
  if (bodyStart < 0) return '';
  const rest = content.slice(bodyStart + 1);
  const end = rest.search(/^##\s+/m);
  return end < 0 ? rest : rest.slice(0, end);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function explicitlyNames(section, skillId) {
  const escaped = escapeRegex(skillId);
  return new RegExp('(?:`' + escaped + '`|/' + escaped + '(?=$|[^a-z0-9-]))', 'i').test(section);
}

function systemSkillLinks(root, systems, skillIds, issues) {
  const links = new Map(skillIds.map((skillId) => [skillId, []]));
  for (const system of systems) {
    if (!system.source_manifest_ref) continue;
    try {
      const path = inside(root, system.source_manifest_ref);
      if (!existsSync(path)) continue;
      const section = explicitSkillSection(readFileSync(path, 'utf8'));
      if (!section) continue;
      for (const skillId of skillIds) {
        if (explicitlyNames(section, skillId)) links.get(skillId).push(system.system_id);
      }
    } catch {
      issues.push({ reason_code: 'skill-system-manifest-unreadable', ref: system.system_id });
    }
  }
  return links;
}

function executorViews(root, issues) {
  const configured = layout(root).executorBindings || join('.cerebro', 'runtime', 'executors');
  let directory;
  try {
    directory = inside(root, configured);
  } catch {
    issues.push({ reason_code: 'executor-bindings-path-invalid', ref: configured });
    return [];
  }
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .flatMap((name) => {
      const bindingId = name.slice(0, -5);
      try {
        const { binding } = loadExecutorBinding(root, bindingId);
        return [{
          binding_id: binding.binding_id,
          adapter: binding.adapter,
          auth_status: binding.auth.status,
          default_model: binding.model_policy.default_model,
          allowed_models: binding.model_policy.allowed_models,
          permission_profile: binding.permission_profile,
          observed_at: binding.observed_at,
          credential_stored: binding.privacy.credential_stored,
          content_shared_with_inevita: binding.privacy.content_shared_with_inevita,
        }];
      } catch {
        issues.push({ reason_code: 'executor-binding-invalid', ref: bindingId });
        return [];
      }
    });
}

export function buildSkillReadModel(root, {
  systems = [],
  engineRoot = DEFAULT_ENGINE_ROOT,
} = {}) {
  const brainRoot = resolve(root);
  const motorRoot = resolve(engineRoot);
  const issues = [];
  const companyIds = skillDirectories(brainRoot);
  const engineIds = engineSkillDirectories(motorRoot, issues);
  const ids = [...new Set([...companyIds, ...engineIds])].sort();
  const links = systemSkillLinks(brainRoot, systems, ids, issues);
  const skills = ids.map((skillId) => {
    const company = companyIds.includes(skillId) ? skillPackage(brainRoot, skillId, 'company', issues) : null;
    const engine = engineIds.includes(skillId) ? skillPackage(motorRoot, skillId, 'engine', issues) : null;
    const installed = Boolean(company);
    const healthy = installed && company.metadata_valid && company.agent_runtime_present && company.agent_runtime_aligned;
    return {
      skill_id: skillId,
      name: company?.name || engine?.name || skillId,
      description: company?.description || engine?.description || 'Descrição canônica não declarada.',
      origins: [company ? 'company' : null, engine ? 'engine' : null].filter(Boolean),
      installation_status: installed ? (healthy ? 'available' : 'degraded') : 'motor-only',
      company,
      engine,
      system_refs: links.get(skillId) || [],
    };
  });
  return {
    counts: {
      unique: skills.length,
      company: companyIds.length,
      engine: engineIds.length,
      shared: skills.filter((skill) => skill.origins.length === 2).length,
      available: skills.filter((skill) => skill.installation_status === 'available').length,
      degraded: skills.filter((skill) => skill.installation_status === 'degraded').length,
      linked: skills.filter((skill) => skill.system_refs.length > 0).length,
    },
    skills,
    executors: executorViews(brainRoot, issues),
    privacy: {
      skill_body_exposed: false,
      credentials_exposed: false,
      reference_only: true,
    },
    issues,
  };
}
