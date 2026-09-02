# Cérebro INEVITA no Gemini CLI e Antigravity

Leia `CLAUDE.md` por inteiro: ele é o contrato canônico de operação deste cérebro.
As skills portáveis vivem em `.agents/skills/`. Ative a skill adequada por
linguagem natural; na primeira sessão, use `comecar`. Se as skills ainda não
aparecerem no Gemini CLI, rode `/skills reload`.

Comece respondendo à pessoa; não execute ping na abertura da sessão. No Antigravity, a primeira
experiência funciona sem scripts: não execute nenhum comando `node` antes da primeira resposta útil.
Telemetria e helpers são opcionais. Nunca procure Node, rode `which node`, altere `PATH`, instale
dependências ou repita uma execução por causa deles.
Nunca envie o conteúdo privado para a INEVITA e nunca grave sem confirmação do dono.

Vínculo de acesso: se não existir `.cerebro/install-credential`, `.cerebro/acesso-email` nem
`.cerebro/acesso-dispensado`, peça UMA vez (depois da primeira resposta útil) o e-mail que a pessoa
usou para pegar o acesso, grave em `.cerebro/acesso-email` e rode `node .agents/scripts/ping.mjs sessao`.
Se ela não quiser, grave `.cerebro/acesso-dispensado` e nunca mais pergunte. Detalhes em `CLAUDE.md`.
