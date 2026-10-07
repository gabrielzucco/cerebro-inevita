// Shared presentation language for the local and internal Cockpit.
// This module derives copy from existing read models. It never reads private content or starts work.
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export const viewLanguage = Object.freeze({
  activation: ['Seu primeiro trabalho', 'Comece com uma tarefa real. Uma pequena amostra basta para a primeira resposta.'],
  today: ['Hoje', 'Veja o que precisa de você e o que já está pronto.'],
  anatomy: ['Meu Cérebro', 'Entenda o que ele já sabe, de onde vêm as informações e o que ainda falta.'],
  systems: ['Meus trabalhos', 'Escolha pelo resultado que deseja produzir.'],
  system: ['Trabalho', 'Veja o resultado, o estado e as informações usadas neste trabalho.'],
  judgments: ['Entregas para revisar', 'A IA preparou rascunhos. Você decide o que pode ser usado.'],
  cases: ['Decisões', 'Revise o que foi proposto e registre sua decisão.'],
  routines: ['Trabalhos programados', 'Veja o que está agendado, parado ou precisando de você.'],
  runs: ['Histórico de trabalhos', 'Veja o resultado e o estado de cada trabalho realizado.'],
  sources: ['Minhas fontes', 'Veja quais informações foram mapeadas, conectadas ou usadas.'],
  skills: ['O que o Cérebro sabe fazer', 'Conheça as capacidades disponíveis e onde podem ajudar.'],
  canvas: ['Como o Cérebro funciona', 'Explore as ligações e o rastro real de um trabalho quando precisar.'],
  compatibility: ['Preparação do Cérebro', 'Veja se esta instalação está pronta para as funções disponíveis.'],
  governance: ['Acessos', 'Confira quem pode usar cada fonte e o alcance de uma revogação.'],
  health: ['O que precisa de cuidado', 'Entenda problemas observados e encontre o próximo passo.'],
  hermes: ['Conversar pelo Telegram', 'Conecte uma conversa privada em três passos.'],
  society: ['Society', 'Explore os trabalhos e referências disponíveis para sua instalação.'],
  areas: ['Áreas do negócio', 'Encontre os trabalhos por área responsável.'],
  experiments: ['Testes e aprendizados', 'Acompanhe uma mudança, sua medição e a decisão humana.'],
  workflows: ['Etapas do trabalho', 'Veja o que está previsto e o que já aconteceu.'],
});

const viewActions = Object.freeze({
  anatomy: ['Explore suas fontes ou veja a última informação usada.', 'sources', 'Ver fontes'],
  systems: ['Escolha um trabalho pelo resultado esperado.', null, null],
  system: ['Confira o estado e abra a entrega ou as fontes deste trabalho.', null, null],
  judgments: ['Abra uma entrega, confira a origem e aprove ou peça ajuste.', null, null],
  cases: ['Abra uma proposta e leia seu efeito antes de decidir.', null, null],
  routines: ['Abra um trabalho para ver quando ele roda e o que precisa de aprovação.', null, null],
  runs: ['Abra um trabalho para ver resultado, fontes e limites.', null, null],
  sources: ['Abra uma fonte para saber se ela está apenas mapeada ou realmente disponível.', null, null],
  skills: ['Escolha uma capacidade para ver onde ela pode ajudar.', null, null],
  canvas: ['Selecione um trabalho ou resultado para explorar seu rastro.', null, null],
  compatibility: ['Revise os itens que pedem atenção antes de atualizar.', null, null],
  governance: ['Confira o alcance do acesso antes de mudar uma permissão.', null, null],
  health: ['Abra um alerta para ver impacto, solução e diagnóstico.', null, null],
  hermes: ['Prepare o agente, conecte o bot e confirme sua conta.', null, null],
  society: ['Abra um trabalho para ver o que está disponível.', null, null],
  areas: ['Escolha uma área para filtrar os trabalhos.', null, null],
  experiments: ['Abra um teste para conferir resultado e decisão.', null, null],
  workflows: ['Escolha uma etapa para comparar o previsto com o observado.', null, null],
});

export function journeyCue(view, model, { internal = false } = {}) {
  if (view === 'activation') return {
    state: 'Comece por uma tarefa real', next: 'Converse com o agente que você já usa; abrir o Cockpit não executa IA.',
  };
  if (view === 'today') {
    const pending = internal
      ? Number(model?.operator?.pendingActions?.length || model?.counts?.judgments || 0)
      : Number(model?.counts?.judgments || 0);
    if (pending > 0) return { state: `${pending} ${pending === 1 ? 'entrega ou decisão espera' : 'entregas ou decisões esperam'} por você`, next: 'Revise a primeira; nada será aprovado automaticamente.', action: 'judgments', label: 'Revisar agora' };
    const internalDecisions = internal ? Number(model?.internal_decisions || 0) : 0;
    if (internalDecisions > 0) return { state: `${internalDecisions} ${internalDecisions === 1 ? 'decisão espera' : 'decisões esperam'} por você`, next: 'Veja a primeira decisão nesta página. O veredito continua na fonte responsável.' };
    const ready = Number(model?.today?.ready_to_work?.length || 0);
    if (ready > 0) return { state: 'Nada espera sua aprovação agora', next: `${ready} ${ready === 1 ? 'trabalho está pronto' : 'trabalhos estão prontos'} para começar.`, action: 'systems', label: 'Ver trabalhos' };
    return { state: 'Tudo em dia por aqui', next: 'Explore o que seu Cérebro já sabe ou escolha um trabalho.', action: 'systems', label: 'Ver trabalhos' };
  }
  if (view === 'system' && model?.current_work) {
    const work = model.current_work;
    return {
      state: `${work.name}: ${work.status}`,
      next: work.pending > 0 ? 'Há uma entrega esperando sua revisão.'
        : work.records > 0 ? 'Abra um resultado para conferir o que aconteceu e quais informações foram usadas.'
          : 'Ainda não há resultado registrado deste trabalho. Confira seus critérios e fontes antes de começar.',
      action: work.pending > 0 ? 'judgments' : null,
      label: work.pending > 0 ? 'Ver entrega' : null,
    };
  }
  if (view === 'systems') {
    const count = Number(model?.counts?.systems || 0);
    return { state: count ? `${count} ${count === 1 ? 'trabalho disponível' : 'trabalhos disponíveis'} no catálogo` : 'Nenhum trabalho disponível nesta instalação', next: count ? 'Escolha pelo resultado esperado e confira o estado antes de começar.' : 'Comece uma tarefa real com o agente para identificar o primeiro trabalho.' };
  }
  if (view === 'sources') {
    const count = Number(model?.counts?.sources || 0);
    return { state: count ? `${count} ${count === 1 ? 'fonte mapeada' : 'fontes mapeadas'}` : 'Nenhuma fonte mapeada', next: 'Uma fonte mapeada ainda pode precisar de conexão ou autorização. Abra cada uma para conferir.' };
  }
  const [next, action, label] = viewActions[view] || ['Explore esta área para encontrar o próximo passo.', null, null];
  return { state: 'Você está explorando esta área', next, action, label };
}

export function renderJourneyCue(view, model, options) {
  const cue = journeyCue(view, model, options);
  return `<section class="journey-cue" aria-label="Estado e próximo passo"><div><span class="journey-cue-label">Agora</span><strong>${escapeHtml(cue.state)}</strong><p>${escapeHtml(cue.next)}</p></div>${cue.action ? `<button type="button" class="journey-cue-action" data-view="${escapeHtml(cue.action)}">${escapeHtml(cue.label)} →</button>` : ''}</section>`;
}

export function detailDisclosure(content, { label = 'Ver como foi feito', open = false } = {}) {
  return `<details class="explain-detail"${open ? ' open' : ''}><summary>${escapeHtml(label)}</summary><div class="explain-detail-body">${content}</div></details>`;
}

export function renderBrainHumanSummary(anatomy) {
  const overview = anatomy?.control_center?.overview || {};
  const observed = Number(overview.sources?.observed || 0);
  const total = Number(overview.sources?.total || 0);
  const complete = Number(overview.runs?.complete || 0);
  return `<section class="brain-human-overview" aria-label="O que o Cérebro já sabe"><div><span class="journey-cue-label">Informação observada</span><strong>${observed ? `${observed} de ${total} fontes têm observação registrada` : 'Ainda não há fonte observada nesta instalação'}</strong><p>${complete ? `${complete} ${complete === 1 ? 'trabalho concluído' : 'trabalhos concluídos'} aparecem nos registros.` : 'Ainda não há trabalho concluído nos registros.'} Fontes mapeadas não significam acesso ou uso comprovado.</p></div><button type="button" class="journey-cue-action" data-view="sources">Conferir fontes →</button></section>`;
}

export function friendlyFailure(code, fallback = 'Não foi possível concluir esta etapa.') {
  const known = {
    'request-failed': 'Não conseguimos completar o pedido. Atualize a página e tente novamente.',
    'source-unavailable': 'Esta fonte não está disponível agora. Confira a conexão antes de tentar novamente.',
    'context-not-recorded': 'Este trabalho não registrou quais informações foram usadas.',
    'executor-authentication-required': 'A conexão com o agente precisa ser autorizada novamente.',
    'preview-stale': 'A proposta mudou desde a prévia. Revise e simule de novo antes de decidir.',
  };
  return known[String(code || '')] || fallback;
}
