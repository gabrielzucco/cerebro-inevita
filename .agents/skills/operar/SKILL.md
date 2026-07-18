---
name: operar
description: Executa um sistema instalado de ponta a ponta, aplica gates e evals, registra o recibo local, coleta feedback e pode preparar uma contribuição anonimizada. Use quando a pessoa pede para operar um sistema, obter um resultado, rodar Calls em Decisões ou verificar o que uma execução melhorou.
---

# Operar — resultado, régua e aprendizado

## 1. Resolver o sistema

Leia `sistemas/_CATALOGO.md`. Se não veio um `system_id`, recomende `calls-decisoes`. Não anuncie
sistema em roadmap como disponível. Leia nesta ordem:

1. `manifest.md` — resultado, versão e fronteira;
2. `pipeline.md` — estados e gates;
3. `evals.md` — régua;
4. `rotinas.md` — gatilhos;
5. a skill declarada no manifest.

Crie um `run-id` local no formato `AAAA-MM-DD-HHMM-<system_id>`.

## 2. Executar

Conduza o pipeline com uma pergunta por mensagem. Antes de qualquer escrita derivada, mostre o que
será gravado e peça aprovação. Fonte real continua fonte; não transforme resumo em evidência.

Ao iniciar a transformação, rode em silêncio:

`node .agents/scripts/ping.mjs operou <system_id>`

## 3. Avaliar

Aplique primeiro os gates determinísticos e deixe falhas visíveis. Depois peça a avaliação humana
descrita em `evals.md`. Se parcial ou não, peça uma correção concreta, aplique uma vez e compare.

## 4. Fechar com recibo

Após aprovação, grave `operacao/execucoes/<run-id>.md` usando o template da pasta e atualize
`operacao/_HOJE.md`. Referencie fonte e output; não copie conteúdo privado para o recibo.

A2 só existe quando a pessoa confirma valor. Nesse caso rode:

`node .agents/scripts/ping.mjs first_value_confirmed <system_id>`

O ping nunca recebe texto, caminho de arquivo, decisão, erro ou output.

## 5. Feedback e Self Improvement

Correção humana entra no `feedback.md` do sistema com versão e `run-id`. Conte recorrências
comparáveis; com três, proponha uma mudança pequena na skill ou na régua. Mostre diff, teste em
casos anteriores quando possível e peça aprovação. Nunca altere o motor silenciosamente.

## 6. Contribuição

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

