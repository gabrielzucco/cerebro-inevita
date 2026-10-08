import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { createCommunityClient } from './lib/community-client.mjs';
import { COMMUNITY_TOOLS, createCommunityToolHandler } from './lib/community-mcp.mjs';
import { createMcpSession } from './lib/community-mcp-protocol.mjs';
import { MEMBER_INTERACTION_TOOLS, projectMemberInteractionResult } from './lib/community-member-interaction.mjs';

const INSTALL_ID = 'a69783b0-5c33-4995-b638-492dd20c02a5';
const EVENT_ID = 'a69783b0-5c33-4995-b638-492dd20c02a6';
const POST_ID = 'a69783b0-5c33-4995-b638-492dd20c02a7';
const COMMENT_ID = 'a69783b0-5c33-4995-b638-492dd20c02a8';
const MEMBER_ID = 'a69783b0-5c33-4995-b638-492dd20c02a9';
const NOTICE_ID = 'a69783b0-5c33-4995-b638-492dd20c02aa';
const HIDDEN_ID = 'a69783b0-5c33-4995-b638-492dd20c02ab';
const HASH = 'b'.repeat(32);
const hash = value => createHash('md5').update(JSON.stringify(value)).digest('hex');
const event = { id: EVENT_ID, title: 'Encontro Society', starts_at: '2026-10-14T22:00:00Z',
  starts_at_brt: '14/10/2026 19:00 BRT', location: 'Zoom', location_url: 'https://zoom.example.test/room', rsvp_status: null };
const post = { id: POST_ID, space: 'help', title: 'Ajuda com oferta', body_markdown: 'Como validar?',
  post_type: 'discussion', published_at: '2026-10-07T22:00:00Z', comments_locked: false,
  author: { id: MEMBER_ID, display_name: 'Pessoa de teste', private_email: 'private@example.test' },
  contact_id: 'PRIVATE_CONTACT', moderation_notes: 'PRIVATE_MODERATION' };
const comment = { id: COMMENT_ID, body_markdown: 'Olhe a fonte.', created_at: '2026-10-07T22:30:00Z',
  author: post.author, private_phone: 'PRIVATE_PHONE' };
const call = (name, args = {}, id = 2) => ({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });

async function ready(handler) {
  const handle = createMcpSession({ tools: COMMUNITY_TOOLS, callTool: handler });
  await handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {
    protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'community-interaction-test', version: '1' },
  } });
  await handle({ jsonrpc: '2.0', method: 'notifications/initialized' });
  return handle;
}

test('seven community interactions keep the original twenty tools and reject unsafe arguments before service calls', async () => {
  assert.equal(COMMUNITY_TOOLS.length, 35);
  assert.equal(MEMBER_INTERACTION_TOOLS.length, 7);
  const previousTools = [
    'listar_sistemas_comunidade', 'detalhar_sistema_comunidade', 'planejar_instalacao_sistema',
    'instalar_sistema_comunidade', 'preparar_contribuicao', 'revisar_contribuicao_local',
    'autorizar_envio_contribuicao', 'enviar_contribuicao', 'minhas_contribuicoes', 'status_contribuicao',
    'buscar_acervo_comunidade', 'detalhar_item_acervo', 'meu_perfil_comunidade',
    'preparar_atualizacao_perfil', 'salvar_meu_perfil', 'publicar_meu_perfil',
    'orientar_novo_sistema', 'inspecionar_arquivos_sistema', 'planejar_novo_sistema', 'preparar_novo_sistema',
  ];
  assert.deepEqual(COMMUNITY_TOOLS.filter(item => previousTools.includes(item.name)).map(item => item.name), previousTools);
  let requests = 0;
  const handle = await ready(async () => { requests++; return { content: [] }; });
  const invalid = [
    ['proximos_encontros', { member_id: MEMBER_ID }],
    ['confirmar_presenca', { event_id: EVENT_ID }],
    ['confirmar_presenca', { event_id: EVENT_ID, confirmar: false }],
    ['confirmar_presenca', { event_id: '../../event', confirmar: true }],
    ['preparar_post_comunidade', { space: 'announcements', title: 'Título', body_markdown: 'Texto' }],
    ['preparar_post_comunidade', { space: 'help', title: 'Título', body_markdown: 'Texto', local_path: 'meu-negocio/' }],
    ['publicar_post_comunidade', { space: 'help', title: 'Título', body_markdown: 'Texto', preview_hash: HASH }],
    ['publicar_post_comunidade', { space: 'help', title: 'Título', body_markdown: 'Texto', preview_hash: 'invalid', confirmar: true }],
    ['ler_post', { post_id: POST_ID, contact_id: MEMBER_ID }],
    ['preparar_comentario', { post_id: POST_ID, body_markdown: '' }],
    ['comentar_post', { post_id: POST_ID, body_markdown: 'Texto', preview_hash: HASH, confirmar: 'true' }],
  ];
  for (const [name, args] of invalid) assert.equal((await handle(call(name, args))).error.code, -32602, name);
  const notification = call('comentar_post', { post_id: POST_ID, body_markdown: 'Texto', preview_hash: HASH, confirmar: true });
  delete notification.id;
  assert.equal(await handle(notification), null);
  assert.equal(requests, 0);
});

test('projection retains only event, preview, post and visible comment fields', () => {
  const eventResult = projectMemberInteractionResult('upcoming_events', { items: [{ ...event, install_credential: 'PRIVATE_CREDENTIAL' }], member_id: MEMBER_ID });
  assert.equal(eventResult.items[0].starts_at_brt, event.starts_at_brt);
  const postResult = projectMemberInteractionResult('read_post', { post, comments: [comment], private_contacts: 'PRIVATE_CONTACT' });
  assert.equal(postResult.post.author.display_name, 'Pessoa de teste');
  assert.equal(postResult.comments[0].body_markdown, 'Olhe a fonte.');
  const announcement = projectMemberInteractionResult('read_post', { post: {
    ...post, id: NOTICE_ID, space: 'announcements', title: '', body_markdown: '', post_type: 'content_drop',
  }, comments: [] });
  assert.equal(announcement.post.space, 'announcements');
  assert.equal(announcement.post.title, '');
  assert.equal(announcement.post.post_type, 'content_drop');
  assert.equal(projectMemberInteractionResult('prepare_post', {
    space: 'help', title: post.title, body_markdown: post.body_markdown, audience: 'community_rank_200',
    audience_description: 'Visível a membros ativos com acesso ao espaço help (nível mínimo 200).', preview_hash: HASH,
    private_context: 'PRIVATE_CONTEXT',
  }).preview_hash, HASH);
  assert.throws(() => projectMemberInteractionResult('prepare_post', {
    space: 'help', title: post.title, body_markdown: post.body_markdown, audience: 'community_rank_200', preview_hash: HASH,
  }), /invalid_community_response/);
  for (const result of [eventResult, postResult]) for (const secret of ['PRIVATE_CREDENTIAL', 'PRIVATE_CONTACT', 'PRIVATE_MODERATION', 'PRIVATE_PHONE', 'private@example']) {
    assert.ok(!JSON.stringify(result).includes(secret));
  }
  assert.throws(() => projectMemberInteractionResult('read_post', { post: { ...post, comments_locked: 'false' }, comments: [] }), /invalid_community_response/);
  assert.throws(() => projectMemberInteractionResult('upcoming_events', { items: [{ ...event, location_url: 'https://zoom.example.test/?token=secret' }] }), /invalid_community_response/);
});

test('MCP to HTTP fixture covers agenda, exact preview publication, comments, idempotency and revoked Society access', { timeout: 15000 }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'community interaction '));
  const credential = 'x'.repeat(43);
  mkdirSync(join(root, '.cerebro'));
  writeFileSync(join(root, '.cerebro/id'), INSTALL_ID);
  writeFileSync(join(root, '.cerebro/install-credential'), credential, { mode: 0o600 });
  let permitted = true, rsvpCount = 0, postCount = 0, commentCount = 0, commentsLocked = false;
  let postHidden = false, commentHidden = false;
  const received = [];
  const server = createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const payload = JSON.parse(raw); received.push(payload);
    res.setHeader('content-type', 'application/json');
    const send = (status, value) => { res.statusCode = status; res.end(JSON.stringify(value)); };
    if (payload.install_id !== INSTALL_ID || payload.install_credential !== credential || payload.member_id) return send(401, { error: 'access_denied' });
    if (!permitted) return send(403, { error: 'society_access_required' });
    if (payload.action === 'upcoming_events') return send(200, { items: [{ ...event, rsvp_status: rsvpCount ? 'confirmed' : null }] });
    if (payload.action === 'rsvp_event') {
      if (payload.confirmar !== true) return send(400, { error: 'confirmation_required' });
      if (payload.event_id !== EVENT_ID) return send(404, { error: 'event_not_found' });
      rsvpCount = 1; return send(200, { event_id: EVENT_ID, rsvp_status: 'confirmed' });
    }
    if (payload.action === 'prepare_post') return send(200, { space: payload.space, title: payload.title,
      body_markdown: payload.body_markdown, audience: 'community_rank_200',
      audience_description: 'Visível a membros ativos com acesso ao espaço help (nível mínimo 200).',
      preview_hash: hash([payload.space, payload.title, payload.body_markdown]) });
    if (payload.action === 'publish_post') {
      if (payload.confirmar !== true) return send(400, { error: 'confirmation_required' });
      if (payload.preview_hash !== hash([payload.space, payload.title, payload.body_markdown])) return send(409, { error: 'preview_mismatch' });
      if (postHidden) return send(409, { error: 'post_moderated' });
      postCount = 1; return send(200, { post_id: POST_ID });
    }
    if (payload.action === 'read_post') {
      if (payload.post_id === HIDDEN_ID) return send(404, { error: 'post_not_found' });
      if (payload.post_id === NOTICE_ID) return send(200, { post: { ...post, id: NOTICE_ID,
        space: 'announcements', title: '', body_markdown: '', post_type: 'content_drop' }, comments: [] });
      return send(200, { post: { ...post, comments_locked: commentsLocked }, comments: commentCount ? [comment] : [] });
    }
    if (payload.action === 'prepare_comment') {
      if (payload.post_id === HIDDEN_ID) return send(404, { error: 'post_not_found' });
      if (commentsLocked) return send(409, { error: 'comments_locked' });
      return send(200, { post_id: payload.post_id, body_markdown: payload.body_markdown,
        preview_hash: hash([payload.post_id, payload.body_markdown]) });
    }
    if (payload.action === 'publish_comment') {
      if (commentsLocked) return send(409, { error: 'comments_locked' });
      if (payload.confirmar !== true) return send(400, { error: 'confirmation_required' });
      if (payload.preview_hash !== hash([payload.post_id, payload.body_markdown])) return send(409, { error: 'preview_mismatch' });
      if (commentHidden) return send(409, { error: 'comment_moderated' });
      commentCount = 1; return send(200, { comment_id: COMMENT_ID });
    }
    return send(400, { error: 'invalid_action' });
  });
  await new Promise(accept => server.listen(0, '127.0.0.1', accept));
  const endpoint = `http://127.0.0.1:${server.address().port}`;
  const handle = await ready(createCommunityToolHandler({ root, endpoint, allowLocalhost: true }));
  const invoke = async (name, args = {}) => (await handle(call(name, args))).result;
  try {
    const listed = await invoke('proximos_encontros');
    assert.equal(listed.structuredContent.items[0].starts_at_brt, event.starts_at_brt);
    const rsvp = await invoke('confirmar_presenca', { event_id: EVENT_ID, confirmar: true });
    assert.equal(rsvp.structuredContent.rsvp_status, 'confirmed');
    assert.equal((await invoke('confirmar_presenca', { event_id: EVENT_ID, confirmar: true })).structuredContent.rsvp_status, 'confirmed');
    assert.equal(rsvpCount, 1);
    const draft = { space: 'help', title: post.title, body_markdown: post.body_markdown };
    const preview = (await invoke('preparar_post_comunidade', draft)).structuredContent;
    assert.deepEqual({ space: preview.space, title: preview.title, body_markdown: preview.body_markdown }, draft);
    assert.match(preview.audience_description, /membros ativos.*help/);
    const mismatch = await invoke('publicar_post_comunidade', { ...draft, body_markdown: 'Outro texto', preview_hash: preview.preview_hash, confirmar: true });
    assert.equal(mismatch.isError, true); assert.match(mismatch.content[0].text, /prévia/);
    assert.equal(postCount, 0);
    const published = await invoke('publicar_post_comunidade', { ...draft, preview_hash: preview.preview_hash, confirmar: true });
    assert.equal(published.structuredContent.post_id, POST_ID);
    assert.equal((await invoke('publicar_post_comunidade', { ...draft, preview_hash: preview.preview_hash, confirmar: true })).structuredContent.post_id, POST_ID);
    assert.equal(postCount, 1);
    postHidden = true;
    const moderatedPost = await invoke('publicar_post_comunidade', { ...draft, preview_hash: preview.preview_hash, confirmar: true });
    assert.equal(moderatedPost.isError, true); assert.match(moderatedPost.content[0].text, /moderação/);
    postHidden = false;
    const read = await invoke('ler_post', { post_id: POST_ID });
    assert.equal(read.structuredContent.post.author.display_name, 'Pessoa de teste');
    assert.ok(!JSON.stringify(read).includes('PRIVATE_CONTACT'));
    assert.equal((await invoke('ler_post', { post_id: NOTICE_ID })).structuredContent.post.space, 'announcements');
    assert.equal((await invoke('ler_post', { post_id: HIDDEN_ID })).isError, true);
    assert.equal((await invoke('preparar_comentario', { post_id: NOTICE_ID, body_markdown: 'Obrigado pelo aviso.' })).structuredContent.post_id, NOTICE_ID);
    assert.equal((await invoke('preparar_comentario', { post_id: HIDDEN_ID, body_markdown: 'Não visível.' })).isError, true);
    const commentDraft = { post_id: POST_ID, body_markdown: 'Olhe a fonte.' };
    const commentPreview = (await invoke('preparar_comentario', commentDraft)).structuredContent;
    const commentMismatch = await invoke('comentar_post', { ...commentDraft, body_markdown: 'Outro texto', preview_hash: commentPreview.preview_hash, confirmar: true });
    assert.equal(commentMismatch.isError, true); assert.equal(commentCount, 0);
    assert.equal((await invoke('comentar_post', { ...commentDraft, preview_hash: commentPreview.preview_hash, confirmar: true })).structuredContent.comment_id, COMMENT_ID);
    commentHidden = true;
    const moderatedComment = await invoke('comentar_post', { ...commentDraft, preview_hash: commentPreview.preview_hash, confirmar: true });
    assert.equal(moderatedComment.isError, true); assert.match(moderatedComment.content[0].text, /moderação/);
    commentHidden = false;
    assert.equal((await invoke('ler_post', { post_id: POST_ID })).structuredContent.comments.length, 1);
    commentsLocked = true;
    assert.match((await invoke('preparar_comentario', commentDraft)).content[0].text, /fechados/);
    assert.equal(commentCount, 1);
    permitted = false;
    for (const [name, args] of [['proximos_encontros', {}], ['preparar_post_comunidade', draft], ['publicar_post_comunidade', { ...draft, preview_hash: preview.preview_hash, confirmar: true }]]) {
      const denied = await invoke(name, args); assert.equal(denied.isError, true); assert.match(denied.content[0].text, /Society/);
    }
    const client = createCommunityClient({ root, endpoint, allowLocalhost: true });
    await assert.rejects(() => client.request('prepare_post', { ...draft, space: 'announcements' }), /invalid_member_interaction_arguments/);
    assert.ok(received.every(payload => payload.install_id === INSTALL_ID && payload.install_credential === credential && !payload.member_id));
    assert.ok(received.every(payload => !Object.hasOwn(payload, 'local_path') && !Object.hasOwn(payload, 'private_context')));
  } finally {
    await new Promise(accept => server.close(accept));
    rmSync(root, { recursive: true, force: true });
  }
});
