const state = {
  model: null,
  csrf: '',
  view: 'today',
  selectedRoutine: null,
  selectedJudgment: null,
  busy: false,
  activationTimer: null,
};

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
})[character]);
const fmtDate = (value, withTime = true) => value ? new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', ...(withTime ? { timeStyle: 'short' } : {}),
}).format(new Date(value)) : '—';

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
  available: 'Disponível', beta: 'Beta', locked: 'Exclusivo', future: 'Em construção', configured: 'Configurada',
  draft: 'Rascunho', 'pre-registered': 'Pré-registrado', passed: 'Aprovado', attention: 'Pede atenção',
  running: 'Em andamento', 'awaiting-confirmation': 'Aguardando você', succeeded: 'Concluído', cancelled: 'Cancelado', error: 'Pede atenção',
  'activation-busy': 'Já existe uma ativação em andamento',
  'activation-action-invalid': 'Esta etapa expirou; tente novamente',
  'hermes-installer-download-failed': 'Não foi possível baixar o instalador oficial',
  'hermes-installer-checksum-failed': 'A verificação de segurança do instalador falhou',
  'hermes-process-timeout': 'A operação demorou mais que o esperado',
  'hermes-process-failed': 'O Hermes não concluiu esta etapa',
  'hermes-install-not-detected': 'A instalação terminou, mas o Hermes ainda não foi encontrado',
  'hermes-version-unrecognized': 'Não foi possível confirmar a versão instalada do Hermes',
  'hermes-codex-login-failed': 'A autorização do Codex não foi concluída',
  'telegram-token-invalid': 'O token do BotFather não é válido',
  'telegram-request-failed': 'Não foi possível falar com o Telegram',
  'telegram-owner-timeout': 'Não encontramos seu /start; tente novamente',
  'hermes-doctor-attention': 'O diagnóstico encontrou algo para corrigir',
  'hermes-verification-failed': 'A checagem final não confirmou todos os componentes',
  'origin-invalid': 'A ação precisa partir deste Cockpit local',
};

function label(value) {
  return labels[value] || String(value || '—').replaceAll('-', ' ');
}

function tone(reason) {
  if (['active', 'completed', 'ready-manual-run', 'ready-to-activate', 'approved', 'decided', 'available', 'beta', 'configured', 'passed'].includes(reason)) return 'good';
  if (['legacy-schedule-not-paused', 'routine-paused', 'executor-authentication-required', 'pending', 'changes-requested', 'future', 'pre-registered', 'attention'].includes(reason)) return 'warn';
  return 'bad';
}

function badge(value, customTone = tone(value)) {
  return `<span class="badge ${customTone}"><i></i>${escapeHtml(label(value))}</span>`;
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

async function mutate(path, payload) {
  const response = await fetch(path, {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Cerebro-CSRF': state.csrf },
    body: JSON.stringify({ ...payload, confirm: true }),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.reason_code || 'request-failed');
  return value;
}

function summaryCards() {
  const model = state.model;
  const hermesReady = model.hermes?.activation?.phase === 'ready';
  return [
    ['Ativação do cérebro', `${model.activation.percent}%`, `${model.activation.completed}/${model.activation.total} marcos de valor`, 'signal'],
    ['Pedem seu martelo', model.counts.judgments + model.counts.decisions, 'Entregas e decisões aguardando você', 'decision'],
    ['Hermes', hermesReady ? 'ON' : 'OFF', hermesReady ? 'Disponível no Telegram' : 'Continue a configuração guiada', 'play'],
    ['Rotinas em operação', model.today.active.length, `${model.today.ready_to_work.length} pronta(s) para trabalhar`, 'receipt'],
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

function activationCompact() {
  const activation = state.model.activation;
  return `<article class="rail-card"><div class="rail-head"><div><p class="micro">ATIVAÇÃO</p><h3>Do início ao contexto que volta</h3></div><strong>${activation.percent}%</strong></div>
    <div class="progress-track"><i style="width:${activation.percent}%"></i></div>
    <ol class="mini-stages">${activation.stages.map((stage) => `<li class="${stage.completed ? 'done' : stage.current ? 'current' : ''}"><i>${stage.completed ? '✓' : stage.key}</i><span>${escapeHtml(stage.label)}</span></li>`).join('')}</ol>
    <button class="text-action" data-go-view="activation">Entender os marcos →</button></article>`;
}

function hermesCompact() {
  const hermes = state.model.hermes;
  const prepared = hermes.installed && hermes.codex_authenticated && hermes.project_bound && hermes.skills_trusted;
  const telegram = hermes.telegram.token_configured && hermes.telegram.allowlist_configured && hermes.telegram.allow_all_disabled;
  const ready = hermes.activation?.phase === 'ready';
  return `<article class="rail-card hermes-compact"><div class="rail-head"><div><p class="micro">HERMES</p><h3>Colega no Telegram</h3></div>${badge(ready ? 'active' : 'attention')}</div>
    <div class="mini-checks"><span class="${prepared ? 'done' : ''}">Hermes + Codex</span><span class="${telegram ? 'done' : ''}">Telegram</span><span class="${ready ? 'done' : ''}">Pronto</span></div>
    <button class="text-action" data-go-view="hermes">${ready ? 'Ver operação' : 'Continuar configuração'} →</button></article>`;
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
    <div class="judgment-head"><div><p class="micro">${escapeHtml(item.system_ref)} · ${escapeHtml(item.trigger)}</p><h3>${escapeHtml(item.routine_name)}</h3></div><div class="judgment-badges">${badge(status)}${action}${correction}</div></div>
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
  const nextStage = state.model.activation.stages.find((stage) => !stage.completed);
  const hermes = state.model.hermes;
  const setupNeeded = hermes.activation?.phase !== 'ready';
  return `<div class="now-grid">
    <section class="now-primary">
      <div class="section-heading"><div><p class="eyebrow">AGORA</p><h2>${pending.length ? 'Tem uma entrega esperando você' : setupNeeded ? 'Coloque seu cérebro no Telegram' : nextStage ? `Próximo marco: ${escapeHtml(nextStage.label)}` : 'Seu cérebro está em operação'}</h2></div><p>O Cockpit mostra o que já existe no seu cérebro. Você continua dando o martelo.</p></div>
      ${pending.length ? `<div class="today-block"><p class="micro">OUTPUTS PARA JULGAR</p>${judgmentList(pending)}</div>` : ''}
      ${!pending.length && setupNeeded ? `<article class="next-action"><span>01</span><div><p class="micro">PRÓXIMA AÇÃO</p><h3>Levar seu cérebro para o Telegram</h3><p>Autorize o Codex, conecte seu bot e confirme sua conta.</p></div><button class="action primary" data-go-view="hermes">Começar ativação →</button></article>` : ''}
      ${!pending.length && !setupNeeded && nextStage ? `<article class="next-action"><span>${escapeHtml(nextStage.key)}</span><div><p class="micro">ATIVAÇÃO</p><h3>${escapeHtml(nextStage.label)}</h3><p>${escapeHtml(nextStage.description)}</p></div><button class="action primary" data-go-view="activation">Ver progresso →</button></article>` : ''}
      <div class="today-block"><div class="subheading"><h3>Operação local</h3><span>${routines.length}</span></div><div class="routine-list">${routines.length ? routines.map(routineCard).join('') : empty('Mesa limpa', 'Nenhuma rotina pede atenção. Você pode começar pela ativação do cérebro.')}</div></div>
    </section>
    <aside class="now-rail">${activationCompact()}${hermesCompact()}</aside>
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
  return `<div class="section-heading"><div><p class="eyebrow">RESULTADOS</p><h2>Sistemas</h2></div><p>Sistema define o resultado. Rotina define quando e com qual executor ele trabalha.</p></div><div class="object-grid">${state.model.systems.map((system) => `<article class="object-card"><div class="object-card-top">${badge(system.status, system.status === 'active' ? 'good' : 'neutral')}<code>v${escapeHtml(system.version)}</code></div><p class="micro">${escapeHtml(system.area_ref)}</p><h3>${escapeHtml(system.name)}</h3><p>${escapeHtml(system.result)}</p><div class="object-stats"><span><b>${system.source_refs.length}</b> fontes</span><span><b>${system.retrieval_status === 'declared' ? 'Sim' : 'Não'}</b> retrieval</span></div></article>`).join('') || empty('Nenhum Sistema contratado', 'O Console não cria verdade editorial: ele espera System Contracts reais.')}</div>`;
}

function renderSources() {
  return `<div class="section-heading"><div><p class="eyebrow">CASAS DE VERDADE</p><h2>Fontes</h2></div><p>Mapear não é conectar. A garantia mostrada depende de quem realmente possui a custódia.</p></div><div class="object-grid">${state.model.sources.map((source) => `<article class="object-card"><div class="object-card-top">${badge(source.status, source.status === 'active' ? 'good' : 'neutral')}${badge(source.assurance, source.assurance === 'runtime-enforced' ? 'good' : 'neutral')}</div><p class="micro">${escapeHtml(source.type)}</p><h3>${escapeHtml(source.name)}</h3><p>Custódia: ${escapeHtml(label(source.custody))} · PII: ${escapeHtml(label(source.pii))}</p><div class="ref-list">${source.modes.map((mode) => `<code>${escapeHtml(mode)}</code>`).join('')}</div></article>`).join('') || empty('Nenhuma Fonte contratada', 'Fontes aparecem sem abrir ou copiar o conteúdo original.')}</div>`;
}

function allReceipts() {
  return state.model.routines.flatMap((routine) => routine.receipts.map((receipt) => ({ ...receipt, routine_name: routine.name, routine_id: routine.routine_id }))).sort((a, b) => Date.parse(b.completed_at) - Date.parse(a.completed_at));
}

function renderRuns() {
  const receipts = allReceipts();
  return `<div class="section-heading"><div><p class="eyebrow">RASTRO</p><h2>Execuções</h2></div><p>Referências suficientes para auditoria, sem guardar prompt, output ou erro cru.</p></div><div class="table-wrap"><table><thead><tr><th>Rotina</th><th>Quando</th><th>Gatilho</th><th>Estado</th><th>Modelo</th><th>Output ref.</th></tr></thead><tbody>${receipts.map((receipt) => `<tr><td><strong>${escapeHtml(receipt.routine_name)}</strong><small>${escapeHtml(receipt.receipt_ref)}</small></td><td>${fmtDate(receipt.completed_at)}</td><td>${escapeHtml(label(receipt.trigger))}</td><td>${badge(receipt.status)}</td><td>${escapeHtml(receipt.requested_model)}<small>${escapeHtml(receipt.model_observation)}</small></td><td><code>${escapeHtml(receipt.output_ref || '—')}</code></td></tr>`).join('') || `<tr><td colspan="6">Nenhum recibo ainda.</td></tr>`}</tbody></table></div>`;
}

function renderGovernance() {
  const grants = state.model.routines.flatMap((routine) => routine.access.map((access) => ({ ...access, routine })));
  return `<div class="section-heading"><div><p class="eyebrow">AUTORIDADE</p><h2>Governança de acesso</h2></div><p>Revogação vale para o futuro; uma cópia já exportada nunca é apagada retroativamente.</p></div><div class="object-grid">${grants.map(({ routine, ...access }) => `<article class="object-card"><div class="object-card-top">${badge(access.grant_status, access.grant_status === 'granted' ? 'good' : 'bad')}${badge(access.assurance, access.assurance === 'runtime-enforced' ? 'good' : 'neutral')}</div><p class="micro">${escapeHtml(routine.name)}</p><h3>${escapeHtml(access.source_ref)}</h3><p>${escapeHtml(access.action)} · ${escapeHtml(access.requested_mode)}</p><div class="boundary-note"><b>Revogação</b>${escapeHtml(label(access.revocation_effect))}</div></article>`).join('') || empty('Nenhuma concessão declarada', 'A rotina pode existir sem grant quando trabalha apenas com instrução local.')}</div>`;
}

function renderActivation() {
  const activation = state.model.activation;
  return `<div class="section-heading"><div><p class="eyebrow">CÉREBRO BASE</p><h2>Ativação até o valor real</h2></div><p>Instalar é o começo. O valor aparece quando um contexto aprovado volta sem você explicar tudo de novo.</p></div>
    <section class="activation-panel"><div class="activation-score"><span>${activation.percent}%</span><div><p class="micro">PROGRESSO</p><h3>${activation.complete ? 'Loop completo' : `${activation.completed} de ${activation.total} marcos`}</h3><p>${activation.run_id ? `Execução ${escapeHtml(activation.run_id)}` : 'Ainda não existe uma primeira execução registrada.'}</p></div></div>
      <div class="progress-track large"><i style="width:${activation.percent}%"></i></div>
      <ol class="activation-stages">${activation.stages.map((stage) => `<li class="${stage.completed ? 'done' : stage.current ? 'current' : ''}"><span>${stage.completed ? '✓' : stage.key}</span><div><p class="micro">${stage.key}</p><h3>${escapeHtml(stage.label)}</h3><p>${escapeHtml(stage.description)}</p>${stage.completed_at ? `<small>${fmtDate(stage.completed_at)}</small>` : ''}</div></li>`).join('')}</ol>
      <div class="activation-aha"><strong>T4 é o “aha moment”</strong><p>É quando a pessoa percebe que não está apenas conversando com uma IA: está construindo um cérebro que acumula contexto.</p></div>
    </section>`;
}

function renderConnections() {
  return `<div class="section-heading"><div><p class="eyebrow">FONTES REAIS</p><h2>Conexões</h2></div><p>Registrar onde uma fonte vive não abre seu conteúdo. Conectar acontece só quando um trabalho real exige.</p></div>
    <div class="object-grid">${state.model.connections.map((item) => `<article class="object-card"><div class="object-card-top">${badge(item.status, item.status === 'configured' ? 'good' : 'neutral')}</div><p class="micro">CONEXÃO</p><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p></article>`).join('') || empty('Nenhuma conexão mapeada', 'O cérebro funciona primeiro com arquivos locais; novas fontes entram por necessidade real.')}</div>`;
}

function renderDecisions() {
  const pendingOutputs = state.model.judgments.filter((item) => item.judgment.status === 'pending');
  return `<div class="section-heading"><div><p class="eyebrow">MARTELO HUMANO</p><h2>Decisões</h2></div><p>O agente apresenta evidência e proposta. A consequência só existe depois da sua decisão.</p></div>
    ${state.model.decisions.length ? `<div class="object-grid">${state.model.decisions.map((item) => `<article class="object-card"><div class="object-card-top">${badge(item.status)}</div><p class="micro">DECISÃO PENDENTE</p><h3>${escapeHtml(item.title)}</h3><p>Referência local: ${escapeHtml(item.ref)}</p></article>`).join('')}</div>` : ''}
    <div class="judgment-section"><div class="subheading"><h3>Entregas para julgar</h3><span>${pendingOutputs.length}</span></div>${pendingOutputs.length ? judgmentList(pendingOutputs) : empty('Nenhuma decisão pendente', 'Quando uma entrega exigir seu martelo, ela aparecerá aqui.')}</div>`;
}

function renderExperiments() {
  return `<div class="section-heading"><div><p class="eyebrow">DECISÃO ANTES DO DADO</p><h2>Experimentos</h2></div><p>Hipótese, régua e data de leitura vêm antes do resultado. A IA não escolhe o vencedor.</p></div>
    <div class="object-grid">${state.model.experiments.map((item) => `<article class="object-card"><div class="object-card-top">${badge(item.status)}</div><p class="micro">${escapeHtml(item.system_ref || 'SISTEMA A DEFINIR')}</p><h3>${escapeHtml(item.title)}</h3><p>${item.decision_due_at ? `Leitura em ${fmtDate(item.decision_due_at)}` : 'Aguardando janela de leitura.'}</p><div class="ref-list"><code>${escapeHtml(item.experiment_id)}</code></div></article>`).join('') || empty('Nenhum experimento ativo', 'Experimento nasce dentro de um Sistema, depois que um gargalo real foi comprovado.')}</div>`;
}

function renderHermes() {
  const hermes = state.model.hermes;
  const activation = hermes.activation || { phase: 'prepare', action: { status: 'idle', progress: 0 }, bot: {} };
  const action = activation.action || {};
  const locked = state.model.demo ? 'disabled' : '';
  const busy = ['running', 'awaiting-confirmation'].includes(action.status);
  const preparing = action.status === 'running' && ['prepare', 'codex-login'].includes(action.kind);
  const identifying = activation.phase === 'identify-owner' && action.kind === 'telegram-owner';
  const finalizing = activation.phase === 'finalizing';
  const brainReady = hermes.installed && hermes.project_bound && hermes.skills_trusted && hermes.codex_authenticated;
  const telegramReady = hermes.telegram.token_configured && hermes.telegram.allowlist_configured && hermes.telegram.allow_all_disabled;
  const ready = activation.phase === 'ready' && brainReady && telegramReady && hermes.gateway.running;
  const botUsername = activation.bot?.username;
  const progress = action.status === 'running' ? `<div class="activation-progress"><div><span>${Math.max(1, action.progress || 1)}%</span><b>${action.kind === 'codex-login' ? 'Aguardando autorização…' : finalizing ? 'Ligando seu colega…' : 'Preparando com segurança…'}</b></div><div class="progress-track"><i style="width:${Math.max(1, action.progress || 1)}%"></i></div>${finalizing ? '' : `<button class="text-action" data-activation-action="cancel" data-action-id="${escapeHtml(action.id)}">Cancelar</button>`}</div>` : '';
  const oauth = action.kind === 'codex-login' && (action.verification_url || action.user_code) ? `<div class="oauth-card"><p class="micro">AUTORIZAÇÃO OPENAI</p><h4>Confirme no navegador</h4>${action.user_code ? `<strong>${escapeHtml(action.user_code)}</strong><p>Copie este código se a página pedir.</p>` : '<p>Gerando seu código seguro…</p>'}${action.verification_url ? `<a class="action primary" href="${escapeHtml(action.verification_url)}" target="_blank" rel="noreferrer">Abrir autorização →</a>` : ''}</div>` : '';
  const prepareAction = !hermes.installed || !hermes.project_bound || !hermes.skills_trusted
    ? `<button class="action primary activation-cta" data-activation-action="prepare" ${locked || busy ? 'disabled' : ''}>Preparar Hermes →</button>`
    : !hermes.codex_authenticated
      ? `<button class="action primary activation-cta" data-activation-action="codex" ${locked || busy ? 'disabled' : ''}>Autorizar Codex →</button>`
      : '<div class="step-done-copy">Hermes instalado, Codex autorizado e cérebro conectado.</div>';
  const botForm = brainReady && !identifying && !finalizing && !ready ? `<div class="botfather-guide"><a href="https://t.me/BotFather" target="_blank" rel="noreferrer">Abrir @BotFather ↗</a><ol><li>Envie <code>/newbot</code></li><li>Escolha nome e username</li><li>Copie o token recebido</li></ol></div><form id="telegram-activation-form" class="telegram-form telegram-single" autocomplete="off"><label>Token do BotFather<input id="telegram-token" type="password" autocomplete="off" data-1p-ignore="true" spellcheck="false" maxlength="256" placeholder="Cole o token aqui" required></label><div class="form-actions"><button class="action primary activation-cta" type="submit" ${locked || busy ? 'disabled' : ''}>Conectar meu bot →</button></div></form><p class="fine-print">O token sai deste campo imediatamente e fica somente no arquivo secreto local do Hermes.</p>` : '';
  const identifyBody = identifying ? `<div class="identify-owner"><p class="micro">IDENTIFICAR VOCÊ</p>${activation.bot?.owner_candidate_display ? `<h4>Esta conta é você?</h4><strong>${escapeHtml(activation.bot.owner_candidate_display)}</strong><div class="owner-actions"><button class="action primary" data-activation-action="owner-confirm" data-action-id="${escapeHtml(action.id)}">Sou eu</button><button class="action" data-activation-action="owner-reject" data-action-id="${escapeHtml(action.id)}">Não sou eu</button></div>` : botUsername ? `<h4>Envie <code>/start</code> para @${escapeHtml(botUsername)}</h4><p>O Cockpit identifica a próxima conta privada. Nenhum ID precisa ser copiado.</p><a class="action primary" href="https://t.me/${escapeHtml(botUsername)}" target="_blank" rel="noreferrer">Abrir meu bot →</a><button class="text-action" data-activation-action="cancel" data-action-id="${escapeHtml(action.id)}">Cancelar busca</button>` : `<h4>Validando seu bot…</h4><p>Espere o nome do bot aparecer antes de enviar <code>/start</code>.</p>${progress}`}</div>` : '';
  const errorBox = action.status === 'error' ? `<div class="activation-error"><b>${escapeHtml(label(action.error_code))}</b><p>Nenhuma configuração incompleta foi mantida. Você pode repetir a etapa.</p></div>` : '';
  const steps = [
    { title: 'Preparar o Hermes', done: brainReady, current: !brainReady || preparing, body: `${!brainReady ? '<p>O Cockpit instala o Hermes oficial, conecta este cérebro e abre a autorização do Codex.</p>' : ''}${prepareAction}${progress}${oauth}` },
    { title: 'Conectar o Telegram', done: telegramReady, current: brainReady && !ready, body: `${!telegramReady ? '<p>Crie um bot, cole o token e mande um /start. O Cockpit cuida da allowlist.</p>' : '<div class="step-done-copy">Bot conectado com acesso privado e allow-all desligado.</div>'}${botForm}${identifyBody}${finalizing ? progress : ''}` },
    { title: 'Começar a conversar', done: ready, current: ready, body: ready ? `<div class="ready-callout"><span class="status-orb online"></span><div><h4>Seu cérebro está no Telegram</h4><p>Gateway ativo, diagnóstico concluído e acesso restrito à sua conta.</p></div>${botUsername ? `<a class="action primary" href="https://t.me/${escapeHtml(botUsername)}" target="_blank" rel="noreferrer">Abrir conversa →</a>` : ''}</div>` : '<p>Depois da sua confirmação, o Cockpit liga o serviço e faz o diagnóstico automaticamente.</p>' },
  ];
  const advanced = `<details class="advanced-setup"><summary>Detalhes técnicos</summary><div class="advanced-grid"><article><b>Hermes</b><span>${escapeHtml(hermes.version || 'Não instalado')}</span></article><article><b>Provider</b><span>${escapeHtml(hermes.provider_label || 'Pendente')}</span></article><article><b>Cérebro</b><span>${brainReady ? 'Conectado' : 'Pendente'}</span></article><article><b>Gateway</b><span>${hermes.gateway.running ? 'Ativo' : 'Parado'}</span></article></div><div class="gateway-actions"><button class="action" data-hermes-action="doctor" ${locked || !hermes.installed ? 'disabled' : ''}>Rodar diagnóstico</button><button class="action" data-hermes-action="gateway-restart" ${locked || !hermes.gateway.installed ? 'disabled' : ''}>Reiniciar gateway</button>${telegramReady ? `<button class="action warn" data-hermes-action="disconnect" ${locked}>Trocar conexão</button>` : ''}</div><p class="fine-print">Providers alternativos e manutenção manual continuam disponíveis no Hermes, fora do caminho principal.</p></details>`;
  return `<div class="section-heading hermes-heading"><div><p class="eyebrow">COLEGA NO BOLSO</p><h2>Leve seu cérebro para o Telegram</h2></div><p>Três gestos seus. Instalação, segurança e diagnóstico ficam com o Cockpit.</p></div>
    ${state.model.demo ? '<div class="boundary-note"><b>Fluxo de aula</b>Esta é a experiência completa em demonstração. Nenhuma credencial ou serviço real é alterado.</div>' : ''}
    ${errorBox}
    <div class="activation-journey">${steps.map((step, index) => `<article class="journey-step ${step.done ? 'complete' : ''} ${step.current ? 'current' : ''}"><div class="journey-marker"><span>${step.done ? '✓' : index + 1}</span><i></i></div><div class="journey-content"><div class="step-heading"><div><p class="micro">${index === 0 ? 'HERMES + CODEX' : index === 1 ? 'BOTFATHER + /START' : 'PRONTO'}</p><h3>${escapeHtml(step.title)}</h3></div>${badge(step.done ? 'completed' : step.current ? 'running' : 'pending', step.done ? 'good' : step.current ? 'warn' : 'neutral')}</div>${step.body}</div></article>`).join('')}</div>
    ${advanced}`;
}

function renderHealth() {
  const rows = state.model.routines.map((routine) => ({ name: routine.name, reason: routine.health_reason_code, binding: routine.binding.auth_status }));
  return `<div class="section-heading"><div><p class="eyebrow">READBACK</p><h2>Saúde operacional</h2></div><p>Estado derivado de arquivos canônicos, nunca de um painel editorial paralelo.</p></div><div class="health-list">${rows.map((row) => `<article><span class="health-dot ${tone(row.reason)}"></span><div><h3>${escapeHtml(row.name)}</h3><p>${escapeHtml(label(row.reason))}</p></div><code>${escapeHtml(row.binding)}</code></article>`).join('')}${state.model.issues.map((issue) => `<article><span class="health-dot bad"></span><div><h3>${escapeHtml(label(issue.reason_code))}</h3><p>${escapeHtml(issue.ref)}</p></div></article>`).join('')}</div><div class="cache-note"><strong>Índice reconstruível</strong><p>Este V0 não mantém banco nem cache persistente. Cada atualização recompila contratos, bindings, estado e recibos locais.</p></div>`;
}

function renderSociety() {
  const community = state.model.community;
  return `<div class="society-panel"><span class="society-star">✦</span><p class="eyebrow">CÉREBRO DA COMUNIDADE</p><h2>O ambiente que acelera o seu</h2><p>O cérebro gratuito organiza o seu contexto. Na INEVITA, ele cruza com sistemas, referências e ciclos testados por outros founders — sem fazer seu contexto privado circular.</p><div class="society-catalog">${community.items.map((item) => `<article><div>${badge(item.status)}</div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p></article>`).join('')}</div><div class="society-boundary"><span>Circula</span><b>Protocolo · sistemas · atualizações</b><span>Fica local</span><b>Fontes · contexto · outputs · decisões</b></div><a class="society-cta" href="${escapeHtml(community.cta_url)}" target="_blank" rel="noreferrer">Conhecer a comunidade INEVITA →</a></div>`;
}

const renderers = { today: renderToday, areas: renderAreas, systems: renderSystems, sources: renderSources, connections: renderConnections, routines: renderRoutines, judgments: renderJudgments, runs: renderRuns, decisions: renderDecisions, experiments: renderExperiments, activation: renderActivation, hermes: renderHermes, governance: renderGovernance, health: renderHealth, society: renderSociety };
const titles = {
  today: ['Agora', 'O próximo passo do seu cérebro, sem perder a fronteira humana.'],
  areas: ['Mapa / Áreas', 'A empresa plural, sem transformar navegação em casa da verdade.'],
  systems: ['Sistemas', 'Resultados executáveis ligados ao contexto real do negócio.'],
  sources: ['Fontes', 'Casas de verdade, autoridade, frescor e garantia de acesso.'],
  connections: ['Conexões', 'Onde as fontes vivem e quais já podem ser usadas.'],
  routines: ['Rotinas', 'Quando o cérebro trabalha, com qual contexto e quem precisa decidir.'],
  judgments: ['Julgamento', 'Outputs privados esperando decisão humana rastreável.'],
  runs: ['Execuções', 'O rastro reference-only de cada tentativa.'],
  decisions: ['Decisões', 'Evidência e consequência separadas pelo martelo humano.'],
  experiments: ['Experimentos', 'Critério antes do dado; aprendizado depois da decisão.'],
  activation: ['Ativação', 'Do primeiro contato ao contexto que volta sozinho.'],
  hermes: ['Hermes', 'Três gestos para levar seu cérebro ao Telegram com acesso restrito.'],
  governance: ['Governança', 'Quem pode acessar o quê e qual controle existe de verdade.'],
  health: ['Saúde', 'Conflitos e degradações derivados do estado canônico.'],
  society: ['INEVITA', 'A comunidade distribui capacidade; o contexto do founder continua local.'],
};

function render() {
  if (!state.model) return;
  const [title, subtitle] = titles[state.view];
  $('#page-title').textContent = title;
  $('#page-subtitle').textContent = subtitle;
  $('#summary').innerHTML = summaryCards();
  $('#content').innerHTML = renderers[state.view]();
  $('#demo-banner').hidden = !state.model.demo;
  $('#updated-at').textContent = `Estado local · ${fmtDate(state.model.generated_at)}`;
  document.querySelectorAll('[data-count]').forEach((element) => { element.textContent = state.model.counts[element.dataset.count] ?? 0; });
  document.querySelectorAll('[data-view]').forEach((element) => element.classList.toggle('active', element.dataset.view === state.view));
}

function drawerActions(routine) {
  if (state.model.demo) return '<span class="muted">Demonstração: ações desabilitadas.</span>';
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

async function openJudgment(receiptId) {
  state.selectedRoutine = null;
  state.selectedJudgment = receiptId;
  $('#drawer-content').innerHTML = '<div class="loading"><i></i><span>Abrindo output privado local…</span></div>';
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  $('#drawer-backdrop').hidden = false;
  try {
    const detail = await getJson(`/api/runs/${receiptId}/output`);
    const current = detail.judgment.summary;
    const locked = state.model.demo ? 'disabled' : '';
    $('#drawer-content').innerHTML = `<div class="drawer-head"><p class="eyebrow">OUTPUT PRIVADO</p><h2>${escapeHtml(detail.receipt.routine_id)}</h2>${badge(current.status === 'pending' ? 'pending' : current.verdict)}</div>
      <div class="boundary-note"><b>Leitura local explícita</b>Este conteúdo não entrou no recibo, no read model ou na INEVITA. Abrir não executou modelo.</div>
      <section class="drawer-section"><div class="output-heading"><h3>Resultado</h3><span>${detail.output.bytes} bytes</span></div><pre class="private-output">${escapeHtml(detail.output.content)}</pre></section>
      ${correctionSection(detail)}
      <section class="drawer-section"><h3>Seu julgamento</h3><p class="section-help">A nota fica privada. Pedir ajuste, rejeitar ou propor ação exige explicar por quê.</p><textarea id="judgment-note" maxlength="2000" placeholder="O que está certo, o que precisa mudar ou qual ação deveria ser considerada?"></textarea></section>
      <section class="drawer-section"><h3>Histórico imutável</h3><div class="timeline">${judgmentHistory(detail.judgment.history)}</div></section>
      <div class="boundary-note action-boundary"><b>Propor não é executar</b>“Propor ação” registra intenção local. Não cria task, não envia mensagem, não publica e não altera Fonte.</div>
      <div class="drawer-actions judgment-actions">${correctionButtons(detail)}<button class="action primary" data-judgment-action="approve" ${locked}>Aprovar</button><button class="action warn" data-judgment-action="changes" ${locked}>Pedir ajuste</button><button class="action" data-judgment-action="reject" ${locked}>Rejeitar</button><button class="action" data-judgment-action="propose-action" ${locked}>Propor ação</button></div>`;
  } catch (error) {
    $('#drawer-content').innerHTML = empty('Output indisponível', label(error.message));
    toast(label(error.message), 'bad');
  }
}

async function performJudgment(action) {
  if (state.busy || state.model.demo || !state.selectedJudgment) return;
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
  if (state.busy || state.model.demo || !state.selectedJudgment) return;
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

async function performAction(action) {
  if (state.busy || state.model.demo || !state.selectedRoutine) return;
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

async function performHermesAction(action) {
  if (state.busy || state.model.demo) return;
  const routes = {
    bind: '/api/integrations/hermes/project/bind',
    disconnect: '/api/integrations/hermes/telegram/disconnect',
    doctor: '/api/integrations/hermes/doctor',
    'gateway-install': '/api/integrations/hermes/gateway/install',
    'gateway-start': '/api/integrations/hermes/gateway/start',
    'gateway-stop': '/api/integrations/hermes/gateway/stop',
    'gateway-restart': '/api/integrations/hermes/gateway/restart',
  };
  if (!routes[action]) return;
  const messages = {
    bind: 'Confiar neste repositório e torná-lo o diretório de trabalho do Hermes? As skills locais poderão ser usadas; qualquer escrita continua pedindo sua aprovação.',
    disconnect: 'Remover o token e a allowlist do Telegram? Reinicie o gateway depois para aplicar.',
    doctor: 'Rodar o diagnóstico local do Hermes agora?',
    'gateway-install': 'Instalar o gateway como serviço do seu usuário e iniciá-lo agora?',
    'gateway-start': 'Iniciar o gateway do Hermes?',
    'gateway-stop': 'Parar o gateway do Hermes?',
    'gateway-restart': 'Reiniciar o gateway para aplicar a configuração atual?',
  };
  if (!window.confirm(messages[action])) return;
  state.busy = true;
  document.querySelectorAll('[data-hermes-action], #telegram-form button').forEach((button) => { button.disabled = true; });
  try {
    const result = await mutate(routes[action], {});
    toast(action === 'doctor' ? `Diagnóstico: ${label(result.status)}.` : 'Configuração do Hermes atualizada.');
    await loadModel();
  } catch (error) {
    toast(label(error.message), 'bad');
  } finally {
    state.busy = false;
  }
}

function scheduleActivationPoll(delay = 800) {
  clearTimeout(state.activationTimer);
  const status = state.model?.hermes?.activation?.action?.status;
  const identityLoading = state.model?.hermes?.activation?.bot?.identity_loading;
  if (status !== 'running' && !identityLoading) return;
  state.activationTimer = setTimeout(pollActivation, delay);
}

async function pollActivation() {
  try {
    const activation = await getJson('/api/integrations/hermes/activation');
    if (!state.model?.hermes) return;
    state.model.hermes.activation = activation;
    if (state.view === 'hermes') render();
    if (activation.action.status === 'running' || activation.bot?.identity_loading) scheduleActivationPoll(900);
    else await loadModel();
  } catch (error) {
    toast(label(error.message), 'bad');
  }
}

async function performActivationAction(actionName, actionId = '') {
  if (state.busy || state.model.demo) return;
  const routes = {
    prepare: '/api/integrations/hermes/activation/prepare/start',
    codex: '/api/integrations/hermes/activation/codex/start',
    'owner-confirm': '/api/integrations/hermes/activation/owner/confirm',
    'owner-reject': '/api/integrations/hermes/activation/owner/reject',
    cancel: '/api/integrations/hermes/activation/cancel',
  };
  if (!routes[actionName]) return;
  if (actionName === 'prepare' && !window.confirm('Preparar o Hermes nesta máquina? O Cockpit reutiliza versões compatíveis ou instala somente o pacote oficial verificado.')) return;
  state.busy = true;
  document.querySelectorAll('[data-activation-action], #telegram-activation-form input, #telegram-activation-form button').forEach((element) => { element.disabled = true; });
  try {
    const result = await mutate(routes[actionName], actionId ? { action_id: actionId } : {});
    state.model.hermes.activation = result;
    render();
    if (actionName === 'owner-confirm') toast('Confirmado. Ligando seu colega no Telegram…');
    else if (actionName === 'owner-reject') toast('Conta descartada. Envie /start pela conta certa.');
    scheduleActivationPoll(250);
  } catch (error) {
    toast(label(error.message), 'bad');
    await loadModel();
  } finally {
    state.busy = false;
  }
}

async function connectTelegram(form) {
  if (state.busy || state.model.demo) return;
  const token = form.querySelector('#telegram-token')?.value.trim() || '';
  if (!token) {
    toast('Cole o token recebido do BotFather.', 'bad');
    return;
  }
  const replacing = state.model.hermes.telegram.token_configured;
  if (replacing && !window.confirm('Trocar o bot conectado? A configuração atual será preservada se a nova conexão falhar.')) return;
  form.reset();
  state.busy = true;
  form.querySelectorAll('button, input').forEach((element) => { element.disabled = true; });
  try {
    const result = await mutate('/api/integrations/hermes/activation/telegram/start', { token });
    state.model.hermes.activation = result;
    render();
    toast('Validando o bot com o Telegram…');
    scheduleActivationPoll(250);
  } catch (error) {
    toast(label(error.message), 'bad');
    await loadModel();
  } finally {
    state.busy = false;
  }
}

async function loadModel() {
  state.model = await getJson('/api/console');
  render();
  scheduleActivationPoll();
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-view]');
  if (nav) { state.view = nav.dataset.view; closeDrawer(); render(); return; }
  const go = event.target.closest('[data-go-view]');
  if (go) { state.view = go.dataset.goView; closeDrawer(); render(); return; }
  const copy = event.target.closest('[data-copy-command]');
  if (copy) {
    navigator.clipboard.writeText(copy.dataset.copyCommand)
      .then(() => toast('Comando copiado. Cole no terminal.'))
      .catch(() => toast('Não foi possível copiar; selecione o comando manualmente.', 'bad'));
    return;
  }
  const hermesAction = event.target.closest('[data-hermes-action]');
  if (hermesAction) { performHermesAction(hermesAction.dataset.hermesAction); return; }
  const activationAction = event.target.closest('[data-activation-action]');
  if (activationAction) {
    performActivationAction(activationAction.dataset.activationAction, activationAction.dataset.actionId || '');
    return;
  }
  const open = event.target.closest('[data-open-routine]');
  if (open) { openDrawer(open.dataset.openRoutine); return; }
  const judgment = event.target.closest('[data-open-judgment]');
  if (judgment) { openJudgment(judgment.dataset.openJudgment); return; }
  const judgmentAction = event.target.closest('[data-judgment-action]');
  if (judgmentAction) { performJudgment(judgmentAction.dataset.judgmentAction); return; }
  const correctionAction = event.target.closest('[data-correction-action]');
  if (correctionAction) { performCorrectionAction(correctionAction.dataset.correctionAction); return; }
  const action = event.target.closest('[data-routine-action]');
  if (action) performAction(action.dataset.routineAction);
});
document.addEventListener('submit', (event) => {
  if (event.target.matches('#telegram-activation-form')) {
    event.preventDefault();
    connectTelegram(event.target);
  }
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
