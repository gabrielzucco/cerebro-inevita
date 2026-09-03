# Company Brain Skills V1 — capacidades instaladas

## Objetivo

Dar às Skills uma superfície própria no Cockpit sem tratá-las como Sistemas ou produtos da Society. A página deve mostrar quais capacidades existem nesta empresa, quais pertencem ao motor distribuído, quais Sistemas as declaram e se os runtimes locais conseguem realmente carregá-las.

## Decisão de corte

- **Sistema** promete e entrega um resultado; **Skill** encapsula julgamento executável dentro desse resultado.
- `.claude/skills/` é a fonte canônica; `.agents/skills/` é um runtime derivado e sua divergência precisa aparecer.
- Skills privadas da empresa e Skills publicadas no motor são catálogos distintos. Uma Skill presente nos dois aparece uma vez, com as duas origens.
- Vínculo com Sistema só existe quando o manifesto humano do Sistema nomeia a Skill explicitamente. O Console não infere dependência por semelhança.
- Modelo não é Skill. Executor, modelo solicitado e autenticação aparecem como bindings relacionados, sem virar catálogo de produto.

## Acceptance criteria

- [x] O read model lista Skills canônicas sem contar `.agents/skills/` como uma segunda cópia.
- [x] A contagem distingue Skills disponíveis nesta empresa, Skills publicadas no motor e capacidades únicas.
- [x] Cada Skill expõe nome, descrição, origem, disponibilidade nos runtimes e divergência de sincronização.
- [x] Cada Skill mostra apenas Sistemas que a declaram explicitamente em sua seção `Skills e interfaces`.
- [x] A página permite buscar e filtrar por origem, vínculo e saúde sem transformar Skills em marketplace.
- [x] O inspetor explica fronteira, caminho canônico, runtimes e Sistemas consumidores sem expor o corpo privado da Skill.
- [x] Bindings de executor mostram adapter, modelo declarado, permissão e autenticação; não armazenam nem exibem credencial.
- [x] A navegação e a busca global abrem Skills diretamente.
- [x] Testes cobrem deduplicação, metadata inválida, divergência de runtime, vínculo explícito e ausência de inferência.
- [x] O Cockpit real continua file-only, reference-only e sem carregar o Canvas na abertura.

## Fora do corte

- Marketplace ou publicação de Skills na Society.
- Instalar, editar, executar ou sincronizar Skills pelo Cockpit.
- Benchmark de qualidade por Skill sem Run Receipt que o sustente.
- Roteamento automático de modelo por Skill.
- Novo Skill Contract protocolar antes de existir um segundo consumidor real.

## Tasks

- [x] Criar read model canônico de Skills e bindings relacionados.
- [x] Integrar contagens e vínculos explícitos ao estado do Console.
- [x] Implementar navegação, catálogo, filtros e inspetor.
- [x] Validar o Company Brain real e registrar recibo.

## Evidência de fechamento

- Company Brain real: 29 Skills canônicas da empresa, 18 no manifesto do motor, 46 IDs únicos e 1 compartilhado.
- Saúde local: 24 alinhadas entre `.claude` e `.agents`; 5 divergentes e nomeadas no estado canônico.
- Vínculos: 7 Skills ligadas a Sistemas por declaração explícita; `/call` aponta para 3 Sistemas.
- Execução: 2 bindings locais, um pronto e um aguardando autenticação; ambos `read-only`, sem credencial no read model.
- Peso inicial: o catálogo completo carrega só ao abrir Skills; o estado inicial caiu de aproximadamente 162 KB para 111 KB no cérebro real.

## File List

- `docs/stories/2026-08-27-company-brain-skills-v1.md`
- `scripts/lib/skill-read-model.mjs`
- `scripts/lib/console-read-model.mjs`
- `scripts/console-server.mjs`
- `console/index.html`
- `console/app.js`
- `console/styles.css`
- `scripts/test-company-brain-skills-v1.mjs`
- `scripts/test-console-server.mjs`
- `scripts/test-company-brain-launcher-hierarchy-v1.mjs`
- `scripts/validate-product.mjs`
