import { isAbsolute, resolve } from 'node:path';
import { matchesSchema } from './community-mcp-protocol.mjs';
import { MEMBER_SURFACE_TOOLS, memberSurfaceAction, memberSurfaceArguments, projectMemberSurfaceResult, validateMemberSurfaceRequest } from './community-member-surface.mjs';

const text = (maxLength, extra = {}) => ({ type: 'string', minLength: 1, maxLength, ...extra });
const slug = text(64, { pattern: '^[a-z0-9][a-z0-9-]{0,63}$' });
const hash = text(64, { pattern: '^[a-f0-9]{64}$' });
const identifier = text(100, { pattern: '^[A-Za-z0-9][A-Za-z0-9:_-]{0,99}$' });
const localPath = text(500, { pattern: '^(?!/)(?!.*\\\\)(?!.*[\\u0000-\\u001f\\u007f])[^:]+$' });
const confirm = { type: 'boolean', const: true };
const schema = (properties = {}, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const tool = (name, title, description, inputSchema, readOnly = true, network = true) => ({ name, title, description, inputSchema,
  annotations: { title, readOnlyHint: readOnly, destructiveHint: false, idempotentHint: readOnly, openWorldHint: network } });

export const COMMUNITY_TOOLS = Object.freeze([
  tool('listar_sistemas_comunidade', 'Encontrar sistemas', 'Consulta os sistemas publicados que a sua instalação pode acessar agora. A plataforma confere o acesso atual. Não lê seu contexto privado.', schema()),
  tool('detalhar_sistema_comunidade', 'Ver um sistema', 'Mostra a versão publicada, o hash do pacote e o primeiro trabalho proposto. Não baixa nem instala arquivos.', schema({ slug })),
  tool('planejar_instalacao_sistema', 'Conferir instalação', 'Consulta a versão atual e prepara a prévia da instalação no Cérebro configurado. Não consome autorização de download nem escreve arquivos. Mostre a prévia ao dono.', schema({ slug })),
  tool('instalar_sistema_comunidade', 'Instalar sistema aprovado', 'Use após o dono aprovar a versão e o hash mostrados no plano. A plataforma reconfere o acesso; o instalador verifica os bytes e preserva o contexto existente. Não executa scripts do pacote.', schema({ slug, package_sha256: hash, confirmar: confirm }), false),
  tool('preparar_contribuicao', 'Preparar melhoria para revisão', 'Cria candidato local a partir de um sistema instalado e SOMENTE dos arquivos selecionados pelo dono. Exige consentimento para preparar. Não envia. Use source_dir relativo ao Cérebro e selected_paths relativos a essa pasta. Não inclua clientes, credenciais ou contexto privado.', schema({ slug, source_dir: localPath, selected_paths: { type: 'array', minItems: 1, maxItems: 512, uniqueItems: true, items: localPath }, version: text(80, { pattern: '^[0-9]+\\.[0-9]+\\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$' }), summary: text(2000), confirmar: confirm }), false, false),
  tool('revisar_contribuicao_local', 'Conferir o que será enviado', 'Mostra hash, arquivos e diferenças do candidato local para o dono conferir. Não envia conteúdo e não aprova a contribuição na comunidade. A revisão editorial dos arquivos continua necessária.', schema({ candidate_id: identifier }), true, false),
  tool('autorizar_envio_contribuicao', 'Autorizar este candidato', 'Registra a autorização local do dono para compartilhar o hash exato que ele conferiu. Esta ação não envia e não substitui a revisão da comunidade. Requer candidato e hash mostrados na revisão local.', schema({ candidate_id: identifier, package_sha256: hash, confirmar: confirm }), false, false),
  tool('enviar_contribuicao', 'Enviar candidato autorizado', 'Envia o candidato aprovado pelo dono para a fila privada de revisão da comunidade. É uma decisão separada de preparar e autorizar. Exige novo pedido explícito de envio e o mesmo hash; não publica no catálogo.', schema({ candidate_id: identifier, package_sha256: hash, confirmar: confirm }), false),
  tool('minhas_contribuicoes', 'Acompanhar contribuições', 'Consulta as contribuições que a plataforma autoriza esta instalação a consultar. O estado é consultado agora; candidato enviado não significa publicado.', schema()),
  tool('status_contribuicao', 'Ver estado da contribuição', 'Consulta o estado de uma contribuição autorizada, sem trazer o pacote bruto. Revisão e publicação são feitas pelo revisor autorizado na plataforma, nunca por esta ferramenta.', schema({ contribution_id: identifier })),
  ...MEMBER_SURFACE_TOOLS,
]);

// Select metadata instead of serializing arbitrary service payloads. In particular,
// package bytes, source content, identity, credentials and grants never leave here.
const FIELDS = new Set(['slug', 'system_id', 'version', 'title', 'description', 'maturity', 'package_sha256', 'first_task',
  'entrypoint', 'requirements', 'minimum_brain_version', 'release', 'releases', 'status', 'id', 'candidate_id',
  'candidateId', 'packageSha256', 'summary', 'created_at', 'updated_at', 'published_at', 'reviewed_at',
  'contribution', 'contributions', 'can_review', 'decision', 'notes', 'reason', 'code', 'message',
  'installed', 'already_installed', 'receipt_pending', 'receipt_status', 'runtime', 'plan', 'writes',
  'destination', 'target', 'target_directory', 'bundle_directory', 'workspace_directory', 'contract_directory',
  'local_path', 'review_path', 'candidate_path', 'files', 'file_count', 'fileCount', 'total_bytes', 'bytes', 'sha256',
  'path', 'encoding', 'selected_paths', 'selectedPaths', 'changed_files', 'changes', 'diff', 'risks', 'warnings',
  'next_step', 'next_steps', 'preserved', 'confirmation_required', 'share_confirmed', 'approved', 'sent',
  'prepared', 'base_package_sha256', 'scope', 'preview', 'read_only', 'network', 'local_only', 'format',
  'receipt', 'receipt_id', 'state', 'installed_path', 'file_changes', 'before_sha256', 'after_sha256',
  'refs', 'system', 'bundle', 'workspace', 'grant_consumed', 'executes_package', 'private_workspace_preserved',
  'source_bindings', 'same_release', 'package_ref', 'generated_paths', 'content_review_required', 'contracts',
  'remote_receipt', 'recovery', 'published', 'submitted_at']);
export function communityMetadata(value, depth = 0) {
  if (depth > 10) return null;
  if (Array.isArray(value)) return value.slice(0, 512).map(item => communityMetadata(item, depth + 1));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => FIELDS.has(key)).map(([key, item]) => [key, communityMetadata(item, depth + 1)]));
  if (typeof value === 'string') return value.slice(0, 12_000);
  return typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)) || value === null ? value : null;
}

export async function loadCommunityServices({ root, endpoint, allowLocalhost = false }) {
  const [clientModule, packageModule, contribution] = await Promise.all([
    import('./community-client.mjs'), import('./community-package.mjs'), import('./community-contribution.mjs'),
  ]);
  const client = clientModule.createCommunityClient({ root, endpoint, allowLocalhost });
  return {
    list: () => client.listReleases(), details: slug => client.getRelease({ slug }),
    install: args => packageModule.installCommunityRelease({ root, client, ...args }),
    prepare: args => contribution.prepareContribution({ root, ...args }),
    localReview: candidateId => contribution.reviewContributionCandidate({ root, candidateId }),
    approve: args => contribution.approveContribution({ root, ...args }),
    send: args => contribution.sendContribution({ root, client, ...args }),
    contributions: () => client.listContributions(), contribution: id => client.getContribution({ contribution_id: id }),
    memberSurface: (action, args) => client.request(action, args),
  };
}

const ERRORS = new Map([
  ['access_denied', 'Sua instalação não tem acesso a esta operação agora. Confira seu acesso na plataforma.'],
  ['society_access_required', 'Esta operação precisa de acesso vigente à Society. Confira sua assinatura na plataforma.'],
  ['install_credential_missing', 'Esta instalação ainda não está vinculada. Abra o Cérebro pela sua conta na plataforma.'],
  ['confirmation_required', 'O dono precisa aprovar esta ação antes de continuar.'],
  ['contribution_not_approved', 'Confira o candidato e autorize o hash exato antes de pedir o envio.'],
  ['package_hash_mismatch', 'O pacote mudou. Confira a versão e o hash atuais antes de continuar.'],
  ['candidate_hash_mismatch', 'O candidato mudou. Confira novamente os arquivos e o hash antes de aprovar ou enviar.'],
  ['approval_hash_mismatch', 'A autorização pertence a outra versão. Confira o candidato atual e autorize seu hash.'],
  ['approval_required', 'Confira o candidato e autorize o hash exato antes de pedir o envio.'],
  ['installation_credentials_required', 'Esta instalação ainda não está vinculada. Abra o Cérebro pela sua conta na plataforma.'],
  ['installation_credentials_invalid', 'O vínculo desta instalação precisa ser recuperado pela sua conta na plataforma.'],
  ['sensitive_content_requires_redaction', 'Um dos arquivos selecionados pode conter informação privada. Remova esse conteúdo antes de preparar a contribuição.'],
  ['private_selection_refused', 'Esta seleção contém uma pasta privada. Selecione somente a melhoria do método que deseja compartilhar.'],
  ['profile_revision_conflict', 'Seu perfil mudou desde a leitura. Consulte o perfil atual, prepare outra prévia e confirme as mudanças novamente.'],
  ['profile_preview_mismatch', 'As mudanças não correspondem à prévia aprovada. Prepare outra prévia e confirme o conteúdo exato antes de salvar.'],
  ['profile_not_found', 'Seu perfil ainda não foi criado. Abra a área de perfil na plataforma para iniciá-lo e depois consulte novamente pela IA.'],
  ['profile_incomplete', 'Ainda faltam campos para publicar. Consulte seu perfil para conferir as pendências; adicione a foto pela plataforma.'],
  ['invalid_profile_changes', 'As mudanças do perfil contêm campos ou valores inválidos. Confira a prévia e ajuste somente os campos permitidos.'],
  ['profile_confirmation_required', 'O dono precisa aprovar esta ação sobre o perfil antes de continuar.'],
  ['invalid_profile_revision', 'Consulte o perfil atual e use a revisão devolvida para preparar e aprovar a mudança.'],
  ['library_item_not_found', 'Esta aula ou encontro não está disponível para sua conta agora. Consulte o acervo atual na plataforma.'],
  ['invalid_member_surface_arguments', 'Confira os campos do perfil, os links e a confirmação da ação. Nenhuma mudança foi enviada.'],
]);

export function createCommunityToolHandler({ root, endpoint, allowLocalhost = false, services, serviceLoader = loadCommunityServices }) {
  if (typeof root !== 'string' || !isAbsolute(root)) throw new Error('community-mcp-root-required');
  const brainRoot = resolve(root);
  const known = new Map(COMMUNITY_TOOLS.map(item => [item.name, item]));
  let loaded = services;
  return async (name, args) => {
    if (!known.has(name)) throw new Error('community-mcp-tool-unavailable');
    if (!matchesSchema(args, known.get(name).inputSchema)) throw new Error('community-mcp-arguments-invalid');
    try {
      loaded ||= await serviceLoader({ root: brainRoot, endpoint, allowLocalhost });
      let result;
      const surfaceAction = memberSurfaceAction(name);
      if (surfaceAction) {
        const fields = memberSurfaceArguments(args);
        validateMemberSurfaceRequest(surfaceAction, fields);
        result = await loaded.memberSurface(surfaceAction, fields);
      }
      else if (name === 'listar_sistemas_comunidade') result = await loaded.list();
      else if (name === 'detalhar_sistema_comunidade') result = await loaded.details(args.slug);
      else if (name === 'planejar_instalacao_sistema') result = await loaded.install({ slug: args.slug, confirm: false });
      else if (name === 'instalar_sistema_comunidade') result = await loaded.install({ slug: args.slug, expectedSha256: args.package_sha256, confirm: true });
      else if (name === 'preparar_contribuicao') result = await loaded.prepare({ slug: args.slug, sourceDir: args.source_dir, selectedPaths: args.selected_paths, version: args.version, summary: args.summary, confirm: true });
      else if (name === 'revisar_contribuicao_local') result = await loaded.localReview(args.candidate_id);
      else if (name === 'autorizar_envio_contribuicao') result = await loaded.approve({ candidateId: args.candidate_id, packageSha256: args.package_sha256, confirm: true });
      else if (name === 'enviar_contribuicao') result = await loaded.send({ candidateId: args.candidate_id, packageSha256: args.package_sha256, confirm: true });
      else if (name === 'minhas_contribuicoes') result = await loaded.contributions();
      else result = await loaded.contribution(args.contribution_id);
      const metadata = surfaceAction ? projectMemberSurfaceResult(surfaceAction, result) : communityMetadata(result);
      const data = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : { items: metadata };
      return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data, isError: false };
    } catch (error) {
      const message = ERRORS.get(error?.code || error?.message) || 'Não foi possível concluir esta operação. Confira o acesso na plataforma e o estado local antes de tentar novamente. Nenhuma aprovação ou publicação foi inferida.';
      return { content: [{ type: 'text', text: message }], isError: true };
    }
  };
}
