# Design review — Company Brain experience V1

Data: 2026-08-27  
Classificação: app UI  
Baseline combinado: 5,2/10  
AI slop baseline: 3/10

## FINDING-001 — Launcher compacto demais para reconhecer o Sistema

Impacto: alto  
Status: aberto

Eu noto quatro cards por linha em 1440×1000, com nomes e resultados cortados já na primeira dobra.
O card existe porque é a interação de abrir/inspecionar, mas a densidade atual faz a grade parecer
inventário administrativo. A categoria, o dono, a saúde e três métricas têm pesos próximos, então o
olho não encontra o resultado prometido pelo Sistema.

Correção: recuperar a hierarquia da primeira versão, limitar a grade a três colunas úteis, deixar
nome e resultado respirarem e reduzir o rodapé operacional a uma leitura contínua. Categoria segue
como metadado; identidade usa somente asset real ou monograma neutro.

Evidência: captura desktop da tela `Sistemas` emitida na sessão antes da correção.

## FINDING-002 — Cérebro é um relatório técnico, não uma superfície de orientação

Impacto: alto  
Status: aberto

Eu noto que a página começa repetindo os cinco KPIs de `Hoje`, trata as quatro âncoras como chips de
código e em seguida despeja uma tabela de 15 Fontes. O mapa inteiro não aparece. A navegação exige
que o membro entenda `binding`, `grant`, `frescor`, `Context Snapshot`, execução, governança e tarefas
do mantenedor na mesma leitura.

Correção: esconder o resumo operacional nesta view; transformar as quatro âncoras no norte visual;
resumir memória sem duplicar a superfície Fontes; tornar Atenção → Recuperação → Context Snapshot →
Sistema → Julgamento → Aprendizado um fluxo; incluir uma visão leve do grafo canônico e manter o
Canvas completo como exploração lazy.

Evidência: captura desktop da tela `Cérebro` emitida na sessão antes da correção.

## FINDING-003 — Barra nativa compete com os filtros no mobile

Impacto: polimento
Status: aberto

Eu noto que a lista horizontal de funções empresariais mostra uma barra cinza grossa logo abaixo
dos filtros em 375×812. O gesto de rolagem é útil; o cromo nativo é que parece uma falha visual.

Correção: manter a rolagem horizontal por toque e teclado, escondendo somente a barra decorativa.

Evidência: captura mobile da tela `Sistemas` emitida na sessão antes da correção.

## Quick wins incorporados

- Remover o resumo de `Hoje` da página Cérebro.
- Trocar quatro cards truncados por três cards legíveis no Launcher.
- Tirar a tabela completa de Fontes da anatomia.
- Dar ação explícita ao mapa inteiro sem carregar G6 no bootstrap.

## Litmus baseline

- Produto reconhecível na primeira tela: sim.
- Um âncora visual forte: não.
- Página compreensível só pelos títulos: parcialmente.
- Cada seção tem um trabalho: não no Cérebro.
- Cards são necessários: sim no Launcher; excessivos no Cérebro.
- Movimento melhora a hierarquia: não se aplica nestas views.
- O design sobreviveria sem sombras decorativas: sim.
