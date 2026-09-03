# Story — Company Brain: Central de Atualizações V1

## Contexto

O Console já consegue reconhecer um Cérebro compatível, compilar contratos e apresentar o
catálogo local da Society. Ainda faltava, porém, distinguir três versões que não são a mesma
coisa: a versão da instalação privada da empresa, a versão do motor/Console que a opera e a
versão do catálogo da rede.

Essa diferença é especialmente importante no Cérebro privado da INEVITA: ele é compatível com o
protocolo, mas roda sobre um checkout de desenvolvimento e não está aderido ao canal empacotado de
atualização. A interface não pode transformar compatibilidade em uma falsa promessa de atualização
automática.

## Acceptance criteria

- [x] `Cérebro` possui uma área `Atualizações` e mantém as cinco áreas existentes funcionais.
- [x] A navegação mostra a versão da instalação sem confundi-la com a versão do motor.
- [x] A Central separa `Cérebro da empresa`, `Motor & Console` e `Society`.
- [x] Perfil, distribuição, runtime, Brain Manifest e compatibilidade aparecem como fatos locais.
- [x] A verificação remota só acontece após ação explícita da pessoa.
- [x] O check consulta somente metadados da última release e não envia contexto, Fontes ou outputs.
- [x] `Atualizar agora` só aparece para instalação empacotada, com source e updater locais, fora de
      um checkout Git.
- [x] O Cérebro privado da INEVITA aparece como compatível, mas ainda não gerenciado pelo canal de
      releases; a UI não oferece mutação insegura.
- [x] Atualização gerenciada exige confirmação, usa release publicada e preserva os caminhos do
      dono já protegidos pelo updater.
- [x] O catálogo da Society mostra sua versão de distribuição e explica que chega junto do motor,
      sem afirmar sincronização de conteúdo privado.
- [x] Testes cobrem instalação privada, instalação gerenciada, check de release, apply injetado e
      os contratos estruturais da interface.

## Fora deste corte

- Migrar automaticamente o vault privado da INEVITA para uma instalação empacotada.
- Atualizar checkout Git, resolver merge ou sobrescrever mudanças locais.
- Sincronizar contexto, Fontes, outputs, julgamentos ou credenciais com a Society.
- Atualizar Sistemas instalados de forma independente do catálogo.
- Criar daemon, conta cloud ou atualização silenciosa em segundo plano.

## Tarefas

- [x] Criar read model de versão e canal de atualização.
- [x] Expor status, check e apply pelo servidor local com sessão, CSRF e confirmação.
- [x] Criar a área `Atualizações` no Brain nav com divulgação progressiva.
- [x] Endurecer o updater do Console para exigir release publicada.
- [x] Adicionar testes e rodar regressões proporcionais ao risco.
- [x] Registrar recibo da mesa.

## File List

- `docs/stories/2026-08-28-company-brain-update-center-v1.md`
- `scripts/lib/brain-update-center.mjs`
- `scripts/console-server.mjs`
- `scripts/update.mjs`
- `console/app.js`
- `console/styles.css`
- `scripts/test-company-brain-update-center-v1.mjs`

## Verificação

- Sintaxe de `console/app.js`, `scripts/console-server.mjs`, `scripts/update.mjs` e do novo módulo:
  verde.
- Teste novo, contrato dos dois updaters, visão vivida e 15 regressões de Cérebro/Society: verdes.
- `npm test`: verde — 22 envelopes, três Sistemas e 33 arquivos de Skills sincronizados.
- Cockpit oficial em `127.0.0.1:4782`: desktop e mobile sem erro de Console ou overflow horizontal.
- O QA mobile encontrou e fechou um gap: depois do render, a barra horizontal agora centraliza a
  aba ativa.
- Check real e explícito: release pública `v1.33.0` observada; o Cérebro privado permaneceu sem
  botão de apply por estar protegido como checkout e fora do canal gerenciado.
