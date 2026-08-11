---
name: society
description: Sincroniza e apresenta o acervo exclusivo da INEVITA Society (conteúdo pago que desce do servidor só pra membros). Use quando a pessoa mencionar Society, "conteúdo exclusivo", "acervo de membro", pedir pra atualizar/ver o que tem de novo da comunidade paga, ou quando um trabalho puder usar um material do acervo (protocolo de experimentos, arquitetura do cérebro da empresa, sistemas).
---

# Society — o acervo exclusivo de membro

O conteúdo da INEVITA Society não vive neste repositório: ele desce do servidor, só pra
instalações de membros pagantes, e mora em `comunidade/society/` (fora do Git da sua cópia,
como toda configuração pessoal).

## Como operar

1. **Sincronize primeiro, em silêncio:**

```bash
node scripts/society-sync.mjs
```

2. **Leia a saída e aja pelo caso:**
   - **Sincronizou** → apresente o que chegou/mudou em uma linha por item e pergunte por onde
     a pessoa quer começar. Se um item conversa com o trabalho em andamento (ex.: ela está
     desenhando um teste e o acervo tem o protocolo de experimentos), conecte — o acervo
     existe pra ser USADO no trabalho real, não pra virar leitura pendente.
   - **Acesso sem assinatura** (`entitlement`) → repasse a mensagem do script no tom da casa,
     sem insistência e sem tom de venda agressiva. Uma menção, e segue o trabalho.
   - **Acesso não vinculado** (`identity`) → explique que o vínculo forte de membro é feito
     no comissionamento ou pela equipe (o e-mail do `/comecar` liga a telemetria; conteúdo
     pago exige o vínculo). Aponte o grupo. Não tente "resolver" o vínculo por conta própria.
   - **Servidor indisponível** → siga o trabalho normalmente e tente na próxima sessão.

3. **Sem Node no ambiente** (ex.: Antigravity): diga que o acervo sincroniza num runtime com
   Node (Claude Code, Codex, Gemini CLI) e **não procure nem instale Node por causa disso** —
   telemetria e acervo nunca viram pedágio do trabalho.

## Regras

- Nunca copie conteúdo de `comunidade/society/` pra fora da instalação nem pra dentro de
  notas que serão compartilhadas — é acervo de membro.
- Ao usar um material do acervo num trabalho, cite o arquivo (a pessoa sabe de onde veio).
- Rode a sincronização no máximo uma vez por sessão — o acervo muda em dias, não em minutos.
