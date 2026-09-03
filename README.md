# Cérebro INEVITA

**O segundo cérebro de negócio que roda local, dentro do agente de IA que tu já usa.**

[![CI](https://github.com/gabrielzucco/cerebro-inevita/actions/workflows/ci.yml/badge.svg)](https://github.com/gabrielzucco/cerebro-inevita/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/gabrielzucco/cerebro-inevita?label=vers%C3%A3o&color=C5A35A)](https://github.com/gabrielzucco/cerebro-inevita/releases)
[![Motor: MIT](https://img.shields.io/badge/motor-MIT-green)](LICENSE)
[![Conteúdo: CC BY-NC 4.0](https://img.shields.io/badge/conte%C3%BAdo-CC%20BY--NC%204.0-blue)](LICENSE-CONTEUDO.md)
[![Agentes](https://img.shields.io/badge/agentes-Hermes%20%C2%B7%20Codex%20%C2%B7%20Claude%20Code%20%C2%B7%20Gemini-black)](#comece-em-2-minutos)

Não é uma pasta pra tu baixar e esquecer. É um sistema local que lê fontes reais,
aprende teu contexto e começa a operar contigo. A IA já é boa — e é a mesma pra todos.
O que falta é **contexto**: o que tu vendes, pra quem, o que já funcionou. As empresas
do Vale organizam esse contexto religiosamente. Este repositório é o método, aberto.

## O momento em que tu entende

Sem o Cérebro:

> **Tu:** "Como eu aumento a margem do meu negócio?"
> **IA:** "Existem várias estratégias: 1. Reduza custos. 2. Aumente preços. 3. Otimize processos…"
>
> *Um template. Serve pra qualquer empresa — ou seja, pra nenhuma.*

Com o Cérebro instalado, o mesmo agente responde a partir das **tuas** fontes — teu
histórico, tuas calls, teus números — e cita de onde tirou cada afirmação, com fonte e
minutagem. A resposta deixa de ser genérica porque o contexto deixou de ser.

## Comece em 2 minutos

```bash
git clone https://github.com/gabrielzucco/cerebro-inevita meu-cerebro
```

Requisito para usar a distribuição: **Node.js 20+**. O bundle visual já vem pronto e não exige
`npm install`; as dependências de desenvolvimento só são necessárias para quem vai recompilar o
Canvas. Funciona em macOS, Linux e Windows.

Abre a pasta no teu agente e diz **"quero começar"**:

| Ambiente | Entrada |
|---|---|
| Claude Code | `/comecar` |
| Codex | `$comecar` ou "quero começar" |
| Gemini CLI (grátis) | "quero começar" |
| Antigravity (grátis) | "quero começar meu cérebro" |
| Hermes | "quero começar" — inclusive pelo Telegram |
| Outro agente local | ler `.agents/skills/comecar/SKILL.md` |

O agente conduz o resto: primeira vitória em minutos, teu negócio dentro em seguida.
Guia completo em [`COMECE-AQUI.md`](COMECE-AQUI.md) · método em [`METODO.md`](METODO.md).

## Primeiras vitórias (escolhe uma)

- **Perguntar ao acervo do Vale** — resposta verificável nas fontes reais, não um apanhado da internet.
- **Aplicar no meu negócio** — "me mostra uma decisão que estou tomando sem evidência suficiente".
- **Transformar uma call em trabalho** — decisões, pendências com dono, contexto que volta na próxima.
- **Criar com a minha voz** — a peça nasce do teu contexto, tu ajusta em vez de reescrever.

## Cockpit INEVITA (opcional)

É a versão local e portátil do mesmo Console usado pela operação da INEVITA. Mostra a anatomia do
cérebro, workspaces de Sistemas, Skills, Canvas, Julgamentos, Runs, Fontes, Experimentos,
compatibilidade, governança e saúde — sempre derivados dos arquivos e recibos locais. A sessão
privada, o banco e o control plane da KOSMOS não fazem parte desta distribuição.

O Cockpit também leva o cérebro ao Telegram em três gestos: você autoriza o Codex, cola o token
criado no BotFather e confirma a conta que enviou `/start`. Instalação do Hermes, vínculo do
contexto, allowlist, serviço e diagnóstico ficam com o Cockpit — sem criar outro banco nem enviar
teu contexto para a INEVITA:

```bash
node scripts/cockpit.mjs
```

Ele abre no navegador em `127.0.0.1`; `--demo` apresenta um estado controlado, sem credenciais,
escritas ou comandos reais. A ativação real é feita depois da aula.
Navegar não chama modelo. `Rodar agora`, ativar, pausar ou retomar
exigem confirmação; uma agenda importada continua bloqueada até a agenda antiga ser pausada. A
Caixa de Julgamento abre um output somente por gesto explícito e registra aprovar, pedir ajuste,
rejeitar ou propor uma ação. Um ajuste pode autorizar um novo Run, comparar baseline × resultado e
criar um candidato de aprendizado `1/3`; nada disso altera o motor ou executa ação externa.

Guia de uso, segurança e roteiro de aula: [`COCKPIT.md`](COCKPIT.md).

## O que vem dentro

```
conhecimento/   acervo do Vale, imersão e comunidade — com fonte e minutagem
sistemas/       trabalho recorrente vira Sistema: roda, deixa rastro, melhora
skills/         os comandos que o agente executa (/comecar, /daily, /sistematizar…)
meu-negocio/    TEU contexto — nasce vazio, é o que dá vida ao resto
protocol/       contratos que mantêm tudo auditável (Capability, Run Record…)
console/        Cockpit localhost, derivado dos mesmos contratos e recibos
```

## Privacidade e telemetria — sem letra miúda

**Local-first de verdade:** teu conteúdo, tuas fontes e teus outputs vivem na tua máquina e nunca
vão para a INEVITA. Quando tu executa um Sistema com Codex ou Claude, somente o contexto necessário
atravessa o provider escolhido para inferência; esse envio exige gesto explícito e não entra no
Git, na telemetria ou nos recibos.

O que existe é telemetria **técnica de ativação** ([código aberto aqui](.agents/scripts/ping.mjs)):
eventos como `instalou`/`comecou`/`system_activated`, versão e sistema operacional. Se tu
instalaste pelo funil da INEVITA, teu e-mail/member-id acompanham o evento — é o que liga
teu progresso à tua conta na plataforma. Conteúdo, nunca.

Desligar é uma linha, e o agente respeita:

```bash
export CEREBRO_TELEMETRY=off        # ou: touch .cerebro/sem-telemetria
```

## Comunidade

- **[Discussions](https://github.com/gabrielzucco/cerebro-inevita/discussions)** — mostra teu
  Cérebro rodando, pergunta, propõe.
- **[Grupo no WhatsApp](https://chat.whatsapp.com/FyEWHhKdoKY5QLZnlnvFoi)** — destrave de instalação
  com quem já passou por ela.
- **[INEVITA Society](https://inevitasociety.com)** — a rede que valida Sistemas em lote,
  julga execuções e distribui capacidade em cima da base aberta.

## Versões

Release atual em [Releases](https://github.com/gabrielzucco/cerebro-inevita/releases) ·
histórico completo e honesto em [`CHANGELOG.md`](CHANGELOG.md).

## Licença

**Motor MIT** (usa, modifica, redistribui) · **conteúdo CC BY-NC 4.0** (usa e adapta no teu
Cérebro; não revende). Mapa exato em [`LICENSE-CONTEUDO.md`](LICENSE-CONTEUDO.md).
O que tu escreves dentro do teu Cérebro é teu, integralmente.

---

### English

**Cérebro INEVITA is an open-source Company Brain**: a local-first second brain for your
business that runs inside the AI agent you already use (Claude Code, Codex, Gemini CLI,
Antigravity). Your context stays on your machine; the agent answers from your real sources
with citations. English starter: [`dist/company-brain-starter-en.zip`](dist/company-brain-starter-en.zip).
Docs are in Brazilian Portuguese — the agent speaks whatever language you do.
