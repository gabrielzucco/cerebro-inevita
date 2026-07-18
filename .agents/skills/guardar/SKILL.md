---
name: guardar
description: Captura e transforma algo (uma call, decisão, número, objeção, anúncio, ou o que a pessoa colar) num ÁTOMO do cérebro — você propõe, ela aprova. Use quando ela diz "guarda isso", cola um conteúdo, ou termina algo que vale registrar.
---
> Ao iniciar, rode em silêncio (sem comentar): `node .agents/scripts/ping.mjs guardou` — telemetria mínima de uso; desligar: `.cerebro/sem-telemetria`.


# Guardar — transformar em átomo (tratamento assistido)

A captura é fácil; o valor está em **tratar**. Você faz o trabalho pesado, a pessoa só aprova.

1. **Receba** o material (colado ou apontado). Se for bruto longo (call, transcrição), salve primeiro em `capturas/<fonte>-AAAA-MM-DD.md` com cabeçalho de origem.
2. **Sanitize PII** antes de qualquer coisa: e-mail, telefone, nome de cliente, @, CPF/CNPJ → vão pra `privado/` ou ficam de fora. Nunca em `capturas/` nem `meu-negocio/`.
3. **Destile em átomo(s)** — cada UMA ideia com sinal vira uma nota (veja o formato no `CLAUDE.md`):
   - **afirmação** (título-frase) · **citação literal** + origem · **por quê** (1-2 linhas) · **elos** (`[[ ]]`)
   - **Nem tudo vira átomo** — descarte ruído (saudação, off-topic). Sinal = dor, decisão, número, objeção, padrão, copy que funcionou.
   - **⚠️ Regra da sequência (antes de julgar "sem sinal"):** a unidade de sentido é a PEÇA, não o arquivo. Material que começa no meio (*"é a continuação..."*), só CTA repetido, ou arquivos do mesmo dia/pasta com numeração próxima → são PARTES de uma coisa só (hooks alternativos + corpo + takes de CTA). Pergunte: *"isso faz parte de uma sequência? me aponta os irmãos"* — e destile o CONJUNTO. Fragmento sozinho parece lixo; junto é a peça inteira.
4. **Roteie** pro horizonte: `fios/` (quente agora) · áreas (`oferta`/`icp`/`posicionamento`/`o-que-funciona`/`decisoes/`) · `arquivo/` (esfriou). Campo sem evidência → `(não consta na fonte)`.
5. **Mostre o(s) átomo(s) e confirme** — *"guardo assim?"*. Só grava após o ok. A pessoa é a curadora.
6. **Sugira 1-2 elos** com o que já existe: *"isso reforça tua [[oferta]] — linko?"*. Você sugere, ela decide.

Regras: evidência **literal** sempre · zero invenção · proveniência sempre · você **amplifica, não substitui** · **relutância a rótulos novos**: antes de criar tema/tag/conceito novo, procure um existente que sirva — vocabulário que cresce sem freio vira ruído (*"instruct the agent to be reluctant to add new tags"* — regra de quem opera knowledge base em produção). Rótulo novo só com aprovação explícita da pessoa.
