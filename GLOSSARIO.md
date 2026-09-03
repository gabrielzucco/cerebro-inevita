# Glossário — os termos da casa

> Uma linha por termo. **Termo novo só entra no produto passando por aqui** — se uma skill, página ou aula usa uma palavra que não está nesta lista, ou a palavra entra aqui ou ela sai do texto. Entre colchetes, o termo do Vale que ancora o nosso.

| Termo | O que é |
|---|---|
| **Engenharia de Contexto** | O método: montar o contexto certo pra IA em vez de caçar o prompt perfeito. [context engineering — Karpathy] |
| **Contexto** | Tudo que a IA precisa saber do TEU negócio pra responder como sócio, não como estranho. O modelo é igual pra todo mundo; o contexto é a vantagem. |
| **Cérebro** | A infraestrutura local de contexto: registra Fontes, prepara e destila memória, recupera o recorte necessário, registra recibos e aprende com julgamento humano. Sistemas plugam nessa base. |
| **Cérebro Base** | O metassistema nativo que ativa a pasta: orienta o mapa, registra fontes sem conectá-las, usa uma fonte real e prova que o contexto aprovado volta numa segunda tarefa. Tem contrato interno, mas aparece na superfície Cérebro e não no catálogo de Sistemas de negócio. |
| **Primeira Missão** | Estado transitório da home antes de T4: trabalho real → fonte-semente → primeiro resultado → julgamento → reutilização. Depois da ativação, vira recibo no Cérebro. |
| **Central de Atualizações** | Página permanente em `Cérebro → Atualizações`: separa o estado da instalação, a verificação explícita do motor, os comunicados públicos da INEVITA e os releases de Sistemas. Carregar a central não envia contexto nem telemetria. |
| **Ativação** | O gate `usar → reutilizar`: uma fonte real gera output aprovado e o contexto salvo volta numa segunda tarefa sem releitura do bruto nem reexplicação. T0→T4 mede este ciclo; instalação sozinha não basta. |
| **Átomo** | Nota de UMA ideia: afirmação + citação literal + por quê + elos. Sem citação não é átomo, é palpite. |
| **Bruto** | O material na íntegra (transcrição, print, texto colado), imutável, na bandeja `capturas/`. Guarda-se tudo; opera-se pouco. |
| **Destilar** | Extrair do bruto só o que tem sinal e virar átomo. [“curate before you compute” — Deasy] |
| **Nível de refino** | Até onde uma fonte foi tratada: 0 ponteiro · 1 legível · 2 indexado · 3 destilado · 4 operacional. Para-se no nível que o trabalho exige (`FONTES.md`). [rate of change — "the only axis that drives this is rate of change"] |
| **Ponteiro** | Nível 0: o cérebro registra ONDE a fonte está, sem copiar nem converter. A maioria das fontes vive (bem) aqui. |
| **Motor vs contexto** | Motor = skills e gabaritos (nossos, atualizam via `/atualizar`). Contexto = tuas notas (nunca tocadas por atualização). [harness — o termo do Vale: "fix your harness, don't reprompt"] |
| **Skill** | Know-how executável: um comando que sabe fazer UMA coisa, com as regras embutidas. [skills — workshop AIEWF] |
| **Capability** | Contrato portátil do que uma skill sabe fazer: entradas por papel, output, permissões, autoridade humana e evals; ganha contexto privado só quando compõe um Sistema. |
| **Sistema** | Pacote de um resultado de negócio: manifest + pipeline + rotinas + skill + eval + feedback + versão. Pede ao Cérebro o contexto necessário; acesso direto à Fonte é exceção declarada em contrato e recibo. |
| **System Contract** | Envelope legível por máquina que liga resultado, Capability, entidades, fontes, pipeline, permissões, eval e aprendizado sem carregar conteúdo privado. |
| **Source Contract** | Contrato reference-only de uma Fonte: casa da verdade, autoridade, escopo, sensibilidade, modos, frescor, retenção, conector, consumidores e garantia real. Nunca contém credencial ou bruto. |
| **Retrieval Contract** | Bloco do System Contract V2 que decide quais papéis de Fonte consultar, em que ordem, com quais filtros, janela, frescor, fallback, parada, orçamento e exigência de proveniência. |
| **CONFIGURAÇÃO** | Contexto compilado para um uso ou Sistema: estado, evidência, regras, exemplos, permissões, output e eval. Aponta para o bruto; não o copia. [Context Pack] |
| **Control plane** | Camada local que registra contratos, versões, permissões, runs e aprendizado de Sistemas diferentes pelo mesmo protocolo. |
| **Agente** | Executor movido por modelo que usa contexto, skills e ferramentas dentro das permissões; não é a memória nem o Sistema inteiro. |
| **Architect** | A porta de diagnóstico do Cérebro: mapeia a operação, explicita a força das evidências e propõe o primeiro sistema; o dono confirma. |
| **Sistematização** | O comissionamento que transforma trabalho recorrente observado em Sistema proprietário local: resultado, contrato, CONFIGURAÇÃO, pipeline, régua e primeiro run manual; não pressupõe conexão nem validação. |
| **Estado do mapa** | O grau de prova do Architect: V0 declarado · V1 evidência parcial · V2 verificado pelo responsável · V3 validado por execução e resultado. |
| **Mapa da empresa** | Vista de controle que começa ampla e rasa no declarado e ganha recortes observados por uso; registra entidades, fontes, relações, decisões, lacunas e estado de evidência sem exigir ingestão total. |
| **Pipeline** | Estados pelos quais uma entrada vira uma saída verificável. |
| **Rotina** | Objeto operacional que dispara um Sistema: declara quando, em qual host/workspace, com qual executor/modelo, usando quais grants e prompt por referência, entregando onde e sob quais políticas de timeout, retry, idempotência e concorrência. Não redefine o resultado do Sistema. |
| **Routine Contract** | Envelope compartilhável e sem conteúdo da Rotina. Agenda, placement, referências de contexto, destino e política são canônicos; sessão autenticada e estado de execução não circulam. |
| **Executor Binding** | Binding privado entre uma Rotina e um cliente oficial local do modelo, já autenticado pelo dono. Registra compatibilidade observada, nunca OAuth, token ou API key. |
| **Routine Run Receipt** | Recibo privado e reference-only de uma tentativa da Rotina: slot, executor solicitado, tempos, status, reason code e referências de acesso/input/output, sem prompt, output ou erro cru. |
| **Conexão** | Interface fina para uma fonte ou ferramenta; não contém o processo inteiro. [MCP/CLI] |
| **Output** | Resultado concreto e verificável produzido por uma execução. |
| **Recibo** | Registro local que liga entrada, output, versão, gates, decisão, falhas e próxima ação de uma execução. |
| **Run Record** | Recibo estruturado de um Run: IDs e referências de entidade, fonte, output, eval, decisão e correção, nunca o conteúdo bruto. |
| **Context Snapshot** | Bloco reference-only do Run Record V2 que registra a versão da recuperação, Fontes e fragmentos selecionados, consulta, filtros, janela, frescor, lacunas, fallbacks, conflitos e garantia aplicada. |
| **Access Grant** | Concessão local, aprovada por humano, que autoriza um sujeito a usar Fontes e ações por escopo e prazo; declara se o acesso é bloqueado pelo runtime, apenas auditado por recibo ou já exportado. Não é o grant de download da Society. |
| **Access Receipt** | Recibo local e reference-only de acesso permitido, negado, falho, revogado ou degradado; registra a garantia aplicada sem carregar credencial, conteúdo ou resultado privado. |
| **Entidade** | Objeto canônico que atravessa Sistemas, como lead, cliente, oferta ou experimento; usa ID opaco para costurar a jornada sem duplicar o dado. |
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
