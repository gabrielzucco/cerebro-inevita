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

- [ ] A página `Cérebro` mostra a qualidade local da recuperação antes do mapa da empresa.
- [ ] A porcentagem deriva somente do `Hit@3` do último recibo de indexação concluído.
- [ ] O número explicita casos avaliados, falsos positivos, gate e data da medição.
- [ ] Índice mostra documentos, órfãos, geração e provider sem abrir conteúdo privado.
- [ ] Operação mostra saúde atual, circuito, última recuperação e decisões históricas separadas.
- [ ] Context Snapshots mostram Runs completos, gaps e conflitos; sucesso de benchmark não esconde
      lacunas reais de execução.
- [ ] Provider genérico é o nome principal; GBrain aparece apenas como implementação substituível.
- [ ] A UI declara que o score é local e ainda não constitui ranking comparável da Society.
- [ ] Ausência ou corrupção de recibos produz estado honesto `não medido`/`indisponível`.
- [ ] Query, conteúdo, snippets, hashes completos e erros brutos não aparecem na interface.
- [ ] O Mapa da empresa e a Anatomia atual continuam funcionais e sem regressão.
- [ ] Desktop e mobile preservam a hierarquia calma, sem mosaico de dashboard ou overflow.
- [ ] Teste estrutural cobre fórmula, fallback e fronteiras de privacidade.

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

## Verificação

- Pendente.
