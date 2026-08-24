# Story — bootstrap local com recibo de ativação

## Contexto

O Cérebro local só cria `install_id` quando o ping opcional roda depois do primeiro trabalho. Isso
deixa a plataforma cega entre “copiou o instalador” e “produziu valor” e obriga o prompt humano a
explicar telemetria. O novo control plane entrega um claim opaco que precisa virar estado local de
forma determinística, sem pedir e-mail e sem bloquear o uso quando a rede falhar.

A promessa de entrada é o conhecimento do Vale do Silício já disponível para consulta e aplicação,
não uma tarefa de negócio escolhida pela plataforma. O bootstrap termina a instalação; primeiro
valor continua sendo outro marco.

## Decisões

- `.agents/scripts/activate.mjs` é a única porta de ativação para instalações novas.
- O script cria/reutiliza `install_id`, registra início, valida o pacote e registra conclusão ou
  reconexão.
- Claim e credencial ficam somente em arquivos privados sob `.cerebro/`, com modo `0600` e fora do
  Git.
- Falha de rede deixa outbox privado; a próxima execução do ativador ou do ping tenta novamente.
- `ping.mjs` usa a credencial da instalação quando disponível e mantém o payload legado somente para
  compatibilidade.
- Telemetria continua opcional e nunca envia conteúdo, fonte, output ou erro cru.

## Critérios de aceite

- [x] Ativador aceita claim e runtime por argumentos fechados e rejeita valores inválidos.
- [x] `install_started` acontece antes da validação final do pacote.
- [x] Pacote válido produz `install_completed`; instalação existente produz
      `install_reconnected`.
- [x] Falha de rede persiste outbox e retry posterior conclui sem duplicar a ativação.
- [x] Credencial e outbox estão em `.gitignore` e no manifesto de estado privado.
- [x] `ping.mjs` tenta limpar o outbox e autentica eventos novos com a credencial.
- [x] Nenhum e-mail ou `member_id` é necessário na instalação nova.
- [x] Harness determinístico cobre instalação, reconexão, retry e ausência de segredos no output.
- [x] Validador do produto e suítes existentes passam.

## Fora de escopo

- sincronizar conteúdo do acervo com a plataforma;
- mudar o método de ativação T0–T4 do Cérebro Base;
- impedir o uso local quando telemetria estiver desligada ou indisponível;
- publicar release ou atualizar instalações em produção.

## File List

- `docs/stories/2026-08-24-install-activation-handshake.md`
- `.agents/scripts/activate.mjs`
- `.agents/scripts/ping.mjs`
- `scripts/test-install-activation.mjs`
- `.gitignore`
- `.cerebro/private-ignore.manifest`
- `VERSION`
- `CHANGELOG.md`

## Recibo de validação

- 18 harnesses `scripts/test-*.mjs` passaram, incluindo instalação, reconexão, retry e pacote
  incompleto;
- `validate-product.mjs` passou com 14 envelopes, 3 Sistemas e 33 arquivos de skills sincronizados;
- `node --check` nos scripts alterados e `git diff --check` passaram;
- versão `1.33.0` está somente na branch local; nenhuma release foi publicada.
