# Story — Protocolo comum de Sistemas e motor de aprendizado

## Contexto

O Cérebro já ativa um primeiro recorte com evidência, instala System Packs e registra o estado de
execuções. O protocolo ainda fica dividido entre Markdown, estado privado e recibos: Sistemas
diferentes não possuem o mesmo contrato legível por máquina, runs não carregam referências
canônicas de entidades/fontes/outputs e uma correção ainda não atravessa um ciclo explícito de
aprendizado. Isso permite que a diversidade de Sistemas vire fragmentação.

Esta versão transforma o Cérebro em control plane local: capacidade compartilhável por fora,
contexto privado por dentro e um envelope comum para observar qualquer Sistema sem padronizar o
julgamento da empresa.

## Princípios congelados

- Resultado primeiro na experiência; fonte primeiro na prova; aprendizado primeiro no fosso.
- O dado canônico não pertence ao Sistema. O Sistema referencia entidades e fontes por IDs.
- Envelope fixo, conteúdo flexível: contratos, IDs, eventos, versões, permissões e evals são comuns;
  estratégia, linguagem, critérios e conteúdo permanecem locais.
- Uma capability é portátil; um Sistema é capability + contexto + fontes + ferramentas + gate +
  eval + memória.
- Correção individual é candidata. Promoção exige três runs comparáveis, replay, aprovação humana,
  versão de destino e rollback.
- Ledger e telemetria são coisas diferentes: o ledger local pode observar a execução; nenhuma fonte,
  output ou correção é enviada à INEVITA.

## Acceptance criteria

- [x] Existe um schema JSON versionado para capability, System Contract e Run Record.
- [x] Um System Contract válido pode ser registrado localmente sem precisar de pacote Society.
- [x] Um pacote Society pode carregar capability contract sem misturar configuração privada.
- [x] Runs aceitam referências opacas de entidades, fontes e outputs e gravam ledger JSONL local.
- [x] Uma mesma entidade pode ser seguida através de Sistemas diferentes por uma jornada local.
- [x] Chaves externas usadas para registrar entidades nunca são persistidas em claro.
- [x] Correções viram candidatos ligados a run e versão; promoção falha sem três runs comparáveis,
      replay, aprovação, nova versão e rollback.
- [x] `/comecar` e `company-brain-sprint` geram o contrato do primeiro Sistema e o primeiro Run Record
      além dos seis artefatos humanos, sem tornar Node requisito.
- [x] O starter EN usa o mesmo protocolo e continua operável por qualquer agente baseado em arquivos.
- [x] Validador, testes existentes, testes do protocolo e E2E em pasta limpa passam.
- [x] Nenhuma mudança do usuário em `.obsidian/graph.json` ou `Sem título.md` é alterada.

## Tasks

- [x] Criar schemas e documentação do protocolo.
- [x] Criar registro/validação de System Contracts.
- [x] Criar identidade opaca e consulta de jornada.
- [x] Evoluir `system-run.mjs` para o ledger comum.
- [x] Criar ciclo local de aprendizado e promoção.
- [x] Integrar full brain, starter EN, build e validação.
- [x] Executar regressão e E2E.

## Validation receipt

- Suíte determinística: todos os `scripts/test-*.mjs` e `scripts/validate-product.mjs` passaram.
- E2E real: um Codex sem contexto anterior operou o starter construído em pasta temporária com quatro
  fontes sanitizadas. Produziu os seis artefatos humanos, um System Contract confirmado, um Run Record
  concluído e uma correção candidata.
- O contrato e o run validaram contra os schemas publicados; o ledger permaneceu reference-only; todas
  as quatro fontes autorizadas entraram no registro; o output teve exatamente uma próxima ação; a nota
  histórica superada permaneceu explícita como contradição.

## File List

- `docs/stories/2026-08-18-system-protocol-and-learning-engine.md`
- `.agents/skills/comecar/SKILL.md`
- `.agents/skills/company-brain-sprint/SKILL.md`
- `.agents/skills/company-brain-sprint/references/output-contract.md`
- `.cerebro/layout.json`
- `.cerebro/motor.manifest`
- `.cerebro/private-ignore.manifest`
- `.claude/skills/comecar/SKILL.md`
- `.claude/skills/company-brain-sprint/SKILL.md`
- `.claude/skills/company-brain-sprint/references/output-contract.md`
- `.gitignore`
- `CHANGELOG.md`
- `CLAUDE.md`
- `COMECE-AQUI.md`
- `GLOSSARIO.md`
- `METODO-SISTEMAS.md`
- `VERSION`
- `comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente/capability.json`
- `dist/company-brain-starter-en.zip`
- `profiles/company-brain-starter-en/.cerebro/layout.json`
- `profiles/company-brain-starter-en/.gitignore`
- `profiles/company-brain-starter-en/AGENTS.md`
- `profiles/company-brain-starter-en/START-HERE.md`
- `profiles/company-brain-starter-en/operations/learning/.gitkeep`
- `protocol/README.md`
- `protocol/capability-contract.schema.json`
- `protocol/run-record.schema.json`
- `protocol/system-contract.schema.json`
- `scripts/build-company-brain-starter.mjs`
- `scripts/entity.mjs`
- `scripts/generate-operating-brief.mjs`
- `scripts/install-system.mjs`
- `scripts/lib/system-protocol.mjs`
- `scripts/system-contract.mjs`
- `scripts/system-learn.mjs`
- `scripts/system-run.mjs`
- `scripts/test-company-brain-starter.mjs`
- `scripts/test-install-system.mjs`
- `scripts/test-operating-brief.mjs`
- `scripts/test-system-protocol.mjs`
- `scripts/validate-product.mjs`
- `sistemas/_CATALOGO.md`
- `sistemas/calls/capability.json`
- `sistemas/calls/contract.json`
- `sistemas/cerebro-base/capability.json`
- `sistemas/cerebro-base/contract.json`
- `skills/_CATALOGO.md`
- `templates/sistema/capability.json`
- `templates/sistema/contract.json`
- `templates/sistema/manifest.md`
