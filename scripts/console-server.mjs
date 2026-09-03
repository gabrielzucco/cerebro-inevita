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
import { buildConsoleDemoModel, buildConsoleReadModel, recognizeConsoleBrain } from './lib/console-read-model.mjs';
import { readPrivateRoutineOutput, writeJudgmentReceipt } from './lib/judgment-protocol.mjs';
import {
  bindHermesProject,
  configureHermesTelegram,
  controlHermesGateway,
  disconnectHermesTelegram,
  readHermesStatus,
  runHermesDoctor,
} from './lib/hermes-runtime.mjs';
import { createHermesActivationController } from './lib/hermes-activation.mjs';
import {
  correctionActions,
  correctionView,
  createLearningCandidate,
  readCorrectionComparison,
  rerunWithCorrection,
} from './lib/correction-loop.mjs';

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
  if (!originAllowed(request)) throw new Error('origin-invalid');
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

function correctionActionFrom(pathname) {
  const match = pathname.match(/^\/api\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/(rerun-with-correction|learning-candidates)$/);
  return match ? { receiptId: match[1], action: match[2] } : null;
}

function comparisonReceiptFrom(pathname) {
  const match = pathname.match(/^\/api\/runs\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/comparison$/);
  return match?.[1] || null;
}

function hermesActionFrom(pathname) {
  if (pathname === '/api/integrations/hermes/project/bind') return { kind: 'project-bind' };
  if (pathname === '/api/integrations/hermes/telegram') return { kind: 'telegram-configure' };
  if (pathname === '/api/integrations/hermes/telegram/disconnect') return { kind: 'telegram-disconnect' };
  if (pathname === '/api/integrations/hermes/doctor') return { kind: 'doctor' };
  const gateway = pathname.match(/^\/api\/integrations\/hermes\/gateway\/(install|start|stop|restart)$/);
  return gateway ? { kind: 'gateway', action: gateway[1] } : null;
}

function hermesActivationActionFrom(pathname) {
  const routes = new Map([
    ['/api/integrations/hermes/activation/prepare/start', 'prepare-start'],
    ['/api/integrations/hermes/activation/codex/start', 'codex-start'],
    ['/api/integrations/hermes/activation/telegram/start', 'telegram-start'],
    ['/api/integrations/hermes/activation/owner/confirm', 'owner-confirm'],
    ['/api/integrations/hermes/activation/owner/reject', 'owner-reject'],
    ['/api/integrations/hermes/activation/cancel', 'cancel'],
  ]);
  return routes.get(pathname) || null;
}

function hostAllowed(request) {
  const value = String(request.headers.host || '').toLowerCase();
  const hostname = value.startsWith('[') ? value.slice(0, value.indexOf(']') + 1) : value.split(':', 1)[0];
  return ['127.0.0.1', 'localhost', '[::1]'].includes(hostname);
}

function originAllowed(request) {
  const raw = String(request.headers.origin || '');
  if (!raw) return false;
  try {
    const origin = new URL(raw);
    return origin.protocol === 'http:'
      && ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname === '::1' ? '[::1]' : origin.hostname)
      && origin.host.toLowerCase() === String(request.headers.host || '').toLowerCase();
  } catch {
    return false;
  }
}

export function createConsoleServer({
  root,
  spawn,
  spawnCollector,
  hermesRunner,
  hermesEnv = process.env,
  hermesSpawn,
  hermesFetch,
  hermesPlatform,
  demo = false,
  clock = () => new Date(),
  sessionToken = opaqueToken(),
  csrfToken = opaqueToken(),
} = {}) {
  const brainRoot = resolve(root || process.cwd());
  recognizeConsoleBrain(brainRoot);
  let lastDoctor = null;
  let hermesCache = null;
  let hermesCacheAt = 0;
  const hermesActivation = demo ? null : createHermesActivationController({
    root: brainRoot,
    hermesRunner,
    hermesEnv,
    ...(hermesSpawn ? { spawnProcess: hermesSpawn } : {}),
    ...(hermesFetch ? { fetcher: hermesFetch } : {}),
    ...(hermesPlatform ? { platform: hermesPlatform } : {}),
    clock: () => clock().getTime(),
  });
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const sessionCookie = `${COOKIE_NAME}=${sessionToken}; HttpOnly; SameSite=Strict; Path=/`;
    try {
      if (!hostAllowed(request)) {
        send(response, 421, { reason_code: 'host-not-allowed' });
        return;
      }
      if (demo && request.method !== 'GET') throw new Error('demo-read-only');
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
        const model = demo
          ? buildConsoleDemoModel({ now: clock() })
          : buildConsoleReadModel(brainRoot, { now: clock() });
        const hermes = demo ? {
          installed: true,
          version: 'Hermes Agent · demonstração',
          provider_configured: true,
          provider_label: 'OpenAI Codex',
          codex_authenticated: true,
          project_bound: true,
          skills_trusted: true,
          skills_trust_supported: true,
          telegram: { token_configured: true, allowlist_configured: true, allowed_user_count: 1, home_channel_configured: true, allow_all_disabled: true },
          gateway: { installed: true, running: true },
          last_doctor: { status: 'passed', checked_at: clock().toISOString() },
          activation: {
            phase: 'ready',
            action: { id: null, kind: null, status: 'succeeded', progress: 100, verification_url: null, user_code: null, expires_at: null, error_code: null },
            bot: { username: 'inevita_demo_bot', owner_candidate_display: null, connected: true },
          },
        } : (() => {
          if (!hermesCache || Date.now() - hermesCacheAt >= 3_000) {
            hermesCache = readHermesStatus(brainRoot, { runner: hermesRunner, env: hermesEnv, lastDoctor });
            hermesCacheAt = Date.now();
          }
          return { ...hermesCache, activation: hermesActivation.status() };
        })();
        send(response, 200, { ...model, hermes });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/integrations/hermes/activation') {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        if (demo) {
          send(response, 200, {
            phase: 'ready',
            action: { id: null, kind: null, status: 'succeeded', progress: 100, verification_url: null, user_code: null, expires_at: null, error_code: null },
            bot: { username: 'inevita_demo_bot', owner_candidate_display: null, connected: true },
          });
        } else {
          send(response, 200, hermesActivation.status());
        }
        return;
      }
      const activationAction = request.method === 'POST' ? hermesActivationActionFrom(url.pathname) : null;
      if (activationAction) {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        let result;
        if (activationAction === 'prepare-start') result = hermesActivation.startPrepare();
        else if (activationAction === 'codex-start') result = hermesActivation.startCodex();
        else if (activationAction === 'telegram-start') result = hermesActivation.startTelegram(payload.token);
        else if (activationAction === 'owner-confirm') result = hermesActivation.confirmOwner(payload.action_id);
        else if (activationAction === 'owner-reject') result = hermesActivation.rejectOwner(payload.action_id);
        else result = hermesActivation.cancel(payload.action_id);
        hermesCache = null;
        send(response, 202, result);
        return;
      }
      const hermesAction = request.method === 'POST' ? hermesActionFrom(url.pathname) : null;
      if (hermesAction) {
        const payload = await body(request);
        assertMutation(request, sessionToken, csrfToken, payload);
        const options = { runner: hermesRunner, env: hermesEnv };
        let result;
        if (hermesAction.kind === 'project-bind') {
          result = bindHermesProject(brainRoot, options);
        } else if (hermesAction.kind === 'telegram-configure') {
          result = configureHermesTelegram(brainRoot, payload, options);
        } else if (hermesAction.kind === 'telegram-disconnect') {
          result = disconnectHermesTelegram(brainRoot, options);
        } else if (hermesAction.kind === 'doctor') {
          lastDoctor = runHermesDoctor(brainRoot, options);
          result = lastDoctor;
        } else {
          result = controlHermesGateway(brainRoot, hermesAction.action, options);
        }
        hermesCache = null;
        send(response, 200, result);
        return;
      }
      const outputReceiptId = request.method === 'GET' ? outputReceiptFrom(url.pathname) : null;
      if (outputReceiptId) {
        if (!exactEqual(cookies(request)[COOKIE_NAME], sessionToken)) throw new Error('session-required');
        if (demo && outputReceiptId === 'demo-run-001') {
          const content = '# Decisões da call\n\n- Priorizar a primeira entrega antes de ampliar o escopo.\n- Reutilizar o contexto aprovado no próximo briefing.\n\n> Demonstração sintética — nenhuma fonte real foi aberta.';
          send(response, 200, {
            receipt: { receipt_id: outputReceiptId, receipt_ref: `routine-receipt:${outputReceiptId}`, run_id: 'demo-run', routine_id: 'calls-em-decisoes', system_ref: 'calls', trigger: 'manual', completed_at: '2026-08-28T13:22:00.000Z', output_ref: 'private-output:demo-run-001' },
            output: { content, bytes: Buffer.byteLength(content), media_type: 'text/markdown; charset=utf-8' },
            judgment: { current: null, summary: { status: 'pending', verdict: null, action_intent: 'none', history_count: 0 }, history: [] },
            correction: null,
            correction_actions: { can_rerun_with_correction: false, can_compare: false, can_create_learning_candidate: false },
            privacy: { content_shared_with_inevita: false, output_in_console_read_model: false, explicit_local_read: true },
          });
          return;
        }
        send(response, 200, {
          ...readPrivateRoutineOutput(brainRoot, outputReceiptId),
          correction: correctionView(brainRoot, outputReceiptId),
          correction_actions: correctionActions(brainRoot, outputReceiptId),
        });
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
      const status = ['session-required', 'csrf-invalid', 'origin-invalid'].includes(reasonCode) ? 403
        : reasonCode === 'not-found' ? 404
          : reasonCode === 'demo-read-only' ? 409 : 400;
      send(response, status, { reason_code: reasonCode });
    }
  });
  server.once('close', () => hermesActivation?.dispose());
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
    const instance = createConsoleServer({
      root: option('root') || process.env.CEREBRO_INSTALL_ROOT || process.cwd(),
      demo: process.argv.includes('--demo'),
    });
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
