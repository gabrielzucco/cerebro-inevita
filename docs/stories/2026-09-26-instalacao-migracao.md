# Frente D — instalação e migração preservando o Cérebro do membro

Origem: pacote noturno autorizado de 26/09/2026, frente D. Base `origin/main` em
`920ef29`; branch `codex/instalacao-migracao-20260926`, worktree
`/private/tmp/ci-instalacao-20260926`. Somente trabalho local e fixtures temporárias.

## Critérios e tarefas

- [x] Atualização Node e bash arquivo a arquivo, sem apagar personalizações ausentes do pacote.
- [x] CLAUDE.md com bloco gerenciado; texto externo preservado; prévia antes da escrita.
- [x] Instalação/atualização com tag explícita; conferir VERSION; notas/checklist 1.37.0 sem publicar.
- [x] Entrada oferece usar existente, nova pasta ou migrar.
- [x] Skills auditar-cerebro (leitura) e migrar-cerebro (plano aprovado antes da cópia).
- [x] Regressão sintética de 14/09, suíte completa e recibo com contagens e commits.

## Decisões e limites

Diretórios do manifesto serão expandidos em arquivos presentes no pacote. Arquivos obsoletos
não serão removidos automaticamente. Legados sem recibo de hashes exigem revisão dos conflitos.
Nenhum instalador será executado sobre Cérebro real. Nenhum activate.mjs ou ping.mjs será editado.

## Recibo

Recomendação: GPT-6, esforço alto. Usado: família GPT-6 informada pelo ambiente;
variante exata e esforço efetivo `nao_verificado`. Sem delegações.
Contrato de mesa/painel: não aplicável ao repo do produto, por exceção expressa da frente D.
Implementação local concluída. Commit registrado no relatório externo da frente após a gravação.

### Validação

- Baseline `920ef29`, fixtures sintéticas: updater Node e bash terminaram com exit 0 e ambos
  produziram `local_instruction_preserved: false`, `custom_skill_preserved: false`.
- Inventário físico: **61** arquivos `scripts/test-*.mjs`. Rodada inicial: **58 passed; 3 failed**.
  Dois falharam com `listen EPERM 127.0.0.1` no sandbox; ativação recebeu `activation_local_only`
  pelo `CEREBRO_TELEMETRY=off` do runner. Sem essa variável, ativação passou com fetch simulado.
- Repetição autorizada de portas locais: grant passou. Console revelou contagem fixa de skills
  `20 !== 18`; corrigido o teste para as duas novas skills, Console passou. Resultado consolidado:
  **61 scripts; 61 passed; 0 failed**. Nenhum arquivo solicitado ausente ou ignorado.
- Suite nova: `tests 12; pass 12; fail 0; cancelled 0; skipped 0; todo 0`.
- Teste existente de preservação: **10 sentinelas** por updater (Node e bash), seeds e motor.
- `npm test`: `protocolo válido · 22 envelopes · 3 sistemas · 35 arquivos de skills sincronizados`.
- Sintaxe Node dos arquivos JS alterados e `bash -n`, `git diff --check`: exit 0.
- Ambiente: macOS, Node **v26.8.1**. Sem scripts npm de lint/typecheck neste repositório.
- `quick_validate.py` da skill-creator bloqueado por `ModuleNotFoundError: No module named yaml`
  em Python do sistema e runtime empacotado. Não instaladas dependências globais; frontmatter,
  nomes e sincronização das skills passaram no validador canônico do produto.

### Limites e próxima entrega

Sem homologação Windows/Node 20 ou instalação de membro. Sem release, push, deploy, acesso a banco
ou comunicação externa. `activate.mjs` e `ping.mjs` não foram editados. Checkouts principais,
_PAINEL.md e index.lock preservados. Sem contrato de mesa por exceção da frente D.

Updaters antigos NÃO podem ser usados na primeira passagem: executar o script seguro da tag
nova em pasta separada com `--root`. Legado CLAUDE é preservado inteiro, podendo duplicar regras.
Arquivos obsoletos ficam; remoção é decisão futura. Backups/rollback cobrem falha recuperável,
não garantem transação em queda de energia. Pacote via HTTPS, sem assinatura criptográfica.
Migração de runtime privado saiu da aplicação automática e é passo explícito separado.

A integração do prompt remoto e a revisão dos endpoints Railway de ativação/Society precisam ser
aprovadas antes de distribuir. Preparação da release está em `docs/releases/1.37.0.md`.


## File List

- `.agents/skills/atualizar/SKILL.md`
- `.agents/skills/comecar/SKILL.md`
- `.cerebro/motor.manifest`
- `.cerebro/private-ignore.manifest`
- `.cerebro/seed.manifest`
- `.cerebro/source`
- `.claude/scripts/update.sh`
- `.claude/skills/atualizar/SKILL.md`
- `.claude/skills/comecar/SKILL.md`
- `.gitignore`
- `CHANGELOG.md`
- `CLAUDE.md`
- `COMECE-AQUI.md`
- `README.md`
- `scripts/lib/brain-update-center.mjs`
- `scripts/test-company-brain-update-center-v1.mjs`
- `scripts/test-console-server.mjs`
- `scripts/test-update-safety.mjs`
- `scripts/update.mjs`
- `skills/_CATALOGO.md`
- `.agents/skills/auditar-cerebro/SKILL.md`
- `.agents/skills/migrar-cerebro/SKILL.md`
- `.claude/skills/auditar-cerebro/SKILL.md`
- `.claude/skills/migrar-cerebro/SKILL.md`
- `docs/releases/1.37.0.md`
- `docs/stories/2026-09-26-instalacao-migracao.md`
- `scripts/install.mjs`
- `scripts/test-update-preservation.mjs`
