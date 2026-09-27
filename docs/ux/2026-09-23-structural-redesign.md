# Cérebro INEVITA — redesenho estrutural da experiência

Avaliação em 23/09/2026 das interfaces distribuível e interna. Este documento substitui a hipótese de que basta simplificar textos e esconder logs. A primeira rodada de UI melhorou a leitura, mas preservou a organização do produto em objetos de implementação. O protótipo navegável [prototype-v2.html](prototype-v2.html) explora uma organização por trabalho, resultado e decisão; todos os dados nele são fictícios.

## Decisão de produto

**Sim: é necessário redesenhar por inteiro algumas telas e jornadas.** Não há evidência de que o motor, os registros ou as confirmações precisem ser substituídos. O problema central é que a pessoa precisa reconstruir um mesmo trabalho a partir de telas que representam partes do protocolo. Hoje, “Meus trabalhos” abre Sistemas/rotinas, “Entregas” reúne julgamento e histórico, e o resultado privado abre em um drawer separado da execução e das fontes. No interno hospedado, o mesmo lugar chamado “Entregas” passa a ser uma fila de autorizações externas. Trocar os rótulos mantém essas quebras.

| Ponto atual | Evidência no produto | Decisão de redesenho |
| --- | --- | --- |
| Primeira Missão + conversa com agente | O Cockpit oferece copiar uma mensagem; o trabalho acontece no agente. Etapas de ativação são mostradas em outra tela. | Uma jornada “Começar trabalho” com passagem clara para a conversa e retorno ao acompanhamento; mostrar só passos observados. Não representar a cópia do texto como trabalho iniciado. |
| Hoje | Junta decisões abertas, outputs, rotinas e convite ao Telegram; a edição hospedada troca tudo por grupos de Sistemas. | Um resumo pessoal invariável: **precisa de você**, **em andamento**, **feito recentemente**. A operação interna ganha um espaço próprio. |
| “Meus trabalhos” | O item de navegação aponta para catálogo de Sistemas, não para trabalhos executados; run e resultado vivem em outras views. | Separar **Trabalhos** (tarefas e histórico reais) de **Novo trabalho** (resultados que se pode pedir). Sistema é o mecanismo disponível, não uma tarefa em si. |
| Entrega e julgamento | O drawer traz output, fonte e julgamento; correção/reexecução está em outra zona e o run aparece em histórico/Canvas. | Uma página de trabalho com entrega, origem, limites, decisão e andamento no mesmo contexto. “Pedir ajuste” precisa mostrar se só registra o pedido ou se haverá nova execução. |
| Ações hospedadas | `renderJudgments()` substitui entregas por `pendingActions` quando `hosted` é verdadeiro; aprovar chama `/api/operator/actions/:id/approve`. | **Para decidir** distingue “revisar conteúdo” de “autorizar ação externa”. Prévia, destino, alcance, reversibilidade e evidência aparecem antes da confirmação. |
| Cérebro, fontes, Canvas, confiança | O usuário atravessa Cérebro, estrutura, fontes, run, contexto e trace para montar a origem de uma resposta. | A origem começa na entrega. **Conhecimento** é um lugar para administrar fontes e lacunas; Canvas e trace são inspeção contextual, não portas principais. |
| Falha e recuperação | O histórico expõe estado/código, mas não oferece continuidade única do trabalho; uma fonte indisponível pode afetar apenas parte do resultado. | Estado do trabalho explica o impacto e oferece a ação possível: abrir fonte, tentar de novo quando permitido, pedir ajuda ou seguir com limites explícitos. Nunca prometer retomada se não houver operação real. |
| Telegram e atualização | Telegram é jornada paralela em navegação principal; atualizações ficam na anatomia. | Canais e atualização ficam em **Configurações** com avisos contextuais quando exigem ação. A tarefa iniciada no Telegram deve aparecer em Trabalhos pelo mesmo identificador, quando houver vínculo real. |
| Interno: filas e políticas | Execução, preview, challenge, revisão e políticas aparecem como instrumentos operacionais em diferentes views. | **Operação** separada da área de trabalho pessoal, com filas por consequência e ações permitidas pelo papel. Não inferir autorização de um simples estado visual. |

## Novo mapa de navegação

- **Hoje:** próximas decisões, trabalhos ativos, entregas recentes e um único caminho para começar.
- **Trabalhos:** lista de tarefas reais. Cada item abre uma página própria com estado, resultado, próximos passos e histórico. “Novo trabalho” abre um catálogo orientado pelo resultado desejado e entrega a execução ao agente ou ao executor autorizado.
- **Para decidir:** fila com dois tipos explícitos: revisar uma entrega e autorizar uma ação externa. Itens locais sem ação externa nunca usam a linguagem de autorização externa.
- **Conhecimento:** fontes registradas, conectadas e efetivamente usadas; lacunas e acesso. Uma fonte só é chamada de “usada” com evidência de acesso.
- **Configurações:** canais, atualizações, acesso e ajuda. Society pode permanecer como destino de descoberta, fora da navegação do trabalho diário.
- **Operação** (somente equipe, quando o papel permitir): fila hospedada, Sistemas ativos/bloqueados, políticas, testes, execuções e diagnósticos. O shell comum e as páginas de trabalhos/entregas continuam iguais.

“Ver como foi feito” pertence a cada trabalho/entrega e abre três camadas: (1) fontes e limites em linguagem simples, (2) eventos e recibos existentes, (3) trace, IDs, contrato, diagnóstico e Canvas. A ausência de qualquer evidência deve aparecer como ausência, nunca como uma história plausível criada pela interface.

## Jornada proposta e estados

1. **Escolher um resultado.** A pessoa descreve sua necessidade ou escolhe uma capacidade. A tela informa onde a execução acontecerá. Abrir catálogo, copiar texto e navegar não iniciam modelo.
2. **Preparar.** Mostra o insumo mínimo, a permissão necessária e o que ficará local. Uma fonte mapeada não é tratada como conectada.
3. **Executar.** Só aparece “em andamento” diante de um run real. Sem recibo de início, o estado é “aguardando você continuar no agente”. Falha indica o que foi ou não produzido.
4. **Revisar entrega.** Resumo da IA, fonte observada, lacuna e opção de abrir o conteúdo privado. Revisar não implica publicação nem escrita externa.
5. **Decidir.** Aprovar, pedir ajuste ou rejeitar registra o efeito preciso; propor ação é outra transição. Se uma reexecução exigir confirmação, deve ser um segundo passo.
6. **Retomar.** O trabalho permanece encontrável pelo seu identificador e mostra o próximo passo após decisão, falha, expiração ou interrupção.

As palavras na UI devem corresponder a estados distintos: `não iniciado`, `aguardando pessoa`, `em execução observada`, `entrega para revisar`, `ajuste solicitado`, `aprovado`, `falhou`, `indisponível` e `ação externa aguardando autorização`. É uma taxonomia de apresentação, não uma proposta de regravar registros. Cada estado inclui a origem que o sustenta, um próximo passo e a indicação de quem pode fazê-lo. Não calcular “progresso” em porcentagem a partir de etapas declaradas quando o sistema não registra avanço real.

## Contrato de dados e limites de implementação

Os endpoints atuais `/api/console`, `/api/runs`, `/api/runs/:receipt/output`, `/api/runs/:receipt/context` e `/api/decisions` fornecem partes do percurso local; o hospedado adiciona `/api/operator/state` e ações confirmadas. Uma projeção de leitura pode unir itens **somente por referências explícitas** (run, receipt, routine, system, source). Não juntar por título parecido, data próxima ou suposição da IA. A UI deve admitir “sem trabalho associado” e “origem não registrada”.

Antes de implementar uma página durável de **Trabalho** compartilhada entre agente, Cockpit e Telegram, especificar e versionar um contrato de leitura para `work_id`, vínculo com run/recibo/entrega/decisão, canal de origem, estado observado e retomada possível. Os registros existentes continuam imutáveis. A migração de dados legados deve produzir agrupamentos apenas quando os vínculos são inequívocos; os demais aparecem como entregas ou execuções avulsas. Nenhum endpoint de leitura deve disparar modelo, reexecução ou ação externa. O comando de iniciar, retomar, aprovar, rejeitar, aplicar política ou escrever fora mantém sua confirmação, autenticação e idempotência existentes.

## Ordem de implementação revisada

1. **Pesquisa e protótipo:** testar [prototype-v2.html](prototype-v2.html) com tarefas reais e participantes leigos; registrar onde perdem o contexto e onde confundem revisão com autorização. Testar edição membro e equipe.
2. **Projeção e contrato:** definir o modelo de leitura de trabalho, estados, vínculos confiáveis, permissões e eventos de canal. Versionar qualquer API nova. Criar fixtures com instalação nova, legado, run órfão, fonte ausente, ação hospedada e papel somente leitura.
3. **Navegação e páginas centrais:** substituir Hoje, catálogo, histórico e drawer de entrega por Hoje, Trabalhos, Novo trabalho e página do Trabalho. Migrar links antigos para o destino equivalente.
4. **Decisão e confiança:** dividir revisão de conteúdo e autorização externa; incorporar evidência, limites, correção, estados de falha e recuperação.
5. **Demais superfícies:** conhecimento, canais/Telegram, atualizações, Canvas contextual e Operação interna. Preservar telas técnicas acessíveis por detalhes/contexto para usuários avançados.

Cada etapa deve funcionar nas duas edições com a mesma gramática. Aceite: uma pessoa encontra o trabalho, explica se o texto é observado ou gerado, entende o que cada decisão altera e recupera uma falha sem interpretar protocolos. Validar com teclado, leitor de tela, contraste, viewport pequeno e movimento reduzido. Ainda não há teste com participantes; protótipo e inspeção de código não substituem essa evidência.
