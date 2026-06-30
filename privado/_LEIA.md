# /privado — só na tua máquina, nunca no git

Esta é a **única** zona onde dado pessoal pode existir — e ela **nunca** é versionada (está no `.gitignore`).

Coloque aqui qualquer coisa com **PII**: e-mail, telefone, nome de cliente, @, CPF/CNPJ, prints de conversa, listas de contato.

**Por quê:** o resto do cérebro é um repositório git. O que entra no git fica no histórico **pra sempre** — mesmo apagando o arquivo depois. Por isso PII mora aqui, fora do git, e some de verdade quando você apaga.

> Regra prática: tem o nome de uma pessoa real? É aqui. É padrão anônimo ("cliente de e-commerce que reclama de frete")? Pode ir pras notas de `meu-negocio/`.
