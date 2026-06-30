---
name: comecar
description: Onboarding do cérebro do negócio. Use quando a pessoa está começando, abriu o cofre pela primeira vez, ou pede pra montar/organizar o contexto do negócio dela. Começa simples (só o site) e devolve um diagnóstico cruzado com o Vale; aprofunda só quando ela quiser.
---

# Começar — montar o teu contexto a partir do que você já tem

**Objetivo:** encher `meu-negocio/` com o contexto real do negócio partindo do que a pessoa **já produziu** (sem ela digitar muito) e entregar uma **vitória rápida** (diagnóstico cruzado com o Vale) ainda na primeira sessão.

Princípio: **ingestão antes de pergunta**, e **vitória antes de profundidade**. Comece pelo mínimo (o site) e só aprofunde quando a pessoa quiser.

---

## TRILHA BÁSICA — o default ("1 site, 1 sacada, 10 minutos")

Faça só isto na primeira vez. **Não peça mais nada antes da vitória.**

### Passo 1 — pegar o site
Peça **só o site**: *"Qual o endereço do teu site ou landing page?"* → leia com `WebFetch`.

- **Se o `WebFetch` falhar, voltar vazio ou muito raso** (site em Framer/Wix/JS pesado, página de login, redirect): **não invente**. Diga que não conseguiu ler e peça *"cola aqui o texto da tua home, ou manda um print"*. Trabalhe com o que ela colar.
- **Se ela não tiver site:** pule pro Passo 3 (perguntas), modo enxuto.

### Passo 2 — ingerir o site (fonte → nota)
1. **Sanitize ANTES de gravar qualquer coisa.** Varra por PII — e-mail, telefone, @, CPF/CNPJ, nome de pessoa real/cliente. PII **não** entra em `capturas/` nem `meu-negocio/`: troque por `[cliente]`/`[contato]` ou mande pra `/privado/`. Na dúvida, deixe de fora e avise.
2. **Salve o bruto** (já sanitizado) em `capturas/site-AAAA-MM-DD.md` com cabeçalho de proveniência (o que é, de onde veio, data).
3. **Destile com o gabarito do site:** o que vende · promessa central · ICP (pra quem) · prova/autoridade · linguagem e tom · CTA.
   - Campo sem evidência na fonte fica **`(não consta na fonte)`** — nunca preencha por dedução.
4. **Roteie** pras notas: `oferta.md`, `icp.md`, `posicionamento.md`. **Atualize**, não duplique. Em cada nota registre `origem: capturas/<arquivo>`.
5. **Confirme antes de gravar:** mostre o destilado em bullets curtos e pergunte *"é isso? guardo?"*. A pessoa é a curadora.

### Passo 4 — a vitória (assim que tiver oferta + ICP)
1. **CONTEXT-MAP:** resuma em 3 linhas *"isto é o que teu cérebro já sabe de você"* (oferta · pra quem · posicionamento).
2. **O exercício do aha** — convide: *"cola aqui uma copy tua que converteu (ou uma decisão real) e eu te mostro o que a IA genérica faria **vs.** o que ela faz sabendo do teu negócio de [nicho]."* Mostre os dois lado a lado — esse contraste é a sacada (veja `vale/dor-operando-na-media.md`).
3. **Cruze com o Vale** (`vale/`): pegue uma tensão real que você notou e conecte a uma sacada aplicável.
   - **Ao citar o Vale, copie a frase literal entre aspas, com o timestamp do arquivo — nunca reescreva nem invente quote/minuto.** Cite `[[vale/paypal]]` ou `[[vale/geoffrey-moore]]`.
4. Termine com **1 próximo passo** acionável (um só, o de maior retorno).

> **Pare aqui na primeira vez.** Entregue a vitória e ofereça o próximo nível — não puxe tudo de uma vez.

---

## QUANDO QUISER MAIS — aprofundamento (só depois do aha)

Ofereça de operador pra operador, sem menu: *"esse foi o aha com só o teu site. Quando quiser, traz um anúncio que converteu ou uma call recente — aí eu fico afiado de verdade. Ou a gente segue trabalhando e eu vou guardando o que aparecer."*

A migração é **aditiva**: mesmas pastas, atualiza as notas que já existem e preenche as vazias. Nada é refeito.

### Mais fontes (uma de cada vez, sanitizando igual ao Passo 2)
- **Anúncio** → gabarito: ângulo · dor atacada · oferta · resultado (se citado) → `o-que-funciona.md`.
- **Call/reunião transcrita** → gabarito: decisões · dores do cliente · objeções reais · próximos passos → `meu-negocio/fios/` e `decisoes/`.

### Passo 3 — preencher os buracos (perguntas, só o que faltou)
Olhe o que ficou `(não consta)` em `meu-negocio/`. Pergunte curto, uma de cada vez:
- *"Qual decisão te tira o sono essa semana?"* → `meu-negocio/fios/`
- *"O que já floppou (e por quê)?"* → `o-que-funciona.md`
- *"Onde você quer chegar em 90 dias?"* → `meu-negocio/posicionamento.md`

---

## Regras (invioláveis)
- **Nunca invente.** Só registre o que veio das fontes ou das respostas dela. Sem evidência → `(não consta na fonte)`.
- **Sanitize antes de gravar.** PII (e-mail, telefone, nome de cliente, @, CPF/CNPJ) **nunca** em `capturas/` nem `meu-negocio/` — só em `/privado/`.
- **Sempre proveniência** (`origem:`) em cada nota.
- **Citação do Vale = literal**, entre aspas, com timestamp do arquivo. Nunca parafraseie como se fosse quote.
- Tom: direto, de operador pra operador.
