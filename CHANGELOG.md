# Mudanças do cérebro INEVITA

## v1.30.0 — 2026-08-23 · “as rotinas ganharam mesa de controle local”

- **Primeira superfície do Console:** servidor stdlib em `127.0.0.1` compila Áreas, Sistemas,
  Fontes, Rotinas, concessões, saúde e recibos direto dos contratos canônicos. Não existe banco ou
  índice editorial paralelo; abrir a página não executa modelo.
- **Controle explícito da assinatura:** `Rodar agora` chama Codex ou Claude somente depois de
  confirmação; ativar, pausar e retomar também exigem sessão local, CSRF e autoridade humana.
  Prompt, output e erro cru não aparecem na API nem nos recibos.
- **Coleta antes da interpretação:** Collector Binding privado roda um comando determinístico
  confiável por argv fechado, exige snapshot fresco e só então chama o modelo. Falha ou timeout na
  coleta bloqueia a assinatura; stdout e credenciais não entram no recibo.
- **Migração sem relógio duplo:** Routine Migration Readback V1 registra a agenda legada e bloqueia
  ativação/retomada com `legacy-schedule-not-paused` até o dono comprovar a pausa no fornecedor
  anterior. O Console nunca finge pausar uma agenda externa que não controla.
- **Cofre legado, um só Cérebro:** bootstrap explícito adiciona apenas marcador/layout e exclusões
  locais para contratos/runtime privados. Não cria segunda pasta, não move Fonte e não transforma o
  cofre interno num starter novo.
- **Plural desde o primeiro frame:** o fixture sanitizado prova duas Áreas, dois Sistemas, três
  Fontes e duas Rotinas; uma Fonte local permanece `receipt-audited`, sem teatro de
  `runtime-enforced`.
- **Harness sem consumo real:** E2E HTTP prova sessão, CSRF, read-only on open, replay fake, bloqueio
  de cutover, readback da pausa e ativação posterior. Nenhum teste chama a assinatura do dono.

## v1.29.0 — 2026-08-23 · “rotina virou objeto governado do Cérebro”

- **Sistema ≠ Rotina:** Routine Contract V1 declara gatilho, placement, executor/modelo, contexto,
  grants, destino, timeout, retry, idempotência e concorrência sem duplicar o resultado do Sistema.
- **A assinatura continua com o dono:** adapters fechados chamam `codex exec` ou `claude -p` já
  autenticados na máquina. OAuth e API key nunca são copiados; o prompt entra por `stdin`, não nos
  argumentos do processo.
- **Binding e estado privados:** Executor Binding, agenda ativa/pausada, outputs e recibos vivem em
  `.cerebro/runtime/`, fora do Git. Contrato compartilhável não leva caminho absoluto, sessão ou
  conteúdo privado.
- **Run manual antes do automático:** uma rotina agendada só ativa com recibo concluído da mesma
  versão e aprovação humana. `tick` respeita timezone, execução perdida, pausa, concorrência e slot
  idempotente; repetir o mesmo slot não chama o modelo de novo.
- **Routine Run Receipt V1:** sucesso, retry, timeout, cliente/binding ausente e autenticação
  requerida deixam recibo reference-only; prompt, output, erro cru e conteúdo enviado ao provider
  não entram nele nem vão para a INEVITA.
- **Garantia sem teatro:** acesso local `receipt-audited` continua auditável; um grant
  `runtime-enforced` sem conector dedicado é negado em vez de entregar credencial ao modelo.
- **Harness sem gastar assinatura:** o E2E injeta processos fake para Codex e Claude e prova
  `rodar agora → concluir → ativar → due → pausar`, retry, timeout e idempotência. Console e daemon
  do sistema operacional continuam fora desta entrega.

## v1.28.0 — 2026-08-23 · “permissão agora bloqueia de verdade quando tem custódia”

- **Runtime local mínimo, sem inventar Console:** engine + CLI aplicam Access Grant antes do
  conector. Servidor e interface continuam como próxima camada; file-only permanece operacional.
- **Segredo fica no sistema operacional:** Keychain no macOS, Secret Service no Linux e DPAPI no
  Windows. A CLI nunca aceita segredo em argumento; contratos e recibos guardam só referência
  namespaced.
- **Allow, deny e revoke executáveis:** escopo, sujeito, ação, modo, prazo e revogação são gates
  reais. Acesso negado ou revogado não chama o conector; revogar é idempotente e não apaga uma
  credencial possivelmente compartilhada.
- **Access Receipt V1:** cada checagem deixa recibo privado e reference-only, distinguindo
  credencial presente, ausente ou não consultada. A revogação representa o grant inteiro, sem
  fingir que inspecionou uma Fonte específica.
- **Barreira de exfiltração:** resultado que tente devolver a própria credencial é descartado e
  registrado como falha sanitizada; erro cru, payload e segredo nunca entram no recibo.
- **Degradação honesta:** provider indisponível nega `runtime-enforced`; acesso direto auditável e
  export declaram file-only sem prometer ACL preventiva ou revogação retroativa.
- **Harness cross-platform:** prova allow/deny/falha/revoke, namespaces, armazenamento via stdin,
  ausência de plaintext no sandbox e compatibilidade do starter/protocolo.

## v1.27.0 — 2026-08-23 · “o contexto usado agora deixa contrato e recibo”

- **Source Contract V1:** cada Fonte pode declarar casa da verdade, autoridade, escopo,
  sensibilidade, PII, modos, frescor, retenção, revogação, conector, consumidores e garantia sem
  carregar credencial ou bruto.
- **Retrieval Contract no System Contract V2:** papel, prioridade, seleção, filtros, janela,
  frescor, conflito, fallback, parada, orçamento e proveniência deixam de ser convenção implícita.
- **Context Snapshot no Run Record V2:** cada execução governada registra exatamente quais Fontes e
  fragmentos sustentaram o output, com query, janela, frescor, lacunas, fallback, conflito e nível
  de garantia — sempre por referência.
- **Access Grant V1:** sujeito, escopo, ação, prazo, aprovador, custódia e recibos separam bloqueio
  real do runtime, acesso direto apenas auditável e export irreversível. O nome não se mistura com
  o grant de download da Society.
- **Compatibilidade sem reescrita:** os schemas V1 permanecem byte a byte intactos e travados por
  hash; leitores aceitam V1/V2 e mostram `retrieval-not-declared` / `context-not-recorded` em vez
  de inventar governança ausente. O runner antigo recusa V2 se não puder gerar Context Snapshot.
- **Migração aditiva de Fontes:** preview mostra antes/depois e rollback; `--confirm` cria Source
  Contracts privados, sem abrir/copiar/alterar a Fonte nem reescrever o registro legado.
- **A porta `/fonte` conhece o protocolo novo:** registro continua sendo ponteiro read-only; com
  Node, a skill mostra o diff e pede readback antes de criar o Source Contract. Sem Node, o
  primeiro valor continua file-only e sem pedágio.
- **Harness nos dois sentidos:** exemplos bons passam; segredo, bruto, campo desconhecido, grant
  sem aprovador, custódia incompatível, retrieval sem fallback/parada e snapshot sem proveniência
  reprovam. A suíte antiga, o starter EN e os dois atualizadores continuam verdes.

## v1.26.0 — 2026-08-21 · “o gate parou de confiar em quem ele avalia”

- **O gate determinístico do Calls em Decisões virou código executável**
  (`node scripts/eval-calls.mjs <fonte> <garimpo>`): citação literal contra a fonte
  (paráfrase reprova; o escape honesto “(não consta na fonte)” isenta), timestamp
  obrigatório quando a fonte tem minutagem, PII barrada no garimpo, compromisso sem dono
  reprovado. Antes, a checklist era prosa auditada pelo próprio agente que ela deveria
  auditar.
- **O harness se testa nos dois sentidos:** 5 fixtures sintéticas exigem que os gates
  aprovem o garimpo honesto E reprovem o slop (paráfrase, PII vazada, ação sem dono).
  Checker que só sabe aprovar é teatro. Roda no CI a cada push e PR.
- **A skill `call` roda o gate antes da régua humana:** o que chega no “você usaria?”
  já passou pela régua que não mente. Sem scripts no ambiente, a checklist manual vale —
  mas não se chama de verificada.
- **O que fica fora do código, por desenho:** “número ambíguo confirmado” e “gravou sem
  aprovação” exigem julgamento — só entram com juiz calibrado contra rótulo humano
  (concordância medida antes de delegar), nunca com o executor se autoavaliando.

## v1.25.0 — 2026-08-21 · “infraestrutura à altura do open source”

- **A atualização vem de RELEASE, não do último commit.** Os dois atualizadores passam a
  resolver a última release publicada e só caem no branch se não houver release ou rede.
  Antes, um commit ruim no `main` chegava instantaneamente em todo cérebro que atualizasse.
- **Atualizador multiplataforma:** `node scripts/update.mjs` roda em macOS, Linux e Windows
  sem WSL — o `update.sh` dependia de bash, curl e tar, que não existem no Windows onde os
  agentes rodam. Zero dependência mantida: o leitor de tar é stdlib pura, com trava contra
  path traversal. O bash legado continua funcionando para cérebros antigos.
- **O contrato de segurança agora é cobrado dos DOIS atualizadores** no mesmo teste: 10
  sentinelas do dono preservadas, seeds instalados, motor atualizado. Um passar e o outro
  não seria regressão silenciosa em quem já tem o produto instalado.
- **CI de verdade:** os 11 testes + o validador de protocolo rodam em push e PR, o
  desligamento de telemetria é verificado, e a sintaxe do motor é checada em Windows.
  Antes os testes existiam e nada os executava.
- **Telemetria redirecionável:** `CEREBRO_API_URL` aponta o ping para outro endpoint — quem
  forka o motor não pinga na telemetria da INEVITA.
- **Requisito declarado:** Node.js 20+, stdlib apenas, sem `npm install`.

## v1.24.1 — 2026-08-21 · “open source de verdade”

- **Licença dupla:** o motor (scripts, skills, protocolo, templates) agora é MIT; o conteúdo
  (acervo, método escrito, glossário) é CC BY-NC 4.0. Antes o repositório era público sem
  licença nenhuma — ou seja, juridicamente fechado: ninguém podia usar nem compartilhar.
  O que tu escreves dentro do teu Cérebro segue sendo teu, integralmente.
- **README:** o repositório ganhou porta de entrada para quem chega de fora — o que é em uma
  frase, o momento genérico × com contexto, instalação em dois minutos nos quatro agentes,
  e o mapa do que vem dentro. Até aqui, quem abria o link via uma lista de 37 arquivos.
- **Telemetria declarada, sem letra miúda:** o que sai (evento técnico, versão, SO — e
  e-mail/member-id para quem instala pelo funil INEVITA), o que nunca sai (teu conteúdo),
  o código aberto do ping e o desligamento em uma linha.
- **CONTRIBUTING + Discussions:** motor recebe PR; conteúdo é curadoria com casa própria
  para contribuição da comunidade; bugs com diagnóstico pronto.

## v1.24.0 — 2026-08-19 · “trabalho real vira Sistema”

- **Elo executável entre Architect e operação:** `/sistematizar` transforma um resultado
  confirmado e uma execução observada em Sistema proprietário local, sem repetir o onboarding.
- **Comissionamento evidence-first:** o scaffold valida T4, caso real, contrato, PII, caminhos e
  aprovação antes de criar as dez superfícies do pacote e registrá-lo no control plane.
- **Registrar ainda não é conectar:** o Sistema nasce `configuring`, com fontes por papel e casa de
  verdade, zero conexões, rotina manual e nenhuma ação externa.
- **Primeiro run honesto:** `/operar` liga entidade, fonte, output, eval, decisão e outcome. Um run
  aprovado ativa o Sistema, mas primeira vitória continua exigindo confirmação humana explícita.
- **Aprendizado sem cristalizar acaso:** skill especializada, conexão ou rotina automática só vira
  candidata depois de três runs comparáveis, replay e aprovação humana.
- **Primeira prova ponta a ponta:** o exemplo de Jornada operacional costura aquisição, venda,
  onboarding, entrega e atendimento por evidência, sem fingir que o pacote já serve para qualquer
  empresa.

## v1.23.0 — 2026-08-19 · “usar antes de sistematizar”

- **Cérebro Base é o primeiro metassistema:** instalar a pasta não basta. A ativação fecha quando
  uma fonte real vira contexto aprovado e uma segunda tarefa reutiliza esse contexto sem reler o
  bruto nem pedir que o founder explique a empresa de novo.
- **Mapa em duas resoluções:** orientação ampla e rasa nasce antes da leitura; apenas o recorte de
  trabalho escolhido fica estreito e profundo por evidência. Um recorte nunca se fantasia de mapa
  completo da empresa.
- **Registrar não é conectar:** fontes podem ter ponteiro, papel, autoridade e estado de acesso sem
  ingestão, índice ou sincronização. Conexões entram depois que o uso prova qual fonte importa.
- **Uma entrada por resultado ou por rastro:** as duas rotas convergem em CONFIGURAÇÃO, output útil,
  gate humano e reutilização. O primeiro Sistema de negócio só é escolhido depois de T4.
- **Réguas separadas:** V0→V3 mede evidência; T0→T4 mede ativação do Cérebro Base. T4 não promove o
  mapa para V3 nem valida resultado de negócio.
- **Identidade estável do metassistema:** todo Activation Contract usa `cerebro-base`, capability
  `ativar-recorte-operacional` e output `cerebro-base-ativado`; o caso de uso muda o pipeline, não a
  identidade do cérebro.
- **Starter internacional alinhado:** layout v3, Activation Brief, CONFIGURATION, Activation
  Contract e Run Records operam localmente em Manus, Codex, Claude ou Gemini sem depender do corpus
  privado em português.

## v1.22.0 — 2026-08-18 · “Sistemas diferentes; protocolo comum”

- **Control plane local:** Capability, System Contract e Run Record ganharam schemas versionados.
  Sistemas continuam diferentes por dentro, mas declaram resultado, IDs, fontes, permissões, eval,
  decisão e versão no mesmo envelope.
- **Dado canônico fora do Sistema:** entidades opacas atravessam vendas, conteúdo, produto ou
  operação sem cada Sistema copiar lead, cliente, oferta ou experimento. `entity.mjs journey`
  reconstrói a jornada local pelo ledger.
- **Run ledger sem conteúdo:** cada início e conclusão registra referências de entidade, fonte,
  output, eval, decisão, correção e outcome; bruto, output e texto da correção não entram no JSONL e
  não são enviados à INEVITA.
- **Capability portátil:** System Packs podem carregar `capability.json`; o instalador liga a
  capacidade compartilhada ao estado local sem tocar configuração, fontes ou feedback do founder.
- **Aprendizado supervisionado:** uma correção nasce candidata. Promoção exige três ocorrências
  comparáveis, três replays, aprovação humana, versão maior e rollback; o motor nunca se autoedita.
- **Duas entradas, uma convergência:** `/comecar` segue result-first quando o trabalho está claro e
  usa observação de um rastro real quando não está. As duas rotas terminam no primeiro Sistema
  verificado; “conecte tudo” não é onboarding.
- **Starter EN no mesmo protocolo:** a pasta mínima continua sem Node obrigatório e agora produz os
  seis artefatos humanos mais System Contract e Run Record compatíveis com o produto completo.

## v1.21.0 — 2026-08-17 · “a pasta é o cérebro; a IA é o operador”

- **Ativação local evidence-first:** `/comecar` deixa e-mail e pergunta genérica para depois do
  valor e parte de uma operação real com a menor amostra de evidência disponível.
- **Seis objetos persistidos:** mapa atual, registro de fontes, primeiro System Brief, Context Pack,
  output útil e recibo sanitizado formam o primeiro estado durável do cérebro.
- **Bruto ≠ contexto pronto:** evidência crua fica para prova e reprocessamento; cada Sistema recebe
  um Context Pack estreito com regras, permissões, forma de saída e eval.
- **Uma skill, dois layouts:** `company-brain-sprint` lê `.cerebro/layout.json` e opera tanto o
  produto completo em português quanto o starter internacional sem duplicar o método.
- **Starter EN gerado do repositório canônico:** pasta local mínima e portável entre Manus Desktop,
  Codex, Claude e Gemini, sem corpus pago, vínculo ou dados de outro founder.
- **Ordem explícita:** primeiro run manual e human gate; rotina quando o trabalho se repete; conexão
  de leitura quando a fonte prova valor; escrita/automação só depois da régua.

## v1.20.0 — 2026-08-12 · “o método vira Sistema e o Sistema aprende por Experimentos”

- **Método de Sistemas completo e público:** separa Cérebro, Sistema, pipeline, rotina, skill,
  conexão, gate, agente, eval e feedback; ensina o contrato das oito unidades, fronteiras de dados,
  régua, recibo, maturidade e Self Improvement supervisionado.
- **Método de Experimentos executável:** gargalo com evidência → hipótese → pré-registro congelado
  → coleta diária → leitura na data → decisão humana → mudança versionada na próxima execução. A
  leitura preserva limites e não transforma entrega mínima em significância estatística.
- **Templates copiáveis:** pacote de Sistema com manifest, configuração privada, pipeline, rotinas,
  contrato da skill, evals, feedback e changelog; Experimento com região compatível com
  `system-experiment.mjs`.
- **Telemetria explicada sem eufemismo:** os métodos e o onboarding listam identificadores e eventos
  técnicos possíveis, reafirmam que conteúdo não viaja e mostram os dois mecanismos de opt-out.
- **Fronteira da Society preservada:** o aberto entrega arquitetura e templates; System Packs,
  julgamento de operadores, golden patterns, laboratórios, casos e releases validados continuam
  sendo capacidade da rede.

## v1.19.0 — 2026-08-12 · “o Architect revela onde construir primeiro”

- **Skill `/arquiteto` no Cérebro aberto:** depois que o contexto prova que consegue voltar a
  trabalhar, o agente pode mapear uma operação e propor o primeiro sistema. Invocação direta
  continua permitida; o onboarding não virou pedágio nem menu de catorze comandos.
- **Uma régua visível de prova:** V0 declarado → V1 evidência parcial → V2 verificado pelo
  responsável → V3 validado por execução e resultado. O engine bloqueia promoção de estado sem a
  evidência correspondente.
- **Ranking explicável e supervisionado:** no máximo três oportunidades, prioridade ordinal,
  `reason_codes` e explicação. Sem score inventado; mapa e ordem continuam proposta até o gate
  humano.
- **Visual `spec → engine`:** `architect-spec.json` é a fonte canônica e o renderer determinístico
  usa a identidade/validação de colisões de `frameworks-visuais`. HTML ou desenho livre do modelo
  não fazem parte do pipeline.
- **Privacidade e atualização:** specs e mapas ficam em `operacao/arquitetura/`, fora do Git e sem
  envio de conteúdo. A telemetria registra apenas que um mapa foi gerado e seu estado V0–V3.
- **Fronteira honesta:** o aberto diagnostica e recomenda; Society concentra acervo, System Packs,
  laboratórios, releases e instalação assistida. A v1.19 corrige também o manifesto para que a
  skill `/society` da v1.18 chegue a instalações antigas.

## v1.18.0 — 2026-08-10 · “o acervo da Society desce pra dentro do teu Cérebro”

- **Skill `/society` nova:** membro pagante da INEVITA Society sincroniza o acervo
  exclusivo direto pra dentro da instalação (`comunidade/society/`, fora do Git da tua
  cópia). O servidor decide o acesso; a skill pergunta, baixa e conecta o material ao
  trabalho em andamento. Sem assinatura, avisa uma vez — sem tom de venda — e segue.
- **Primeiro drop do acervo:** o Protocolo de Experimentos da casa (com um caso real
  anatomizado e template pronto) e a Arquitetura do Cérebro da Empresa (o desenho de
  dados que a nossa operação vive: banco × vault, PII, IDs como costura).
- **Privacidade e segurança:** conteúdo pago nunca entra no repositório público; desce
  por URL assinada, só pra instalação com vínculo forte de membro. `comunidade/society/`
  está no `.gitignore` — acervo não vaza pro Git da tua cópia.
- Ambiente sem Node (ex.: Antigravity): a skill avisa e segue — acervo nunca vira
  pedágio do trabalho.

## v1.17.1 — 2026-08-10 · “o acesso tem dono — uma pergunta vincula você à comunidade”

- **`/comecar` agora vincula o acesso na primeira conversa:** se a instalação ainda não
  tem identificação (`.cerebro/member-id` ou `.cerebro/acesso-email`), a primeira
  interação pergunta **qual e-mail você usou pra pegar o Cérebro** — uma pergunta só,
  e o trabalho segue na mesma resposta. Vale também pra instalação antiga que nunca se
  identificou: a próxima sessão pergunta.
- **Por quê:** é o e-mail que liga tua instalação às atualizações semanais e à
  comunidade. Sem ele, tua cópia é anônima — ninguém consegue te entregar o que o teu
  uso pede.
- **Privacidade intacta:** o e-mail fica em `.cerebro/` (fora do Git da tua cópia),
  viaja só no ping de telemetria e nunca entra em nota, contexto ou arquivo do negócio.
  Quem preferir não informar, segue funcionando igual — sem insistência.

## v1.17.0 — 2026-08-06 · “o protótipo — contexto de quê, pra ganhar o quê”

- **Skill `/prototipar` nova:** o cérebro instalado sabe guardar contexto; esta skill
  responde a pergunta seguinte — *contexto de quê, pra ganhar o quê, medido como*. Uma
  rodada de ~20 min, quatro saídas: **protótipo comercial** (quem compra, o funil real,
  onde morre, os quatro artefatos, as objeções) · **protótipo de entrega** (entregáveis,
  etapas com dono e gate, a régua de "bom", o gargalo) · **diagnóstico da frente**
  (decisão · venda · entrega — uma só, nunca as três empatadas) · **o loop**.
  Ancorada no Dia 1 da Imersão: *"a primeira fonte precisa encostar ou numa decisão, ou
  numa venda, ou numa entrega"*.
- **Lei zero da skill:** ela não inventa oferta, funil, preço, etapa, entregável ou
  objeção. O que a pessoa não disse sai como `(não consta — você preenche)`.
  **Protótipo com 8 lacunas honestas vale mais que protótipo cheio de palpite** — as
  lacunas são o mapa do que capturar primeiro.
- **Não precisa de fonte pra rodar.** São 5 perguntas em linguagem comum; fonte real é
  atalho opcional que se soma às respostas. É a porta de entrada pra quem instalou e
  perguntou "e agora, como isso vira dinheiro?".
- **`meu-negocio/entrega.md` deixa de ser órfã:** era o único gabarito que apontava pra
  uma skill inexistente. Agora a skill existe e preenche.
- **Portabilidade real, as quatro plataformas:** `/prototipar` entrou no `CLAUDE.md` — o
  contrato canônico que `AGENTS.md` e `GEMINI.md` mandam ler por inteiro —, ganhou
  adaptador `agents/openai.yaml` e está sincronizada em `.agents/skills/`. Roda em Claude
  Code, Codex, Gemini CLI e Antigravity.
- **`PROTOTIPAR-PORTATIL.md` novo:** o quinto alvo — plataformas **sem** acesso à pasta
  (ChatGPT, Claude web, qualquer caixa de texto). Arquivo único, autocontido, sem
  caminho nenhum; as quatro saídas voltam em markdown pra pessoa salvar.
- **Telemetria fora da abertura:** a skill nasceu com `ping.mjs` no topo, o padrão que a
  story de 25/07 já tinha removido do `/comecar` — no Antigravity o agente saía caçando
  Node e a instalação parecia travada. Agora o ping é condicional e posterior à entrega.

## v1.16.0 — 2026-08-06 · “a régua de refino — quanto tratar deixa de ser dúvida”

- **`FONTES.md` novo:** a régua de tratamento de fontes. Os 5 níveis de refino
  (0 ponteiro · 1 legível · 2 indexado · 3 destilado · 4 operacional), a pergunta
  única que decide (*"que trabalho real vai sair disso?"*), o caminho de 5 etapas
  que toda fonte percorre e a tabela por formato (reunião, e-mail, PDF, planilha/CRM,
  drive, WhatsApp, print, link). Ancorada no campo: curar 7.000→1.000 blocos subiu a
  precisão de 57%→82%; 30% de arquivo velho ocupa até 80% do contexto com lixo.
  **Parar no ponteiro é saída legítima** — não se padroniza o formato de entrada,
  padroniza-se o caminho.
- **Skill `/fonte` nova:** o executável da régua. Aponte qualquer coisa
  ("o que eu faço com isso?", "ingere o que tá em capturas/") e ela recomenda o
  nível, executa até ele e PARA. Fontes que se repetem ganham oferta de rotina.
- **`meu-negocio/fontes/` deixa de ser órfã:** ganhou formato de nota de fonte
  (vista humana) casado com `conexoes/configuradas/fontes.json` (vista da máquina).
- **"Ingere o que tá em capturas/" agora existe de verdade** — a promessa do
  `capturas/_LEIA.md` roteia pra `/fonte`.
- Glossário: entram **Nível de refino** e **Ponteiro**. `METODO.md` ganha a seção
  "E QUANTO tratar?"; `/guardar` aponta pra régua quando a dúvida é de tratamento.

## v1.15.0 — 2026-08-06 · “a imersão entra pro acervo”

- **Nova coleção `conhecimento/imersao/`:** a aula do **Dia 1 da Imersão Cérebro da
  Empresa** (05/08, turma fundadora) transcrita na íntegra — 2h28, timestamps batendo
  com o vídeo da aula (que circula no grupo da turma). A tese (execução commodity,
  contexto × discernimento × execução), a instalação ao vivo e a primeira carga de
  fontes reais virando átomos, com as dúvidas da turma respondidas.
- O Dia 2 entra na mesma coleção após a aula de 06/08.

## v1.14.0 — 2026-08-04 · “o método ganha o segundo andar”

- **MÉTODO COMPLETO v2.0:** o documento que virou material de boas-vindas espontâneo na
  comunidade foi atualizado — a v1.0 (09/07) parou no método individual e a casa já operava
  a camada seguinte. A v2 acrescenta a **PARTE 7 · OS SISTEMAS (quando o ciclo vira máquina)**:
  o que é um sistema (resultado + pipeline + configuração + régua + feedback), um sistema real
  contado pela própria operação, o experimento com régua selada antes do dado, o recibo de
  execução e o humano no gate.
- **Lei 11 no contrato:** “Critério vem antes do dado” — experimento sem régua pré-registrada
  é opinião com gráfico.
- **Parte 8 atualizada:** os “próximos cadernos” viraram sistemas instaláveis; o primeiro
  (geração de demanda) já roda em laboratório com empresas da comunidade.
- **A voz do fundador entrou no texto:** o estalo no evento do Vale (abertura), o
  antes-e-depois de 48h da operação de tráfego (Parte 3) e o placar do primeiro Teste do
  Cérebro da casa, rodado em 04/08 (Parte 6) — a v1 tinha saído sem nenhuma primeira pessoa.

## v1.13.0 — 2026-08-03 · “o motor aprende a receber sistemas entregues em mãos”

- **Pacote fora do catálogo:** um sistema pode ser entregue no comissionamento (pilotos de
  laboratório) em vez de distribuído a todos — o instalador aceita qualquer pacote presente em
  `sistemas-disponiveis/`, e pacote gated pode carregar a própria skill, instalada nos dois
  runtimes junto com o sistema.
- **Experimento com pré-registro de verdade:** pacotes podem declarar `experimento.template.md`
  — arquivo próprio, append-only, instalado como `experimento.md` e protegido do Git como
  configuração e feedback, inclusive em instalações antigas via atualizador.
- **Instalador honesto para qualquer pacote:** a entrada de catálogo usa o nome do manifest
  (antes hardcodava “Briefing Comercial Inteligente”) e templates novos instalam sem quebrar
  pacotes antigos.
- **Regressão dinâmica:** o teste de instalação roda o ciclo completo em todo pacote presente na
  árvore e bloqueia release se configuração, feedback, experimento ou skill forem tratados
  errado; a validação do produto exige estrutura completa de qualquer pacote dropado.
- **Versão mínima enforçada:** o instalador compara `minimum_brain_version` com o VERSION do
  destino ANTES de copiar e recusa cérebro incompatível — a declaração deixou de ser decorativa.
- **Instalação volta a se reportar — sem trair "a pessoa vem antes da telemetria":** a v1.12.3
  removeu o único ping incondicional do onboarding e, como `instalou` sempre foi efeito
  colateral do PRIMEIRO ping, instalação nova ficou invisível de 26/07 em diante (apagão
  descoberto no dogfood de 03/08). O ping agora dispara **depois** da primeira entrega útil na
  skill de começo — nunca na abertura — numa única tentativa silenciosa: sem Node, pula sem
  procurar runtime, sem PATH e sem diagnóstico. Antigravity segue destravado; a abertura segue
  limpa; o gate anti-regressão da v1.12.3 segue passando.
- **Costura de identidade no comissionamento:** `install-system.mjs --member-id=<uuid>` grava o
  member-id do participante em `.cerebro/member-id`. Pacote de acesso restrito
  (`access_mode: approved_participants`) recusa instalação sem member-id — sem costura não há
  como contar cérebros distintos nem atribuir telemetria. Instalação já atribuída NUNCA é
  reatribuída a outro member-id: o instalador falha e exige base limpa.
- **First value é confirmação, não efeito colateral:** run aprovado ativa o sistema, mas
  `first_value_confirmed` só existe via `system-run.mjs <sistema> confirm-value`, depois que o
  responsável confirma uso real; `system_value_confirmed` só dispara aí.
- **Recibo E0–E7 opt-in por pacote:** sistema que declara `recibo-evals.template.md` não fecha
  `eval=pass` sem `--receipt=<recibo preenchido>` — "passou" deixa de ser declaração solta.
- **Pré-registro selado por hash e POR EXPERIMENTO:** `system-experiment.mjs freeze/verify` sela
  a região imutável (`### Pré-registro` → `### Emendas`) com lock por `experiment-id` — estado
  operacional fica fora do hash, EXP-002 congela sem conflitar com EXP-001, template vazio é
  recusado, e edição retroativa de critério é denunciada.
- **Recibo E0–E7 validado por conteúdo:** não basta existir — o `complete` exige recibo em
  `operacao/execucoes/`, referenciando o run atual, com E0–E7 presentes, zero placeholders do
  template, E5 explicitamente aprovado e decisão coerente com o comando.

## v1.12.3 — 2026-07-25 · “a pessoa vem antes da telemetria”
- **Antigravity sem tela travada:** nenhum agente executa ping ao abrir a sessão; a primeira resposta
  útil vem antes de qualquer helper técnico.
- **Modo sem scripts:** a ativação no Antigravity continua por leitura e escrita de arquivos mesmo
  quando Node não está disponível no ambiente.
- **Sem caça ao runtime:** telemetria opcional nunca autoriza `which node`, alteração de `PATH`,
  instalação de dependência, diagnóstico ou repetição.
- **Regressão bloqueada:** o gate do produto falha se o ping voltar a ser obrigatório na abertura
  ou se a skill perder o fallback.

## v1.12.2 — 2026-07-24 · “proteção privada já no primeiro upgrade”
- **Compatibilidade retroativa real:** quando um atualizador antigo copia o motor novo, o `ping`
  final completa a migração de privacidade ainda naquela primeira execução.
- **Sem apagar regra do dono:** as novas proteções são acrescentadas por um helper idempotente;
  regras locais permanecem intactas e repetir o processo não duplica linhas.
- **Regressão reproduzida:** o teste simula exatamente a passagem em que código legado chama o
  script novo e bloqueia nova release se o estado dos sistemas puder aparecer no Git.

## v1.12.1 — 2026-07-24 · “instalação antiga também recebe o sistema inteiro”
- **Upgrade multi-runtime completo:** instalações anteriores agora recebem a skill do Briefing
  Comercial tanto em `.claude` quanto em `.agents`.
- **Proteção privada evolutiva:** o atualizador acrescenta regras novas de privacidade ao
  `.gitignore` sem sobrescrever regras criadas pelo dono.
- **Regressão coberta:** o teste de atualização parte de um `.gitignore` antigo, preserva regras
  locais e exige proteção para estado de sistemas, configuração e feedback.

## v1.12.0 — 2026-07-24 · “o trabalho volta como inteligência operacional”
- **Brief operacional vivo:** `operacao/_HOJE.md` reaparece a partir dos estados locais dos
  sistemas, fontes registradas, decisões, execuções e melhorias — sem expor conteúdo ou caminhos.
- **Exceção no lugar de silêncio:** fonte ausente e sistema em atenção entram automaticamente no
  brief; registrar fonte, mudar estado e concluir run atualizam a visão sem bloquear o trabalho.
- **Memória procedural supervisionada:** antes de operar, o cérebro procura caminhos aprovados
  comparáveis; depois de um run bem-sucedido, pode preparar um procedimento reutilizável.
- **Falha não ensina escondido:** só run que passou no eval e recebeu aprovação humana pode virar
  candidato. Três casos comparáveis habilitam diff e replay; nunca promoção automática.
- **Atualização segura:** o gerador e seus testes chegam como motor, enquanto `_HOJE.md`, recibos e
  procedimentos continuam pertencendo ao dono do cérebro.

## v1.11.1 — 2026-07-23 · “piloto não é produto validado”
- **Gate de publicação:** pacote técnico, referência externa e operação interna não bastam para
  entrar no catálogo público.
- **Briefing Comercial reclassificado:** continua instalável no piloto acompanhado, mas fica não
  listado até três ciclos reais, dois cérebros distintos, evals aprovados e uma repetição de uso.
- **Manifest estruturado:** o pacote passa a carregar versão, canal, estágio de validação,
  permissões e telemetria permitida em formato verificável.
- **Runs verificáveis:** cada execução ganha `run-id`, eval agregado, decisão humana e recibo local,
  sem transmitir conteúdo.
- **Laboratório ≠ prateleira:** o piloto pode ser descoberto e recrutar validadores numa seção
  separada, mas só a evidência de casos reais permite sua promoção ao catálogo validado.

## v1.11.0 — 2026-07-22 · “sistema instalado é sistema provado”
- **Primeiro pacote instalável:** Briefing Comercial Inteligente entra por um instalador determinístico,
  com manifest, pipeline, rotina, skill, evals, feedback e changelog.
- **Bootstrap não finge ativação:** os estados distinguem pacote adicionado, configuração, primeiro run,
  ativo e atenção; só um caso real aprovado ativa o sistema.
- **Adaptação ao negócio:** configuração privada registra entidades, fontes de verdade, vocabulário,
  gates, responsáveis e régua local sem enviar conteúdo para a INEVITA.
- **Multi-runtime:** Claude Code, Codex, Gemini CLI e Antigravity operam o mesmo pacote e a mesma skill.
- **Atualização segura:** reinstalar atualiza o motor do sistema e preserva configuração e feedback privados.

## v1.10.1 — 2026-07-20 · “o contexto volta a trabalhar”
- **Primeiro ciclo completo:** o Cérebro Base transforma uma fonte real em artefato aprovado,
  salva apenas depois do consentimento e usa esse contexto numa segunda tarefa sem reler o bruto.
- **Relógios privados T0–T4:** o produto mede fonte legível, primeira entrega, aprovação e
  reutilização em recibo local versionado, sem conteúdo ou PII.
- **Concierge auditável:** intervenções têm categorias fechadas; ajuda fora do contrato fica
  visível como falha do produto.
- **Régua humana natural:** a pessoa diz se usaria o artefato e se precisou explicar tudo de novo;
  linguagem interna de eval não aparece no onboarding.
- **Atualização segura:** o novo harness chega pelo motor e o feedback local do dono é preservado.

## v1.10.0 — 2026-07-20 · “o contexto continua onde já vive”
- **Descoberta sem invasão:** o Cérebro reconhece instalações INEVITA, Obsidian, repositórios,
  pastas de reuniões e workspaces próximos olhando apenas estrutura e marcadores, nunca conteúdo.
- **Escolha antes de escrita:** mais de uma instalação INEVITA exige decisão da pessoa; uma
  instrução explícita de “novo e limpo” continua sendo respeitada sem apagar ou misturar históricos.
- **Fonte não é Cérebro:** Obsidian, repositório e pasta de reuniões entram como fontes do negócio,
  continuam no lugar e só são lidos depois de autorização ligada ao trabalho real.
- **Registro privado e honesto:** fontes aprovadas ficam em catálogo local ignorado pelo Git,
  somente leitura e atualização manual; nenhuma cópia, migração, indexação contínua ou sync é
  prometida.
- **Amostra antes da infraestrutura:** o `/comecar` entende o trabalho, sugere um candidato concreto
  quando ele for relevante e prova valor com um caso pequeno antes de oferecer recorrência.

## v1.9.2 — 2026-07-20 · “uma conversa que entende antes de perguntar”
- **Voz da casa:** a primeira experiência usa `você/seu`, abandona `tu/teu` e deixa de soar como formulário ou roteiro traduzido.
- **Perguntas com continuidade:** cada pergunta reconhece a resposta anterior, reutiliza as palavras da pessoa e explica naturalmente por que o próximo passo importa.
- **Rotina antes da fonte:** o cérebro identifica onde o trabalho ainda depende da pessoa; depois descobre onde esse trabalho deixa rastros e pede somente um caso recente.
- **Amostra antes do conector:** nada de Drive inteiro, OAuth ou integração antes de provar valor com uma fonte pequena e concreta.
- **Acervo como apoio:** a pergunta do Vale vira demonstração curta em português, com fontes nomeadas e “minuto 11:53”; sem inglês cru, paths, timestamps soltos ou linguagem interna.
- **Produto invisível:** A2, telemetria, eval, arquitetura e “notas de honestidade” continuam no motor, nunca na conversa com quem está começando.

## v1.9.1 — 2026-07-19 · “uma conversa até a primeira resposta”
- **Sem reinício obrigatório:** o agente que instala continua na mesma conversa, lê `CLAUDE.md`/`AGENTS.md` e a skill diretamente e entrega o primeiro trabalho antes de ensinar como voltar depois.
- **Intenção não se perde:** `/comecar` usa a tarefa que já veio no instalador e pula o menu genérico; handoff local em `operacao/decisoes-pendentes/onboarding.md` existe só para o fallback real de troca de sessão.
- **Prova ≠ A2:** consulta ao acervo registra `proof_delivered`; `first_value_confirmed` continua reservado ao artefato do próprio negócio aprovado pela pessoa.
- **Ping diagnosticável:** execução normal continua silenciosa e não bloqueante; `--diagnose` separa telemetria indisponível de falha da ativação.
- **Contrato validado:** o gate do produto bloqueia regressão para menu repetido, reinício obrigatório ou skill sem retomada.

## v1.9.0 — 2026-07-18 · “fonte real vira resultado”
- **Um protocolo nos dois cérebros:** negócio, sistemas, skills, conexões, operação e comunidade agora têm responsabilidades explícitas; profundidade muda, arquitetura não.
- **Primeiro sistema instalado:** Calls em Decisões traz manifest, pipeline, rotinas, evals, feedback e changelog — a primeira vitória termina em artefato aprovado que ajuda a agir.
- **`/comecar` redesenhado:** call real é o caminho recomendado; o acervo continua acessível, mas abrir e consultar não fingem A2.
- **`/operar`:** execução por sistema, recibo privado, eval por run e feedback versionado. Três erros comparáveis candidatam mudança; nada se autoedita escondido.
- **Rede com consentimento:** `comunidade/inevita/` recebe; `comunidade/minhas-contribuicoes/` prepara, aprova e registra envio em passos separados. Marketplace e rede seguem honestamente em construção.
- **Telemetria sem contexto:** novos eventos de operação, primeira vitória e contribuição carregam só metadados técnicos e `system_id`; conteúdo nunca sai.
- **Atualização não destrutiva:** seed cria a nova estrutura para instalações antigas apenas quando falta; contexto, operação, feedback, conexões e contribuições nunca são sobrescritos.

## v1.8.0 — 2026-07-17 · “um cérebro, vários agentes”
- **O cérebro não exige mais Claude Pro/Max:** Claude Code, Codex, Gemini CLI e Antigravity operam o mesmo cofre; quem não usa nenhum começa pelo caminho gratuito.
- **Agent Skills portáveis:** `.agents/skills` segue o padrão aberto e é gerado deterministicamente a partir das skills da casa; `AGENTS.md` e `GEMINI.md` adaptam a entrada sem duplicar o método.
- **Telemetria multiplataforma:** `ping.mjs` substitui a dependência de Bash, registra o runtime sem enviar conteúdo e preserva o opt-out.
- **Primeira vitória coerente:** a pessoa pergunta ao acervo com fonte e minutagem antes de entregar contexto próprio; os nomes de ferramenta ficam na instalação, não na promessa.

## v1.7.0 — 2026-07-16 · "o Vale primeiro"
- **O `/comecar` agora entrega o que você veio buscar, na hora**: o cérebro do Vale responde de primeira (com fonte e minutagem), sem entrevista, sem cadastro do teu negócio. Você levou duas coisas — o cérebro do Vale (pronto) e o cérebro do TEU negócio (nasce vazio) — e a comunicação agora deixa isso claro desde o oi.
- **O teu contexto entra quando VOCÊ quiser**: quando uma pergunta tocar o teu caso, o cérebro oferece o contraste ("te respondo genérico, ou me conta em 3 linhas e respondo pro TEU caso"). Nada de menu de dor genérica — o teu negócio nas tuas palavras, sempre.
- **Passe de acesso (opcional)**: quem instala pelo link da área Cérebro na INEVITA ganha um `.cerebro/member-id` (código opaco — não é nome nem e-mail) que liga a instalação ao teu acesso e **desliga os lembretes de ativação pra quem já ativou**. Fica só na tua máquina; desfazer = apagar o arquivo. Transparência no COMECE-AQUI.

## v1.6.2 — 2026-07-16 · "ninguém trava no meio"
- **`/comecar` sem pergunta aberta**: toda pergunta agora vem com opções numeradas (responde 1, 2, 3…), "não sei" é resposta válida (a IA assume o caminho provável e segue), uma pergunta por vez, e você pode parar quando quiser — o progresso fica salvo e o `/comecar` continua de onde parou.
- **Sem troca de ambiente no meio**: se a IA que te atende já lê a pasta (Claude/ChatGPT/Gemini, app ou desktop), ela conduz o onboarding ali mesmo — ninguém mais é mandado pro terminal no meio do caminho. O Claude Code segue sendo o modo turbo, não um pré-requisito.

## v1.6.1 — 2026-07-15
- **E-mail de resgate (opcional)**: o `/comecar` pergunta uma vez qual e-mail você usou pra resgatar o cérebro e guarda em `.cerebro/acesso-email` (só na tua máquina) — é como tua instalação fica ligada ao teu acesso e às futuras atualizações/benefícios. Não quer? É só não informar, ou apagar o arquivo.

## v1.6.0 — 2026-07-14 · "teu conhecimento vira visual"
- **Skill nova: `frameworks-visuais`** — transforma qualquer nota do teu cérebro num framework visual (Excalidraw dark e clean). Nota rica vira história em atos com pictogramas; conceito pontual usa arquétipos prontos (pipeline, curva, matriz, funil, pirâmide, ciclo, anatomia, contraste). É só pedir "gera um framework visual da nota X". Precisa do plugin Excalidraw no Obsidian (Community plugins).
- A skill **estrutura o que a nota diz, nunca inventa** — todo texto do canvas é rastreável à fonte.
- **Telemetria anônima de uso** (transparência total): o cérebro passa a mandar um ping quando você usa um comando — só um código aleatório desta instalação + nome do evento + versão + SO. **Nunca sai conteúdo, arquivo, nome ou e-mail.** Desligar: crie `.cerebro/sem-telemetria`. O código está aberto em `.claude/scripts/ping.sh`.

## v1.5.1 — 2026-07-09
- **Vocabulário v2 chegou na operação**: motor ancora em [harness], frescor em [context rot], perguntas-canário em [evals/golden patterns]; citação-bandeira do PayPal corrigida pro verbatim real ("competitive advantage"); estatística da Deasy agora com fonte e minutagem (demo no expo `[13:24]`).
- **Ponte 4 movimentos ↔ 5 verbos** no METODO.md e no `/metodo` (mesmo método, dois zooms).
- **`/reindex` ganhou o passo 50/50** (ensinar o sistema toda semana) e **`/atualizar` declara a portabilidade** (teu contexto em arquivo aberto, nunca refém).
- **Conserto do motor.manifest**: as 5 skills dos relógios, o GLOSSARIO e o METODO-COMPLETO agora chegam a todo mundo via atualização automática (antes, quem já tinha clonado não recebia).

## v1.5.0 — 2026-07-09
- **METODO-COMPLETO.md**: o método inteiro num documento só — fundamentos → mapa → ciclo → contrato → melhores práticas → resultados → pra onde vai. Condensado das palestras do AI Engineer World's Fair 2026, toda citação com fonte e minutagem. Comece por ele; o `/metodo` aplica.

## 1.4.0 — 2026-07-09 · "Expo completo — a trilha do contexto"
- **Expo vol. 3** (7 palestras inéditas + íntegras): WTF Is the Context Layer ("context is also IP"), Agent Memory vs Learning (promoção supervisionada, 7000→1000 chunks), AI in GTM at Notion (63% uplift, "own the context layer, rent everything else"), Prompt/Memory/Weights ("the model is the easy part"), LLM Knowledge Bases ("the daily paper but your own"), GTM Orchestration, Why We Killed Our Multi-Agent Pipeline — + ecos de 5 sessões parciais.
- **Resgates do expo**: workshop completo de product discovery (54 min, Mom Test na prática), a imersão numa big tech de pagamentos (context plugin: 91% menos erros), compound engineering (regra 50/50) e por que o Claude Code explodiu.
- `/reindex` agora entrega **o jornal da tua semana** (manchete, o que andou, o que travou, a pergunta aberta) — o entregável visível do ritual.
- `/guardar` com **freio de rótulos**: tag/tema novo só com tua aprovação (vocabulário sem freio vira ruído).
- METODO: **as 4 memórias** (trabalho/episódica/semântica/procedural — por que a estrutura é assim) e a **regra da mesa** (uma janela = um trabalho; o chat é mesa, não memória).

## 1.3.5 — 2026-07-08 (setup sem fricção — extraído da call de teste)
- COMECE-AQUI: bloco "o que você precisa / NÃO precisa" — mata o medo de API/chave (só precisa da conta Claude). Nasceu do Vini batendo no paywall do Groq no teste.
- Porta "explorar o acervo" do `/comecar` agora leva a um índice de topo real (`conhecimento/_INDICE.md`), não a catálogos espalhados — o corredor tinha 4 portas sem mapa.

## 1.3.4 — 2026-07-08 (armadilhas de material bruto)
- Regra da sequência no `/guardar` e no `/call`: a unidade de sentido é a PEÇA, não o arquivo — fragmento/CTA solto puxa os irmãos antes de julgar.
- `/call` blindado contra 4 armadilhas de transcrição automática: citação-refutação, número ambíguo, nome trocado pelo whisper, compromisso condicional.

## 1.3.3 — 2026-07-08 (bateria de QA com material real + glossário)
- `/call` em call longa (60+ min): oferece segunda passada — átomos principais + reserva de candidatos (a cauda tem ouro).
- `/call` detecta formato aula/live: rota dupla — átomos operacionais + destilado-nota no topo do bruto.
- `GLOSSARIO.md` novo: os 17 termos da casa, uma linha cada, com o termo do Vale que ancora. Termo novo só entra por lá.

## 1.3.2 — 2026-07-08 (fricções do teste real de onboarding)
- `/comecar` agora tem DUAS portas: montar teu contexto ou explorar o acervo primeiro (índice).
- A skill avisa logo de cara: cada resposta já vira contexto gravado (as perguntas são construção, não custo).
- Catálogos trancados mostram como entrar.
- COMECE-AQUI: aviso pra reabrir o Claude Code dentro da pasta (skills carregam na abertura).

## 1.3.1 — 2026-07-07
- `/metodo` agora ensina os relógios (dia/semana/mês) e a regra "guardar tudo ≠ dar tudo pra IA".
- `/comecar`: mínimo pra vitória explícito (dor + 1 fonte rica, ou 2 rasas) e roteamento pra `gente/`.

## 1.3.0 — 2026-07-07 · "O método ganhou relógios"
- **5 skills novas** — o ciclo completo: `/daily` (o dia em 10 min, memória quente), `/call` (reunião vira átomos em 48h), `/reindex` (o ritual da semana), `/revisar` (frescor mensal — nota morta se marca `superado`, nunca se deleta) e `/teste` (o Teste do Cérebro: tuas 5 perguntas-canário, evoluindo de **em branco → estagiário → sócio**).
- **O Mapa do Negócio** (`meu-negocio/mapa.md`): o negócio numa página + A métrica principal — o conselho nº 1 de quem constrói no Vale ("mapeamento + uma métrica resolve 90%"). O `/comecar` agora o preenche.
- **O eixo pessoa** (`meu-negocio/gente/`): uma página por cliente/parceiro/concorrente-chave — `/call` e `/daily` alimentam.
- **O eixo tempo** (`meu-negocio/dailies/`): rollup diário + resumo da semana (que nasce das dailies, nunca de reler tudo).
- **Frescor**: notas ganham `confirmado:` e `status: superado` — porque a verdade muda, e nota velha fingindo estar viva envenena resposta (30% de notas velhas ou duplicadas contaminam até 80% do contexto — demo da Deasy no expo `[13:24]`, que mediu: limpar dobrou o recall).
- METODO.md: os relógios (dia/semana/mês), quando tratar o quê, e a saúde do cérebro.

## 1.2.7 — 2026-07-07
- **Expo vol. 2**: GEPA — o sistema que otimiza o próprio contexto ("quanto melhor o modelo, mais vale o teu contexto"); Aiden, o agente que venceu o desafio da OpenAI ("o humano sobe na stack, não sai dela"); ACP — o padrão pra comandar agentes; MCP Tasks; Deasy ("30% de arquivos ruins contaminam 80% do contexto — limpar dobra o recall"); knowledge graphs; MCP Apps (separe dados de UI).

## 1.2.6 — 2026-07-07
- **Workshops do expo** (9 gravações de sala): skills como conhecimento executável, "Claude Beige"/anti-slop, "julgamento é o ativo caro", thinking in public (YC/PG), agent experience (Stripe/Metronome), sites generativos, design ops com agentes.
- **🗺️ O mapa da conversa do evento** — a síntese: as 6 camadas em volta do modelo (contexto, skills, agentes, curadoria, eficiência, pessoa).

## 1.2.5 — 2026-07-01
- +5 palestras do AI Experience: **Kyle Mistele** (Loop Engineering), **Dex Horthy** (Harness não basta), **Vaibhav Gupta** (Fighting slop), **Niels Rogge** (automatizar o próprio trabalho), **Kieran Klaassen** (Compound Engineering). Destilado + íntegra cada.

## 1.2.4 — 2026-06-30
- Mecanismo de atualização revisado (auto-update validado de ponta a ponta).

## 1.2.3 — 2026-06-30
- O método agora tem nome: **Engenharia de Contexto** (ancorado no termo do Karpathy/OpenAI) — na era da IA, o que vence não é o prompt, é o contexto certo.

## 1.2.2 — 2026-06-30
- `/comecar`: quando o site vem raso (SPA/Framer, o caso mais comum), pede proativamente uma **call ou anúncio** — fonte mais rica. Validado num teste real (viverdeia.ai).

## 1.2.1 — 2026-06-30
- `METODO.md` visível na raiz — o método (4 movimentos + átomo) virou documento legível, não só o que a IA usa por baixo.

## 1.2.0 — 2026-06-30
- **Atualização automática:** o cérebro se atualiza sozinho ao abrir (motor + conhecimento da comunidade) — teu contexto nunca é tocado.
- **Teu contexto começa vazio:** o `meu-negocio/` é template em branco; o `/comecar` preenche com o TEU negócio. O cérebro é só teu.

## 1.1.0 — 2026-06-30
- **O Método do Cérebro** (validado por pesquisa): os 4 movimentos — organizar por uso, capturar em átomos, conectar leve, buscar citando.
- **Átomo** como unidade: afirmação + citação literal + sentido + elos. A IA opera átomos citados, nunca o bruto (anti-alucinação).
- Onboarding (`/comecar`) entra **pela dor** e trata o que você já tem.
- Novas skills: `/metodo` (ensina) e `/guardar` (captura assistida em átomo).
- 4º horizonte: `meu-negocio/arquivo/`.

## 1.0.0 — 2026-06-29
- Primeira versão: onboarding por ingestão (`/comecar`), começando pelo teu site.
- Conhecimento do Vale embutido (PayPal, Geoffrey Moore) pra cruzar com o teu caso.
- Captura com proteção de PII (nada pessoal vai pro git).
- Atualização: `/atualizar` traz melhorias sem tocar no teu contexto.
