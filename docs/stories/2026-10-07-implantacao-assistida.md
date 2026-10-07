# Implantação assistida do Cérebro

## Pedido e resultado

Gabriel pediu seguir a partir da auditoria de 07/10: primeira instalação, aproveitamento de um
Cérebro artesanal, migração escolhida, fontes e primeiro trabalho devem ser acompanhados pelo
mesmo agente. Esta frente integra a entrada da plataforma às capacidades nativas do membro.
Referência de produto: implantação assistida observada em 25/09; evidências e identidades ficam
na origem privada, sem transcrição ou dado de membro neste repositório.

## Critérios de aceite

- [x] Entrada distingue começar, aproveitar um Cérebro existente (inclusive artesanal) e retomar.
- [x] Raiz e intenção são confirmadas antes de instalar; origem e personalizações são preservadas.
- [x] Agente reaproveita comecar, auditar-cerebro, migrar-cerebro e os estados/artefatos atuais.
- [x] Fontes têm casa, finalidade, autoridade, atualização e consumidores; conexão depende de prova.
- [x] Sistema sugerido distingue instalado, release acessível, piloto e indisponível.
- [x] Primeiro trabalho, correção e segundo uso são distintos de instalação e ativação técnica.
- [x] Retomada usa onboarding.md e evidências existentes, sem repetir escolhas ou inventar progresso.
- [x] Testes e revisão independente cobrem os percursos e preservação; limitações registradas.

## Escopo e limites

Repositório desta story: membro. Worktree isolada existente da frente de sistemas da comunidade.
Sem migração de dados reais, conexão de fontes de membro, publicação de release, merge ou deploy.
Sem novo motor de estados, assinatura, servidor MCP, schema de produção ou política comercial.
O MCP candidato continua sendo uma ponte posterior ao bootstrap. Scripts existentes são usados
apenas quando suportados pela versão efetiva; não inventar uma tag publicada.

## Progresso

- [x] Auditoria do pacote, plataforma e referência de implantação.
- [x] Plano delimitado e contrato de escopo aberto.
- [x] Implementação.
- [x] Testes e revisão de código, experiência e fronteiras de dados.
- [x] Recibo e entrega da candidata.

## File List

- `.agents/skills/arquiteto/SKILL.md`
- `.agents/skills/comecar/SKILL.md`
- `.agents/skills/comecar/references/implantacao.md`
- `.agents/skills/company-brain-sprint/SKILL.md`
- `.cerebro/motor.manifest`
- `.claude/skills/arquiteto/SKILL.md`
- `.claude/skills/comecar/SKILL.md`
- `.claude/skills/comecar/references/implantacao.md`
- `.claude/skills/company-brain-sprint/SKILL.md`
- `CLAUDE.md`
- `COMECE-AQUI.md`
- `docs/guides/implantacao-assistida.md`
- `docs/stories/2026-10-07-implantacao-assistida.md`
- `scripts/test-community-release.mjs`

## Recibo

Modelo recomendado: GPT-6, esforço alto. Efetivo: família GPT-6 declarada pelo ambiente;
variante e esforço não verificados. Delegações herdam a sessão e registram seus resultados.
Mesa: `20261007-131715-f908bb23`. Testes, commits e limites serão registrados ao concluir.


### Resultado e verificação

O acompanhamento é nativo de `comecar`: confirma a casa, audita o artesanal, planeja referência
ou migração, orienta contratos/fontes, retoma e conduz primeiro uso/correção/reuso. `arquiteto`
consulta a distribuição disponível sem confundir piloto, catálogo, pacote e uso. O sprint foi
alinhado ao vínculo opcional após o primeiro output. Não há novo Sistema ou máquina de estados.

- Suíte final: **74/74 scripts**; `npm test` e validador canônico passaram (22 envelopes,
  3 sistemas, 39 arquivos de skills sincronizados).
- Atualização 1.38 → candidata 1.39 preservou sete sentinelas privadas, canal, regra privada no
  CLAUDE e reaplicação idempotente; o bloco gerenciado recebeu as instruções novas.
- Quatro guias e as referências de implantação chegaram à instalação limpa e à atualização.
- Dois ensaios independentes somente leitura: acervo artesanal preservado; retomada corrigiu
  uma proposta pela fonte local e recusou inferir conexão a partir de registro. Fixtures sintéticas,
  sem rede, credenciais, telemetria ou dados de membro. Não substituem piloto humano.
- Revisão independente encerrou os achados sobre helpers e handoff. `git diff --check` passou.
- `lint` e `typecheck` não são scripts deste repo. Validador Python auxiliar de skill indisponível
  por falta de PyYAML; paridade e validador canônico passaram, sem instalar dependências globais.

A primeira rodada teve dois testes vermelhos (o teste de release e seu agregador) porque exigiam
CLAUDE inteiro idêntico à base mesmo com atualização do bloco gerenciado. O teste agora exige
motor novo mais regra particular preservada; a rodada final completa passou.

### Disciplina e entrega

A mesa inicial 20261007-131715-f908bb23 ficou íntegra em 11/14 arquivos e foi encerrada como
abortada apenas para substituição do contrato, ao incluir a dependência company-brain-sprint.
A segunda 20261007-132239-b48ff2ca também ficou íntegra e foi substituída para incluir a regressão
de release. A mesa final é 20261007-132814-9cbd0229. Os arquivos anteriores foram preservados;
a entrega agrega todos os 14 arquivos, sem contabilizá-los como trabalho externo.

Branch `codex/community-systems-20261007`, contraparte plataforma na story de mesmo nome.
Entrega preparada para o draft PR13, empilhado sobre PR12; o aceite humano da base continua
pendente. Nenhuma tag/release, migração real, conexão de fonte ou deploy foi realizado.
O recibo externo da tarefa registra o commit final e o hash do pacote testado.
