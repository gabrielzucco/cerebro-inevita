# Fontes do meu negócio

Este é o **índice das fontes reais** — uma nota por fonte, dizendo onde ela mora, o que ela contém e até que nível foi refinada. Brutos ficam em `capturas/`; átomos aprovados são roteados para `meu-negocio/`. Drive, CRM ou outras conexões continuam fontes de verdade externas — aqui vive só o ponteiro.

A skill `/fonte` cria e atualiza estas notas. Pastas locais fora do cérebro também ganham registro técnico em `conexoes/configuradas/fontes.json` (read-only, sem cópia) — a nota aqui é a vista humana; o JSON é a vista da máquina.

Formato de uma nota de fonte:

```markdown
# Fonte: <nome curto> (<o que é>)

- **Original:** <onde mora — caminho, ferramenta ou "colado na conversa"> (fonte de verdade; sem sync automático)
- **Nível de refino:** <0-4> — <por quê parou aqui>
- **Escopo:** <o que essa fonte cobre no negócio>
- **Atualização:** <manual | rotina> · **última:** <AAAA-MM-DD>

| arquivo/pedaço | o que é | destilado em |
|---|---|---|
| `<bruto em capturas/>` | <uma linha> | <[[átomo]] ou "fonte citável (bruto)"> |

**Não consta na fonte:** <o que alguém vai procurar aqui e NÃO existe — economiza a próxima busca>
```
