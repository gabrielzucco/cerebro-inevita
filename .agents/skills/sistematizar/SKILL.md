---
name: sistematizar
description: Transforma um trabalho recorrente observado em Sistema local com contrato, pipeline, CONFIGURAÇÃO, régua e primeiro run. Use depois do Architect ou quando a pessoa quer sistematizar uma decisão, venda ou entrega; não use para apenas organizar notas ou conectar ferramentas.
---

# Sistematizar — trabalho real vira Sistema proprietário

## Resultado

Deixe um Sistema **configuring** em `sistemas/outros-instalados/<system-id>/`, registrado no control
plane e pronto para o primeiro `/operar`. Não entregue só mapa, prompt, automação ou pasta de
templates.

O caminho normal é:

`Cérebro Base T4 → resultado confirmado → caso real observado → contrato aprovado → pacote local → primeiro run`

## 1. Reutilizar antes de perguntar

Leia somente o necessário:

- o último T4 em `.cerebro/concierge-runs/` ou o estado ativo do Cérebro Base;
- `meu-negocio/mapa.md` e o recorte relevante;
- o Architect spec V2 mais recente em `operacao/arquitetura/`, quando existir;
- `conexoes/configuradas/fontes.json`, sem abrir fontes;
- um System Brief ou fio quente ligado ao resultado.

Não repita onboarding geral. Se ainda não há T4, você pode organizar um **System Brief proposto**,
mas não instalar nem registrar o Sistema. O próximo passo único é terminar `/comecar`.

## 2. Fixar o resultado antes das ferramentas

Confirme, nas palavras do dono:

- resultado completo;
- o que não conta como sucesso;
- output verificável;
- dono e decisão que continua humana;
- setpoint ou condição mínima de aceitação.

Se a resposta for “organizar dados”, “usar IA”, “automatizar” ou “conectar sistemas”, continue até
aparecer o que melhora em decisão, venda ou entrega.

## 3. Observar um caso recente

Peça **um** rastro recente do trabalho e autorização para lê-lo. Use `/fonte` para tratar somente
até o nível necessário. Reconstrua o caminho atual, inclusive retornos, exceções e compensações
manuais.

Separe:

- `declared:` o que o responsável contou;
- `observed:` o que o caso sustenta;
- `gap:` o que ainda não está provado.

**Registrar fonte ≠ conectar fonte.** Não ingira CRM, Drive, WhatsApp ou outro sistema inteiro.

## 4. Desenhar a versão manual

Leia [o schema de comissionamento](references/commissioning-spec.schema.json) antes de escrever o
spec. Preencha as oito unidades do Sistema e também:

- entidades que atravessam a jornada por IDs opacos;
- fontes por papel, fonte de verdade, acesso, frescor e propósito;
- fronteira local/derivável/proibida;
- baseline honesto — `nao-medido` é melhor que número inventado;
- uma rotina manual ligada ao trigger real.

Não crie conexão, agenda ou ação externa. Não transforme o primeiro caso numa skill especializada:
o `skill-contract.md` declara o julgamento; promoção para motor exige três runs comparáveis, replay
e aprovação humana.

Quando o trabalho for costurar aquisição→venda→onboarding→entrega→atendimento, leia também
[o exemplo Jornada ponta a ponta](references/jornada-ponta-a-ponta.example.json). Copie a estrutura,
nunca o conteúdo: etapas, fontes e setpoint precisam vir da operação observada.

## 5. Mostrar e obter o gate

Antes de gravar, mostre em linguagem simples:

1. resultado e não-sucesso;
2. pipeline atual observado;
3. fontes registradas e o que cada uma sustenta;
4. decisões humanas e fronteiras;
5. eval, baseline e lacunas;
6. o que continuará manual no primeiro run.

Pergunte: **“Esse é o trabalho como ele acontece hoje e essa régua define um resultado que você
usaria? O que precisa mudar antes de instalar?”**

Sem aprovação, corrija o spec. Não use `--confirm`.

## 6. Instalar sem conectar

Grave o spec aprovado em:

`operacao/arquitetura/<AAAA-MM-DD>-<system-id>.commissioning-spec.json`

Primeiro rode a prévia:

```bash
node scripts/commission-system.mjs operacao/arquitetura/<arquivo>.commissioning-spec.json
```

Depois da confirmação humana, rode:

```bash
node scripts/commission-system.mjs operacao/arquitetura/<arquivo>.commissioning-spec.json --confirm
```

O scaffold valida o spec, T4, evidência local, PII óbvia e contratos; cria o pacote proprietário,
protege CONFIGURAÇÃO/feedback, atualiza o catálogo e registra estado `configuring`. Sem Node,
execute a mesma escrita manual seguindo o schema e valide cada campo; scripts não podem bloquear a
entrega, mas a ausência de T4 ou evidência bloqueia a instalação.

## 7. Operar agora

Ofereça um próximo passo único: rodar o mesmo trabalho ponta a ponta com `/operar <system-id>`.
O primeiro run precisa de entidade, fonte, output, eval e decisão humana. Run aprovado deixa o
Sistema local `active`, mas ainda **beta**. Só confirme primeira vitória quando o dono disser que
usaria ou usou o output na operação.

Depois de três runs comparáveis, proponha somente a menor mudança sustentada: conexão de leitura,
rotina por evento, skill especializada, gate ou eval. Escrita externa, agenda, publicação e mudança
do motor continuam exigindo aprovação própria.
