import { existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { layout, writeJsonAtomic } from './system-protocol.mjs';

const KEY_RE = /^[a-z0-9][a-z0-9-]{0,127}$/;
const NODE_RE = /^[A-Za-z0-9][A-Za-z0-9_./:-]{0,255}$/;

function directory(root) {
  const runtime = resolve(root, '.cerebro', 'runtime');
  const target = resolve(root, layout(root).canvasLayouts || join('.cerebro', 'runtime', 'canvas-layouts'));
  const rel = relative(runtime, target);
  if (!rel || rel.startsWith('..') || rel.startsWith(sep)) throw new Error('canvas-layout-not-private');
  mkdirSync(target, { recursive: true, mode: 0o700 });
  const realRel = relative(realpathSync(runtime), realpathSync(target));
  if (!realRel || realRel.startsWith('..') || realRel.startsWith(sep)) throw new Error('canvas-layout-outside-runtime');
  return target;
}
function file(root, key) {
  if (!KEY_RE.test(key || '')) throw new Error('canvas-layout-key-invalid');
  return join(directory(root), `${key}.json`);
}

export function readCanvasLayout(root, key) {
  const path = file(root, key);
  if (!existsSync(path)) return { protocol_version: 1, layout_key: key, positions: {}, updated_at: null, updated_by: null };
  let value;
  try { value = JSON.parse(readFileSync(path, 'utf8')); } catch { throw new Error('canvas-layout-json-invalid'); }
  if (value.protocol_version !== 1 || value.layout_key !== key || typeof value.positions !== 'object') {
    throw new Error('canvas-layout-invalid');
  }
  return value;
}

export function saveCanvasLayout(root, key, positions, updatedBy, { clock = () => new Date() } = {}) {
  if (!updatedBy || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(updatedBy)) {
    throw new Error('canvas-layout-actor-invalid');
  }
  if (!positions || typeof positions !== 'object' || Array.isArray(positions)) throw new Error('canvas-layout-positions-invalid');
  const entries = Object.entries(positions);
  if (entries.length > 500) throw new Error('canvas-layout-too-large');
  const clean = {};
  for (const [nodeId, point] of entries) {
    if (!NODE_RE.test(nodeId) || !point || typeof point !== 'object') throw new Error('canvas-layout-position-invalid');
    const x = Number(point.x);
    const y = Number(point.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1_000_000 || Math.abs(y) > 1_000_000) {
      throw new Error('canvas-layout-position-invalid');
    }
    clean[nodeId] = { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
  }
  const date = typeof clock === 'function' ? clock() : clock;
  const updatedAt = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(updatedAt.getTime())) throw new Error('canvas-layout-clock-invalid');
  const value = {
    protocol_version: 1,
    layout_key: key,
    positions: clean,
    updated_at: updatedAt.toISOString(),
    updated_by: updatedBy,
  };
  writeJsonAtomic(file(root, key), value);
  return value;
}
