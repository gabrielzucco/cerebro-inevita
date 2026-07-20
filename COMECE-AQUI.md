# Comece aqui

Este é o **cérebro operacional do seu negócio**. Ele cruza seu contexto com referências de campo e,
principalmente, transforma fonte real em resultado por sistemas que deixam rastro e melhoram.

## Se uma IA já está lendo esta pasta

Não troque de ferramenta nem de sessão. O agente que instalou ou encontrou esta pasta deve ler este
arquivo e a skill `comecar` diretamente, e conduzir a primeira entrega na conversa atual. O comando
de slash é um atalho, não um requisito.

| Ambiente | Skills | Entrada |
|---|---|---|
| Claude Code | `.claude/skills/` | `/comecar` |
| Codex | `.agents/skills/` | `$comecar` ou “quero começar” |
| Gemini CLI | `.agents/skills/` | “quero começar” |
| Antigravity | `.agents/skills/` | “quero começar meu cérebro” |
| outro agente local | `.agents/skills/` | ler `comecar/SKILL.md` |

O agente precisa abrir esta pasta, ler e editar arquivos e executar scripts. Se ele só recebe
arquivos como base de conhecimento, consulta o acervo, mas não mantém o cérebro acumulando contexto.

Se a instalação começou fora desta pasta, o agente pode usar o caminho absoluto como diretório de
trabalho. Só peça para abrir uma nova sessão quando o ambiente realmente não conseguir ler, escrever
ou executar aqui. Antes disso, grave a primeira tarefa e o estágio em
`operacao/decisoes-pendentes/onboarding.md`; a sessão seguinte retoma sem repetir perguntas.

Quando houver mais de um Cérebro no computador, o agente mostra as opções e a pessoa escolhe. Ele
nunca decide sozinho qual é o “real” ou “de teste”. “Novo e limpo” significa criar outra pasta sem
alterar ou apagar nenhuma instalação existente.

## Não usa nenhum agente pago?

Comece pelo Google Antigravity ou Gemini CLI. Claude Code e Codex também funcionam. O cérebro não
exige uma assinatura específica e o primeiro sistema opera com arquivos locais.

## A primeira experiência

O cérebro começa entendendo uma situação recorrente do seu trabalho: o que ocupa tempo, volta para
suas mãos ou ainda depende da sua decisão. Depois localiza onde esse trabalho deixa rastros e pede
somente um caso recente — uma reunião, conversa, mensagem, documento ou outro material real.

`situação recorrente → menor fonte real → algo pronto para usar → ajuste → contexto para a próxima`

Uma reunião pode virar decisões e ações; um briefing, uma mensagem ou uma proposta pedem outro
tipo de entrega. O cérebro escolhe o formato pelo trabalho, não força todo material a virar resumo.

O acervo do AI Engineer World's Fair continua disponível com fonte e minuto do vídeo, mas funciona
como referência para melhorar uma decisão. Ele não substitui o contexto do seu negócio.

## O mapa

- `meu-negocio/` — seu contexto privado.
- `sistemas/` — resultados instalados e suas réguas.
- `skills/` — julgamentos reutilizáveis do motor.
- `conexoes/` — arquivos e integrações opcionais.
- `operacao/` — o que rodou, falhou, escalou e melhorou.
- `comunidade/inevita/` — o que recebemos da INEVITA.
- `comunidade/minhas-contribuicoes/` — o que você pode decidir compartilhar.
- `conhecimento/` — referências externas; `capturas/` — bruto; `privado/` — PII local.

## Privacidade, ping e comunidade

Seu contexto fica local. Para medir ativação, o cérebro envia ping mínimo: código aleatório da
instalação, evento, versão, sistema operacional, runtime e, quando existe, `system_id`. Nunca envia
fonte, output, decisão, erro ou texto. Desligar: crie `.cerebro/sem-telemetria`.

Quando encontra um padrão útil, o cérebro pode perguntar se você quer **preparar** uma contribuição
anonimizada. Ele mostra o payload exato. Aprovar não envia; enviar pede outro “sim”. A rede e o
marketplace ainda estão em construção — o cérebro não simula um envio que não existe.
