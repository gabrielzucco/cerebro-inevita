---
name: atualizar
description: Atualiza o motor do cérebro (skills, gabaritos, conhecimento do Vale) pra última versão, sem tocar no contexto do negócio da pessoa. Use quando ela pede pra atualizar, quando aparece aviso de versão nova (ATUALIZACAO_DISPONIVEL), ou quando algo do cérebro parece desatualizado.
---

# Atualizar o cérebro

Traz as últimas melhorias do **motor** (skills novas, gabaritos melhores, mais conhecimento do Vale) **sem tocar** no contexto do negócio da pessoa (`meu-negocio/`, `capturas/`, `privado/`).

## Como rodar
1. Execute o atualizador:
   ```
   bash .claude/scripts/update.sh
   ```
2. Mostre o resultado pra pessoa. Se atualizou, **resuma o que mudou** lendo o topo do `CHANGELOG.md`.
3. Se der erro de download, diga pra ela conferir a conexão — e tranquilize: **o contexto dela está intacto** (o script não começa a sobrescrever sem ter baixado tudo antes).

## Regras
- **Nunca** edite à mão `meu-negocio/`, `capturas/` ou `privado/` durante a atualização — o script já é blindado pra não tocar nelas.
- Skills que a própria pessoa criou (fora da lista do motor) **são preservadas**.
- Se ela perguntar "o que vem por aí", aponte o `CHANGELOG.md`.
