# Story — Sistematizar um trabalho real

## Contexto

O produto já separa instalação, ativação do Cérebro Base e primeiro Sistema de negócio. O
`/arquiteto` recomenda um resultado e o `/operar` executa um Sistema instalado, mas ainda falta o
elo executável entre os dois. Hoje esse elo depende de a pessoa ler o método, copiar dez templates
e montar o control plane à mão.

O primeiro caso de prova é uma operação de jornada ponta a ponta: reconstruir aquisição, venda,
onboarding, entrega e atendimento de um caso real, tornar lacunas e próxima ação visíveis e manter
a costura por entidades e fontes sem ingerir todos os sistemas.

## Decisões

- O comando público é `/sistematizar`: verbo simples; “comissionamento” permanece o estado técnico.
- A skill só instala depois de T4 do Cérebro Base e de observar ao menos um caso real.
- Antes de T4, pode organizar uma proposta, mas não registrar Sistema no control plane.
- O primeiro pacote é local e proprietário, em `sistemas/outros-instalados/<system-id>/`.
- CONFIGURAÇÃO e feedback ficam privados; motor, contrato, pipeline e régua podem ser versionados.
- A primeira rotina é manual. Conexão, agenda e skill especializada só entram depois de repetição.
- Um primeiro run aprovado ativa o Sistema local; três runs comparáveis habilitam mudança do motor.
- Jornada ponta a ponta é exemplo de prova, não pacote falsamente validado para qualquer empresa.

## Acceptance criteria

- [x] `/sistematizar` reutiliza mapa, Architect spec, fontes registradas e T4 sem nova entrevista geral.
- [x] Uma execução recente confronta o processo declarado antes da instalação.
- [x] O spec representa resultado, não-sucesso, output, dono, trigger, entidades, fontes, pipeline,
  rotinas, permissões, eval, aprendizado, fronteira e baseline.
- [x] O scaffold recusa PII óbvia, caminho absoluto, fonte inexistente, contrato inválido e overwrite.
- [x] Sem `--confirm`, nenhum arquivo é criado.
- [x] Sem T4, o scaffold não instala o Sistema.
- [x] Com aprovação, dez superfícies locais são criadas e o contrato entra no control plane como
  `configuring`, sem conectar fontes.
- [x] CONFIGURAÇÃO e feedback permanecem protegidos do Git.
- [x] O catálogo local é regenerado sem apagar outros Sistemas.
- [x] O caso Jornada ponta a ponta atravessa scaffold → primeiro run → eval → decisão → valor.
- [x] Claude e Agents permanecem sincronizados; validator e regressão completa passam.

## Validation receipt

- `quick_validate.py .claude/skills/sistematizar` — passou;
- `node scripts/test-commission-system.mjs` — passou;
- `node scripts/validate-product.mjs` — passou;
- `for test_file in scripts/test-*.mjs; do node "$test_file"; done` — 11 suítes passaram.

## File List

- `.claude/skills/sistematizar/SKILL.md`
- `.claude/skills/sistematizar/agents/openai.yaml`
- `.claude/skills/sistematizar/references/commissioning-spec.schema.json`
- `.claude/skills/sistematizar/references/jornada-ponta-a-ponta.example.json`
- `.agents/skills/sistematizar/` (derivado)
- `scripts/commission-system.mjs`
- `scripts/test-commission-system.mjs`
- `scripts/validate-product.mjs`
- `CLAUDE.md`
- `COMECE-AQUI.md`
- `METODO-SISTEMAS.md`
- `GLOSSARIO.md`
- `skills/_CATALOGO.md`
- `sistemas/_CATALOGO.md`
- `.cerebro/motor.manifest`
- `CHANGELOG.md`
- `VERSION`
