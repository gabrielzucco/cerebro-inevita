# Story — Company Brain: visão vivida e qualidade de recuperação V2

## Contexto

A página `Cérebro` já separa Memória, Recuperação, Aprendizado e Arquitetura e já possui um
benchmark local auditado. A Visão geral, porém, ainda começa pela anatomia técnica das capacidades
nativas. Para o membro, isso produz informação antes de orientação: ele precisa entender o que o
Cérebro já sustenta na vida da empresa, o que acabou de acontecer e o que merece atenção.

Este corte promove a qualidade de recuperação a ativo visível e verificável sem criar score
composto. O número continua sendo `Hit@3` do último Source Index Receipt concluído, acompanhado do
número de casos, taxa de falsos positivos, gate e data. A comparabilidade entre empresas continua
bloqueada até existir versão, conjunto de casos e política de corpus comuns.

## Acceptance criteria

- [x] A Visão geral abre com `Seu Cérebro hoje` e fatos operacionais observados, não com conceitos
      técnicos ou contagem de arquivos.
- [x] A qualidade de recuperação aparece na primeira dobra com nome da métrica, percentual,
      número de casos, falsos positivos, gate e data da medição.
- [x] A UI afirma explicitamente que o benchmark é local e ainda não é ranking da Society.
- [x] Nenhum score composto, prontidão de Sistemas ou comparação entre empresas é inferido.
- [x] `O que ele já sustenta` traduz Fontes, avaliação e aprendizado em efeitos legíveis na vida
      da empresa, preservando a prova curta de cada capacidade.
- [x] `Atividade observada` apresenta o último Run, a última recuperação e a geração do índice sem
      alegar causalidade ou mudança que os recibos não provam.
- [x] `Pede atenção` continua visível e separado de atividade, qualidade e aprendizado.
- [x] As seis capacidades nativas permanecem inspecionáveis em divulgação progressiva e não
      dominam mais a primeira camada.
- [x] A vista completa de Recuperação e as outras quatro áreas do Cérebro permanecem funcionais.
- [x] Desktop e mobile possuem regras responsivas que preservam leitura linear e evitam overflow.
- [x] Teste estrutural protege a métrica, a honestidade da comparação e a nova hierarquia.

## Fora deste corte

- Criar benchmark da Society ou ranking entre empresas.
- Definir um índice proprietário composto de qualidade.
- Instrumentar novas transições de bruto, processado ou destilado.
- Calcular prontidão dos Sistemas sem políticas de frescor machine-readable.
- Alterar Retrieval Provider, GBrain, contratos ou recibos.
- Criar BI de marketing, CRM, funil ou tarefas dentro do Cérebro.

## Tarefas

- [x] Reorganizar a Visão geral em fatos vividos e uma âncora principal de recuperação.
- [x] Mover a anatomia completa das capacidades para divulgação progressiva.
- [x] Criar estilos responsivos sem nova paleta ou decoração de marketplace.
- [x] Adicionar teste de contrato visual e semântico.
- [x] Rodar regressões do Company Brain e validação do produto.
- [x] Registrar revisão e recibo da mesa.

## File List

- `docs/stories/2026-08-28-company-brain-lived-overview-v2.md`
- `docs/design-reviews/2026-08-28-company-brain-lived-overview-v2.md`
- `console/app.js`
- `console/styles.css`
- `scripts/test-company-brain-lived-overview-v2.mjs`
- `scripts/validate-product.mjs`

## Verificação

- `node --check console/app.js` e o teste novo — verdes.
- Regressões de capacidades, polish, control center, recuperação, estados inválidos, mapa,
  orientação e launcher — verdes.
- `npm test` — verde: protocolo válido, 22 envelopes, três Sistemas e 33 arquivos de Skills.
- `git diff --check` nos arquivos do corte — verde.
- A inspeção visual automatizada do localhost foi bloqueada pela política do navegador desta
  sessão; o servidor oficial segue em `http://127.0.0.1:4782/` para revisão humana.
- A suíte ampla do servidor encontrou uma pendência externa no Run de uma rotina (`failed` em vez
  de `completed`) em arquivos já modificados por outra frente; não pertence a este corte de UI.
