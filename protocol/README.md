# Protocolo do Cérebro INEVITA

O protocolo permite que Sistemas diferentes convivam sem perder observabilidade ou costura. Ele
padroniza as bordas, não o julgamento da empresa.

## Os três envelopes

- `capability-contract.schema.json`: o know-how portátil que pode circular pela Society.
- `system-contract.schema.json`: a capability ligada ao resultado, fontes, entidades, permissões,
  pipeline, eval e política de aprendizado de uma empresa.
- `run-record.schema.json`: o recibo estruturado de uma execução, sem carregar conteúdo bruto.

O conteúdo privado continua na pasta do dono. Os envelopes usam IDs e referências relativas. Um
Run Record pode apontar para um output ou uma correção local, mas não copia seu conteúdo.

## Invariante

```text
capability compartilhável
+ contexto e bindings locais
+ execução observável
= Sistema proprietário sem fragmentação
```

Todo Sistema pode ter implementação própria. Para entrar no control plane, precisa declarar
`system_id`, versão, resultado, entidades, fontes, capability, permissões, eval e aprendizado. Toda
execução precisa deixar `run_id`, referências, decisão humana e fronteira de compartilhamento.

## CLI opcional

O protocolo funciona somente por arquivos. Quando Node estiver disponível, os helpers validam os
mesmos contratos:

```bash
node scripts/system-contract.mjs validate caminho/contract.json
node scripts/system-contract.mjs register caminho/contract.json --confirm
node scripts/entity.mjs register --type=lead --source-id=crm --key-file=privado/chave.txt --confirm
node scripts/entity.mjs journey --entity-id=lead-xxxxxxxxxxxxxxxx
```
