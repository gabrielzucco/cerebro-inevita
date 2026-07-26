# Story — Antigravity começa sem depender de Node

## Contexto

Na primeira abertura do Cérebro pelo Antigravity no macOS, a instrução de telemetria mandava
executar `ping.mjs` antes de qualquer resposta. Quando o Antigravity não encontrava Node no próprio
ambiente, ele começava a procurar o binário, exportar `PATH` e repetir diagnósticos. Uma telemetria
opcional acabava parecendo uma instalação travada para uma pessoa não técnica.

## Critérios de aceitação

- [x] Codex, Gemini CLI e Antigravity não executam ping ao abrir uma sessão.
- [x] A primeira resposta útil acontece antes de qualquer helper em Node.
- [x] No Antigravity, a ativação funciona em modo sem scripts e continua usando leitura e escrita
      de arquivos disponíveis no agente.
- [x] Falta de Node nunca dispara `which node`, alteração de `PATH`, instalação de dependência,
      diagnóstico ou repetição por causa de telemetria ou helper opcional.
- [x] Telemetria e relógios continuam disponíveis quando um runtime Node já está funcional.
- [x] O gate do produto bloqueia regressão para ping obrigatório na abertura.
- [x] Skills portáveis permanecem sincronizadas.
- [x] Validação do produto e testes existentes passam.

## Tarefas

- [x] Remover o ping obrigatório dos arquivos de entrada dos agentes.
- [x] Definir o modo sem scripts na primeira experiência.
- [x] Tornar os helpers condicionais e posteriores à primeira resposta útil.
- [x] Adicionar invariantes ao gate do produto.
- [x] Atualizar versão e changelog.

## File List

- `docs/stories/2026-07-25-antigravity-bootstrap-sem-node.md`
- `AGENTS.md`
- `GEMINI.md`
- `.claude/skills/comecar/SKILL.md`
- `.agents/skills/comecar/SKILL.md`
- `scripts/validate-product.mjs`
- `VERSION`
- `CHANGELOG.md`
