#!/usr/bin/env node

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  confirmLegacySchedulePaused,
} from './lib/routine-protocol.mjs';
import {
  activateRoutine,
  pauseRoutine,
  resumeRoutine,
  runRoutine,
} from './lib/routine-runtime.mjs';
import { buildConsoleReadModel, recognizeConsoleBrain } from './lib/console-read-model.mjs';
import { saveCanvasLayout } from './lib/canvas-layout-runtime.mjs';
import {
  buildBrainGraph,
  buildRunGraph,
  buildSystemGraph,
  graphForLayout,
} from './lib/graph-read-model.mjs';
import { readRoutineRunContext } from './lib/context-snapshot-runtime.mjs';
import { revokeAccessGrant } from './lib/access-runtime.mjs';
import { readPrivateRoutineOutput, writeJudgmentReceipt } from './lib/judgment-protocol.mjs';
import { readExperimentDetail } from './lib/experiment-protocol.mjs';
import {
  correctionActions,
  correctionView,
  createLearningCandidate,
  readCorrectionComparison,
  rerunWithCorrection,
} from './lib/correction-loop.mjs';

// Índice derivado do conhecimento: varre SOMENTE 01-nucleo-privado (fosso, baixo
// risco), nunca 02-dados-terceiros. Reconstruível a cada chamada; não cria verdade.
function knowledgeIndex(root) {
  const base = resolve(root, '01-nucleo-privado');
  const files = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
    }
  };
  walk(base);
  const domains = new Map();
  const inbound = new Map();
  const slugs = new Map();
  for (const file of files) {
    const relative = file.slice(base.length + 1);
    const domain = relative.includes('/') ? relative.slice(0, relative.indexOf('/')) : '·raiz';
    domains.set(domain, (domains.get(domain) || 0) + 1);
    const slug = relative.slice(relative.lastIndexOf('/') + 1, -3);
    slugs.set(slug, { relative, domain });
    let content = '';
    try { content = readFileSync(file, 'utf8'); } catch { continue; }
    for (const match of content.matchAll(/\[\[([^\]|#\n]+)/g)) {
      const target = match[1].trim();
      if (target) inbound.set(target, (inbound.get(target) || 0) + 1);
    }
  }
  const top = [...inbound.entries()]
    .filter(([slug]) => slugs.has(slug))
    .sort((left, right) => right[1] - left[1])
    .slice(0, 12)
    .map(([slug, count]) => ({ title: slug, count, domain: slugs.get(slug).domain, path: `01-nucleo-privado/${slugs.get(slug).relative}` }));
  const domainList = [...domains.entries()].sort((left, right) => right[1] - left[1]).slice(0, 10)
    .map(([name, count]) => ({ name, count }));
  return { total_notes: files.length, domains: domainList, most_linked: top };
}

const COOKIE_NAME = 'cerebro_console_session';
const MAX_BODY_BYTES = 32 * 1024;
const STATIC_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'console');
const SAFE_ACTOR_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const SAFE_REF_RE = /^[A-Za-z0-9][A-Za-z0-9_./:-]{0,255}$/;

function opaqueToken() {
  return randomBytes(32).toString('base64url');
}

function exactEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function cookies(request) {
  return Object.fromEntries(String(request.headers.cookie || '').split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf('=');
    return separator === -1 ? [part, ''] : [part.slice(0, separator), part.slice(separator + 1)];
  }));
}

function headers(type = 'application/json; charset=utf-8') {
  return {
    'Content-Type': type,
    'Cache-Control': 'no-store, max-age=0',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'",
  };
}

function send(response, status, value, extraHeaders = {}) {
  const body = typeof value === 'string' ? value : `${JSON.stringify(value)}\n`;
  response.writeHead(status, { ...headers(typeof value === 'string' ? 'text/plain; charset=utf-8' : undefined), ...extraHeaders });
  response.end(body);
}

function sendStatic(response, file, type, extraHeaders = {}) {
  // Console local em iteração constante: nunca deixar o navegador congelar um asset.
  response.writeHead(200, { ...headers(type), 'Cache-Control': 'no-store', ...extraHeaders });
  response.end(readFileSync(resolve(STATIC_ROOT, file)));
}

async function body(request) {
  if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    throw new Error('content-type-required');
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('request-too-large');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw new Error('json-invalid');
  }
}

function safeReason(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /^[a-z0-9-]+$/.test(message) ? message : 'request-failed';
}

function assertMutation(request, sessionToken, csrfToken, payload) {
  if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
  if (!exactEqual(String(request.headers['x-cerebro-csrf'] || ''), csrfToken)) throw new Error('csrf-invalid');
  if (payload.confirm !== true) throw new Error('confirmation-required');
}

function actor(payload) {
  if (!SAFE_ACTOR_RE.test(payload.approved_by || '')) throw new Error('approved-by-invalid');
  return payload.approved_by;
}

function actionFrom(pathname) {
  const match = pathname.match(/^\/api\/routines\/([a-z0-9][a-z0-9-]{0,63})\/(run|activate|pause|resume|confirm-legacy-pause)$/);
  return match ? { routineId: match[1], action: match[2] } : null;
}

function outputReceiptFrom(pathname) {
  const match = pathname.match(/^\/api\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/output$/);
  return match?.[1] || null;
}

function contextReceiptFrom(pathname) {
  const match = pathname.match(/^\/api\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/context$/);
  return match?.[1] || null;
}

function grantRevocationFrom(pathname) {
  const match = pathname.match(/^\/api\/grants\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/revoke$/);
  return match?.[1] || null;
}

function judgmentReceiptFrom(pathname) {
  const match = pathname.match(/^\/api\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/judgments$/);
  return match?.[1] || null;
}

function correctionActionFrom(pathname) {
  const match = pathname.match(/^\/api\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/(rerun-with-correction|learning-candidates)$/);
  return match ? { receiptId: match[1], action: match[2] } : null;
}

function comparisonReceiptFrom(pathname) {
  const match = pathname.match(/^\/api\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/comparison$/);
  return match?.[1] || null;
}

function graphRequestFrom(pathname) {
  if (pathname === '/api/graphs/brain') return { type: 'brain', ref: null };
  const system = pathname.match(/^\/api\/graphs\/systems\/([a-z0-9][a-z0-9-]{0,63})$/);
  if (system) return { type: 'system', ref: system[1] };
  const run = pathname.match(/^\/api\/graphs\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})$/);
  if (run) return { type: 'run', ref: run[1] };
  const runRecord = pathname.match(/^\/api\/graphs\/run-records\/([A-Za-z0-9][A-Za-z0-9_.:-]{0,127})$/);
  return runRecord ? { type: 'run-record', ref: runRecord[1] } : null;
}

function graphLayoutFrom(pathname) {
  const match = pathname.match(/^\/api\/graphs\/layouts\/([a-z0-9][a-z0-9-]{0,127})$/);
  return match?.[1] || null;
}

function experimentDetailFrom(pathname) {
  const match = pathname.match(/^\/api\/experiments\/(EXP-[A-Za-z0-9_-]{1,48})$/);
  return match?.[1] || null;
}

function hostAllowed(request) {
  const value = String(request.headers.host || '').toLowerCase();
  const hostname = value.startsWith('[') ? value.slice(0, value.indexOf(']') + 1) : value.split(':', 1)[0];
  return ['127.0.0.1', 'localhost', '[::1]'].includes(hostname);
}

export function createConsoleServer({
  root,
  spawn,
  spawnCollector,
  clock = () => new Date(),
  sessionToken = opaqueToken(),
  csrfToken = opaqueToken(),
} = {}) {
  const brainRoot = resolve(root || process.cwd());
  recognizeConsoleBrain(brainRoot);
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const sessionCookie = `${COOKIE_NAME}=${sessionToken}; HttpOnly; SameSite=Strict; Path=/`;
    try {
      if (!hostAllowed(request)) {
        send(response, 421, { reason_code: 'host-not-allowed' });
        return;
      }
      if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/rotinas')) {
        sendStatic(response, 'index.html', 'text/html; charset=utf-8', { 'Set-Cookie': sessionCookie });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/app.js') {
        sendStatic(response, 'app.js', 'text/javascript; charset=utf-8');
        return;
      }
      if (request.method === 'GET' && url.pathname === '/canvas.bundle.js') {
        sendStatic(response, 'canvas.bundle.js', 'text/javascript; charset=utf-8');
        return;
      }
      if (request.method === 'GET' && url.pathname === '/styles.css') {
        sendStatic(response, 'styles.css', 'text/css; charset=utf-8');
        return;
      }
      if (request.method === 'GET' && url.pathname === '/favicon.ico') {
        response.writeHead(204, headers());
        response.end();
        return;
      }
      if (request.method === 'GET' && url.pathname.startsWith('/files/')) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        const relative = decodeURIComponent(url.pathname.slice('/files/'.length));
        const resolved = resolve(brainRoot, relative);
        if (!resolved.startsWith(resolve(brainRoot) + '/') || !resolved.endsWith('.html')) throw new Error('not-found');
        let content;
        try { content = readFileSync(resolved); } catch { throw new Error('not-found'); }
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        response.end(content);
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/knowledge') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, knowledgeIndex(brainRoot));
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/session') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, { csrf_token: csrfToken, expires: 'process-lifetime' });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/console') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, buildConsoleReadModel(brainRoot, { now: clock() }));
        return;
      }
      const experimentId = request.method === 'GET' ? experimentDetailFrom(url.pathname) : null;
      if (experimentId) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, readExperimentDetail(brainRoot, experimentId));
        return;
      }
      const graphRequest = request.method === 'GET' ? graphRequestFrom(url.pathname) : null;
      if (graphRequest) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        const graph = graphRequest.type === 'brain' ? buildBrainGraph(brainRoot, { now: clock() })
          : graphRequest.type === 'system' ? buildSystemGraph(brainRoot, graphRequest.ref)
            : graphRequest.type === 'run-record' ? buildRunGraph(brainRoot, `run-record:${graphRequest.ref}`)
              : buildRunGraph(brainRoot, graphRequest.ref);
        send(response, 200, graph);
        return;
      }
      const graphLayoutKey = request.method === 'PUT' ? graphLayoutFrom(url.pathname) : null;
      if (graphLayoutKey) {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        const approvedBy = actor(payload);
        const graph = graphForLayout(brainRoot, graphLayoutKey);
        const allowedNodes = new Set(graph.nodes.map((node) => node.id));
        if (!payload.positions || typeof payload.positions !== 'object' || Array.isArray(payload.positions)) {
          throw new Error('canvas-layout-positions-invalid');
        }
        if (Object.keys(payload.positions).some((nodeId) => !allowedNodes.has(nodeId))) {
          throw new Error('canvas-layout-node-unknown');
        }
        const saved = saveCanvasLayout(brainRoot, graphLayoutKey, payload.positions, approvedBy, { clock });
        send(response, 200, {
          status: 'saved', layout_key: saved.layout_key, node_count: Object.keys(saved.positions).length,
          topology_changed: false,
        });
        return;
      }
      const outputReceiptId = request.method === 'GET' ? outputReceiptFrom(url.pathname) : null;
      if (outputReceiptId) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        const outputDetail = readPrivateRoutineOutput(brainRoot, outputReceiptId);
        let contextAvailable = false;
        try {
          readRoutineRunContext(brainRoot, outputReceiptId);
          contextAvailable = true;
        } catch (error) {
          if (!(error instanceof Error) || error.message !== 'context-not-recorded') throw error;
        }
        send(response, 200, {
          ...outputDetail,
          correction: correctionView(brainRoot, outputReceiptId),
          correction_actions: correctionActions(brainRoot, outputReceiptId),
          context_available: contextAvailable,
        });
        return;
      }
      const contextReceiptId = request.method === 'GET' ? contextReceiptFrom(url.pathname) : null;
      if (contextReceiptId) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, readRoutineRunContext(brainRoot, contextReceiptId));
        return;
      }
      const comparisonReceiptId = request.method === 'GET' ? comparisonReceiptFrom(url.pathname) : null;
      if (comparisonReceiptId) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, readCorrectionComparison(brainRoot, comparisonReceiptId));
        return;
      }
      const judgmentReceiptId = request.method === 'POST' ? judgmentReceiptFrom(url.pathname) : null;
      if (judgmentReceiptId) {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        const approvedBy = actor(payload);
        if (!['approved', 'changes-requested', 'rejected'].includes(payload.verdict)) {
          throw new Error('judgment-verdict-invalid');
        }
        if (!['none', 'propose-action'].includes(payload.action_intent)) {
          throw new Error('judgment-action-intent-invalid');
        }
        if (typeof payload.note !== 'string' || payload.note.length > 2000) throw new Error('judgment-note-invalid');
        if ((payload.verdict !== 'approved' || payload.action_intent === 'propose-action') && !payload.note.trim()) {
          throw new Error('judgment-note-required');
        }
        const result = writeJudgmentReceipt(brainRoot, judgmentReceiptId, {
          verdict: payload.verdict,
          actionIntent: payload.action_intent,
          note: payload.note,
          actorRef: approvedBy,
          clock,
        });
        send(response, 200, {
          status: 'recorded',
          judgment_ref: result.ref,
          summary: result.summary,
          external_action_executed: false,
        });
        return;
      }
      const correctionAction = request.method === 'POST' ? correctionActionFrom(url.pathname) : null;
      if (correctionAction) {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        const approvedBy = actor(payload);
        if (correctionAction.action === 'rerun-with-correction') {
          const result = await rerunWithCorrection(brainRoot, correctionAction.receiptId, approvedBy, {
            spawn, spawnCollector, clock,
          });
          send(response, 200, {
            status: result.status,
            correction_ref: result.correction_ref,
            resulting_receipt_ref: result.result.receipt_ref,
            reason_code: result.result.receipt.reason_code,
            correction_shared_with_provider: result.correction.privacy.correction_shared_with_provider,
            external_action_executed: false,
          });
        } else {
          const result = createLearningCandidate(brainRoot, correctionAction.receiptId, approvedBy, { clock });
          send(response, 200, {
            status: result.status,
            learning_candidate_ref: result.ref,
            occurrences: result.value.occurrences,
            promotion_threshold: result.value.promotion_threshold,
            replay_status: result.value.replay_status,
            motor_changed: false,
            external_action_executed: false,
          });
        }
        return;
      }
      const grantId = request.method === 'POST' ? grantRevocationFrom(url.pathname) : null;
      if (grantId) {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        const approvedBy = actor(payload);
        const result = revokeAccessGrant(brainRoot, grantId, approvedBy, { now: clock() });
        send(response, 200, {
          status: result.status,
          grant_ref: `access-grant:${grantId}`,
          revocation_receipt_ref: result.receipt_ref,
          effect: 'future-only',
          past_artifacts_deleted: false,
          external_action_executed: false,
        });
        return;
      }
      const action = request.method === 'POST' ? actionFrom(url.pathname) : null;
      if (action) {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        let result;
        if (action.action === 'run') {
          result = await runRoutine(brainRoot, action.routineId, {
            trigger: 'manual', spawn, spawnCollector, clock,
          });
          send(response, 200, {
            status: result.status,
            receipt_ref: result.receipt_ref,
            reason_code: result.receipt.reason_code,
          });
          return;
        }
        const approvedBy = actor(payload);
        if (action.action === 'activate') {
          if (!SAFE_REF_RE.test(payload.evidence_ref || '')) throw new Error('evidence-ref-invalid');
          result = activateRoutine(brainRoot, action.routineId, payload.evidence_ref, approvedBy, { clock });
        } else if (action.action === 'pause') {
          result = pauseRoutine(brainRoot, action.routineId, approvedBy, { clock });
        } else if (action.action === 'resume') {
          result = resumeRoutine(brainRoot, action.routineId, approvedBy, { clock });
        } else {
          if (!SAFE_REF_RE.test(payload.evidence_ref || '')) throw new Error('evidence-ref-invalid');
          result = confirmLegacySchedulePaused(brainRoot, action.routineId, payload.evidence_ref, approvedBy, { clock });
        }
        send(response, 200, { status: 'updated', state: result });
        return;
      }
      send(response, 404, { reason_code: 'not-found' });
    } catch (error) {
      const reasonCode = safeReason(error);
      const status = reasonCode === 'session-required' || reasonCode === 'csrf-invalid' ? 403
        : reasonCode === 'not-found' ? 404 : 400;
      send(response, status, { reason_code: reasonCode });
    }
  });
  return { server, sessionToken, csrfToken, root: brainRoot };
}

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) || '';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(option('port') || 4782);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    console.error('✗ port inválida');
    process.exit(1);
  }
  try {
    const instance = createConsoleServer({ root: option('root') || process.env.CEREBRO_INSTALL_ROOT || process.cwd() });
    instance.server.listen(port, '127.0.0.1', () => {
      const address = instance.server.address();
      console.log(`Company Brain Console · http://127.0.0.1:${address.port}`);
      console.log('Contexto privado permanece nesta máquina. Abrir a página não executa modelos.');
    });
  } catch (error) {
    console.error(`✗ ${safeReason(error)}`);
    process.exit(1);
  }
}
