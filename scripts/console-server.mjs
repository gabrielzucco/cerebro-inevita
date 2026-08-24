#!/usr/bin/env node

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
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
import { readPrivateRoutineOutput, writeJudgmentReceipt } from './lib/judgment-protocol.mjs';

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
  response.writeHead(200, { ...headers(type), ...extraHeaders });
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

function judgmentReceiptFrom(pathname) {
  const match = pathname.match(/^\/api\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/judgments$/);
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
      if (request.method === 'GET' && url.pathname === '/styles.css') {
        sendStatic(response, 'styles.css', 'text/css; charset=utf-8');
        return;
      }
      if (request.method === 'GET' && url.pathname === '/favicon.ico') {
        response.writeHead(204, headers());
        response.end();
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
      const outputReceiptId = request.method === 'GET' ? outputReceiptFrom(url.pathname) : null;
      if (outputReceiptId) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        send(response, 200, readPrivateRoutineOutput(brainRoot, outputReceiptId));
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
