# Cérebro INEVITA — inventário da experiência

Base inspecionada em 23/09/2026: `cerebro-inevita` (`e5a7cb2`) e `segundo-cerebro` (`472c5f3c`). A versão interna acrescenta operação hospedada; a pasta local do membro continua sendo a casa de verdade. Este inventário avalia a interface e as mensagens, não a validade dos contratos.

| Jornada | Fricção observada | Dúvida de quem chega | Primeira informação e próxima ação |
| --- | --- | --- | --- |
| Instalar e abrir | `git clone`, Node, agente, comando e Cockpit aparecem como portas concorrentes | “O que preciso instalar para ter uma resposta?” | Começar pela conversa e uma tarefa real; explicar o Cockpit como acompanhamento opcional. |
| Primeira Missão | Etapas T0–T4 e “ativação por uso” competem com o valor prometido | “Já está funcionando?” | Mostrar o trabalho escolhido, o que falta para concluí-lo e o comando em linguagem comum. |
| Hoje | Cinco cartões de métricas, rotinas e recibos antes da tarefa | “Onde devo clicar agora?” | Priorizar uma entrega ou decisão pendente; demais contagens em resumo recolhível. |
| Cérebro e memória | Hit@3, snapshots, índice e recuperação ocupam a visão geral | “Ele sabe algo do meu negócio?” | Mostrar fontes disponíveis, última utilização observada e lacunas; diagnóstico sob demanda. |
| Sistemas e Skills | Taxonomia, estágio, manifest e capability aparecem cedo | “Que resultado consigo produzir?” | Lista por resultado esperado; estado e ação principal por Sistema; especificação em detalhes. |
| Fontes | Custódia, PII, assurance e modos aparecem no cartão | “Minha informação foi conectada ou enviada?” | Separar “mapeada”, “conectada” e “usada”; explicar acesso e privacidade em frase curta. |
| Entregas e julgamento | Output, veredito, Run e recibo pedem tradução | “Posso usar isso? O que acontece se eu aprovar?” | Resultado como rascunho da IA; ações Aprovar, Pedir ajuste e Rejeitar com consequência explícita. |
| Execuções e Canvas | Tabela de dez colunas e trace visual são ponto de entrada | “O que aconteceu neste trabalho?” | Linha do tempo de trabalho, estado e resultado; “Ver como foi feito” abre fontes, limites e trace. |
| Confiança e erros | Códigos e readback são apresentados como diagnóstico inicial | “Tem algo quebrado? O que faço?” | Estado humano, impacto e próxima ação; código e referência apenas em detalhes para suporte. |
| Atualizações | Compatibilidade, distribuição, release e versão se misturam | “É seguro atualizar? Meu conteúdo fica?” | Explicar o que muda e o que permanece, verificar compatibilidade e pedir confirmação só na ação. |
| Telegram | Hermes, BotFather, Codex, token, gateway e allowlist no mesmo percurso | “Com quem vou falar? Quem terá acesso?” | Três passos humanos, sem exigir conhecer a infraestrutura; detalhes de segurança após cada passo. |
| Interno: operação | Shadow, control plane, fila e fontes governadas aparecem sem contexto | “O que está ativo de verdade?” | Separar observado, pronto, bloqueado e só planejado; oferecer ação autorizada, sem sugerir autonomia inexistente. |
| Interno: políticas | Previews, challenge, ledger e transições são necessários mas densos | “Qual decisão estou tomando e qual o efeito?” | Mostrar mudança proposta, evidência e alcance antes de confirmar; prova técnica sob demanda. |

## Contrato comum de cada tela

1. Título de tarefa e uma frase que responde “para que serve?”.
2. Estado observado, em palavras comuns, sem deduzir atividade de dados ausentes.
3. Uma ação principal quando existe; caso contrário, motivo e próximo passo possível.
4. “Ver como foi feito” no objeto específico, com fonte, limite e rastro existente. Abrir detalhes nunca executa modelo ou ação externa.
5. Termos técnicos, IDs, caminhos, códigos e métricas de engenharia ficam na camada de inspeção.

## Roteiro do protótipo

Abrir [`prototype.html`](prototype.html) e percorrer: começar → Hoje → Sistema → entrega → evidências → falha → Telegram. Alternar para “Equipe INEVITA” para ver a camada operacional no mesmo idioma visual. Os dados do protótipo são sintéticos e identificados como exemplo.

**Revisão estrutural:** a inspeção seguinte mostrou que a organização por Sistema, run e drawer ainda exige que a pessoa reconstrua uma mesma tarefa em várias telas. O diagnóstico, as decisões de substituição de telas, o contrato de estados e a ordem de implantação estão em [redesenho estrutural](2026-09-23-structural-redesign.md). O [protótipo V2](prototype-v2.html) permite testar primeiro acesso, trabalho existente, falha parcial, revisão e autorização externa. Ele substitui o protótipo acima como hipótese de jornada; ambos usam apenas dados fictícios.

## Implementação e pontos a observar

Este primeiro corte aplicou a linguagem e a hierarquia nas duas interfaces: Hoje, primeiro acesso, trabalhos, entregas, histórico, fontes, cuidados, menus e abertura de detalhes. O público mantém o percurso guiado do Telegram; a versão interna mantém a prévia e a confirmação das ações hospedadas. A revisão estrutural posterior identificou que as telas de trabalho e decisão precisam ser reorganizadas, inclusive nos fluxos, como descrito no documento acima. Nenhum termo foi alterado no contrato ou no registro persistido.

Na avaliação, marque separadamente três falhas: a pessoa não encontra a ação; encontra, mas não sabe o efeito; entende o efeito, mas confunde dado observado, sugestão da IA e decisão humana. Essa distinção guia a próxima revisão de texto e componentes.

## Aceite de pesquisa com usuários

Convidar pelo menos cinco pessoas sem familiaridade com os protocolos para executar, sem instrução prévia: começar um trabalho, localizar uma entrega, apontar de onde veio uma afirmação, pedir ajuste e recuperar uma falha. Registrar conclusão, dúvidas, cliques equivocados e palavras não compreendidas. Isto ainda depende de participantes humanos; revisão interna e automação não contam como esse teste.
