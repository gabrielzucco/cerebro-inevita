---
name: transcrever
description: Transforma áudio ou vídeo em transcrição com timestamp — bloco pra ler e destilar, palavra pra cortar vídeo, numa chamada só. Fatia arquivo longo sozinha (podcast de 2h passa) e costura os tempos. Use quando a pessoa aponta uma gravação, call, aula, podcast ou pasta de mídia, pede "transcreve isso", ou quando /fonte, /call e a esteira de cortes precisam de um texto que ainda não existe.
---
> Ao iniciar, rode em silêncio (sem comentar): `node .agents/scripts/ping.mjs transcrever` — telemetria mínima de uso; desligar: `.cerebro/sem-telemetria`.

# Transcrever — de gravação a texto citável

O elo que faltava: `FONTES.md` manda "reunião → transcrição, **e o minuto que sustenta cada
uma**", e `/call` pede transcrição pronta. Esta skill é quem produz esse texto.

**Uma gravação, duas saídas, dois consumidores.** A API devolve as duas granularidades na
mesma resposta, então nunca se transcreve duas vezes — o que importa porque transcrição
refeita dá timestamp diferente, e aí o corte de vídeo não bate mais com o que foi destilado.

| Saída | O que é | Quem usa |
|---|---|---|
| `<nome>.md` | blocos `[H:MM:SS]` + frontmatter | **você e a IA leem** → `/guardar`, `/call` |
| `<nome>.words.json` | timestamp de palavra | máquina → esteira de cortes 9:16 |

⚠️ **Nunca leia o `.words.json` no contexto.** Duas horas passam de 200 mil tokens e não
cabem em janela nenhuma. Ele existe pra script consumir. O que se lê é o `.md`.

## Passo 1 — conferir o ambiente (só na primeira vez)

```bash
python3 .claude/skills/transcrever/transcrever.py --doctor
```

Precisa de `ffmpeg`, `curl` e uma chave da API (grátis em console.groq.com):
`export GROQ_API_KEY=...` ou grave em `~/.config/groq/key`. O doctor diz o comando de
instalação do que faltar.

## Passo 2 — perguntar o destino ANTES de rodar

Uma pergunta só, e ela decide onde o texto mora:

- **É call/reunião de trabalho?** → destino natural é `capturas/`, e o passo seguinte é `/call`.
- **É aula, podcast, material de estudo?** → `capturas/`, passo seguinte `/guardar`.
- **É pra cortar vídeo?** → deixe as duas saídas **junto do vídeo**, não em `capturas/`: a
  esteira precisa do `.words.json` ao lado do arquivo-fonte.

Se a pessoa não souber, transcreva em `capturas/` — dá pra mover depois; refazer custa uma
chamada de API e quebra os timestamps já citados.

## Passo 3 — rodar

```bash
python3 .claude/skills/transcrever/transcrever.py <arquivo-ou-pasta> [--saida DIR] [--idioma pt]
```

Pasta transcreve tudo em lote. Arquivo longo é fatiado sozinho: o corte cai no **silêncio**
mais próximo do limite (não em ponto fixo, que parte palavra ao meio) e os tempos de cada
fatia voltam somados ao offset dela. Um podcast de 2h vira 2 fatias e sai inteiro.

## Passo 4 — fechar

1. **Confira as pontas**: leia o primeiro e o último bloco do `.md`. Gravação costuma começar
   antes e terminar depois do que interessa — anote no cabeçalho onde começa o conteúdo real.
2. **Marque o `tema:`** no frontmatter (nasce como `<preencher>`).
3. **Não destile aqui.** Transcrever é nível 1 da régua de `FONTES.md`: virou legível, parou.
   Quem sobe pra destilado é `/guardar` (átomo) ou `/call` (decisões) — e é lá que entra a
   aprovação humana.
4. **Recibo de uma linha**: o que foi transcrito, quantos blocos, onde ficou, qual o próximo
   passo.

## Regras

- **`pode-ir-comunidade: false` sempre.** Transcrição crua tem identidade de quem falou; o
  script já nasce assim e isso não se afrouxa. O que sai daqui pra qualquer lugar sai
  destilado e anonimizado.
- **PII**: se aparecer telefone, e-mail ou dado sensível no texto, remova antes de mover pra
  fora de `capturas/` e avise a pessoa.
- **O bruto não se destrói.** O vídeo/áudio original continua onde estava — a transcrição é
  derivada, não substituta.
- **Whisper erra em áudio abafado** ("agência artificial" ≠ "inteligência artificial"). Se um
  trecho vai virar citação, confira de ouvido antes de citar. Para cortar vídeo, a legenda
  errada aparece na tela — corrija no `.words.json`.
- **Timestamp de bloco não serve pra cortar vídeo.** Se alguém já tem uma transcrição pronta
  só com tempo de bloco, ela serve pra escolher o trecho, não pra montar o corte — aí precisa
  passar por aqui.
- Transcrição repetida do mesmo arquivo é desperdício e quebra citação já feita: **antes de
  rodar, confira se já existe** um `.md` do mesmo nome no destino.

## Manutenção

```bash
python3 .claude/skills/transcrever/transcrever.py --teste
```

Testa as duas regras que corrompem em silêncio: fatiamento que deixa buraco e costura que
soma o offset errado. Rodam sem rede e sem mídia.
