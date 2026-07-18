# Manifest — Calls em Decisões

```yaml
system_id: calls-decisoes
name: Calls em Decisões
version: 0.1.0
status: beta
owner: dono-do-cerebro
result: reunião deixa decisões, ações, evidências e pendências aprovadas
input: transcrição real
output: bruto preservado + átomos aprovados + recibo da execução
skill: call
setpoint: uma fonte vira trabalho acionável e memória citável em até 10 minutos após a entrada
first_value_event: first_value_confirmed
privacy: local-first
```

## O que conta como resultado

A pessoa consegue decidir ou agir agora usando o artefato e confirma isso. Resumo genérico,
instalação, abertura da pasta ou uma nota não aprovada não contam.

## Dependências

- um agente que leia e escreva nesta pasta;
- uma transcrição colada ou apontada;
- aprovação humana antes de qualquer gravação derivada.

## Fronteira

O bruto, os outputs e as decisões ficam locais. O ping leva apenas evento, versão, runtime,
`system_id` e IDs opacos já consentidos. Contribuição à comunidade é outro pipeline, com
anonimização e dois consentimentos: aprovar o payload e enviar.

