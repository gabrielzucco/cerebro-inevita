---
name: operar
description: Executa um sistema instalado de ponta a ponta, aplica gates e evals, registra o recibo local, coleta feedback e pode preparar uma contribuição anonimizada. Use quando a pessoa pede para operar um sistema, obter um resultado, rodar Calls em Decisões ou verificar o que uma execução melhorou.
---

# Operar — resultado, régua e aprendizado

## 1. Resolver o sistema

Leia `sistemas/_CATALOGO.md` e, quando existir, `sistemas/outros-instalados/_CATALOGO.md`. Se não
veio um `system_id`, recomende entre os sistemas realmente instalados. Não anuncie sistema em
roadmap como disponível. Leia nesta ordem:

1. `manifest.md` — resultado, versão e fronteira;
2. `pipeline.md` — estados e gates;
3. `evals.md` — régua;
4. `rotinas.md` — gatilhos;
5. a skill declarada no manifest.

Crie um `run-id` local no formato `AAAA-MM-DD-HHMM-<system_id>`.

## 2. Recuperar caminhos que já funcionaram

Antes de executar, consulte no máximo os três recibos aprovados mais recentes desse sistema,
o `feedback.md` e `operacao/o-que-melhorou/`. Procure um caminho comparável: mesmo objetivo,
tipo de fonte, gates e output esperado.

- Reutilize somente procedimento ligado a run que passou na régua **e** foi aprovado pelo dono.
- Trate o procedimento como ponto de partida, nunca como verdade que dispensa contexto.
- Falha, tentativa trivial ou conversa que não chegou a executar nunca vira procedimento.
- Não reabra conteúdo bruto só para reconstruir o caminho; use recibos, referências e decisões.

## 3. Executar

Conduza o pipeline com uma pergunta por mensagem. Antes de qualquer escrita derivada, mostre o que
será gravado e peça aprovação. Fonte real continua fonte; não transforme resumo em evidência.

Ao iniciar a transformação, rode em silêncio:

`node .agents/scripts/ping.mjs operou <system_id>`

## 4. Avaliar

Aplique primeiro os gates determinísticos e deixe falhas visíveis. Depois peça a avaliação humana
descrita em `evals.md`. Se parcial ou não, peça uma correção concreta, aplique uma vez e compare.

## 5. Fechar com recibo

Após aprovação, grave `operacao/execucoes/<run-id>.md` usando o template da pasta e atualize
o brief local com:

`node scripts/generate-operating-brief.mjs`

Referencie fonte e output; não copie conteúdo privado para o recibo.

A2 só existe quando a pessoa confirma que **usaria ou usou o output na operação real** — run
aprovado sozinho não é valor. Só nesse caso rode:

`node scripts/system-run.mjs <system_id> confirm-value`

O evento enviado nunca recebe texto, caminho de arquivo, decisão, erro ou output.

## 6. Memória procedural e Self Improvement

Depois de um run que passou na régua e foi aprovado, pergunte se o dono quer guardar o caminho como
**procedimento candidato**. Se aprovar, grave
`operacao/o-que-melhorou/<data>-procedimento-<system_id>.md` com:

- `run-id` e versão que provaram o caminho;
- objetivo, gatilho e tipo de contexto em que ele serve;
- passos generalizados, interfaces/ferramentas usadas e pontos de decisão;
- gates, output esperado, eval que passou e situação em que **não** deve ser usado;
- referência da prova, sem PII, conteúdo bruto, segredo ou caminho absoluto.

Isso é memória procedural: lembrar **como um trabalho deu certo**, não só o que foi decidido.
Falha não vira procedimento. Um procedimento candidato também não altera skill, pipeline ou eval
sozinho.

Correção humana entra no `feedback.md` do sistema com versão e `run-id`. Conte recorrências
comparáveis. Com três caminhos aprovados para o mesmo objetivo, proponha uma mudança pequena na
skill, pipeline ou régua. Mostre o diff, faça replay nos casos anteriores quando possível e peça
aprovação. Se a mudança piorar qualquer caso importante, mantenha o motor atual e registre a
exceção. Nunca altere o motor silenciosamente.

## 7. Contribuição

Só sugira quando houver aprendizado generalizável, fonte autorizada e baixo risco de reidentificação.
Pergunte se pode **preparar**. Se sim:

1. Crie rascunho em `comunidade/minhas-contribuicoes/propostas/`.
2. Inclua problema generalizado, padrão, sistema/versão, evidência anonimizada, itens removidos e
   **payload exato**.
3. Rode em silêncio `node .agents/scripts/ping.mjs contribution_prepared <system_id>` — evento sem
   conteúdo.
4. Mostre o arquivo e peça aprovação. Se aprovado, mova para `aprovadas/` e rode
   `contribution_approved`; isso **não envia**.
5. Para enviar, explique destino e peça novo “sim”. Sem endpoint oficial disponível, não simule
   envio: mantenha aprovado localmente e diga que aguarda o canal da INEVITA.

PII, bruto, segredo, nome de cliente, números identificáveis e decisão privada bloqueiam a
contribuição. Na dúvida, não preparar.
