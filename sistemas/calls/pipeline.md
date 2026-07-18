# Pipeline — Calls em Decisões

| Estado | Entrada | Saída | Gate |
|---|---|---|---|
| recebida | transcrição real | fonte identificada | existe texto legível |
| sanitizada | fonte | bruto sem PII desnecessária | nomes/contatos privados removidos |
| extraída | bruto | decisões, ações, dores, números e evidências candidatos | tudo aponta para trecho literal |
| revisada | candidatos | correções do dono | humano confirma sentido, dono e prazo |
| gravada | aprovados | átomos + rotas | nenhuma escrita antes do ok |
| avaliada | artefato | resultado da régua | pessoa confirma se ajuda a agir |
| encerrada | eval | recibo + ping mínimo | conteúdo nunca sai no ping |

Se o eval falhar, faça uma correção guiada e rode a régua uma vez de novo. O feedback fica em
`feedback.md`; três falhas comparáveis candidatam mudança do sistema, nunca autoedição silenciosa.

