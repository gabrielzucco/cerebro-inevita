# Company Brain — Design System

## Norte

O momento memorável é **ver o cérebro pensando de verdade**. O Canvas não encena agentes:
ele torna contratos, contexto selecionado, execução, gates e julgamento legíveis no mesmo espaço.

## Princípios

1. **Verdade antes do espetáculo.** Um nó só acende quando existe evento ou recibo que sustenta o estado.
2. **Uma gramática, três escalas.** Cérebro, Sistema e Run usam os mesmos objetos e cores.
3. **Canvas não é casa da verdade.** Contratos e ledgers continuam canônicos; posição é preferência local.
4. **Escuro operacional, não cyberpunk decorativo.** Contraste, profundidade e movimento comunicam estado.
5. **Conteúdo privado fica privado.** O Canvas recebe referências, contagens e estados, nunca prompt ou output.

## Gramática visual

- Fundo: grafite quase preto (`#080b10`) com grade pontilhada de baixa opacidade.
- Superfícies: carvão azulado (`#111722`) com borda fria (`#253044`).
- Texto: branco gelo (`#f3f7fb`) e secundário (`#91a0b5`).
- Declarado / não usado: cinza `#667085`.
- Em execução / selecionado: azul elétrico `#4da3ff`.
- Concluído / passou: verde menta `#42d392`.
- Lacuna / julgamento: âmbar `#f6bd4a`.
- Falhou / negado / revogado: coral `#ff647c`.
- **Identidade do objeto:** Fonte usa o logo real do fornecedor quando existe; objeto interno usa
  ícone semântico da sua função. Nenhum círculo, losango ou estrela abstrata substitui o significado.
- **Tipo ≠ estado:** ícone e filete lateral comunicam o tipo; fundo, contorno, texto e halo comunicam
  o estado. A leitura nunca depende somente de cor ou forma.
- Capability: violeta `#9b8cff`; Fonte: ciano `#4fd1c5`; decisão humana: âmbar.

## Tipografia

- Interface: `Inter`, `ui-sans-serif`, sistema.
- IDs, versões e recibos: `JetBrains Mono`, `SFMono-Regular`, monoespaçada do sistema.
- Títulos curtos, sentence case; labels operacionais em caixa alta e tracking amplo.

## Canvas

- **Mapa do Cérebro:** Áreas → Sistemas ↔ Fontes compartilhadas; clusters determinísticos por Área.
- **Canvas do Sistema:** Fontes → Coleta → Recuperação → Skill observada → Capability → Output →
  Gates → Julgamento; estágios horizontais e fontes/gates empilhados para preservar legibilidade.
- **Canvas do Run:** a mesma topologia, com o caminho real e seus estados destacados pelo Execution Trace.
- Clique abre inspector em coluna própria, sem cobrir o mapa, e reduz visualmente tudo que não faz
  parte da vizinhança selecionada. `Ver mapa inteiro` limpa o foco e recupera a visão geral.
- A abertura prioriza zoom legível; o mapa continua arrastável quando a topologia excede o viewport.
- V0 abre bloqueado. `Reorganizar` permite mover nós e salvar apenas `{x,y}` localmente.
- Criar/remover nó ou aresta não existe no V0: arquitetura muda por contrato, revisão e aprovação.

## Movimento

- Aresta ativa: fluxo de dash suave, nunca animação infinita em todo o mapa.
- Nó em execução: halo azul respirando.
- Conclusão: transição curta para verde; falha: pulso coral único.
- `prefers-reduced-motion` desliga fluxos e pulsos.

## Decisões tecnológicas

- Motor: `@antv/g6` (MIT), por suportar Canvas/WebGL/SVG, layouts de DAG e força, estados,
  animações, comportamentos e elementos customizados sem impor React.
- Logos de fornecedores: `simple-icons` (CC0). Ícones funcionais: `@lucide/icons` (ISC), ambos
  embutidos como SVG data URI para manter o Console local sem chamadas externas.
- O Execution Trace V1 é um ledger local JSONL, reference-only, com eventos ordenados.
- Nomes e estrutura dos eventos seguem princípios de spans/eventos do OpenTelemetry e streaming
  tipado do AG-UI, sem acoplar o protocolo INEVITA a um fornecedor.
- tldraw não é base do produto: a licença atual exige chave própria em produção e o problema não
  é uma lousa livre. React Flow continua uma boa referência de editor, mas já é usado no FunnelCanvas
  e não oferece vantagem arquitetural para este corte.

## Contratos de acessibilidade

- Todo estado tem texto e forma, nunca somente cor.
- A lista equivalente permite focar qualquer nó e abrir os mesmos detalhes do inspector por teclado.
- Contraste mínimo AA para texto; controles têm foco visível.
- Canvas possui lista tabular equivalente para leitura assistiva.
