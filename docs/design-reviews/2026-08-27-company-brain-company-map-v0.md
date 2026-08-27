# Design review — Company Brain: Mapa vivo da empresa V0

## Veredito

Pronto para comparação, sem martelo de substituição. A nova leitura abre por padrão, mas a
`Anatomia atual` continua disponível e funcional no mesmo lugar. O corte troca topologia abstrata
por reconhecimento da empresa real sem criar outro Canvas, outro ClickUp ou uma falsa conversa com
IA.

## Baseline

A página anterior explicava o Cérebro por conceitos-âncora, clusters técnicos e uma miniatura do
grafo. Era coerente com a arquitetura interna, mas não ajudava o founder a encontrar ofertas,
produção, decisões, founders, comunidade, Sistemas, Skills, referências ou operação. Também
duplicava visualmente uma competência que já pertence ao Canvas.

**Design score do baseline:** C. Visualmente consistente com o Console, conceitualmente distante do
modelo mental do usuário.

## FINDING-001 — o Cérebro precisava parecer a empresa, não seu diagrama técnico

**Severidade:** alta  
**Correção:** `6430215`

- O modo `Mapa da empresa` organiza 31 objetos reais em seis funções reconhecíveis.
- Cada objeto mostra contagem e última alteração apenas por metadado do filesystem.
- `02-dados-terceiros` permanece agregado e protegido; nenhum conteúdo ou PII é aberto.
- Busca é filtro local explícito e nunca finge retrieval.
- Fontes, cuidado da memória, rotinas e ciclo do dado têm papéis separados.
- Sistemas aparecem como consumidores/produtores de contexto; instalação continua no Launcher.
- O grafo inteiro permanece no Canvas e não é carregado pelo modo novo.

**Resultado visual:** hierarquia editorial sóbria, um mapa dominante e uma coluna de origem/saúde;
sem faixas coloridas, mosaico de marketplace ou cards decorativos.

## FINDING-002 — a navegação recolhida vazava texto no mobile

**Severidade:** média  
**Correção:** `67abd68`

O botão `Encolher` escondia o texto dos itens de navegação, mas não escondia o próprio rótulo e o
atalho. Em 375 px, ambos invadiam o conteúdo. O estado mobile agora preserva apenas o glifo,
centralizado, seguindo a mesma regra visual do restante da barra.

## Inspeção e evidência

- Desktop inspecionado em `1440 × 1000`: mapa, rail, rotinas e ciclo legíveis; ambos os modos
  alternam sem nova rota.
- Mobile inspecionado em `375 × 812`: sem overflow horizontal e sem rótulo da sidebar invadindo a
  página.
- Busca por `Ads` testada ao vivo: dois resultados locais em Marketing & Vendas.
- Anatomia atual reaberta ao vivo: grafo e comportamento existentes preservados.
- Read model do mapa medido em aproximadamente 37 ms no vault atual.
- Teste estrutural novo e suíte de regressão do Console verdes.

## Avaliação final

**Design score:** A-. O conceito agora serve ao trabalho real e a comparação é honesta. O que falta
é decisão de produto do founder — manter esta versão, voltar à Anatomia ou combinar partes — não
mais uma camada de acabamento antes de olhar.

**AI-slop score:** A. Sem gradientes de enfeite, excesso de cor, copy grandiosa, dashboard genérico
ou pergunta falsa para IA.
