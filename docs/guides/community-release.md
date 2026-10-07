# Preparar o pacote original da comunidade

Use este caminho para levar um envelope V2 completo à revisão, incluindo o Funil original de 99 arquivos. O comando mantém a versão, os arquivos, os contratos e o SHA-256 do envelope. O JSON salvo usa a serialização canônica do protocolo.

Coloque o envelope revisável dentro do seu Cérebro. Informe seu caminho relativo e um resumo sem dados privados:

```sh
node scripts/stage-community-release.mjs \
  --package=entregas/funil-original.json \
  --summary="Pacote original do Funil para revisão independente."
```

A prévia apresenta a versão, o hash e a lista completa de arquivos. Não grava candidato, não acessa a plataforma e não lê credenciais. O pacote precisa estar em piloto, com zero ciclos reais e zero Cérebros verificados. Contratos que declarem publicação, execução externa automática ou fontes privadas vinculadas são recusados. Revise também o conteúdo completo do envelope e a permissão de compartilhar seus arquivos; a validação técnica não decide isso.

Para salvar o candidato privado, repita o comando com `--confirm`. Ele retorna `candidate_id`, `package_sha256` e `package_ref`. A preparação não cria `approval.json` nem `submission.json` e não herda aprovação de outro candidato. O envelope de origem permanece intacto.

Continue no mesmo fluxo das melhorias de membros, substituindo os marcadores pelos valores retornados:

```sh
node scripts/community.mjs review --candidate=ID_DO_CANDIDATO
node scripts/community.mjs approve --candidate=ID_DO_CANDIDATO --sha256=HASH_REVISADO --confirm
node scripts/community.mjs send --candidate=ID_DO_CANDIDATO --sha256=HASH_REVISADO --confirm
```

Cada comando representa uma decisão separada: conferir o conteúdo, autorizar seu hash para envio e confirmar o envio. O último usa a instalação legitimamente ativada e o acesso atual da sua conta. A plataforma recebe uma proposta privada.

Outro curador autorizado precisa abrir a proposta em sua própria conta, conferir os arquivos e aprovar o hash antes de publicar. Este comando não oferece publicação. Duas instalações da mesma conta continuam sendo o mesmo autor. A aprovação editorial e a publicação não acrescentam prova de uso real ou de resultado de mercado.

Se o pacote falhar, corrija sua fonte e gere outra prévia; o staging não reescreve contratos ou zera contadores para fazê-lo passar. Para melhorar um sistema já existente com arquivos alterados, use `community.mjs prepare`, descrito em [Sistemas da comunidade](community-systems.md).
