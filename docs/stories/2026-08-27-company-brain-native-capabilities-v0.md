# Company Brain Native Capabilities V0

## Objetivo

Fazer a página Cérebro responder o que esta instalação sabe sustentar hoje, como cada capacidade
é realizada e qual evidência sustenta seu estado. A experiência não cria mini-Sistemas nem um
catálogo paralelo: ela deriva capacidades do motor, das Skills, dos contratos e dos recibos que já
existem.

## Decisão de corte

- Capacidade nativa descreve **o que o Cérebro consegue sustentar**.
- Skill descreve **qual julgamento executável participa dessa capacidade**.
- Provider descreve **qual implementação substituível está ativa**.
- Sistema descreve **qual resultado de negócio é entregue sobre o Cérebro**.
- A Visão geral apresenta seis capacidades estáveis e abre as superfícies constitucionais que já
  existem; Skills continua com catálogo próprio e Society continua fora deste corte.
- Estado nunca nasce da presença de um card. `declarada`, `disponível`, `operacional` e `medida`
  são calculados por evidência observável e deixam lacunas explícitas.

## Acceptance criteria

- [x] A Visão geral do Cérebro mostra seis capacidades nativas numa gramática única.
- [x] Cada capacidade expõe promessa curta, estado, prova, Skills instaladas, provider quando
      aplicável e quantidade de Sistemas sustentados.
- [x] Recuperação só aparece como `medida` quando existe benchmark auditado; GBrain aparece apenas
      como implementação atual e substituível.
- [x] Destilação não se apresenta como operacional enquanto bruto, processado e destilado não
      emitirem recibos canônicos.
- [x] Estrutura, avaliação e aprendizado derivam de System Contracts, Runs, evals, julgamentos,
      correções, outcomes e Learning Candidates reais.
- [x] Os cards abrem Memória, Recuperação, Arquitetura, Aprendizado, Sistemas ou Skills sem criar
      nova página ou novo contrato.
- [x] O read model continua reference-only e não envia corpo de Skill, conteúdo, query, snippets,
      output ou credencial ao navegador.
- [x] Testes cobrem todos os quatro estados, ausência de benchmark, Skill degradada, provider
      substituível, vínculos com Sistemas e a superfície visual.

## Fora do corte

- Experience Manifest e identidade de Sistemas.
- Society Registry, Marketplace, instalação ou atualização.
- Novo Brain Capability Contract.
- Executar Skills ou capacidades a partir do card.
- Instrumentar os recibos ainda ausentes de bruto, processamento, destilação e promoção.
- Alterar o design system das aplicações próprias dos Sistemas.

## Tasks

- [x] Criar o read model derivado das capacidades nativas.
- [x] Renderizar as capacidades na Visão geral do Cérebro.
- [x] Cobrir estados, privacidade, deep links e regressões.
- [x] Validar o Company Brain real e fechar recibo.

## Recibo

- Company Brain real: 6 capacidades renderizadas sobre 15 Fontes, 17 Sistemas, 8 Runs e 29 Skills.
- Recuperação: `91,4% Hit@3`, 75 casos, provider local via GBrain marcado como substituível.
- QA: desktop e 700 px sem overflow; deep links para Skills, Sistemas e Recuperação funcionais;
  zero erros ou warnings no navegador.
- Validação: teste dedicado, regressões de Cérebro e Skills e `npm test` verdes.

## File List

- `docs/stories/2026-08-27-company-brain-native-capabilities-v0.md`
- `scripts/console-server.mjs`
- `console/app.js`
- `console/styles.css`
- `scripts/test-company-brain-native-capabilities-v0.mjs`
- `scripts/validate-product.mjs`
