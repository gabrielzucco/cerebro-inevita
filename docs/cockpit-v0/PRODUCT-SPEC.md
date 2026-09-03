# Cockpit do Cérebro — especificação V0 centrada em julgamento

Status: direção de produto corrigida; replay visual em validação  
Data: 2026-08-20  
Fonte humana: correções de produto do Gabriel na sessão de desenho do Cockpit

## 1. Definição

> **O Cockpit mostra onde a IA precisa do seu julgamento — e prova quando ele virou capacidade.**

Tradução concreta:

> **Veja onde você ainda precisa julgar — e onde já não precisa explicar de novo.**

O Cockpit não existe para mostrar o Cérebro, sua quantidade de contexto ou uma galáxia de notas.
Contexto, evidência, Sistemas, execuções e Society servem ao mesmo loop: transformar julgamento
humano em uma correção testável e provar até onde ela sobreviveu.

## 2. Decisão visual

- **A — Control Plane:** casca operacional, navegação e hierarquia.
- **C — Modo Foco:** pergunta e comando globais.
- **B — Atlas Editorial:** leitura de output, evidência, decisão e histórico.
- **Grafo:** explicação contextual dentro de um Caso; nunca destino principal.
- **Society:** confronto do julgamento, não compartilhamento do Cérebro privado.
- **Recibo:** prova do nível alcançado pela correção.

## 3. Objeto central: Caso de Julgamento

O julgamento é um acontecimento humano. O **Caso de Julgamento** preserva o ciclo operacional
inteiro.

```text
Caso de Julgamento
├── trabalho original
├── Sistema, versão e run
├── output
├── veredito humano
├── razão
├── evidências
├── correção registrada
├── alcance da mudança
├── replay
├── execução comparável
├── efeitos colaterais
├── status de promoção
└── recibos
```

### Schema conceitual

```json
{
  "judgment_case_id": "jc-001",
  "status": "needs_judgment | correction_recorded | replay_failed | replay_passed | transfer_failed | transfer_passed | stable",
  "work": {
    "title": "Cockpit do Cérebro V0",
    "system_id": "product-design",
    "run_id": "cockpit-v0-original"
  },
  "output_ref": "designs/cockpit-v0-original",
  "judgment": {
    "verdict": "changes_requested",
    "reason": "O output coloca conhecimento no centro, não julgamento.",
    "decided_by": "human",
    "decided_at": "2026-08-20T00:00:00-03:00"
  },
  "correction": {
    "statement": "Reorganizar o Cockpit em torno do ciclo de julgamento.",
    "scope": ["product-definition", "today", "judgment-case", "society", "receipts"]
  },
  "replay": { "status": "ready", "run_id": null },
  "comparable_run": { "status": "not_started", "eligibility_criteria": null },
  "side_effects": [],
  "promotion_status": "not_eligible",
  "receipts": []
}
```

## 4. Loop canônico

```text
Trabalho real
    ↓
Output
    ↓
Precisa de julgamento?
    ├── Não → resultado + recibo do run
    └── Sim
          ↓
    Julgamento humano
          ↓
    Correção registrada
          ↓
    Replay do caso original
          ↓
    A correção foi aplicada?
       ├── Não → revisar implementação
       └── Sim
             ↓
       Caso comparável pré-definido
             ↓
       O critério se transferiu?
          ├── Não → novo julgamento
          └── Sim
                ↓
          Recorrência observada
                ↓
          Capacidade estável
```

O caso comparável e seu critério de elegibilidade são definidos **antes** de observar o resultado.
Escolher um caso fácil depois do fato não prova transferência.

## 5. Níveis honestos de prova

| Nível | O que aconteceu | Claim permitido |
|---|---|---|
| Aplicação | replay do mesmo caso passou | “A correção foi aplicada.” |
| Transferência | caso novo comparável passou | “O critério sobreviveu em uma nova execução.” |
| Estabilidade | recorrência passou sem regressão relevante | “A capacidade está se mostrando estável.” |

O **Recibo de Composição** agrega os recibos existentes, mas nunca pula níveis.

## 6. Arquitetura do Cockpit

### Hoje

Somente três movimentos:

1. **Precisa do seu julgamento** — outputs, hipóteses e decisões que a IA não pode promover.
2. **Pronto para trabalhar** — Sistemas com contexto e permissões suficientes para executar.
3. **O que compôs** — correções que já reapareceram em execução posterior, com nível de prova.

Não existem métricas abstratas como “Contexto 38%”. Toda lacuna aparece ligada a um trabalho e a
uma consequência:

> “O Sistema Comercial não pode rodar porque ainda falta definir o que caracteriza um lead
> qualificado.”

### Casos de Julgamento

Fila e histórico dos casos. A lista mostra trabalho, Sistema, o que precisa ser julgado,
consequência, estado do ciclo, nível de prova e próximo movimento humano.

### Mesa de Julgamento

Superfície principal do produto:

- output original;
- o que a IA acredita que aconteceu;
- evidências e lacunas;
- veredito humano e razão;
- correção proposta;
- alcance da mudança;
- efeitos colaterais previstos;
- replay;
- comparação antes × depois;
- caso comparável;
- Recibo de Composição;
- ação **Confrontar na Society**.

### Sistemas

Mostra Sistemas pelo estado em relação ao trabalho: pronto para rodar, bloqueado por julgamento,
aguardando replay, testando transferência, capacidade estável ou precisa de atenção.

### Recibos

Ledger de aplicação, transferência e estabilidade. Cada recibo liga Caso de Julgamento, correção,
Sistema e versões, replay ou caso comparável, comparação observada, efeitos colaterais e claim
permitido.

### Society

Fila privada de Judgment Packs preparados, aprovados, enviados e respondidos. Society não recebe
o Cérebro, o output cru ou fontes privadas.

### Comando global

A busca da direção C atravessa o Cockpit:

- “O que precisa do meu julgamento?”
- “Onde eu já corrigi isto?”
- “Esta correção foi apenas aplicada ou já se transferiu?”
- “Que Sistema está bloqueado e por quê?”
- “Prepare um confronto sanitizado para a Society.”

## 7. Judgment Pack da Society

```text
Judgment Pack sanitizado
├── decisão necessária
├── hipótese atual
├── evidências permitidas
├── lacunas
├── alternativas
├── critério em disputa
└── perguntas para confronto
```

Três consentimentos separados:

1. **Preparar** — a IA monta o pack localmente.
2. **Aprovar** — o founder revisa conteúdo e anonimização.
3. **Enviar** — ação externa explícita.

Quem confronta não entrega “a resposta”. Aponta premissas, casos comparáveis, riscos e o que o
founder pode não estar vendo. A decisão volta ao Cérebro privado como julgamento do founder.

## 8. Grafo contextual

O grafo não está na navegação principal. Ele abre a partir de perguntas como “Por que este output
chegou aqui?”, “Que evidência sustenta esta hipótese?”, “O que esta correção muda?” e “Quais runs
são realmente comparáveis?”.

O grafo mostra somente o caminho necessário:

```text
trabalho → output → evidência → julgamento → correção → replay → recibo
```

Relações sugeridas pela IA usam linha tracejada e não aparecem como fato confirmado.

## 9. Primeiro Caso: o próprio Cockpit

### Trabalho real

Construir a interface própria do Cérebro INEVITA.

### Output original

Cockpit competente para visualizar, operar e auditar contexto, com Hoje, Meu negócio, Sistemas,
Grafo, Execuções e Evidências.

### Julgamento humano

O output resolvia um Company Brain genérico e colocava conhecimento no centro. Não materializava a
tese única: onde a empresa precisa de julgamento humano e se esse julgamento melhorou a próxima
execução.

### Correção registrada

- manter A como casca;
- usar C como comando;
- usar B para leitura;
- colocar o Caso de Julgamento no centro;
- reduzir Hoje a três movimentos;
- tornar o grafo contextual;
- adicionar Society como confronto;
- separar aplicação, transferência e estabilidade;
- fazer o recibo provar o nível alcançado.

### Replay

O protótipo revisado é o replay do mesmo trabalho. Até Gabriel julgá-lo:

- status: `correction_recorded`;
- claim: “A correção foi registrada.”;
- aplicação: ainda não confirmada;
- transferência: não testada;
- estabilidade: não testada.

## 10. V0 de implementação

- Cockpit completo na casca, sem construir todas as integrações.
- Uma home real com os três movimentos.
- Um Caso de Julgamento real: o próprio Cockpit.
- Uma Mesa de Julgamento navegável.
- Uma correção registrada.
- Um replay visual.
- Um Recibo de Composição honesto.
- Um fluxo concierge de Judgment Pack.
- Sistemas e Recibos como vistas do mesmo loop.
- Grafo somente dentro do caso.

Fora do V0: feed comunitário, matching, grafo global, banco de grafo, automação externa da Society,
promoção automática de aprendizado e claims de transferência sem caso comparável.

## 11. Teste do produto

Em menos de dois minutos, a pessoa entende:

1. o que saiu errado;
2. o que o humano corrigiu e por quê;
3. onde a capacidade mudou;
4. qual nível foi realmente provado;
5. qual é o próximo movimento.

Se o usuário apenas navega pelo contexto, falhamos. Se ele enxerga seu julgamento atravessando uma
execução e virando capacidade verificável, encontramos o núcleo.
