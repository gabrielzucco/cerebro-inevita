# Manifest — Briefing Comercial Inteligente

```yaml
system_id: briefing-comercial-inteligente
name: Briefing Comercial Inteligente
version: 0.1.0
status: piloto-nao-listado
owner: dono-do-cerebro
result: reunião começa com contexto citável e termina com próximo passo e diff de CRM aprovados
input: reunião identificada + fontes comerciais autorizadas
output: briefing pré-call + fechamento pós-call + recibo da execução
skill: briefing-comercial
setpoint: reduzir busca manual sem inventar contexto nem atualizar o CRM silenciosamente
first_value_event: first_value_confirmed
privacy: local-first
```

## Gate de publicação

Este pacote é piloto e **não entra no catálogo público**. Referência externa e teste técnico não
contam como validação do produto para o membro.

Para publicar: três ciclos reais aprovados, em pelo menos dois cérebros de membros, com eval
obrigatório passando, zero escrita indevida e pelo menos uma segunda utilização.

## O que conta como resultado

Antes da call, a pessoa confirma que usaria o briefing. Depois, confirma que o fechamento representa
o que aconteceu e aprova o próximo passo. Instalação, conexão e resumo genérico não contam.

## Dependências

- um Cérebro INEVITA atualizado;
- uma reunião real;
- pelo menos uma fonte comercial autorizada, inclusive arquivo ou export manual;
- aprovação humana antes de gravar ou atualizar qualquer sistema externo.

## Fronteira

Arquivos, conversas, briefing e CRM ficam locais ou na fonte autorizada. Telemetria leva apenas
evento, versão, runtime, `system_id` e IDs opacos já consentidos.
