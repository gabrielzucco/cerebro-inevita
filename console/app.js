let operationalCanvasModulePromise = null;

function loadOperationalCanvas() {
  if (!operationalCanvasModulePromise) {
    operationalCanvasModulePromise = import('/canvas.bundle.js?v=5').catch((error) => {
      operationalCanvasModulePromise = null;
      throw error;
    });
  }
  return operationalCanvasModulePromise;
}

const state = {
  model: null,
  csrf: '',
  view: 'today',
  initialRouteResolved: false,
  selectedRoutine: null,
  selectedJudgment: null,
  selectedExperiment: null,
  busy: false,
  operatingAreaFilter: (() => { try { return localStorage.getItem('cb-operating-area') || ''; } catch { return ''; } })(),
  rerunPending: false,
  runs: {
    data: null,
    filters: { system: '', routine: '', mode: '', status: '', decision: '', snapshot: '' },
    sort: { key: 'when', dir: 'desc' },
    cmpA: '', cmpB: '',
  },
  systems: { category: 'all', stage: 'all', query: '', interfaceHealth: {} },
  brain: {
    mode: (() => {
      try {
        const saved = localStorage.getItem('cb-brain-mode');
        return ['overview', 'memory', 'recovery', 'learning', 'architecture', 'updates'].includes(saved) ? saved : 'overview';
      } catch { return 'overview'; }
    })(),
    query: '',
    updates: { data: null, loading: false, checking: false, applying: false, error: null },
  },
  brainGraph: null,
  skills: { origin: 'company', status: 'all', link: 'all', query: '', data: null, loading: false, error: null },
  society: { filter: 'all', query: '', data: null, loading: false, error: null, selected: null },
  cases: { list: null, detail: null, form: null, preview: null, actor: '' },
  canvas: {
    scope: 'brain', ref: null, editable: false, controller: null, graph: null, positions: null,
  },
};

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
})[character]);
const fmtDate = (value, withTime = true) => value ? new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', ...(withTime ? { timeStyle: 'short' } : {}),
}).format(new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value)) : '—';

const sameLocalDay = (value, reference = new Date()) => {
  if (!value) return false;
  const date = new Date(value);
  return date.getFullYear() === reference.getFullYear()
    && date.getMonth() === reference.getMonth()
    && date.getDate() === reference.getDate();
};
const fmtClock = (value) => value ? new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date(value)) : '—';
const fmtRelative = (value) => {
  if (!value) return '—';
  const diff = Date.parse(value) - Date.now();
  const minutes = Math.round(Math.abs(diff) / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return diff >= 0 ? `em ${minutes} min` : `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return diff >= 0 ? `em ${hours}h` : `há ${hours}h`;
  const days = Math.round(hours / 24);
  return diff >= 0 ? `em ${days}d` : `há ${days}d`;
};

function fmtDuration(value) {
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value < 1000) return `${Math.round(value)} ms`;
  if (value < 60_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0).replace('.0', '')}s`;
  const minutes = Math.floor(value / 60_000);
  const seconds = Math.round((value % 60_000) / 1000);
  return seconds === 60 ? `${minutes + 1}min` : `${minutes}min ${String(seconds).padStart(2, '0')}s`;
}

const labels = {
  active: 'Ativa',
  'ready-manual-run': 'Pronta para replay',
  'ready-to-activate': 'Pronta para ativar',
  'legacy-schedule-not-paused': 'Agenda antiga não pausada',
  'routine-paused': 'Pausada',
  'routine-not-approved': 'Aguardando aprovação',
  'routine-migration-cancelled': 'Migração cancelada',
  'executor-missing': 'Executor ausente',
  'executor-authentication-required': 'Login necessário',
  'executor-degraded': 'Executor degradado',
  'awaiting-legacy-pause': 'Aguardando pausa da agenda antiga',
  'ready-for-activation': 'Agenda antiga pausada',
  'cutover-completed': 'Migração concluída',
  'future-only': 'Revogação vale para o futuro',
  'receipt-only': 'Revogação apenas auditável',
  'irreversible-export': 'Cópia não revogável',
  manual: 'Manual', schedule: 'Agenda', read: 'Leitura',
  completed: 'Concluída', failed: 'Falhou', denied: 'Negada', skipped: 'Pulada',
  'runtime-enforced': 'Bloqueio pelo runtime',
  'receipt-audited': 'Auditado por recibo', exported: 'Cópia exportada', unknown: 'Não verificado',
  pending: 'Pendente', decided: 'Julgado', approved: 'Aprovado',
  'changes-requested': 'Pedir ajuste', changes_requested: 'Pedir ajuste', rejected: 'Rejeitado',
  started: 'Iniciada',
  'propose-action': 'Intenção de ação', none: 'Sem ação', unavailable: 'Indisponível',
  candidate: 'Candidato', baseline: 'Baseline',
  'not-eligible': 'Ainda não elegível',
  recorded: 'Contexto selecionado',
  'context-not-recorded': 'Contexto não registrado',
  declared: 'Declarado', running: 'Em execução', gap: 'Lacuna',
  'evaluation-passed': 'Gates passaram', 'evaluation-gate-failed': 'Gate falhou',
  reconstructed: 'Reconstruído',
  queued: 'Na fila', 'ready-for-read': 'Pronto para leitura', decided: 'Decidido', cancelled: 'Cancelado', blocked: 'Bloqueado',
  contract: 'Contrato', execution: 'Execução', measurement: 'Medição', decision: 'Martelo', learning: 'Aprendizado',
  'not-started': 'Não iniciado', collecting: 'Coletando', ready: 'Pronto', complete: 'Completo',
  'not-executed': 'Não executado', linked: 'Ligado', unlinked: 'Não ligado', 'not-applicable': 'Não se aplica',
  source: 'Fonte', area: 'Área', system: 'Sistema', routine: 'Rotina',
  collector: 'Coleta', retrieval: 'Contexto', skill: 'Skill', capability: 'Capability',
  stage: 'Etapa', artifact: 'Artefato', output: 'Output', gate: 'Gate', judgment: 'Julgamento',
  run: 'Execução', handoff: 'Handoff', model: 'Modelo', connector: 'Conector',
  replay: 'Replay', live: 'Ao vivo',
  'requested-not-verified': 'Solicitado, não verificado', 'provider-reported': 'Reportado pelo provider', verified: 'Verificado',
  met: 'Atendido', partial: 'Parcial', missing: 'Ausente', installed: 'Instalado', degraded: 'Degradado',
  available: 'Alinhada', 'motor-only': 'Só no motor', company: 'Da empresa', engine: 'Do motor',
  'authentication-required': 'Login necessário', 'read-only': 'Somente leitura', 'workspace-write': 'Escrita no workspace',
  'codex-cli': 'Codex CLI', 'claude-code': 'Claude Code',
  new: 'Começando do zero', 'organized-context': 'Contexto organizado',
  'human-capture': 'Captura humana',
  'partial-brain': 'Cérebro parcial', 'inevita-compatible': 'Compatível com INEVITA',
  foundation: 'Fundação', contracted: 'Contratado', operational: 'Operacional',
  valid: 'Válido', invalid: 'Inválido', unassigned: 'Ainda não atribuído', assigned: 'Atribuído',
  'run-ledger-invalid': 'Ledger de runs ilegível', 'routine-receipt-invalid': 'Recibo de rotina ilegível',
  // Decision Case — o vocabulário do martelo humano na fonte canônica.
  applied: 'Registrado', 'rolled-back': 'Revertido', 'already-applied': 'Já registrado',
  'already-rolled-back': 'Já revertido', 'nothing-to-roll-back': 'Nada a reverter',
  decided: 'Decidido', dropped: 'Descartado', deferred: 'Adiado',
  'preview-required': 'Simule antes de registrar',
  'preview-stale': 'A simulação não vale mais — simule de novo',
  'preview-expired': 'Simulação vencida — simule de novo',
  'preview-in-future': 'Simulação com data no futuro',
  'rollback-conflict': 'A nota mudou depois do martelo — reversão bloqueada',
  'evidence-required': 'Escolha a evidência', 'evidence-not-found': 'Evidência não abre no disco',
  'evidence-beyond-queue-required': 'Precisa de evidência além do item da fila',
  'evidence-note-outside-moat': 'Nota fora do núcleo privado não vira evidência',
  'human-authorship-required': 'O martelo exige autoria humana',
  'decision-text-too-short': 'Texto da decisão curto demais',
  'decision-text-contains-pii': 'Texto com dado pessoal — o vault não aceita',
  'decision-text-looks-like-secret': 'Texto parece conter segredo',
  'title-invalid': 'Título fora do tamanho permitido',
  'review-on-invalid': 'Adiar exige data de revisão',
  'review-on-not-future': 'A data de revisão precisa ser no futuro',
  'canonical-target-exists': 'Já existe nota com esse nome hoje',
  'canonical-target-missing': 'A nota registrada não está mais no lugar',
  'decision-case-already-applied': 'Este caso já tem martelo',
  'decision-case-not-found': 'Item saiu da fila — caso não existe mais',
  'decision-notes-missing': 'A casa canônica das decisões não existe',
  'wrong-verdict': 'Veredito errado', 'wrong-evidence': 'Evidência errada',
  duplicate: 'Duplicado', superseded: 'Superado', mistake: 'Registro por engano',
};

function label(value) {
  return labels[value] || String(value || '—').replaceAll('-', ' ');
}

function tone(reason) {
  if (['active', 'completed', 'ready-manual-run', 'ready-to-activate', 'approved', 'decided'].includes(reason)) return 'good';
  if (['legacy-schedule-not-paused', 'routine-paused', 'executor-authentication-required', 'pending', 'changes-requested', 'gap', 'ready-for-read', 'unlinked'].includes(reason)) return 'warn';
  if (['declared', 'running', 'skipped', 'queued', 'collecting', 'not-started'].includes(reason)) return 'neutral';
  return 'bad';
}

function badge(value, customTone = tone(value), customLabel = label(value)) {
  return `<span class="badge ${customTone}"><i></i>${escapeHtml(customLabel)}</span>`;
}

function toast(message, kind = 'good') {
  const element = $('#toast');
  element.className = `toast visible ${kind}`;
  element.textContent = message;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { element.className = 'toast'; }, 4200);
}

async function getJson(path) {
  const response = await fetch(path, { credentials: 'same-origin' });
  const value = await response.json();
  if (!response.ok) throw new Error(value.reason_code || 'request-failed');
  return value;
}

async function mutate(path, payload, method = 'POST') {
  const response = await fetch(path, {
    method, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Cerebro-CSRF': state.csrf },
    body: JSON.stringify({ ...payload, confirm: true }),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.reason_code || 'request-failed');
  return value;
}

function summaryCards() {
  const model = state.model;
  if (state.view === 'compatibility') {
    const diagnostic = model.compatibility;
    return [
      ['Compatibilidade', `${diagnostic.score.percent}%`, `${diagnostic.score.met}/${diagnostic.score.applicable} checks atendidos`, 'signal'],
      ['Fontes governadas', diagnostic.inventory.sources.valid, 'Contrato válido; presença não significa conexão', 'receipt'],
      ['Sistemas declarados', diagnostic.inventory.systems.valid, `${diagnostic.inventory.systems.retrieval_v2} com recuperação V2`, 'play'],
      ['Runs com contexto', diagnostic.inventory.runs.context_snapshot_v2, `${diagnostic.inventory.runs.valid} execuções observadas`, 'decision'],
    ].map(summaryCard).join('');
  }
  const active = model.today.active.length;
  const ready = model.today.ready_to_work.length;
  const judgments = model.counts.judgments;
  const queueCount = state.decisions?.available ? state.decisions.open_count : null;
  return [
    ...(queueCount !== null ? [['Fila de decisão', queueCount, 'Decisões do cérebro esperando seu martelo hoje', 'decision', true]] : []),
    ['Rotinas ativas', active, 'Rodam apenas quando o estado canônico está ativo', 'signal'],
    ['Aguardam julgamento', judgments, 'Outputs privados de rotina para julgar', 'decision', true],
    ['Prontas para trabalhar', ready, 'Replay manual não liga o agendamento', 'play'],
    ['Recibos privados', model.routines.reduce((total, routine) => total + routine.receipts.length, 0), 'Prompt e output não aparecem no ledger', 'receipt'],
  ].map(summaryCard).join('');
}

// O card só chama atenção quando o número pede ação humana — o zero não grita.
function summaryCard([title, value, description, icon, actionable]) {
  return `<article class="summary-card${actionable && Number(value) > 0 ? ' is-actionable' : ''}"><small><span class="summary-icon ${icon}"></span>${title}</small><strong>${value}</strong><p>${description}</p></article>`;
}

function routineTodayChip(routine) {
  if (routine.trigger !== 'schedule') return '<span class="run-chip neutral">Sob demanda</span>';
  const today = routine.receipts.filter((receipt) => sameLocalDay(receipt.started_at || receipt.completed_at));
  if (!today.length) {
    return routine.state.status === 'active'
      ? '<span class="run-chip warn">Ainda não rodou hoje</span>'
      : '<span class="run-chip neutral">Agenda parada</span>';
  }
  const failed = today.filter((receipt) => receipt.status !== 'completed').length;
  const times = today.length > 1 ? ` · ${today.length}x` : '';
  if (failed === today.length) return `<span class="run-chip bad">Hoje: só falha${times}</span>`;
  if (failed) return `<span class="run-chip warn">Rodou hoje${times} · ${failed} falha(s)</span>`;
  return `<span class="run-chip good">Rodou hoje ${fmtClock(today[0].completed_at || today[0].started_at)}${times}</span>`;
}

function routineCard(routine) {
  const access = routine.access.length ? routine.access.map((item) => badge(item.assurance, item.assurance === 'runtime-enforced' ? 'good' : 'neutral')).join('') : '<span class="muted">Sem grants declarados</span>';
  const last = routine.receipts[0] || null;
  const next = routine.next_scheduled_at
    ? `${fmtRelative(routine.next_scheduled_at)} · ${fmtDate(routine.next_scheduled_at)}`
    : routine.state.status === 'disabled' ? 'Relógio desligado' : 'Sem próxima ocorrência';
  const origin = routine.product_kind === 'brain-native' ? 'Rotina do Cérebro' : 'Rotina de Sistema';
  return `<article class="routine-card" data-routine-kind="${escapeHtml(routine.product_kind)}" data-open-routine="${escapeHtml(routine.routine_id)}" role="button" tabindex="0">
    <div class="routine-card-head"><div class="routine-symbol">↻</div><div><p class="micro">${escapeHtml(origin)} · ${escapeHtml(routine.system_ref)}</p><h3>${escapeHtml(routine.name)}</h3></div>${badge(routine.health_reason_code)}</div>
    <div class="run-chips">${routineTodayChip(routine)}${last ? `<span class="run-chip ${tone(last.status)}">Último: ${escapeHtml(label(last.status))} ${escapeHtml(fmtRelative(last.completed_at || last.started_at))}</span>` : '<span class="run-chip neutral">Nunca executou</span>'}</div>
    <div class="routine-meta"><span><b>Cadência</b>${escapeHtml(routine.schedule)}</span><span><b>Próxima</b>${escapeHtml(next)}</span></div>
    <div class="routine-meta"><span><b>Executor</b>${escapeHtml(routine.binding.adapter)} · ${escapeHtml(routine.binding.requested_model)}</span></div>
    <div class="assurance-row">${access}</div>
    <div class="card-footer"><button type="button" class="table-action" data-runs-for-routine="${escapeHtml(routine.routine_id)}">${routine.receipts.length} execução(ões) →</button><button data-open-routine="${escapeHtml(routine.routine_id)}">Inspecionar <b>→</b></button></div>
  </article>`;
}

function empty(title, body) {
  return `<div class="empty"><div class="empty-mark">◇</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></div>`;
}

function renderActivation() {
  const activation = state.model.activation;
  const current = activation.steps.find((step) => step.id === activation.current_step) || activation.steps[0];
  const started = activation.status === 'in-progress';
  const progress = Math.round((activation.completed_steps / activation.total_steps) * 100);
  return `<div class="first-mission">
    <section class="first-mission-hero">
      <div class="first-mission-copy">
        <p class="micro">PRIMEIRA MISSÃO · ${started ? 'EM ANDAMENTO' : 'COMECE POR AQUI'}</p>
        <h2>${started ? escapeHtml(current.name) : 'Ative seu Cérebro com um trabalho que já precisa acontecer.'}</h2>
        <p>${started ? escapeHtml(current.description) : 'Você não precisa organizar a empresa inteira nem conectar ferramentas. Traga um trabalho real e uma pequena amostra da realidade; o resto nasce do uso.'}</p>
        <div class="first-mission-actions">
          <button type="button" class="first-mission-primary" data-copy-ref="${escapeHtml(activation.command)}">Copiar ${escapeHtml(activation.command)}</button>
          <button type="button" class="first-mission-secondary" data-view="anatomy">Conhecer o Cérebro</button>
        </div>
        <small>Cole o comando na conversa com seu agente. Abrir este cockpit não chama modelo, conecta Fonte nem envia conteúdo.</small>
      </div>
      <div class="first-mission-promise" aria-label="O que esta missão prova">
        <span class="first-mission-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <p class="micro">O QUE VAI FICAR PRONTO</p>
        <strong>Um resultado que você usaria.</strong>
        <p>Depois, o mesmo contexto volta para uma segunda tarefa sem você precisar explicar tudo outra vez.</p>
        <div><span>Cérebro</span><i>prepara contexto</i><span>Sistema</span><i>produz resultado</i></div>
      </div>
    </section>

    <section class="first-mission-source">
      <div><p class="micro">E SE EU NÃO TIVER FONTE CONECTADA?</p><h3>Nenhuma integração é necessária para começar.</h3><p>A fonte-semente é só o menor pedaço de realidade capaz de sustentar o primeiro trabalho.</p></div>
      <ul>${activation.seed_options.map((option) => `<li><i></i>${escapeHtml(option)}</li>`).join('')}</ul>
    </section>

    <section class="first-mission-progress">
      <header><div><p class="micro">ATIVAÇÃO POR USO</p><h3>${activation.completed_steps} de ${activation.total_steps} passos observados</h3></div><span>${progress}%</span></header>
      <progress max="100" value="${progress}">${progress}%</progress>
      <ol>${activation.steps.map((step, index) => {
        const stepState = step.completed_at ? 'complete' : step.id === activation.current_step ? 'current' : 'pending';
        return `<li class="${stepState}"><span>${step.completed_at ? '✓' : String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(step.name)}</strong><p>${escapeHtml(step.description)}</p>${step.completed_at ? `<small>observado em ${fmtDate(step.completed_at)}</small>` : ''}</div></li>`;
      }).join('')}</ol>
    </section>
  </div>`;
}

const compatibilityReasons = {
  'canonical-manifest-valid': 'A instalação declara protocolo, referências e capacidades sem duplicar o inventário.',
  'canonical-manifest-missing': 'Ainda não existe um Brain Manifest V1 canônico.',
  'legacy-marker-only': 'O Console reconhece o legado, mas ele ainda não declara o Manifest V1.',
  'layout-compatible': 'Os caminhos canônicos são relativos, seguros e suficientes para o read model.',
  'layout-incompatible': 'O layout está ausente, incompleto ou contém uma referência incompatível.',
  'local-privacy-declared': 'Dados permanecem locais e recibos são reference-only.',
  'legacy-privacy-boundary': 'A fronteira existe no legado, mas ainda não está formalizada no Manifest V1.',
  'privacy-profile-missing': 'A instalação ainda não declara sua fronteira de dados.',
  'company-map-present': 'Existe uma referência canônica para o mapa da empresa.',
  'organized-context-without-canonical-map': 'Existe estrutura útil, mas ela ainda não está costurada a um mapa canônico.',
  'company-context-missing': 'Ainda não há mapa nem estrutura de contexto reconhecível.',
  'source-contracts-valid': 'Fontes possuem casa de verdade, autoridade e política declaradas.',
  'source-contracts-missing': 'Nenhuma Fonte possui contrato válido ainda.',
  'system-contracts-valid': 'Existem resultados executáveis declarados por contrato.',
  'system-contracts-missing': 'Nenhum Sistema foi contratado ainda.',
  'retrieval-v2-complete': 'Todos os Sistemas declaram seleção, frescor, conflito e fallback.',
  'retrieval-v2-partial': 'Somente parte dos Sistemas usa o Retrieval Contract V2.',
  'retrieval-v2-missing': 'Ainda não existe recuperação de contexto V2 declarada.',
  'run-records-valid': 'Existe execução observada com Run Record válido.',
  'run-records-missing': 'Ainda não existe execução observada.',
  'context-snapshots-complete': 'Todos os Runs observados registram o contexto exato usado.',
  'context-snapshots-partial': 'Somente parte dos Runs registra Context Snapshot V2.',
  'context-snapshots-missing': 'Ainda não existe recibo exato do contexto usado.',
};

function compatibilityReason(value) {
  return compatibilityReasons[value] || label(value);
}

function diagnosticList(items, emptyText, { limit = 8, raw = false } = {}) {
  const visible = items.slice(0, limit);
  return items.length
    ? `<ul>${visible.map((item) => `<li>${escapeHtml(raw ? item : compatibilityReason(item))}</li>`).join('')}${items.length > limit ? `<li class="more-items">+ ${items.length - limit} item(ns) preservado(s)</li>` : ''}</ul>`
    : `<p class="muted">${escapeHtml(emptyText)}</p>`;
}

function evidenceMarkup(refs) {
  const visible = refs.slice(0, 2);
  return `${visible.map((ref) => `<code>${escapeHtml(ref)}</code>`).join('')}${refs.length > 2 ? `<span>+ ${refs.length - 2} evidências</span>` : ''}` || '<span>sem evidência técnica</span>';
}

function readinessReason(value) {
  if (value === 'system-not-active:configured') return 'Configurado; falta evidência para ativar';
  if (value === 'system-not-active:mapped') return 'Mapeado; contrato ainda não configurado';
  if (value === 'retrieval-not-declared') return 'Recuperação de contexto ainda não declarada';
  if (value.startsWith('source-role-unbound:')) return `Papel de Fonte sem vínculo: ${value.split(':').at(-1)}`;
  if (value.startsWith('source-contract-missing:')) return `Contrato de Fonte ausente: ${value.split(':').at(-1)}`;
  return label(value);
}

function renderCompatibility() {
  const diagnostic = state.model.compatibility;
  const readiness = diagnostic.system_readiness;
  const checks = diagnostic.checks.map((item) => `<article class="compat-check ${escapeHtml(item.status)}">
    <div>${badge(item.status, item.status === 'met' ? 'good' : item.status === 'partial' ? 'warn' : 'bad')}<code>${escapeHtml(item.id)}</code></div>
    <h3>${escapeHtml(item.label)}</h3>
    <p>${escapeHtml(compatibilityReason(item.reason_code))}</p>
    <div class="compat-evidence">${evidenceMarkup(item.evidence_refs)}</div>
  </article>`).join('');
  const ready = readiness.ready.map((item) => `<li><code>${escapeHtml(item.system_id)}</code><span>pode receber Run pelo protocolo atual</span></li>`).join('');
  const blocked = readiness.blocked.map((item) => `<li><code>${escapeHtml(item.system_id)}</code><span>${item.blockers.map((reason) => escapeHtml(readinessReason(reason))).join(' · ')}</span></li>`).join('');
  const profile = diagnostic.manifest.profile ? `${diagnostic.manifest.profile} · Manifest V${diagnostic.manifest.version}` : 'manifesto canônico ausente';
  return `<div class="compat-page">
    <section class="compat-hero">
      <div class="compat-score"><strong>${diagnostic.score.percent}</strong><span>% compatível</span></div>
      <div><p class="eyebrow">COMPATIBILITY DOCTOR · READ-ONLY</p><h2>${escapeHtml(label(diagnostic.target.classification))}</h2><p>Estágio ${escapeHtml(label(diagnostic.target.activation_stage))} · ${escapeHtml(profile)}</p><progress max="${diagnostic.score.applicable}" value="${diagnostic.score.met}">${diagnostic.score.percent}%</progress></div>
      <div class="compat-guarantee"><span>Não abriu conteúdo</span><span>Não conectou Fonte</span><span>Não migrou nada</span></div>
    </section>
    <div class="section-heading"><div><p class="eyebrow">9 CONTRATOS DE COMPATIBILIDADE</p><h2>O que existe de verdade</h2></div><p>Presença técnica é declaração. Só Run e recibo válido contam como observado.</p></div>
    <div class="compat-grid">${checks}</div>
    <div class="compat-lower-grid">
      <section class="compat-panel"><div class="section-heading"><div><p class="eyebrow">SYSTEM READINESS</p><h2>Sistemas instalados</h2></div></div><div class="readiness-group"><h3>Prontos pelo protocolo</h3><ul>${ready || '<li><span>Nenhum Sistema pronto ainda.</span></li>'}</ul></div><div class="readiness-group blocked"><h3>Bloqueados honestamente</h3><ul>${blocked || '<li><span>Nenhum bloqueio protocolar.</span></li>'}</ul></div></section>
      <section class="compat-panel"><div class="section-heading"><div><p class="eyebrow">PLANO SEM DESTRUIÇÃO</p><h2>Preservar, adaptar e adicionar</h2></div></div><div class="migration-plan"><article><span>Preservar</span>${diagnosticList(diagnostic.recommendations.preserve, 'Nenhuma evidência canônica ainda.', { limit: 6, raw: true })}</article><article><span>Adaptar</span>${diagnosticList(diagnostic.recommendations.adapt, 'Nada precisa ser adaptado.')}</article><article><span>Adicionar</span>${diagnosticList(diagnostic.recommendations.add, 'Fundação protocolar completa.')}</article><article class="do-not-touch"><span>Não tocar</span>${diagnosticList(diagnostic.recommendations.do_not_touch, '')}</article></div></section>
    </div>
    <div class="boundary-note compat-boundary"><b>Diagnóstico não é migração</b>O próximo passo continua sendo preview → diff → confirmação. Este readback não criou outro cérebro, não moveu Fontes e não alterou nenhum contrato.</div>
  </div>`;
}

function judgmentCard(item) {
  const current = item.judgment;
  const status = current.status === 'pending' ? 'pending' : current.verdict || current.status;
  const action = current.action_intent === 'propose-action' ? badge('propose-action', 'neutral') : '';
  const correction = item.correction ? badge(item.correction.role, 'neutral') : '';
  const learning = item.correction?.learning_candidate
    ? `Aprendizado ${item.correction.learning_candidate.occurrences}/${item.correction.learning_candidate.promotion_threshold}`
    : '';
  return `<article class="judgment-card" data-open-judgment="${escapeHtml(item.receipt_id)}">
    <div class="judgment-head"><div><p class="micro">${escapeHtml(item.system_ref)} · ${escapeHtml(item.trigger)}</p><h3>${escapeHtml(item.routine_name)}</h3></div><div class="judgment-badges">${badge(status)}${action}${correction}${item.context_status === 'recorded' ? badge('recorded', 'good') : ''}</div></div>
    <p>Output privado concluído em ${fmtDate(item.completed_at)}. Abrir não chama modelo nem publica conteúdo.</p>
    <div class="judgment-meta"><code>${escapeHtml(item.receipt_ref)}</code><span>${learning || `${current.history_count || 0} julgamento(s)`}</span></div>
    <button data-open-judgment="${escapeHtml(item.receipt_id)}">Abrir resultado <b>→</b></button>
  </article>`;
}

function judgmentList(items) {
  return `<div class="judgment-list">${items.map(judgmentCard).join('')}</div>`;
}

function renderRoutines() {
  const routines = visibleRoutines();
  const native = routines.filter((routine) => routine.product_kind === 'brain-native');
  const system = routines.filter((routine) => routine.product_kind !== 'brain-native');
  const group = (title, description, items) => items.length ? `<section class="routine-origin-group"><div class="routine-origin-head"><div><p class="micro">${escapeHtml(title)}</p><p>${escapeHtml(description)}</p></div><b>${items.length}</b></div><div class="routine-list">${items.map(routineCard).join('')}</div></section>` : '';
  return `<div class="section-heading"><div><p class="eyebrow">CONTROL PLANE</p><h2>Todas as rotinas</h2></div><p>Abrir e inspecionar nunca executa modelos. O relógio só liga após replay e aprovação.</p></div>
    ${routines.length ? `${group('Nativas do Cérebro', 'Mantêm contexto, saúde, recuperação e aprendizado.', native)}${group('Dos Sistemas', 'Transformam contexto em resultados de negócio.', system)}` : empty('Nenhuma rotina nesta área', 'Crie um Routine Contract para o primeiro trabalho recorrente.')}`;
}

/* Workspace do Sistema — trabalho fora; confiança e operação dentro do Cockpit. */

const WS_TABS = [
  ['overview', 'Sobre'], ['how', 'Como funciona'], ['runs', 'Execuções'],
  ['experiments', 'Experimentos'], ['learning', 'Aprendizado'], ['config', 'Configuração'],
];

function openWorkspace(ref, tab = 'overview') {
  closeDrawer();
  state.view = 'system';
  state.workspace = {
    ref,
    tab,
    howMode: state.workspace?.ref === ref ? state.workspace.howMode || 'declared' : 'declared',
    data: state.workspace?.ref === ref ? state.workspace.data : null,
  };
  render();
  if (!state.workspace.data) void loadWorkspace(ref);
}

async function loadWorkspace(ref) {
  try {
    const data = await getJson(`/api/systems/${encodeURIComponent(ref)}/workspace`);
    if (state.view === 'system' && state.workspace?.ref === ref) { state.workspace.data = data; render(); }
  } catch (error) { toast(label(error.message), 'bad'); }
}

function wsRunSelector(record) {
  return `run-record:${record.run_id}`;
}

// Matriz dos sete componentes: estado do manifest + evidência real + porta.
function wsMatrix(ws) {
  const statuses = ws.system.component_statuses || {};
  const evalsTotal = ws.records.filter((record) => record.eval?.passed !== undefined && record.eval?.passed !== null).length;
  const evalsPassed = ws.records.filter((record) => record.eval?.passed === true).length;
  const receiptsTotal = ws.routines.reduce((total, routine) => total + routine.receipts, 0);
  const outcomes = ws.records.filter((record) => (record.outcomes || []).length).length;
  const rows = [
    ['pipeline', 'Pipeline', `${ws.contract.pipeline.length} etapa(s) declaradas`, ws.contract.pipeline.length > 0, 'how'],
    ['routines', 'Rotinas', `${ws.routines.length} rotina(s) · ${receiptsTotal} recibo(s)`, receiptsTotal > 0, 'config'],
    ['skills', 'Skills', ws.contract.capability ? `capability ${ws.contract.capability.capability_id} v${ws.contract.capability.version}` : 'nenhuma declarada', false, 'how'],
    ['interfaces', 'Interfaces', ws.system.runtime_binding
      ? `${ws.system.runtime_binding.binding_id} · ${label(ws.system.runtime_binding.status)}`
      : ws.system.interface_expected ? 'interface esperada · binding ausente' : 'sem interface própria', Boolean(ws.system.runtime_binding), 'overview'],
    ['gates', 'Gates', ws.contract.eval ? `${(ws.contract.eval.deterministic_gates || []).length} determinístico(s) · ${(ws.contract.eval.human_questions || []).length} pergunta(s) humanas` : 'não declarados', ws.judgments.length > 0, 'how'],
    ['evals', 'Evals', evalsTotal ? `${evalsPassed}/${evalsTotal} passaram em execuções reais` : 'nenhum eval observado', evalsTotal > 0, 'runs'],
    ['learning', 'Aprendizado', outcomes ? `${outcomes} run(s) com outcomes` : 'nenhum outcome registrado', outcomes > 0, 'learning'],
  ];
  return `<div class="ws-matrix">${rows.map(([key, name, evidence, observed, tab]) => {
    const declared = statuses[key] || 'ausente';
    const hollow = ['ativo', 'repetivel', 'instrumentado'].includes(declared) && !observed;
    return `<button type="button" class="ws-dim" data-ws-tab="${tab}">
      <span class="ws-dim-name">${escapeHtml(name)}</span>
      ${badge(declared, ['ativo', 'repetivel', 'instrumentado'].includes(declared) ? 'good' : declared === 'parcial' ? 'warn' : 'neutral')}
      <small>${escapeHtml(evidence)} ${observed ? prov('observado') : prov('declarado')}</small>
      ${hollow ? '<small class="gap-mark">estado declarado sem observação</small>' : ''}
      <b>→</b>
    </button>`;
  }).join('')}</div>`;
}

function wsMetricGroup(kind, title, rows) {
  return `<section class="ws-metric-group" data-metric-kind="${kind}"><p class="micro">${escapeHtml(title)}</p>
    ${rows.map(([name, value, proof = 'observado']) => `<div><span>${escapeHtml(name)}</span><b>${escapeHtml(String(value))}</b>${prov(proof)}</div>`).join('')}
  </section>`;
}

function wsMetrics(ws) {
  const failed = ws.records.filter((record) => record.status === 'failed').length;
  const snapshots = ws.records.filter((record) => record.context_snapshot).length;
  const gaps = ws.records.reduce((total, record) => total + (record.context_snapshot?.gaps || []).length, 0);
  const conflicts = ws.records.reduce((total, record) => total + (record.context_snapshot?.conflicts || []).length, 0);
  const pending = ws.judgments.filter((item) => item.judgment.status === 'pending').length;
  const approved = ws.judgments.filter((item) => item.judgment.verdict === 'approved').length;
  const corrections = ws.records.filter((record) => record.correction_ref).length;
  const outcomes = ws.records.filter((record) => (record.outcomes || []).length).length;
  const lastRun = ws.records[0];
  return `<div class="ws-metrics" aria-label="Métricas separadas do Sistema">
    ${wsMetricGroup('operation', 'Operação', [
      ['Runs registrados', ws.records.length],
      ['Falhas observadas', failed],
      ['Última execução', lastRun ? fmtDate(lastRun.completed_at, false) : 'nunca'],
    ])}
    ${wsMetricGroup('context', 'Contexto', [
      ['Snapshots', snapshots],
      ['Lacunas', gaps],
      ['Conflitos', conflicts],
    ])}
    ${wsMetricGroup('trust', 'Confiança', [
      ['Pendentes', pending],
      ['Aprovados', approved],
      ['Correções', corrections],
    ])}
    ${wsMetricGroup('value', 'Valor', [
      ['Runs com outcome', outcomes],
      ['Benchmark', 'não calculado', 'declarado'],
      ['Repetição provada', outcomes > 1 ? `${outcomes} outcomes` : 'sem prova'],
    ])}
  </div>`;
}

function wsOverview(ws) {
  const result = ws.contract.result || {};
  const lastRun = ws.records[0];
  return `<div class="ws-stack">
    <section class="organ system-about"><header class="organ-head"><div><p class="micro">SOBRE O SISTEMA</p><h3>Para que este sistema existe</h3></div></header>
      <p class="organ-answer">${escapeHtml(ws.system.result)} ${prov('declarado')}</p>
      <dl class="ws-dl">
        <div><dt>Dono</dt><dd>${escapeHtml(result.owner || '—')}</dd></div>
        <div><dt>Gate humano</dt><dd>${escapeHtml(result.human_gate || ws.system.human_gate || '—')}</dd></div>
        <div><dt>Pronto quando</dt><dd>${escapeHtml(result.definition_of_done || '—')}</dd></div>
        <div><dt>Não é sucesso</dt><dd>${escapeHtml(result.non_success || '—')}</dd></div>
        <div><dt>Estágio</dt><dd>${escapeHtml(label(ws.system.migration_stage))} · ${escapeHtml(ws.system.human_maturity || '—')} · v${escapeHtml(ws.system.version)}</dd></div>
        <div><dt>Última execução</dt><dd>${lastRun ? `${fmtDate(lastRun.completed_at)} ${prov('observado')}` : 'nenhuma no ledger'}</dd></div>
      </dl>
      ${ws.system.next_gate ? `<div class="organ-gaps"><span>Próximo gate: ${escapeHtml(ws.system.next_gate)}</span></div>` : ''}
    </section>
    <details class="ws-technical-summary"><summary><span><b>Saúde dos sete componentes</b><small>Pipeline, rotinas, Skills, interfaces, gates, evals e aprendizado</small></span><i>Ver estado →</i></summary><section class="organ"><header class="organ-head"><div><h3>Os sete componentes</h3><p>estado declarado × evidência observada</p></div></header>${wsMatrix(ws)}</section></details>
    <section class="ws-evidence"><div class="section-heading"><div><p class="eyebrow">EVIDÊNCIA OPERACIONAL</p><h2>O que já aconteceu de verdade</h2></div><p>Runs, contexto, julgamento e valor permanecem separados da promessa publicada.</p></div>${wsMetrics(ws)}</section>
  </div>`;
}

function wsProcessFlow(stages) {
  return `<div class="ws-canvas-flow" role="list">${stages.map((stage, index) => `<div class="ws-flow-step" role="listitem" data-flow-kind="${escapeHtml(stage.kind)}">
    <p class="micro">${escapeHtml(stage.label)}</p><b>${escapeHtml(stage.value)}</b><small>${escapeHtml(stage.detail)}</small>
  </div>${index < stages.length - 1 ? '<span class="ws-flow-arrow" aria-hidden="true">→</span>' : ''}`).join('')}</div>`;
}

function wsHowDeclared(ws) {
  const retrieval = ws.contract.retrieval;
  const capability = ws.contract.capability;
  const evalContract = ws.contract.eval;
  const result = ws.contract.result || {};
  const sourceNames = ws.sources.map((source) => source.name);
  const stages = [
    { kind: 'source', label: 'Fontes', value: `${ws.sources.length} declaradas`, detail: sourceNames.join(' · ') || 'nenhuma declarada' },
    { kind: 'retrieval', label: 'Recuperação', value: retrieval ? `contrato v${retrieval.version}` : 'não declarada', detail: retrieval ? `${(retrieval.source_roles || []).length} papéis de contexto` : 'sem política recuperável' },
    { kind: 'system', label: 'Pipeline', value: `${ws.contract.pipeline.length} etapas`, detail: ws.contract.pipeline.map((step) => step.name || step.step_id || step.state).filter(Boolean).join(' → ') || 'nenhuma etapa' },
    { kind: 'system', label: 'Capability', value: capability ? capability.capability_id : 'não declarada', detail: capability ? `v${capability.version}` : 'sem contrato de capacidade' },
    { kind: 'gate', label: 'Gates', value: evalContract ? `${(evalContract.deterministic_gates || []).length + (evalContract.human_questions || []).length} declarados` : 'não declarados', detail: result.definition_of_done || 'definição de pronto ausente' },
    { kind: 'judgment', label: 'Julgamento', value: result.human_gate || ws.system.human_gate || 'não declarado', detail: 'o Sistema não julga a própria resposta' },
  ];
  return `<div class="ws-stack">
    <section class="organ ws-canvas-organ"><header class="organ-head"><div><h3>Fluxo declarado</h3><p>System Contract e contratos associados — nenhuma execução inferida.</p></div></header>${wsProcessFlow(stages)}</section>
    <section class="organ"><header class="organ-head"><div><h3>Política de recuperação ${retrieval ? `v${escapeHtml(retrieval.version)}` : ''}</h3><p>o backend de contexto que o Sistema pode consumir</p></div></header>
      ${retrieval ? `<div class="table-wrap organ-table"><table><thead><tr><th>Papel</th><th>Seleção</th><th>Filtros</th><th>Janela</th><th>Frescor exigido</th><th>Se indisponível</th></tr></thead><tbody>${(retrieval.source_roles || []).map((role) => `<tr><td><b>${role.priority}</b> ${escapeHtml(role.role)}</td><td>${escapeHtml(role.selection || '—')}</td><td>${(role.filters || []).map((filter) => `<code>${escapeHtml(filter)}</code>`).join(' ')}</td><td>${escapeHtml(role.window || '—')}</td><td>${escapeHtml(role.required_freshness || '—')}</td><td>${escapeHtml(role.on_unavailable || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="gap-mark">Recuperação não declarada.</p>'}
    </section>
  </div>`;
}

function wsHowInstalled(ws) {
  const retrieval = ws.contract.retrieval;
  const sourceRows = ws.sources.map((source) => `<tr>
    <td><button type="button" class="table-action" data-open-source="${escapeHtml(source.source_id)}">${escapeHtml(source.name)}</button><small>${escapeHtml(source.role)}</small></td>
    <td>${source.contract_status ? badge(source.contract_status, source.contract_status === 'active' ? 'good' : 'neutral') : '<span class="muted">—</span>'}</td>
    <td>${source.binding_ref ? `<code>${escapeHtml(source.binding_ref)}</code>${source.has_credential ? ' 🔑' : ''}` : '<span class="gap-mark">sem binding</span>'}</td>
    <td>${source.last_access ? `${escapeHtml(label(source.last_access.decision))} · ${fmtDate(source.last_access.occurred_at, false)}` : '<span class="gap-mark">nunca</span>'}</td>
    <td>${source.freshness_observed ? fmtDate(source.freshness_observed, false) : '<span class="gap-mark">não observado</span>'}</td>
  </tr>`).join('');
  const retrievalRows = (retrieval?.source_roles || []).map((role) => `<tr>
    <td><b>${role.priority}</b> ${escapeHtml(role.role)}</td><td>${escapeHtml(role.selection || '—')}</td>
    <td>${(role.filters || []).map((filter) => `<code>${escapeHtml(filter)}</code>`).join(' ')}</td>
    <td>${escapeHtml(role.window || '—')}</td><td>${escapeHtml(role.required_freshness || '—')}</td>
    <td>${escapeHtml(role.on_unavailable || '—')}</td>
  </tr>`).join('');
  return `<div class="ws-stack">
    <section class="organ"><header class="organ-head"><div><h3>Fontes deste sistema</h3><p>contrato × binding × acesso × frescor</p></div></header>
      <div class="table-wrap organ-table"><table><thead><tr><th>Fonte · papel</th><th>Contrato</th><th>Binding</th><th>Último acesso</th><th>Frescor</th></tr></thead><tbody>${sourceRows}</tbody></table></div></section>
    <section class="organ"><header class="organ-head"><div><h3>Política de recuperação ${retrieval ? `v${escapeHtml(retrieval.version)}` : ''}</h3><p>a atenção declarada — não um "sim"</p></div></header>
      ${retrieval ? `<div class="table-wrap organ-table"><table><thead><tr><th>Papel</th><th>Seleção</th><th>Filtros</th><th>Janela</th><th>Frescor exigido</th><th>Se indisponível</th></tr></thead><tbody>${retrievalRows}</tbody></table></div>` : '<p class="muted">Recuperação não declarada.</p>'}</section>
    <section class="organ"><header class="organ-head"><div><h3>Pipeline · ${ws.contract.pipeline.length} etapas</h3></div></header>
      <ul class="organ-list">${ws.contract.pipeline.map((step, index) => `<li><span>${index + 1}</span>${escapeHtml(step.name || step.step_id || step.state || JSON.stringify(step).slice(0, 60))}</li>`).join('')}</ul>
      ${ws.contract.eval ? `<p class="muted">Gates determinísticos: ${(ws.contract.eval.deterministic_gates || []).map((gate) => `<code>${escapeHtml(gate)}</code>`).join(' ')}</p>` : ''}</section>
  </div>`;
}

function wsHowItWorks(ws) {
  const mode = state.workspace?.howMode || 'declared';
  const body = mode === 'installed' ? wsHowInstalled(ws) : wsHowDeclared(ws);
  return `<div class="ws-stack">
    <div class="ws-canvas-head">
      <div><p class="eyebrow">COMO O SISTEMA FUNCIONA</p><p class="section-help">Arquitetura declarada e instalação observada. Runs e julgamentos vivem em Execuções.</p></div>
      <div class="ws-canvas-actions">
        <div class="ws-mode-switch" role="group" aria-label="Leitura de como o Sistema funciona">
          <button type="button" data-ws-how-mode="declared" class="${mode === 'declared' ? 'active' : ''}">Declarado</button>
          <button type="button" data-ws-how-mode="installed" class="${mode === 'installed' ? 'active' : ''}">Instalado</button>
        </div>
        <button class="action" type="button" data-open-system-canvas="${escapeHtml(ws.system.system_id)}">Abrir no Mapa Operacional →</button>
      </div>
    </div>
    ${body}
  </div>`;
}

function wsJudgmentForRun(ws, record) {
  return ws.judgments.find((item) => item.run_id === record.run_id) || null;
}

function wsRunJudgment(ws, record) {
  const item = wsJudgmentForRun(ws, record);
  if (!item) {
    const decision = record.human_decision || 'sem recibo';
    const origin = record.human_decision ? 'estado no Run Record · sem Judgment Receipt' : 'nenhum Judgment Receipt ligado';
    return `<div class="ws-run-judgment">${badge(decision)}<small>${origin}</small></div>`;
  }
  const current = item.judgment || {};
  const stateLabel = current.verdict || current.status || 'indisponível';
  const tone = current.verdict === 'approved' ? 'good' : current.verdict === 'rejected' ? 'bad' : current.status === 'pending' ? 'warn' : 'neutral';
  return `<div class="ws-run-judgment">${badge(stateLabel, tone)}<button class="table-action" data-open-judgment="${escapeHtml(item.receipt_id)}">${current.status === 'pending' ? 'Julgar' : 'Ver recibo'} →</button></div>`;
}

function wsRuns(ws) {
  const pending = ws.judgments.filter((item) => item.judgment.status === 'pending').length;
  const authority = `<div class="boundary-note ws-run-authority"><div><b>Uma fila constitucional</b>Execuções projeta o estado do julgamento em cada Run. O martelo e o recibo continuam na Caixa de Julgamento global.</div><button class="action" data-view="judgments">Abrir fila${pending ? ` · ${pending} pendente${pending === 1 ? '' : 's'}` : ''} →</button></div>`;
  if (!ws.records.length) return `<div class="ws-stack">${authority}${empty('Nenhuma execução no ledger', 'O primeiro run registrado aparece aqui com contexto, eval e comparação.')}</div>`;
  const rows = ws.records.map((record) => `<tr>
    <td><strong>${fmtDate(record.completed_at)}</strong><small>${escapeHtml(record.run_id.slice(0, 24))}…</small></td>
    <td>${escapeHtml(label(record.mode || '—'))}</td><td>${badge(record.status)}</td>
    <td>${record.context_snapshot?.accesses?.length ? `${record.context_snapshot.accesses.length} fontes${(record.context_snapshot.gaps || []).length ? ` · <span class="gap-mark">${record.context_snapshot.gaps.length} lacunas</span>` : ''}` : '<span class="muted">sem snapshot</span>'}</td>
    <td>${record.eval?.passed === true ? badge('evaluation-passed', 'good') : record.eval?.passed === false ? badge('evaluation-gate-failed', 'bad') : '<span class="muted">—</span>'}</td>
    <td>${wsRunJudgment(ws, record)}</td>
    <td><button class="table-action" data-canvas-jump-run="${escapeHtml(wsRunSelector(record))}">trace →</button></td>
  </tr>`).join('');
  const options = ws.records.map((record, index) => `<option value="${index}">${fmtDate(record.completed_at)} · ${escapeHtml(label(record.mode || 'run'))}</option>`);
  const compare = ws.records.length >= 2 ? `<section class="organ"><header class="organ-head"><div><h3>O que mudou entre duas runs</h3></div></header>
    <div class="ws-compare-pick"><label>A <select id="ws-cmp-a">${options.map((option, index) => index === 1 ? option.replace('<option', '<option selected') : option).join('')}</select></label>
    <label>B <select id="ws-cmp-b">${options.map((option, index) => index === 0 ? option.replace('<option', '<option selected') : option).join('')}</select></label></div>
    <div id="ws-compare">${wsCompareTable(ws, 1, 0)}</div></section>` : '<p class="section-help">Comparação disponível a partir de duas execuções.</p>';
  return `<div class="ws-stack">${authority}<div class="table-wrap"><table><thead><tr><th>Quando</th><th>Modo</th><th>Status</th><th>Contexto</th><th>Eval</th><th>Julgamento</th><th>Trace</th></tr></thead><tbody>${rows}</tbody></table></div>${compare}</div>`;
}

function wsCompareTable(ws, indexA, indexB) {
  return runCompareTable(ws.records[indexA], ws.records[indexB]);
}

// Compara dois Run Records integrais do MESMO sistema — a base da aba Execuções
// e do workspace. Sistemas diferentes não entram aqui: não são comparáveis.
function runCompareTable(a, b) {
  if (!a || !b) return '';
  const sourcesOf = (record) => (record.context_snapshot?.accesses || []).map((access) => access.source_ref?.id).filter(Boolean).join(', ') || '—';
  const freshOf = (record) => (record.context_snapshot?.accesses || []).map((access) => access.freshness_marker).filter(Boolean).join(' · ') || '—';
  const rows = [
    ['Contrato', `v${a.system_version}`, `v${b.system_version}`],
    ['Recuperação', `v${a.context_snapshot?.retrieval_version || '—'}`, `v${b.context_snapshot?.retrieval_version || '—'}`],
    ['Modo', label(a.mode || '—'), label(b.mode || '—')],
    ['Fontes acessadas', sourcesOf(a), sourcesOf(b)],
    ['Frescor', freshOf(a), freshOf(b)],
    ['Lacunas/conflitos', `${(a.context_snapshot?.gaps || []).length}/${(a.context_snapshot?.conflicts || []).length}`, `${(b.context_snapshot?.gaps || []).length}/${(b.context_snapshot?.conflicts || []).length}`],
    ['Eval', a.eval?.passed === true ? 'passou' : a.eval?.passed === false ? 'falhou' : '—', b.eval?.passed === true ? 'passou' : b.eval?.passed === false ? 'falhou' : '—'],
    ['Decisão humana', label(a.human_decision), label(b.human_decision)],
    ['Outcomes', String((a.outcomes || []).length), String((b.outcomes || []).length)],
    ['Outputs', (a.output_refs || []).join(' · ') || '—', (b.output_refs || []).join(' · ') || '—'],
  ];
  return `<div class="table-wrap"><table><thead><tr><th></th><th>A · ${fmtDate(a.completed_at)}</th><th>B · ${fmtDate(b.completed_at)}</th></tr></thead><tbody>${rows.map(([name, left, right]) => `<tr${left !== right ? ' class="ws-diff"' : ''}><td><strong>${escapeHtml(name)}</strong></td><td>${escapeHtml(String(left))}</td><td>${escapeHtml(String(right))}</td></tr>`).join('')}</tbody></table></div>`;
}

function wsExperiments(ws) {
  if (!ws.experiments.length) return empty('Nenhum experimento deste sistema', 'Experimentos aparecem quando o contrato aponta este sistema como palco ou leitura.');
  return `<div class="experiment-grid">${ws.experiments.map((experiment) => `<article class="experiment-card" data-open-experiment="${escapeHtml(experiment.experiment_id)}" role="button" tabindex="0">
    <div class="experiment-card-head"><div><p class="micro">${escapeHtml(experiment.experiment_id)}</p><h3>${escapeHtml(experiment.name)}</h3></div>${badge(experiment.status, experiment.status === 'decided' ? 'good' : experiment.status === 'running' ? 'neutral' : 'warn')}</div>
    ${experimentProgress(experiment)}
  </article>`).join('')}</div>`;
}

function wsLearning(ws) {
  const learning = ws.contract.learning || {};
  const outcomes = ws.records.filter((record) => (record.outcomes || []).length);
  const corrected = ws.records.filter((record) => record.correction_ref);
  const replays = ws.records.filter((record) => record.mode === 'replay').length;
  const stages = [
    ['Candidatos', 'não projetado', false, `política: ${learning.correction_policy || '—'} · limiar ${learning.promotion_threshold ?? '—'} casos`],
    ['Correções', corrected.length, corrected.length > 0, 'correções humanas ligadas a Runs deste Sistema'],
    ['Replays', replays, replays > 0, 'reexecuções comparáveis observadas'],
    ['Melhoria provada', 'sem prova', false, 'exige replay melhor que o baseline e novo martelo'],
  ];
  return `<div class="ws-stack">
    <section class="organ"><header class="organ-head"><div><h3>O funil de aprendizado deste sistema</h3><p>candidato → aprovado → replay → provado</p></div></header>
      <div class="ws-learning">${stages.map(([name, value, observed, help]) => `<div class="ws-stage${observed ? ' has' : ''}"><b>${escapeHtml(String(value))}</b><span>${escapeHtml(name)}</span><small>${escapeHtml(help)}</small></div>`).join('')}</div>
      <p class="organ-answer">${outcomes.length ? `<b>${outcomes.length}</b> run(s) com outcomes registrados ${prov('observado')} — matéria-prima do próximo candidato.` : `Nenhum outcome registrado ainda ${prov('observado')}.`}</p>
    </section>
  </div>`;
}

function wsConfig(ws) {
  const interfaceUrl = safeSystemInterfaceUrl(ws.system.interface_ref);
  const experience = ws.system.experience;
  return `<div class="ws-stack">
    ${ws.routines.length ? ws.routines.map((routine) => `<section class="organ"><header class="organ-head"><div><h3>${escapeHtml(routine.name)}</h3><p>declarado × observado</p></div></header>
      <dl class="ws-dl">
        <div><dt>Agenda declarada</dt><dd>${escapeHtml(routine.schedule)} ${prov('declarado')}</dd></div>
        <div><dt>Estado observado</dt><dd>${escapeHtml(label(routine.health))} ${prov('observado')}</dd></div>
        <div><dt>Executor</dt><dd>${escapeHtml(routine.binding.adapter)} · ${escapeHtml(routine.binding.requested_model)} · auth ${escapeHtml(routine.binding.auth_status)} </dd></div>
        <div><dt>Recibos</dt><dd>${routine.receipts} ${prov('observado')}</dd></div>
        <div><dt>Grants</dt><dd>${routine.access.map((access) => `<code>${escapeHtml(access.source_ref)}</code>`).join(' ') || '—'}</dd></div>
      </dl>
      <button class="action" data-open-routine="${escapeHtml(routine.routine_id)}">Abrir rotina →</button></section>`).join('') : empty('Nenhuma rotina instalada', 'Este sistema ainda roda fora do protocolo de Rotinas — a execução não deixa recibo automático.')}
    <section class="organ"><header class="organ-head"><div><h3>Versões e interface</h3></div></header>
      <dl class="ws-dl">
        <div><dt>Contrato</dt><dd><code>${escapeHtml(ws.system.contract_id)}</code> v${escapeHtml(ws.system.version)}</dd></div>
        <div><dt>Recuperação</dt><dd>v${escapeHtml(ws.contract.retrieval?.version || '—')}</dd></div>
        <div><dt>Eval</dt><dd>v${escapeHtml(ws.contract.eval?.version || '—')}</dd></div>
        <div><dt>Interface</dt><dd>${interfaceUrl ? `<a class="copy-ref" href="${escapeHtml(interfaceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(interfaceUrl)} ↗</a>` : 'nenhuma interface segura declarada'}</dd></div>
        <div><dt>Experience Manifest</dt><dd>${experience ? `<button type="button" class="copy-ref" data-copy-ref="${escapeHtml(experience.manifest_ref)}">${escapeHtml(experience.experience_id)} ⧉</button> · v${experience.protocol_version} ${prov('declarado')}` : `não publicado ${prov('declarado')}`}</dd></div>
        <div><dt>Publisher</dt><dd>${experience ? `${escapeHtml(experience.publisher.display_name)} · ${escapeHtml(publisherKindLabel(experience.publisher.kind))}` : '—'}</dd></div>
        <div><dt>Superfície publicada</dt><dd>${experience ? `<code>${escapeHtml(experience.primary_surface.role)}</code> · ${escapeHtml(experience.primary_surface.launch_label)}` : '—'}</dd></div>
        <div><dt>Runtime Binding</dt><dd>${ws.system.runtime_binding ? `<code>${escapeHtml(ws.system.runtime_binding.binding_id)}</code> · ${escapeHtml(label(ws.system.runtime_binding.status))} ${prov('observado')}` : `${ws.system.interface_expected ? 'não instalado' : 'não exigido'} ${prov('observado')}`}</dd></div>
        <div><dt>Manifest do Sistema</dt><dd>${ws.system.source_manifest_ref ? `<button type="button" class="copy-ref" data-copy-ref="${escapeHtml(ws.system.source_manifest_ref)}">copiar caminho ⧉</button>` : '—'}</dd></div>
      </dl></section>
  </div>`;
}

function renderSystemWorkspace() {
  const workspace = state.workspace;
  if (!workspace) return empty('Nenhum sistema aberto', 'Abra um sistema pela lista ou pelo Canvas.');
  const ws = workspace.data;
  if (!ws) return '<div class="loading"><i></i><span>Abrindo o workspace do sistema…</span></div>';
  const tabs = {
    overview: wsOverview,
    how: wsHowItWorks,
    runs: wsRuns,
    experiments: wsExperiments,
    learning: wsLearning,
    config: wsConfig,
  };
  return `<div class="ws">
    <div class="ws-top">
      <button class="action" data-view="systems">← Sistemas</button>
      ${systemIdentity(ws.system, 'is-workspace')}
      <span class="ws-experience"><b>${escapeHtml(ws.system.experience?.presentation?.tagline || ws.system.name)}</b><small>${ws.system.experience ? `Publicado por ${escapeHtml(ws.system.experience.publisher.display_name)}` : 'Identidade constitucional'}</small></span>
      ${badge(ws.system.migration_stage, ws.system.migration_stage === 'active' ? 'good' : 'neutral')}
      <span class="system-kind-mark" aria-hidden="true">● Sistema</span>
      <span class="muted">${escapeHtml(operatingAreaName(ws.system.operating_area))} · ${escapeHtml(businessFunctionName(ws.system.business_function))} · v${escapeHtml(ws.system.version)} · ${ws.records.length} execuções · ${ws.judgments.filter((item) => item.judgment.status === 'pending').length} para julgar</span>
      <span class="canvas-spacer"></span>
      ${systemLaunchAction(ws.system)}
    </div>
    <div class="tabstrip" role="tablist">${WS_TABS.map(([id, name]) => `<button role="tab" data-ws-tab="${id}" class="${workspace.tab === id ? 'active' : ''}">${name}${id === 'runs' && ws.judgments.filter((item) => item.judgment.status === 'pending').length ? `<b>${ws.judgments.filter((item) => item.judgment.status === 'pending').length}</b>` : ''}</button>`).join('')}</div>
    ${(tabs[workspace.tab] || wsOverview)(ws)}
  </div>`;
}

/* Anatomia do Cérebro — seis módulos + governança transversal.
   Cada dado carimba a proveniência: DECLARADO (contrato/documento),
   OBSERVADO (recibo/ledger) ou INFERIDO (derivação explícita). */

function prov(kind) {
  return `<span class="prov prov--${kind}">${kind.toUpperCase()}</span>`;
}

function shortBrainLabel(value, max = 30) {
  const text_ = String(value || '—');
  return text_.length > max ? `${text_.slice(0, max - 1).trim()}…` : text_;
}

function brainPreviewLayout(graph) {
  const positions = new Map();
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const byKind = (kind) => nodes.filter((node) => node.kind === kind);
  const areas = byKind('area');
  const areaRank = new Map(areas.map((node, index) => [node.id, index]));
  const parentArea = new Map(edges.filter((edge) => edge.relation === 'contains').map((edge) => [edge.target, edge.source]));
  const systems = byKind('system').sort((left, right) => {
    const areaDiff = (areaRank.get(parentArea.get(left.id)) ?? 999) - (areaRank.get(parentArea.get(right.id)) ?? 999);
    return areaDiff || left.label.localeCompare(right.label, 'pt-BR');
  });
  const distribute = (items, x, top = 32, bottom = 448) => items.forEach((node, index) => {
    const y = items.length < 2 ? (top + bottom) / 2 : top + ((bottom - top) * index) / (items.length - 1);
    positions.set(node.id, { x, y });
  });

  distribute(systems, 420);
  areas.forEach((area, index) => {
    const children = systems.map((node) => ({ node, position: positions.get(node.id) }))
      .filter(({ node }) => parentArea.get(node.id) === area.id);
    const y = children.length
      ? children.reduce((sum, item) => sum + item.position.y, 0) / children.length
      : 48 + (index * 360) / Math.max(1, areas.length - 1);
    positions.set(area.id, { x: 95, y });
  });
  distribute(byKind('handoff'), 575, 70, 410);
  distribute(byKind('routine'), 630, 70, 410);
  distribute(byKind('source'), 835);
  distribute(nodes.filter((node) => !positions.has(node.id)), 650, 70, 410);
  return positions;
}

function renderBrainGraphPreview(graph) {
  if (!graph) {
    return `<section class="brain-map-panel"><div class="brain-section-head"><div><p class="micro">MAPA INTEIRO</p><h2>Como tudo se conecta</h2></div></div><div class="brain-map-loading"><i></i><span>Preparando a visão leve do grafo…</span></div></section>`;
  }
  const positions = brainPreviewLayout(graph);
  const nodes = (graph.nodes || []).filter((node) => positions.has(node.id));
  const edges = (graph.edges || []).filter((edge) => positions.has(edge.source) && positions.has(edge.target));
  const counts = nodes.reduce((result, node) => ({ ...result, [node.kind]: (result[node.kind] || 0) + 1 }), {});
  const edgeMarkup = edges.map((edge) => {
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    return `<line class="brain-map-edge${edge.actual ? ' is-actual' : ''}" x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}"><title>${escapeHtml(label(edge.relation))}</title></line>`;
  }).join('');
  const nodeMarkup = nodes.map((node) => {
    const position = positions.get(node.id);
    const areaLabel = node.label;
    const showLabel = ['area', 'system', 'source'].includes(node.kind);
    return `<g class="brain-preview-node brain-preview-node--${escapeHtml(node.kind)}${node.actual ? ' is-actual' : ''}" transform="translate(${position.x} ${position.y})">
      <title>${escapeHtml(areaLabel)} · ${escapeHtml(label(node.kind))} · ${escapeHtml(label(node.state))}</title>
      <circle r="${node.kind === 'area' ? 7 : node.kind === 'system' ? 5 : 3.5}"></circle>
      ${showLabel ? `<text x="${node.kind === 'area' ? 13 : 9}" y="4">${escapeHtml(shortBrainLabel(areaLabel, node.kind === 'source' ? 24 : 29))}</text>` : ''}
    </g>`;
  }).join('');
  return `<section class="brain-map-panel">
    <div class="brain-section-head"><div><p class="micro">MAPA INTEIRO</p><h2>Como tudo se conecta</h2><p>Áreas organizam. Sistemas trabalham. Fontes continuam sendo as casas de verdade.</p></div><button class="action" type="button" data-open-brain-map>Explorar o mapa →</button></div>
    <div class="brain-map-frame">
      <svg class="brain-map-preview" viewBox="0 0 1000 480" role="img" aria-label="${escapeHtml(graph.subtitle || 'Mapa do Cérebro')}">
        <g class="brain-map-edges">${edgeMarkup}</g>
        <g class="brain-map-nodes">${nodeMarkup}</g>
      </svg>
    </div>
    <div class="brain-map-foot"><span><i class="area"></i>${counts.area || 0} áreas</span><span><i class="system"></i>${counts.system || 0} Sistemas</span><span><i class="source"></i>${counts.source || 0} Fontes</span><small>Visão derivada do mesmo contrato usado pelo Canvas.</small></div>
  </section>`;
}

function brainFlowStep(number, name, value, description, state_ = 'declared') {
  return `<li class="brain-flow-step"><span>${String(number).padStart(2, '0')}</span><div><p>${escapeHtml(name)}</p><b>${escapeHtml(value)}</b><small>${escapeHtml(description)}</small></div><i class="${escapeHtml(state_)}"></i></li>`;
}

function renderBrainModeSwitch(anatomy = {}) {
  const tabs = [
    ['overview', 'Visão geral'],
    ['memory', 'Memória'],
    ['recovery', 'Recuperação'],
    ['learning', 'Aprendizado'],
    ['architecture', 'Arquitetura'],
    ['updates', 'Atualizações'],
  ];
  const installation = anatomy.update_center?.installation || {};
  const profile = installation.profile === 'legacy-compatible' ? 'Privado compatível'
    : installation.update_management === 'managed-release' ? 'Canal gerenciado' : 'Instalação local';
  return `<div class="brain-mode-bar"><div class="brain-mode-switch" role="tablist" aria-label="Áreas do Cérebro">
    ${tabs.map(([id, name]) => `<button type="button" role="tab" data-brain-mode="${id}" class="${state.brain.mode === id ? 'active' : ''}" aria-selected="${state.brain.mode === id}">${name}</button>`).join('')}
  </div><button type="button" class="brain-version-chip${state.brain.mode === 'updates' ? ' active' : ''}" data-brain-mode="updates"><span>${escapeHtml(profile)}</span><b>v${escapeHtml(installation.version || '—')}</b></button>
  </div>`;
}

function brainSearchKey(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function brainCount(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
}

function brainHouseRow(entry) {
  const changed = entry.last_changed ? `mudou ${fmtDate(entry.last_changed, false)}` : 'sem mudança observada';
  const unit = entry.count === 1 ? entry.unit?.[0] || 'item' : entry.unit?.[1] || 'itens';
  return `<li class="company-map-object">
    <div><strong>${escapeHtml(entry.name)}</strong><span>${brainCount(entry.count)} ${escapeHtml(unit)} · ${escapeHtml(changed)}${entry.sealed ? ' · agregado protegido' : ''}</span></div>
    ${entry.view ? `<button type="button" data-view="${escapeHtml(entry.view)}" aria-label="Abrir ${escapeHtml(entry.name)}">↗</button>` : ''}
  </li>`;
}

function retrievalStatusLabel(value) {
  return ({ healthy: 'Operacional', active: 'Ativo', unknown: 'Sem diagnóstico', unavailable: 'Indisponível' })[value] || label(value);
}

function renderRetrievalHealth(health) {
  const quality = health?.quality || { measured: false, percent: null };
  const index = health?.index || {};
  const operation = health?.operation || { decisions: {} };
  const snapshots = health?.snapshots || {};
  const provider = health?.provider || {};
  const measured = quality.measured && Number.isFinite(quality.percent);
  const qualityText = measured
    ? `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(quality.percent)}%`
    : 'Não medido';
  const accepted = operation.decisions?.accepted || 0;
  const abstained = operation.decisions?.insufficient_evidence || 0;
  const unavailable = operation.decisions?.retrieval_unavailable || 0;
  const providerLabel = provider.name || provider.provider_id || 'Provider não declarado';
  const implementation = provider.implementation
    ? `${provider.implementation}${provider.implementation_version ? ` ${provider.implementation_version}` : ''}`
    : 'não observada';
  const gate = quality.gate_passed === true ? 'gate aprovado' : quality.gate_passed === false ? 'gate reprovado' : 'gate não observado';
  const scoreAttrs = measured ? `role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${quality.percent}"` : '';

  return `<section class="brain-retrieval-health${measured ? '' : ' is-unmeasured'}" aria-labelledby="retrieval-health-title">
    <div class="retrieval-quality-score" ${scoreAttrs}>
      <div class="retrieval-quality-head"><p class="micro">SAÚDE DO CONTEXTO</p><span class="retrieval-live-state"><i class="${operation.current_status === 'healthy' ? 'observed' : ''}"></i>${escapeHtml(retrievalStatusLabel(operation.current_status))}</span></div>
      <div class="retrieval-quality-value"><strong>${qualityText}</strong><div><h2 id="retrieval-health-title">Qualidade local da recuperação</h2><p>${measured ? `Hit@3 em ${brainCount(quality.cases)} casos auditados` : 'Ainda não existe benchmark auditado para esta instalação'}</p></div></div>
      <progress class="retrieval-quality-track" max="100" value="${measured ? Math.max(0, Math.min(100, quality.percent)) : 0}" aria-label="${measured ? `${quality.percent}% no benchmark Hit@3` : 'Benchmark não medido'}"></progress>
      <div class="retrieval-quality-proof"><span>${quality.false_positive_percent !== null && quality.false_positive_percent !== undefined ? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(quality.false_positive_percent)}% falsos positivos` : 'falso positivo não medido'}</span><span>${escapeHtml(gate)}</span><span>${quality.measured_at ? `medido ${fmtDate(quality.measured_at, false)}` : 'sem data de medição'}</span></div>
      <p class="retrieval-comparison-note">Benchmark local. Comparar empresas exige a mesma versão, conjunto de casos e política de corpus; isto ainda não é ranking da Society.</p>
    </div>

    <div class="retrieval-evidence-list" aria-label="Evidências da recuperação">
      <article><p class="micro">ÍNDICE</p><strong>${index.documents === null || index.documents === undefined ? 'Não observado' : `${brainCount(index.documents)} documentos`}</strong><span>${index.orphans === null || index.orphans === undefined ? 'órfãos não medidos' : `${brainCount(index.orphans)} órfãos`} · ${index.updated_at ? `geração ${fmtDate(index.updated_at, false)}` : 'sem geração auditada'}</span></article>
      <article><p class="micro">OPERAÇÃO REAL</p><strong>${brainCount(accepted)} recuperações aceitas</strong><span>${brainCount(abstained)} abstiveram por evidência insuficiente · ${brainCount(unavailable)} falharam no histórico</span></article>
      <article><p class="micro">CONTEXT SNAPSHOTS</p><strong>${brainCount(snapshots.complete)}/${brainCount(snapshots.observed)} completos</strong><span>${brainCount(snapshots.gaps)} gaps · ${brainCount(snapshots.conflicts)} conflitos em ${brainCount(snapshots.runs)} Runs</span></article>
    </div>

    <details class="retrieval-operations">
      <summary>Como este número foi provado</summary>
      <dl>
        <div><dt>Métrica</dt><dd>Hit@3 do último Source Index Receipt concluído</dd></div>
        <div><dt>Provider</dt><dd>${escapeHtml(providerLabel)}${provider.version ? ` · v${escapeHtml(provider.version)}` : ''}</dd></div>
        <div><dt>Motor</dt><dd>${escapeHtml(implementation)} · implementação atual e substituível</dd></div>
        <div><dt>Circuito</dt><dd>${escapeHtml(operation.circuit || 'não observado')}${operation.last_success_at ? ` · sucesso ${fmtDate(operation.last_success_at, false)}` : ''}</dd></div>
        <div><dt>Privacidade</dt><dd>Query, conteúdo, snippet e erro bruto não aparecem nesta vista</dd></div>
      </dl>
    </details>
  </section>`;
}

function renderCompanyMap(anatomy) {
  const map = anatomy.company_map;
  if (!map) return empty('Mapa da empresa indisponível', 'Este Cérebro ainda não declarou casas reconhecíveis para esta leitura.');
  const query = brainSearchKey(state.brain.query.trim());
  const domains = map.domains.map((domain) => {
    const domainMatches = brainSearchKey(`${domain.name} ${domain.purpose}`).includes(query);
    const entries = !query || domainMatches
      ? domain.entries
      : domain.entries.filter((entry) => brainSearchKey(entry.name).includes(query));
    return { ...domain, entries };
  }).filter((domain) => domain.entries.length);
  const visibleObjects = domains.reduce((total, domain) => total + domain.entries.length, 0);
  const prioritySources = ['clickup-inevita', 'drive-inevita', 'vault-inevita', 'fathom-calls', 'supabase-inevita', 'platform-inevita'];
  const sourceById = new Map(anatomy.memory.sources.map((source) => [source.source_id, source]));
  const sources = prioritySources.map((id) => sourceById.get(id)).filter(Boolean);
  const care = [
    map.care.context_gaps ? { value: map.care.context_gaps, label: 'lacunas apareceram em Context Snapshots recentes' } : null,
    map.care.sources_never_observed ? { value: map.care.sources_never_observed, label: 'Fontes ainda não deixaram observação real' } : null,
    map.care.distill_backlog ? { value: 'fila', label: shortBrainLabel(map.care.distill_backlog, 96) } : null,
    map.care.protocol_issues ? { value: map.care.protocol_issues, label: 'inconsistências de protocolo pedem inspeção' } : null,
  ].filter(Boolean);

  return `<div class="company-map-home">
    <section class="company-map-search">
      <div><p class="micro">MAPA VIVO</p><h2>Encontre o que existe na empresa.</h2><p>Áreas, conhecimento, Fontes e rotinas — sem transformar o Cérebro em outro ClickUp.</p></div>
      <label><span>Buscar no mapa da empresa</span><input type="search" data-brain-map-search value="${escapeHtml(state.brain.query)}" placeholder="Ofertas, Ads, founders, decisões…" autocomplete="off"><small>Busca local nos nomes e áreas já mapeados. Não chama modelo.</small></label>
    </section>

    <div class="company-map-layout">
      <section class="company-map-main" aria-labelledby="company-map-title">
        <header><div><p class="micro">EMPRESA</p><h2 id="company-map-title">O que este Cérebro contém</h2></div><span>${visibleObjects} ${visibleObjects === 1 ? 'objeto visível' : 'objetos visíveis'}</span></header>
        ${domains.length ? `<div class="company-domain-list">${domains.map((domain, index) => `<section class="company-domain">
          <div class="company-domain-heading"><span>${String(index + 1).padStart(2, '0')}</span><div><h3>${escapeHtml(domain.name)}</h3><p>${escapeHtml(domain.purpose)}</p></div></div>
          <ul>${domain.entries.map(brainHouseRow).join('')}</ul>
        </section>`).join('')}</div>` : `<div class="company-map-empty"><strong>Nada no mapa corresponde a “${escapeHtml(state.brain.query)}”.</strong><span>Tente uma casa real, como ofertas, Ads, founders, decisões ou Sistemas.</span></div>`}
      </section>

      <aside class="company-map-rail">
        <section class="company-source-brief">
          <header><div><p class="micro">FONTES</p><h2>De onde a realidade entra</h2></div><span>${map.source_summary.observed}/${map.source_summary.total}</span></header>
          <ul>${sources.map((source) => {
            const observedAt = source.last_access?.occurred_at || source.freshness_observed;
            return `<li><i class="${observedAt ? 'observed' : ''}"></i><div><strong>${escapeHtml(source.name)}</strong><span>${observedAt ? `observada ${fmtDate(observedAt, false)}` : 'declarada, ainda sem observação'}</span></div></li>`;
          }).join('')}</ul>
          <button class="action" type="button" data-view="sources">Ver todas as Fontes →</button>
        </section>
        <section class="company-care-brief">
          <p class="micro">PRECISA DE CUIDADO</p>
          <h2>Saúde da memória</h2>
          ${care.length ? `<ul>${care.map((item) => `<li><b>${escapeHtml(item.value)}</b><span>${escapeHtml(item.label)}</span></li>`).join('')}</ul>` : '<p class="company-care-clear">Nenhuma lacuna observada pede cuidado agora.</p>'}
          <button class="action" type="button" data-view="health">Abrir saúde →</button>
        </section>
      </aside>
    </div>

    <section class="company-routines">
      <header><div><p class="micro">ROTINAS DO CÉREBRO</p><h2>O que mantém o contexto vivo</h2></div><button class="action" type="button" data-view="routines">Inspecionar rotinas →</button></header>
      <div class="company-routine-list">${map.routines.map((routine) => `<article><div><i class="${routine.state === 'active' || routine.state === 'human-capture' ? 'observed' : ''}"></i><strong>${escapeHtml(routine.name)}</strong><span>${escapeHtml(label(routine.state))} · ${escapeHtml(routine.schedule)}</span></div><p>${escapeHtml(routine.output)}</p>${routine.last_observed ? `<time>${fmtDate(routine.last_observed, false)}</time>` : '<time>sem execução observada</time>'}</article>`).join('')}</div>
      <div class="daily-purpose"><b>Por que existe daily?</b><span>Para registrar o que mudou, por que mudou e qual decisão nasceu. Tarefa, dono e prazo continuam no ClickUp.</span></div>
    </section>

  </div>`;
}

function integrityLabel(value) {
  return ({ complete: 'Completo', limited: 'Limitado', blocked: 'Bloqueado' })[value] || label(value);
}

function integrityTone(value) {
  return ({ complete: 'good', limited: 'warn', blocked: 'bad' })[value] || 'neutral';
}

function careLabel(item) {
  return ({
    'sources-unobserved': 'Fontes declaradas ainda não deixaram observação real',
    'runs-limited': 'Runs operaram com alguma limitação explícita',
    'runs-blocked': 'Runs foram bloqueados antes de sustentar resultado',
    'judgment-reconciliation': 'recibos de julgamento precisam de reconciliação com o ledger',
    'learning-candidates-empty': 'nenhum candidato de aprendizado foi materializado',
  })[item.code] || label(item.code);
}

function nativeCapabilityStateLabel(stateValue) {
  return ({
    declared: 'Declarada',
    available: 'Disponível',
    operational: 'Operacional',
    measured: 'Medida',
  })[stateValue] || label(stateValue);
}

function nativeCapabilityStateTone(stateValue) {
  return ({
    declared: 'neutral',
    available: 'neutral',
    operational: 'good',
    measured: 'good',
  })[stateValue] || 'neutral';
}

function nativeCapabilityAction(action) {
  if (!action) return '';
  const attribute = action.kind === 'view'
    ? `data-view="${escapeHtml(action.ref)}"`
    : `data-brain-mode="${escapeHtml(action.ref)}"`;
  return `<button type="button" class="native-capability-action" ${attribute}>${escapeHtml(action.label)} →</button>`;
}

function renderNativeCapabilities(capabilities = []) {
  if (!capabilities.length) return `<section class="native-capabilities">
    <header><div><p class="micro">CAPACIDADES NATIVAS</p><h2>O que vem com o Cérebro</h2></div></header>
    <p class="brain-clear-state">Nenhuma capacidade nativa foi projetada por esta instalação.</p>
  </section>`;

  return `<section class="native-capabilities" aria-labelledby="native-capabilities-title">
    <header>
      <div><p class="micro">CAPACIDADES NATIVAS</p><h2 id="native-capabilities-title">O que já vem com o Cérebro</h2><p>Estas capacidades fazem parte do Company Brain. Sistemas usam essa base automaticamente quando o contrato permite; você não precisa rodar um comando. Capacidade é permanente. Skill é o instrumento. Provider é substituível.</p></div>
      <button type="button" class="action" data-view="skills">Ver Skills →</button>
    </header>
    <div class="native-capability-grid">${capabilities.map((capability) => {
      return `<article class="native-capability-card state-${escapeHtml(capability.state)}">
        <div class="native-capability-heading"><span>${String(capability.position).padStart(2, '0')}</span>${badge(capability.state, nativeCapabilityStateTone(capability.state), nativeCapabilityStateLabel(capability.state))}</div>
        <div class="native-capability-copy"><h3>${escapeHtml(capability.name)}</h3><p>${escapeHtml(capability.promise)}</p></div>
        <div class="native-capability-proof"><small>ESTADO NESTE CÉREBRO</small><strong>${escapeHtml(capability.proof.headline)}</strong></div>
        <footer>${nativeCapabilityAction(capability.action)}</footer>
      </article>`;
    }).join('')}</div>
  </section>`;
}

function overviewQualityText(quality = {}) {
  return quality.measured && Number.isFinite(quality.percent)
    ? `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(quality.percent)}%`
    : 'Não medido';
}

function renderOverviewRecoveryAsset(health = {}) {
  const quality = health.quality || {};
  const operation = health.operation || {};
  const measured = quality.measured && Number.isFinite(quality.percent);
  const gate = quality.gate_passed === true ? 'Aprovado'
    : quality.gate_passed === false ? 'Reprovado' : 'Não observado';
  const falsePositive = quality.false_positive_percent !== null && quality.false_positive_percent !== undefined
    ? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(quality.false_positive_percent)}%`
    : 'Não medido';

  return `<section class="brain-recovery-asset${measured ? '' : ' is-unmeasured'}" aria-labelledby="overview-retrieval-title">
    <header><p class="micro">QUALIDADE DE RECUPERAÇÃO</p><span class="retrieval-live-state"><i class="${operation.current_status === 'healthy' ? 'observed' : ''}"></i>${escapeHtml(retrievalStatusLabel(operation.current_status))}</span></header>
    <div class="brain-recovery-asset-value"><strong>${overviewQualityText(quality)}</strong><div><h2 id="overview-retrieval-title">Hit@3</h2><p>${measured ? 'do contexto certo entre as três primeiras referências' : 'benchmark local ainda não auditado'}</p></div></div>
    <dl>
      <div><dt>Casos</dt><dd>${quality.cases == null ? '—' : brainCount(quality.cases)}</dd></div>
      <div><dt>Falsos positivos</dt><dd>${falsePositive}</dd></div>
      <div><dt>Gate</dt><dd>${escapeHtml(gate)}</dd></div>
      <div><dt>Medição</dt><dd>${quality.measured_at ? fmtDate(quality.measured_at, false) : 'Sem data'}</dd></div>
    </dl>
    <p>Benchmark local. Comparar empresas exige a mesma versão, conjunto de casos e política de corpus; isto ainda não é ranking da Society.</p>
    <button type="button" class="action" data-brain-mode="recovery">Ver prova e Runs →</button>
  </section>`;
}

function renderOverviewCapabilities(capabilities = []) {
  const visibleIds = new Set(['sources', 'evaluation', 'learning']);
  const visible = capabilities.filter((capability) => visibleIds.has(capability.id));
  if (!visible.length) return '<p class="brain-clear-state">Nenhuma capacidade deixou prova local nesta instalação.</p>';
  return `<div class="brain-supported-grid">${visible.map((capability) => `<article class="state-${escapeHtml(capability.state)}">
    <div><span>${escapeHtml(nativeCapabilityStateLabel(capability.state))}</span><i></i></div>
    <h3>${escapeHtml(capability.name)}</h3>
    <p>${escapeHtml(capability.promise)}</p>
    <strong>${escapeHtml(capability.proof.headline)}</strong>
    ${nativeCapabilityAction(capability.action)}
  </article>`).join('')}</div>`;
}

function renderOverviewActivity(center, health = {}) {
  const latestRun = center.recovery.runs[0] || null;
  const operation = health.operation || {};
  const index = health.index || {};
  const accepted = operation.decisions?.accepted || 0;
  const abstained = operation.decisions?.insufficient_evidence || 0;
  const failed = operation.decisions?.retrieval_unavailable || 0;
  const runAt = latestRun?.completed_at || latestRun?.started_at;
  return `<section class="brain-activity-list">
    <header><div><p class="micro">ATIVIDADE OBSERVADA</p><h2>O que aconteceu por último</h2></div><span>recibos locais</span></header>
    <ol>
      <li><div><span>Último Run</span><strong>${latestRun ? escapeHtml(latestRun.system_name) : 'Nenhum Run observado'}</strong><small>${latestRun ? `${escapeHtml(integrityLabel(latestRun.integrity.state))}${runAt ? ` · ${fmtDate(runAt, false)}` : ''}` : 'o ledger ainda não deixou execução'}</small></div>${latestRun ? '<button type="button" data-brain-mode="recovery">Abrir →</button>' : ''}</li>
      <li><div><span>Última recuperação</span><strong>${operation.last_retrieval_at ? fmtDate(operation.last_retrieval_at, false) : 'Não observada'}</strong><small>${brainCount(accepted)} aceitas · ${brainCount(abstained)} abstiveram · ${brainCount(failed)} falharam no histórico</small></div><button type="button" data-brain-mode="recovery">Inspecionar →</button></li>
      <li><div><span>Índice vigente</span><strong>${index.documents == null ? 'Não observado' : `${brainCount(index.documents)} documentos`}</strong><small>${index.updated_at ? `geração ${fmtDate(index.updated_at, false)}` : 'sem geração auditada'}</small></div><button type="button" data-brain-mode="architecture">Ver arquitetura →</button></li>
    </ol>
  </section>`;
}

function renderBrainOverview(anatomy) {
  const center = anatomy.control_center;
  const overview = center.overview;
  const runs = overview.runs;
  const learning = overview.learning;
  return `<div class="brain-control-view brain-overview">
    <section class="brain-overview-hero">
      <div class="brain-overview-lead">
        <div><p class="micro">SEU CÉREBRO HOJE</p><h2>Contexto que já consegue voltar para o trabalho.</h2><p>Aqui você vê o que está vivo, o que foi provado e onde o Cérebro decidiu não inventar.</p></div>
        <dl class="brain-overview-facts" aria-label="Estado operacional observado">
          <div><dt>Realidade entrando</dt><dd>${brainCount(overview.sources.observed)}/${brainCount(overview.sources.total)}</dd><span>Fontes observadas</span></div>
          <div><dt>Trabalho sustentado</dt><dd>${brainCount(runs.complete)}/${brainCount(runs.total)}</dd><span>Runs completos · ${brainCount(runs.limited)} limitados</span></div>
          <div><dt>Julgamento humano</dt><dd>${brainCount(learning.judgments)}</dd><span>${brainCount(learning.outcomes)} Runs com outcome · ${brainCount(learning.candidates)} candidatos</span></div>
        </dl>
      </div>
      ${renderOverviewRecoveryAsset(anatomy.retrieval_health)}
    </section>

    ${anatomy.activation.complete ? `<section class="brain-activation-receipt"><div><p class="micro">CÉREBRO BASE ATIVADO</p><h2>O contexto já provou que consegue voltar ao trabalho.</h2><p>A primeira missão fechou quando uma segunda tarefa reutilizou contexto aprovado sem releitura do bruto.</p></div><dl><div><dt>Concluído</dt><dd>${fmtDate(anatomy.activation.completed_at)}</dd></div><div><dt>Versão</dt><dd>${escapeHtml(anatomy.activation.product_version || 'não registrada')}</dd></div><div><dt>Recibo local</dt><dd><button type="button" data-copy-ref="${escapeHtml(anatomy.activation.receipt_ref)}">${escapeHtml(anatomy.activation.run_id || 'copiar referência')} ⧉</button></dd></div></dl></section>` : `<section class="brain-activation-receipt is-pending"><div><p class="micro">ATIVAÇÃO EM ABERTO</p><h2>A primeira missão ainda precisa provar reutilização.</h2><p>${anatomy.activation.completed_steps} de ${anatomy.activation.total_steps} passos foram observados.</p></div><button type="button" data-view="activation">Voltar à Primeira Missão →</button></section>`}

    <section class="brain-supported">
      <header><div><p class="micro">O QUE ELE JÁ SUSTENTA</p><h2>Capacidades que já deixaram prova neste Cérebro</h2><p>Disponibilidade técnica não basta: cada linha mostra o efeito e a evidência observada nesta empresa.</p></div></header>
      ${renderOverviewCapabilities(center.capabilities)}
    </section>

    <div class="brain-overview-lower">
      ${renderOverviewActivity(center, anatomy.retrieval_health)}
      <section class="brain-care-list">
        <header><div><p class="micro">PEDE ATENÇÃO</p><h2>O que merece cuidado agora</h2></div><span>${overview.care.length} sinais</span></header>
        ${overview.care.length ? `<ol>${overview.care.map((item) => `<li><b>${item.count === 0 ? '—' : brainCount(item.count)}</b><span>${escapeHtml(careLabel(item))}</span></li>`).join('')}</ol>` : '<p class="brain-clear-state">Nenhum sinal operacional pede atenção agora.</p>'}
      </section>
    </div>

    <details class="brain-capability-details">
      <summary><span><b>Como este Cérebro funciona</b><small>${brainCount(center.capabilities.length)} capacidades nativas · Skills como instrumentos · provider substituível</small></span><i aria-hidden="true">⌄</i></summary>
      ${renderNativeCapabilities(center.capabilities)}
    </details>
  </div>`;
}

function renderBrainMemory(anatomy) {
  const memory = anatomy.control_center.memory;
  return `<div class="brain-control-view brain-memory-view">
    <section class="brain-lifecycle">
      <header><div><p class="micro">ESTADOS DA MEMÓRIA</p><h2>O que é medido — e o que ainda não é.</h2><p>Contagem de pasta não substitui recibo de captura, processamento ou destilação.</p></div></header>
      <ol>${memory.lifecycle.map((step) => `<li class="${step.measured ? 'is-measured' : 'is-unmeasured'}"><span>${escapeHtml(step.name)}</span><strong>${step.measured ? brainCount(step.value) : 'Não instrumentado'}</strong><small>${step.measured ? escapeHtml(step.unit || 'objetos observados') : 'a transição ainda não emite recibo canônico'}</small></li>`).join('')}</ol>
      <div class="brain-freshness-note"><b>Frescor por Fonte · não calculado</b><span>${brainCount(memory.freshness.declared_policies)} políticas declaradas em texto; falta uma regra machine-readable para comparar vigência.</span></div>
    </section>
    ${renderCompanyMap(anatomy)}
  </div>`;
}

function renderBrainRecovery(anatomy) {
  const recovery = anatomy.control_center.recovery;
  return `<div class="brain-control-view brain-recovery-view">
    ${renderRetrievalHealth(anatomy.retrieval_health)}
    <section class="brain-run-ledger">
      <header><div><p class="micro">QUALIDADE POR EXECUÇÃO</p><h2>O contexto que cada Run realmente recebeu</h2><p>Completo, limitado ou bloqueado nasce das dimensões do recibo — nunca de um score inventado.</p></div><div class="brain-integrity-legend"><span><i class="complete"></i>${brainCount(recovery.counts.complete)} completos</span><span><i class="limited"></i>${brainCount(recovery.counts.limited)} limitados</span><span><i class="blocked"></i>${brainCount(recovery.counts.blocked)} bloqueados</span></div></header>
      <div class="brain-run-table" role="table" aria-label="Runs e contexto recuperado">
        <div class="brain-run-row brain-run-head" role="row"><span>Run / Sistema</span><span>Contexto</span><span>Recuperação</span><span>Martelo</span><span></span></div>
        ${recovery.runs.map((run) => `<button type="button" class="brain-run-row" role="row" data-open-brain-run="${escapeHtml(run.run_id)}">
          <span><strong>${escapeHtml(run.system_name)}</strong><small>${fmtDate(run.completed_at || run.started_at, false)} · ${escapeHtml(run.run_id)}</small></span>
          <span>${badge(run.integrity.state, integrityTone(run.integrity.state), integrityLabel(run.integrity.state))}<small>${brainCount(run.integrity.references)} refs · ${brainCount(run.integrity.accesses)} Fontes</small></span>
          <span><strong>${run.retrieval.mode === 'semantic-provider' ? 'Provider semântico' : 'Coleta contratual'}</strong><small>${run.retrieval.mode === 'semantic-provider' ? escapeHtml(label(run.retrieval.decision || run.retrieval.status)) : 'sem recuperação semântica solicitada'}</small></span>
          <span><strong>${escapeHtml(label(run.judgment?.verdict || run.human_decision || 'pending'))}</strong><small>${run.outcomes ? `${brainCount(run.outcomes)} outcomes` : 'sem outcome'}</small></span>
          <span aria-hidden="true">→</span>
        </button>`).join('')}
      </div>
    </section>
  </div>`;
}

function renderBrainLearning(anatomy) {
  const learning = anatomy.control_center.learning;
  const runs = anatomy.control_center.recovery.runs.filter((run) => run.judgments || run.outcomes || run.correction_linked);
  const issues = learning.reconciliation.orphan_judgments + learning.reconciliation.duplicate_judgments;
  return `<div class="brain-control-view brain-learning-view">
    <section class="brain-learning-lead">
      <div><p class="micro">CICLO DE APRENDIZADO</p><h2>${learning.candidates ? `${brainCount(learning.candidates)} melhorias aguardam prova.` : 'Ainda não existe melhoria pronta para promoção.'}</h2><p>Julgamento registra confiança. Outcome prova efeito. Só então uma mudança pode voltar ao Sistema.</p></div>
      <ol><li><span>01</span><b>${brainCount(learning.judgments)}</b><small>julgamentos</small></li><li><span>02</span><b>${brainCount(learning.corrections)}</b><small>correções</small></li><li><span>03</span><b>${brainCount(learning.outcomes)}</b><small>Runs com outcome</small></li><li><span>04</span><b>${brainCount(learning.candidates)}</b><small>candidatos</small></li></ol>
    </section>

    <section class="brain-learning-status ${learning.candidates ? '' : 'is-empty'}">
      <div><p class="micro">CANDIDATOS</p><h2>${learning.candidates ? 'Fila materializada' : 'Nenhum candidato materializado'}</h2><p>${learning.candidates ? 'A promoção continua dependente de prova e martelo humano.' : 'Isso não significa que o Cérebro não aprendeu nada; significa que nenhum Learning Candidate Receipt foi emitido.'}</p></div>
      <span>${learning.promotions.measured ? brainCount(learning.promotions.value) : 'Promoções · não instrumentadas'}</span>
    </section>

    <section class="brain-learning-ledger">
      <header><div><p class="micro">LINHAGEM OBSERVADA</p><h2>Runs que chegaram a julgamento ou outcome</h2></div><span>${runs.length} Runs</span></header>
      ${runs.length ? `<ul>${runs.map((run) => `<li><div><strong>${escapeHtml(run.system_name)}</strong><span>${fmtDate(run.completed_at || run.started_at, false)} · ${escapeHtml(run.run_id)}</span></div><span>${run.judgments ? `${run.judgments} julgamento${run.judgments === 1 ? '' : 's'}` : 'sem recibo de julgamento'} · ${run.outcomes ? `${run.outcomes} outcome${run.outcomes === 1 ? '' : 's'}` : 'sem outcome'}</span><button type="button" data-open-brain-run="${escapeHtml(run.run_id)}">Inspecionar →</button></li>`).join('')}</ul>` : '<p class="brain-clear-state">Nenhum Run chegou ao ciclo observado.</p>'}
    </section>

    <section class="brain-reconciliation ${issues ? 'has-issues' : ''}"><div><p class="micro">RECONCILIAÇÃO</p><h2>${issues ? `${brainCount(issues)} inconsistências pedem revisão` : 'Ledger e recibos conciliados'}</h2></div><p>${brainCount(learning.reconciliation.orphan_judgments)} julgamento aponta para Run ausente · ${brainCount(learning.reconciliation.duplicate_judgments)} julgamento excedente no mesmo Run.</p></section>
  </div>`;
}

function renderBrainArchitecture(anatomy) {
  const architecture = anatomy.control_center.architecture;
  const provider = architecture.provider;
  return `<div class="brain-control-view brain-architecture-view">
    <section class="brain-architecture-lead"><div><p class="micro">INFRAESTRUTURA GOVERNADA</p><h2>O protocolo é o produto. O motor é substituível.</h2><p>Sistemas consomem um contrato genérico de recuperação; a implementação atual fica atrás dessa fronteira.</p></div><dl><div><dt>Retrieval Provider</dt><dd>${escapeHtml(provider.name || provider.provider_id || 'não declarado')}${provider.version ? ` · v${escapeHtml(provider.version)}` : ''}</dd></div><div><dt>Implementação atual</dt><dd>${escapeHtml(provider.implementation || 'não observada')}${provider.implementation_version ? ` ${escapeHtml(provider.implementation_version)}` : ''} · substituível</dd></div><div><dt>Estado operacional</dt><dd>${escapeHtml(retrievalStatusLabel(architecture.operation.current_status))} · circuito ${escapeHtml(architecture.operation.circuit || 'não observado')}</dd></div></dl></section>

    <section class="brain-architecture-contracts">
      <header><div><p class="micro">CONTRATOS</p><h2>A camada constitucional</h2></div></header>
      <dl><div><dt>System Contracts</dt><dd>${brainCount(architecture.protocol.system_contracts)}</dd><span>declaram fontes, recuperação, evidência e condições de parada</span></div><div><dt>Source Contracts</dt><dd>${brainCount(architecture.protocol.source_contracts)}</dd><span>declaram casa de verdade, binding e política de frescor</span></div><div><dt>Retrieval Contract</dt><dd>${architecture.protocol.retrieval_versions.length ? architecture.protocol.retrieval_versions.map((version) => `v${escapeHtml(version)}`).join(' · ') : 'não observado'}</dd><span>lido pela experiência e pelo runtime</span></div><div><dt>Índice atual</dt><dd>${architecture.index.documents == null ? 'não observado' : `${brainCount(architecture.index.documents)} docs`}</dd><span>${architecture.index.updated_at ? `geração ${fmtDate(architecture.index.updated_at, false)}` : 'sem geração auditada'}</span></div></dl>
    </section>

    <section class="brain-context-agreement">
      <header><div><p class="micro">ACORDO DE CONTEXTO</p><h2>O Sistema pede contexto; o Cérebro decide como recuperá-lo.</h2><p>A fonte continua sendo a casa da verdade. O contrato do Sistema registra o que precisa, a janela, o frescor, a evidência mínima e quando parar.</p></div></header>
      <ol><li><span>01</span><div><strong>Fonte</strong><p>Guarda o dado bruto e sua autoridade.</p></div></li><li><span>02</span><div><strong>Cérebro</strong><p>Coleta, prepara, destila, recupera e registra o contexto usado.</p></div></li><li><span>03</span><div><strong>Sistema</strong><p>Consome o contexto necessário e produz o resultado contratado.</p></div></li><li><span>04</span><div><strong>Run Record</strong><p>Prova se houve recuperação pelo Cérebro ou leitura direta autorizada da Fonte.</p></div></li></ol>
      <p class="brain-context-rule"><b>Leitura direta é exceção explícita.</b> Ela só acontece quando o contrato e a permissão do Sistema exigem dado fresco ou estruturado na Fonte; nunca por atalho invisível.</p>
    </section>

    ${renderBrainGraphPreview(state.brainGraph)}
    <p class="brain-graph-disclaimer">Este grafo é um mapa estrutural para inspeção. Ele não prova GraphRAG nem participa da recuperação observada hoje.</p>
    <section class="brain-privacy-boundary"><p class="micro">FRONTEIRA DE PRIVACIDADE</p><div><strong>Referências, não payload.</strong><span>Esta área não expõe query, conteúdo, snippet, hashes completos ou erro bruto.</span></div></section>
  </div>`;
}

function updateReasonCopy(code) {
  return {
    'update-source-not-configured': 'Este Cérebro ainda não aderiu ao canal empacotado de releases.',
    'git-checkout-update-protected': 'Checkout de desenvolvimento protegido: atualização automática não sobrescreve trabalho local.',
    'local-updater-missing': 'O updater local ainda não faz parte desta instalação.',
    'installation-version-missing': 'A instalação precisa de uma versão canônica antes de entrar no canal gerenciado.',
    'update-check-unavailable': 'Não foi possível consultar a última release agora.',
    'update-channel-unmanaged': 'Nenhum canal oficial de releases está configurado.',
    'managed-update-unavailable': 'Esta instalação não aceita atualização automática com segurança.',
    'managed-update-failed': 'A atualização foi cancelada. O contexto privado permaneceu intacto.',
    'update-check-required': 'Verifique novamente a última release antes de atualizar.',
  }[code] || label(code || 'não observado');
}

function updateRemoteCopy(remote) {
  if (!remote) return { label: 'Ainda não verificado', tone: 'neutral', detail: 'A consulta externa só acontece quando você pedir.' };
  return {
    current: { label: 'Motor em dia', tone: 'good', detail: `A release ${remote.tag} já está nesta instalação.` },
    'update-available': { label: `Release ${remote.tag} disponível`, tone: 'warn', detail: `Publicada em ${fmtDate(remote.published_at, false)}.` },
    ahead: { label: 'À frente da última release', tone: 'neutral', detail: `O motor local está além de ${remote.tag}.` },
    'comparison-unavailable': { label: 'Versões não comparáveis', tone: 'neutral', detail: 'A instalação e o motor usam esquemas de versão diferentes.' },
  }[remote.status] || { label: label(remote.status), tone: 'neutral', detail: '' };
}

function renderBrainUpdates(anatomy) {
  const updates = state.brain.updates;
  if (!updates.data && !updates.loading) void loadBrainUpdates();
  const center = updates.data || anatomy.update_center;
  if (!center) return '<div class="loading"><i></i><span>Lendo versão e canal local…</span></div>';
  const installation = center.installation;
  const motor = center.motor;
  const society = center.society;
  const remote = center.remote || null;
  const remoteCopy = updateRemoteCopy(remote);
  const managed = installation.update_management === 'managed-release';
  const profile = installation.profile === 'legacy-compatible' ? 'Privado · compatível'
    : managed ? 'Release gerenciada' : 'Instalação local';
  const distribution = installation.distribution === 'inevita' ? 'Distribuição INEVITA' : 'Distribuição privada';
  const checkLabel = updates.checking ? 'Verificando…' : remote ? 'Verificar novamente' : 'Verificar atualização';
  const applyButton = remote?.status === 'update-available' && motor.can_apply
    ? `<button type="button" class="action primary" data-update-apply ${updates.applying ? 'disabled' : ''}>${updates.applying ? 'Atualizando…' : `Atualizar para ${escapeHtml(remote.tag)}`}</button>` : '';
  const unmanagedNote = managed ? 'Esta instalação pode receber uma release publicada com confirmação explícita.'
    : updateReasonCopy(installation.reason_code);
  return `<div class="brain-control-view brain-updates-view">
    <section class="brain-update-hero">
      <div><p class="micro">VERSÃO E CONTINUIDADE</p><h2>Seu contexto fica. O motor evolui.</h2><p>Compatibilidade, atualização do software e catálogo da Society são estados diferentes — e aparecem separados aqui.</p></div>
      <div class="brain-update-identity"><span>${escapeHtml(profile)}</span><strong>v${escapeHtml(installation.version)}</strong><small>${escapeHtml(distribution)} · runtime ${escapeHtml(installation.runtime_mode || 'não declarado')}</small></div>
    </section>

    ${center.last_update ? `<div class="brain-update-result"><b>Motor atualizado para v${escapeHtml(center.last_update.installed_version)}</b><span>Reabra o Console para carregar o código novo. O contexto privado não foi enviado.</span></div>` : ''}
    ${updates.error ? `<div class="brain-update-error"><b>Verificação interrompida</b><span>${escapeHtml(updateReasonCopy(updates.error))}</span></div>` : ''}

    <section class="brain-update-grid">
      <article class="brain-update-card">
        <header><span>01</span><div><p class="micro">CÉREBRO DA EMPRESA</p><h3>Sua instalação privada</h3></div></header>
        <dl><div><dt>Versão</dt><dd>v${escapeHtml(installation.version)}</dd></div><div><dt>Brain Manifest</dt><dd>${installation.manifest_version ? `v${escapeHtml(installation.manifest_version)}` : 'não observado'}</dd></div><div><dt>Compatibilidade</dt><dd>${installation.compatibility_percent == null ? 'não medida' : `${brainCount(installation.compatibility_percent)}%`}</dd></div><div><dt>Canal</dt><dd>${managed ? 'gerenciado' : 'ainda não gerenciado'}</dd></div></dl>
        <p>${escapeHtml(unmanagedNote)}</p>
        ${managed ? '' : '<button type="button" class="text-action" data-view="compatibility">Ver conformidade antes da migração →</button>'}
      </article>

      <article class="brain-update-card is-motor">
        <header><span>02</span><div><p class="micro">MOTOR & CONSOLE</p><h3>O software que opera o Cérebro</h3></div></header>
        <div class="brain-update-status"><span class="${escapeHtml(remoteCopy.tone)}"></span><div><strong>${escapeHtml(remoteCopy.label)}</strong><small>${escapeHtml(remoteCopy.detail)}</small></div></div>
        <dl><div><dt>Versão local</dt><dd>v${escapeHtml(motor.version)}</dd></div><div><dt>Modo</dt><dd>${motor.mode === 'development-checkout' ? 'checkout de desenvolvimento' : 'release empacotada'}</dd></div><div><dt>Origem</dt><dd>${escapeHtml(motor.source.repo || 'não configurada')}</dd></div><div><dt>Último check</dt><dd>${remote?.checked_at ? fmtDate(remote.checked_at) : 'nunca'}</dd></div></dl>
        <div class="brain-update-actions"><button type="button" class="action" data-update-check ${!motor.can_check || updates.checking || updates.applying ? 'disabled' : ''}>${escapeHtml(checkLabel)}</button>${applyButton}</div>
        <small>A consulta envia apenas o nome público do repositório e recebe metadados da release. Nenhuma Fonte, query ou output sai desta máquina.</small>
      </article>

      <article class="brain-update-card">
        <header><span>03</span><div><p class="micro">SOCIETY</p><h3>Catálogo distribuído com o motor</h3></div></header>
        <div class="brain-society-version"><strong>v${escapeHtml(society.distribution_version)}</strong><span>${brainCount(society.visible)} no catálogo · ${brainCount(society.installed)} destes já ${society.installed === 1 ? 'está' : 'estão'} no Cérebro</span></div>
        <p>Novas fichas, contratos e releases publicados chegam no pacote do motor. Seus Sistemas instalados, grants, julgamentos e contexto continuam locais.</p>
        <button type="button" class="text-action" data-view="society">Abrir catálogo da Society →</button>
      </article>
    </section>

    <section class="brain-update-boundary"><div><p class="micro">GARANTIA DE ATUALIZAÇÃO</p><h3>Motor entra. Contexto não sai.</h3></div><ul><li>sem atualização silenciosa</li><li>release publicada obrigatória</li><li>caminhos do dono preservados</li><li>checkout Git nunca sobrescrito</li></ul></section>
  </div>`;
}

function renderAnatomy() {
  const anatomy = state.anatomy;
  if (!anatomy) {
    void loadAnatomy();
    return '<div class="loading"><i></i><span>Compilando contratos e recibos do Cérebro…</span></div>';
  }
  if (!anatomy.control_center) return `${renderBrainModeSwitch()}${empty('Centro operacional indisponível', 'Atualize o Console para recompilar este read model.')}`;
  const views = {
    overview: renderBrainOverview,
    memory: renderBrainMemory,
    recovery: renderBrainRecovery,
    learning: renderBrainLearning,
    architecture: renderBrainArchitecture,
    updates: renderBrainUpdates,
  };
  return `${renderBrainModeSwitch(anatomy)}${(views[state.brain.mode] || renderBrainOverview)(anatomy)}`;
}

function openBrainRun(runId) {
  const run = state.anatomy?.control_center?.recovery?.runs.find((entry) => entry.run_id === runId);
  if (!run) return;
  const expectedSources = run.expected.required_sources.length
    ? run.expected.required_sources.map((source) => `<li><div><strong>${escapeHtml(source.role || source.source_id)}</strong><span>${escapeHtml(source.source_id || 'Fonte sem id')}</span></div><small>${escapeHtml(source.freshness || 'frescor não declarado')}</small></li>`).join('')
    : '<li><span>Nenhuma Fonte obrigatória observada no contrato.</span></li>';
  const observedSources = run.observed.sources.length
    ? run.observed.sources.map((source) => `<li><div><strong>${escapeHtml(source.role || source.source_id)}</strong><span>${escapeHtml(source.source_id || 'Fonte sem id')}</span></div><small>${brainCount(source.selected_refs)} refs · ${escapeHtml(label(source.assurance))} · frescor ${source.freshness_observed ? 'marcado' : 'não verificável'}</small></li>`).join('')
    : '<li><span>Nenhuma Fonte observada no Context Snapshot.</span></li>';
  const issues = [...run.observed.gaps.map((item) => ({ ...item, kind: 'Gap' })), ...run.observed.conflicts.map((item) => ({ ...item, kind: 'Conflito' })), ...run.observed.fallbacks.map((item) => ({ ...item, kind: 'Fallback' }))];
  showDrawerShell(`<div class="drawer-head"><p class="eyebrow">CONTEXT SNAPSHOT · ${escapeHtml(run.system_id)}</p><h2>${escapeHtml(run.system_name)}</h2>${badge(run.integrity.state, integrityTone(run.integrity.state), integrityLabel(run.integrity.state))}<p>${fmtDate(run.completed_at || run.started_at)} · ${escapeHtml(run.run_id)}</p></div>
    <section class="drawer-section brain-run-contract"><h3>Contrato esperado</h3><p class="section-help">O que o System Contract exige antes da execução.</p><ul>${expectedSources}</ul><dl><div><dt>Fontes opcionais</dt><dd>${brainCount(run.expected.optional_sources)}</dd></div><div><dt>Evidência mínima</dt><dd>${run.expected.minimum_refs == null ? 'não declarada' : `${brainCount(run.expected.minimum_refs)} ref por claim`}</dd></div><div><dt>Condições de parada</dt><dd>${brainCount(run.expected.stop_conditions)}</dd></div><div><dt>Fallback</dt><dd>${run.expected.fallback_enabled ? 'permitido pelo contrato' : 'não permitido'}</dd></div></dl></section>
    <section class="drawer-section brain-run-observed"><h3>Contexto observado</h3><p class="section-help">Contagens e garantias do Run Record V2; conteúdo e referências privadas permanecem fechados.</p><ul>${observedSources}</ul><dl><div><dt>Referências</dt><dd>${brainCount(run.integrity.references)}</dd></div><div><dt>Marcadores de frescor</dt><dd>${brainCount(run.integrity.freshness_markers)}/${brainCount(run.integrity.accesses)}</dd></div><div><dt>Eval</dt><dd>${run.eval_passed == null ? 'pendente' : run.eval_passed ? 'passou' : 'falhou'}</dd></div><div><dt>Recuperação</dt><dd>${run.retrieval.mode === 'semantic-provider' ? escapeHtml(label(run.retrieval.decision || run.retrieval.status)) : 'coleta direta/contratual'}</dd></div></dl></section>
    <section class="drawer-section"><h3>Limitações declaradas</h3>${issues.length ? `<div class="brain-run-issues">${issues.map((item) => `<span><b>${escapeHtml(item.kind)}</b>${escapeHtml(item.source_role || 'contexto')} · ${escapeHtml(label(item.reason_code))}</span>`).join('')}</div>` : '<p class="brain-clear-state">Nenhum gap, conflito ou fallback registrado.</p>'}</section>
    <section class="drawer-section brain-run-privacy"><h3>Privacidade</h3><p>Query, conteúdo, snippets, referências selecionadas, hashes e erro bruto não foram enviados para esta vista.</p></section>`);
}

async function loadAnatomy() {
  try {
    state.anatomy = await getJson('/api/anatomy');
    if (state.brain.mode === 'architecture') void loadBrainGraph();
    if (state.view === 'anatomy') render();
  } catch { /* a view mostra loading; refresh recarrega */ }
}

async function loadBrainUpdates() {
  const updates = state.brain.updates;
  if (updates.loading) return;
  updates.loading = true;
  updates.error = null;
  try {
    updates.data = await getJson('/api/update');
  } catch (error) {
    updates.error = error.message;
  } finally {
    updates.loading = false;
    if (state.view === 'anatomy' && state.brain.mode === 'updates') render();
  }
}

async function checkBrainUpdates() {
  const updates = state.brain.updates;
  if (updates.checking || updates.applying) return;
  updates.checking = true;
  updates.error = null;
  render();
  try {
    updates.data = await mutate('/api/update/check', {});
    toast(updateRemoteCopy(updates.data.remote).label);
  } catch (error) {
    updates.error = error.message;
    toast(updateReasonCopy(error.message), 'bad');
  } finally {
    updates.checking = false;
    render();
  }
}

async function applyBrainUpdate() {
  const updates = state.brain.updates;
  const remote = updates.data?.remote;
  if (updates.applying || remote?.status !== 'update-available') return;
  const approval = await askConfirm({
    title: `Atualizar o motor para ${remote.tag}`,
    body: 'A release publicada substituirá somente arquivos do motor. Contexto, operação, configurações, contribuições e feedback do dono permanecem intactos. Depois será necessário reabrir o Console.',
    confirmLabel: 'Atualizar motor',
  });
  if (!approval) return;
  updates.applying = true;
  updates.error = null;
  render();
  try {
    updates.data = await mutate('/api/update/apply', { expected_tag: remote.tag });
    toast(`Motor atualizado para v${updates.data.last_update.installed_version}. Reabra o Console.`);
    await loadAnatomy();
  } catch (error) {
    updates.error = error.message;
    toast(updateReasonCopy(error.message), 'bad');
  } finally {
    updates.applying = false;
    render();
  }
}

async function loadBrainGraph() {
  if (state.brainGraph) return;
  try {
    state.brainGraph = await getJson('/api/graphs/brain');
    if (state.view === 'anatomy' && state.brain.mode === 'architecture') render();
  } catch { /* Arquitetura mantém o estado de mapa indisponível */ }
}

const DECISION_CATEGORIES = {
  experimento: '🧪 experimento em gate',
  escalacao: '🚨 exceção do loop',
  radar: '📡 sinal de mercado',
  persona: '🧭 revisão de persona',
  martelo: '🔨 martelo de negócio',
  curadoria: '🌱 curadoria/promoção',
  integracao: '🧩 integração semanal',
  preflight: '🌱 curadoria/promoção',
};
function decisionCategory(category) {
  return DECISION_CATEGORIES[category] || category;
}

function renderToday() {
  const ids = [...state.model.today.needs_attention, ...state.model.today.ready_to_work, ...state.model.today.active];
  const routines = ids.map((id) => state.model.routines.find((routine) => routine.routine_id === id)).filter(Boolean).filter((routine) => inActiveOperatingArea(systemOperatingArea(routine.system_ref)));
  const pending = visibleJudgments().filter((item) => item.judgment.status === 'pending');
  const queue = state.decisions;
  const decisionRow = (item, index) => `<div class="decision-row" role="listitem">
      <b>${index + 1}</b>
      <div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(decisionCategory(item.category))} · ${escapeHtml(item.first_seen)}</small></div>
      <span class="decision-age${item.age_days >= 30 ? ' overdue' : item.age_days >= 7 ? ' late' : ''}">${item.age_days}d${item.age_days >= 30 ? ' ⚖️' : item.age_days >= 7 ? ' ⏰' : ''}</span>
    </div>`;
  const decisionRows = queue?.available ? queue.open.slice(0, 5).map(decisionRow).join('') : '';
  const laterDecisions = queue?.available ? queue.open.slice(5) : [];
  const priorityRoutines = routines.slice(0, 4);
  const laterRoutines = routines.slice(4);
  return `<div class="section-heading"><div><p class="eyebrow">AGORA</p><h2>Mesa de operação</h2></div><p>Primeiro o que pede julgamento; depois o que já está pronto para trabalhar.</p></div>
    ${queue?.available ? `<div class="today-block"><div class="subheading"><h3>🔨 Decidir agora</h3><span>${queue.open_count} abertas · ${queue.decided_total} decididas</span></div><div class="decision-list" role="list">${decisionRows || '<p class="muted">Fila vazia — nada espera seu martelo.</p>'}</div>${laterDecisions.length ? `<details class="today-more"><summary>Ver mais ${laterDecisions.length} decisões</summary><div class="decision-list" role="list">${laterDecisions.map((item, index) => decisionRow(item, index + 5)).join('')}</div></details>` : ''}<div class="boundary-note"><b>Uma fila, um juiz</b>O veredito acontece na mesa de martelo; o Console mostra a verdade, não a substitui.</div></div>` : ''}
    ${pending.length ? `<div class="today-block"><p class="micro">OUTPUTS PARA JULGAR</p>${judgmentList(pending)}</div>` : ''}
    <div class="today-block"><div class="subheading"><h3>Trabalhar agora</h3><span>${routines.length} rotinas no radar</span></div><div class="routine-list">${priorityRoutines.length ? priorityRoutines.map(routineCard).join('') : empty('Nenhuma rotina pede atenção', 'Rotinas ativas e prontas aparecem aqui.')}</div>${laterRoutines.length ? `<details class="today-more"><summary>Ver mais ${laterRoutines.length} rotinas</summary><div class="routine-list">${laterRoutines.map(routineCard).join('')}</div></details>` : ''}</div>`;
}

function canvasRefOptions() {
  if (state.canvas.scope === 'system') {
    const byArea = new Map();
    for (const system of visibleSystems()) {
      const areaName = operatingAreaName(system.operating_area);
      if (!byArea.has(areaName)) byArea.set(areaName, []);
      byArea.get(areaName).push(system);
    }
    return [...byArea.entries()].map(([areaName, systems]) => `<optgroup label="${escapeHtml(areaName)}">${systems.map((system) => `<option value="${escapeHtml(system.system_id)}"${state.canvas.ref === system.system_id ? ' selected' : ''}>${escapeHtml(system.name)}</option>`).join('')}</optgroup>`).join('');
  }
  if (state.canvas.scope === 'run') {
    return allCanvasExecutions().map((execution) => `<option value="${escapeHtml(execution.selector_ref)}"${state.canvas.ref === execution.selector_ref ? ' selected' : ''}>${escapeHtml(execution.label)} · ${escapeHtml(execution.mode ? label(execution.mode) : 'Run')} · ${fmtDate(execution.completed_at)}</option>`).join('');
  }
  return '';
}

// Execuções de um sistema, prontas pro seletor do Canvas
function executionsForSystem(system) {
  const routineIds = new Set(state.model.routines.filter((routine) => refMatchesSystem(routine.system_ref, system)).map((routine) => routine.routine_id));
  const receipts = state.model.routines
    .filter((routine) => routineIds.has(routine.routine_id))
    .flatMap((routine) => routine.receipts.map((receipt) => ({
      selector_ref: receipt.receipt_id,
      label: routine.name,
      status: receipt.status,
      mode: 'replay',
      completed_at: receipt.completed_at,
    })));
  const receiptRunIds = new Set(state.model.routines.flatMap((routine) => routine.receipts.map((receipt) => receipt.run_id)));
  const standalone = (state.model.run_records || [])
    .filter((record) => refMatchesSystem(record.system_ref, system) && !receiptRunIds.has(record.run_id))
    .map((record) => ({
      selector_ref: record.run_record_ref,
      label: record.experiment_ref ? `${record.experiment_ref}` : label(record.mode || 'run'),
      status: record.status === 'completed' ? 'completed' : record.status,
      mode: record.mode,
      completed_at: record.completed_at,
    }));
  return [...receipts, ...standalone].sort((left, right) => Date.parse(right.completed_at) - Date.parse(left.completed_at));
}

// Cockpit do Sistema — o centro de comando sob o mapa: números reais,
// execuções clicáveis e as portas (detalhes, manifest, interface própria).
function systemCockpit(system) {
  const executions = executionsForSystem(system);
  const judgments = state.model.judgments.filter((item) => refMatchesSystem(item.system_ref, system));
  const approved = judgments.filter((item) => item.judgment.status === 'approved' || item.judgment.verdict === 'approved').length;
  const pending = judgments.filter((item) => item.judgment.status === 'pending').length;
  const routines = state.model.routines.filter((routine) => refMatchesSystem(routine.system_ref, system));
  const experiments = (state.model.experiments || []).filter((experiment) => refMatchesSystem(experiment.system_ref, system));
  const lastRun = executions[0]?.completed_at;
  return `<div class="system-cockpit">
    <div class="cockpit-stats">
      <span><b>${executions.length}</b> execuções</span>
      <span><b>${approved}</b> aprovadas${pending ? ` · <b class="warn-text">${pending}</b> pendentes` : ''}</span>
      <span><b>${routines.length}</b> rotinas</span>
      <span><b>${experiments.length}</b> experimentos</span>
      <span><b>${lastRun ? fmtDate(lastRun) : '—'}</b> última execução</span>
      <span class="cockpit-actions">
        <button class="canvas-tool" data-open-system="${escapeHtml(system.system_id)}">Detalhes</button>
        ${system.source_manifest_ref ? `<button class="canvas-tool" data-copy-ref="${escapeHtml(system.source_manifest_ref)}" title="Copiar caminho do manifest">Manifest ⧉</button>` : ''}
        ${system.interface_ref ? `<a class="canvas-tool replay" href="${system.interface_ref.startsWith('http') ? escapeHtml(system.interface_ref) : `/files/${encodeURIComponent(system.interface_ref)}`}" target="_blank" rel="noopener">Abrir interface ↗</a>` : ''}
      </span>
    </div>
    ${executions.length ? `<div class="cockpit-execs"><p class="micro">EXECUÇÕES · ${executions.length} — clique para abrir o trace</p>${executions.slice(0, 12).map((execution) => `<button type="button" class="cockpit-exec" data-canvas-jump-run="${escapeHtml(execution.selector_ref)}"><i class="health-dot ${tone(execution.status)}"></i><strong>${escapeHtml(execution.label)}</strong><small>${escapeHtml(label(execution.mode || '—'))}</small><small>${fmtDate(execution.completed_at)}</small><b>→</b></button>`).join('')}${executions.length > 12 ? `<p class="muted">+ ${executions.length - 12} anteriores na aba Execuções</p>` : ''}</div>` : '<p class="section-help">Nenhuma execução registrada ainda — o primeiro run aparece aqui com trace clicável.</p>'}
  </div>`;
}

const TIMING_LABELS = {
  collector: 'Coleta', retrieval: 'Contexto', capability: 'Execução / modelo',
  model: 'Modelo', output: 'Entrega', eval: 'Avaliação', judgment: 'Julgamento',
};

function runTimingPanel(graph) {
  const timing = graph.trace_timing;
  if (!timing) return '';
  if (timing.assurance === 'total-only') return `<div class="run-timing-head"><div><p class="micro">TEMPO DO RUN</p><strong>${fmtDuration(timing.total_duration_ms)}</strong></div><span>total disponível</span></div><p class="run-timing-limited">Trace reconstruído: não existe granularidade suficiente para atribuir duração às etapas.</p>`;
  const measured = timing.coverage_ratio > 0.999 ? '≈100' : String(Math.round((timing.coverage_ratio || 0) * 100));
  const rows = timing.critical_path.map((stage) => {
    const share = stage.duration_ms === null ? 0 : Math.max(0, (stage.share_of_total || 0) * 100);
    const shareLabel = share < 0.1 ? share.toFixed(3) : share.toFixed(1);
    const dominant = stage.step_id === timing.dominant_step_id;
    return `<button type="button" class="run-timing-row${dominant ? ' dominant' : ''}" ${stage.node_id ? `data-canvas-inspect-node="${escapeHtml(stage.node_id)}"` : 'disabled'}>
      <progress max="100" value="${share}" aria-label="${shareLabel}% do tempo total"></progress>
      <b>${escapeHtml(TIMING_LABELS[stage.step_type] || label(stage.step_type))}</b>
      <strong>${stage.duration_ms === null ? escapeHtml(label(stage.state)) : fmtDuration(stage.duration_ms)}</strong>
    </button>`;
  }).join('');
  const model = timing.nested_stages.find((stage) => stage.step_type === 'model');
  const modelNote = model
    ? `<button type="button" class="run-timing-model" ${model.node_id ? `data-canvas-inspect-node="${escapeHtml(model.node_id)}"` : 'disabled'}><span>↳ Modelo</span><b>${model.duration_ms === null ? 'duração não separada neste trace' : fmtDuration(model.duration_ms)}</b></button>`
    : '';
  return `<div class="run-timing-head"><div><p class="micro">TEMPO DO RUN</p><strong>${fmtDuration(timing.total_duration_ms)}</strong></div><span>${measured}% medido pelo trace</span></div><div class="run-timing-bars">${rows}</div>${modelNote}<div class="run-timing-foot"><span>${timing.dominant_step_id ? `Gargalo: ${escapeHtml(TIMING_LABELS[timing.critical_path.find((stage) => stage.step_id === timing.dominant_step_id)?.step_type] || timing.dominant_step_id)}` : 'Sem etapa dominante'}</span><b>${fmtDuration(timing.unattributed_duration_ms)} entre etapas</b></div>`;
}

function renderCanvas() {
  const hasRef = state.canvas.scope !== 'brain';
  const areaTitle = state.canvas.scope === 'brain' ? 'Mapa da Empresa'
    : state.canvas.scope === 'system' ? (state.model.systems.find((system) => system.system_id === state.canvas.ref)?.name || 'Sistema')
      : 'Execução';
  const cockpitSystem = state.canvas.scope === 'system' && state.canvas.ref
    ? state.model.systems.find((system) => system.system_id === state.canvas.ref) : null;
  return `<div class="canvas-page${cockpitSystem ? ' with-cockpit' : ''}">
    <div class="canvas-stage-shell">
      <div class="canvas-graph-pane">
        <div class="canvas-ambient one"></div><div class="canvas-ambient two"></div>
        <canvas id="canvas-particles" class="canvas-particles"></canvas>
        <div class="canvas-area-title">${escapeHtml(areaTitle)}</div>
        <div id="operational-canvas" class="operational-canvas"><div class="loading"><i></i><span>Compilando grafo local…</span></div></div>
        <div id="canvas-origin" class="canvas-origin"></div>
        <section id="run-timing" class="run-timing" hidden aria-label="Duração por etapa do Run"></section>
        <div class="canvas-legend" aria-label="Legenda de estados">
          <span class="declared"><i></i>Declarado</span><span class="running"><i></i>Executando</span><span class="completed"><i></i>Concluído</span><span class="gap"><i></i>Lacuna</span><span class="failed"><i></i>Falhou</span>
        </div>
        ${hasRef ? `<div class="canvas-nav-pill" role="navigation" aria-label="Trocar referência"><button data-canvas-cycle="-1" aria-label="Anterior">‹</button><span>${escapeHtml(areaTitle)}</span><button data-canvas-cycle="1" aria-label="Próximo">›</button></div>` : ''}
      </div>
      <div class="canvas-toolbar" role="toolbar" aria-label="Controles do Canvas">
        <div class="canvas-segmented" aria-label="Escala do mapa">
          <button data-canvas-scope="brain" class="${state.canvas.scope === 'brain' ? 'active' : ''}">Mapa da empresa</button>
          <button data-canvas-scope="system" class="${state.canvas.scope === 'system' ? 'active' : ''}">Sistema</button>
          <button data-canvas-scope="run" class="${state.canvas.scope === 'run' ? 'active' : ''}">Execução</button>
        </div>
        ${hasRef ? `<label class="canvas-select-label"><span>${state.canvas.scope === 'system' ? 'Sistema' : 'Execução real'}</span><select id="canvas-ref">${canvasRefOptions()}</select></label>` : ''}
        ${state.canvas.scope === 'run' ? '<button class="canvas-tool replay" data-canvas-replay disabled aria-describedby="replay-availability">▶ Reproduzir trace</button><span id="replay-availability" class="replay-availability">Confirmando eventos registrados…</span>' : ''}
        <button class="canvas-tool" data-canvas-fit>Mapa inteiro</button>
        <button class="canvas-tool ${state.canvas.editable ? 'active' : ''}" data-canvas-edit>${state.canvas.editable ? 'Bloquear' : 'Reorganizar'}</button>
        <button class="canvas-tool primary" data-canvas-save disabled>Salvar</button>
      </div>
      <aside id="canvas-inspector" class="canvas-inspector"><p class="micro">DETALHES DO OBJETO</p><h3>Selecione um nó</h3><p>Fontes são casas de verdade. Etapas são contrato. Artefatos são os objetos que realmente atravessaram uma execução.</p></aside>
    </div>
    ${cockpitSystem ? systemCockpit(cockpitSystem) : ''}
    <details class="canvas-accessible"><summary>Ver equivalente em lista</summary><div id="canvas-list"></div></details>
    <div class="boundary-note"><b>Layout ≠ arquitetura</b>Reorganizar salva apenas coordenadas privadas nesta máquina. Criar ou remover Fonte, Sistema, gate ou aresta continua exigindo mudança de contrato.</div>
  </div>`;
}

function renderJudgments() {
  const pending = visibleJudgments().filter((item) => item.judgment.status === 'pending');
  const decided = visibleJudgments().filter((item) => item.judgment.status !== 'pending');
  return `<div class="section-heading"><div><p class="eyebrow">MARTELO HUMANO</p><h2>Caixa de Julgamento</h2></div><p>Abra o output privado, decida e deixe rastro. Nenhum botão desta tela executa ação externa.</p></div>
    <div class="judgment-section"><div class="subheading"><h3>Pendentes</h3><span>${pending.length}</span></div>${pending.length ? judgmentList(pending) : empty('Nenhum output pendente', 'O próximo run concluído aparecerá aqui para julgamento.')}</div>
    <div class="judgment-section"><div class="subheading"><h3>Histórico</h3><span>${decided.length}</span></div>${decided.length ? judgmentList(decided) : '<p class="muted">Nenhum julgamento registrado ainda.</p>'}</div>`;
}

function renderAreas() {
  return `<div class="section-heading"><div><p class="eyebrow">RESPONSABILIDADE OPERACIONAL</p><h2>Áreas responsáveis</h2></div><p>Áreas declaram quem responde internamente. Funções empresariais classificam o trabalho no Launcher e na Society.</p></div><div class="object-grid">${state.model.areas.map((area) => `<article class="object-card" data-kind="area"><span class="object-index">${String(area.system_refs.length).padStart(2, '0')}</span><p class="micro">ÁREA RESPONSÁVEL</p><h3>${escapeHtml(area.name)}</h3><p>${area.system_refs.length} sistema(s) · ${area.routine_refs.length} rotina(s)</p><div class="ref-list">${area.system_refs.map((ref) => `<code>${escapeHtml(ref)}</code>`).join('')}</div></article>`).join('') || empty('Nenhuma área responsável declarada', 'Áreas aparecem quando Sistemas possuem contratos válidos.')}</div>`;
}

function systemOperational(system) {
  const records = (state.model.run_records || [])
    .filter((record) => refMatchesSystem(record.system_ref, system))
    .sort((left, right) => String(right.completed_at || '').localeCompare(String(left.completed_at || '')));
  const judgments = (state.model.judgments || []).filter((item) => refMatchesSystem(item.system_ref, system));
  return {
    records,
    lastRun: records[0] || null,
    pendingJudgments: judgments.filter((item) => item.judgment.status === 'pending').length,
  };
}

function systemPreflight(system) {
  const installedSourceIds = new Set((state.model.sources || []).map((source) => source.source_id));
  const required = (system.source_refs || []).filter((source) => source.required);
  const verifiable = required.filter((source) => source.source_id);
  const found = verifiable.filter((source) => installedSourceIds.has(source.source_id));
  const missing = verifiable.filter((source) => !installedSourceIds.has(source.source_id));
  const afterAuthorization = required.filter((source) => !source.source_id);
  if (missing.length) {
    return {
      status: 'context-required', label: 'Precisa preparar contexto', tone: 'warn',
      detail: `${found.length}/${verifiable.length} Fontes obrigatórias encontradas · ${missing.length} ausente(s)`,
    };
  }
  if (afterAuthorization.length) {
    return {
      status: 'verify-after-authorization', label: 'Verificar após autorização', tone: 'neutral',
      detail: `${afterAuthorization.length} requisito(s) só verificável(is) depois do grant`,
    };
  }
  return {
    status: 'verify-authorizations', label: 'Fontes encontradas', tone: 'good',
    detail: `${found.length}/${verifiable.length} Fontes obrigatórias · autorizações ainda precisam ser verificadas`,
  };
}

function safeSystemInterfaceUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const localHttp = url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    return url.protocol === 'https:' || localHttp ? url.href : null;
  } catch { return null; }
}

async function loadSystemInterfaceHealth(system) {
  const id = system.system_id;
  if (!id || state.systems.interfaceHealth[id]) return;
  state.systems.interfaceHealth[id] = { status: 'checking' };
  try {
    state.systems.interfaceHealth[id] = await getJson(`/api/systems/${encodeURIComponent(id)}/interface-health`);
  } catch {
    state.systems.interfaceHealth[id] = { status: 'unavailable', reason_code: 'interface-healthcheck-failed' };
  }
  if (state.view === 'systems' || state.view === 'system') render();
}

function ensureSystemInterfaceHealth(system) {
  if (!safeSystemInterfaceUrl(system?.interface_ref)) return;
  void loadSystemInterfaceHealth(system);
}

function ensureVisibleSystemInterfaceHealth() {
  if (state.view === 'systems') visibleSystems().forEach(ensureSystemInterfaceHealth);
  if (state.view === 'system' && state.workspace?.data) ensureSystemInterfaceHealth(state.workspace.data.system);
}

function systemLaunchAction(system) {
  const interfaceUrl = safeSystemInterfaceUrl(system.interface_ref);
  if (!interfaceUrl) {
    const invalid = Boolean(system.interface_ref);
    const missing = Boolean(system.interface_expected);
    return `<span class="system-interface-state ${invalid ? 'invalid' : 'missing'}" data-interface-health="${invalid ? 'invalid' : missing ? 'not-installed' : 'not-declared'}">${invalid ? 'Interface não suportada' : missing ? 'Aplicação não instalada' : 'Sem interface própria'}</span>`;
  }
  const health = state.systems.interfaceHealth[system.system_id];
  if (!health || health.status === 'checking') {
    return '<span class="system-interface-state checking" data-interface-health="checking"><i></i>Verificando aplicação…</span>';
  }
  if (health.status === 'unavailable') {
    const reason = health.reason_code === 'interface-timeout' ? 'A aplicação não respondeu a tempo' : 'A aplicação não respondeu agora';
    return `<span class="system-interface-state unavailable" data-interface-health="unavailable" title="${escapeHtml(reason)}">Aplicação indisponível</span>`;
  }
  if (health.status === 'not-installed') {
    return '<span class="system-interface-state missing" data-interface-health="not-installed">Aplicação não instalada</span>';
  }
  if (!['available', 'not-checkable'].includes(health.status)) {
    return '<span class="system-interface-state unavailable" data-interface-health="unavailable">Aplicação indisponível</span>';
  }
  const unverified = health.status === 'not-checkable';
  const launchLabel = system.experience?.primary_surface?.launch_label || 'Abrir aplicação';
  return `<a class="system-app-link${unverified ? ' is-unverified' : ' is-primary'}" data-interface-health="${escapeHtml(health.status)}" data-system-launch="${escapeHtml(system.system_id)}" href="${escapeHtml(interfaceUrl)}" target="_blank" rel="noopener noreferrer"${unverified ? ' title="Disponibilidade não verificada pelo Cockpit"' : ''}>${escapeHtml(launchLabel)} <span aria-hidden="true">↗</span></a>`;
}

const FALLBACK_BUSINESS_FUNCTIONS = [
  { id: 'sales', label: 'Vendas' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'product', label: 'Produto' },
  { id: 'operations', label: 'Operações' },
  { id: 'community', label: 'Comunidade' },
  { id: 'data-technology', label: 'Dados & Tecnologia' },
];

const FALLBACK_OPERATING_AREAS = new Map([
  ['commercial', 'Comercial'],
  ['operations-technology', 'Operações & Tecnologia'],
  ['product-community', 'Produto & Comunidade'],
]);

function businessFunctions() {
  const declared = state.model?.system_taxonomy?.business_functions;
  return [{ id: 'all', label: 'Todos' }, ...(declared?.length ? declared : FALLBACK_BUSINESS_FUNCTIONS)];
}

function businessFunctionName(value) {
  return businessFunctions().find((item) => item.id === value)?.label || 'Não classificada';
}

function operatingAreaName(value) {
  return state.model?.system_taxonomy?.operating_areas.find((item) => item.id === value)?.label
    || state.model?.areas.find((item) => item.operating_area === value)?.name
    || FALLBACK_OPERATING_AREAS.get(value)
    || 'Geral';
}

function systemBusinessFunction(system) {
  return system.business_function || 'unclassified';
}

function systemInitials(system) {
  const words = String(system.name || system.system_id).replace(/^Sistema de\s+/i, '').split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
}

function systemIdentity(system, modifier = '') {
  const mark = system.experience?.presentation?.mark;
  if (!mark || mark.kind !== 'monogram') {
    return `<div class="system-identity${modifier ? ` ${modifier}` : ''}" aria-hidden="true"><span>${escapeHtml(systemInitials(system))}</span></div>`;
  }
  const accent = String(mark.accent || '#ECEBEA');
  const red = Number.parseInt(accent.slice(1, 3), 16);
  const green = Number.parseInt(accent.slice(3, 5), 16);
  const blue = Number.parseInt(accent.slice(5, 7), 16);
  const foreground = ((red * 299) + (green * 587) + (blue * 114)) / 1000 > 148 ? '#08090B' : '#FFFFFF';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><rect width="44" height="44" rx="8" fill="${accent}"/><text x="22" y="23" fill="${foreground}" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="750" text-anchor="middle" dominant-baseline="middle">${mark.text}</text></svg>`;
  const source = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  return `<div class="system-identity is-published${modifier ? ` ${modifier}` : ''}"><img src="${escapeHtml(source)}" alt="Marca de ${escapeHtml(system.name)}"></div>`;
}

function systemPublisher(system) {
  return system.experience?.publisher || null;
}

function publisherKindLabel(kind) {
  return kind === 'organization' ? 'organização' : kind === 'person' ? 'pessoa' : label(kind);
}

function operationalOwnerLabel(value) {
  if (!value) return 'Não declarado';
  return String(value).replace(/^role-/, '').replaceAll('-', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function systemCard(system) {
  const configured = system.migration_stage === 'configured';
  const active = system.migration_stage === 'active';
  const stageLabel = { mapped: 'Mapeado', configured: 'Configurado', active: 'Ativo' }[system.migration_stage] || label(system.migration_stage);
  const operational = systemOperational(system);
  const preflight = systemPreflight(system);
  const businessFunction = systemBusinessFunction(system);
  const publisher = systemPublisher(system);
  const tagline = system.experience?.presentation?.tagline || null;
  return `<article class="system-launcher-card" data-kind="system" data-system-category="${escapeHtml(businessFunction)}">
    <div class="system-card-head">
      ${systemIdentity(system)}
      <div class="system-card-title"><p class="micro">${escapeHtml(businessFunctionName(businessFunction))} · v${escapeHtml(system.version)}</p><h3>${escapeHtml(system.name)}</h3></div>
      ${badge(system.migration_stage, active ? 'good' : configured ? 'neutral' : 'warn', stageLabel)}
    </div>
    ${tagline ? `<p class="system-tagline">${escapeHtml(tagline)}</p>` : ''}
    <p class="system-result">${escapeHtml(system.result)}</p>
    <div class="system-owner"><span class="system-owner-avatar" aria-hidden="true">${escapeHtml((publisher?.display_name || operationalOwnerLabel(system.operational_owner)).slice(0, 1))}</span><span><small>${publisher ? 'Publicado por' : 'Dono operacional'}</small><b>${escapeHtml(publisher?.display_name || operationalOwnerLabel(system.operational_owner))}</b></span></div>
    <div class="system-health" data-readiness="${preflight.status}">${badge(preflight.status, preflight.tone, preflight.label)}<span>${operational.pendingJudgments ? `${operational.pendingJudgments} para julgar` : 'Sem julgamento pendente'}</span></div>
    <div class="system-compact-stats">
      <span><b>${operational.lastRun ? fmtDate(operational.lastRun.completed_at, false) : 'Nunca'}</b><small>Último Run</small></span>
      <span><b>${operational.records.length}</b><small>Runs</small></span>
      <span><b>${system.source_refs.length}</b><small>Fontes</small></span>
    </div>
    <div class="system-compact-actions">
      <button type="button" data-open-system="${escapeHtml(system.system_id)}">Ver Sistema</button>
      ${systemLaunchAction(system)}
    </div>
  </article>`;
}

function renderSystems() {
  const available = visibleSystems();
  if (!available.length) return `<div class="section-heading"><div><p class="eyebrow">RESULTADOS</p><h2>Sistemas</h2></div></div>${empty('Nenhum Sistema nesta área', 'O Console não cria verdade editorial: ele espera System Contracts reais.')}`;
  const query = state.systems.query.trim().toLocaleLowerCase('pt-BR');
  const systems = available.filter((system) => {
    const categoryMatch = state.systems.category === 'all' || systemBusinessFunction(system) === state.systems.category;
    const stageMatch = state.systems.stage === 'all' || system.migration_stage === state.systems.stage;
    const searchMatch = !query || `${system.name} ${system.result} ${system.experience?.presentation?.tagline || ''} ${system.experience?.publisher?.display_name || ''} ${operationalOwnerLabel(system.operational_owner)}`.toLocaleLowerCase('pt-BR').includes(query);
    return categoryMatch && stageMatch && searchMatch;
  }).sort((left, right) => {
    const weight = { active: 0, configured: 1, mapped: 2 };
    return (weight[left.migration_stage] ?? 3) - (weight[right.migration_stage] ?? 3)
      || left.name.localeCompare(right.name, 'pt-BR');
  });
  const categoryButtons = businessFunctions().map((category) => {
    const count = category.id === 'all' ? available.length : available.filter((system) => systemBusinessFunction(system) === category.id).length;
    return `<button type="button" class="system-filter${state.systems.category === category.id ? ' active' : ''}" data-system-category="${escapeHtml(category.id)}"${count ? '' : ' disabled'}>${escapeHtml(category.label)} <b>${count}</b></button>`;
  }).join('');
  const stageButtons = [['all', 'Todos'], ['active', 'Ativos'], ['configured', 'Configurados'], ['mapped', 'Mapeados']].map(([stage, copy]) => {
    const count = stage === 'all' ? available.length : available.filter((system) => system.migration_stage === stage).length;
    return `<button type="button" class="system-filter${state.systems.stage === stage ? ' active' : ''}" data-system-stage="${stage}"${count ? '' : ' disabled'}>${copy} <b>${count}</b></button>`;
  }).join('');
  const scopeSummary = state.operatingAreaFilter
    ? `${available.length} de ${state.model.systems.length} Sistemas na área ${operatingAreaName(state.operatingAreaFilter)}`
    : `${available.length} Sistemas neste Cérebro`;
  const visibleSummary = systems.length === available.length ? scopeSummary : `${systems.length} visíveis · ${scopeSummary}`;
  const lifecycle = ['active', 'configured', 'mapped'].map((stage) => {
    const count = available.filter((system) => system.migration_stage === stage).length;
    const name = { active: 'ativos', configured: 'configurados', mapped: 'mapeados' }[stage];
    return `${count} ${name}`;
  }).join(' · ');
  return `<div class="section-heading"><div><p class="eyebrow">LAUNCHER</p><h2>Meus Sistemas</h2></div><p>Conheça o Sistema antes de abrir sua aplicação. Contratos, contexto, Runs e confiança continuam no Cockpit.</p></div>
    <div class="systems-launcher-toolbar"><label><span>Buscar Sistema</span><input type="search" data-system-search value="${escapeHtml(state.systems.query)}" placeholder="Nome, resultado, publisher ou responsável" autocomplete="off"></label><div class="systems-filter-stack"><div><span class="micro">ESTÁGIO</span><div class="systems-filter-row" aria-label="Filtrar por estágio">${stageButtons}</div></div><div><span class="micro">FUNÇÃO</span><div class="systems-filter-row" aria-label="Filtrar por função empresarial">${categoryButtons}</div></div></div></div>
    <div class="systems-results"><span>${escapeHtml(visibleSummary)}</span><small>${escapeHtml(lifecycle)} · identidade publicada pelo Experience Manifest; catálogo público entra na Society.</small></div>
    <div class="systems-market-grid">${systems.map(systemCard).join('') || empty('Nenhum Sistema encontrado', 'Limpe a busca ou escolha outra função empresarial.')}</div>`;
}

const SKILL_ACRONYMS = new Set(['ads', 'cub', 'gtm', 'icp', 'ui', 'ux', 'vsl']);
const SKILL_LOWERCASE_WORDS = new Set(['a', 'as', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'para']);

function skillTitle(value) {
  return String(value || '').split('-').map((word, index) => (
    SKILL_ACRONYMS.has(word) ? word.toUpperCase()
      : index > 0 && SKILL_LOWERCASE_WORDS.has(word) ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
  )).join(' ');
}

function skillOriginLabel(skill) {
  if (skill.origins.length === 2) return 'Empresa + motor';
  return skill.origins[0] === 'company' ? 'Da empresa' : 'Do motor';
}

function skillStatusBadge(skill) {
  const status = skill.installation_status;
  const copy = status === 'available' ? 'Alinhada'
    : status === 'degraded' ? 'Sincronizar'
      : 'Só no motor';
  return badge(status, status === 'available' ? 'good' : status === 'degraded' ? 'warn' : 'neutral', copy);
}

function skillSystems(skill) {
  return skill.system_refs.map((ref) => systemByRef(ref)).filter(Boolean);
}

function skillCard(skill) {
  const systems = skillSystems(skill);
  return `<article class="skill-card" data-skill-status="${escapeHtml(skill.installation_status)}">
    <div class="skill-card-head"><div class="skill-mark" aria-hidden="true">/</div><div><p class="micro">${escapeHtml(skillOriginLabel(skill))}</p><h3>${escapeHtml(skillTitle(skill.name))}</h3></div>${skillStatusBadge(skill)}</div>
    <p class="skill-description">${escapeHtml(skill.description)}</p>
    <div class="skill-usage"><span>${systems.length ? `${systems.length} ${systems.length === 1 ? 'Sistema usa' : 'Sistemas usam'}` : 'Ainda sem uso declarado'}</span></div>
    <button type="button" class="skill-inspect" data-open-skill="${escapeHtml(skill.skill_id)}">Ver Skill</button>
  </article>`;
}

function executorCard(executor) {
  const ready = executor.auth_status === 'ready';
  return `<article class="skill-executor">
    <div><p class="micro">${escapeHtml(executor.binding_id)}</p><h3>${escapeHtml(label(executor.adapter))}</h3></div>
    ${badge(executor.auth_status, ready ? 'good' : executor.auth_status === 'authentication-required' ? 'warn' : 'bad')}
    <dl><div><dt>Modelo padrão</dt><dd><code>${escapeHtml(executor.default_model)}</code></dd></div><div><dt>Permissão</dt><dd>${escapeHtml(label(executor.permission_profile))}</dd></div><div><dt>Observado</dt><dd>${escapeHtml(fmtDate(executor.observed_at, false))}</dd></div></dl>
  </article>`;
}

function renderSkills() {
  const catalog = state.skills.data;
  if (!catalog) {
    if (state.skills.error) return empty('Catálogo de Skills indisponível', 'Atualize o Console para tentar recompilar as capacidades locais.');
    if (!state.skills.loading) void loadSkills();
    return '<div class="loading"><i></i><span>Compilando Skills e vínculos locais…</span></div>';
  }
  const all = catalog.skills || [];
  const query = state.skills.query.trim().toLocaleLowerCase('pt-BR');
  const visible = all.filter((skill) => {
    const originMatch = state.skills.origin === 'all' || skill.origins.includes(state.skills.origin);
    const statusMatch = state.skills.status === 'all' || skill.installation_status === state.skills.status;
    const linked = skill.system_refs.length > 0;
    const linkMatch = state.skills.link === 'all' || (state.skills.link === 'linked' ? linked : !linked);
    const searchHaystack = `${skill.skill_id} ${skill.name} ${skill.description} ${skillSystems(skill).map((system) => system.name).join(' ')}`.toLocaleLowerCase('pt-BR');
    return originMatch && statusMatch && linkMatch && (!query || searchHaystack.includes(query));
  });
  const counts = catalog.counts;
  const originFilters = [
    ['company', 'Nesta empresa', counts.company],
    ['engine', 'No motor', counts.engine],
    ['all', 'Todas', counts.unique],
  ].map(([value, copy, count]) => `<button type="button" class="skill-filter${state.skills.origin === value ? ' active' : ''}" data-skill-origin="${value}">${copy} <b>${count}</b></button>`).join('');
  const statusFilters = [
    ['all', 'Qualquer estado'],
    ['available', 'Alinhadas'],
    ['degraded', 'A sincronizar'],
    ['motor-only', 'Só no motor'],
  ].map(([value, copy]) => `<button type="button" class="skill-filter${state.skills.status === value ? ' active' : ''}" data-skill-status-filter="${value}">${copy}</button>`).join('');
  const linkFilters = [
    ['all', 'Todos os vínculos'], ['linked', 'Ligadas a Sistemas'], ['unlinked', 'Sem vínculo'],
  ].map(([value, copy]) => `<button type="button" class="skill-filter${state.skills.link === value ? ' active' : ''}" data-skill-link="${value}">${copy}</button>`).join('');
  const scopeNote = state.operatingAreaFilter
    ? `Skills atravessam áreas; o filtro ${operatingAreaName(state.operatingAreaFilter)} não esconde capacidades do Cérebro.`
    : 'Skills pertencem ao Cérebro inteiro; Sistemas apenas declaram quais delas consomem.';
  return `<div class="skills-hero">
      <div><p class="eyebrow">COMANDOS ESPECIALIZADOS</p><h2>Skills</h2><p>Instrumentos executáveis que Sistemas e agentes podem usar. Abra uma Skill para entender quando usar, onde está instalada e quais Sistemas a declaram.</p></div>
      <div class="skills-summary"><strong>${counts.company}</strong><span>nesta empresa</span><i></i><strong>${counts.available}</strong><span>alinhadas</span>${counts.degraded ? `<i></i><strong class="attention">${counts.degraded}</strong><span>a sincronizar</span>` : ''}</div>
    </div>
    <div class="skills-boundary"><span>${counts.unique} capacidades encontradas</span><small>${escapeHtml(scopeNote)}</small></div>
    <div class="skills-toolbar"><label><span>Buscar Skill</span><input type="search" data-skill-search value="${escapeHtml(state.skills.query)}" placeholder="Nome, tarefa ou Sistema" autocomplete="off"></label><div class="skill-filter-group" aria-label="Origem">${originFilters}</div><div class="skill-filter-group" aria-label="Saúde">${statusFilters}</div><div class="skill-filter-group" aria-label="Vínculo">${linkFilters}</div></div>
    <div class="skills-results"><span>${visible.length} visíveis</span><small>Detalhes técnicos aparecem ao abrir uma Skill.</small></div>
    <div class="skills-grid">${visible.map(skillCard).join('') || empty('Nenhuma Skill encontrada', 'Limpe a busca ou escolha outro filtro.')}</div>
    <section class="skill-executors-section"><div class="section-heading"><div><p class="eyebrow">EXECUÇÃO RELACIONADA</p><h2>Modelos não são Skills</h2></div><p>Bindings dizem onde uma capacidade pode executar. O modelo é declarado pelo provider; não representa qualidade ou produto instalado.</p></div><div class="skill-executors">${catalog.executors.map(executorCard).join('') || empty('Nenhum executor ligado', 'Skills continuam catalogadas, mas não há binding local de modelo.')}</div><div class="boundary-note"><b>Fronteira local</b>O Cockpit mostra adapter, política e autenticação. Credenciais, corpo da Skill, prompt e output não entram neste read model.</div></section>`;
}

function openSkill(skillId) {
  const skill = state.skills.data?.skills?.find((item) => item.skill_id === skillId);
  if (!skill) return;
  const systems = skillSystems(skill);
  const companyRuntime = skill.company
    ? skill.company.agent_runtime_present
      ? skill.company.agent_runtime_aligned ? 'Alinhado à fonte canônica' : 'Divergente da fonte canônica'
      : 'Runtime derivado ausente'
    : 'Não instalada nesta empresa';
  $('#drawer-content').innerHTML = `<div class="drawer-head"><p class="eyebrow">SKILL</p><h2>${escapeHtml(skillTitle(skill.name))}</h2>${skillStatusBadge(skill)}</div>
    <code class="skill-drawer-id">/${escapeHtml(skill.skill_id)}</code>
    <div class="boundary-note"><b>Capacidade, não aplicativo</b>Esta Skill encapsula julgamento executável. O resultado, os gates e a personalidade continuam pertencendo ao Sistema que a usa.</div>
    <section class="drawer-section"><h3>Quando usar</h3><p>${escapeHtml(skill.description)}</p></section>
    <section class="drawer-section"><h3>Instalação</h3><dl><div><dt>Origem</dt><dd>${escapeHtml(skillOriginLabel(skill))}</dd></div><div><dt>Fonte da empresa</dt><dd>${skill.company ? `<code>${escapeHtml(skill.company.canonical_ref)}</code>` : 'Não instalada'}</dd></div><div><dt>Runtime de agentes</dt><dd>${escapeHtml(companyRuntime)}</dd></div><div><dt>Pacote do motor</dt><dd>${skill.engine ? `<code>${escapeHtml(skill.engine.canonical_ref)}</code>` : 'Não publicada no motor'}</dd></div></dl></section>
    <section class="drawer-section"><h3>Sistemas que declaram · ${systems.length}</h3><div class="node-links">${systems.map((system) => entityLink('data-open-system', system.system_id, system.name, label(system.migration_stage), 'system')).join('') || '<p class="muted">Nenhum manifesto nomeia esta Skill. O Console não infere dependência pelo nome.</p>'}</div></section>
    <div class="boundary-note"><b>Reference-only</b>O corpo privado da Skill não é enviado ao navegador. Este inspetor recebe apenas metadata, estado dos runtimes e referências explícitas.</div>`;
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
}

async function loadSkills() {
  if (state.skills.loading) return;
  state.skills.loading = true;
  state.skills.error = null;
  try {
    state.skills.data = await getJson('/api/skills');
  } catch (error) {
    state.skills.error = error.message;
  } finally {
    state.skills.loading = false;
    if (state.view === 'skills') render();
    if (typeof palette !== 'undefined' && palette.open) paletteRender();
  }
}

function renderSources() {
  return `<div class="section-heading"><div><p class="eyebrow">CASAS DE VERDADE</p><h2>Fontes</h2></div><p>Mapear não é conectar. A garantia mostrada depende de quem realmente possui a custódia.</p></div><div class="object-grid">${visibleSources().map((source) => `<article class="object-card" data-kind="source" data-open-source="${escapeHtml(source.source_id)}" role="button" tabindex="0"><div class="object-card-top">${badge(source.status, source.status === 'active' ? 'good' : 'neutral')}${badge(source.assurance, source.assurance === 'runtime-enforced' ? 'good' : 'neutral')}</div><p class="micro">${escapeHtml(source.type)}</p><h3>${escapeHtml(source.name)}</h3><p>Custódia: ${escapeHtml(label(source.custody))} · PII: ${escapeHtml(label(source.pii))}</p><div class="ref-list">${source.modes.map((mode) => `<code>${escapeHtml(mode)}</code>`).join('')}</div></article>`).join('') || empty('Nenhuma Fonte contratada', 'Fontes aparecem sem abrir ou copiar o conteúdo original.')}</div>`;
}

function experimentProgress(experiment) {
  const states = experiment.status === 'decided'
    ? ['done', 'done', experiment.run_count ? 'done' : 'gap', 'done', 'done', experiment.learning_status === 'linked' ? 'done' : 'gap']
    : experiment.status === 'running'
      ? ['done', 'done', 'active', 'active', 'pending', 'pending']
      : experiment.status === 'ready-for-read'
        ? ['done', 'done', experiment.run_count ? 'done' : 'gap', 'done', 'active', 'pending']
        : experiment.status === 'cancelled'
          ? ['done', 'done', 'failed', 'failed', 'failed', 'muted']
          : ['done', 'done', 'pending', 'pending', 'pending', 'pending'];
  const labels = ['Hipótese', 'Contrato', 'Execução', 'Medição', 'Martelo', 'Aprendizado'];
  return `<div class="experiment-mini-flow" aria-label="Progresso do experimento">${labels.map((item, index) => `<span class="${states[index]}"><i></i><small>${item}</small></span>`).join('')}</div>`;
}

function renderExperiments() {
  const experiments = visibleExperiments();
  const running = experiments.filter((item) => item.status === 'running').length;
  const ready = experiments.filter((item) => item.status === 'ready-for-read').length;
  const decided = experiments.filter((item) => item.status === 'decided').length;
  const unlinked = experiments.filter((item) => item.learning_status === 'unlinked').length;
  return `<div class="section-heading"><div><p class="eyebrow">DECISÃO ANTES DO DADO</p><h2>Experimentos</h2></div><p>Uma mudança controlada atravessa Sistemas, Runs, medição e martelo. Contrato congelado não se edita depois do dado.</p></div>
    <div class="experiment-kpis"><span><b>${running}</b> coletando</span><span><b>${ready}</b> prontos para leitura</span><span><b>${decided}</b> decididos</span><span class="${unlinked ? 'attention' : ''}"><b>${unlinked}</b> aprendizados sem vínculo</span></div>
    <div class="experiment-grid">${experiments.map((experiment) => `<article class="experiment-card" data-open-experiment="${escapeHtml(experiment.experiment_id)}" role="button" tabindex="0">
      <div class="experiment-card-head"><div><p class="micro">${escapeHtml(experiment.experiment_id)} · ${escapeHtml(experiment.system_ref)}</p><h3>${escapeHtml(experiment.name)}</h3></div>${badge(experiment.status, experiment.status === 'decided' ? 'good' : experiment.status === 'running' ? 'neutral' : experiment.status === 'ready-for-read' ? 'warn' : tone(experiment.status))}</div>
      ${experimentProgress(experiment)}
      <div class="experiment-card-stats"><span><b>${experiment.arm_count || '—'}</b> braços${experiment.arms_status === 'not-structured' ? ' não estruturados' : ''}</span><span><b>${experiment.run_count}</b> Runs ligados</span><span><b>${experiment.amendment_count}</b> emendas</span>${experiment.contract_gap_count ? `<span class="warn-text"><b>${experiment.contract_gap_count}</b> lacunas legadas</span>` : ''}</div>
      <div class="experiment-card-footer"><div><span>Métrica primária</span><code>${escapeHtml(experiment.primary_metric_ref)}</code></div><button data-open-experiment="${escapeHtml(experiment.experiment_id)}">Abrir contrato <b>→</b></button></div>
    </article>`).join('') || empty('Nenhum Experimento contratado', 'Congele um pré-registro ou importe um ledger existente para criar o primeiro objeto.')}</div>
    <div class="boundary-note"><b>Experimento ≠ execução</b>Um experimento pode produzir vários briefings, criativos e Runs em mais de um Sistema. Cada Run se liga por entity_ref; sem essa referência, o Console mostra a lacuna.</div>`;
}

function allReceipts() {
  return visibleRoutines().flatMap((routine) => routine.receipts.map((receipt) => ({ ...receipt, routine_name: routine.name, routine_id: routine.routine_id }))).sort((a, b) => Date.parse(b.completed_at) - Date.parse(a.completed_at));
}

function allCanvasExecutions() {
  const receipts = allReceipts().map((receipt) => ({
    selector_ref: receipt.receipt_id,
    run_id: receipt.run_id,
    label: receipt.routine_name,
    completed_at: receipt.completed_at,
    mode: state.model.run_records?.find((record) => record.run_id === receipt.run_id)?.mode || null,
  }));
  const receivedRunIds = new Set(receipts.map((receipt) => receipt.run_id));
  const standalone = (state.model.run_records || []).filter((record) => !receivedRunIds.has(record.run_id) && inActiveOperatingArea(systemOperatingArea(record.system_ref))).map((record) => ({
    selector_ref: record.run_record_ref,
    run_id: record.run_id,
    label: `${label(record.system_ref)}${record.experiment_ref ? ` · ${record.experiment_ref}` : ''}`,
    completed_at: record.completed_at,
    mode: record.mode,
  }));
  return [...receipts, ...standalone].sort((left, right) => Date.parse(right.completed_at) - Date.parse(left.completed_at));
}

/* Runs Explorer — a linha do tempo única de TODAS as execuções: recibos de
   rotina + run records standalone do ledger, com a mesma gramática das outras
   superfícies (proveniência carimbada, lacuna visível, comparação A×B). */

async function loadRuns() {
  try {
    state.runs.data = await getJson('/api/runs');
  } catch (error) {
    state.runs.data = { error: error.message, runs: [] };
  }
  if (state.view === 'runs') render();
}

// Decisão humana resolvida: julgamento do recibo (quando existe) ganha do
// campo human_decision do Run Record — os dois são observados, o julgamento
// é o mais recente. Underscore do protocolo vira o mesmo vocabulário da casa.
function runDecision(entry) {
  if (entry.receipt_id) {
    const judgment = state.model.judgments.find((item) => item.receipt_id === entry.receipt_id)?.judgment;
    if (judgment && judgment.status !== 'unavailable') {
      return judgment.status === 'pending' ? 'pending' : (judgment.verdict || judgment.status);
    }
  }
  return entry.human_decision ? String(entry.human_decision).replaceAll('_', '-') : null;
}

function runsEntries() {
  return (state.runs.data?.runs || []).map((entry) => {
    const system = systemByRef(entry.system_ref);
    const routine = entry.routine_ref ? state.model.routines.find((item) => item.routine_id === entry.routine_ref) : null;
    return {
      ...entry,
      system,
      system_name: system?.name || entry.system_ref,
      operating_area: system?.operating_area || null,
      routine_name: routine?.name || entry.routine_ref,
      decision: runDecision(entry),
      when: entry.completed_at || entry.started_at || '',
    };
  });
}

function runsVisibleEntries() {
  const filters = state.runs.filters;
  const list = runsEntries().filter((entry) => inActiveOperatingArea(entry.operating_area)
    && (!filters.system || entry.system?.system_id === filters.system || entry.system_ref === filters.system)
    && (!filters.routine || entry.routine_ref === filters.routine || entry.routine_id === filters.routine)
    && (!filters.mode || (entry.mode || 'none') === filters.mode)
    && (!filters.status || entry.status === filters.status)
    && (!filters.decision || (entry.decision || 'none') === filters.decision)
    && (!filters.snapshot || (filters.snapshot === 'with' ? Boolean(entry.context) : !entry.context)));
  const { key, dir } = state.runs.sort;
  const value = (entry) => key === 'system' ? entry.system_name
    : key === 'mode' ? (entry.mode || '')
      : key === 'status' ? entry.status
        : key === 'decision' ? (entry.decision || '')
          : key === 'eval' ? String(entry.eval_passed ?? '')
            : entry.when;
  return list.sort((left, right) => {
    const order = String(value(left)).localeCompare(String(value(right)), 'pt-BR') * (dir === 'asc' ? 1 : -1);
    return order || String(right.when).localeCompare(String(left.when));
  });
}

function runsFilterBar(visible, total) {
  const filters = state.runs.filters;
  const entries = runsEntries().filter((entry) => inActiveOperatingArea(entry.operating_area));
  const options = (key, values, labelOf) => values.map((option) => `<option value="${escapeHtml(option)}"${filters[key] === option ? ' selected' : ''}>${escapeHtml(labelOf(option))}</option>`).join('');
  const distinct = (map) => [...new Set(entries.map(map).filter(Boolean))].sort();
  const systems = [...new Map(entries.filter((entry) => entry.system).map((entry) => [entry.system.system_id, entry.system_name])).entries()].sort((left, right) => left[1].localeCompare(right[1], 'pt-BR'));
  const active = Object.values(filters).some(Boolean);
  const routines = [...new Map(entries.filter((entry) => entry.routine_ref || entry.routine_id)
    .map((entry) => [entry.routine_ref || entry.routine_id, entry.routine_name || entry.routine_ref || entry.routine_id])).entries()]
    .sort((left, right) => String(left[1]).localeCompare(String(right[1]), 'pt-BR'));
  const routineCount = (id) => entries.filter((entry) => entry.routine_ref === id || entry.routine_id === id).length;
  return `<div class="runs-filterbar">
    <label>Sistema <select data-runs-filter="system"><option value="">todos</option>${systems.map(([id, name]) => `<option value="${escapeHtml(id)}"${filters.system === id ? ' selected' : ''}>${escapeHtml(name)}</option>`).join('')}</select></label>
    <label>Rotina <select data-runs-filter="routine"><option value="">todas</option>${routines.map(([id, name]) => `<option value="${escapeHtml(id)}"${filters.routine === id ? ' selected' : ''}>${escapeHtml(name)} (${routineCount(id)})</option>`).join('')}</select></label>
    <label>Modo <select data-runs-filter="mode"><option value="">todos</option>${options('mode', [...distinct((entry) => entry.mode), ...(entries.some((entry) => !entry.mode) ? ['none'] : [])], (option) => option === 'none' ? 'sem modo' : label(option))}</select></label>
    <label>Status <select data-runs-filter="status"><option value="">todos</option>${options('status', distinct((entry) => entry.status), label)}</select></label>
    <label>Decisão <select data-runs-filter="decision"><option value="">todas</option>${options('decision', [...distinct((entry) => entry.decision), ...(entries.some((entry) => !entry.decision) ? ['none'] : [])], (option) => option === 'none' ? 'sem decisão' : label(option))}</select></label>
    <label>Snapshot <select data-runs-filter="snapshot"><option value="">todos</option><option value="with"${filters.snapshot === 'with' ? ' selected' : ''}>com contexto</option><option value="without"${filters.snapshot === 'without' ? ' selected' : ''}>sem snapshot</option></select></label>
    <span class="runs-count muted">${visible} de ${total} execuções${state.operatingAreaFilter ? ` · ${escapeHtml(operatingAreaName(state.operatingAreaFilter))}` : ''}</span>
    ${active ? '<button type="button" class="table-action" data-runs-clear>limpar filtros</button>' : ''}
  </div>`;
}

function runsTraceBadge(entry) {
  const trace = entry.trace || { status: 'none', events: 0 };
  if (trace.status === 'recorded') return badge('recorded', 'good', `Trace V1 · ${trace.events} ev.`);
  if (trace.status === 'reconstructed') return badge('reconstructed', 'warn', `Reconstruído · ${trace.events} ev.`);
  if (trace.status === 'unreadable') return `<span title="O arquivo de trace existe, mas falha na validação do protocolo atual — o Canvas reconstrói a partir do recibo.">${badge('unreadable', 'bad', 'Trace ilegível')}</span>`;
  return '<span class="muted">sem trace</span>';
}

function runsOriginCell(entry) {
  const source = entry.origin === 'routine-receipt'
    ? `<strong>${escapeHtml(entry.routine_name || entry.routine_ref || '—')}</strong><small>rotina · ${escapeHtml(label(entry.trigger || '—'))}</small>`
    : `<strong>${escapeHtml(entry.experiment_ref || 'Run Record')}</strong><small>${entry.experiment_ref ? 'experimento · ' : ''}ledger direto</small>`;
  return source;
}

function runsContextCell(entry) {
  if (!entry.context) return badge('context-not-recorded', 'neutral');
  const gaps = entry.context.gaps + entry.context.conflicts;
  const core = `${entry.context.sources} fonte(s)${gaps ? ` · <span class="gap-mark">${gaps} lacuna(s)</span>` : ''}`;
  return entry.receipt_id
    ? `<button class="table-action" data-open-context="${escapeHtml(entry.receipt_id)}">${core} →</button>`
    : core;
}

function runsChainCell(entry) {
  if (!entry.chain_id) return '<span class="muted">—</span>';
  return `<code>${escapeHtml(entry.chain_id)}</code>${entry.handoff_count ? `<small>${entry.handoff_count} handoff(s)</small>` : ''}`;
}

function runsSameSystem(a, b) {
  return a.system && b.system ? a.system === b.system : a.system_ref === b.system_ref;
}

function runsCompareSlot(visible) {
  const a = visible.find((entry) => entry.selector_ref === state.runs.cmpA);
  const b = visible.find((entry) => entry.selector_ref === state.runs.cmpB);
  if (!a || !b) return '<p class="muted">Escolha duas execuções acima.</p>';
  if (a.selector_ref === b.selector_ref) return '<p class="muted">Escolha duas execuções diferentes.</p>';
  if (!runsSameSystem(a, b)) {
    return `<div class="experiment-gap">Runs de sistemas diferentes (${escapeHtml(a.system_name)} × ${escapeHtml(b.system_name)}) não são comparáveis — comparar exige o mesmo contrato de sistema.</div>`;
  }
  if (!a.record || !b.record) {
    return '<div class="experiment-gap">Uma das execuções não tem Run Record no ledger — sem base estruturada para comparar. O recibo da rotina continua auditável na tabela.</div>';
  }
  return runCompareTable(a.record, b.record);
}

function runsCompareSection(visible) {
  if (visible.length < 2) return '<p class="section-help">Comparação disponível a partir de duas execuções visíveis.</p>';
  const valid = new Set(visible.map((entry) => entry.selector_ref));
  if (!valid.has(state.runs.cmpA) || !valid.has(state.runs.cmpB) || state.runs.cmpA === state.runs.cmpB) {
    // Default honesto: o par comparável mais recente (mesmo sistema, com record).
    const pair = visible.find((entry, index) => entry.record
      && visible.slice(index + 1).some((other) => other.record && runsSameSystem(other, entry)));
    const partner = pair ? visible.find((other) => other !== pair && other.record && runsSameSystem(other, pair)) : null;
    state.runs.cmpB = (pair || visible[0]).selector_ref;
    state.runs.cmpA = (partner || visible[1]).selector_ref;
  }
  const optionsFor = (selected) => visible.map((entry) => `<option value="${escapeHtml(entry.selector_ref)}"${entry.selector_ref === selected ? ' selected' : ''}>${escapeHtml(entry.system_name)} · ${fmtDate(entry.when)} · ${escapeHtml(entry.mode ? label(entry.mode) : label(entry.origin === 'routine-receipt' ? 'routine' : 'run'))}</option>`).join('');
  return `<section class="organ"><header class="organ-head"><div><h3>O que mudou entre duas runs</h3><p>comparável = mesmo sistema, com Run Record no ledger</p></div></header>
    <div class="ws-compare-pick"><label>A <select id="runs-cmp-a">${optionsFor(state.runs.cmpA)}</select></label>
    <label>B <select id="runs-cmp-b">${optionsFor(state.runs.cmpB)}</select></label></div>
    <div id="runs-compare">${runsCompareSlot(visible)}</div></section>`;
}

function runsKpis(visible) {
  const sevenDays = Date.now() - 7 * 86400000;
  const week = visible.filter((entry) => Date.parse(entry.when) >= sevenDays).length;
  const withContext = visible.filter((entry) => entry.context).length;
  const recorded = visible.filter((entry) => entry.trace?.status === 'recorded').length;
  const reconstructed = visible.filter((entry) => entry.trace?.status === 'reconstructed').length;
  const noTrace = visible.length - recorded - reconstructed;
  const evalFailed = visible.filter((entry) => entry.eval_passed === false).length;
  const rejected = visible.filter((entry) => ['rejected', 'changes-requested'].includes(entry.decision)).length;
  const pending = visible.filter((entry) => entry.decision === 'pending').length;
  return `<div class="experiment-kpis">
    <span><b>${visible.length}</b> execuções · ${week} nos últimos 7d</span>
    <span><b>${withContext}</b> com contexto registrado · ${visible.length - withContext} sem snapshot</span>
    <span><b>${recorded}</b> trace V1 · ${reconstructed} reconstruído(s) · ${noTrace} sem trace</span>
    <span class="${evalFailed ? 'attention' : ''}"><b>${evalFailed}</b> eval falhou</span>
    <span class="${rejected ? 'attention' : ''}"><b>${rejected}</b> rejeitada(s)/ajuste · ${pending} pendente(s) de martelo</span>
  </div>`;
}

function renderRuns() {
  if (!state.runs.data) {
    void loadRuns();
    return '<div class="loading"><i></i><span>Unificando recibos e ledger de runs…</span></div>';
  }
  if (state.runs.data.error) return empty('Execuções indisponíveis', label(state.runs.data.error));
  const total = runsEntries().filter((entry) => inActiveOperatingArea(entry.operating_area)).length;
  const visible = runsVisibleEntries();
  const issues = (state.runs.data.issues || []).map((issue) => `<div class="experiment-gap">${escapeHtml(label(issue.reason_code))} · <code>${escapeHtml(issue.ref)}</code></div>`).join('');
  const sortMark = (key) => state.runs.sort.key === key ? `<b>${state.runs.sort.dir === 'asc' ? '↑' : '↓'}</b>` : '';
  const rows = visible.map((entry) => `<tr>
    <td><strong>${fmtDate(entry.when)}</strong><small title="${escapeHtml(entry.run_id)}">${escapeHtml(entry.run_id.length > 22 ? `${entry.run_id.slice(0, 22)}…` : entry.run_id)}</small></td>
    <td><button type="button" class="table-action" data-open-system="${escapeHtml(entry.system?.system_id || entry.system_ref)}">${escapeHtml(entry.system_name)}</button><small>${entry.system_version ? `v${escapeHtml(entry.system_version)}` : 'versão não registrada'}</small></td>
    <td>${runsOriginCell(entry)}</td>
    <td>${entry.mode ? badge(entry.mode, entry.mode === 'live' ? 'good' : 'neutral') : '<span class="muted">—</span>'}</td>
    <td>${badge(entry.status)}</td>
    <td>${runsContextCell(entry)}</td>
    <td>${entry.eval_passed === true ? badge('evaluation-passed', 'good') : entry.eval_passed === false ? badge('evaluation-gate-failed', 'bad') : '<span class="muted">—</span>'}</td>
    <td>${entry.decision ? badge(entry.decision) : '<span class="muted">—</span>'}</td>
    <td>${runsChainCell(entry)}</td>
    <td>${runsTraceBadge(entry)}<button class="table-action" data-canvas-jump-run="${escapeHtml(entry.selector_ref)}">trace →</button></td>
  </tr>`).join('');
  return `<div class="section-heading"><div><p class="eyebrow">RASTRO</p><h2>Execuções</h2></div><p>Recibos de rotina e Run Records do ledger na mesma linha do tempo. Tudo reference-only ${prov('observado')} — o conteúdo continua privado.</p></div>
    ${issues}
    ${runsKpis(visible)}
    ${runsFilterBar(visible.length, total)}
    <div class="table-wrap runs-table"><table><thead><tr>
      <th data-runs-sort="when">Quando${sortMark('when')}</th>
      <th data-runs-sort="system">Sistema${sortMark('system')}</th>
      <th>Rotina / experimento</th>
      <th data-runs-sort="mode">Modo${sortMark('mode')}</th>
      <th data-runs-sort="status">Status${sortMark('status')}</th>
      <th>Contexto</th>
      <th data-runs-sort="eval">Eval${sortMark('eval')}</th>
      <th data-runs-sort="decision">Decisão${sortMark('decision')}</th>
      <th>Cadeia</th>
      <th>Trace</th>
    </tr></thead><tbody>${rows || `<tr><td colspan="10">${total ? 'Nenhuma execução passa nos filtros atuais.' : 'Nenhuma execução registrada ainda — recibo ou Run Record aparecem aqui.'}</td></tr>`}</tbody></table></div>
    ${runsCompareSection(visible)}`;
}

function renderGovernance() {
  const grants = state.model.routines.flatMap((routine) => routine.access.map((access) => ({ ...access, routine })));
  return `<div class="section-heading"><div><p class="eyebrow">AUTORIDADE</p><h2>Governança de acesso</h2></div><p>Revogação bloqueia Runs futuros. Ela não apaga um contexto já consumido.</p></div><div class="object-grid">${grants.map(({ routine, ...access }) => {
    const grantId = access.grant_ref.replace(/^access-grant:/, '');
    const revoke = access.grant_status === 'granted' && access.revocation_effect === 'future-only'
      ? `<button class="secondary-action" data-revoke-grant="${escapeHtml(grantId)}">Revogar acesso futuro</button>` : '';
    return `<article class="object-card" data-kind="grant"><div class="object-card-top">${badge(access.grant_status, access.grant_status === 'granted' ? 'good' : 'bad')}${badge(access.assurance, access.assurance === 'runtime-enforced' ? 'good' : 'neutral')}</div><p class="micro">${escapeHtml(routine.name)}</p><h3>${escapeHtml(access.source_ref)}</h3><p>${escapeHtml(access.action)} · ${escapeHtml(access.requested_mode)}</p><div class="boundary-note"><b>Revogação</b>${escapeHtml(label(access.revocation_effect))}</div>${revoke}</article>`;
  }).join('') || empty('Nenhuma concessão declarada', 'A rotina pode existir sem grant quando trabalha apenas com instrução local.')}</div>`;
}

function renderHealth() {
  const rows = state.model.routines.map((routine) => ({ name: routine.name, reason: routine.health_reason_code, binding: routine.binding.auth_status }));
  return `<div class="section-heading"><div><p class="eyebrow">READBACK</p><h2>Saúde operacional</h2></div><p>Estado derivado de arquivos canônicos, nunca de um painel editorial paralelo.</p></div><div class="health-list">${rows.map((row) => `<article><span class="health-dot ${tone(row.reason)}"></span><div><h3>${escapeHtml(row.name)}</h3><p>${escapeHtml(label(row.reason))}</p></div><code>${escapeHtml(row.binding)}</code></article>`).join('')}${state.model.issues.map((issue) => `<article><span class="health-dot bad"></span><div><h3>${escapeHtml(label(issue.reason_code))}</h3><p>${escapeHtml(issue.ref)}</p></div></article>`).join('')}</div><div class="cache-note"><strong>Índice reconstruível</strong><p>Este V0 não mantém banco nem cache persistente. Cada atualização recompila contratos, bindings, estado e recibos locais.</p></div>`;
}

function renderSociety() {
  const catalog = state.society.data;
  if (!catalog) {
    if (state.society.error) return empty('Society indisponível', 'O catálogo local não pôde ser compilado. Atualize o Cockpit para tentar novamente.');
    if (!state.society.loading) void loadSociety();
    return '<div class="loading"><i></i><span>Compilando o catálogo local da Society…</span></div>';
  }
  if (state.society.selected) {
    const selected = catalog.systems.find((system) => system.system_id === state.society.selected);
    if (selected) return renderSocietyDetail(selected);
    state.society.selected = null;
  }
  return renderSocietyCatalog(catalog);
}

function societyStatus(system) {
  if (system.availability === 'validated') return badge('validated', 'good', 'Validado na rede');
  return badge('validation', 'warn', 'Acesso Society · em validação');
}

function societyPublisher(system) {
  return system.experience?.publisher?.display_name || 'Publisher não publicado';
}

function societyValidationProgress(system) {
  if (system.availability !== 'validation') return '';
  const validation = system.validation;
  return `<div class="society-proof-mini"><span><b>${validation.verified_real_cycles}/${validation.required_real_cycles}</b> ciclos reais</span><span><b>${validation.verified_distinct_member_brains}/${validation.required_distinct_member_brains}</b> Cérebros</span></div>`;
}

function societyCard(system) {
  const compatibility = system.compatibility;
  const compatibilityCopy = compatibility ? societyCompatibilityCopy(compatibility.status) : null;
  return `<article class="society-card">
    <div class="society-card-top">${systemIdentity(system)}${societyStatus(system)}</div>
    <div class="society-card-meta"><span>${escapeHtml(system.release.channel)}</span><code>v${escapeHtml(system.release.version)}</code></div>
    <h3>${escapeHtml(system.name)}</h3>
    <p>${escapeHtml(system.result)}</p>
    <div class="society-publisher"><span aria-hidden="true">◎</span><div><small>Publicado por</small><b>${escapeHtml(societyPublisher(system))}</b></div></div>
    ${societyValidationProgress(system)}
    ${compatibilityCopy ? `<div class="society-compatibility-mini"><span class="${escapeHtml(compatibilityCopy.tone)}"></span><b>${escapeHtml(compatibilityCopy.label)}</b><small>${compatibility.counts.ready_roles}/${compatibility.counts.required_roles} papéis prontos</small></div>` : ''}
    <button type="button" class="society-card-action" data-society-open="${escapeHtml(system.system_id)}">Ver compatibilidade <span aria-hidden="true">→</span></button>
  </article>`;
}

function renderSocietyCatalog(catalog) {
  const query = state.society.query.trim().toLocaleLowerCase('pt-BR');
  const visible = catalog.systems.filter((system) => {
    const filterMatch = state.society.filter === 'all' || system.availability === state.society.filter;
    const haystack = `${system.name} ${system.result} ${system.setpoint} ${societyPublisher(system)}`.toLocaleLowerCase('pt-BR');
    return filterMatch && (!query || haystack.includes(query));
  });
  const filters = [
    ['all', 'Todos', catalog.counts.visible],
    ['validated', 'Validados', catalog.counts.validated],
    ['validation', 'Em validação', catalog.counts.validation],
  ].map(([value, copy, count]) => `<button type="button" class="society-filter${state.society.filter === value ? ' active' : ''}" data-society-filter="${value}">${copy} <b>${count}</b></button>`).join('');
  return `<section class="society-catalog">
    <header class="society-hero"><div><p class="eyebrow">ACERVO EXCLUSIVO DA REDE</p><h2>Society</h2><p>Membros têm acesso aos Sistemas e capacidades que a INEVITA usa de verdade. Você implanta no seu Cérebro, usa no trabalho real e ajuda a validar o que entra na rede.</p></div><div class="society-counts"><span><b>${catalog.counts.validated}</b><small>validados</small></span><span><b>${catalog.counts.validation}</b><small>com acesso antecipado</small></span></div></header>
    <div class="society-boundary"><span>Circula</span><b>Protocolo · Capability · versão · prova agregada</b><span>Permanece local</span><b>Fontes · contexto · outputs · decisões</b></div>
    <div class="society-toolbar"><label><span>Buscar no acervo</span><input type="search" data-society-search value="${escapeHtml(state.society.query)}" placeholder="Resultado, nome ou publisher" autocomplete="off"></label><div class="society-filters" aria-label="Estado de publicação">${filters}</div></div>
    <div class="society-results"><span>${visible.length} ${visible.length === 1 ? 'capacidade disponível' : 'capacidades disponíveis'}</span><small>O catálogo é local; instalar nunca envia seu contexto para a Society.</small></div>
    <div class="society-catalog-grid">${visible.map(societyCard).join('') || empty('Nenhum Sistema neste recorte', 'Altere a busca ou escolha outro estado de publicação.')}</div>
  </section>`;
}

function societyRequirementList(system) {
  const compatibilityByRole = new Map((system.compatibility?.roles || []).map((role) => [role.role, role]));
  const sources = system.requirements.source_roles.map((source) => {
    const role = compatibilityByRole.get(source.role);
    const stateCopy = role ? societyCompatibilityCopy(role.status).label : 'Não verificado';
    const binding = role?.current_binding?.source?.name;
    const viable = role?.candidates?.filter((candidate) => candidate.compatibility === 'semantic-approval-required') || [];
    const detail = binding || (viable.length ? `${viable.length} candidata(s) mecânica(s)` : source.examples.join(' ou '));
    return `<li><span>Fonte</span><b>${escapeHtml(source.label)}</b><small>${source.required ? 'Obrigatória' : 'Opcional'} · ${escapeHtml(stateCopy)} · ${escapeHtml(detail)}</small></li>`;
  }).join('');
  return `${sources}<li><span>Evento real</span><b>${escapeHtml(system.requirements.real_event)}</b><small>O primeiro valor precisa acontecer no trabalho real.</small></li><li><span>Company Brain</span><b>v${escapeHtml(system.release.minimum_brain_version)} ou superior</b><small>Compatibilidade mínima publicada pelo pacote.</small></li>`;
}

function societyCompatibilityCopy(status) {
  return {
    ready: { label: 'Pronto', tone: 'good', detail: 'Papéis aprovados e grants ativos.' },
    'not-required': { label: 'Pronto', tone: 'good', detail: 'Este Sistema não exige Fontes.' },
    'needs-mapping': { label: 'Mapeamento necessário', tone: 'warn', detail: 'Há candidatas locais; o dono ainda precisa confirmar a semântica.' },
    'awaiting-approval': { label: 'Aguardando aprovação', tone: 'warn', detail: 'O vínculo foi proposto, mas binding e grant ainda não estão aprovados.' },
    'missing-source': { label: 'Fonte ausente', tone: 'bad', detail: 'Ao menos um papel obrigatório não tem candidata mecânica local.' },
    incompatible: { label: 'Vínculo incompatível', tone: 'bad', detail: 'Um binding atual é ambíguo, inválido, revogado ou expirou.' },
    degraded: { label: 'Vínculo degradado', tone: 'warn', detail: 'A Fonte existe, mas o vínculo precisa ser revisto.' },
  }[status] || { label: 'Não verificado', tone: 'neutral', detail: 'O pacote precisa publicar um System Contract compatível.' };
}

function societyCompatibilityPanel(system) {
  const compatibility = system.compatibility;
  if (!compatibility) {
    return `<section class="society-compatibility"><p class="eyebrow">COMPATIBILIDADE LOCAL</p><h3>Contrato insuficiente</h3><p>Este pacote precisa publicar o System Contract antes de comparar Fontes.</p></section>`;
  }
  const copy = societyCompatibilityCopy(compatibility.status);
  const roles = compatibility.roles.map((role) => {
    const roleCopy = societyCompatibilityCopy(role.status);
    const current = role.current_binding?.source?.name || null;
    const viable = role.candidates.filter((candidate) => candidate.compatibility === 'semantic-approval-required');
    const sourceLine = current ? `Vinculada a ${current}`
      : viable.length ? `Candidatas: ${viable.slice(0, 3).map((candidate) => candidate.name).join(' · ')}${viable.length > 3 ? ` · +${viable.length - 3}` : ''}; sem aprovação semântica`
        : 'Nenhuma Fonte local atende aos checks mecânicos';
    return `<li><span class="compatibility-dot ${escapeHtml(roleCopy.tone)}"></span><div><b>${escapeHtml(role.role)}</b><small>${escapeHtml(sourceLine)}</small></div><em>${escapeHtml(roleCopy.label)}</em></li>`;
  }).join('');
  return `<section class="society-compatibility" data-compatibility-status="${escapeHtml(compatibility.status)}">
    <p class="eyebrow">COMPATIBILIDADE LOCAL</p>
    <div class="society-compatibility-head"><h3>${escapeHtml(copy.label)}</h3><span class="compatibility-dot ${escapeHtml(copy.tone)}"></span></div>
    <p>${escapeHtml(copy.detail)}</p>
    <ul>${roles}</ul>
    <div class="society-agent-command"><span>Codex / Claude Code</span><code>${escapeHtml(compatibility.agent_command)}</code><button type="button" data-society-copy-command="${escapeHtml(compatibility.agent_command)}">Copiar comando</button></div>
    <small>O plano lê somente contratos e referências locais; conteúdo e credenciais não entram no diagnóstico. Conector ativo sem Source Contract ainda conta como Fonte ausente.</small>
  </section>`;
}

function societyInstallPanel(system) {
  const compatibility = system.compatibility;
  if (!compatibility) {
    return `<div class="society-install-state"><button type="button" disabled>Verificação indisponível</button><p>Atualize o contrato do pacote antes de instalar.</p></div>`;
  }
  if (!compatibility.activation_ready) {
    const copy = societyCompatibilityCopy(compatibility.status);
    return `<div class="society-install-state"><button type="button" data-society-copy-command="${escapeHtml(compatibility.agent_command)}">Resolver com o agente</button><p>${escapeHtml(copy.detail)} O pacote ainda não será ativado.</p></div>`;
  }
  if (system.installation_status === 'installed') {
    return `<div class="society-install-state is-installed"><span>Pronto para o primeiro run</span><b>Fontes aprovadas; o output real ainda precisa do julgamento da pessoa.</b></div>`;
  }
  if (system.install_action === 'approval-required') {
    return `<div class="society-install-state"><button type="button" disabled>Acesso Society</button><p>Compatibilidade local confirmada. Membros podem implantar este piloto com acompanhamento da INEVITA.</p></div>`;
  }
  return `<div class="society-install-state"><button type="button" disabled>Pronto para instalar</button><p>A compatibilidade passou; a mutação de instalação continua no agente local com confirmação explícita.</p></div>`;
}

function renderSocietyDetail(system) {
  const validation = system.validation;
  const publisher = system.experience?.publisher;
  return `<section class="society-detail">
    <button type="button" class="society-back" data-society-back>← Voltar ao catálogo</button>
    <header class="society-detail-hero"><div class="society-detail-identity">${systemIdentity(system, 'large')}<div><p class="micro">${escapeHtml(system.release.channel)} · v${escapeHtml(system.release.version)}</p><h2>${escapeHtml(system.name)}</h2><p>${escapeHtml(system.result)}</p></div></div><div class="society-detail-state">${societyStatus(system)}<span>${escapeHtml(system.installation_status === 'installed' ? 'Instalado neste Cérebro' : 'Não instalado')}</span></div></header>
    <div class="society-detail-layout"><main>
      <section class="society-detail-section"><p class="eyebrow">PROMESSA CONTRATADA</p><h3>O que muda no trabalho</h3><dl><div><dt>Resultado</dt><dd>${escapeHtml(system.result)}</dd></div><div><dt>Primeiro valor</dt><dd>${escapeHtml(system.first_value)}</dd></div><div><dt>Régua</dt><dd>${escapeHtml(system.setpoint)}</dd></div></dl></section>
      ${societyCompatibilityPanel(system)}
      <section class="society-detail-section"><p class="eyebrow">ANTES DE INSTALAR</p><h3>O que este Sistema precisa</h3><ul class="society-requirements">${societyRequirementList(system)}</ul></section>
      <section class="society-detail-section"><p class="eyebrow">AUTORIDADE E PRIVACIDADE</p><h3>O que ele pode fazer</h3><div class="society-permissions"><span><i>${system.privacy.connects_sources_automatically ? '×' : '✓'}</i>Não conecta Fontes sozinho</span><span><i>${system.privacy.writes_external_systems_automatically ? '×' : '✓'}</i>Não escreve no CRM sozinho</span><span><i>${system.privacy.requires_source_by_source_consent ? '✓' : '×'}</i>Consentimento Fonte a Fonte</span><span><i>${system.requirements.human_approval_before_external_write ? '✓' : '×'}</i>Aprovação humana antes de escrever fora</span></div></section>
    </main><aside>
      ${societyInstallPanel(system)}
      <section class="society-proof"><p class="eyebrow">PROVA DA REDE</p><h3>${system.availability === 'validated' ? 'Validação concluída' : 'Ainda em validação'}</h3><div><span><b>${validation.verified_real_cycles}</b><small>de ${validation.required_real_cycles} ciclos reais</small></span><span><b>${validation.verified_distinct_member_brains}</b><small>de ${validation.required_distinct_member_brains} Cérebros</small></span></div><ul><li class="${validation.requires_eval_pass ? '' : 'muted'}">Eval precisa passar</li><li class="${validation.requires_repeat_use ? '' : 'muted'}">Uso repetido é obrigatório</li><li class="${validation.requires_human_approval ? '' : 'muted'}">Julgamento humano é obrigatório</li></ul></section>
      <section class="society-publisher-card"><p class="eyebrow">PUBLICAÇÃO</p><h3>${escapeHtml(publisher?.display_name || 'Publisher não publicado')}</h3><p>${publisher ? `Identidade declarada por ${escapeHtml(publisherKindLabel(publisher.kind))} no Experience Manifest.` : 'O pacote ainda não publicou um Experience Manifest. O Cockpit usa uma identidade neutra e não inventa autoria.'}</p><code>${escapeHtml(system.package_ref)}</code></section>
    </aside></div>
    <div class="boundary-note"><b>Catálogo ≠ Cérebro compartilhado</b>A Society distribui contratos, capacidade e atualizações. Seu contexto, outputs e julgamentos permanecem nesta empresa.</div>
  </section>`;
}

async function loadSociety() {
  if (state.society.loading) return;
  state.society.loading = true;
  state.society.error = null;
  try {
    state.society.data = await getJson('/api/society');
  } catch (error) {
    state.society.error = error.message;
  } finally {
    state.society.loading = false;
    if (state.view === 'society') render();
    if (typeof palette !== 'undefined' && palette.open) paletteRender();
  }
}

/* --- Decision Case: o Console prepara o caso, o humano dá o martelo ---
   Nenhum botão desta view decide sozinho. Preparar e simular não escrevem nada;
   aplicar exige o digest do diff que a pessoa acabou de ler; reverter guarda cópia
   privada e para se alguém editou a nota depois do martelo. */

const CASE_VERDICTS = [
  ['decided', 'Decidido', 'Vale a partir do registro.'],
  ['dropped', 'Descartado', 'O item morre e não volta sem caso novo.'],
  ['deferred', 'Adiado', 'Com data explícita de revisão — sem terceira opção silenciosa.'],
];
const CASE_ROLLBACK_REASONS = [
  ['wrong-verdict', 'Veredito errado'],
  ['wrong-evidence', 'Evidência errada'],
  ['duplicate', 'Duplicado'],
  ['superseded', 'Superado por decisão nova'],
  ['mistake', 'Registro por engano'],
];

function emptyCaseForm() {
  return { verdict: 'decided', theme: 'metodo', review_on: '', title: '', decision_text: '', evidence: [], authored: false };
}

function caseProvenance(provenance) {
  const map = { observed: ['observado', 'good'], declared: ['declarado', 'neutral'], inferred: ['inferido', 'warn'] };
  const [text, kind] = map[provenance] || [provenance, 'neutral'];
  return `<span class="badge ${kind}"><i></i>${escapeHtml(text)}</span>`;
}

function caseStateBadge(state) {
  if (state.status === 'applied') return badge('applied', 'good', 'Registrado no vault');
  if (state.status === 'rolled-back') return badge('rolled-back', 'warn', 'Revertido');
  return badge('pending', 'warn', 'Espera martelo');
}

function caseDiffBlock(diff) {
  return `<pre class="case-diff">${diff.split('\n').map((line) => {
    const kind = line.startsWith('+++') || line.startsWith('---') ? 'meta'
      : line.startsWith('@@') ? 'hunk'
        : line.startsWith('+') ? 'add' : line.startsWith('-') ? 'del' : 'ctx';
    return `<span class="${kind}">${escapeHtml(line) || '&nbsp;'}</span>`;
  }).join('\n')}</pre>`;
}

function caseHistory(state) {
  if (!state.history.length) return '';
  return `<section class="drawer-section"><h3>Histórico do caso</h3><div class="ref-list vertical">${state.history.map((event) => `<div class="case-event">${badge(event.event, event.event === 'applied' ? 'good' : 'warn', event.event === 'applied' ? 'Registrado' : 'Revertido')}<span>${fmtDate(event.recorded_at)} · <code>${escapeHtml(event.actor_ref)}</code>${event.reason_code ? ` · ${escapeHtml(label(event.reason_code))}` : ''}</span><code>${escapeHtml(event.event_ref)}</code></div>`).join('')}</div></section>`;
}

function caseList() {
  const data = state.cases.list;
  if (!data) return '<p class="muted">Carregando a fila de casos…</p>';
  if (!data.available) {
    return empty('Fila de decisão indisponível', 'O motor do vault (gera_fila_decisao.py) ainda não materializou `.automacao/_FILA-DECISAO.json`. O Console mostra a verdade; não inventa fila.');
  }
  if (!data.cases.length) return empty('Nenhum item espera martelo', 'Fila vazia — nada para decidir agora.');
  const rows = data.cases.map((item) => `<article class="case-row" data-case-open="${escapeHtml(item.case_id)}" role="button" tabindex="0">
      <div class="case-row-top">${caseStateBadge(item.state)}<span class="decision-age${item.age_days >= 30 ? ' overdue' : item.age_days >= 7 ? ' late' : ''}">${item.age_days}d</span></div>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="micro">${escapeHtml(decisionCategory(item.category))} · na fila desde ${escapeHtml(item.first_seen)}</p>
      ${item.state.canonical_path ? `<code>${escapeHtml(item.state.canonical_path)}</code>` : ''}
    </article>`).join('');
  return `<div class="case-kpis">
      <div><b>${data.open_count}</b><span>abertos</span></div>
      <div><b>${data.applied_count}</b><span>com martelo registrado</span></div>
      <div><b>${data.decided_total}</b><span>já saíram da fila</span></div>
      <div><b>${data.house_ready ? 'pronta' : 'ausente'}</b><span>casa canônica</span></div>
    </div>
    <div class="case-grid">${rows}</div>
    <div class="boundary-note"><b>O Console não decide</b>Ele reúne o item, resolve a evidência e mostra o diff exato. A decisão é sua, o texto é seu, e o registro só acontece depois de você confirmar o diff que leu.</div>`;
}

function caseEvidenceRow(entry, checked) {
  return `<label class="case-evidence">
    <input type="checkbox" data-case-field="evidence" value="${escapeHtml(entry.ref)}"${checked ? ' checked' : ''}>
    <span class="case-evidence-body">
      <code>${escapeHtml(entry.ref)}</code>
      <small>${escapeHtml(entry.summary)}${entry.path ? ` · <code>${escapeHtml(entry.path)}</code>` : ''}</small>
    </span>
    ${caseProvenance(entry.provenance)}
  </label>`;
}

function casePreviewBlock() {
  const preview = state.cases.preview;
  if (!preview) {
    return `<div class="boundary-note"><b>Nada foi escrito ainda</b>Simular monta a nota inteira e devolve o diff. Enquanto você não confirmar esse diff, o vault não é tocado.</div>`;
  }
  return `<section class="case-preview">
    <div class="subheading"><h3>Diff exato · o que vai para o vault</h3><span>${preview.canonical_write.bytes} bytes</span></div>
    <p class="case-path"><span>arquivo novo</span><code>${escapeHtml(preview.canonical_write.path)}</code></p>
    ${caseDiffBlock(preview.diff)}
    <div class="case-preview-meta">
      <span>plano <code>${escapeHtml(preview.plan_digest.slice(0, 19))}…</code></span>
      <span>vale até ${fmtDate(preview.expires_at)}</span>
      <span>${preview.evidence.length} evidência(s)</span>
    </div>
    <div class="case-actions">
      <button class="action primary" data-case-apply>Confirmar este diff e registrar</button>
      <button class="action" data-case-discard>Descartar simulação</button>
    </div>
    <div class="boundary-note"><b>Confirmação é do diff, não do botão</b>Registrar exige o digest deste plano. Se você mudar qualquer campo, esta simulação morre e é preciso simular de novo — o que se escreve é byte a byte o que está acima.</div>
  </section>`;
}

function caseAppliedBlock(detail) {
  const { state: caseState } = detail;
  const path = caseState.canonical_path;
  return `<section class="case-preview applied">
    <div class="subheading"><h3>Martelo registrado</h3><span>${escapeHtml(caseState.last_event.actor_ref)}</span></div>
    <p class="case-path"><span>fonte canônica</span><code>${escapeHtml(path)}</code></p>
    <div class="case-preview-meta">
      <span>${fmtDate(caseState.last_event.recorded_at)}</span>
      <span>veredito ${escapeHtml(label(caseState.last_event.verdict))}</span>
      <span>recibo <code>${escapeHtml(caseState.applied_ref)}</code></span>
    </div>
    <div class="case-actions">
      <label class="case-inline-field"><span>Motivo da reversão</span><select data-case-field="rollback_reason">${CASE_ROLLBACK_REASONS.map(([value, text]) => `<option value="${value}">${escapeHtml(text)}</option>`).join('')}</select></label>
      <button class="action danger" data-case-rollback>Reverter registro</button>
    </div>
    <div class="boundary-note"><b>Reverter apaga o registro, não o efeito</b>A nota sai do vault, uma cópia privada fica em <code>.cerebro/runtime/decisions/</code> e um recibo de reversão entra no histórico. O que a decisão causou fora do cérebro continua valendo.</div>
  </section>`;
}

function caseForm(detail) {
  const form = state.cases.form;
  const selected = new Set(form.evidence);
  const candidates = detail.evidence_candidates;
  return `<section class="case-form">
    <div class="subheading"><h3>Seu martelo</h3><span>autoria humana obrigatória</span></div>
    <div class="case-verdicts">${CASE_VERDICTS.map(([value, text, hint]) => `<button class="case-verdict${form.verdict === value ? ' active' : ''}" data-case-verdict="${value}"><b>${escapeHtml(text)}</b><small>${escapeHtml(hint)}</small></button>`).join('')}</div>
    ${form.verdict === 'deferred' ? `<label class="case-field"><span>Revisar em (data explícita, obrigatória)</span><input type="date" data-case-field="review_on" value="${escapeHtml(form.review_on)}"></label>` : ''}
    <label class="case-field"><span>Título da decisão · vira o nome do arquivo</span><input type="text" data-case-field="title" maxlength="120" value="${escapeHtml(form.title)}" placeholder="O que ficou decidido, em uma linha"></label>
    <label class="case-field"><span>Tema</span><select data-case-field="theme">${detail.canonical.themes.map((theme) => `<option value="${escapeHtml(theme)}"${form.theme === theme ? ' selected' : ''}>${escapeHtml(theme)}</option>`).join('')}</select></label>
    <label class="case-field"><span>A decisão, nas suas palavras · verbatim, mínimo ${detail.draft.min_chars} caracteres</span><textarea data-case-field="decision_text" rows="7" maxlength="${detail.draft.max_chars}" placeholder="${escapeHtml(detail.draft.hint)}">${escapeHtml(form.decision_text)}</textarea></label>
    <p class="case-counter">${form.decision_text.trim().length}/${detail.draft.max_chars} · o Console não escreve esta parte por você</p>
    <div class="subheading"><h3>Evidência</h3><span>${selected.size} escolhida(s)</span></div>
    <div class="case-evidence-list">${candidates.length ? candidates.map((entry) => caseEvidenceRow(entry, selected.has(entry.ref))).join('') : '<p class="muted">Nenhum candidato resolvível neste cérebro.</p>'}</div>
    <p class="case-hint">Referência que não abre no disco derruba o caso. O item da fila sozinho não basta: escolha pelo menos uma evidência além dele.</p>
    <label class="case-authorship">
      <input type="checkbox" data-case-field="authored"${form.authored ? ' checked' : ''}>
      <span><b>Este texto é meu.</b> Eu li a evidência e escrevi a decisão acima com as minhas palavras — não é rascunho de IA colado. O Console local não verifica identidade; esta declaração assina o recibo junto com a referência de quem aprova.</span>
    </label>
    <div class="case-actions">
      <button class="action primary" data-case-preview>Simular e ver o diff</button>
      <button class="action" data-case-back>Voltar para a fila</button>
    </div>
  </section>`;
}

function caseDetail() {
  const detail = state.cases.detail;
  if (!detail) return '<p class="muted">Abrindo o caso…</p>';
  const applied = detail.state.status === 'applied';
  return `<div class="case-detail">
    <div class="case-detail-head">
      <button class="action" data-case-back>← Fila de casos</button>
      ${caseStateBadge(detail.state)}
      <code>${escapeHtml(detail.case_ref)}</code>
    </div>
    <article class="case-item">
      <p class="micro">${escapeHtml(decisionCategory(detail.item.category))} · na fila desde ${escapeHtml(detail.item.first_seen)} (${detail.item.age_days}d)</p>
      <h2>${escapeHtml(detail.item.title)}</h2>
      <code>${escapeHtml(detail.queue_ref)}</code>
    </article>
    <div class="boundary-note"><b>${escapeHtml(detail.authorship.rule)}</b>${detail.canonical.house_ready ? `A decisão vai virar um arquivo em <code>${escapeHtml(detail.canonical.house)}</code> (${escapeHtml(detail.canonical.filename_pattern)}), com <code>tipo: decisao</code> e <code>pode-ir-comunidade: false</code>.` : 'A casa canônica das decisões não existe neste cérebro — o caso pode ser preparado, mas não registrado.'}</div>
    ${applied ? caseAppliedBlock(detail) : `${caseForm(detail)}${casePreviewBlock()}`}
    ${caseHistory(detail.state)}
  </div>`;
}

function renderCases() {
  return `<div class="section-heading"><div><p class="eyebrow">MARTELO HUMANO NA FONTE CANÔNICA</p><h2>Decisões</h2></div><p>O Console prepara o caso — item, evidência com proveniência e o diff exato. Quem decide é você; o registro vai para o vault com recibo e reversão.</p></div>
    ${state.cases.detail ? caseDetail() : caseList()}`;
}

async function loadCases() {
  try {
    state.cases.list = await getJson('/api/decision-cases');
  } catch {
    state.cases.list = { available: false, house_ready: false, cases: [], open_count: 0, applied_count: 0, decided_total: 0 };
  }
  if (state.view === 'cases') render();
}

async function openCase(caseId) {
  try {
    const detail = await getJson(`/api/decision-cases/${caseId}`);
    state.cases.detail = detail;
    state.cases.preview = null;
    state.cases.form = emptyCaseForm();
    // Evidência do próprio item já entra marcada; o resto é escolha de quem decide.
    state.cases.form.evidence = detail.evidence_candidates
      .filter((entry) => entry.kind === 'decision-queue')
      .map((entry) => entry.ref);
    state.view = 'cases';
    render();
  } catch (error) {
    toast(label(error.message), 'bad');
  }
}

function casePayload() {
  const form = state.cases.form;
  return {
    verdict: form.verdict,
    theme: form.theme,
    title: form.title.trim(),
    decision_text: form.decision_text.trim(),
    evidence_refs: form.evidence,
    authored_by_human: form.authored === true,
    ...(form.verdict === 'deferred' ? { review_on: form.review_on } : {}),
  };
}

async function previewCase() {
  if (state.busy || !state.cases.detail) return;
  const approval = await askConfirm({
    title: 'Simular o registro da decisão',
    body: 'Simular não escreve nada: monta a nota inteira e devolve o diff para você conferir antes de qualquer coisa.',
    confirmLabel: 'Simular',
    fields: [APPROVED_BY_FIELD],
  });
  if (!approval?.approvedBy) return;
  state.cases.actor = approval.approvedBy;
  state.busy = true;
  try {
    state.cases.preview = await mutate(`/api/decision-cases/${state.cases.detail.case_id}/preview`, {
      ...casePayload(), approved_by: approval.approvedBy,
    });
    toast('Diff pronto. Nada foi escrito no vault ainda.');
  } catch (error) {
    state.cases.preview = null;
    toast(label(error.message), 'bad');
  } finally {
    state.busy = false;
    render();
  }
}

async function applyCase() {
  const preview = state.cases.preview;
  if (state.busy || !preview) return;
  const approval = await askConfirm({
    title: 'Registrar o martelo na fonte canônica',
    body: `Isto cria ${preview.canonical_write.path} no vault, exatamente como no diff que você acabou de ler.\nO recibo guarda autoria, evidência e impressões — nunca o texto da decisão.\nNenhuma ação externa será executada, e o registro é reversível.`,
    confirmLabel: 'Registrar decisão',
    fields: [{ ...APPROVED_BY_FIELD, value: state.cases.actor || APPROVED_BY_FIELD.value }],
  });
  if (!approval?.approvedBy) return;
  state.busy = true;
  try {
    const result = await mutate(`/api/decision-cases/${state.cases.detail.case_id}/apply`, {
      ...casePayload(),
      approved_by: approval.approvedBy,
      plan_digest: preview.plan_digest,
      decided_at: preview.decided_at,
    });
    toast(result.status === 'already-applied'
      ? 'Este caso já tinha martelo — nada foi escrito de novo.'
      : `Decisão registrada em ${result.canonical_write.path}.`);
    state.cases.preview = null;
    await loadCases();
    await openCase(state.cases.detail.case_id);
  } catch (error) {
    toast(label(error.message), 'bad');
    render();
  } finally {
    state.busy = false;
  }
}

async function rollbackCase() {
  if (state.busy || !state.cases.detail) return;
  const reason = document.querySelector('[data-case-field="rollback_reason"]')?.value || 'mistake';
  const approval = await askConfirm({
    title: 'Reverter o registro da decisão',
    body: 'A nota sai do vault e uma cópia privada fica no runtime, com recibo de reversão.\nSe alguém editou a nota depois do martelo, a reversão para e nada é apagado.\nReverter o registro não desfaz o que a decisão causou fora daqui.',
    confirmLabel: 'Reverter',
    tone: 'danger',
    fields: [{ ...APPROVED_BY_FIELD, value: state.cases.actor || APPROVED_BY_FIELD.value }],
  });
  if (!approval?.approvedBy) return;
  state.busy = true;
  try {
    const result = await mutate(`/api/decision-cases/${state.cases.detail.case_id}/rollback`, {
      approved_by: approval.approvedBy, reason_code: reason,
    });
    toast(result.status === 'rolled-back' ? 'Registro revertido. Cópia privada guardada.' : 'Nada a reverter neste caso.');
    await loadCases();
    await openCase(state.cases.detail.case_id);
  } catch (error) {
    toast(label(error.message), 'bad');
    render();
  } finally {
    state.busy = false;
  }
}

const renderers = { activation: renderActivation, compatibility: renderCompatibility, today: renderToday, anatomy: renderAnatomy, system: renderSystemWorkspace, canvas: renderCanvas, areas: renderAreas, systems: renderSystems, skills: renderSkills, sources: renderSources, experiments: renderExperiments, routines: renderRoutines, judgments: renderJudgments, cases: renderCases, runs: renderRuns, governance: renderGovernance, health: renderHealth, society: renderSociety };
const titles = {
  activation: ['Primeira Missão', 'Ative o Cérebro pelo uso, começando com um trabalho real.'],
  compatibility: ['Compatibilidade do protocolo', 'Migração e aderência ao protocolo — não é um placar de saúde do cérebro.'],
  today: ['Hoje', 'O que pede julgamento e o que já está pronto para trabalhar.'],
  anatomy: ['Cérebro', 'O que a empresa sabe, de onde vem e como continua vivo.'],
  system: ['Sistema', 'Como este sistema pensa, executa, é julgado e aprende.'],
  canvas: ['Canvas Operacional', 'Mapa do Cérebro, contrato do Sistema e Execution Trace do Run.'],
  areas: ['Mapa / Áreas', 'A empresa plural, sem transformar navegação em casa da verdade.'],
  systems: ['Sistemas', 'Resultados executáveis ligados ao contexto real do negócio.'],
  skills: ['Skills', 'Capacidades executáveis disponíveis nesta empresa e no motor do Company Brain.'],
  sources: ['Fontes', 'Casas de verdade, autoridade, frescor e garantia de acesso.'],
  experiments: ['Experimentos', 'Hipótese, execução, medição, martelo e aprendizado ligados ao Sistema.'],
  routines: ['Rotinas', 'Quando o cérebro trabalha, com qual contexto e quem precisa decidir.'],
  judgments: ['Julgamento', 'Outputs privados esperando decisão humana rastreável.'],
  cases: ['Decisões', 'Decision Case: caso preparado pelo Console, martelo humano registrado na fonte canônica.'],
  runs: ['Execuções', 'Todas as execuções — recibos de rotina e Run Records do ledger, com contexto, eval, decisão e trace.'],
  governance: ['Governança', 'Quem pode acessar o quê e qual controle existe de verdade.'],
  health: ['Saúde', 'Conflitos e degradações derivados do estado canônico.'],
  society: ['Society', 'A rede distribui capacidade; o contexto da empresa não circula.'],
};

// A que pergunta do operador cada view responde — vira o eyebrow da topbar.
const viewGroups = {
  activation: 'Ativação',
  today: 'Operação', judgments: 'Operação', cases: 'Operação', routines: 'Operação', runs: 'Operação',
  anatomy: 'Cérebro', skills: 'Cérebro',
  system: 'Sistemas', systems: 'Sistemas',
  canvas: 'Estrutura', areas: 'Estrutura', sources: 'Estrutura', experiments: 'Estrutura',
  compatibility: 'Confiança', governance: 'Confiança', health: 'Confiança',
  society: 'Rede',
};

/* Contexto de Área — o switcher filtra a jornada inteira (padrão Linear:
   você "entra" numa área e todas as superfícies respondem). */
// Um sistema tem dois nomes no protocolo: o id de portfólio e o id do contrato.
// Rotinas, julgamentos e run records referenciam o contrato — casar com ambos.
function systemByRef(ref) {
  return state.model?.systems.find((system) => system.system_id === ref || system.contract_id === ref) || null;
}
function refMatchesSystem(ref, system) {
  return ref === system.system_id || ref === system.contract_id;
}
function systemOperatingArea(systemId) {
  return systemByRef(systemId)?.operating_area || null;
}
function inActiveOperatingArea(operatingArea) {
  return !state.operatingAreaFilter || operatingArea === state.operatingAreaFilter;
}
function visibleSystems() {
  return state.model.systems.filter((system) => inActiveOperatingArea(system.operating_area));
}
function visibleSources() {
  if (!state.operatingAreaFilter) return state.model.sources;
  const used = new Set(visibleSystems().flatMap((system) => system.source_refs.map((ref) => sourceRefId(ref))));
  return state.model.sources.filter((source) => used.has(source.source_id));
}
function visibleRoutines() {
  return state.model.routines.filter((routine) => inActiveOperatingArea(systemOperatingArea(routine.system_ref)));
}
function visibleExperiments() {
  return (state.model.experiments || []).filter((experiment) => inActiveOperatingArea(systemOperatingArea(experiment.system_ref)));
}
function visibleJudgments() {
  return state.model.judgments.filter((item) => inActiveOperatingArea(systemOperatingArea(item.system_ref)));
}

function renderAreaSwitcher() {
  const host = $('#area-switcher');
  if (!host || !state.model) return;
  host.innerHTML = `<p class="nav-group">Área responsável</p>
    <button class="area-pill${state.operatingAreaFilter ? '' : ' active'}" data-operating-area-filter=""><i></i>Toda a empresa</button>
    ${state.model.areas.map((area) => `<button class="area-pill${state.operatingAreaFilter === area.operating_area ? ' active' : ''}" data-operating-area-filter="${escapeHtml(area.operating_area)}"><i></i>${escapeHtml(area.name)}<b>${area.system_refs.length}</b></button>`).join('')}`;
}

// Views irmãs viram abas dentro da mesma superfície.
const tabGroups = [
  ['judgments', 'cases', 'routines', 'runs'],
  ['areas', 'sources', 'experiments'],
  ['compatibility', 'governance', 'health'],
];
const tabCounts = { judgments: 'judgments', routines: 'routines', systems: 'systems', skills: 'skills', sources: 'sources', areas: 'areas', experiments: 'experiments' };

function tabstrip() {
  const group = tabGroups.find((views) => views.includes(state.view));
  if (!group) return '';
  return `<div class="tabstrip" role="tablist">${group.map((view) => {
    const countKey = tabCounts[view];
    const filtered = { judgments: () => visibleJudgments().filter((item) => item.judgment.status === 'pending').length, routines: () => visibleRoutines().length, systems: () => visibleSystems().length, sources: () => visibleSources().length, experiments: () => visibleExperiments().length };
    const count = countKey ? (filtered[countKey] ? filtered[countKey]() : state.model.counts[countKey] ?? 0) : null;
    return `<button role="tab" data-view="${view}" class="${view === state.view ? 'active' : ''}">${titles[view][0]}${count ? `<b>${count}</b>` : ''}</button>`;
  }).join('')}</div>`;
}

function render() {
  if (!state.model) return;
  let [title, subtitle] = titles[state.view];
  if (state.view === 'system' && state.workspace?.data) title = state.workspace.data.system.name;
  document.body.dataset.currentView = state.view;
  $('#eyebrow').textContent = `company-brain // ${(viewGroups[state.view] || 'Operação').toLowerCase()}`;
  $('#page-title').textContent = title;
  $('#page-subtitle').textContent = subtitle;
  renderAreaSwitcher();
  const hidesSummary = ['activation', 'canvas', 'system', 'systems', 'skills', 'society'].includes(state.view) || state.view === 'anatomy';
  $('#summary').innerHTML = hidesSummary ? '' : summaryCards();
  if (replay.playing) stopTraceReplay(false);
  if (state.canvas.controller) { state.canvas.controller.destroy(); state.canvas.controller = null; }
  if (state.canvas.stopParticles) { state.canvas.stopParticles(); state.canvas.stopParticles = null; }
  $('#content').innerHTML = tabstrip() + renderers[state.view]();
  $('#updated-at').textContent = `Estado local · ${fmtDate(state.model.generated_at)}`;
  document.querySelectorAll('[data-count]').forEach((element) => {
    const value = state.model.counts[element.dataset.count] ?? 0;
    element.textContent = value;
    element.dataset.zero = String(!value);
  });
  document.querySelectorAll('[data-view]').forEach((element) => {
    const views = (element.dataset.views || element.dataset.view).split(',');
    element.classList.toggle('active', views.includes(state.view));
  });
  if (state.view === 'anatomy') {
    const strip = $('.brain-mode-switch');
    const activeMode = strip?.querySelector('button.active');
    if (strip && activeMode && strip.scrollWidth > strip.clientWidth) {
      strip.scrollLeft = activeMode.offsetLeft - ((strip.clientWidth - activeMode.offsetWidth) / 2);
    }
  }
  ensureVisibleSystemInterfaceHealth();
  if (state.view === 'canvas') void mountCanvasView();
}

function canvasEndpoint() {
  if (state.canvas.scope === 'brain') return '/api/graphs/brain';
  if (state.canvas.scope === 'system') return `/api/graphs/systems/${state.canvas.ref}`;
  if (String(state.canvas.ref).startsWith('run-record:')) {
    return `/api/graphs/run-records/${String(state.canvas.ref).slice('run-record:'.length)}`;
  }
  return `/api/graphs/runs/${state.canvas.ref}`;
}

function safeCanvasExternalUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const allowedHosts = new Set([
      'app.clickup.com', 'drive.google.com', 'docs.google.com',
      'business.facebook.com', 'adsmanager.facebook.com', 'www.facebook.com', 'facebook.com',
    ]);
    return url.protocol === 'https:' && allowedHosts.has(url.hostname) ? url.href : null;
  } catch { return null; }
}

function externalProvider(value) {
  const hostname = new URL(value).hostname;
  if (hostname === 'app.clickup.com') return 'ClickUp';
  if (hostname === 'drive.google.com' || hostname === 'docs.google.com') return 'Drive';
  return 'Meta';
}

// Proveniência acionável: URL abre na origem; ref/caminho copia com um clique.
function detailScalar(value) {
  const text = String(value ?? '');
  if (/^https?:\/\//.test(text)) {
    const url = safeCanvasExternalUrl(text);
    if (url) return `<a class="copy-ref" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)} <b>↗</b></a>`;
  }
  if (/^[\w.@-]+[/:][\w./:@ -]+$/.test(text) && text.length > 6) {
    return `<button type="button" class="copy-ref" data-copy-ref="${escapeHtml(text)}" title="Copiar">${escapeHtml(text)} <b>⧉</b></button>`;
  }
  return escapeHtml(text);
}

function canvasDetailValue(value) {
  if (Array.isArray(value)) {
    return value.length
      ? `<ul class="canvas-detail-list">${value.map((item) => `<li>${typeof item === 'object' ? escapeHtml(JSON.stringify(item)) : detailScalar(item)}</li>`).join('')}</ul>`
      : '<span class="muted">nenhum</span>';
  }
  if (value && typeof value === 'object') return `<pre class="canvas-detail-json">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
  return detailScalar(value);
}

// Vizinhos do nó — navegar o grafo de conexão em conexão, sem caçar no mapa.
function nodeConnections(node) {
  const graph = state.canvas.graph;
  if (!graph) return '';
  const seen = new Set([node.id]);
  const neighbors = [];
  for (const edge of graph.edges) {
    const otherId = edge.source === node.id ? edge.target : edge.target === node.id ? edge.source : null;
    if (!otherId || seen.has(otherId)) continue;
    const other = graph.nodes.find((item) => item.id === otherId);
    if (!other) continue;
    seen.add(otherId);
    neighbors.push({ other, relation: edge.relation });
  }
  if (!neighbors.length) return '';
  neighbors.sort((left, right) => left.other.kind.localeCompare(right.other.kind));
  return `<div class="knowledge-block"><p class="micro">CONEXÕES · ${neighbors.length}</p><div class="node-links">${neighbors.map(({ other, relation }) => `<button type="button" class="node-link" data-canvas-inspect-node="${escapeHtml(other.id)}" style="--dot: var(--kind-${escapeHtml(other.kind)}, var(--idle))"><i></i><strong>${escapeHtml(other.label)}</strong><small>${escapeHtml(label(other.kind))}${relation ? ` · ${escapeHtml(relation)}` : ''}</small></button>`).join('')}</div></div>`;
}

function canvasInspector(node) {
  const inspector = $('#canvas-inspector');
  if (!inspector) return;
  const externalUrl = safeCanvasExternalUrl(node.details?.external_url);
  const details = Object.entries(node.details || {}).filter(([key, value]) => key !== 'external_url' && value !== null && value !== undefined);
  inspector.innerHTML = `<p class="micro">${escapeHtml(label(node.kind))} · ${escapeHtml(label(node.state))}</p><h3>${escapeHtml(node.label)}</h3><div class="canvas-inspector-state">${badge(node.state, tone(node.state))}${node.actual ? '<span>objeto observado</span>' : '<span>contrato</span>'}</div>${externalUrl ? `<a class="canvas-open-link" href="${escapeHtml(externalUrl)}" target="_blank" rel="noopener noreferrer">Abrir no ${escapeHtml(externalProvider(externalUrl))} <b>↗</b></a>` : ''}${nodeConnections(node)}<dl>${details.map(([key, value]) => `<div><dt>${escapeHtml(key.replaceAll('_', ' '))}</dt><dd>${canvasDetailValue(value)}</dd></div>`).join('')}</dl>`;
}

function canvasList(graph) {
  return `<table><thead><tr><th>Objeto</th><th>Tipo</th><th>Estado</th><th>Rastro</th></tr></thead><tbody>${graph.nodes.map((node) => `<tr><td><button class="table-action" data-canvas-inspect-node="${escapeHtml(node.id)}">${escapeHtml(node.label)} →</button></td><td>${escapeHtml(label(node.kind))}</td><td>${escapeHtml(label(node.state))}</td><td>${node.actual ? 'Observado' : 'Contrato'}</td></tr>`).join('')}</tbody></table>`;
}

// Enxame determinístico de partículas orbitando o centro — o núcleo vivo do
// Cérebro. Nenhum dado envolvido: é ambiente, e respeita reduced-motion.
function startParticles() {
  const canvas = $('#canvas-particles');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const resize = () => { canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr; };
  resize();
  const lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    || (navigator.deviceMemory && navigator.deviceMemory <= 4)
    || navigator.connection?.saveData;
  const TOTAL = lowPower ? 36 : 72;
  const particles = Array.from({ length: TOTAL }, (_, index) => ({
    angle: (index / TOTAL) * Math.PI * 2 * 7.3,
    radius: index % 3 ? 0.02 + ((index * 17) % 80) / 80 * 0.11 : 0.14 + ((index * 37) % 100) / 100 * 0.34,
    speed: 0.00005 + ((index % 9) * 0.000016),
    size: 0.8 + (index % 4) * 0.5,
    color: index % 9 === 0 ? '78,156,245' : index % 13 === 0 ? '161,142,247' : '140,152,170',
    alpha: 0.16 + (index % 5) * 0.08,
  }));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = 0;
  const draw = (time) => {
    if (canvas.width !== canvas.clientWidth * dpr || canvas.height !== canvas.clientHeight * dpr) resize();
    const { width, height } = canvas;
    context.clearRect(0, 0, width, height);
    const centerX = width / 2;
    const centerY = height * 0.55;
    const scale = Math.min(width, height);
    for (const [ringIndex, ringRadius] of [[0, 0.13], [1, 0.2]]) {
      context.beginPath();
      context.setLineDash([3 * dpr, 9 * dpr]);
      context.lineDashOffset = (time * 0.004 * (ringIndex ? -1 : 1)) % 1000;
      context.ellipse(centerX, centerY, ringRadius * scale, ringRadius * scale * 0.72, 0, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(120, 150, 210, .14)';
      context.lineWidth = dpr;
      context.stroke();
    }
    context.setLineDash([]);
    for (const particle of particles) {
      const angle = particle.angle + time * particle.speed;
      const x = centerX + Math.cos(angle) * particle.radius * scale;
      const y = centerY + Math.sin(angle) * particle.radius * scale * 0.72;
      context.beginPath();
      context.arc(x, y, particle.size * dpr, 0, Math.PI * 2);
      context.fillStyle = `rgba(${particle.color},${particle.radius < 0.13 ? Math.min(0.6, particle.alpha + 0.2) : particle.alpha})`;
      context.fill();
    }
    if (!reduced) frame = requestAnimationFrame(draw);
  };
  const syncVisibility = () => {
    if (document.visibilityState === 'hidden') {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (!reduced && !frame) {
      frame = requestAnimationFrame(draw);
    }
  };
  if (reduced) draw(0); else frame = requestAnimationFrame(draw);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', syncVisibility);
  state.canvas.stopParticles = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', syncVisibility);
  };
}

// DIRECTORY do conhecimento — como o cérebro está distribuído e o que é mais
// linkado. Índice derivado do fosso (01-nucleo-privado), calculado pelo server.
async function renderKnowledgePanel() {
  try {
    const knowledge = await getJson('/api/knowledge');
    const inspector = $('#canvas-inspector');
    if (!inspector || state.view !== 'canvas' || state.canvas.scope !== 'brain') return;
    const maxDomain = Math.max(1, ...knowledge.domains.map((domain) => domain.count));
    inspector.innerHTML = `<p class="micro">MEMÓRIA SEMÂNTICA · DIAGNÓSTICO</p><h3>Notas e conexões</h3>
      <div class="canvas-inspector-state"><span>${knowledge.total_notes} notas · 01-nucleo-privado</span></div>
      <div class="knowledge-block"><p class="micro">DOMÍNIOS</p>${knowledge.domains.map((domain) => `<div class="knowledge-domain"><span>${escapeHtml(domain.name)}</span><i style="--w:${Math.round((domain.count / maxDomain) * 100)}%"></i><b>${domain.count}</b></div>`).join('')}</div>
      <div class="knowledge-block"><p class="micro">MAIS LINKADAS</p>${knowledge.most_linked.map((note) => `<button type="button" class="knowledge-note" data-copy-ref="${escapeHtml(note.path)}" title="Copiar caminho"><strong>${escapeHtml(note.title)}</strong><small>${escapeHtml(note.domain)} · ${note.count}←</small></button>`).join('') || '<p class="muted">Nenhum wikilink encontrado.</p>'}</div>
      <p class="section-help">Diagnóstico secundário da memória — o cérebro começa pelos resultados que sabe produzir, não pela contagem de notas.</p>`;
  } catch { /* painel opcional — o Canvas funciona sem ele */ }
}

/* Drawers de Sistema e Fonte — os objetos estruturais também abrem, e tudo
   se cruza: fonte ↔ sistemas ↔ rotinas ↔ experimentos, em cadeia. */

function showDrawerShell(content) {
  state.selectedRoutine = null;
  state.selectedJudgment = null;
  state.selectedExperiment = null;
  $('#drawer-content').innerHTML = content;
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
}

function entityLink(attribute, ref, title, hint, kind) {
  return `<button type="button" class="node-link" ${attribute}="${escapeHtml(ref)}" style="--dot: var(--kind-${escapeHtml(kind)}, var(--idle))"><i></i><strong>${escapeHtml(title)}</strong><small>${escapeHtml(hint)}</small></button>`;
}

// source_refs pode vir como string ou objeto {source_id, role, ...} conforme o contrato
function sourceRefId(ref) {
  return typeof ref === 'string' ? ref : ref?.source_id || ref?.ref || ref?.role || '';
}

function openSourceDrawer(sourceId) {
  const source = state.model.sources.find((item) => item.source_id === sourceId);
  if (!source) return;
  const systems = state.model.systems.filter((system) => system.source_refs.some((ref) => sourceRefId(ref) === source.source_id));
  const grants = state.model.routines.flatMap((routine) => routine.access
    .filter((access) => access.source_ref === source.source_id)
    .map((access) => ({ routine, access })));
  showDrawerShell(`<div class="drawer-head"><p class="micro">FONTE · ${escapeHtml(source.type || 'casa de verdade')}</p><h2>${escapeHtml(source.name)}</h2>
      <div class="judgment-badges">${badge(source.status, source.status === 'active' ? 'good' : 'neutral')}${badge(source.assurance, source.assurance === 'runtime-enforced' ? 'good' : 'neutral')}</div></div>
    <div class="drawer-section"><h3>Contrato</h3><dl>
      <div><dt>Custódia</dt><dd>${escapeHtml(label(source.custody))}</dd></div>
      <div><dt>PII</dt><dd>${escapeHtml(label(source.pii))}</dd></div>
      <div><dt>Modos</dt><dd>${source.modes.map((mode) => `<code>${escapeHtml(mode)}</code>`).join(' ')}</dd></div>
      <div><dt>Ref</dt><dd><code>${escapeHtml(source.source_id)}</code></dd></div>
    </dl></div>
    <div class="drawer-section"><h3>Sistemas que usam · ${systems.length}</h3><div class="node-links">${systems.map((system) => entityLink('data-open-system', system.system_id, system.name, label(system.migration_stage), 'system')).join('') || '<p class="muted">Nenhum sistema declara esta fonte.</p>'}</div></div>
    ${grants.length ? `<div class="drawer-section"><h3>Acessos concedidos · ${grants.length}</h3><div class="node-links">${grants.map(({ routine, access }) => entityLink('data-open-routine', routine.routine_id, routine.name, `${label(access.assurance)} · ${label(access.revocation_effect)}`, 'routine')).join('')}</div></div>` : ''}
    <div class="drawer-section"><button class="action primary" data-focus-brain-node="source:${escapeHtml(source.source_id)}">Ver no mandala →</button></div>`);
}

/* Replay do Execution Trace — reproduz o run evento a evento sobre o mapa.
   Só coreografa o que o ledger registrou; estados finais voltam ao real no fim. */
const replay = { playing: false, timer: 0 };

function traceReplayEvents(graph = state.canvas.graph) {
  return (graph?.trace_timeline || []).filter((event) => event.node_id);
}

function syncTraceReplayAvailability(graph) {
  const button = $('[data-canvas-replay]');
  const status = $('#replay-availability');
  if (!button) return;
  const replayEvents = traceReplayEvents(graph).length;
  button.disabled = replayEvents === 0;
  button.textContent = '▶ Reproduzir trace';
  button.title = replayEvents
    ? `Reproduzir ${replayEvents} eventos observados deste trace`
    : 'Run anterior à instrumentação detalhada — resultado preservado, replay visual indisponível';
  if (status) {
    status.textContent = replayEvents
      ? `${replayEvents} eventos registrados`
      : 'Resultado preservado · replay visual indisponível neste Run';
    status.classList.toggle('unavailable', replayEvents === 0);
  }
}

function stopTraceReplay(restore = true) {
  clearTimeout(replay.timer);
  replay.playing = false;
  $('#replay-ticker')?.remove();
  const button = $('[data-canvas-replay]');
  if (button) button.textContent = '▶ Reproduzir trace';
  if (!restore) return;
  for (const element of document.querySelectorAll('#operational-canvas .brain-node')) {
    if (element.dataset.replayClass) {
      element.className = element.dataset.replayClass;
      delete element.dataset.replayClass;
    }
  }
}

function playTraceReplay() {
  const timeline = traceReplayEvents();
  if (!timeline.length) { toast('Este run não tem trace com eventos para reproduzir.', 'bad'); return; }
  if (replay.playing) { stopTraceReplay(); return; }
  replay.playing = true;
  const button = $('[data-canvas-replay]');
  if (button) button.textContent = '⏹ Parar';
  const pane = document.querySelector('.canvas-graph-pane');
  const ticker = document.createElement('div');
  ticker.id = 'replay-ticker';
  ticker.className = 'replay-ticker';
  pane?.appendChild(ticker);
  const nodes = [...document.querySelectorAll('#operational-canvas .brain-node')];
  for (const element of nodes) {
    element.dataset.replayClass = element.className;
    element.className = element.className
      .replace(/brain-node--state-[\w-]+/g, 'brain-node--state-declared')
      .replace(/\bis-focused\b|\bis-neighbor\b/g, '');
    element.classList.add('is-awaiting');
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stepMs = reduced ? 0 : 620;
  let index = 0;
  let previous = null;
  const step = () => {
    if (!replay.playing) return;
    if (index >= timeline.length) {
      ticker.innerHTML = `<b>✓</b> trace completo · ${timeline.length} eventos`;
      replay.timer = setTimeout(() => stopTraceReplay(), reduced ? 0 : 1600);
      return;
    }
    const event = timeline[index];
    const element = document.querySelector(`#operational-canvas .brain-node[data-node-id="${CSS.escape(event.node_id)}"]`);
    if (element) {
      element.classList.remove('is-awaiting');
      element.className = element.className.replace(/brain-node--state-[\w-]+/g, `brain-node--state-${event.state}`);
      previous?.classList.remove('is-focused');
      element.classList.add('is-focused');
      previous = element;
    }
    ticker.innerHTML = `<b>${index + 1}/${timeline.length}</b> ${escapeHtml(event.step_id)} · ${escapeHtml(label(event.state))} · t+${fmtDuration(event.elapsed_ms)}`;
    index += 1;
    replay.timer = setTimeout(step, stepMs);
  };
  step();
}

// Troca rápida de referência (‹ › no pill, ← → no teclado)
function cycleCanvasRef(step) {
  if (state.canvas.scope === 'brain') return;
  const options = state.canvas.scope === 'system'
    ? visibleSystems().map((system) => system.system_id)
    : allCanvasExecutions().map((execution) => execution.selector_ref);
  if (!options.length) return;
  const index = Math.max(0, options.indexOf(state.canvas.ref));
  state.canvas.ref = options[(index + step + options.length) % options.length];
  state.canvas.positions = null;
  render();
}

async function mountCanvasView() {
  startParticles();
  if (state.canvas.scope === 'system' && !state.canvas.ref) state.canvas.ref = state.model.systems.find((item) => item.migration_stage === 'active')?.system_id || state.model.systems[0]?.system_id;
  if (state.canvas.scope === 'run' && !state.canvas.ref) state.canvas.ref = allCanvasExecutions()[0]?.selector_ref;
  const container = $('#operational-canvas');
  if (!container || (state.canvas.scope !== 'brain' && !state.canvas.ref)) {
    if (container) container.innerHTML = empty('Nada para desenhar', 'Ainda não existe objeto real nesta escala.');
    return;
  }
  try {
    const [graph, { mountOperationalCanvas }] = await Promise.all([
      getJson(canvasEndpoint()),
      loadOperationalCanvas(),
    ]);
    if (state.view !== 'canvas') return;
    state.canvas.graph = graph;
    state.canvas.positions = null;
    syncTraceReplayAvailability(graph);
    const timingPanel = $('#run-timing');
    if (timingPanel && graph.graph_type === 'run') {
      timingPanel.innerHTML = runTimingPanel(graph);
      timingPanel.hidden = false;
    }
    $('#canvas-origin').innerHTML = graph.trace_origin
      ? `<span>${graph.run?.mode ? escapeHtml(label(graph.run.mode).toUpperCase()) : graph.trace_origin === 'recorded' ? 'TRACE V1' : 'TRACE RECONSTRUÍDO'}</span><b>${escapeHtml(graph.run?.chain_id ? `${graph.run.chain_id} · ${graph.trace_events} eventos` : graph.trace_origin === 'recorded' ? `${graph.trace_events} eventos` : 'granularidade limitada')}</b>`
      : `<span>CONTRATO</span><b>${graph.nodes.length} nós · ${graph.edges.length} arestas</b>`;
    $('#canvas-list').innerHTML = canvasList(graph);
    const pendingFocus = state.canvas.pendingFocus;
    state.canvas.pendingFocus = null;
    if (state.canvas.scope === 'brain' && !pendingFocus && state.operatingAreaFilter) {
      const areaNode = graph.nodes.find((item) => item.kind === 'area' && item.id === `area:${state.operatingAreaFilter}`);
      if (areaNode) state.canvas.pendingFocus = areaNode.id;
    }
    const areaPendingFocus = state.canvas.pendingFocus;
    if (state.canvas.scope === 'brain' && !pendingFocus && !areaPendingFocus) void renderKnowledgePanel();
    if (areaPendingFocus) {
      const areaTarget = graph.nodes.find((item) => item.id === areaPendingFocus);
      if (areaTarget) canvasInspector(areaTarget);
    }
    if (pendingFocus) {
      const focusTarget = graph.nodes.find((item) => item.id === pendingFocus);
      if (focusTarget) canvasInspector(focusTarget);
    }
    state.canvas.controller = await mountOperationalCanvas({
      container,
      model: graph,
      editable: state.canvas.editable,
      focusNodeId: pendingFocus || areaPendingFocus || null,
      onInspect: canvasInspector,
      onLayoutChange: (positions) => {
        state.canvas.positions = positions;
        const save = $('[data-canvas-save]');
        if (save) save.disabled = false;
      },
    });
  } catch (error) {
    container.innerHTML = empty('Canvas indisponível', label(error.message));
    toast(label(error.message), 'bad');
  }
}

/* Dialog de confirmação da casa — substitui window.prompt/confirm.
   Junta aviso institucional + campos de aprovação num único passo. */
const APPROVED_BY_FIELD = { key: 'approvedBy', label: 'Quem aprova · referência sem dado pessoal', value: 'role-founder' };

function askConfirm({ title, body = '', confirmLabel = 'Confirmar', tone = 'primary', fields = [] }) {
  const dialog = $('#confirm-dialog');
  dialog.innerHTML = `<form method="dialog">
    <h2>${escapeHtml(title)}</h2>
    ${body ? `<p>${escapeHtml(body).replaceAll('\n', '<br>')}</p>` : ''}
    ${fields.map((field) => `<label><span>${escapeHtml(field.label)}</span><input name="${escapeHtml(field.key)}" value="${escapeHtml(field.value || '')}" placeholder="${escapeHtml(field.placeholder || '')}" autocomplete="off" spellcheck="false" required></label>`).join('')}
    <div class="confirm-dialog-actions">
      <button value="cancel" class="action" formnovalidate>Cancelar</button>
      <button value="confirm" class="action ${tone}">${escapeHtml(confirmLabel)}</button>
    </div>
  </form>`;
  dialog.showModal();
  const firstInput = dialog.querySelector('input');
  if (firstInput) { firstInput.focus(); firstInput.select(); }
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => {
      if (dialog.returnValue !== 'confirm') { resolve(null); return; }
      const values = {};
      for (const field of fields) values[field.key] = dialog.querySelector(`[name="${field.key}"]`)?.value.trim() || '';
      resolve(values);
    }, { once: true });
  });
}

async function saveCanvasLayout() {
  if (!state.canvas.graph || !state.canvas.positions) return;
  const approval = await askConfirm({
    title: 'Salvar layout do mapa',
    body: 'Salva somente as posições dos nós nesta máquina. A topologia e os contratos não serão alterados.',
    confirmLabel: 'Salvar posições',
    fields: [APPROVED_BY_FIELD],
  });
  if (!approval?.approvedBy) return;
  const approvedBy = approval.approvedBy;
  try {
    const result = await mutate(`/api/graphs/layouts/${state.canvas.graph.layout.key}`, {
      approved_by: approvedBy,
      positions: state.canvas.positions,
    }, 'PUT');
    toast(`Layout salvo · ${result.node_count} posições · topologia intacta.`);
    state.canvas.positions = null;
    const save = $('[data-canvas-save]');
    if (save) save.disabled = true;
  } catch (error) { toast(label(error.message), 'bad'); }
}

function drawerActions(routine) {
  const buttons = [];
  if (routine.actions.can_confirm_legacy_pause) buttons.push('<button class="action warn" data-routine-action="confirm-legacy-pause">Registrar pausa antiga</button>');
  if (routine.actions.can_run) buttons.push('<button class="action primary" data-routine-action="run">Rodar agora</button>');
  if (routine.actions.can_activate) buttons.push('<button class="action primary" data-routine-action="activate">Ativar agenda</button>');
  if (routine.actions.can_pause) buttons.push('<button class="action" data-routine-action="pause">Pausar</button>');
  if (routine.actions.can_resume) buttons.push('<button class="action primary" data-routine-action="resume">Retomar</button>');
  return buttons.join('');
}

function openDrawer(routineId) {
  const routine = state.model.routines.find((item) => item.routine_id === routineId);
  if (!routine) return;
  state.selectedRoutine = routineId;
  state.selectedJudgment = null;
  state.selectedExperiment = null;
  const access = routine.access.map((item) => `<div class="access-item"><div><strong>${escapeHtml(item.source_ref)}</strong><span>${escapeHtml(item.action)} · ${escapeHtml(item.requested_mode)}</span></div>${badge(item.assurance, item.assurance === 'runtime-enforced' ? 'good' : 'neutral')}<small>${escapeHtml(label(item.revocation_effect))}</small></div>`).join('') || '<p class="muted">Sem Access Grants declarados.</p>';
  const receipts = routine.receipts.map((receipt) => `<div class="receipt-item"><span class="timeline-dot ${tone(receipt.status)}"></span><div><strong>${escapeHtml(label(receipt.status))} · ${escapeHtml(receipt.trigger)}</strong><span>${fmtDate(receipt.completed_at)} · ${escapeHtml(receipt.reason_code)}</span><code>${escapeHtml(receipt.receipt_ref)}</code>${receipt.output_ref ? `<code>output: ${escapeHtml(receipt.output_ref)}</code>` : ''}</div></div>`).join('') || '<p class="muted">Nenhuma execução registrada.</p>';
  const migration = routine.migration ? `<div class="migration-box ${routine.migration.status === 'awaiting-legacy-pause' ? 'attention' : ''}"><p class="micro">MIGRAÇÃO DE AGENDA</p><strong>${escapeHtml(label(routine.migration.status))}</strong><p>${escapeHtml(routine.migration.source.schedule_summary)}</p><small>Fonte: ${escapeHtml(routine.migration.source.kind)} · o Console não pausa esse fornecedor sozinho.</small></div>` : '';
  $('#drawer-content').innerHTML = `<div class="drawer-head"><p class="eyebrow">ROTINA · v${escapeHtml(routine.version)}</p><h2>${escapeHtml(routine.name)}</h2>${badge(routine.health_reason_code)}</div>${migration}
    <section class="drawer-section"><h3>Contrato operacional</h3><dl><div><dt>Agenda</dt><dd>${escapeHtml(routine.schedule)}</dd></div>${routine.preparation ? `<div><dt>Preparação</dt><dd>${escapeHtml(routine.preparation.executable || 'binding ausente')} → <code>${escapeHtml(routine.preparation.output_ref)}</code></dd></div>` : ''}<div><dt>Executor</dt><dd>${escapeHtml(routine.binding.adapter)} · ${escapeHtml(routine.binding.requested_model)}</dd></div><div><dt>Modelo</dt><dd>Solicitado, não verificado pelo provider</dd></div><div><dt>Permissão</dt><dd>${escapeHtml(routine.permission_mode)}</dd></div><div><dt>Prompt ref.</dt><dd><code>${escapeHtml(routine.prompt_ref)}</code></dd></div><div><dt>Destino</dt><dd><code>${escapeHtml(routine.destination.kind)}:${escapeHtml(routine.destination.ref)}</code></dd></div></dl></section>
    <section class="drawer-section"><h3>Contexto e garantia</h3><p class="section-help">A interface mostra referências e a garantia real. Ela não abre o conteúdo da Fonte.</p>${access}</section>
    <section class="drawer-section"><h3>Fronteira do provider</h3><div class="boundary-note"><b>${routine.receipts.some((receipt) => receipt.content_shared_with_provider) ? 'Já houve envio ao provider' : 'Nenhum envio registrado'}</b>O conteúdo necessário passa pelo ${escapeHtml(routine.binding.adapter)}, nunca pela INEVITA. Prompt e output não entram no recibo.</div></section>
    <section class="drawer-section"><h3>Recibos recentes</h3><div class="timeline">${receipts}</div></section>
    <div class="drawer-actions">${drawerActions(routine)}</div>`;
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  $('#drawer-backdrop').hidden = true;
  state.selectedRoutine = null;
  state.selectedJudgment = null;
  state.selectedExperiment = null;
}

function experimentPipeline(detail) {
  return `<div class="experiment-pipeline">${detail.pipeline.map((item, index) => `<div class="experiment-step ${escapeHtml(item.state)}"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(label(item.state))} · ${escapeHtml(item.detail)}</small></div></div>`).join('<b>→</b>')}</div>`;
}

async function openExperiment(experimentId) {
  state.selectedRoutine = null;
  state.selectedJudgment = null;
  state.selectedExperiment = experimentId;
  $('#drawer-content').innerHTML = '<div class="loading"><i></i><span>Abrindo contrato privado local…</span></div>';
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  try {
    const detail = await getJson(`/api/experiments/${experimentId}`);
    if (state.selectedExperiment !== experimentId) return;
    const contract = detail.contract;
    const experimentState = detail.state;
    const arms = contract.arms.length ? contract.arms.map((arm) => `<article><span>${escapeHtml(label(arm.role))}</span><strong>${escapeHtml(arm.label || arm.arm_id)}</strong><code>${escapeHtml(arm.arm_id)}</code></article>`).join('') : '<div class="experiment-gap">Braços não estruturados no ledger de origem. O Console não inferiu controle e variação pela descrição.</div>';
    const amendments = experimentState?.amendments.length ? experimentState.amendments.map((item) => `<div class="receipt-item"><span class="timeline-dot warn"></span><div><strong>${escapeHtml(item.amendment_id)}</strong><span>${fmtDate(item.on, false)} · ${item.change_count} mudança(s)</span><p class="judgment-note">${escapeHtml(item.reason)}</p></div></div>`).join('') : '<p class="muted">Nenhuma emenda registrada.</p>';
    const runs = experimentState?.run_refs.length ? experimentState.run_refs.map((ref) => `<code>${escapeHtml(ref)}</code>`).join('') : '<div class="experiment-gap">Nenhum Run Record contém entity_ref deste experimento.</div>';
    const verdict = experimentState?.verdict.status === 'recorded' ? `<pre class="private-output">${escapeHtml(experimentState.verdict.summary)}</pre>` : `<div class="experiment-gap">${escapeHtml(label(experimentState?.verdict.status || 'pending'))}. O martelo continua humano.</div>`;
    const learning = experimentState?.learning.status === 'linked'
      ? `<code>${escapeHtml(experimentState.learning.ref)}</code>`
      : `<div class="experiment-gap">${experimentState?.learning.status === 'unlinked' ? 'Há decisão, mas nenhuma mudança versionada do Sistema foi ligada a ela.' : 'O aprendizado ainda não chegou à próxima execução.'}</div>`;
    $('#drawer-content').innerHTML = `<div class="drawer-head"><p class="eyebrow">EXPERIMENTO · ${escapeHtml(contract.experiment_id)}</p><h2>${escapeHtml(contract.name)}</h2>${badge(experimentState?.status || 'queued')}</div>
      <div class="boundary-note"><b>Leitura local explícita</b>Hipótese, régua e veredito não entraram no resumo do Console. Abrir não executou modelo nem ação externa.</div>
      <section class="drawer-section experiment-flow-section"><h3>Ciclo completo</h3>${experimentPipeline(detail)}</section>
      <section class="drawer-section"><div class="output-heading"><h3>Pré-registro congelado</h3><span>${escapeHtml(contract.freeze.kind)}</span></div>${contract.gaps.length ? `<div class="experiment-gap">Contrato legado incompleto: ${contract.gaps.map(label).map(escapeHtml).join(' · ')}</div>` : ''}<dl><div><dt>Hipótese</dt><dd>${escapeHtml(contract.hypothesis)}</dd></div><div><dt>Mudança única</dt><dd>${escapeHtml(contract.change)}</dd></div><div><dt>Condições</dt><dd>${escapeHtml(contract.preconditions || 'não estruturadas')}</dd></div><div><dt>Regra de decisão</dt><dd>${escapeHtml(contract.decision_rule || 'não estruturada no legado')}</dd></div></dl></section>
      <section class="drawer-section"><h3>Braços</h3><div class="experiment-arms">${arms}</div></section>
      <section class="drawer-section"><h3>Medição</h3><dl><div><dt>Primária</dt><dd><code>${escapeHtml(contract.primary_metric.metric_id)}</code><br>${escapeHtml(contract.primary_metric.definition)}</dd></div><div><dt>Guardrails</dt><dd>${escapeHtml(contract.guardrails.rule || 'não estruturados no legado')}</dd></div><div><dt>Janela</dt><dd>${fmtDate(contract.window.started_on, false)} → ${fmtDate(contract.window.read_on, false)}</dd></div></dl></section>
      <section class="drawer-section"><div class="output-heading"><h3>Sistemas envolvidos</h3><button class="table-action" data-open-experiment-system="${escapeHtml(contract.system_ref)}">Abrir no Canvas →</button></div><div class="experiment-system-map"><span><b>Palco</b><code>${escapeHtml(contract.system_ref)}</code></span><span><b>Leitura</b>${contract.measurement_system_refs.map((ref) => `<code>${escapeHtml(ref)}</code>`).join('')}</span></div></section>
      <section class="drawer-section"><h3>Runs ligados</h3><div class="ref-list">${runs}</div></section>
      <section class="drawer-section"><h3>Emendas append-only</h3><div class="timeline">${amendments}</div></section>
      <section class="drawer-section"><h3>Martelo humano</h3>${verdict}</section>
      <section class="drawer-section"><h3>Mudança na próxima execução</h3>${learning}</section>`;
  } catch (error) {
    $('#drawer-content').innerHTML = empty('Experimento indisponível', label(error.message));
    toast(label(error.message), 'bad');
  }
}

function judgmentHistory(history) {
  return history.slice().reverse().map((item) => `<div class="receipt-item"><span class="timeline-dot ${tone(item.verdict)}"></span><div><strong>${escapeHtml(label(item.verdict))}${item.action_intent === 'propose-action' ? ' · intenção de ação' : ''}</strong><span>${fmtDate(item.decided_at)} · ${escapeHtml(item.actor_ref)}</span>${item.note ? `<p class="judgment-note">${escapeHtml(item.note)}</p>` : ''}<code>${escapeHtml(item.judgment_id)}</code></div></div>`).join('') || '<p class="muted">Ainda não julgado.</p>';
}

function correctionSection(detail) {
  const correction = detail.correction;
  if (!correction) return '';
  const learning = correction.learning_candidate;
  return `<section class="drawer-section"><h3>Linhas de correção</h3>
    <div class="correction-lineage"><div><span>Baseline</span><code>${escapeHtml(correction.baseline_receipt_ref)}</code></div><b>→</b><div><span>Novo Run</span><code>${escapeHtml(correction.resulting_receipt_ref)}</code></div></div>
    <p class="section-help">O recibo aponta para o julgamento que originou a correção; não copia a nota nem os outputs.</p>
    ${learning ? `<div class="learning-candidate"><div>${badge('candidate', 'neutral')}<strong>${learning.occurrences}/${learning.promotion_threshold}</strong></div><p>Ainda exige casos comparáveis, replay e novo martelo para mudar o Sistema.</p><code>${escapeHtml(learning.candidate_ref)}</code></div>` : ''}
    <div id="comparison-slot"></div>
  </section>`;
}

function verdictGuide() {
  return `<ul class="verdict-guide">
    <li><b>Aprovar</b> fecha o julgamento. Nada é reexecutado.</li>
    <li><b>Pedir ajuste</b> guarda sua correção e libera uma reexecução com ela.</li>
    <li><b>Rejeitar</b> fecha como reprovado e abre caso de eval.</li>
    <li><b>Propor ação</b> registra intenção local, sem executar.</li>
  </ul>`;
}

/* Julgar é local e reversível; reexecutar atravessa a fronteira do provider.
   As duas coisas moram em zonas separadas para o gesto não confundi-las. */
function judgmentZones(detail) {
  const actions = detail.correction_actions || {};
  const history = detail.judgment?.history || [];
  const current = history.length ? history[history.length - 1] : null;
  const rerunReady = Boolean(actions.can_rerun_with_correction);
  const judge = `<div class="zone judge-zone">
    <p class="zone-label">Julgar · registra decisão local, nada sai desta máquina</p>
    <div class="drawer-actions judgment-actions">
      <button class="action${rerunReady ? '' : ' primary'}" data-judgment-action="approve">Aprovar</button>
      <button class="action warn" data-judgment-action="changes">Pedir ajuste</button>
      <button class="action" data-judgment-action="reject">Rejeitar</button>
      <button class="action" data-judgment-action="propose-action">Propor ação</button>
    </div>
    ${rerunReady ? '<p class="zone-help">Registrar outro veredito substitui o julgamento atual e descarta a reexecução pendente.</p>' : ''}
  </div>`;
  const buttons = [];
  if (rerunReady) buttons.push('<button class="action primary" data-correction-action="rerun">Reexecutar com correção<small>envia sua nota ao provider · consome assinatura</small></button>');
  if (actions.can_compare) buttons.push('<button class="action" data-correction-action="compare">Comparar runs<small>abre baseline e candidato lado a lado</small></button>');
  if (actions.can_create_learning_candidate) buttons.push('<button class="action" data-correction-action="learn">Criar candidato 1/3<small>ainda exige replay e novo martelo</small></button>');
  const stateLine = current
    ? `<div class="judgment-state"><span class="timeline-dot ${tone(current.verdict)}"></span><div><strong>Julgamento atual: ${escapeHtml(label(current.verdict))}</strong><span>${fmtDate(current.decided_at)} · ${escapeHtml(current.actor_ref)}${rerunReady ? ' · 1 reexecução disponível' : ''}</span></div></div>`
    : '<div class="judgment-state"><span class="timeline-dot warn"></span><div><strong>Ainda não julgado</strong><span>Nenhum veredito registrado para este resultado.</span></div></div>';
  if (!buttons.length) return `<div class="zone quiet">${stateLine}</div>${judge}`;
  return `<div class="zone act-zone">
    <p class="zone-label">Agir sobre este julgamento · executa e atravessa a fronteira do provider</p>
    ${stateLine}
    <div class="drawer-actions">${buttons.join('')}</div>
  </div>${judge}`;
}

function contextMarkup(context) {
  const snapshot = context.context_snapshot;
  const accesses = snapshot.accesses.map((access) => `<article class="context-access"><div class="object-card-top">${badge(access.assurance, access.assurance === 'runtime-enforced' ? 'good' : 'neutral')}<code>${escapeHtml(access.source_ref.role)}</code></div><h3>${escapeHtml(access.source_ref.id)}</h3><dl><div><dt>Seleção</dt><dd>${escapeHtml(access.query)}</dd></div><div><dt>Janela</dt><dd>${escapeHtml(access.window)}</dd></div><div><dt>Frescor</dt><dd>${escapeHtml(access.freshness_marker || 'não informado')}</dd></div></dl><div class="ref-list">${access.selected_refs.map((ref) => `<code>${escapeHtml(ref)}</code>`).join('')}</div></article>`).join('');
  const gaps = snapshot.gaps.length
    ? `<div class="context-gaps"><p class="micro">LACUNAS</p>${snapshot.gaps.map((gap) => `<code>${escapeHtml(gap.source_role)} · ${escapeHtml(gap.reason_code)}</code>`).join('')}</div>`
    : '<p class="good-note">Nenhuma lacuna de Fonte registrada.</p>';
  return `<div class="context-summary"><span><b>${snapshot.accesses.length}</b> fontes selecionadas</span><span><b>${snapshot.gaps.length}</b> lacunas</span><span><b>v${escapeHtml(snapshot.retrieval_version)}</b> retrieval</span></div><div class="context-grid">${accesses}</div>${gaps}<div class="boundary-note"><b>Snapshot reference-only</b>O ledger guarda hash, ponteiros, filtros, janela, frescor e garantia. A seleção é auditada; somente uma garantia runtime-enforced provaria bloqueio preventivo. O artefato privado não foi aberto nesta tela.</div>`;
}

async function loadContext(receiptId, slot) {
  try {
    const context = await getJson(`/api/runs/${receiptId}/context`);
    slot.innerHTML = contextMarkup(context);
  } catch (error) {
    slot.innerHTML = empty('Contexto indisponível', label(error.message));
    toast(label(error.message), 'bad');
  }
}

async function openContextDrawer(receiptId) {
  state.selectedRoutine = null;
  state.selectedJudgment = receiptId;
  state.selectedExperiment = null;
  $('#drawer-content').innerHTML = '<div class="drawer-head"><p class="eyebrow">RUN RECORD V2</p><h2>Contexto selecionado</h2></div><div id="context-slot"><p class="muted">Lendo referências locais…</p></div>';
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  await loadContext(receiptId, $('#context-slot'));
}

async function openJudgment(receiptId) {
  state.selectedRoutine = null;
  state.selectedJudgment = receiptId;
  state.selectedExperiment = null;
  $('#drawer-content').innerHTML = '<div class="loading"><i></i><span>Abrindo output privado local…</span></div>';
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  try {
    const detail = await getJson(`/api/runs/${receiptId}/output`);
    const current = detail.judgment.summary;
    $('#drawer-content').innerHTML = `<div class="drawer-head"><p class="eyebrow">OUTPUT PRIVADO</p><h2>${escapeHtml(detail.receipt.routine_id)}</h2>${badge(current.status === 'pending' ? 'pending' : current.verdict)}</div>
      <div class="boundary-note"><b>Leitura local explícita</b>Este conteúdo não entrou no recibo, no read model ou na INEVITA. Abrir não executou modelo.</div>
      <section class="drawer-section"><div class="output-heading"><h3>Resultado</h3><span>${detail.output.bytes} bytes</span></div><pre class="private-output">${escapeHtml(detail.output.content)}</pre></section>
      ${detail.context_available ? `<section class="drawer-section"><div class="output-heading"><h3>Contexto selecionado</h3><button class="table-action" data-load-context="${escapeHtml(receiptId)}">Abrir Run Record V2 →</button></div><div id="context-slot"></div></section>` : ''}
      ${correctionSection(detail)}
      <section class="drawer-section"><h3>Seu julgamento</h3><p class="section-help">A nota fica privada. Pedir ajuste, rejeitar ou propor ação exige explicar por quê.</p>${verdictGuide()}<textarea id="judgment-note" maxlength="2000" placeholder="O que está certo, o que precisa mudar ou qual ação deveria ser considerada?"></textarea></section>
      <section class="drawer-section"><h3>Histórico imutável</h3><div class="timeline">${judgmentHistory(detail.judgment.history)}</div></section>
      <div class="boundary-note action-boundary"><b>Propor não é executar</b>“Propor ação” registra intenção local. Não cria task, não envia mensagem, não publica e não altera Fonte.</div>
      ${judgmentZones(detail)}`;
    state.rerunPending = Boolean(detail.correction_actions?.can_rerun_with_correction);
  } catch (error) {
    $('#drawer-content').innerHTML = empty('Output indisponível', label(error.message));
    toast(label(error.message), 'bad');
  }
}

async function performJudgment(action) {
  if (state.busy || !state.selectedJudgment) return;
  const note = $('#judgment-note')?.value.trim() || '';
  const payload = action === 'approve' ? { verdict: 'approved', action_intent: 'none' }
    : action === 'changes' ? { verdict: 'changes-requested', action_intent: 'none' }
      : action === 'reject' ? { verdict: 'rejected', action_intent: 'none' }
        : { verdict: 'approved', action_intent: 'propose-action' };
  if ((payload.verdict !== 'approved' || payload.action_intent === 'propose-action') && !note) {
    toast('Explique o motivo antes de registrar.', 'bad');
    return;
  }
  const approval = await askConfirm({
    title: payload.action_intent === 'propose-action' ? 'Registrar intenção de ação' : `Registrar julgamento · ${label(payload.verdict)}`,
    body: `${payload.action_intent === 'propose-action'
      ? 'A intenção fica local. Nenhuma ação externa será executada.'
      : 'O histórico anterior será preservado. Nenhuma ação externa será executada.'}${state.rerunPending && !(payload.verdict === 'changes-requested' && payload.action_intent === 'none')
      ? ' ATENÇÃO: existe uma reexecução com correção ainda não usada. Registrar outro veredito torna o julgamento atual antigo e a reexecução deixa de ser oferecida.'
      : ''}`,
    confirmLabel: 'Registrar',
    fields: [APPROVED_BY_FIELD],
  });
  if (!approval?.approvedBy) return;
  const approvedBy = approval.approvedBy;
  state.busy = true;
  document.querySelectorAll('[data-judgment-action]').forEach((button) => { button.disabled = true; });
  try {
    const result = await mutate(`/api/runs/${state.selectedJudgment}/judgments`, {
      ...payload,
      note,
      approved_by: approvedBy,
    });
    toast(`${label(result.summary.verdict)} registrado. Nenhuma ação externa executada.`);
    const receiptId = state.selectedJudgment;
    await loadModel();
    await openJudgment(receiptId);
  } catch (error) {
    toast(label(error.message), 'bad');
  } finally {
    state.busy = false;
  }
}

async function performCorrectionAction(action) {
  if (state.busy || !state.selectedJudgment) return;
  if (action === 'compare') {
    try {
      const comparison = await getJson(`/api/runs/${state.selectedJudgment}/comparison`);
      const slot = $('#comparison-slot');
      if (!slot) return;
      slot.innerHTML = `<div class="comparison-grid"><article><p class="micro">BASELINE</p><pre class="private-output">${escapeHtml(comparison.baseline.output.content)}</pre></article><article><p class="micro">NOVO RUN</p><pre class="private-output">${escapeHtml(comparison.candidate.output.content)}</pre></article></div>
        <div class="boundary-note"><b>Comparação local</b>Abrir esta comparação não chamou modelo e não colocou os outputs no read model.</div>`;
    } catch (error) {
      toast(label(error.message), 'bad');
    }
    return;
  }
  const approval = await askConfirm(action === 'rerun' ? {
    title: 'Reexecutar com a correção humana',
    body: 'A nota privada será enviada por stdin ao provider configurado e pode consumir sua assinatura. Ela não irá para a INEVITA, Git, logs ou recibos. Nenhuma ação externa será executada.',
    confirmLabel: 'Reexecutar',
    fields: [APPROVED_BY_FIELD],
  } : {
    title: 'Criar candidato de aprendizado 1/3',
    body: 'Isso não altera o motor. Ainda serão necessários três casos comparáveis, replay e novo martelo humano.',
    confirmLabel: 'Criar candidato',
    fields: [APPROVED_BY_FIELD],
  });
  if (!approval?.approvedBy) return;
  const approvedBy = approval.approvedBy;
  state.busy = true;
  document.querySelectorAll('[data-correction-action], [data-judgment-action]').forEach((button) => { button.disabled = true; });
  try {
    if (action === 'rerun') {
      const result = await mutate(`/api/runs/${state.selectedJudgment}/rerun-with-correction`, { approved_by: approvedBy });
      toast(`${label(result.status)} · novo output voltou para julgamento.`);
      const nextReceiptId = result.resulting_receipt_ref.replace('routine-receipt:', '');
      await loadModel();
      await openJudgment(nextReceiptId);
    } else {
      const result = await mutate(`/api/runs/${state.selectedJudgment}/learning-candidates`, { approved_by: approvedBy });
      toast(`Candidato ${result.occurrences}/${result.promotion_threshold} criado. Motor não alterado.`);
      const receiptId = state.selectedJudgment;
      await loadModel();
      await openJudgment(receiptId);
    }
  } catch (error) {
    toast(label(error.message), 'bad');
  } finally {
    state.busy = false;
  }
}

async function revokeGrant(grantId) {
  if (state.busy) return;
  const approval = await askConfirm({
    title: 'Revogar acesso para Runs futuros',
    body: 'Isso não apaga outputs, recibos ou artefatos já consumidos. Nenhuma ação externa será executada.',
    confirmLabel: 'Revogar',
    tone: 'warn',
    fields: [APPROVED_BY_FIELD],
  });
  if (!approval?.approvedBy) return;
  const approvedBy = approval.approvedBy;
  state.busy = true;
  try {
    const result = await mutate(`/api/grants/${grantId}/revoke`, { approved_by: approvedBy });
    toast(`${label(result.status)} · próximos Runs serão bloqueados.`);
    await loadModel();
  } catch (error) {
    toast(label(error.message), 'bad');
  } finally {
    state.busy = false;
  }
}

async function performAction(action) {
  if (state.busy || !state.selectedRoutine) return;
  const routine = state.model.routines.find((item) => item.routine_id === state.selectedRoutine);
  let approvedBy = '';
  let evidenceRef = '';
  if (action === 'run') {
    const approval = await askConfirm({
      title: `Rodar “${routine.name}” agora`,
      body: `Isso usa a sessão ${routine.binding.adapter} e pode consumir sua assinatura. Não ativa a agenda.`,
      confirmLabel: 'Rodar agora',
    });
    if (!approval) return;
  } else if (action === 'confirm-legacy-pause') {
    const approval = await askConfirm({
      title: 'Registrar pausa da agenda antiga',
      body: 'Confirme somente depois de pausar a agenda no fornecedor antigo. O Console registra o readback; ele não pausa o Claude por você.',
      confirmLabel: 'Registrar readback',
      tone: 'warn',
      fields: [APPROVED_BY_FIELD, { key: 'evidenceRef', label: 'Referência opaca da evidência de pausa', value: 'readback:legacy-schedule-paused' }],
    });
    if (!approval?.approvedBy || !approval.evidenceRef) return;
    approvedBy = approval.approvedBy;
    evidenceRef = approval.evidenceRef;
  } else if (action === 'activate') {
    evidenceRef = routine.actions.activation_evidence_ref;
    if (!evidenceRef) return;
    const approval = await askConfirm({
      title: 'Ativar agenda desta rotina',
      body: 'O relógio liga usando o último replay manual concluído e aprovado.',
      confirmLabel: 'Ativar agenda',
      fields: [APPROVED_BY_FIELD],
    });
    if (!approval?.approvedBy) return;
    approvedBy = approval.approvedBy;
  } else {
    const approval = await askConfirm({
      title: `${action === 'pause' ? 'Pausar' : 'Retomar'} esta rotina`,
      body: action === 'pause'
        ? 'Execuções futuras serão bloqueadas. Efeitos externos já consumados permanecem.'
        : 'O relógio volta a valer a partir de agora.',
      confirmLabel: action === 'pause' ? 'Pausar' : 'Retomar',
      fields: [APPROVED_BY_FIELD],
    });
    if (!approval?.approvedBy) return;
    approvedBy = approval.approvedBy;
  }
  state.busy = true;
  document.querySelectorAll('[data-routine-action]').forEach((button) => { button.disabled = true; });
  try {
    const payload = action === 'run' ? {} : { approved_by: approvedBy, ...(evidenceRef ? { evidence_ref: evidenceRef } : {}) };
    const result = await mutate(`/api/routines/${routine.routine_id}/${action}`, payload);
    toast(action === 'run' ? `${label(result.status)} · ${result.reason_code}` : 'Estado canônico atualizado.');
    await loadModel();
    openDrawer(routine.routine_id);
  } catch (error) {
    toast(label(error.message), 'bad');
  } finally {
    state.busy = false;
  }
}

async function loadModel() {
  const [model, decisions] = await Promise.all([
    getJson('/api/console'),
    getJson('/api/decisions').catch(() => null),
    loadCases(),
  ]);
  state.model = model;
  if (!state.initialRouteResolved || (state.view === 'activation' && model.activation.complete)) {
    state.view = model.activation.complete ? 'today' : 'activation';
    state.initialRouteResolved = true;
  }
  state.decisions = decisions;
  state.anatomy = null;
  state.brainGraph = null;
  state.skills.data = null;
  state.skills.error = null;
  state.society.data = null;
  state.society.error = null;
  state.society.selected = null;
  state.runs.data = null;
  render();
}

/* Formulário do Decision Case: o estado mora em state.cases.form, nunca só no DOM.
   Mexer em qualquer campo mata a simulação anterior — o diff confirmado tem que ser
   o diff do texto atual, sem exceção. */
function invalidateCasePreview() {
  if (!state.cases.preview) return false;
  state.cases.preview = null;
  toast('Campo alterado: a simulação anterior não vale mais.', 'warn');
  return true;
}

document.addEventListener('input', (event) => {
  const brainSearch = event.target.closest('[data-brain-map-search]');
  if (brainSearch) {
    state.brain.query = brainSearch.value;
    render();
    const restored = $('[data-brain-map-search]');
    restored?.focus();
    restored?.setSelectionRange(state.brain.query.length, state.brain.query.length);
    return;
  }
  const systemSearch = event.target.closest('[data-system-search]');
  if (systemSearch) {
    state.systems.query = systemSearch.value;
    render();
    const restored = $('[data-system-search]');
    restored?.focus();
    restored?.setSelectionRange(state.systems.query.length, state.systems.query.length);
    return;
  }
  const skillSearch = event.target.closest('[data-skill-search]');
  if (skillSearch) {
    state.skills.query = skillSearch.value;
    render();
    const restored = $('[data-skill-search]');
    restored?.focus();
    restored?.setSelectionRange(state.skills.query.length, state.skills.query.length);
    return;
  }
  const societySearch = event.target.closest('[data-society-search]');
  if (societySearch) {
    state.society.query = societySearch.value;
    render();
    const restored = $('[data-society-search]');
    restored?.focus();
    restored?.setSelectionRange(state.society.query.length, state.society.query.length);
    return;
  }
  const field = event.target.closest('[data-case-field]');
  if (!field || !state.cases.form) return;
  const key = field.dataset.caseField;
  if (key === 'evidence' || key === 'rollback_reason' || key === 'authored') return;
  state.cases.form[key] = field.value;
  const counter = document.querySelector('.case-counter');
  if (counter && key === 'decision_text') {
    counter.textContent = `${field.value.trim().length}/${state.cases.detail.draft.max_chars} · o Console não escreve esta parte por você`;
  }
  if (invalidateCasePreview()) render();
});

document.addEventListener('change', (event) => {
  const field = event.target.closest('[data-case-field]');
  if (!field || !state.cases.form) return;
  if (field.dataset.caseField === 'authored') {
    state.cases.form.authored = field.checked;
    invalidateCasePreview();
    render(); // sem re-render, o diff antigo e o botão de registrar ficariam na tela com preview já morto
    return;
  }
  if (field.dataset.caseField === 'evidence') {
    const refs = new Set(state.cases.form.evidence);
    if (field.checked) refs.add(field.value); else refs.delete(field.value);
    state.cases.form.evidence = [...refs];
    invalidateCasePreview();
    render();
  }
});

document.addEventListener('click', (event) => {
  const caseOpen = event.target.closest('[data-case-open]');
  if (caseOpen) { void openCase(caseOpen.dataset.caseOpen); return; }
  const caseVerdict = event.target.closest('[data-case-verdict]');
  if (caseVerdict && state.cases.form) {
    state.cases.form.verdict = caseVerdict.dataset.caseVerdict;
    if (state.cases.form.verdict !== 'deferred') state.cases.form.review_on = '';
    invalidateCasePreview();
    render();
    return;
  }
  if (event.target.closest('[data-case-back]')) {
    state.cases.detail = null; state.cases.preview = null; state.cases.form = null;
    void loadCases();
    render();
    return;
  }
  if (event.target.closest('[data-case-discard]')) { state.cases.preview = null; render(); return; }
  if (event.target.closest('[data-case-preview]')) { void previewCase(); return; }
  if (event.target.closest('[data-case-apply]')) { void applyCase(); return; }
  if (event.target.closest('[data-case-rollback]')) { void rollbackCase(); return; }
  const systemCategory = event.target.closest('.system-filter[data-system-category]');
  if (systemCategory) {
    state.systems.category = systemCategory.dataset.systemCategory;
    render();
    return;
  }
  const systemStage = event.target.closest('.system-filter[data-system-stage]');
  if (systemStage) {
    state.systems.stage = systemStage.dataset.systemStage;
    render();
    return;
  }
  const skillOrigin = event.target.closest('[data-skill-origin]');
  if (skillOrigin) { state.skills.origin = skillOrigin.dataset.skillOrigin; render(); return; }
  const skillStatus = event.target.closest('[data-skill-status-filter]');
  if (skillStatus) { state.skills.status = skillStatus.dataset.skillStatusFilter; render(); return; }
  const skillLink = event.target.closest('[data-skill-link]');
  if (skillLink) { state.skills.link = skillLink.dataset.skillLink; render(); return; }
  const skillOpen = event.target.closest('[data-open-skill]');
  if (skillOpen) { openSkill(skillOpen.dataset.openSkill); return; }
  const societyFilter = event.target.closest('[data-society-filter]');
  if (societyFilter) { state.society.filter = societyFilter.dataset.societyFilter; render(); return; }
  const societyOpen = event.target.closest('[data-society-open]');
  if (societyOpen) { state.society.selected = societyOpen.dataset.societyOpen; render(); return; }
  if (event.target.closest('[data-society-back]')) { state.society.selected = null; render(); return; }
  const societyCommand = event.target.closest('[data-society-copy-command]');
  if (societyCommand) {
    navigator.clipboard?.writeText(societyCommand.dataset.societyCopyCommand).then(
      () => toast('Comando do diagnóstico copiado.'),
      () => toast('Não foi possível copiar o comando.', 'bad'),
    );
    return;
  }
  if (event.target.closest('[data-update-check]')) { void checkBrainUpdates(); return; }
  if (event.target.closest('[data-update-apply]')) { void applyBrainUpdate(); return; }
  const brainMode = event.target.closest('[data-brain-mode]');
  if (brainMode) {
    state.brain.mode = brainMode.dataset.brainMode;
    state.brain.query = '';
    try { localStorage.setItem('cb-brain-mode', state.brain.mode); } catch { /* preferência local */ }
    if (state.brain.mode === 'architecture') void loadBrainGraph();
    if (state.brain.mode === 'updates') void loadBrainUpdates();
    render();
    return;
  }
  const brainRun = event.target.closest('[data-open-brain-run]');
  if (brainRun) { openBrainRun(brainRun.dataset.openBrainRun); return; }
  const nav = event.target.closest('[data-view]');
  if (nav) { state.view = nav.dataset.view; closeDrawer(); render(); return; }
  const areaPill = event.target.closest('[data-operating-area-filter]');
  if (areaPill) {
    closeDrawer();
    state.operatingAreaFilter = areaPill.dataset.operatingAreaFilter;
    try { localStorage.setItem('cb-operating-area', state.operatingAreaFilter); } catch { /* preferência local */ }
    if (state.canvas.scope === 'system' && state.canvas.ref && !inActiveOperatingArea(systemOperatingArea(state.canvas.ref))) state.canvas.ref = null;
    if (state.canvas.scope === 'run') state.canvas.ref = null;
    state.canvas.positions = null;
    render();
    return;
  }
  const canvasScope = event.target.closest('[data-canvas-scope]');
  if (canvasScope) {
    state.canvas.scope = canvasScope.dataset.canvasScope;
    state.canvas.ref = state.canvas.scope === 'system'
      ? state.model.systems.find((item) => item.migration_stage === 'active')?.system_id || state.model.systems[0]?.system_id || null
      : state.canvas.scope === 'run' ? allCanvasExecutions()[0]?.selector_ref || null : null;
    state.canvas.positions = null;
    render();
    return;
  }
  if (event.target.closest('[data-canvas-fit]')) { state.canvas.controller?.fit(); return; }
  if (event.target.closest('[data-open-brain-map]')) {
    state.canvas.scope = 'brain';
    state.canvas.ref = null;
    state.canvas.positions = null;
    state.view = 'canvas';
    closeDrawer();
    render();
    return;
  }
  const cycle = event.target.closest('[data-canvas-cycle]');
  if (cycle) { cycleCanvasRef(Number(cycle.dataset.canvasCycle)); return; }
  const jumpRun = event.target.closest('[data-canvas-jump-run]');
  if (jumpRun) {
    state.canvas.scope = 'run';
    state.canvas.ref = jumpRun.dataset.canvasJumpRun;
    state.canvas.positions = null;
    state.view = 'canvas';
    closeDrawer();
    render();
    return;
  }
  if (event.target.closest('[data-canvas-edit]')) {
    state.canvas.editable = !state.canvas.editable;
    state.canvas.positions = null;
    render();
    return;
  }
  if (event.target.closest('[data-canvas-save]')) { saveCanvasLayout(); return; }
  if (event.target.closest('[data-canvas-replay]')) { playTraceReplay(); return; }
  const canvasNode = event.target.closest('[data-canvas-inspect-node]');
  if (canvasNode && state.canvas.graph) {
    const node = state.canvas.graph.nodes.find((item) => item.id === canvasNode.dataset.canvasInspectNode);
    if (node) {
      canvasInspector(node);
      void state.canvas.controller?.focus?.(node.id);
    }
    return;
  }
  const runsSort = event.target.closest('[data-runs-sort]');
  if (runsSort) {
    const key = runsSort.dataset.runsSort;
    state.runs.sort = state.runs.sort.key === key
      ? { key, dir: state.runs.sort.dir === 'desc' ? 'asc' : 'desc' }
      : { key, dir: key === 'when' ? 'desc' : 'asc' };
    render();
    return;
  }
  if (event.target.closest('[data-runs-clear]')) {
    state.runs.filters = { system: '', mode: '', status: '', decision: '', snapshot: '' };
    render();
    return;
  }
  const runsForRoutine = event.target.closest('[data-runs-for-routine]');
  if (runsForRoutine) {
    state.runs.filters = { system: '', routine: runsForRoutine.dataset.runsForRoutine, mode: '', status: '', decision: '', snapshot: '' };
    state.view = 'runs';
    closeDrawer();
    render();
    return;
  }
  const open = event.target.closest('[data-open-routine]');
  if (open) { openDrawer(open.dataset.openRoutine); return; }
  const openSystem = event.target.closest('[data-open-system]');
  if (openSystem) { openWorkspace(openSystem.dataset.openSystem); return; }
  const wsTab = event.target.closest('[data-ws-tab]');
  if (wsTab && state.view === 'system' && state.workspace) { state.workspace.tab = wsTab.dataset.wsTab; render(); return; }
  const wsHowMode = event.target.closest('[data-ws-how-mode]');
  if (wsHowMode && state.view === 'system' && state.workspace) {
    state.workspace.howMode = wsHowMode.dataset.wsHowMode;
    render();
    return;
  }
  const openSystemCanvas = event.target.closest('[data-open-system-canvas]');
  if (openSystemCanvas) {
    state.canvas.scope = 'system';
    state.canvas.ref = openSystemCanvas.dataset.openSystemCanvas;
    state.canvas.positions = null;
    state.view = 'canvas';
    closeDrawer();
    render();
    return;
  }
  const openSource = event.target.closest('[data-open-source]');
  if (openSource) { openSourceDrawer(openSource.dataset.openSource); return; }
  const focusBrain = event.target.closest('[data-focus-brain-node]');
  if (focusBrain) {
    state.canvas.scope = 'brain';
    state.canvas.ref = null;
    state.canvas.positions = null;
    state.canvas.pendingFocus = focusBrain.dataset.focusBrainNode;
    state.view = 'canvas';
    closeDrawer();
    render();
    return;
  }
  const judgment = event.target.closest('[data-open-judgment]');
  if (judgment) { openJudgment(judgment.dataset.openJudgment); return; }
  const experiment = event.target.closest('[data-open-experiment]');
  if (experiment) { openExperiment(experiment.dataset.openExperiment); return; }
  const experimentSystem = event.target.closest('[data-open-experiment-system]');
  if (experimentSystem) {
    state.canvas.scope = 'system';
    state.canvas.ref = experimentSystem.dataset.openExperimentSystem;
    state.view = 'canvas';
    closeDrawer();
    render();
    return;
  }
  const judgmentAction = event.target.closest('[data-judgment-action]');
  if (judgmentAction) { performJudgment(judgmentAction.dataset.judgmentAction); return; }
  const correctionAction = event.target.closest('[data-correction-action]');
  if (correctionAction) { performCorrectionAction(correctionAction.dataset.correctionAction); return; }
  const contextAction = event.target.closest('[data-open-context]');
  if (contextAction) { openContextDrawer(contextAction.dataset.openContext); return; }
  const loadContextAction = event.target.closest('[data-load-context]');
  if (loadContextAction) { loadContext(loadContextAction.dataset.loadContext, $('#context-slot')); return; }
  const revokeAction = event.target.closest('[data-revoke-grant]');
  if (revokeAction) { revokeGrant(revokeAction.dataset.revokeGrant); return; }
  const copyRef = event.target.closest('[data-copy-ref]');
  if (copyRef) {
    navigator.clipboard?.writeText(copyRef.dataset.copyRef).then(
      () => toast('Referência copiada.'),
      () => toast('Não foi possível copiar.', 'bad'),
    );
    return;
  }
  const action = event.target.closest('[data-routine-action]');
  if (action) performAction(action.dataset.routineAction);
});
document.addEventListener('change', (event) => {
  if (event.target.id === 'ws-cmp-a' || event.target.id === 'ws-cmp-b') {
    const ws = state.workspace?.data;
    const slot = $('#ws-compare');
    if (ws && slot) slot.innerHTML = wsCompareTable(ws, Number($('#ws-cmp-a').value), Number($('#ws-cmp-b').value));
    return;
  }
  if (event.target.id === 'runs-cmp-a' || event.target.id === 'runs-cmp-b') {
    state.runs[event.target.id === 'runs-cmp-a' ? 'cmpA' : 'cmpB'] = event.target.value;
    const slot = $('#runs-compare');
    if (slot) slot.innerHTML = runsCompareSlot(runsVisibleEntries());
    return;
  }
  const runsFilter = event.target.closest('[data-runs-filter]');
  if (runsFilter) {
    state.runs.filters[runsFilter.dataset.runsFilter] = runsFilter.value;
    render();
    return;
  }
  if (event.target.id !== 'canvas-ref') return;
  state.canvas.ref = event.target.value;
  state.canvas.positions = null;
  render();
});
$('#close-drawer').addEventListener('click', closeDrawer);
$('#drawer-backdrop').addEventListener('click', closeDrawer);
$('#refresh').addEventListener('click', async () => {
  try {
    state.systems.interfaceHealth = {};
    state.brain.updates.data = null;
    await loadModel();
    if (state.view === 'anatomy' && state.brain.mode === 'updates') await loadBrainUpdates();
    toast('Estado local recompilado.');
  } catch (error) { toast(label(error.message), 'bad'); }
});
document.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target instanceof HTMLElement
    && event.target.matches('[role="button"][data-open-system], [role="button"][data-open-skill], [role="button"][data-open-source], [role="button"][data-open-routine], [role="button"][data-open-experiment], [role="button"][data-case-open], [role="button"][data-open-brain-run], [role="button"][data-society-open]')) {
    event.preventDefault();
    event.target.click();
    return;
  }
  if (event.key !== 'Escape') return;
  if ($('#confirm-dialog')?.open) return; // o <dialog> cuida do próprio Escape
  closeDrawer();
});

/* --- Command palette (⌘K) — ir a qualquer view, rotina, sistema ou experimento --- */

const palette = { open: false, query: '', index: 0, items: [] };

function paletteGlyph(view) {
  const direct = document.querySelector(`#navigation [data-view="${view}"] .nav-glyph`);
  if (direct) return direct.innerHTML;
  for (const button of document.querySelectorAll('#navigation [data-views]')) {
    if (button.dataset.views.split(',').includes(view)) return button.querySelector('.nav-glyph').innerHTML;
  }
  return '';
}

function paletteItems() {
  const items = Object.entries(titles).map(([view, [title]]) => ({
    glyph: view, title, hint: 'View', run: () => { state.view = view; closeDrawer(); render(); },
  }));
  const model = state.model;
  if (model) {
    model.routines.forEach((routine) => items.push({
      glyph: 'routines', title: routine.name, hint: 'Rotina',
      run: () => { state.view = 'routines'; render(); openDrawer(routine.routine_id); },
    }));
    (model.systems || []).forEach((system) => items.push({
      glyph: 'systems', title: system.name, hint: 'Sistema → Inspecionar operação',
      run: () => { closeDrawer(); openWorkspace(system.system_id); },
    }));
    (state.skills.data?.skills || []).forEach((skill) => items.push({
      glyph: 'skills', title: skillTitle(skill.name), hint: `Skill · ${skillOriginLabel(skill)}`,
      run: () => { state.view = 'skills'; render(); openSkill(skill.skill_id); },
    }));
    (model.experiments || []).forEach((experiment) => items.push({
      glyph: 'experiments', title: experiment.name, hint: experiment.experiment_id,
      run: () => { state.view = 'experiments'; render(); openExperiment(experiment.experiment_id); },
    }));
  }
  return items;
}

function paletteRender() {
  const query = palette.query.trim().toLowerCase();
  const all = paletteItems();
  palette.items = query ? all.filter((item) => `${item.title} ${item.hint}`.toLowerCase().includes(query)).slice(0, 12) : all.slice(0, 12);
  if (palette.index >= palette.items.length) palette.index = Math.max(0, palette.items.length - 1);
  $('#palette-list').innerHTML = palette.items.map((item, index) => `<li role="option" data-palette-index="${index}" aria-selected="${index === palette.index}"><span class="palette-glyph">${paletteGlyph(item.glyph)}</span>${escapeHtml(item.title)}<small>${escapeHtml(item.hint)}</small></li>`).join('')
    || '<li class="palette-empty">Nada com esse nome no estado local.</li>';
}

function openPalette() {
  palette.open = true; palette.query = ''; palette.index = 0;
  if (!state.skills.data && !state.skills.loading) void loadSkills();
  $('#palette').hidden = false; $('#palette-backdrop').hidden = false;
  const input = $('#palette-input');
  input.value = '';
  paletteRender();
  input.focus();
}

function closePalette() {
  palette.open = false;
  $('#palette').hidden = true; $('#palette-backdrop').hidden = true;
}

$('#open-palette').addEventListener('click', openPalette);
$('#palette-backdrop').addEventListener('click', closePalette);
$('#palette-input').addEventListener('input', (event) => { palette.query = event.target.value; palette.index = 0; paletteRender(); });
$('#palette-list').addEventListener('click', (event) => {
  const item = event.target.closest('[data-palette-index]');
  if (!item) return;
  event.stopPropagation();
  closePalette();
  palette.items[Number(item.dataset.paletteIndex)]?.run();
});

// Captura para ganhar do Escape que fecha o drawer.
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    palette.open ? closePalette() : openPalette();
    return;
  }
  if (!palette.open) return;
  if (event.key === 'Escape') { event.stopPropagation(); closePalette(); return; }
  if (event.key === 'ArrowDown' || event.key === 'Down') { event.preventDefault(); palette.index = Math.min(palette.index + 1, palette.items.length - 1); paletteRender(); return; }
  if (event.key === 'ArrowUp' || event.key === 'Up') { event.preventDefault(); palette.index = Math.max(palette.index - 1, 0); paletteRender(); return; }
  if (event.key === 'Enter' || event.key === 'Return' || event.keyCode === 13) { event.preventDefault(); const item = palette.items[palette.index]; closePalette(); item?.run(); }
}, true);

/* --- Sidebar colapsável + atalhos globais --- */

function setNavCollapsed(collapsed) {
  document.body.dataset.nav = collapsed ? 'collapsed' : 'open';
  try { localStorage.setItem('cb-nav', document.body.dataset.nav); } catch { /* preferência local, nunca crítica */ }
}
setNavCollapsed((() => { try { return localStorage.getItem('cb-nav') === 'collapsed'; } catch { return false; } })());
$('#collapse-nav')?.addEventListener('click', () => setNavCollapsed(document.body.dataset.nav !== 'collapsed'));

document.addEventListener('keydown', (event) => {
  if (palette.open) return;
  const target = event.target;
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
  if (event.key === '[') { setNavCollapsed(document.body.dataset.nav !== 'collapsed'); return; }
  if (state.view === 'canvas' && state.canvas.scope !== 'brain' && !state.busy) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); cycleCanvasRef(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); cycleCanvasRef(1); }
  }
});

try {
  $('#sys-line').textContent = `${window.location.host} · file-only · reference-only`;
  state.csrf = (await getJson('/api/session')).csrf_token;
  await loadModel();
} catch (error) {
  $('#content').innerHTML = empty('Console indisponível', `Não foi possível compilar o estado local: ${label(error.message)}.`);
  toast(label(error.message), 'bad');
}
