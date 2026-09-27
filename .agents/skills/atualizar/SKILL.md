---
name: atualizar
description: Prepara a atualização do motor por tag explícita, mostra os conflitos e aplica o plano aprovado preservando personalizações e contexto do negócio.
---

# Atualizar o Cérebro

Use sempre `você`, `seu` e `sua`. Atualize a partir de uma versão exata escolhida pelo dono.
`latest` serve apenas para descobrir novidades; não é endereço de aplicação. Nunca use `main`,
fallback de branch ou o atualizador antigo para fazer a primeira passagem segura.

1. Leia `VERSION`, a fonte em `.cerebro/source` e a seção de atualização em `COMECE-AQUI.md`.
   Se o updater instalado não tem prévia/`--tag`, obtenha o pacote de uma **tag fixa** em pasta
   temporária e execute o script novo com `--root` apontando para a instalação. Nunca atualize
   primeiro pelo script destrutivo legado para “ganhar” a versão segura.
2. Escolha a tag publicada e confira o changelog. `v1.38.0` é candidato local e só funcionará
   no canal oficial depois da publicação aprovada; para piloto offline use o pacote local.
3. Execute a prévia, sem `--apply`:
   ```bash
   CEREBRO_UPDATE_SOURCE_DIR=/caminho/pacote node /caminho/pacote/scripts/update.mjs --tag v1.38.0 --root /caminho/cerebro --baseline-dir /caminho/pacote-da-versao-instalada
   ```
   Mostre os arquivos que mudarão, conflitos, tag e `plan_hash`. Sem recibo anterior, use o
   baseline íntegro da versão instalada; arquivos diferentes dele são conflitos. Preserve a dúvida;
   não aceite todos automaticamente. O conteúdo fora do bloco gerenciado do `CLAUDE.md` é do
   membro. Um CLAUDE legado sem marcadores é preservado inteiro e recebe o bloco novo ao final;
   proponha revisão de instruções duplicadas/contraditórias, nunca as apague por conta própria.
4. Peça aprovação do plano concreto. Só então acrescente `--apply --approve-plan <plan_hash>`
   ao mesmo comando. O hash deve vir da prévia que a pessoa viu; mudança em arquivos ou pacote
   exige nova prévia e nova aprovação. Conflitos impedem aplicação mesmo com hash aprovado.
5. Confira `VERSION`, o resultado e o backup em `.cerebro/update-backups/`. Resuma as mudanças
   úteis. O recibo `.cerebro/update-state.json` permite distinguir futuras edições locais. Backups
   contêm conteúdo privado: nunca stage, upload ou compartilhamento.
6. Se aparecer `RUNTIME_LEGADO`, o arquivo privado de runtime precisa de migração separada antes
   de gravar estado no cockpit. Leia `scripts/post-update.mjs`, apresente os caminhos e peça
   aprovação antes de executá-lo. O updater não executa código pós-update ou ping automaticamente.

A entrada `bash .claude/scripts/update.sh` encaminha para o mesmo planejador Node 20+ e aceita
os mesmos argumentos. Sem Node ou planejador seguro, para sem escrever. Arquivos extras em
skills/diretórios do motor são preservados; arquivos obsoletos não são apagados automaticamente.

Em falha, leia o resultado: antes da aplicação nada foi escrito; falha durante a escrita tenta
restaurar os arquivos do plano e mantém backup. Não prometa restauração completa em falta de disco
ou encerramento abrupto. Não remova locks ou backups sem conferir o processo e os arquivos.
O update não edita o contexto para resolver erro nem pede acesso à conta para poder continuar.
