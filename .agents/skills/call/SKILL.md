---
name: call
description: Ingere uma call/reunião (transcrição colada ou arquivo) e destila em átomos — decisões, objeções, números, compromissos — com citação e timestamp. Use quando a pessoa cola uma transcrição, diz "trata essa call" ou "acabei de sair de uma reunião". Idealmente em até 48h da call.
---

# Call — da reunião aos átomos (SLA: 48h)

Uma call de 1h tem 3-6 átomos escondidos em 8.000 palavras de ruído. Seu trabalho: achar o sinal, provar com citação, e a pessoa só aprova.

1. **Receba a transcrição** (colada ou apontada). Pergunte só o que falta de cabeçalho: *com quem foi? sobre o quê?* Se a pessoa tem só o áudio/vídeo, oriente: transcreva no notetaker/ferramenta dela e cole aqui — você opera texto.
2. **Salve o bruto primeiro** em `capturas/call-<assunto>-AAAA-MM-DD.md` com cabeçalho (data, participantes por papel, tema). O bruto é imutável — nunca edite depois.
3. **Sanitize PII** (regra 5): nomes de clientes/pessoas privadas viram papel ("o cliente", "a head de vendas"), contatos ficam de fora ou em `privado/`.
4. **Garimpe por tipo, nesta ordem** — pra cada achado, um átomo com citação literal + timestamp:
   - **Decisões** (o mais perecível — foi decidido algo? por quem?)
   - **Compromissos** (quem prometeu o quê pra quando)
   - **Objeções/dores ditas pelo cliente** (nas palavras DELE — é ouro de copy)
   - **Números** (preço citado, prazo, métrica)
   - **Frases que funcionaram** (o que destravou a conversa)
5. **Apresente os átomos de uma vez e confirme** — *"achei estes N; guardo assim?"*. Ela corta/ajusta; só grave após o ok.
   - **Call longa (60+ min):** o teto de átomos protege o foco mas esconde a cauda. Garimpe normal e ofereça a segunda passada: *"achei N átomos principais; ficaram M candidatos na reserva"* — liste os reservas em 1 linha cada e ela escolhe quais promover.
   - **Aula/live/palestra (formato didático — uma pessoa expondo, com frameworks e passos):** ofereça a rota dupla: além dos átomos operacionais, grave um **destilado-nota** estruturado (o esqueleto da aula: tese, passos, exemplos) numa seção `## Destilado` no TOPO do próprio arquivo do bruto. Átomo serve à operação; destilado serve ao estudo.
6. **Roteie**: decisões → `decisoes/` · objeções e frases → `o-que-funciona.md` ou `icp.md` · assunto em andamento → `fios/`. No fio correspondente, acrescente uma linha linkando a call.
7. **Atualize o eixo pessoa**: a call foi com alguém que importa (cliente-chave, parceiro, concorrente)? Atualize/crie a página em `gente/` — estado atual + link pra esta call. (Pessoa privada = papel, nunca nome+dados.)

Regras: **citação literal com timestamp, sempre** — sem prova, não é átomo · call sem sinal existe (registre só o bruto e diga isso) · nunca despeje a transcrição inteira no raciocínio das respostas futuras — os átomos são o caminho; o bruto fica pra drill-down.

Armadilhas de transcrição automática (não caia):
- **Citação ≠ endosso.** Se a pessoa cita algo PRA DISCORDAR (*"tem gente que fala X — isso é mentira"*), o átomo registra a POSIÇÃO dela, nunca o X solto como se fosse afirmação.
- **Números de transcrição automática são suspeitos** até confirmação ("oitenta e seis" vs "86… 8?"). Número ambíguo no verbatim → pergunte antes de gravar; nunca vire átomo no chute.
- **Nomes próprios erram muito** (whisper troca nome de gente/empresa). Nome estranho no contexto → sinalize *"confirma esse nome?"* em vez de propagar.
- **Compromisso condicional ≠ compromisso.** *"Se der, a gente faz"* registra como possibilidade, não como promessa com dono e prazo.
