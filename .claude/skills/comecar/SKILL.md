---
name: comecar
description: Instala o primeiro recorte observado do Cérebro da Empresa na pasta local, usando fontes reais para persistir mapa, primeiro sistema, Context Pack, output útil e aprendizado. Use na primeira abertura ou quando ainda não existe ativação aprovada.
---

# Começar — configurar o cérebro com realidade, não com formulário

A pasta local é o cérebro. Manus, Codex, Claude, Gemini ou qualquer outra IA baseada em arquivos é
apenas o operador atual. A primeira sessão deve deixar contexto durável na pasta e um resultado que
a pessoa possa usar — não apenas respostas numa conversa.

Leia `.cerebro/layout.json`, `sistemas/cerebro-base/manifest.md`, `pipeline.md` e `evals.md`. Em
seguida, leia e execute `company-brain-sprint` na conversa atual. Não peça reinício, troca de sessão
ou instalação de runtime.

## Experiência de abertura

- Use sempre `você`, `seu` e `sua` e reutilize o vocabulário da pessoa.
- Faça uma pergunta por mensagem. Se a resposta já está no pedido ou nos arquivos autorizados, não
  pergunte de novo.
- Não abra com e-mail, menu, arquitetura, lista de ferramentas ou “o que você faz?”.
- Não exponha run-id, relógio, telemetria, A0/A1/A2, T0–T4 ou nomes internos do método.
- Não procure Node, rode `which node`, altere PATH ou instale dependências para helpers opcionais.
- Telemetria nunca é pedágio. Só rode helpers silenciosos depois do primeiro output útil e ignore
  qualquer falha sem interromper a pessoa.

## 1. Confirmar a casa e recuperar a operação

Confirme em uma frase que o trabalho será gravado na pasta local atual e que as fontes não serão
movidas nem alteradas sem autorização. Procure uma operação concreta na mensagem atual,
`operacao/decisoes-pendentes/onboarding.md` ou nos arquivos que a pessoa já autorizou.

Se a operação já está clara, espelhe o que entendeu e prossiga. Se não está, pergunte apenas:

> Qual trabalho recorrente este cérebro deve tornar mais fácil primeiro — o que dispara esse
> trabalho e qual entrega utilizável precisa existir no final?

Isso configura o primeiro sistema por resultado. Não é uma entrevista genérica sobre a empresa.
Se a pessoa disser que não sabe por onde começar, use a rota de observação: peça um único rastro
recente de trabalho que tomou tempo, voltou para correção ou dependeu do julgamento dela. Observe o
caso, desenhe o mapa atual e proponha até três resultados. Nunca responda à incerteza pedindo para
conectar todas as fontes.

## 2. Descobrir sem invadir

Quando scripts estiverem naturalmente disponíveis, `discover-context.mjs` pode olhar somente nomes
de pastas e marcadores técnicos. Nunca abra documentos externos antes da autorização. Se houver
mais de uma instalação, mostre os caminhos e deixe a pessoa escolher. Cérebro existente não é a
mesma coisa que contexto existente.

Peça ou localize a menor amostra real sobre a operação: duas a quatro fontes pequenas e, quando
possível, de papéis diferentes — verdade do negócio, rastro do trabalho, voz do cliente, sinal de
resultado ou rastro de julgamento. Upload, texto, transcrição, pasta local autorizada e relato
ditado são válidos. Uma fonte permite observação parcial; não permite chamar o mapa de completo.

Se a pessoa autorizar uma pasta externa recorrente, registre apenas a referência local com
`register-source.mjs`. Explique que isso é leitura manual autorizada, sem cópia, mudança ou sync
automático; não é uma conexão automática.

## 3. Ativar o primeiro recorte

Execute `company-brain-sprint` para:

1. classificar o que cada evidência sustenta e não sustenta;
2. desenhar o mapa atual de uma única operação;
3. mostrar contradições, desconhecidos e cobertura;
4. receber a correção do dono antes de persistir a verdade;
5. escolher o primeiro sistema pelo resultado;
6. compilar um Context Pack estreito e pronto para aquela tarefa;
7. produzir um output real e ajustar uma vez;
8. salvar os seis artefatos nos caminhos de `.cerebro/layout.json`.

Além dos seis artefatos humanos, salve o System Contract e o primeiro Run Record definidos no
layout. Eles são o envelope comum que permite costurar entidades, fontes, outputs e correções entre
Sistemas diferentes sem padronizar o conteúdo privado.

O bruto é usado para prova, citação, contradição e reprocessamento. O Context Pack recebe apenas o
recorte necessário à tarefa. Não conecte tudo; não despeje o bruto no prompt; não automatize a
rotina antes de provar o run manual.

## 4. Confirmar valor e reutilizar

Depois do primeiro output, pergunte naturalmente:

> Você usaria isso do jeito que está ou mudaria alguma coisa antes?

Grave a correção nas palavras da pessoa. Quando aprovado, atualize `operacao/_HOJE.md` e o recibo.
Na próxima execução, leia primeiro o mapa, o System Brief e o Context Pack persistidos. Não releia a
fonte bruta se o contexto aprovado for suficiente. Pergunte:

> Isso aproveitou o que já estava no cérebro ou você precisou explicar tudo de novo?

Uma correção vira aprendizado candidato; só repetição e resultado medido tornam a regra validada.
Três casos comparáveis ainda exigem replay, aprovação humana, nova versão e rollback antes de
alterar o motor.

## 5. Vincular e conectar só quando fizer sentido

Somente depois do output útil, se ainda não existir `.cerebro/member-id` ou
`.cerebro/acesso-email`, ofereça em uma frase vincular atualizações/comunidade por e-mail. É
opcional, não bloqueia nada e o e-mail fica apenas em `.cerebro/acesso-email`, fora das notas.

Crie rotina quando a mesma entrada e o mesmo output voltarem a acontecer. Conecte fonte recorrente
quando o run manual provar que ela é necessária e houver permissão de leitura. Conecte ferramenta
de escrita/ação apenas depois do human gate e da avaliação estarem definidos. V3 só existe depois
de uma execução comparável devolver resultado observado contra a medida pré-declarada.

## Compatibilidade — valor antes do runtime

No Antigravity ou em qualquer agente sem shell, faça tudo com leitura e escrita de arquivos. Fora
dele, scripts auxiliares só podem rodar depois da primeira resposta útil; caso contrário, pule. O
produto funciona pelos arquivos e pelo contrato; helpers não podem transformar ativação em setup.
