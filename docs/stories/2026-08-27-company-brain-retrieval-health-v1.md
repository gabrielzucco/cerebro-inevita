# Story — Company Brain: Saúde e qualidade da recuperação V1

## Contexto

O `Mapa da empresa` tornou reconhecível o que existe no Cérebro, mas ainda não responde se esse
contexto pode sustentar trabalho hoje. O diferencial do Company Brain não é volume de arquivos: é
provar que um Sistema recuperou contexto suficiente, atual e permitido.

Este corte torna a qualidade da recuperação visível sem inventar um score composto. A porcentagem
principal nasce do último benchmark auditado do índice (`Hit@3`); operação, índice, recibos e
Context Snapshots aparecem como evidências separadas. GBrain é identificado apenas como a
implementação atual do Retrieval Provider genérico.

## Fórmula V1

- `qualidade_percentual = benchmark.hit_at_3 × 100` do último `Source Index Receipt` concluído.
- A UI chama o número de **qualidade local da recuperação**, não inteligência, maturidade ou ranking.
- `casos`, `false_positive_rate`, `gate_passed`, geração do índice e recibo ficam ao lado do número.
- Sem recibo concluído ou sem benchmark válido, o estado é `não medido`; nunca `0%`.
- Comparação entre empresas só é válida quando benchmark, versão e política de corpus forem iguais.

## Acceptance criteria

- [x] A página `Cérebro` mostra a qualidade local da recuperação antes do mapa da empresa.
- [x] A porcentagem deriva somente do `Hit@3` do último recibo de indexação concluído.
- [x] O número explicita casos avaliados, falsos positivos, gate e data da medição.
- [x] Índice mostra documentos, órfãos, geração e provider sem abrir conteúdo privado.
- [x] Operação mostra saúde atual, circuito, última recuperação e decisões históricas separadas.
- [x] Context Snapshots mostram Runs completos, gaps e conflitos; sucesso de benchmark não esconde
      lacunas reais de execução.
- [x] Provider genérico é o nome principal; GBrain aparece apenas como implementação substituível.
- [x] A UI declara que o score é local e ainda não constitui ranking comparável da Society.
- [x] Ausência ou corrupção de recibos produz estado honesto `não medido`/`indisponível`.
- [x] Query, conteúdo, snippets, hashes completos e erros brutos não aparecem na interface.
- [x] O Mapa da empresa e a Anatomia atual continuam funcionais e sem regressão.
- [x] Desktop e mobile preservam a hierarquia calma, sem mosaico de dashboard ou overflow.
- [x] Teste estrutural cobre fórmula, fallback e fronteiras de privacidade.

## Fora deste corte

- Criar benchmark comum da Society ou ranking entre empresas.
- Publicar métricas, receipts, corpus ou perfil para a rede.
- Inventar contagem de dado bruto/processado/destilado sem contrato de observação.
- Implementar GraphRAG ou dizer que o grafo visual participa da recuperação.
- Trocar, atualizar ou reconfigurar GBrain.
- Criar nova rota de BI, CRM, Marketing ou Funil dentro da página Cérebro.

## File List

- `docs/stories/2026-08-27-company-brain-retrieval-health-v1.md`
- `docs/design-reviews/2026-08-27-company-brain-retrieval-health-v1.md`
- `scripts/console-server.mjs`
- `console/app.js`
- `console/styles.css`
- `scripts/test-company-brain-retrieval-health-v1.mjs`
- `scripts/test-company-brain-retrieval-health-invalid-v1.mjs`

## Verificação

- Estado real: `91,4%` de Hit@3 em 75 casos; `0%` de falsos positivos; gate aprovado.
- Índice: 38 documentos, zero órfão, provider `local-semantic-retrieval`, implementação atual
  `gbrain 0.46.30.0`.
- Operação: saudável, circuito fechado, sete recuperações aceitas, duas abstenções por evidência
  insuficiente e duas indisponibilidades históricas.
- Context Snapshots: 8/8 completos, seis gaps e zero conflito em oito Runs.
- Browser desktop `1440 × 1000`: score, prova expandida, Mapa e Anatomia alternam corretamente;
  busca por `Ads` preserva o score e retorna dois objetos.
- Browser mobile `375 × 812`: score e evidências empilham sem overflow (`scrollWidth 360` para
  `innerWidth 375`) e sem vazamento da sidebar.
- `node scripts/test-company-brain-retrieval-health-v1.mjs` — verde.
- `node scripts/test-company-brain-retrieval-health-invalid-v1.mjs` — verde com provider, índice,
  retrieval, health e ledger ilegíveis.
- `node scripts/test-company-brain-company-map-v0.mjs` — verde.
- `node scripts/test-company-brain-orientation-v1.mjs` — verde.
- `node scripts/test-company-brain-launcher-hierarchy-v1.mjs` — verde.
- `node scripts/test-company-brain-product-cut-v1.mjs` — verde.
- `node scripts/test-system-workspace-dedup-v1.mjs` — verde.
- `node scripts/test-canvas-layout-readability.mjs` — verde.
- `node scripts/test-console-server.mjs` — verde.
- `npm test` — verde: 19 envelopes, três Sistemas e 33 arquivos de Skills sincronizados.
- O projeto não declara scripts `lint` ou `typecheck` no `package.json`.
