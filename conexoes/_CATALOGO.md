# Conexões

O cérebro funciona **local-first** sem nenhuma conexão paga. Uma conexão só aproxima uma fonte real;
ela não substitui sistema, pipeline ou aprovação. O motor vai até o contexto; o contexto não precisa
mudar de casa para caber no motor.

## O que funciona agora

| Origem | Estado inicial | Comportamento real |
|---|---|---|
| arquivos dentro do Cérebro | ativa | leitura e escrita conforme cada sistema |
| pasta local aprovada | disponível | referência privada, leitura sob demanda e atualização manual |
| Obsidian aprovado | disponível | lê somente os arquivos necessários; o vault continua no lugar |
| repositório Git aprovado | disponível | lê somente os arquivos necessários; não altera o repositório-fonte |
| pasta de reuniões aprovada | disponível | começa por uma reunião; não importa o histórico inteiro |
| Drive, Notion, CRM e outras APIs | não instaladas por padrão | exigem conector real, escopo e consentimento próprios |

`scripts/discover-context.mjs` faz uma descoberta limitada: inspeciona nomes de pastas e marcadores
técnicos, sem ler conteúdo. Encontrar não autoriza usar. A pessoa escolhe primeiro.

Depois da aprovação explícita, `scripts/register-source.mjs` grava somente uma referência em
`conexoes/configuradas/fontes.json`. Esse arquivo:

- fica apenas na máquina e não entra no Git;
- registra caminho, tipo, finalidade, sensibilidade e modo de atualização;
- mantém a fonte original como fonte de verdade;
- permite somente leitura e atualização manual;
- não guarda credenciais nem conteúdo da fonte;
- não cria sincronização, indexação contínua, cópia ou migração.

Credenciais não entram em notas ou no Git. Integrações futuras precisam declarar o que leem, o que
escrevem, quando atualizam e como a pessoa revoga o acesso antes de serem apresentadas como ativas.
