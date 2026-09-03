# Cockpit INEVITA

O Cockpit é a superfície visual local do Cérebro INEVITA. Ele não cria um segundo banco e não
substitui os arquivos: mostra o estado que já existe no cérebro e permite operar apenas ações
explícitas, com confirmação humana.

## Abrir

Na raiz do Cérebro, com Node.js 20 ou superior:

```bash
node scripts/cockpit.mjs
```

O navegador abre em `127.0.0.1`. Se a porta 4782 estiver ocupada, o Cockpit tenta automaticamente
até a 4791. Opções úteis:

```bash
node scripts/cockpit.mjs --demo       # estado controlado, nenhuma escrita ou comando
node scripts/cockpit.mjs --no-open    # não abre o navegador
node scripts/cockpit.mjs --port 4999  # usa uma porta específica
node scripts/cockpit.mjs --root /caminho/do/cerebro
```

O comando antigo `node scripts/console-server.mjs` continua funcionando na porta 4782.

## O que aparece

- **Hoje:** fila operacional, próximo passo, entregas para julgar, rotinas e estado do Hermes.
- **Cérebro:** visão geral, memória, recuperação, aprendizado, arquitetura e atualizações.
- **Sistemas:** workspaces operacionais, estado, fontes, execução e evidência de cada Sistema.
- **Skills e Canvas:** capacidades instaladas e o grafo que conecta áreas, Sistemas, fontes,
  decisões, experimentos e rastros de execução.
- **Julgamento:** Caixa de Julgamento, Decision Cases, Rotinas e Runs auditáveis.
- **Estrutura:** Áreas, Fontes e Experimentos que sustentam a operação.
- **Confiança:** compatibilidade, governança e saúde do Cérebro.
- **Telegram:** preparação guiada do Hermes, Codex, contexto, allowlist, serviço e diagnóstico.
- **Society:** catálogo disponível no repositório e convite para
  [inevitasociety.com](https://inevitasociety.com).

Essa é a camada portátil do Console que a INEVITA usa na própria operação. Não são distribuídos a
sessão KOSMOS, o Supabase, o proxy, credenciais ou controles administrativos hospedados. No Cérebro
do membro, a fonte de verdade continua sendo a pasta local.

## Conectar o Hermes ao Telegram

O caminho principal tem três marcos e não pede comandos de terminal:

1. **Preparar o Hermes:** clique em “Preparar Hermes” e autorize o Codex na página oficial aberta
   pelo Hermes. O Cockpit reutiliza uma versão compatível; se precisar instalar, baixa o instalador
   oficial fixado, verifica SHA-256 e executa sem shell. Depois aponta o Hermes para este cérebro e
   conecta somente as skills locais.
2. **Conectar o Telegram:** crie um bot em `@BotFather` com `/newbot` e cole o token no campo
   secreto. O Cockpit valida o bot e apaga o token do formulário imediatamente.
3. **Começar a conversar:** mande `/start` em conversa privada. O Cockpit mostra a conta candidata;
   você clica “Sou eu”. Só então ele grava a allowlist, liga o serviço e roda o diagnóstico.

Você não informa provider, modelo, ID numérico, comandos do gateway ou comandos de diagnóstico. O
Codex é o provider principal e o modelo compatível continua sendo escolhido pelo Hermes. Providers
alternativos ficam fora do caminho principal, em configuração avançada do próprio Hermes.

O token é escrito diretamente no `.env` oficial do perfil Hermes, nunca em argumento de processo.
O arquivo e qualquer snapshot de rollback recebem permissão `0600` em sistemas POSIX. Enquanto o
Cockpit identifica o `/start`, o gateway fica parado para evitar dois consumidores. Mensagens
antigas, grupos e canais são ignorados. O Cockpit força allowlist, mantém os dois `ALLOW_ALL`
desligados e nunca devolve token ou ID numérico pela API, tela ou log.

Se a versão do Hermes oferecer `skills trust`, o Cockpit usa a confiança explícita do projeto. Em
versões compatíveis sem esse comando, ele registra apenas `.agents/skills` em
`skills.external_dirs`; a ausência do comando não bloqueia a ativação.

## Fronteira humana

Confiar nas skills permite que o Hermes use o método do Cérebro. Não habilita modo autônomo. O
agente pode propor uma captura, uma decisão ou uma mudança, mas a escrita continua dependendo da
aprovação do dono, conforme `AGENTS.md` e `CLAUDE.md`.

O Cockpit não contém chat: a conversa acontece no Telegram. Também não configura memória avançada,
modelos finos, Paperclip, WhatsApp, grupos do Telegram ou automações sem supervisão nesta versão.

## Roteiro curto para aula ao vivo

1. Abra em `--demo` e mostre a diferença entre “IA pronta” e “contexto que volta”.
2. Abra Cérebro e Canvas para tornar visível como fontes, Sistemas e decisões se conectam.
3. Mostre uma entrega esperando julgamento: output de IA continua rascunho.
4. Mostre um Run e seu rastro; navegar não chama modelo nem executa ação externa.
5. Mostre em `--demo` os três gestos da ativação, sem usar credencial real na transmissão.
6. Mostre uma conversa já preparada no Telegram: uma resposta sobre uma fonte e a reutilização do
   contexto aprovado.
7. Volte ao Cockpit para mostrar o avanço e o rastro local.
8. Feche na Society: o cérebro gratuito organiza o contexto individual; a comunidade
   acrescenta sistemas, referências e ciclos validados sem receber as fontes privadas.

O participante faz a ativação real depois da aula, com o Cockpit normal. BotFather, autorização
OAuth e “Sou eu” são os três gestos que permanecem humanos.

Antes da transmissão, teste em uma instalação descartável, não mostre token, e-mail, ID de usuário,
nome de cliente ou conteúdo privado na tela compartilhada.

## Fontes oficiais do Hermes

- [Quickstart](https://hermes-agent.nousresearch.com/docs/getting-started/quickstart)
- [Context files](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files)
- [Project-local skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)
- [Telegram](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)
- [Segurança](https://hermes-agent.nousresearch.com/docs/user-guide/security)
