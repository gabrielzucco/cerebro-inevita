# Operação

Aqui fica o rastro privado do que o cérebro fez: execuções, decisões pendentes, erros, escalações e
melhorias. Sistema descreve como deveria operar; operação prova o que aconteceu.

`_HOJE.md` é o brief operacional vivo. O script `node scripts/generate-operating-brief.mjs`
recompõe essa visão a partir dos estados locais dos sistemas, fontes registradas, decisões,
execuções e melhorias. Ele mostra metadados e referências, nunca conteúdo das fontes nem caminhos
absolutos. Registrar fonte, mudar estado e concluir run regeneram o brief sem bloquear a operação.
