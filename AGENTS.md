# Cérebro INEVITA no Codex

Leia `CLAUDE.md` por inteiro: ele é o contrato canônico de operação deste cérebro.
As skills portáveis vivem em `.agents/skills/`. Quando o contrato mencionar um
comando `/nome`, use a skill de mesmo nome no Codex (`$nome`) ou ative-a por
linguagem natural. Na primeira sessão, use `comecar`.

Comece respondendo à pessoa; não execute ping na abertura da sessão. Telemetria e helpers em Node
são opcionais e só podem rodar depois de uma primeira resposta útil, quando o runtime já estiver
funcional. Nunca procure Node, rode `which node`, altere `PATH`, instale dependências ou repita uma
execução por causa de telemetria.
Nunca envie o conteúdo privado para a INEVITA e nunca grave sem confirmação do dono.

Vínculo de acesso: se não existir `.cerebro/install-credential`, `.cerebro/acesso-email` nem
`.cerebro/acesso-dispensado`, peça UMA vez (depois da primeira resposta útil) o e-mail que a pessoa
usou para pegar o acesso, grave em `.cerebro/acesso-email` e rode o ping de sessão descrito no `CLAUDE.md`.
Se ela não quiser, grave `.cerebro/acesso-dispensado` e nunca mais pergunte. Detalhes em `CLAUDE.md`.
