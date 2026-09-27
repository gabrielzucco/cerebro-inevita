#!/usr/bin/env node

// Decision Case V1 — o caso é preparado pelo Console, o martelo é humano.
// Cada assert aqui defende uma promessa: autoria, evidência, proveniência,
// idempotência, diff confirmado, recibo auditável e reversão que não destrói trabalho.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  applyDecisionCase,
  decisionCaseIdFor,
  decisionCaseState,
  listDecisionCaseEvents,
  listDecisionCases,
  prepareDecisionCase,
  previewDecisionCase,
  rollbackDecisionCase,
  unifiedDiff,
  validateDecisionCaseReceipt,
} from './lib/decision-case.mjs';

const root = mkdtempSync(join(tmpdir(), 'decision-case-'));
const QUEUE_KEY = 'martelo:corte-do-console-decidir-se-o-decision-case-entra-agora';
const CASE_ID = decisionCaseIdFor(QUEUE_KEY);
const ACTOR = 'role-owner';
const TEXT = 'Aprovo o corte: o Console prepara o caso e eu dou o martelo. Sem escrita automatica, sem veredito sem evidencia.';
const TITLE = 'Decision Case entra agora, com martelo humano';

function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

function digestOf(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function fails(run, reason) {
  assert.throws(run, (error) => {
    assert.equal(error.message, reason);
    return true;
  }, `esperava falhar com ${reason}`);
}

function baseInput(overrides = {}) {
  return {
    verdict: 'decided',
    theme: 'metodo',
    title: TITLE,
    decisionText: TEXT,
    evidenceRefs: [`decision-queue:${QUEUE_KEY}`, 'routine-receipt:recibo-sanitizado', 'note:01-nucleo-privado/_PAINEL.md'],
    actorRef: ACTOR,
    authoredByHuman: true,
    ...overrides,
  };
}

const clockAt = (iso) => () => new Date(iso);
const T0 = '2026-08-26T14:00:00.000Z';

try {
  // ---------------------------------------------------------------- fixture
  mkdirSync(join(root, '.cerebro', 'runtime'), { recursive: true });
  mkdirSync(join(root, '01-nucleo-privado', 'decisoes'), { recursive: true });
  write(join(root, '01-nucleo-privado', '_PAINEL.md'), '# Painel sanitizado\n');
  write(join(root, '.cerebro', 'runtime', 'receipts', 'routines', 'recibo-sanitizado.json'), {
    receipt_id: 'recibo-sanitizado', status: 'completed',
  });
  write(join(root, '.automacao', '_FILA-DECISAO.json'), {
    abertos: {
      [QUEUE_KEY]: {
        titulo: 'Decidir se o Decision Case entra agora (EXP-DEMO-001)',
        categoria: 'martelo',
        first_seen: '2026-08-20',
        last_seen: '2026-08-26',
      },
    },
    historico: [{ chave: 'antigo', titulo: 'ja decidido', fechado: '2026-08-01', idade_no_fechamento: 3 }],
  });

  // ------------------------------------------------- o Console apenas prepara
  const list = listDecisionCases(root);
  assert.equal(list.available, true);
  assert.equal(list.house_ready, true);
  assert.equal(list.open_count, 1);
  assert.equal(list.decided_total, 1);
  assert.equal(list.cases[0].case_id, CASE_ID);
  assert.equal(list.cases[0].state.status, 'pending');

  const prepared = prepareDecisionCase(root, CASE_ID);
  assert.equal(prepared.case_ref, `decision-case:${CASE_ID}`);
  assert.equal(prepared.authorship.required, 'human');
  assert.equal(prepared.authorship.console_authored, false);
  // O Console NUNCA entrega prosa pronta: o rascunho é estrutura, não veredito.
  assert.equal(prepared.draft.decision_text, '');
  const candidateRefs = prepared.evidence_candidates.map((entry) => entry.ref);
  assert(candidateRefs.includes(`decision-queue:${QUEUE_KEY}`));
  assert(candidateRefs.includes('note:01-nucleo-privado/_PAINEL.md'));
  assert(candidateRefs.includes('routine-receipt:recibo-sanitizado'));
  // Proveniência carimbada na origem: artefato de execução é observado, nota é declarada.
  assert.equal(prepared.evidence_candidates.find((entry) => entry.kind === 'routine-receipt').provenance, 'observed');
  assert.equal(prepared.evidence_candidates.find((entry) => entry.kind === 'note').provenance, 'declared');
  // EXP-DEMO-001 aparece no título mas não existe como contrato: candidato inferido não entra fingindo.
  assert.equal(prepared.inferred_refs.includes('experiment:EXP-DEMO-001'), true);
  assert.equal(candidateRefs.includes('experiment:EXP-DEMO-001'), false);

  // ----------------------------------------------------- o que o caso recusa
  const preview = (input, clock = clockAt(T0)) => previewDecisionCase(root, CASE_ID, input, { clock });
  fails(() => preview(baseInput({ evidenceRefs: [`decision-queue:${QUEUE_KEY}`] })), 'evidence-beyond-queue-required');
  fails(() => preview(baseInput({ evidenceRefs: [] })), 'evidence-required');
  fails(() => preview(baseInput({ evidenceRefs: ['routine-receipt:nao-existe'] })), 'evidence-not-found');
  fails(() => preview(baseInput({ evidenceRefs: ['note:02-dados-terceiros/transcricao.md'] })), 'evidence-note-outside-moat');
  fails(() => preview(baseInput({ actorRef: 'agent-console' })), 'human-authorship-required');
  fails(() => preview(baseInput({ authoredByHuman: false })), 'human-authorship-required');
  fails(() => preview(baseInput({ decisionText: 'curto demais' })), 'decision-text-too-short');
  fails(() => preview(baseInput({ decisionText: `${TEXT} contato: alguem@exemplo.com` })), 'decision-text-contains-pii');
  fails(() => preview(baseInput({ decisionText: `${TEXT} token sk-abcdefghijklmnop` })), 'decision-text-looks-like-secret');
  fails(() => preview(baseInput({ verdict: 'talvez' })), 'verdict-invalid');
  fails(() => preview(baseInput({ verdict: 'deferred' })), 'review-on-invalid');
  fails(() => preview(baseInput({ verdict: 'deferred', reviewOn: '2026-08-01' })), 'review-on-not-future');
  // Data impossível não pode virar março em silêncio (achado da revisão).
  fails(() => preview(baseInput({ verdict: 'deferred', reviewOn: '2026-02-30' })), 'review-on-invalid');
  fails(() => preview(baseInput({ verdict: 'deferred', reviewOn: '2026-13-01' })), 'review-on-invalid');
  fails(() => preview(baseInput({ reviewOn: '2026-09-30' })), 'review-on-not-allowed');
  fails(() => previewDecisionCase(root, 'case-00000000000000000000000000000000', baseInput(), { clock: clockAt(T0) }),
    'decision-case-not-found');

  // ------------------------------------------------------ preview não escreve
  const plan = preview(baseInput());
  assert.equal(plan.applied, false);
  assert.equal(plan.external_action_executed, false);
  assert.match(plan.canonical_write.path, /^01-nucleo-privado\/decisoes\/\d{4}-\d{2}-\d{2}-decision-case-entra-agora-com-martelo-humano\.md$/);
  assert.equal(plan.canonical_write.operation, 'create');
  assert.equal(plan.canonical_write.before_digest, null);
  assert.equal(existsSync(join(root, plan.canonical_write.path)), false, 'preview não pode tocar o vault');
  assert(plan.diff.startsWith('--- /dev/null\n+++ b/01-nucleo-privado/decisoes/'));
  assert(plan.diff.includes('+tipo: decisao'));
  assert(plan.diff.includes(`+${TEXT}`));
  // Diff é o conteúdo: cada linha do arquivo aparece como adição.
  assert.equal(plan.diff.split('\n').filter((line) => line.startsWith('+') && !line.startsWith('+++')).length,
    plan.content.split('\n').length);
  assert.equal(digestOf(plan.content), plan.canonical_write.after_digest);
  // A nota carrega proveniência de cada evidência, não só a referência.
  assert(plan.content.includes('| `routine-receipt:recibo-sanitizado` | observado |'));
  assert(plan.content.includes('| `note:01-nucleo-privado/_PAINEL.md` | declarado |'));
  assert(plan.content.includes(`\`decision-case:${CASE_ID}\``));
  assert(plan.content.includes('tipo: decisao'), 'a nota precisa nascer na casa canônica do schema do vault');
  assert(plan.content.includes('pode-ir-comunidade: false'));

  // Preview de outro texto gera outro plano — digest é do plano inteiro.
  const otherPlan = preview(baseInput({ decisionText: `${TEXT} E vale so pro corte de agosto.` }));
  assert.notEqual(otherPlan.plan_digest, plan.plan_digest);

  // ------------------------------------------- aplicar exige o diff confirmado
  const apply = (extra = {}, input = baseInput(), clock = clockAt(T0)) => applyDecisionCase(root, CASE_ID, {
    ...input, planDigest: plan.plan_digest, decidedAt: plan.decided_at, ...extra,
  }, { clock });
  fails(() => apply({ planDigest: undefined }), 'preview-required');
  fails(() => apply({ planDigest: digestOf('outro plano') }), 'preview-stale');
  fails(() => apply({}, baseInput({ decisionText: `${TEXT} texto trocado depois do preview.` })), 'preview-stale');
  fails(() => apply({}, baseInput(), clockAt('2026-08-26T14:20:00.000Z')), 'preview-expired');
  assert.equal(existsSync(join(root, plan.canonical_write.path)), false, 'recusa não pode deixar rastro no vault');

  const applied = apply();
  assert.equal(applied.status, 'applied');
  assert.equal(applied.canonical_write_performed, true);
  assert.equal(applied.external_action_executed, false);
  const notePath = join(root, plan.canonical_write.path);
  assert.equal(existsSync(notePath), true);
  assert.equal(readFileSync(notePath, 'utf8'), plan.content, 'o que foi escrito é byte a byte o diff lido');

  // ------------------------------------------------------- recibo auditável
  const events = listDecisionCaseEvents(root, CASE_ID);
  assert.equal(events.length, 1);
  const receipt = events[0];
  assert.deepEqual(validateDecisionCaseReceipt(receipt), []);
  assert.equal(receipt.event, 'applied');
  assert.equal(receipt.actor_ref, ACTOR);
  assert.equal(receipt.authorship, 'human');
  assert.equal(receipt.plan_digest, plan.plan_digest);
  assert.equal(receipt.decision_text_digest, digestOf(TEXT));
  assert.equal(receipt.privacy.canonical_write, true);
  assert.equal(receipt.privacy.decision_text_recorded, false);
  // O recibo é referência e impressão — nunca o conteúdo da decisão.
  const serialized = JSON.stringify(receipt);
  assert.equal(serialized.includes(TEXT), false, 'recibo não pode guardar o texto do martelo');
  assert.equal(serialized.includes('Painel sanitizado'), false);
  assert.equal(receipt.evidence.length, 3);
  assert.equal(receipt.evidence.every((entry) => /^sha256:[0-9a-f]{64}$/.test(entry.digest)), true);

  // ------------------------------------------------------------ idempotência
  const again = apply();
  assert.equal(again.status, 'already-applied');
  assert.equal(again.canonical_write_performed, false);
  assert.equal(again.receipt_ref, `decision-case-receipt:${receipt.event_id}`);
  assert.equal(listDecisionCaseEvents(root, CASE_ID).length, 1, 'aplicar de novo não cria evento novo');
  assert.equal(readdirSync(join(root, '01-nucleo-privado', 'decisoes')).length, 1);
  fails(() => preview(baseInput()), 'decision-case-already-applied');
  assert.equal(decisionCaseState(root, CASE_ID).status, 'applied');
  assert.equal(decisionCaseState(root, CASE_ID).canonical_path, plan.canonical_write.path);
  assert.equal(listDecisionCases(root).applied_count, 1);

  // --------------------------------------------- reversão não destrói trabalho
  fails(() => rollbackDecisionCase(root, CASE_ID, { actorRef: ACTOR, reasonCode: 'porque-sim' }), 'reason-code-invalid');
  fails(() => rollbackDecisionCase(root, CASE_ID, { actorRef: 'bot-limpeza', reasonCode: 'mistake' }), 'human-authorship-required');
  writeFileSync(notePath, `${plan.content}\n\nEmenda escrita por gente depois do martelo.\n`);
  fails(() => rollbackDecisionCase(root, CASE_ID, { actorRef: ACTOR, reasonCode: 'mistake' }), 'rollback-conflict');
  assert.equal(existsSync(notePath), true, 'conflito não pode apagar edição humana');

  writeFileSync(notePath, plan.content);
  // Ordem causal com relógio CONGELADO: rollback no mesmo instante do apply tem que
  // vencer pela sequência declarada, nunca pelo acaso da ordenação de UUIDs (P1 da revisão).
  const rolledBack = rollbackDecisionCase(root, CASE_ID, { actorRef: ACTOR, reasonCode: 'wrong-evidence' }, {
    clock: clockAt(T0),
  });
  assert.equal(rolledBack.status, 'rolled-back');
  assert.equal(rolledBack.restored_to, 'absent');
  assert.equal(existsSync(notePath), false);
  const snapshotRoot = join(root, '.cerebro', 'runtime', 'decisions', CASE_ID);
  const snapshots = readdirSync(snapshotRoot);
  assert.equal(snapshots.length, 1);
  assert.equal(readFileSync(join(snapshotRoot, snapshots[0]), 'utf8'), plan.content, 'reverter guarda cópia privada');

  assert.equal(decisionCaseState(root, CASE_ID).status, 'rolled-back',
    'com timestamps idênticos, a sequência decide — nunca o UUID');

  const history = listDecisionCaseEvents(root, CASE_ID);
  assert.equal(history.length, 2);
  assert.deepEqual(history.map((event) => event.sequence), [1, 2], 'sequência monotônica declarada');
  const rollbackReceipt = history[1];
  assert.deepEqual(validateDecisionCaseReceipt(rollbackReceipt), []);
  assert.equal(rollbackReceipt.event, 'rolled-back');
  assert.equal(rollbackReceipt.reason_code, 'wrong-evidence');
  assert.equal(rollbackReceipt.applied_event_ref, `decision-case-receipt:${receipt.event_id}`);
  assert.equal(rollbackReceipt.canonical_writes[0].operation, 'delete');
  assert.equal(rollbackReceipt.canonical_writes[0].before_digest, plan.canonical_write.after_digest);

  const rollbackAgain = rollbackDecisionCase(root, CASE_ID, { actorRef: ACTOR, reasonCode: 'mistake' });
  assert.equal(rollbackAgain.status, 'already-rolled-back');
  assert.equal(rollbackAgain.canonical_write_performed, false);
  assert.equal(listDecisionCaseEvents(root, CASE_ID).length, 2);
  assert.equal(decisionCaseState(root, CASE_ID).status, 'rolled-back');

  // Revertido volta a ser decidível — o caso não fica preso.
  const second = previewDecisionCase(root, CASE_ID, baseInput({ verdict: 'deferred', reviewOn: '2026-09-15' }), {
    clock: clockAt('2026-08-26T16:00:00.000Z'),
  });
  assert(second.content.includes('Revisar em **2026-09-15**'));
  const secondApplied = applyDecisionCase(root, CASE_ID, {
    ...baseInput({ verdict: 'deferred', reviewOn: '2026-09-15' }),
    planDigest: second.plan_digest,
    decidedAt: second.decided_at,
  }, { clock: clockAt('2026-08-26T16:01:00.000Z') });
  assert.equal(secondApplied.status, 'applied');
  assert.equal(listDecisionCaseEvents(root, CASE_ID).length, 3);
  assert.equal(decisionCaseState(root, CASE_ID).status, 'applied');

  // --------------------------------------------------------------- validador
  assert(validateDecisionCaseReceipt({ ...receipt, actor_ref: 'agent-console' }).includes('martelo exige autoria humana'));
  assert(validateDecisionCaseReceipt({ ...receipt, authorship: 'assistant' }).includes('authorship precisa ser human'));
  assert(validateDecisionCaseReceipt({ ...receipt, evidence: receipt.evidence.slice(0, 1) })
    .includes('caso precisa de evidência além do próprio item da fila'));
  assert(validateDecisionCaseReceipt({ ...receipt, case_id: 'case-outro' }).includes('case_ref diverge de case_id'));
  assert(validateDecisionCaseReceipt({ ...receipt, privacy: { ...receipt.privacy, external_action_executed: true } })
    .includes('Decision Case não executa ação externa'));
  assert(validateDecisionCaseReceipt({ ...receipt, decision_text: TEXT })
    .includes('decision_case_receipt.decision_text não é permitido'));
  // Os payloads exatos que a revisão provou passarem: kind arbitrário, path numérico,
  // bytes não-numérico e sequência ausente. Nenhum pode voltar [].
  assert(validateDecisionCaseReceipt({
    ...receipt,
    evidence: [{ ...receipt.evidence[0] }, { ...receipt.evidence[1], kind: 'anything' }],
  }).some((error) => error.includes('kind inválido')));
  assert(validateDecisionCaseReceipt({
    ...receipt,
    evidence: [{ ...receipt.evidence[0] }, { ...receipt.evidence[1], path: 42 }],
  }).some((error) => error.includes('path inválido')));
  assert(validateDecisionCaseReceipt({
    ...receipt,
    canonical_writes: [{ ...receipt.canonical_writes[0], bytes: 'not-a-number' }],
  }).some((error) => error.includes('bytes inválido')));
  // recorded_at estrito: "0" (Date.parse aceita como ano 2000) e data impossível
  // normalizada não passam mais (P2 da re-revisão).
  assert(validateDecisionCaseReceipt({ ...receipt, recorded_at: '0' }).includes('recorded_at inválido'));
  assert(validateDecisionCaseReceipt({ ...receipt, recorded_at: '2026-02-30T12:00:00.000Z' })
    .includes('recorded_at inválido'));
  assert(validateDecisionCaseReceipt({ ...receipt, recorded_at: '2026-08-26T14:00:00Z' })
    .includes('recorded_at inválido'), 'sem milissegundos não é o formato do recibo');
  const { sequence: _omitted, ...withoutSequence } = receipt;
  assert(validateDecisionCaseReceipt(withoutSequence).includes('sequence inválida'));
  assert(validateDecisionCaseReceipt({ ...receipt, sequence: 0 }).includes('sequence inválida'));
  assert(validateDecisionCaseReceipt({ ...receipt, review_on: '2026-02-30', verdict: 'deferred' })
    .some((error) => error.includes('review_on inválido')));

  // ------------------------------------------ atomicidade da reversão
  // Se a gravação do recibo falhar depois do unlink, a nota canônica volta:
  // ela nunca desaparece sem um evento de reversão de pé.
  const currentState = decisionCaseState(root, CASE_ID);
  assert.equal(currentState.status, 'applied');
  if (process.platform !== 'win32') {
    // Windows não aplica os bits POSIX de chmod; sem uma falha real não há fault injection.
    const secondNotePath = join(root, currentState.canonical_path);
    assert.equal(existsSync(secondNotePath), true);
    const receiptsDir = join(root, '.cerebro', 'runtime', 'receipts', 'decisions', CASE_ID);
    chmodSync(receiptsDir, 0o500); // leitura ok, escrita negada — writeJsonAtomic falha
    try {
      assert.throws(() => rollbackDecisionCase(root, CASE_ID, { actorRef: ACTOR, reasonCode: 'mistake' }));
    } finally {
      chmodSync(receiptsDir, 0o700);
    }
    assert.equal(existsSync(secondNotePath), true, 'recibo falhou → a nota tem que voltar');
    assert.equal(decisionCaseState(root, CASE_ID).status, 'applied', 'estado intacto após falha de reversão');
  }

  // ------------------------------------ claim exclusivo por sequência (TOCTOU)
  // O nome do arquivo É a sequência: dois processos em corrida disputam o mesmo
  // nome e link(2) exclusivo garante que só um vence — não existem dois N+1.
  const caseReceiptsDir = join(root, '.cerebro', 'runtime', 'receipts', 'decisions', CASE_ID);
  assert.deepEqual(readdirSync(caseReceiptsDir).sort(), ['0001.json', '0002.json', '0003.json'],
    'um arquivo por sequência, nome determinístico — o claim é o filesystem');
  // Histórico ilegível é fail-stop: nada novo se decide em cima de recibo corrompido.
  writeFileSync(join(caseReceiptsDir, '0004.json'), '{lixo');
  assert.throws(() => decisionCaseState(root, CASE_ID));
  assert.throws(() => rollbackDecisionCase(root, CASE_ID, { actorRef: ACTOR, reasonCode: 'mistake' }));
  rmSync(join(caseReceiptsDir, '0004.json'));
  assert.equal(decisionCaseState(root, CASE_ID).status, 'applied');

  // --------------------------------------- fronteira é realpath, não prefixo
  // Um diretório-symlink DENTRO do núcleo apontando para fora (ou para a zona de
  // terceiros) não pode virar evidência `note:` — o caminho lexical mente.
  if (process.platform !== 'win32') {
    const outsideRoot = mkdtempSync(join(tmpdir(), 'decision-case-outside-'));
    write(join(outsideRoot, 'fora-do-cerebro.md'), '# Conteúdo fora do cérebro\n');
    write(join(root, '02-dados-terceiros', 'transcricao-crua.md'), '# Dado de terceiro\n');
    symlinkSync(outsideRoot, join(root, '01-nucleo-privado', 'atalho-externo'));
    symlinkSync(join(root, '02-dados-terceiros'), join(root, '01-nucleo-privado', 'atalho-terceiros'));
    const SYMLINK_QUEUE_KEY = 'martelo:item-novo-para-testar-fronteira-simbolica';
    write(join(root, '.automacao', '_FILA-DECISAO.json'), {
      abertos: {
        [SYMLINK_QUEUE_KEY]: {
          titulo: 'Item novo para testar fronteira simbolica',
          categoria: 'martelo', first_seen: '2026-08-25', last_seen: '2026-08-26',
        },
      },
      historico: [],
    });
    const symlinkCase = decisionCaseIdFor(SYMLINK_QUEUE_KEY);
    const escape = (notePath) => previewDecisionCase(root, symlinkCase, baseInput({
      evidenceRefs: [`decision-queue:${SYMLINK_QUEUE_KEY}`, notePath],
    }), { clock: clockAt('2026-08-26T17:00:00.000Z') });
    fails(() => escape('note:01-nucleo-privado/atalho-externo/fora-do-cerebro.md'), 'evidence-note-outside-moat');
    fails(() => escape('note:01-nucleo-privado/atalho-terceiros/transcricao-crua.md'), 'evidence-note-outside-moat');
    // Symlink INTERNO (realpath dentro do moat) é legítimo — e a leitura acontece no
    // caminho real provado: o digest é do conteúdo do arquivo real, e o path exibido
    // segue sendo o lógico que a pessoa escolheu.
    write(join(root, '01-nucleo-privado', 'subpasta', 'nota-interna.md'), '# Nota interna real\n');
    symlinkSync(join(root, '01-nucleo-privado', 'subpasta'), join(root, '01-nucleo-privado', 'atalho-interno'));
    const internal = previewDecisionCase(root, symlinkCase, baseInput({
      title: 'Teste do symlink interno com titulo proprio',
      evidenceRefs: [`decision-queue:${SYMLINK_QUEUE_KEY}`, 'note:01-nucleo-privado/atalho-interno/nota-interna.md'],
    }), { clock: clockAt('2026-08-26T17:05:00.000Z') });
    const internalEvidence = internal.evidence.find((entry) => entry.kind === 'note');
    assert.equal(internalEvidence.digest, digestOf('# Nota interna real\n'), 'digest é do conteúdo no realpath');
    assert.equal(internalEvidence.path, '01-nucleo-privado/atalho-interno/nota-interna.md', 'path exibido é o lógico');
    rmSync(outsideRoot, { recursive: true, force: true });
  }

  // ------------------------------------------------------------------- diff
  assert.equal(unifiedDiff('a\nb\nc\n', 'a\nB\nc\n', 'x.md'),
    '--- a/x.md\n+++ b/x.md\n@@ -1,4 +1,4 @@\n a\n-b\n+B\n c\n \n');
  assert.equal(unifiedDiff(null, 'so\n', 'novo.md'), '--- /dev/null\n+++ b/novo.md\n@@ -0,0 +1,2 @@\n+so\n+\n');

  // ------------------------------------------- casa canônica precisa existir
  const semCasa = mkdtempSync(join(tmpdir(), 'decision-case-sem-casa-'));
  mkdirSync(join(semCasa, '.cerebro', 'runtime'), { recursive: true });
  write(join(semCasa, '.automacao', '_FILA-DECISAO.json'), { abertos: {}, historico: [] });
  assert.equal(listDecisionCases(semCasa).house_ready, false);
  rmSync(semCasa, { recursive: true, force: true });

  console.log('✓ decision case v1: caso preparado, martelo humano, diff confirmado, recibo e reversão');
} finally {
  rmSync(root, { recursive: true, force: true });
}
