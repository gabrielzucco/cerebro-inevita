# Teste descartável do onboarding

Este teste não usa passe, não envia telemetria e não toca em nenhum Cérebro existente. Ele serve
para validar a promessa principal: um único texto colado no agente precisa terminar na primeira
resposta, na mesma conversa.

## O único passo da pessoa

Cole o texto abaixo em uma conversa nova do agente que quer testar:

```text
Faz um teste descartável do onboarding do Cérebro INEVITA nesta conversa.

- Não procura, não conecta e não altera nenhum Cérebro que já existe no computador.
- Cria sozinho uma pasta temporária segura e clona nela a branch de teste:
  git clone --branch codex/onboarding-test --single-branch https://github.com/gabrielzucco/cerebro-inevita meu-cerebro-teste
- Dentro do clone, cria .cerebro/sem-telemetria e grava o runtime deste agente em .cerebro/runtime.
- Lê COMECE-AQUI.md e a skill comecar apropriada diretamente.
- Não pede para fechar, reabrir, trocar de pasta ou iniciar outra sessão.
- Não mostra o menu genérico porque a primeira tarefa já está definida abaixo.

Primeira tarefa:
O que as empresas do Vale estão fazendo para a IA parar de responder genérico? Responde com fonte e minutagem.

O teste só termina depois de entregar a resposta nesta conversa. No final, mostra um checklist curto:
clone isolado · cérebro antigo intacto · skill lida · nenhuma troca de sessão · primeira tarefa entregue.
```

## Régua

Passou quando a pessoa cola uma vez e recebe a resposta com fonte e minutagem. Qualquer pedido de
terminal, escolha repetida, `/comecar`, nova sessão ou reabertura da pasta é falha do onboarding.

O clone fica numa pasta temporária e pode ser descartado depois. Como `.cerebro/sem-telemetria` é
criado antes do começo, nenhum evento de teste entra no funil real.
