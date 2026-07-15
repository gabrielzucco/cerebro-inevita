# Comece aqui

Este é o **cérebro do teu negócio**. Em ~10 minutos, partindo da **tua maior dor** e do que você já tem, ele monta teu contexto — e já te devolve uma sacada aplicada ao teu caso.

> 📕 **Quer entender o método inteiro antes (ou depois) de rodar?** Leia o **[METODO-COMPLETO.md](METODO-COMPLETO.md)** — fundamentos, estrutura, melhores práticas e resultados, condensados das palestras do maior evento de IA do mundo, com fonte e minutagem em cada citação. Este cérebro já vem com esse método embutido: as skills executam ele por você.

Roda dentro do **Claude Code** (o assistente da Anthropic no terminal). Se nunca usou, faça o **Passo 0** — é uma vez só.

---

## O que você precisa (e o que NÃO precisa)
**Precisa:** uma conta **Claude** (Pro ou Max) — é a única coisa paga, e é a mesma que roda o Claude Code.
**NÃO precisa:** nenhuma **chave de API**, nenhum serviço de transcrição, nenhum cartão além do Claude, nenhuma ferramenta extra. O cérebro é markdown + as skills; quem faz o trabalho é a tua conta Claude. Se em algum momento parecer que você precisa "pegar uma chave" de algo, **pare — não precisa**. Manda no grupo.

---

## Passo 0 — instalar e abrir o Claude Code (uma vez)
Você precisa de uma conta **Claude Pro ou Max** (claude.ai).

**Mac:** abra o **Terminal** (`Cmd+Espaço` → "Terminal"). Instale o **Node.js** (botão "LTS" em [nodejs.org](https://nodejs.org)). Depois cole: `npm install -g @anthropic-ai/claude-code`.
**Windows:** instale o **Node.js** ("LTS" em [nodejs.org](https://nodejs.org)). Abra o **PowerShell** e cole: `npm install -g @anthropic-ai/claude-code`.
**Abrir esta pasta:** no terminal digite `cd ` (com espaço), **arraste esta pasta** pra cima da janela, Enter. Rode `claude` e logue.

> ⚠️ **Importante:** as skills (`/comecar` etc.) só carregam quando o Claude Code **abre já dentro desta pasta**. Se você acabou de clonar o cérebro numa conversa, **feche e abra de novo dentro da pasta** — é uma vez só.

> Travou? Manda no grupo dizendo onde parou — a gente destrava.

---

## Passo 1 — `/comecar`
Digite **`/comecar`**. Ele começa pela **tua maior dor**, puxa **uma coisa que você já tem** (teu site, um anúncio, uma call), trata isso em notas e monta teu contexto. Você quase não digita.

## Passo 2 — recebe teu diagnóstico
No fim: **o que teu cérebro já sabe de você** + **1 sacada do Vale aplicada ao teu caso** + **1 próximo passo**. Depois é só **trabalhar conversando** — e quando algo valer, o cérebro te oferece guardar.

---

## Os comandos
- **`/comecar`** — monta teu contexto do zero (a dor → o que você tem → diagnóstico).
- **`/metodo`** — entende como o cérebro funciona (os 4 movimentos) e aplica num caso teu.
- **`/guardar`** — transforma algo (call, decisão, anúncio) numa nota do cérebro; ele propõe, você aprova.
- **`/atualizar`** — traz melhorias novas sem tocar no teu contexto.

## Como teu cérebro é organizado (por uso, não por tema)
- `meu-negocio/fios/` — **agora**: o que está quente.
- `meu-negocio/` (oferta · icp · posicionamento · o-que-funciona · decisões) — **áreas** do negócio.
- `conhecimento/` — **referências**: o que vem de fora (o Vale, encontros) pra cruzar com o teu caso.
- `meu-negocio/arquivo/` — o que **esfriou**.

### Sobre privacidade
Dado pessoal (e-mail, telefone, nome de cliente) vai **só** na pasta `privado/`, que **nunca** sai da tua máquina. Se um dia subir pro GitHub pra backup, use **repositório privado**.

### Sobre a telemetria (transparência total)
Pra melhorar o cérebro, ele manda pra gente um **ping anônimo** quando você usa um comando (`sessão`, `/comecar`, `/teste`…). O que sai: um código aleatório desta instalação + o nome do evento + a versão + o sistema operacional. **O que NUNCA sai: teu contexto, teus arquivos, teu nome, teu e-mail — nada de conteúdo.** Pra desligar: crie um arquivo `.cerebro/sem-telemetria` (ou `export CEREBRO_TELEMETRY=off`). O código do ping está aberto em `.claude/scripts/ping.sh` — pode ler. Se você informar teu **e-mail de resgate** no `/comecar` (opcional), a instalação fica ligada ao teu acesso — é só o e-mail, junto do ping; teu conteúdo continua nunca saindo daqui. Pra desfazer o vínculo: apague `.cerebro/acesso-email`.
