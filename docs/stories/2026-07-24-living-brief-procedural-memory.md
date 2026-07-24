# Story — Brief operacional vivo e memória procedural

## Contexto

O benchmark público de Company Brains do Y Combinator mostrou dois padrões aplicáveis sem mudar a
fronteira local-first do Cérebro INEVITA:

1. o estado da operação reaparece automaticamente em um brief vivo;
2. runs bem-sucedidos viram candidatos a procedimento reutilizável, em vez de só desaparecerem no
   histórico.

## Critérios de aceitação

- [x] `operacao/_HOJE.md` pode ser regenerado deterministicamente a partir de estados, recibos,
      decisões, melhorias e fontes locais registradas.
- [x] O brief nunca copia conteúdo de fonte nem expõe caminhos absolutos.
- [x] Fonte ausente e sistema em atenção aparecem como exceção visível.
- [x] Registrar fonte, mudar estado ou concluir run atualiza o brief sem bloquear a operação.
- [x] `/operar` consulta caminhos bem-sucedidos anteriores antes de executar e propõe memória
      procedural depois de um run aprovado.
- [x] Três procedimentos comparáveis podem candidatar mudança no sistema, sempre com diff, replay e
      aprovação humana.
- [x] `/reindex` revisa candidatos procedurais sem promover automaticamente.
- [x] Testes cobrem geração, privacidade, estados de atenção e preservação no update.
- [x] `validate-product.mjs`, testes e atualização segura passam.
- [x] QA remoto parte da v1.10.1 e recebe a skill em todos os runtimes sem expor estado privado
      novo ao Git.

## Tarefas

- [x] Implementar gerador do brief.
- [x] Integrar o gerador aos pontos de mudança de estado.
- [x] Implementar teste determinístico do brief.
- [x] Atualizar skills portáveis e documentação.
- [x] Atualizar versão/changelog e gates.
- [x] Corrigir a regressão de upgrade encontrada depois do primeiro release remoto.

## File List

- `docs/stories/2026-07-24-living-brief-procedural-memory.md`
- `scripts/generate-operating-brief.mjs`
- `scripts/test-operating-brief.mjs`
- `scripts/register-source.mjs`
- `scripts/system-state.mjs`
- `scripts/system-run.mjs`
- `scripts/concierge-run.mjs`
- `scripts/validate-product.mjs`
- `scripts/test-update-safety.mjs`
- `.agents/skills/operar/SKILL.md`
- `.claude/skills/operar/SKILL.md`
- `.agents/skills/reindex/SKILL.md`
- `.claude/skills/reindex/SKILL.md`
- `operacao/_LEIA.md`
- `operacao/execucoes/_LEIA.md`
- `operacao/o-que-melhorou/_LEIA.md`
- `CLAUDE.md`
- `COMECE-AQUI.md`
- `VERSION`
- `CHANGELOG.md`
- `.cerebro/private-ignore.manifest`
- `.cerebro/motor.manifest`
- `.claude/scripts/update.sh`
- `.claude/scripts/ping.sh`
- `.claude/scripts/ensure-private-ignore.sh`
