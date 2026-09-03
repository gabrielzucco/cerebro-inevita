import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const VERSION_RE = /^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/;
const KINDS = new Set(['announcement', 'maintenance', 'product-update']);
const FEED_FIELDS = new Set(['protocol_version', 'channel_id', 'generated_at', 'entries']);
const ENTRY_FIELDS = new Set([
  'update_id', 'kind', 'title', 'summary', 'published_at', 'release_version', 'highlights',
]);

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function boundedText(value, max, min = 1) {
  return typeof value === 'string'
    && value.trim() === value
    && value.length >= min
    && value.length <= max
    && !/[\r\n]/.test(value);
}

function isoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function unknownFields(value, allowed, label) {
  return Object.keys(value).filter((key) => !allowed.has(key)).map((key) => `${label}.${key} não é público`);
}

export function validateCommunicationFeed(value) {
  const errors = [];
  if (!object(value)) return ['feed precisa ser objeto'];
  errors.push(...unknownFields(value, FEED_FIELDS, 'feed'));
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!ID_RE.test(value.channel_id || '')) errors.push('channel_id inválido');
  if (!isoDate(value.generated_at)) errors.push('generated_at inválido');
  if (!Array.isArray(value.entries)) return [...errors, 'entries precisa ser array'];
  const ids = new Set();
  for (const [index, entry] of value.entries.entries()) {
    const ref = `entries[${index}]`;
    if (!object(entry)) {
      errors.push(`${ref} precisa ser objeto`);
      continue;
    }
    errors.push(...unknownFields(entry, ENTRY_FIELDS, ref));
    if (!ID_RE.test(entry.update_id || '')) errors.push(`${ref}.update_id inválido`);
    else if (ids.has(entry.update_id)) errors.push(`${ref}.update_id duplicado`);
    else ids.add(entry.update_id);
    if (!KINDS.has(entry.kind)) errors.push(`${ref}.kind inválido`);
    if (!boundedText(entry.title, 100, 4)) errors.push(`${ref}.title inválido`);
    if (!boundedText(entry.summary, 360, 12)) errors.push(`${ref}.summary inválido`);
    if (!isoDate(entry.published_at)) errors.push(`${ref}.published_at inválido`);
    if (entry.release_version !== undefined && !VERSION_RE.test(entry.release_version)) {
      errors.push(`${ref}.release_version inválido`);
    }
    if (!Array.isArray(entry.highlights) || entry.highlights.length > 4
      || entry.highlights.some((item) => !boundedText(item, 180, 4))) {
      errors.push(`${ref}.highlights inválido`);
    }
  }
  return errors;
}

function plainMarkdown(value) {
  return String(value || '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function bounded(value, max = 300) {
  const clean = plainMarkdown(value);
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function readBrainReleaseHistory(root, { limit = 8 } = {}) {
  let changelog = '';
  try { changelog = readFileSync(join(resolve(root), 'CHANGELOG.md'), 'utf8'); } catch { return []; }
  const headings = [...changelog.matchAll(/^## v(\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?) — (\d{4}-\d{2}-\d{2})(?: · (.+))?$/gm)];
  return headings.slice(0, limit).map((heading, index) => {
    const sectionStart = heading.index + heading[0].length;
    const sectionEnd = headings[index + 1]?.index ?? changelog.length;
    const section = changelog.slice(sectionStart, sectionEnd);
    const firstBullet = section.match(/^-[ \t]+(.+(?:\n[ \t]{2,}.+)*)/m)?.[1] || '';
    const headingTitle = bounded(String(heading[3] || '').replace(/^[“”"']+|[“”"']+$/g, ''), 120);
    return {
      version: heading[1],
      published_at: heading[2],
      title: headingTitle || `Release ${heading[1]}`,
      summary: bounded(firstBullet || 'Detalhes registrados no changelog local.'),
      source: 'CHANGELOG.md',
    };
  });
}

function publicEntry(entry) {
  return {
    update_id: entry.update_id,
    kind: entry.kind,
    title: entry.title,
    summary: entry.summary,
    published_at: entry.published_at,
    release_version: entry.release_version || null,
    highlights: [...entry.highlights],
  };
}

export function buildCommunicationReadModel(root, { entryLimit = 6, releaseLimit = 8 } = {}) {
  const base = resolve(root);
  const releaseHistory = readBrainReleaseHistory(base, { limit: releaseLimit });
  const fallback = {
    protocol_version: 1,
    channel_id: 'inevita-product-updates',
    source: 'bundled-public-feed',
    available: false,
    offline_available: true,
    entries: [],
    latest: null,
    brain_releases: releaseHistory,
    issue: 'communication-feed-invalid',
    privacy: {
      company_context_sent: false,
      telemetry_sent: false,
      remote_auto_check: false,
      public_metadata_only: true,
    },
  };
  try {
    const feed = JSON.parse(readFileSync(join(base, 'comunidade', 'inevita', 'atualizacoes', 'feed.v1.json'), 'utf8'));
    const errors = validateCommunicationFeed(feed);
    if (errors.length) return fallback;
    const entries = [...feed.entries]
      .sort((left, right) => right.published_at.localeCompare(left.published_at)
        || right.update_id.localeCompare(left.update_id))
      .slice(0, entryLimit)
      .map(publicEntry);
    return {
      ...fallback,
      channel_id: feed.channel_id,
      generated_at: feed.generated_at,
      available: true,
      entries,
      latest: entries[0] || null,
      issue: null,
    };
  } catch {
    return fallback;
  }
}
