# Story — `/arquiteto` como porta aberta do Cérebro

## Contexto

O Cérebro aberto já possui as capacidades necessárias para diagnosticar uma operação:
`/prototipar` organiza o declarado, `/fonte` aproxima evidência, `/operar` executa sistemas e
`frameworks-visuais` renderiza uma vista com identidade estável. Essas capacidades aparecem como
peças separadas. Depois da primeira vitória, a pessoa ainda não vê com clareza onde aplicar o
Cérebro nem qual sistema construir primeiro.

O `/arquiteto` deve orquestrar essas capacidades sem criar uma segunda arquitetura, sem esconder o
método atrás da Society e sem transformar uma recomendação preliminar em certeza. O aberto entrega
diagnóstico e direção; a Society concentra instalação assistida, sistemas validados, laboratórios,
releases e julgamento da rede.

## Critérios de aceitação

- [x] A skill `/arquiteto` existe em Claude Code e nas skills portáveis do Codex/Gemini.
- [x] A skill reutiliza `/prototipar`, `/fonte` e `/operar`; não duplica os três protocolos.
- [x] O mapa declara seu estado como V0, V1, V2 ou V3 e explica o que sustenta esse estado.
- [x] V2 exige confirmação humana do mapa e do ranking; V3 exige execução, eval e delta observado.
- [x] O ranking é sempre apresentado como proposta, traz `reason_codes` legíveis e pede decisão
      humana antes de orientar implementação.
- [x] A saída canônica é um `architect-spec.json` validado por código, não HTML livre do modelo.
- [x] Um engine determinístico transforma o spec validado em mapa visual com a identidade INEVITA.
- [x] O visual mostra arquitetura atual, lacunas, oportunidades, primeiro sistema e a escada V0→V3.
- [x] O `/comecar` só revela o `/arquiteto` depois da primeira vitória e da reutilização do contexto.
- [x] O Cérebro aberto entrega diagnóstico verdadeiro; não promete conexão, validação ou sistema
      que ainda não existem.
- [x] A fronteira da Society é explicada por ativos de rede e operação, nunca por trava artificial.
- [x] Atualizações existentes recebem a skill, o schema e o engine sem tocar no contexto do dono.
- [x] Validação do produto, sincronização de skills e testes de regressão passam.

## Tarefas

- [x] Definir o contrato da skill e o schema do `architect-spec`.
- [x] Implementar validador/normalizador e guards de V0→V3.
- [x] Implementar o tradutor determinístico para o engine visual da casa.
- [x] Integrar o reveal no fechamento da primeira experiência.
- [x] Atualizar contratos, catálogos, motor, versão e changelog.
- [x] Adicionar testes do spec, do visual e dos contratos de produto.
- [x] Executar validação completa e atualizar esta story.

## File List

- `docs/stories/2026-08-12-arquiteto-porta-aberta.md`
- `.claude/skills/arquiteto/`
- `.agents/skills/arquiteto/`
- `.claude/skills/comecar/SKILL.md`
- `.agents/skills/comecar/SKILL.md`
- `.agents/scripts/ping.mjs`
- `.cerebro/motor.manifest`
- `.cerebro/private-ignore.manifest`
- `.cerebro/seed.manifest`
- `.gitignore`
- `operacao/arquitetura/_LEIA.md`
- `scripts/test-architect.mjs`
- `scripts/test-update-safety.mjs`
- `scripts/validate-product.mjs`
- `CLAUDE.md`
- `COMECE-AQUI.md`
- `GLOSSARIO.md`
- `skills/_CATALOGO.md`
- `VERSION`
- `CHANGELOG.md`
