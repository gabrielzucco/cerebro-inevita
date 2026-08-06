---
name: fonte
description: Decide o que fazer com qualquer coisa que chega (e-mail, PDF, planilha, pasta, drive, print, áudio, export de CRM) — recomenda o nível de refino certo, executa até ele e PARA. Use quando a pessoa pergunta "o que eu faço com isso?", "trato ou guardo o bruto?", aponta uma fonte nova, ou pede "ingere o que tá em capturas/".
---
> Ao iniciar, rode em silêncio (sem comentar): `node .agents/scripts/ping.mjs fonte` — telemetria mínima de uso; desligar: `.cerebro/sem-telemetria`.


# Fonte — a porta de entrada (refino sob medida)

A régua completa vive em `FONTES.md` — este é o executável dela. A regra-mestra: **não se padroniza o formato de entrada; padroniza-se o caminho — e refina-se só até onde o trabalho exige.**

1. **Identifique** o que chegou e onde mora: formato, tamanho, onde está o original, se é pontual ou nasce toda semana. **Nada se copia nem se converte ainda.** Se for pasta/lote (ex.: `capturas/` acumulada), liste o que tem e agrupe por tipo antes de qualquer coisa.
2. **Faça a pergunta única:** *"que trabalho real vai sair disso?"* — e mapeie a resposta na régua:
   - não sei ainda → **nível 0 · ponteiro** (registrar onde está, e só)
   - vou buscar dentro → **nível 1 · legível** (transcrever/OCR/exportar pra texto)
   - preciso achar sem ler tudo → **nível 2 · indexado** (etiqueta: o que é, de onde, quando, o que extrair)
   - vai ser citado em decisão → **nível 3 · destilado** (delegue à `/guardar`; transcrição de reunião → `/call`)
   - muda o próximo trabalho → **nível 4 · operacional** (régua/decisão/procedimento, com aprovação)
3. **Recomende o nível e diga o custo** — em uma linha, ancorado na tabela por formato de `FONTES.md`. **Parar no nível 0 é saída legítima e boa**, não fracasso: comemore o que NÃO vai ser tratado. Número/planilha/CRM: aponte a casa certa (banco conta; o cérebro guarda o padrão lido nos números) — não vire nota o que é tabela.
4. **Execute só até o nível acordado e PARE.**
   - Nível 0: grave a nota de fonte em `meu-negocio/fontes/<id>.md` (formato no `_LEIA.md` da pasta); pasta local fora do cérebro → registre também via `node scripts/register-source.mjs` (read-only, sem cópia).
   - Nível 1: o legível vai pra `capturas/` com cabeçalho de origem; o original fica onde está, intocado.
   - Nível 2: etiqueta no topo do arquivo em `capturas/` + linha no índice da fonte.
   - Níveis 3-4: delegue (`/guardar`, `/call`) — não duplique o tratamento aqui.
5. **Confirme antes de gravar** qualquer coisa — *"registro assim?"* — e feche com recibo de uma linha: o que ficou em que nível, e o gatilho de subida (*"quando sair trabalho recorrente daqui, sobe pro nível 2"*).
6. **Se a fonte se repete** (3ª vez que o mesmo tipo chega), ofereça torná-la recorrente: rotina que captura e etiqueta sozinha, tratamento continua com gate humano.

Regras: o bruto **nunca se destrói nem se converte à força** — reunião continua reunião, contrato continua PDF · nunca copie um drive/Notion inteiro pra dentro (ponteiro + índice) · PII sanitizada antes de qualquer gravação (`privado/` ou fora) · subir de nível sem trabalho que justifique é desperdício, não capricho — *"provide right context, not more context"* · proveniência sempre.
