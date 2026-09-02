# Design Review — Company Brain: visão vivida e recuperação V2

## Status

**PASS estrutural** — a nova hierarquia está implementada e protegida por testes. A inspeção
visual automatizada do localhost não foi concluída porque a política do navegador bloqueou a URL
local nesta sessão; o servidor oficial permanece disponível em `http://127.0.0.1:4782/` para o
pente-fino humano.

## O que mudou

- A primeira pergunta passou de “como o Cérebro é construído?” para “o que ele já consegue
  devolver ao trabalho?”.
- Fontes observadas, integridade dos Runs e julgamento humano aparecem como fatos distintos.
- `Hit@3` virou a âncora principal da página e leva percentual, casos, falsos positivos, gate e
  data da medição.
- A comparação continua corretamente limitada a benchmark local; a UI não declara ranking da
  Society.
- Fontes, avaliação e aprendizado aparecem como três efeitos legíveis da vida da empresa.
- O último Run, a última recuperação e a geração vigente do índice aparecem como atividade
  observada, sem alegar causalidade ou mudança não provada.
- As seis capacidades nativas continuam disponíveis, mas nascem recolhidas em `Como este Cérebro
  funciona`.

## Decisões de design

### Uma âncora, não um dashboard de cards

A qualidade de recuperação é a única métrica hero. Os demais fatos usam linhas, hairlines e
tipografia da casca atual. Nenhuma nova paleta, faixa de categoria ou decoração de marketplace foi
introduzida.

### Prova antes de comparação

O percentual nunca aparece sozinho. A mesma superfície diz `Hit@3`, quantos casos foram auditados,
qual foi a taxa de falsos positivos, se o gate passou e quando a medição ocorreu. O CTA abre a
vista completa de Recuperação com Runs e recibos agregados.

### Vida na primeira camada; anatomia na segunda

A primeira camada fala de realidade entrando, trabalho sustentado, julgamento, atividade e
cuidado. Skills, provider e a anatomia das seis capacidades continuam inspecionáveis em divulgação
progressiva.

## Fronteiras preservadas

- Não existe score composto.
- Não existe prontidão inferida de Sistemas.
- Não existe ranking entre empresas.
- Não existe contagem inventada de bruto, processado ou destilado.
- GBrain não foi promovido a produto nem alterado; continua implementação substituível.
- A vista completa de Recuperação, Memória, Aprendizado e Arquitetura não foi removida.

## Verificação automatizada

- `node --check console/app.js` — verde.
- `node scripts/test-company-brain-lived-overview-v2.mjs` — verde.
- Regressões de capacidades, polish, control center, recuperação, estados inválidos, mapa,
  orientação e launcher — verdes.
- `npm test` — verde: protocolo válido, 22 envelopes, três Sistemas e 33 arquivos de Skills.
- `git diff --check` nos arquivos do corte — verde.

## Pendência externa observada

`node scripts/test-console-server.mjs` chegou ao servidor e falhou no contrato de execução de uma
rotina: o teste esperava `completed` e recebeu `failed`. A falha ocorre em arquivos de runtime/teste
já modificados por outra frente e não foi escondida nem absorvida por este corte de interface.

