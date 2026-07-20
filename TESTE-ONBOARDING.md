# Teste caixa-preta do onboarding

Este teste usa **o texto literal gerado hoje pela página para Claude Code + primeira tarefa do
acervo**. Ele não ensina o comportamento esperado ao agente. A única substituição é o
`member-id` sintético, para a execução não ser atribuída a uma pessoa real.

## Regra do laboratório

O prompt deve ser entregue a um Claude Code novo, iniciado numa pasta temporária vazia e distante
de qualquer Cérebro real. Não acrescente instruções antes ou depois. O repositório clonado é o
`main` de produção, exatamente como para o usuário.

## Prompt literal de produção

```text
Instala ou reconecta meu cérebro da INEVITA e coloca ele para rodar neste agente.

Antes de baixar qualquer coisa, verifica se este workspace ou uma pasta próxima já é um Cérebro INEVITA existente (procura COMECE-AQUI.md, VERSION e .cerebro/).

- Se já existir: NÃO clona outra cópia e NÃO apaga meu contexto. Usa a instalação existente e apenas conecta o acesso abaixo.
- Se não existir: clona este repositório numa pasta chamada "meu-cerebro":
https://github.com/gabrielzucco/cerebro-inevita

Grava este member-id em .cerebro/member-id:
00000000-0000-4000-8000-000000000001

Grava "claude-code" em .cerebro/runtime.

Este ambiente é o Claude Code. Usa CLAUDE.md e as skills em .claude/skills.
Depois da instalação, reabre o Claude Code dentro da pasta meu-cerebro e inicia a skill /comecar.

Lê o COMECE-AQUI.md e executa tudo que conseguir sozinho. Só pede uma ação quando ela realmente precisar ser manual. Se faltar Git ou outra ferramenta, guia passo a passo como se eu fosse leigo.

Não termina apenas dizendo que os arquivos foram baixados. A instalação só acabou quando o cérebro estiver aberto no ambiente certo e a primeira sessão tiver começado.
Quando a skill de começo terminar, executa este primeiro trabalho comigo:
O que as empresas do Vale estão fazendo para a IA parar de responder genérico? Responde com fonte e minutagem.
```

## Resultado

O teste passa ou falha pelo que o agente faz espontaneamente. Reinício, troca de sessão, perda da
primeira tarefa, menu genérico, escolha silenciosa entre instalações ou falso erro de ping são
falhas — mas nenhuma dessas regras é revelada dentro do prompt.

Execução automática tentada em 20/07/2026: o Claude Code local parou antes do primeiro turno com
HTTP 401 (`Invalid authentication credentials`). Isso é bloqueio do laboratório, não resultado do
onboarding. O teste precisa ser repetido depois de autenticar o Claude Code.
