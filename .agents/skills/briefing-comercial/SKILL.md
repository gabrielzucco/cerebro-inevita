---
name: briefing-comercial
description: Prepara uma reunião comercial com contexto citável e fecha a call em objeções, compromissos, riscos, próximo passo e diff de CRM para aprovação. Use quando a pessoa pedir briefing pré-call, preparação de conta, fechamento de reunião comercial ou atualização da oportunidade depois da conversa.
---

# Briefing comercial

## Resolver o modo

Leia `sistemas/outros-instalados/briefing-comercial-inteligente/manifest.md`, `pipeline.md` e
`evals.md`. Se o sistema não estiver instalado, pare e oriente:

`node scripts/install-system.mjs briefing-comercial-inteligente --confirm`

Escolha pelo pedido:

- **antes da call:** gerar briefing citável;
- **depois da call:** preparar fechamento e diff do CRM;
- **ciclo completo:** fazer os dois sem misturar fato anterior com fala da reunião.

Leia `meu-negocio/mapa.md`, `conexoes/_CATALOGO.md` e as conexões já configuradas. Não presuma que
encontrar uma fonte autoriza seu uso. Se o pacote acabou de ser adicionado, rode
`node scripts/system-state.mjs briefing-comercial-inteligente configuring`, mostre o que já existe e
complete `configuracao.md` com a pessoa antes do primeiro run.

## Preparar antes da call

1. Pergunte qual é a reunião e qual fonte comercial pode ser lida. Uma pergunta por mensagem.
2. Use somente fontes que a pessoa apontar ou aprovar. Importação manual é válida; integração não
   é requisito.
3. Separe em: objetivo, estágio atual, fatos novos, histórico essencial, uso/suporte quando houver,
   riscos, lacunas e perguntas recomendadas.
4. Cite arquivo, registro ou trecho para todo fato que possa mudar a abordagem. Se não constar,
   escreva `(não consta na fonte)`.
5. Mostre o briefing antes de gravar. Só salve após aprovação.

## Fechar depois da call

1. Preserve a transcrição como fonte; não trate resumo como evidência.
2. Extraia mudança de estágio, necessidade, objeções, compromisso de cada lado, risco e próximo
   passo. Ação sem dono ou data vira pendência.
3. Compare com o estado anterior e apresente um **diff**, nunca uma atualização silenciosa.
4. Peça aprovação antes de escrever no Cérebro ou no CRM. Se não houver conector autorizado,
   entregue o diff pronto para aplicação humana.

## Aplicar a régua e fechar

Rode os gates de `evals.md`. Pergunte: **“Você usaria isso na reunião ou mudaria alguma coisa
antes?”** Faça uma correção concreta se necessário.

Grave o recibo em `operacao/execucoes/<run-id>.md`, sem copiar segredos para o recibo. Registre
correções em `feedback.md`. Três falhas comparáveis candidatam mudança versionada; nunca altere a
skill silenciosamente.

Ao começar o caso real, rode:

`node scripts/system-run.mjs briefing-comercial-inteligente start`

Depois dos gates e da resposta humana, conclua:

`node scripts/system-run.mjs briefing-comercial-inteligente complete --eval=<pass|fail> --decision=<approved|changes_requested|rejected>`

O script cria o `run-id`, registra o recibo local e só ativa a instalação quando eval e humano
aprovam. Falha de fonte, permissão ou régua vira `needs_attention`; pacote copiado nunca equivale a
sistema ativo.
