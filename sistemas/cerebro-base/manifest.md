# Manifest — Cérebro Base

```yaml
system_id: cerebro-base
name: Cérebro Base
version: 0.1.0
status: beta
owner: dono-do-cerebro
result: uma fonte real vira um artefato aprovado e volta a trabalhar numa segunda tarefa
input: situação recorrente + menor fonte real autorizada
output: artefato aprovado + contexto salvo + segunda utilização + recibo
entry_skill: comecar
setpoint: T0 até T3 em até 15 minutos; T3 até T4 apenas medido no primeiro lote
first_route: calls-decisoes
privacy: local-first
```

## O que conta como primeiro ciclo

O ciclo só fecha quando a pessoa:

1. autoriza uma fonte real;
2. recebe algo que usaria no trabalho;
3. aprova o salvamento do contexto útil; e
4. vê esse contexto voltar numa nova saída sem precisar explicar tudo de novo.

Instalar, abrir a pasta, consultar o acervo ou receber um resumo não fecham o ciclo.

## Marcos do produto

- **T0:** a conversa de trabalho da `/comecar` começou depois da instalação.
- **T1:** a menor fonte real está autorizada e legível.
- **T2:** o primeiro artefato foi apresentado.
- **T3:** o artefato foi aprovado e o contexto correspondente foi salvo.
- **T4:** o contexto salvo foi usado numa segunda tarefa sem reler o bruto.

O produto registra somente marcos técnicos, versão, sistema e categorias de intervenção. Nunca
registra conteúdo, nome, contato, caminho da fonte ou resposta da pessoa no relógio.

## Dependências

- `/comecar` para retomar a situação e encontrar o menor caso;
- `calls-decisoes` para o primeiro lote, sempre com uma reunião real;
- `/operar` para pipeline, aprovação e recibo;
- `/guardar` quando a fonte não for reunião.

## Fronteira

Fontes permanecem onde estão. Conteúdo e outputs ficam locais. O arquivo `feedback.md` pertence ao
dono e nunca é sobrescrito por atualização. Telemetria remota continua limitada aos eventos já
declarados, sem incorporar os relógios privados do ciclo.
