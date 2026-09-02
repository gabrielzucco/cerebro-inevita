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
node scripts/cockpit.mjs --demo       # dados sintéticos, nenhuma escrita ou comando
node scripts/cockpit.mjs --no-open    # não abre o navegador
node scripts/cockpit.mjs --port 4999  # usa uma porta específica
node scripts/cockpit.mjs --root /caminho/do/cerebro
```

O comando antigo `node scripts/console-server.mjs` continua funcionando na porta 4782.

## O que aparece

- **Agora:** próximo passo, entregas para julgar, rotinas e estado do Hermes.
- **Ativação:** `Começou → Fonte pronta → Primeira entrega → Aprovado → Reutilizado`. T0–T4 fica
  como código secundário; T4 é a prova de que o contexto aprovado voltou numa tarefa nova.
- **Cérebro:** mapa, Sistemas, Fontes e Conexões.
- **Operar:** Rotinas, Julgamentos, Execuções, Decisões e Experimentos.
- **Hermes:** instalação guiada, provider, contexto do projeto, Telegram, serviço e diagnóstico.
- **INEVITA:** catálogo que já existe no repositório e convite para
  [inevitasociety.com](https://inevitasociety.com).

## Conectar o Hermes ao Telegram

O Cockpit conduz seis passos, mas respeita as superfícies oficiais do Hermes:

1. **Instalação:** copie o instalador oficial exibido para macOS/Linux ou Windows. O Cockpit não
   executa instaladores remotos.
2. **Provider:** escolha uma rota no terminal:
   - Nous Portal — assinatura da Nous, via `hermes setup --portal`;
   - OpenAI Codex — assinatura ChatGPT/Codex, pelo assistente `hermes model`;
   - outro provider — API key ou endpoint compatível, também por `hermes model`.
   A credencial do provider nunca entra no Cockpit.
3. **Cérebro:** autorize este repositório como diretório de trabalho e confie explicitamente nas
   skills de `.agents/skills/`. Versões antigas do Hermes precisam de `hermes update` antes.
4. **Telegram:** crie o bot no `@BotFather`, informe o token no campo secreto e adicione pelo menos
   um ID numérico de usuário. O ID pode ser consultado no `@userinfobot`.
5. **Gateway:** instale o serviço do usuário e deixe-o iniciar com a sessão da máquina.
6. **Validação:** rode o diagnóstico e mande “quero começar” para o bot.

O token é escrito diretamente no `.env` oficial do perfil Hermes, nunca em argumento de comando.
O arquivo recebe permissão `0600` em sistemas POSIX. O Cockpit força allowlist, mantém
`GATEWAY_ALLOW_ALL_USERS` desligado e nunca devolve o token pela API, tela ou log.

## Fronteira humana

Confiar nas skills permite que o Hermes use o método do Cérebro. Não habilita modo autônomo. O
agente pode propor uma captura, uma decisão ou uma mudança, mas a escrita continua dependendo da
aprovação do dono, conforme `AGENTS.md` e `CLAUDE.md`.

O Cockpit não contém chat: a conversa acontece no Telegram. Também não configura memória avançada,
modelos finos, Paperclip, WhatsApp ou automações sem supervisão nesta versão.

## Roteiro curto para aula ao vivo

1. Abra em `--demo` e mostre a diferença entre “IA pronta” e “contexto que volta”.
2. Passe pelos cinco marcos sem expor os códigos T0–T4 como conteúdo principal.
3. Mostre uma entrega esperando julgamento: output de IA continua rascunho.
4. Conecte um Hermes real pelo fluxo guiado, usando uma credencial preparada para a aula.
5. No Telegram, peça uma resposta sobre uma fonte do cérebro e depois peça a reutilização do
   contexto aprovado.
6. Volte ao Cockpit para mostrar o avanço e o rastro local.
7. Feche na área INEVITA: o cérebro gratuito organiza o contexto individual; a comunidade
   acrescenta sistemas, referências e ciclos validados sem receber as fontes privadas.

Antes da transmissão, teste em uma instalação descartável, não mostre token, e-mail, ID de usuário,
nome de cliente ou conteúdo privado na tela compartilhada.

## Fontes oficiais do Hermes

- [Quickstart](https://hermes-agent.nousresearch.com/docs/getting-started/quickstart)
- [Context files](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files)
- [Project-local skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)
- [Telegram](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)
- [Segurança](https://hermes-agent.nousresearch.com/docs/user-guide/security)
