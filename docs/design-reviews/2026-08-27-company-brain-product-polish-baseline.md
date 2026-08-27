# Company Brain — pente fino de produto e design

Data: 2026-08-27  
Superfícies: Hoje, Cérebro, Sistemas, workspace de Sistema e Skills  
Classificação: app operacional local

## Primeira impressão

O Cockpit comunica seriedade operacional e preserva a gramática escura do Company Brain.
O problema não é falta de acabamento: é falta de níveis. Quase toda informação verdadeira
recebe peso de primeira camada, então o usuário precisa compreender a arquitetura para usar
o produto.

## Achados

### FINDING-001 — Hoje virou inventário completo

Impacto: alto. A fila com 23 decisões e todas as rotinas empurra o trabalho imediato para
dentro de uma página longa. A primeira tela deve mostrar o que decidir agora e recolher o
restante sem apagar a verdade.

### FINDING-002 — Capacidades nativas são apresentadas como documentação técnica

Impacto: alto. `Prova local`, Skills, provider, Sistemas consumidores e dois CTAs aparecem
simultaneamente em cada capacidade. A primeira camada precisa dizer que a capacidade já vem
com o Cérebro, o que ela permite e onde ver seu estado; a prova completa já tem casa nas abas
Memória, Recuperação, Aprendizado e Arquitetura.

### FINDING-003 — Skills obriga leitura de catálogo

Impacto: alto. Vinte e nove cards exibem descrições longas, vínculos e CTA. O usuário escaneia
nome, estado e finalidade curta; `Quando usar`, origem, runtime e Sistemas consumidores ficam
no drawer.

### FINDING-004 — Sistemas não prioriza o que já trabalha

Impacto: médio. Os 17 Sistemas começam em ordem alfabética e misturam ativos, configurados e
mapeados. Ativos precisam aparecer primeiro; estágio deve ser um filtro independente da função
empresarial.

### FINDING-005 — Workspace começa pelo painel de instrumentos, não pelo Sistema

Impacto: alto. O usuário entra e vê doze métricas antes de entender promessa, publisher e modo
de uso. A primeira aba deve ser `Sobre`, com promessa e operação em primeiro plano; números e
componentes descem na hierarquia.

### FINDING-006 — Marketing existe como função, mas não como área responsável

Impacto: médio e arquitetural. Conteúdo, Funil e VSL estão declarados como função `marketing`,
mas pertencem à área `commercial`. A correção é criar a área Marketing e migrar esses contratos
explicitamente; inferência pela função repetiria a taxonomia paralela que o protocolo eliminou.

### FINDING-007 — Origem do Sistema ainda não é uma dimensão canônica

Impacto: médio e arquitetural. `nativo`, `da empresa` e `da Society` não são equivalentes a
publisher, status ou presença de interface. A interface só deve oferecer esse filtro depois de
existir recibo/proveniência de instalação.

## Quick wins deste corte

1. Recolher cauda de decisões e rotinas em Hoje.
2. Transformar capacidades nativas em uma sequência compacta.
3. Compactar cards de Skills e mover explicação integral para o drawer.
4. Ordenar Sistemas por estágio e adicionar filtro de estágio.
5. Reordenar a primeira aba do Sistema para explicar antes de medir.

## Baseline

- Design score: C
- AI slop score: A — identidade própria, sem gradientes genéricos ou decoração gratuita.
- Trunk test: passa nas cinco superfícies; o problema é densidade dentro de cada página.

## Verificação pós-correção

- `Hoje`: cinco decisões na primeira camada e dezoito recolhidas; rotinas limitadas a quatro.
- `Cérebro`: seis capacidades em sequência compacta; provider, Skills e prova detalhada
  permanecem nas superfícies donas.
- `Sistemas`: 17 visíveis por padrão, quatro ativos primeiro e filtro de estágio independente.
- `Sobre o Sistema`: promessa antes da evidência; saúde dos sete componentes começa recolhida.
- `Skills`: identificador técnico removido do card, status encurtado, finalidade em duas linhas
  e explicação completa preservada no inspetor.
- QA: teste de produto novo, cinco testes focados e validação oficial verdes; sem overflow
  horizontal na visão do Cérebro em viewport estreito.

Design score pós-correção: B. A arquitetura da informação principal está resolvida; a próxima
subida de qualidade depende de mídia declarada no Experience Manifest e das migrações canônicas
de área Marketing e proveniência de instalação — não de mais decoração no Cockpit.
