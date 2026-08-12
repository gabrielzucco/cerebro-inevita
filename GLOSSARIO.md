# Glossário — os termos da casa

> Uma linha por termo. **Termo novo só entra no produto passando por aqui** — se uma skill, página ou aula usa uma palavra que não está nesta lista, ou a palavra entra aqui ou ela sai do texto. Entre colchetes, o termo do Vale que ancora o nosso.

| Termo | O que é |
|---|---|
| **Engenharia de Contexto** | O método: montar o contexto certo pra IA em vez de caçar o prompt perfeito. [context engineering — Karpathy] |
| **Contexto** | Tudo que a IA precisa saber do TEU negócio pra responder como sócio, não como estranho. O modelo é igual pra todo mundo; o contexto é a vantagem. |
| **Cérebro** | O cofre de notas + as skills que o operam. A tua IA equipada com o teu contexto. |
| **Átomo** | Nota de UMA ideia: afirmação + citação literal + por quê + elos. Sem citação não é átomo, é palpite. |
| **Bruto** | O material na íntegra (transcrição, print, texto colado), imutável, na bandeja `capturas/`. Guarda-se tudo; opera-se pouco. |
| **Destilar** | Extrair do bruto só o que tem sinal e virar átomo. [“curate before you compute” — Deasy] |
| **Nível de refino** | Até onde uma fonte foi tratada: 0 ponteiro · 1 legível · 2 indexado · 3 destilado · 4 operacional. Para-se no nível que o trabalho exige (`FONTES.md`). [rate of change — "the only axis that drives this is rate of change"] |
| **Ponteiro** | Nível 0: o cérebro registra ONDE a fonte está, sem copiar nem converter. A maioria das fontes vive (bem) aqui. |
| **Motor vs contexto** | Motor = skills e gabaritos (nossos, atualizam via `/atualizar`). Contexto = tuas notas (nunca tocadas por atualização). [harness — o termo do Vale: "fix your harness, don't reprompt"] |
| **Skill** | Know-how executável: um comando que sabe fazer UMA coisa, com as regras embutidas. [skills — workshop AIEWF] |
| **Sistema** | Pacote de um resultado completo: manifest + pipeline + rotinas + skill + eval + feedback + versão. |
| **Agente** | Executor movido por modelo que usa contexto, skills e ferramentas dentro das permissões; não é a memória nem o Sistema inteiro. |
| **Architect** | A porta de diagnóstico do Cérebro: mapeia a operação, explicita a força das evidências e propõe o primeiro sistema; o dono confirma. |
| **Estado do mapa** | O grau de prova do Architect: V0 declarado · V1 evidência parcial · V2 verificado pelo responsável · V3 validado por execução e resultado. |
| **Pipeline** | Estados pelos quais uma entrada vira uma saída verificável. |
| **Rotina** | Gatilho por evento ou cadência que inicia ou revisa um pipeline. |
| **Conexão** | Interface fina para uma fonte ou ferramenta; não contém o processo inteiro. [MCP/CLI] |
| **Output** | Resultado concreto e verificável produzido por uma execução. |
| **Recibo** | Registro local que liga entrada, output, versão, gates, decisão, falhas e próxima ação de uma execução. |
| **Gate** | Regra objetiva que impede um estado de avançar quando uma condição obrigatória falha. |
| **Sensor** | Sinal real que o Sistema consegue observar para avaliar uma execução ou resultado. |
| **Métrica** | Número ou estado que descreve o resultado observado. |
| **Baseline** | Retrato anterior à mudança: valor, período e fonte usados para comparação. |
| **Setpoint** | Faixa ou condição que define o que é aceitável para aquele resultado. |
| **Eval** | Régua que compara a saída real com o resultado esperado; existe por execução e no cérebro inteiro. |
| **Golden pattern** | Exemplo aprovado por humano que mostra “é assim que bom se parece”. |
| **Golden set** | Conjunto de casos bons, ruins e de limite usado para testar uma mudança. |
| **Feedback** | Correção humana ligada a uma execução e versão, usada para mudar a próxima tentativa. |
| **Experimento** | Mudança controlada dentro de um Sistema, com hipótese, métrica, janela e regra de decisão definidas antes do dado. |
| **Pré-registro** | Contrato do Experimento congelado antes da mudança entrar no ar. |
| **Guardrail** | Limite que protege qualidade, segurança ou custo enquanto a métrica principal é testada. |
| **Emenda** | Registro append-only de uma circunstância posterior ao pré-registro; nunca reescreve o passado. |
| **Run** | Uma execução identificada de um Sistema, ligada à versão, output, eval, decisão e recibo. |
| **System Pack** | Pacote distribuível de um Sistema: motor versionado, configuração local, skill, evals, instrução de instalação e rollback. |
| **Self Improvement** | Loop versionado de feedback → mudança pequena → teste → gate humano → nova medição; nunca autoedição cega. |
| **Primeira vitória (A2)** | Artefato de fonte real, aprovado, que o dono confirma ajudar a decidir ou agir. Instalação é A0; começo é A1. |
| **Contribuição** | Payload anonimizado que o dono prepara, aprova e decide enviar à comunidade em passos separados. |
| **Fios** | Os assuntos quentes em andamento (`fios/`) — o horizonte AGORA do negócio. |
| **Gente** | O eixo pessoa (`gente/`): uma página por cliente/parceiro/concorrente-chave. |
| **Mapa** | O negócio numa página (`mapa.md`) + a métrica principal. Toda resposta estratégica ancora aqui. |
| **Relógios** | As cadências do método: `/daily` (dia), `/reindex` (semana), `/revisar` + `/teste` (mês). |
| **Perguntas-canário** | As 5 perguntas fixas do TEU negócio que medem se o cérebro está aprendendo (`teste-do-cerebro.md`). [evals / golden patterns — os termos do Vale; "canário" é metáfora nossa] |
| **Régua** | A escala do `/teste`: **em branco → estagiário → sócio**. |
| **Frescor** | A validade da nota: `confirmado:` (data da última validação) e `status: superado` (morreu — nada se deleta). É o antídoto do [context rot — "your context rots"]. |
| **Diagnóstico cruzado** | Um resultado possível: o teu negócio × o que o campo já provou, com citação dos dois lados. |
