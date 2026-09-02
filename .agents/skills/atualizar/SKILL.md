---
name: atualizar
description: Atualiza o motor do cérebro (skills, gabaritos, conhecimento do Vale) pra última versão, sem tocar no contexto do negócio da pessoa. Use quando ela pede pra atualizar, quando aparece aviso de versão nova (ATUALIZACAO_DISPONIVEL), ou quando algo do cérebro parece desatualizado.
---

# Atualizar o cérebro

Traz as últimas melhorias do **motor** (skills novas, gabaritos melhores, mais conhecimento do Vale) **sem tocar** no contexto do negócio da pessoa (`meu-negocio/`, `capturas/`, `privado/`).

## Como rodar
1. Execute o atualizador:
   ```
   node scripts/update.mjs
   ```
   (Funciona em macOS, Linux e Windows. O `bash .claude/scripts/update.sh` continua
   existindo para cérebros antigos e cumpre o mesmo contrato.)
2. Mostre o resultado pra pessoa. Se atualizou, **resuma o que mudou** lendo o topo do `CHANGELOG.md`.
3. **Confirme o vínculo de acesso** (sempre — e obrigatoriamente quando o atualizador imprimir
   `VINCULO_DE_ACESSO_PENDENTE`): confira `.cerebro/install-credential` e `.cerebro/acesso-email`.
   - **Um dos dois existe** → a instalação já tem dono. Não pergunte nada.
   - **Nenhum existe** → peça, em uma frase:

     > Antes de fechar: qual e-mail você usou para pegar o acesso ao Cérebro? As atualizações e a
     > recuperação de acesso ficam vinculadas a ele.

     Grave a resposta em `.cerebro/acesso-email` (só o e-mail, uma linha, modo 0600) e rode
     `node .agents/scripts/ping.mjs sessao` em silêncio. Se a pessoa não tem acesso ainda, aponte
     `https://lp.inevitasociety.com/cerebro`; se já se cadastrou e não lembra,
     `https://inevitasociety.com/comunidade/cerebro/recuperar`. Se ela não quiser responder agora,
     siga sem insistir — a atualização nunca fica refém do vínculo. O e-mail fica fora das notas
     e do Git.
4. Se der erro de download, diga pra ela conferir a conexão — e tranquilize: **o contexto dela está intacto** (o script não começa a sobrescrever sem ter baixado tudo antes).

## Regras
- **Nunca** edite à mão `meu-negocio/`, `capturas/` ou `privado/` durante a atualização — o script já é blindado pra não tocar nelas.
- Skills que a própria pessoa criou (fora da lista do motor) **são preservadas**.
- A atualização vem da **última release publicada**, não do último commit — o que chega
  na máquina dela passou por versão.
- Se ela perguntar "o que vem por aí", aponte o `CHANGELOG.md`.

> **Por que isso importa (a lei da portabilidade):** o motor (o *harness* — skills, gabaritos) é nosso e atualiza; **o teu contexto vive em arquivo aberto, é teu, e nenhuma atualização toca nele**. Ferramenta se troca; capital não se abandona. No Vale: *"if you don't own your harness, you don't own your memory."*
