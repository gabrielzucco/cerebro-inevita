# Manifest — Cérebro Base

```yaml
system_id: cerebro-base
name: Cérebro Base
version: 0.3.0
status: beta
product_kind: brain-native
surface: brain
owner: dono-do-cerebro
result: uma fonte real vira um artefato aprovado e volta a trabalhar numa segunda tarefa
input: resultado conhecido ou rastro recente + menor fonte real autorizada
output: orientação V0 + artefato aprovado + CONFIGURAÇÃO salva + segunda utilização + recibo
entry_skill: comecar
setpoint: T0 até T3 em até 15 minutos; T3 até T4 apenas medido no primeiro lote
privacy: local-first
```

## O que conta como primeiro ciclo

O ciclo só fecha quando a pessoa:

1. autoriza uma fonte real;
2. recebe algo que usaria no trabalho;
3. aprova o salvamento do contexto útil; e
4. vê esse contexto voltar numa nova saída sem precisar explicar tudo de novo.

Instalar, abrir a pasta, consultar o acervo ou receber um resumo não fecham o ciclo.

T4 ativa o **Cérebro Base**. O primeiro Sistema de negócio é escolhido depois: ele recebe resultado,
fontes, CONFIGURAÇÃO, pipeline, eval, gate, feedback e versão próprios. O recorte usado para ativar
o cérebro pode virar candidato, mas não é promovido automaticamente.

O Cérebro Base conserva identidade e contrato de metassistema para que ativação, recuperação e
aprendizado deixem recibos. No produto ele aparece na superfície **Cérebro**, nunca no catálogo de
Sistemas de negócio.

## Marcos do produto

- **T0:** a conversa de trabalho da `/comecar` começou depois da instalação.
- **T1:** a menor fonte real está autorizada e legível.
- **T2:** o primeiro artefato foi apresentado.
- **T3:** o artefato foi aprovado e o contexto correspondente foi salvo.
- **T4:** o contexto salvo foi usado numa segunda tarefa sem reler o bruto.

O produto registra somente marcos técnicos, versão, sistema e categorias de intervenção. Nunca
registra conteúdo, nome, contato, caminho da fonte ou resposta da pessoa no relógio.

## Dependências

- `/comecar` para orientar o mapa, escolher resultado ou rastro e encontrar a menor fonte;
- `/fonte` para decidir o nível de refino sem tratar tudo;
- `company-brain-sprint` para produzir os artefatos e os dois usos;
- `/guardar` quando a correção aprovada merece virar átomo candidato;
- `/arquiteto` somente depois de T4 para escolher o primeiro Sistema de negócio.

## Fronteira

Fontes permanecem onde estão. Conteúdo e outputs ficam locais. O arquivo `feedback.md` pertence ao
dono e nunca é sobrescrito por atualização. Telemetria remota continua limitada aos eventos já
declarados, sem incorporar os relógios privados do ciclo.
