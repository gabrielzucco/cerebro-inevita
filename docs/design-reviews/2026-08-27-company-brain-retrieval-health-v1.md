# Design review — Company Brain: Saúde e qualidade da recuperação V1

## First impression

A página agora comunica **se o Cérebro consegue encontrar contexto confiável**, antes de pedir que
o founder percorra o mapa da empresa. Meu olho vai primeiro para `91,4%`, depois para a definição
`Qualidade local da recuperação` e então para as três provas à direita. Em uma palavra:
**mensurável**.

As áreas são reconhecíveis em menos de dois segundos: qualidade, evidências, prova expandida e mapa.
O score não concorre com o Launcher, com o Canvas ou com indicadores do negócio.

## FINDING-001 — o mapa mostrava inventário, mas não provava recuperabilidade

**Impacto:** alto  
**Status:** verificado  
**Commit:** `c7e7ee1`

Antes, a página respondia o que existia e de onde vinha, mas não dizia se um Sistema conseguiria
recuperar o contexto certo. A correção adiciona uma única composição editorial acima do mapa:

- `91,4%` deriva do Hit@3 do último Source Index Receipt concluído;
- 75 casos, falso positivo, gate e data ficam junto ao número;
- índice, operação real e Context Snapshots permanecem provas distintas;
- seis gaps de Runs continuam visíveis mesmo com benchmark aprovado;
- provider genérico aparece antes do motor; GBrain fica nos detalhes como implementação atual;
- comparação de rede é recusada até existir benchmark, casos e política de corpus comuns.

O read model devolve somente contagens, estados, datas e referências permitidas. Query, conteúdo,
snippets, hashes completos, documentos selecionados e erro bruto não atravessam a interface.

## Hierarquia visual

- O score grande é o único novo âncora visual.
- Evidências usam linhas, não cards independentes nem mosaico de dashboard.
- Verde aparece somente no estado operacional e na régua do benchmark aprovado.
- A explicação técnica fica em disclosure progressivo e não polui a primeira leitura.
- O Mapa da empresa continua imediatamente abaixo como o segundo trabalho da página.

## Responsive e interação

- Desktop `1440 × 1000`: composição 1,25/0,75; prova e mapa permanecem legíveis.
- Mobile `375 × 812`: score, definição e provas empilham; sem overflow horizontal.
- `Como este número foi provado` abre provider, motor, circuito e privacidade sem nova rota.
- Alternância `Mapa da empresa / Anatomia atual` e busca local por `Ads` continuam funcionando.

## Quick wins preservados para o próximo corte

1. Congelar um Benchmark Contract comum antes de publicar comparação entre empresas.
2. Separar no futuro score protocolar comparável de benchmark privado específico da empresa.
3. Só quantificar bruto, processado e destilado quando conectores emitirem unidades observáveis e
   denominadores compatíveis; volume não pode fingir inteligência.

## Avaliação final

- **Design score:** A-. Hierarquia forte, informação densa e progressiva, sem criar outro produto.
- **AI-slop score:** A. Sem grid genérico de cards, gradiente ornamental, cor excessiva ou score
  inventado.
- **Goodwill:** 85/100. O principal ganho é saber imediatamente o que o número significa e abrir a
  prova sem sair da página; a limitação de comparabilidade aparece antes que o usuário conclua algo
  maior do que os dados autorizam.

**PR summary:** Design review encontrou uma lacuna de confiança e a fechou com um score auditado,
evidências operacionais e fallback honesto; Design A- → A-, AI slop A → A.
