# Design review — Company Brain experience V1

Data: 2026-08-27  
Classificação: app UI  
Baseline combinado: 5,2/10  
AI slop baseline: 3/10

## FINDING-001 — Launcher compacto demais para reconhecer o Sistema

Impacto: alto  
Status: verificado
Commit: `cc3e4bd`
Depois: três Sistemas legíveis por linha, nomes inteiros, resultado em até três linhas e nenhum
resumo operacional competindo com o Launcher.

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
Status: verificado
Commit: `3779751`
Depois: quatro âncoras como norte, memória resumida, grafo canônico leve, fluxo em seis etapas e
portas explícitas para Hoje, Sistemas, Fontes e Confiança.

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
Status: verificado
Commit: `aefa4b9`
Depois: filtros continuam roláveis no mobile sem barra cinza; a página permanece sem overflow.

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

## Resultado final

- Findings: 3.
- Verificados: 3.
- Best effort, revertidos ou adiados: 0.
- Design score: 5,2 → 8,5/10.
- AI slop score: 3 → 1/10.
- Produto reconhecível na primeira tela: sim.
- Um âncora visual forte: sim, o mapa inteiro.
- Página compreensível só pelos títulos: sim.
- Cada seção tem um trabalho: sim.
- Cards necessários: sim no Launcher e nas três portas de ação; o Cérebro deixou de ser mosaico.
- Movimento melhora a hierarquia: o mapa leve fica estático; G6 só entra quando solicitado.
- O design sobreviveria sem sombras decorativas: sim.

PR summary: Design review encontrou 3 problemas e verificou 3 correções. Design 5,2 → 8,5;
AI slop 3 → 1.
