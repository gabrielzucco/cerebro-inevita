#!/usr/bin/env node
import { existsSync, realpathSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCommunityClient } from './lib/community-client.mjs';
import { communityAssert, installCommunityRelease } from './lib/community-package.mjs';
import { prepareContribution, reviewContributionCandidate, approveContribution, sendContribution } from './lib/community-contribution.mjs';

export const COMMUNITY_HELP = `Sistemas da comunidade — Cérebro INEVITA

Uso: node scripts/community.mjs <comando> [flags]
  list                                 Sistemas disponíveis ao seu acesso atual.
  show --slug=<slug>                    Versão, hash e primeira tarefa.
  install --slug=<slug>                 Preview: não escreve nem consome grant.
  install --slug=<slug> --sha256=<hash> --confirm [--runtime=codex]
                                       Instala a versão revisada; não executa pacote.
  prepare --slug=<instalado> --source-dir=<pasta-relativa>
    --file=<caminho-relativo> [--file=<outro>] --version=<nova>
    --summary=<texto> [--confirm]       Prepara só a seleção; sem confirm é preview.
    Alternativa local: --base-package=<envelope-relativo> em lugar de --slug.
  review --candidate=<id>               Confira arquivos, hashes e payload local.
  approve --candidate=<id> --sha256=<hash> --confirm
                                       Autoriza o hash; ainda não envia.
  send --candidate=<id> --sha256=<hash> --confirm
                                       Envia à revisão; não publica.
  contributions                        Acompanha suas contribuições.
  contribution --id=<id>               Detalhe autorizado da contribuição.
  --help                               Esta ajuda, sem rede nem escrita.

Raiz: CEREBRO_INSTALL_ROOT (padrão: este Cérebro).
Credenciais existentes: .cerebro/id e .cerebro/install-credential; nunca passe por flags.
Endpoint opcional: CEREBRO_DISTRIBUTION_URL; localhost exige CEREBRO_COMMUNITY_ALLOW_LOCALHOST=1 nos testes.
Verificação automática: node scripts/test-community-all.mjs [--funil=/caminho/do/RC]
Revisão local, envio, revisão da comunidade e publicação são etapas separadas.
Conflito em contrato/wrapper: preserve sua edição e revise o diff; o instalador não sobrescreve.
Lock de instalação interrompida: inspecione lock, release, wrappers e estado antes de reparar;
o instalador não apaga automaticamente locks, staging ou arquivos de execução interrompida.
`;

export async function runCommunityCommand({ args, root, client }) {
  const [command, ...rest] = args;
  if (!command || command === '--help' || command === 'help') return { help: COMMUNITY_HELP };
  const option = (name) => rest.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  const confirm = rest.includes('--confirm');
  if (command === 'list') return client.listReleases();
  if (command === 'show') return client.getRelease({ slug: option('slug') });
  if (command === 'install') return installCommunityRelease({ root, slug: option('slug'), expectedSha256: option('sha256'), confirm, client, runtime: option('runtime') || 'codex' });
  if (command === 'prepare') return prepareContribution({ root, slug: option('slug'), basePackage: option('base-package'), sourceDir: option('source-dir'), selectedPaths: rest.filter((arg) => arg.startsWith('--file=')).map((arg) => arg.slice(7)), version: option('version'), summary: option('summary'), confirm });
  if (command === 'review') return reviewContributionCandidate({ root, candidateId: option('candidate') });
  if (command === 'approve') return approveContribution({ root, candidateId: option('candidate'), packageSha256: option('sha256'), confirm });
  if (command === 'send') return sendContribution({ root, candidateId: option('candidate'), packageSha256: option('sha256'), confirm, client });
  if (command === 'contributions') return client.listContributions();
  if (command === 'contribution') return client.getContribution({ contribution_id: option('id') });
  communityAssert(false, 'usage: community.mjs list|show|install|prepare|review|approve|send|contributions|contribution');
}
if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(process.env.CEREBRO_INSTALL_ROOT || dirname(fileURLToPath(import.meta.url)), process.env.CEREBRO_INSTALL_ROOT ? '.' : '..');
  try {
    const args = process.argv.slice(2);
    const help = !args.length || ['help', '--help'].includes(args[0]);
    const client = help ? null : createCommunityClient({ root, endpoint: process.env.CEREBRO_DISTRIBUTION_URL || undefined, allowLocalhost: process.env.CEREBRO_COMMUNITY_ALLOW_LOCALHOST === '1' });
    const result = await runCommunityCommand({ args: process.argv.slice(2), root, client }); console.log(result.help || JSON.stringify(result, null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
