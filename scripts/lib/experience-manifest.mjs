import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { layout } from './system-protocol.mjs';

const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MARK_RE = /^[A-Za-z0-9&+]{1,3}$/;
const ACCENT_RE = /^#[0-9A-Fa-f]{6}$/;

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function closed(errors, value, path, allowed) {
  if (!object(value)) {
    errors.push(`${path} precisa ser objeto`);
    return;
  }
  const keys = new Set(allowed);
  for (const key of Object.keys(value)) if (!keys.has(key)) errors.push(`${path}.${key} não é permitido`);
}

function boundedString(errors, value, path, max) {
  if (typeof value !== 'string' || value.trim() !== value || !value || value.length > max) {
    errors.push(`${path} precisa ser texto entre 1 e ${max} caracteres, sem espaço nas bordas`);
  }
}

export function validateExperienceManifest(value) {
  const errors = [];
  closed(errors, value, 'experience_manifest', [
    'protocol_version', 'experience_id', 'system_ref', 'publisher', 'presentation', 'surfaces',
  ]);
  if (!object(value)) return errors;
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!ID_RE.test(value.experience_id || '')) errors.push('experience_id inválido');
  if (!ID_RE.test(value.system_ref || '')) errors.push('system_ref inválido');

  closed(errors, value.publisher, 'publisher', ['publisher_id', 'display_name', 'kind']);
  if (object(value.publisher)) {
    if (!ID_RE.test(value.publisher.publisher_id || '')) errors.push('publisher.publisher_id inválido');
    boundedString(errors, value.publisher.display_name, 'publisher.display_name', 80);
    if (!['organization', 'person'].includes(value.publisher.kind)) errors.push('publisher.kind inválido');
  }

  closed(errors, value.presentation, 'presentation', ['tagline', 'mark']);
  if (object(value.presentation)) {
    boundedString(errors, value.presentation.tagline, 'presentation.tagline', 120);
    closed(errors, value.presentation.mark, 'presentation.mark', ['kind', 'text', 'accent']);
    if (object(value.presentation.mark)) {
      if (value.presentation.mark.kind !== 'monogram') errors.push('presentation.mark.kind precisa ser monogram');
      if (!MARK_RE.test(value.presentation.mark.text || '')) errors.push('presentation.mark.text inválido');
      if (!ACCENT_RE.test(value.presentation.mark.accent || '')) errors.push('presentation.mark.accent inválido');
    }
  }

  if (!Array.isArray(value.surfaces) || value.surfaces.length < 1 || value.surfaces.length > 8) {
    errors.push('surfaces precisa ter entre 1 e 8 itens');
  } else {
    const ids = new Set();
    for (const [index, surface] of value.surfaces.entries()) {
      const path = `surfaces[${index}]`;
      closed(errors, surface, path, ['surface_id', 'role', 'kind', 'launch_label']);
      if (!object(surface)) continue;
      if (!ID_RE.test(surface.surface_id || '')) errors.push(`${path}.surface_id inválido`);
      if (ids.has(surface.surface_id)) errors.push(`${path}.surface_id duplicado`);
      ids.add(surface.surface_id);
      if (!ID_RE.test(surface.role || '')) errors.push(`${path}.role inválido`);
      if (surface.kind !== 'external-application') errors.push(`${path}.kind precisa ser external-application`);
      boundedString(errors, surface.launch_label, `${path}.launch_label`, 40);
    }
  }
  return errors;
}

export function experienceManifestDirectory(root) {
  const brain = resolve(root);
  const directory = resolve(root, layout(root).experienceManifests || '.cerebro/contracts/experiences');
  const rel = relative(brain, directory);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) throw new Error('experienceManifests aponta para fora do Cérebro');
  return directory;
}

function packagedManifests(root) {
  const systemsRoot = join(root, 'sistemas');
  if (!existsSync(systemsRoot)) return [];
  return readdirSync(systemsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(systemsRoot, entry.name, 'experience.json'))
    .filter(existsSync)
    .map((path) => ({ path, source: 'published-package', priority: 0 }));
}

function installedManifests(root) {
  const directory = experienceManifestDirectory(root);
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort()
    .map((name) => ({ path: join(directory, name), source: 'installed', priority: 1 }));
}

export function listExperienceManifests(root, issues = []) {
  const manifests = [];
  for (const entry of [...packagedManifests(root), ...installedManifests(root)]) {
    try {
      if (!lstatSync(entry.path).isFile()) throw new Error('not-file');
      const manifest = JSON.parse(readFileSync(entry.path, 'utf8'));
      const errors = validateExperienceManifest(manifest);
      if (errors.length) throw new Error(errors.join(' · '));
      manifests.push({
        manifest,
        path: entry.path,
        manifest_ref: relative(root, entry.path).replaceAll('\\', '/'),
        source: entry.source,
        priority: entry.priority,
      });
    } catch {
      issues.push({ reason_code: 'experience-manifest-invalid', ref: relative(root, entry.path).replaceAll('\\', '/') });
    }
  }
  return manifests;
}

export function indexExperienceManifests(root, issues = []) {
  const bySystem = new Map();
  for (const entry of listExperienceManifests(root, issues)) {
    const ref = entry.manifest.system_ref;
    const current = bySystem.get(ref);
    if (!current || entry.priority > current.priority) {
      bySystem.set(ref, entry);
      continue;
    }
    if (entry.priority === current.priority) {
      bySystem.delete(ref);
      issues.push({ reason_code: 'experience-manifest-ambiguous', ref });
    }
  }
  return bySystem;
}

export function experienceManifestView(entry, interfaceRole = null) {
  if (!entry) return null;
  const manifest = entry.manifest;
  const primarySurface = manifest.surfaces.find((surface) => surface.role === interfaceRole)
    || manifest.surfaces.find((surface) => surface.surface_id === 'primary')
    || manifest.surfaces[0];
  return {
    protocol_version: manifest.protocol_version,
    experience_id: manifest.experience_id,
    manifest_ref: entry.manifest_ref,
    source: entry.source,
    publisher: manifest.publisher,
    presentation: manifest.presentation,
    primary_surface: primarySurface,
  };
}
