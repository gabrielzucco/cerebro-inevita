import { mountOperationalCanvas } from '/canvas.bundle.js';

const state = {
  model: null,
  csrf: '',
  view: 'routines',
  selectedRoutine: null,
  selectedJudgment: null,
  selectedExperiment: null,
  busy: false,
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
  'changes-requested': 'Pedir ajuste', rejected: 'Rejeitado',
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
  output: 'Output', gate: 'Gate', judgment: 'Julgamento',
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
  const active = model.today.active.length;
  const ready = model.today.ready_to_work.length;
  const judgments = model.counts.judgments;
  return [
    ['Rotinas ativas', active, 'Rodam apenas quando o estado canônico está ativo', 'signal'],
    ['Aguardam julgamento', judgments, 'Outputs privados que ainda precisam do seu martelo', 'decision'],
    ['Prontas para trabalhar', ready, 'Replay manual não liga o agendamento', 'play'],
    ['Recibos privados', model.routines.reduce((total, routine) => total + routine.receipts.length, 0), 'Prompt e output não aparecem no ledger', 'receipt'],
  ].map(([title, value, description, icon]) => `<article class="summary-card"><span class="summary-icon ${icon}"></span><div><small>${title}</small><strong>${value}</strong><p>${description}</p></div></article>`).join('');
}

function routineCard(routine) {
  const access = routine.access.length ? routine.access.map((item) => badge(item.assurance, item.assurance === 'runtime-enforced' ? 'good' : 'neutral')).join('') : '<span class="muted">Sem grants declarados</span>';
  const next = routine.next_scheduled_at ? `Próxima ${fmtDate(routine.next_scheduled_at)}` : routine.state.status === 'disabled' ? 'Relógio desligado' : 'Sem próxima ocorrência';
  return `<article class="routine-card" data-open-routine="${escapeHtml(routine.routine_id)}">
    <div class="routine-card-head"><div class="routine-symbol">↻</div><div><p class="micro">${escapeHtml(routine.system_ref)}</p><h3>${escapeHtml(routine.name)}</h3></div>${badge(routine.health_reason_code)}</div>
    <p class="routine-purpose">${escapeHtml(routine.schedule)}</p>
    <div class="routine-meta"><span><b>Executor</b>${escapeHtml(routine.binding.adapter)} · ${escapeHtml(routine.binding.requested_model)}</span><span><b>Estado</b>${escapeHtml(next)}</span></div>
    <div class="assurance-row">${access}</div>
    <div class="card-footer"><span>${routine.receipts.length ? `Último recibo ${fmtDate(routine.receipts[0].completed_at)}` : 'Nenhuma execução registrada'}</span><button data-open-routine="${escapeHtml(routine.routine_id)}">Inspecionar <b>→</b></button></div>
  </article>`;
}

function empty(title, body) {
  return `<div class="empty"><div class="empty-mark">◇</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></div>`;
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
  return `<div class="section-heading"><div><p class="eyebrow">CONTROL PLANE</p><h2>Todas as rotinas</h2></div><p>Abrir e inspecionar nunca executa modelos. O relógio só liga após replay e aprovação.</p></div>
    <div class="routine-list">${state.model.routines.length ? state.model.routines.map(routineCard).join('') : empty('Nenhuma rotina instalada', 'Crie um Routine Contract para o primeiro trabalho recorrente.')}</div>`;
}

function renderToday() {
  const ids = [...state.model.today.needs_attention, ...state.model.today.ready_to_work, ...state.model.today.active];
  const routines = ids.map((id) => state.model.routines.find((routine) => routine.routine_id === id)).filter(Boolean);
  const pending = state.model.judgments.filter((item) => item.judgment.status === 'pending');
  return `<div class="section-heading"><div><p class="eyebrow">AGORA</p><h2>Mesa de operação</h2></div><p>Primeiro o que pede julgamento; depois o que já está pronto para trabalhar.</p></div>
    ${pending.length ? `<div class="today-block"><p class="micro">OUTPUTS PARA JULGAR</p>${judgmentList(pending)}</div>` : ''}
    <div class="routine-list">${routines.length ? routines.map(routineCard).join('') : empty('Tudo quieto', 'Nenhuma rotina pede sua atenção agora.')}</div>`;
}

function canvasRefOptions() {
  if (state.canvas.scope === 'system') {
    return state.model.systems.map((system) => `<option value="${escapeHtml(system.system_id)}"${state.canvas.ref === system.system_id ? ' selected' : ''}>${escapeHtml(system.name)}</option>`).join('');
  }
  if (state.canvas.scope === 'run') {
    return allReceipts().map((receipt) => `<option value="${escapeHtml(receipt.receipt_id)}"${state.canvas.ref === receipt.receipt_id ? ' selected' : ''}>${escapeHtml(receipt.routine_name)} · ${fmtDate(receipt.completed_at)}</option>`).join('');
  }
  return '';
}

function renderCanvas() {
  const hasRef = state.canvas.scope !== 'brain';
  return `<div class="canvas-page">
    <div class="section-heading canvas-heading"><div><p class="eyebrow">OPERATIONAL GRAPH</p><h2>O cérebro em movimento</h2></div><p>Contrato e execução no mesmo mapa. Nó aceso exige recibo ou evento real.</p></div>
    <div class="canvas-toolbar" role="toolbar" aria-label="Controles do Canvas">
      <div class="canvas-segmented" aria-label="Escala do mapa">
        <button data-canvas-scope="brain" class="${state.canvas.scope === 'brain' ? 'active' : ''}">Cérebro</button>
        <button data-canvas-scope="system" class="${state.canvas.scope === 'system' ? 'active' : ''}">Sistema</button>
        <button data-canvas-scope="run" class="${state.canvas.scope === 'run' ? 'active' : ''}">Run</button>
      </div>
      ${hasRef ? `<label class="canvas-select-label"><span>${state.canvas.scope === 'system' ? 'Sistema' : 'Execução real'}</span><select id="canvas-ref">${canvasRefOptions()}</select></label>` : '<div class="canvas-spacer"></div>'}
      <button class="canvas-tool" data-canvas-fit>Ver mapa inteiro</button>
      <button class="canvas-tool ${state.canvas.editable ? 'active' : ''}" data-canvas-edit>${state.canvas.editable ? 'Bloquear' : 'Reorganizar'}</button>
      <button class="canvas-tool primary" data-canvas-save disabled>Salvar layout</button>
    </div>
    <div class="canvas-stage-shell">
      <div class="canvas-graph-pane">
        <div class="canvas-ambient one"></div><div class="canvas-ambient two"></div>
        <div id="operational-canvas" class="operational-canvas"><div class="loading"><i></i><span>Compilando grafo local…</span></div></div>
        <div id="canvas-origin" class="canvas-origin"></div>
        <div class="canvas-legend" aria-label="Legenda de estados">
          <span class="declared"><i></i>Declarado</span><span class="running"><i></i>Executando</span><span class="completed"><i></i>Concluído</span><span class="gap"><i></i>Lacuna</span><span class="failed"><i></i>Falhou</span>
        </div>
      </div>
      <aside id="canvas-inspector" class="canvas-inspector"><p class="micro">DETALHES DO OBJETO</p><h3>Selecione um nó</h3><p>O logo mostra a Fonte; o ícone mostra a função. O contorno e o texto mostram o estado real.</p></aside>
    </div>
    <details class="canvas-accessible"><summary>Ver equivalente em lista</summary><div id="canvas-list"></div></details>
    <div class="boundary-note"><b>Layout ≠ arquitetura</b>Reorganizar salva apenas coordenadas privadas nesta máquina. Criar ou remover Fonte, Sistema, gate ou aresta continua exigindo mudança de contrato.</div>
  </div>`;
}

function renderJudgments() {
  const pending = state.model.judgments.filter((item) => item.judgment.status === 'pending');
  const decided = state.model.judgments.filter((item) => item.judgment.status !== 'pending');
  return `<div class="section-heading"><div><p class="eyebrow">MARTELO HUMANO</p><h2>Caixa de Julgamento</h2></div><p>Abra o output privado, decida e deixe rastro. Nenhum botão desta tela executa ação externa.</p></div>
    <div class="judgment-section"><div class="subheading"><h3>Pendentes</h3><span>${pending.length}</span></div>${pending.length ? judgmentList(pending) : empty('Nenhum output pendente', 'O próximo run concluído aparecerá aqui para julgamento.')}</div>
    <div class="judgment-section"><div class="subheading"><h3>Histórico</h3><span>${decided.length}</span></div>${decided.length ? judgmentList(decided) : '<p class="muted">Nenhum julgamento registrado ainda.</p>'}</div>`;
}

function renderAreas() {
  return `<div class="section-heading"><div><p class="eyebrow">MAPA PLURAL</p><h2>Áreas da empresa</h2></div><p>Áreas organizam a leitura. Fontes continuam compartilháveis entre Sistemas.</p></div><div class="object-grid">${state.model.areas.map((area) => `<article class="object-card"><span class="object-index">${String(area.system_refs.length).padStart(2, '0')}</span><p class="micro">ÁREA</p><h3>${escapeHtml(area.name)}</h3><p>${area.system_refs.length} sistema(s) · ${area.routine_refs.length} rotina(s)</p><div class="ref-list">${area.system_refs.map((ref) => `<code>${escapeHtml(ref)}</code>`).join('')}</div></article>`).join('') || empty('Nenhuma área mapeada', 'Áreas aparecem quando Sistemas possuem contratos válidos.')}</div>`;
}

function renderSystems() {
  return `<div class="section-heading"><div><p class="eyebrow">RESULTADOS</p><h2>Sistemas</h2></div><p>Mapeado tem contrato. Configurado tem recuperação declarada. Ativo já possui operação governada e recibo.</p></div><div class="object-grid">${state.model.systems.map((system) => {
    const configured = system.migration_stage === 'configured';
    const active = system.migration_stage === 'active';
    const componentStatuses = Object.values(system.component_statuses || {});
    const readyComponents = componentStatuses.filter((status) => ['ativo', 'repetivel', 'instrumentado'].includes(status)).length;
    const contractRef = system.contract_id !== system.system_id ? `<code>${escapeHtml(system.contract_id)}</code>` : `<code>v${escapeHtml(system.version)}</code>`;
    const stageLabel = { mapped: 'Mapeado', configured: 'Configurado', active: 'Ativo' }[system.migration_stage] || label(system.migration_stage);
    return `<article class="object-card"><div class="object-card-top">${badge(system.migration_stage, active ? 'good' : configured ? 'neutral' : 'warn', stageLabel)}${contractRef}</div><p class="micro">${escapeHtml(system.area_ref)}${system.human_maturity ? ` · ${escapeHtml(system.human_maturity)}` : ''}</p><h3>${escapeHtml(system.name)}</h3><p>${escapeHtml(system.result)}</p>${system.next_gate ? `<div class="boundary-note"><b>Próximo gate</b>${escapeHtml(system.next_gate)}</div>` : ''}<div class="object-stats"><span><b>${system.source_refs.length}</b> fontes</span><span><b>${system.retrieval_status === 'declared' ? 'Sim' : 'Não'}</b> retrieval</span>${componentStatuses.length ? `<span><b>${readyComponents}/${componentStatuses.length}</b> componentes ativos</span>` : ''}</div></article>`;
  }).join('') || empty('Nenhum Sistema contratado', 'O Console não cria verdade editorial: ele espera System Contracts reais.')}</div>`;
}

function renderSources() {
  return `<div class="section-heading"><div><p class="eyebrow">CASAS DE VERDADE</p><h2>Fontes</h2></div><p>Mapear não é conectar. A garantia mostrada depende de quem realmente possui a custódia.</p></div><div class="object-grid">${state.model.sources.map((source) => `<article class="object-card"><div class="object-card-top">${badge(source.status, source.status === 'active' ? 'good' : 'neutral')}${badge(source.assurance, source.assurance === 'runtime-enforced' ? 'good' : 'neutral')}</div><p class="micro">${escapeHtml(source.type)}</p><h3>${escapeHtml(source.name)}</h3><p>Custódia: ${escapeHtml(label(source.custody))} · PII: ${escapeHtml(label(source.pii))}</p><div class="ref-list">${source.modes.map((mode) => `<code>${escapeHtml(mode)}</code>`).join('')}</div></article>`).join('') || empty('Nenhuma Fonte contratada', 'Fontes aparecem sem abrir ou copiar o conteúdo original.')}</div>`;
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
  const experiments = state.model.experiments || [];
  const running = experiments.filter((item) => item.status === 'running').length;
  const ready = experiments.filter((item) => item.status === 'ready-for-read').length;
  const decided = experiments.filter((item) => item.status === 'decided').length;
  const unlinked = experiments.filter((item) => item.learning_status === 'unlinked').length;
  return `<div class="section-heading"><div><p class="eyebrow">DECISÃO ANTES DO DADO</p><h2>Experimentos</h2></div><p>Uma mudança controlada atravessa Sistemas, Runs, medição e martelo. Contrato congelado não se edita depois do dado.</p></div>
    <div class="experiment-kpis"><span><b>${running}</b> coletando</span><span><b>${ready}</b> prontos para leitura</span><span><b>${decided}</b> decididos</span><span class="${unlinked ? 'attention' : ''}"><b>${unlinked}</b> aprendizados sem vínculo</span></div>
    <div class="experiment-grid">${experiments.map((experiment) => `<article class="experiment-card" data-open-experiment="${escapeHtml(experiment.experiment_id)}">
      <div class="experiment-card-head"><div><p class="micro">${escapeHtml(experiment.experiment_id)} · ${escapeHtml(experiment.system_ref)}</p><h3>${escapeHtml(experiment.name)}</h3></div>${badge(experiment.status, experiment.status === 'decided' ? 'good' : experiment.status === 'running' ? 'neutral' : experiment.status === 'ready-for-read' ? 'warn' : tone(experiment.status))}</div>
      ${experimentProgress(experiment)}
      <div class="experiment-card-stats"><span><b>${experiment.arm_count || '—'}</b> braços${experiment.arms_status === 'not-structured' ? ' não estruturados' : ''}</span><span><b>${experiment.run_count}</b> Runs ligados</span><span><b>${experiment.amendment_count}</b> emendas</span>${experiment.contract_gap_count ? `<span class="warn-text"><b>${experiment.contract_gap_count}</b> lacunas legadas</span>` : ''}</div>
      <div class="experiment-card-footer"><div><span>Métrica primária</span><code>${escapeHtml(experiment.primary_metric_ref)}</code></div><button data-open-experiment="${escapeHtml(experiment.experiment_id)}">Abrir contrato <b>→</b></button></div>
    </article>`).join('') || empty('Nenhum Experimento contratado', 'Congele um pré-registro ou importe um ledger existente para criar o primeiro objeto.')}</div>
    <div class="boundary-note"><b>Experimento ≠ execução</b>Um experimento pode produzir vários briefings, criativos e Runs em mais de um Sistema. Cada Run se liga por entity_ref; sem essa referência, o Console mostra a lacuna.</div>`;
}

function allReceipts() {
  return state.model.routines.flatMap((routine) => routine.receipts.map((receipt) => ({ ...receipt, routine_name: routine.name, routine_id: routine.routine_id }))).sort((a, b) => Date.parse(b.completed_at) - Date.parse(a.completed_at));
}

function renderRuns() {
  const receipts = allReceipts();
  return `<div class="section-heading"><div><p class="eyebrow">RASTRO</p><h2>Execuções</h2></div><p>Run Record mostra o contexto selecionado por referência. O conteúdo continua privado.</p></div><div class="table-wrap"><table><thead><tr><th>Rotina</th><th>Quando</th><th>Gatilho</th><th>Estado</th><th>Contexto selecionado</th><th>Modelo</th><th>Output ref.</th></tr></thead><tbody>${receipts.map((receipt) => `<tr><td><strong>${escapeHtml(receipt.routine_name)}</strong><small>${escapeHtml(receipt.receipt_ref)}</small></td><td>${fmtDate(receipt.completed_at)}</td><td>${escapeHtml(label(receipt.trigger))}</td><td>${badge(receipt.status)}</td><td>${receipt.context_status === 'recorded' ? `<button class="table-action" data-open-context="${escapeHtml(receipt.receipt_id)}">${receipt.context_source_count} fontes →</button>` : badge('context-not-recorded', 'neutral')}</td><td>${escapeHtml(receipt.requested_model)}<small>${escapeHtml(receipt.model_observation)}</small></td><td><code>${escapeHtml(receipt.output_ref || '—')}</code></td></tr>`).join('') || `<tr><td colspan="7">Nenhum recibo ainda.</td></tr>`}</tbody></table></div>`;
}

function renderGovernance() {
  const grants = state.model.routines.flatMap((routine) => routine.access.map((access) => ({ ...access, routine })));
  return `<div class="section-heading"><div><p class="eyebrow">AUTORIDADE</p><h2>Governança de acesso</h2></div><p>Revogação bloqueia Runs futuros. Ela não apaga um contexto já consumido.</p></div><div class="object-grid">${grants.map(({ routine, ...access }) => {
    const grantId = access.grant_ref.replace(/^access-grant:/, '');
    const revoke = access.grant_status === 'granted' && access.revocation_effect === 'future-only'
      ? `<button class="secondary-action" data-revoke-grant="${escapeHtml(grantId)}">Revogar acesso futuro</button>` : '';
    return `<article class="object-card"><div class="object-card-top">${badge(access.grant_status, access.grant_status === 'granted' ? 'good' : 'bad')}${badge(access.assurance, access.assurance === 'runtime-enforced' ? 'good' : 'neutral')}</div><p class="micro">${escapeHtml(routine.name)}</p><h3>${escapeHtml(access.source_ref)}</h3><p>${escapeHtml(access.action)} · ${escapeHtml(access.requested_mode)}</p><div class="boundary-note"><b>Revogação</b>${escapeHtml(label(access.revocation_effect))}</div>${revoke}</article>`;
  }).join('') || empty('Nenhuma concessão declarada', 'A rotina pode existir sem grant quando trabalha apenas com instrução local.')}</div>`;
}

function renderHealth() {
  const rows = state.model.routines.map((routine) => ({ name: routine.name, reason: routine.health_reason_code, binding: routine.binding.auth_status }));
  return `<div class="section-heading"><div><p class="eyebrow">READBACK</p><h2>Saúde operacional</h2></div><p>Estado derivado de arquivos canônicos, nunca de um painel editorial paralelo.</p></div><div class="health-list">${rows.map((row) => `<article><span class="health-dot ${tone(row.reason)}"></span><div><h3>${escapeHtml(row.name)}</h3><p>${escapeHtml(label(row.reason))}</p></div><code>${escapeHtml(row.binding)}</code></article>`).join('')}${state.model.issues.map((issue) => `<article><span class="health-dot bad"></span><div><h3>${escapeHtml(label(issue.reason_code))}</h3><p>${escapeHtml(issue.ref)}</p></div></article>`).join('')}</div><div class="cache-note"><strong>Índice reconstruível</strong><p>Este V0 não mantém banco nem cache persistente. Cada atualização recompila contratos, bindings, estado e recibos locais.</p></div>`;
}

function renderSociety() {
  return `<div class="society-panel"><span class="society-star">✦</span><p class="eyebrow">REDE DE CAPACIDADE</p><h2>Society</h2><p>Sistemas validados podem descer para o seu Cérebro. Seu contexto, seus outputs e suas decisões continuam locais.</p><div class="society-boundary"><span>Circula</span><b>Protocolo · Capability · atualizações</b><span>Não circula</span><b>Fontes · contexto · outputs · decisões</b></div></div>`;
}

const renderers = { today: renderToday, canvas: renderCanvas, areas: renderAreas, systems: renderSystems, sources: renderSources, experiments: renderExperiments, routines: renderRoutines, judgments: renderJudgments, runs: renderRuns, governance: renderGovernance, health: renderHealth, society: renderSociety };
const titles = {
  today: ['Hoje', 'O que pede julgamento e o que já está pronto para trabalhar.'],
  canvas: ['Canvas Operacional', 'Mapa do Cérebro, contrato do Sistema e Execution Trace do Run.'],
  areas: ['Mapa / Áreas', 'A empresa plural, sem transformar navegação em casa da verdade.'],
  systems: ['Sistemas', 'Resultados executáveis ligados ao contexto real do negócio.'],
  sources: ['Fontes', 'Casas de verdade, autoridade, frescor e garantia de acesso.'],
  experiments: ['Experimentos', 'Hipótese, execução, medição, martelo e aprendizado ligados ao Sistema.'],
  routines: ['Rotinas', 'Quando o cérebro trabalha, com qual contexto e quem precisa decidir.'],
  judgments: ['Julgamento', 'Outputs privados esperando decisão humana rastreável.'],
  runs: ['Execuções', 'O rastro reference-only de cada tentativa.'],
  governance: ['Governança', 'Quem pode acessar o quê e qual controle existe de verdade.'],
  health: ['Saúde', 'Conflitos e degradações derivados do estado canônico.'],
  society: ['Society', 'A rede distribui capacidade; o contexto da empresa não circula.'],
};

function render() {
  if (!state.model) return;
  const [title, subtitle] = titles[state.view];
  $('#page-title').textContent = title;
  $('#page-subtitle').textContent = subtitle;
  $('#summary').innerHTML = summaryCards();
  if (state.canvas.controller) { state.canvas.controller.destroy(); state.canvas.controller = null; }
  $('#content').innerHTML = renderers[state.view]();
  $('#updated-at').textContent = `Estado local · ${fmtDate(state.model.generated_at)}`;
  document.querySelectorAll('[data-count]').forEach((element) => { element.textContent = state.model.counts[element.dataset.count] ?? 0; });
  document.querySelectorAll('[data-view]').forEach((element) => element.classList.toggle('active', element.dataset.view === state.view));
  if (state.view === 'canvas') void mountCanvasView();
}

function canvasEndpoint() {
  if (state.canvas.scope === 'brain') return '/api/graphs/brain';
  if (state.canvas.scope === 'system') return `/api/graphs/systems/${state.canvas.ref}`;
  return `/api/graphs/runs/${state.canvas.ref}`;
}

function canvasInspector(node) {
  const inspector = $('#canvas-inspector');
  if (!inspector) return;
  const details = Object.entries(node.details || {}).filter(([, value]) => value !== null && value !== undefined);
  inspector.innerHTML = `<p class="micro">${escapeHtml(label(node.kind))} · ${escapeHtml(label(node.state))}</p><h3>${escapeHtml(node.label)}</h3><div class="canvas-inspector-state">${badge(node.state, tone(node.state))}${node.actual ? '<span>caminho real</span>' : '<span>contrato</span>'}</div><dl>${details.map(([key, value]) => `<div><dt>${escapeHtml(key.replaceAll('_', ' '))}</dt><dd>${escapeHtml(typeof value === 'object' ? JSON.stringify(value) : value)}</dd></div>`).join('')}</dl>`;
}

function canvasList(graph) {
  return `<table><thead><tr><th>Objeto</th><th>Tipo</th><th>Estado</th><th>Rastro</th></tr></thead><tbody>${graph.nodes.map((node) => `<tr><td><button class="table-action" data-canvas-inspect-node="${escapeHtml(node.id)}">${escapeHtml(node.label)} →</button></td><td>${escapeHtml(label(node.kind))}</td><td>${escapeHtml(label(node.state))}</td><td>${node.actual ? 'Run real' : 'Contrato'}</td></tr>`).join('')}</tbody></table>`;
}

async function mountCanvasView() {
  if (state.canvas.scope === 'system' && !state.canvas.ref) state.canvas.ref = state.model.systems.find((item) => item.migration_stage === 'active')?.system_id || state.model.systems[0]?.system_id;
  if (state.canvas.scope === 'run' && !state.canvas.ref) state.canvas.ref = allReceipts()[0]?.receipt_id;
  const container = $('#operational-canvas');
  if (!container || (state.canvas.scope !== 'brain' && !state.canvas.ref)) {
    if (container) container.innerHTML = empty('Nada para desenhar', 'Ainda não existe objeto real nesta escala.');
    return;
  }
  try {
    const graph = await getJson(canvasEndpoint());
    if (state.view !== 'canvas') return;
    state.canvas.graph = graph;
    state.canvas.positions = null;
    $('#canvas-origin').innerHTML = graph.trace_origin
      ? `<span>${graph.trace_origin === 'recorded' ? 'TRACE V1' : 'TRACE RECONSTRUÍDO'}</span><b>${escapeHtml(graph.trace_origin === 'recorded' ? `${graph.trace_events} eventos` : 'granularidade limitada')}</b>`
      : `<span>CONTRATO</span><b>${graph.nodes.length} nós · ${graph.edges.length} arestas</b>`;
    $('#canvas-list').innerHTML = canvasList(graph);
    state.canvas.controller = await mountOperationalCanvas({
      container,
      model: graph,
      editable: state.canvas.editable,
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

async function saveCanvasLayout() {
  if (!state.canvas.graph || !state.canvas.positions) return;
  const approvedBy = window.prompt('Quem está salvando o layout? Use uma referência sem dado pessoal.', 'role-founder') || '';
  if (!approvedBy) return;
  if (!window.confirm('Salvar somente as posições dos nós nesta máquina? A topologia e os contratos não serão alterados.')) return;
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
  $('#drawer-backdrop').hidden = false;
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
  $('#drawer-backdrop').hidden = false;
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

function correctionButtons(detail) {
  const actions = detail.correction_actions || {};
  const buttons = [];
  if (actions.can_rerun_with_correction) buttons.push('<button class="action warn" data-correction-action="rerun">Reexecutar com correção</button>');
  if (actions.can_compare) buttons.push('<button class="action" data-correction-action="compare">Comparar runs</button>');
  if (actions.can_create_learning_candidate) buttons.push('<button class="action primary" data-correction-action="learn">Criar candidato 1/3</button>');
  return buttons.join('');
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
  $('#drawer-backdrop').hidden = false;
  await loadContext(receiptId, $('#context-slot'));
}

async function openJudgment(receiptId) {
  state.selectedRoutine = null;
  state.selectedJudgment = receiptId;
  state.selectedExperiment = null;
  $('#drawer-content').innerHTML = '<div class="loading"><i></i><span>Abrindo output privado local…</span></div>';
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  $('#drawer-backdrop').hidden = false;
  try {
    const detail = await getJson(`/api/runs/${receiptId}/output`);
    const current = detail.judgment.summary;
    $('#drawer-content').innerHTML = `<div class="drawer-head"><p class="eyebrow">OUTPUT PRIVADO</p><h2>${escapeHtml(detail.receipt.routine_id)}</h2>${badge(current.status === 'pending' ? 'pending' : current.verdict)}</div>
      <div class="boundary-note"><b>Leitura local explícita</b>Este conteúdo não entrou no recibo, no read model ou na INEVITA. Abrir não executou modelo.</div>
      <section class="drawer-section"><div class="output-heading"><h3>Resultado</h3><span>${detail.output.bytes} bytes</span></div><pre class="private-output">${escapeHtml(detail.output.content)}</pre></section>
      ${detail.context_available ? `<section class="drawer-section"><div class="output-heading"><h3>Contexto selecionado</h3><button class="table-action" data-load-context="${escapeHtml(receiptId)}">Abrir Run Record V2 →</button></div><div id="context-slot"></div></section>` : ''}
      ${correctionSection(detail)}
      <section class="drawer-section"><h3>Seu julgamento</h3><p class="section-help">A nota fica privada. Pedir ajuste, rejeitar ou propor ação exige explicar por quê.</p><textarea id="judgment-note" maxlength="2000" placeholder="O que está certo, o que precisa mudar ou qual ação deveria ser considerada?"></textarea></section>
      <section class="drawer-section"><h3>Histórico imutável</h3><div class="timeline">${judgmentHistory(detail.judgment.history)}</div></section>
      <div class="boundary-note action-boundary"><b>Propor não é executar</b>“Propor ação” registra intenção local. Não cria task, não envia mensagem, não publica e não altera Fonte.</div>
      <div class="drawer-actions judgment-actions">${correctionButtons(detail)}<button class="action primary" data-judgment-action="approve">Aprovar</button><button class="action warn" data-judgment-action="changes">Pedir ajuste</button><button class="action" data-judgment-action="reject">Rejeitar</button><button class="action" data-judgment-action="propose-action">Propor ação</button></div>`;
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
  const approvedBy = window.prompt('Quem está julgando? Use uma referência sem dado pessoal.', 'role-founder') || '';
  if (!approvedBy) return;
  const message = payload.action_intent === 'propose-action'
    ? 'Registrar esta intenção local? Nenhuma ação externa será executada.'
    : `Registrar o julgamento “${label(payload.verdict)}”? O histórico anterior será preservado.`;
  if (!window.confirm(message)) return;
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
  const approvedBy = window.prompt('Quem está aprovando? Use uma referência sem dado pessoal.', 'role-founder') || '';
  if (!approvedBy) return;
  if (action === 'rerun') {
    if (!window.confirm('Reexecutar usando esta correção humana?\n\nA nota privada será enviada por stdin ao provider configurado e pode consumir sua assinatura. Ela não irá para a INEVITA, Git, logs ou recibos. Nenhuma ação externa será executada.')) return;
  } else if (!window.confirm('Criar candidato de aprendizado 1/3?\n\nIsso não altera o motor. Ainda serão necessários três casos comparáveis, replay e novo martelo humano.')) return;
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
  const approvedBy = window.prompt('Quem está aprovando a revogação? Use uma referência sem dado pessoal.', 'role-founder') || '';
  if (!approvedBy) return;
  if (!window.confirm('Revogar este acesso para Runs futuros?\n\nIsso não apaga outputs, recibos ou artefatos já consumidos. Nenhuma ação externa será executada.')) return;
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
    if (!window.confirm(`Rodar “${routine.name}” agora?\n\nIsso usa a sessão ${routine.binding.adapter} e pode consumir sua assinatura. Não ativa a agenda.`)) return;
  } else {
    approvedBy = window.prompt('Quem está aprovando? Use uma referência sem dado pessoal.', 'role-founder') || '';
    if (!approvedBy) return;
    if (action === 'confirm-legacy-pause') {
      if (!window.confirm('Confirme somente depois de pausar a agenda no fornecedor antigo. O Console registra o readback; ele não pausa o Claude por você.')) return;
      evidenceRef = window.prompt('Referência opaca da evidência de pausa:', 'readback:legacy-schedule-paused') || '';
      if (!evidenceRef) return;
    } else if (action === 'activate') {
      evidenceRef = routine.actions.activation_evidence_ref;
      if (!evidenceRef || !window.confirm('Ativar o relógio desta rotina usando o último replay manual concluído?')) return;
    } else if (!window.confirm(`${action === 'pause' ? 'Pausar' : 'Retomar'} esta rotina?`)) return;
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
  state.model = await getJson('/api/console');
  render();
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-view]');
  if (nav) { state.view = nav.dataset.view; closeDrawer(); render(); return; }
  const canvasScope = event.target.closest('[data-canvas-scope]');
  if (canvasScope) {
    state.canvas.scope = canvasScope.dataset.canvasScope;
    state.canvas.ref = state.canvas.scope === 'system'
      ? state.model.systems.find((item) => item.migration_stage === 'active')?.system_id || state.model.systems[0]?.system_id || null
      : state.canvas.scope === 'run' ? allReceipts()[0]?.receipt_id || null : null;
    state.canvas.positions = null;
    render();
    return;
  }
  if (event.target.closest('[data-canvas-fit]')) { state.canvas.controller?.fit(); return; }
  if (event.target.closest('[data-canvas-edit]')) {
    state.canvas.editable = !state.canvas.editable;
    state.canvas.positions = null;
    render();
    return;
  }
  if (event.target.closest('[data-canvas-save]')) { saveCanvasLayout(); return; }
  const canvasNode = event.target.closest('[data-canvas-inspect-node]');
  if (canvasNode && state.canvas.graph) {
    const node = state.canvas.graph.nodes.find((item) => item.id === canvasNode.dataset.canvasInspectNode);
    if (node) canvasInspector(node);
    return;
  }
  const open = event.target.closest('[data-open-routine]');
  if (open) { openDrawer(open.dataset.openRoutine); return; }
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
  const action = event.target.closest('[data-routine-action]');
  if (action) performAction(action.dataset.routineAction);
});
document.addEventListener('change', (event) => {
  if (event.target.id !== 'canvas-ref') return;
  state.canvas.ref = event.target.value;
  state.canvas.positions = null;
  render();
});
$('#close-drawer').addEventListener('click', closeDrawer);
$('#drawer-backdrop').addEventListener('click', closeDrawer);
$('#refresh').addEventListener('click', async () => {
  try { await loadModel(); toast('Estado local recompilado.'); } catch (error) { toast(label(error.message), 'bad'); }
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });

try {
  state.csrf = (await getJson('/api/session')).csrf_token;
  await loadModel();
} catch (error) {
  $('#content').innerHTML = empty('Console indisponível', `Não foi possível compilar o estado local: ${label(error.message)}.`);
  toast(label(error.message), 'bad');
}
