---
name: comecar
description: Conduz a primeira sessão do cérebro até um resultado útil no negócio. Use quando a pessoa abre o cofre pela primeira vez, pede para começar ou ainda não confirmou a primeira vitória. Recomenda uma call real, executa um sistema, pede confirmação de valor e só depois oferece aprofundamento.
---

> Ao iniciar, rode em silêncio: `node .agents/scripts/ping.mjs comecou`.

# Começar — uma coisa real vira resultado

A pessoa não precisa entender Obsidian, MCP, skill ou arquitetura. Ela precisa sair com algo que
ajude a decidir ou agir. Instalação é A0; abriu e começou é A1; **artefato aprovado que ela confirma
como útil é A2**.

## Voz e conversa

Fale como operador, em `tu/teu`, curto e concreto. Uma pergunta por mensagem. Opções numeradas são
só navegação; o conteúdo do negócio vem das palavras da pessoa. “Não sei” faz você escolher o
caminho recomendado e seguir. Nunca transforme onboarding em entrevista.

## 0. Reconhecer o acesso

Se `.cerebro/member-id` existe e é UUID, não peça e-mail. Se não existe nem
`.cerebro/acesso-email`, pode perguntar uma vez qual e-mail ela usou no resgate; explique que é
opcional e serve para ligar instalação e acesso. Não insistir.

## 1. Abrir pela vitória, não pela arquitetura

Diga:

> “Teu cérebro já veio com conhecimento e com um primeiro sistema instalado. Pra sentir a
> diferença, vamos fazer uma coisa real sair pronta agora. Tu quer: 1) trazer uma call/reunião e
> sair com decisões e ações — recomendado; 2) trazer um documento, anúncio ou problema real; ou
> 3) explorar primeiro o acervo do AI Engineer World's Fair?”

Se ela não escolher, siga por **Calls em Decisões**. Se não tem transcrição agora, aceite texto,
áudio já transcrito ou uma reunião antiga. Se não tem fonte nenhuma, use o acervo para uma prova
rápida, mas diga que isso ainda não é a primeira vitória no negócio.

## 2. Executar um sistema

- **Call:** invoque `operar` com `calls-decisoes`.
- **Outra fonte real:** use `guardar` para produzir um artefato aprovado e registre a execução como
  `fonte-em-artefato`; não finja que existe um sistema publicado para isso.
- **Acervo:** responda com citação literal + fonte + minutagem e então ofereça uma fonte real.

Não explique as seis pastas antes do resultado. Mostre a arquitetura apenas quando ela ajudar a
entender o que acabou de acontecer.

## 3. Confirmar valor

Depois do output aprovado, pergunte exatamente uma coisa:

> “Isso te ajuda a decidir ou agir agora?”

- **Sim:** grave o recibo local, atualize `operacao/_HOJE.md` e rode em silêncio
  `node .agents/scripts/ping.mjs first_value_confirmed <system_id>`.
- **Parcial/não:** pergunte qual correção concreta faria diferença, aplique uma vez, registre o
  feedback e rode a régua novamente. Não dispare A2 se continuar sem valor.

## 4. Só então mostrar o que acumula

Depois de A2, mostre em poucas linhas:

- a fonte ficou em `capturas/`;
- decisões e contexto aprovado alimentaram `meu-negocio/`;
- o sistema e sua régua estão em `sistemas/`;
- o recibo está em `operacao/`;
- nada privado foi enviado.

Ofereça **um** próximo passo: completar `meu-negocio/mapa.md` ou tratar outra fonte. O `/teste` é
mensal e não é pedágio da primeira sessão.

## 5. Detectar contribuição sem invadir

Se a execução revelar um padrão que parece útil fora daquele caso, pergunte:

> “Isso aqui parece um aprendizado que outros operadores poderiam usar. Quer que eu prepare uma
> versão anonimizada pra tu revisar? Nada é enviado.”

Se sim, siga a skill `operar`, seção “Contribuição”. Preparar, aprovar e enviar são três estados
diferentes. O cérebro nunca pula nenhum deles.
