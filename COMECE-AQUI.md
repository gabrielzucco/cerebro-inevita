# Comece aqui

Este é o **cérebro do teu negócio**. Ele começa com o acervo dos engenheiros de
IA do **AI Engineer World's Fair**, em San Francisco, e fica mais valioso quando
cruza esse conhecimento com o contexto que tu já produz: calls, anúncios,
decisões e dados reais.

## Se uma IA já está lendo esta pasta

Não mande a pessoa trocar de ferramenta. Identifique o ambiente, carregue a
skill `comecar` e conduza a primeira sessão aqui mesmo:

| Ambiente | Skills | Como começar |
|---|---|---|
| Claude Code | `.claude/skills/` | `/comecar` |
| Codex | `.agents/skills/` | `$comecar` ou “quero começar” |
| Gemini CLI | `.agents/skills/` | “quero começar” |
| Antigravity | `.agents/skills/` | “quero começar meu cérebro” |
| Outro agente local | `.agents/skills/` | ler `comecar/SKILL.md` e seguir |

O agente precisa conseguir abrir esta pasta, ler e editar arquivos e executar
scripts. Se ele só recebeu arquivos como base de conhecimento, consegue
**consultar o acervo**, mas não consegue manter o cérebro completo acumulando
contexto.

## Não usa nenhum agente?

Comece gratuitamente pelo **Google Antigravity** (aplicativo visual) ou pelo
**Gemini CLI**. Claude Code e Codex também funcionam; use o ambiente que tu já
tem. Nenhuma assinatura específica é pré-requisito do cérebro.

## A primeira vitória

A skill `comecar` entrega o acervo primeiro. Faz uma pergunta real e recebe uma
resposta com fonte e minutagem. Quando a pergunta tocar teu negócio, o cérebro
oferece o contraste: responder genérico ou aprender o teu contexto e responder
pro teu caso.

Exemplos:

- Por que os times de ponta pararam de discutir modelo e passaram a falar de contexto?
- Onde os agentes quebram quando entram num negócio real?
- Como transformar calls, anúncios e decisões em memória que trabalha?

## As skills

- `comecar` — primeira resposta rastreável e ponte pro teu contexto.
- `metodo` — entende e aplica os quatro movimentos.
- `guardar` — transforma uma fonte real numa nota verificável; tu aprova antes.
- `call` — trata reunião em decisões, ações e memória.
- `daily` — fecha o dia sem deixar o julgamento evaporar.
- `teste` — mede o que o cérebro sabe e compara com a rodada anterior.
- `revisar` e `reindex` — mantêm o contexto fresco e encontrável.
- `atualizar` — traz melhorias do motor sem tocar no contexto privado.

## Como teu cérebro é organizado

- `meu-negocio/fios/` — o que está quente agora.
- `meu-negocio/` — oferta, ICP, posicionamento, decisões e o que funciona.
- `conhecimento/` — referências que podem ser cruzadas com teu caso.
- `capturas/` — fontes brutas antes de virarem memória tratada.
- `privado/` — dados pessoais que nunca entram no repositório.

## Privacidade e telemetria

Teu contexto fica nos arquivos desta pasta e nunca é enviado para a INEVITA. O
provedor do agente escolhido pode processar o conteúdo que tu coloca na conversa;
confira os termos dele antes de usar informação sensível.

Para medir se a experiência funciona, o cérebro envia um ping mínimo quando uma
skill é usada: código aleatório da instalação, evento, versão, sistema operacional
e runtime. Nunca envia o conteúdo dos arquivos. O vínculo opcional com teu acesso
usa `.cerebro/member-id`, um UUID opaco. Para desligar a telemetria, crie
`.cerebro/sem-telemetria`. O código está aberto em `.agents/scripts/ping.mjs`.
