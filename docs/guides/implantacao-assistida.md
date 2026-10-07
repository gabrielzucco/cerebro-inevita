# Preparar meu Cérebro

O assistente de implantação já está incluído na [release oficial v1.39.0](https://github.com/gabrielzucco/cerebro-inevita/releases/tag/v1.39.0).
Ele acompanha a pessoa desde a escolha da pasta até o primeiro trabalho usando os dados do negócio.
A plataforma entrega a instrução ao agente local. O MCP da comunidade entra depois, para consultar
e instalar sistemas, quando estiver configurado e o acesso permitir.

## Escolher de onde começar

- **Começar do zero:** o agente confirma uma pasta nova e uma versão publicada do Cérebro.
- **Já uso o Cérebro INEVITA:** o agente confere a versão instalada e prepara a atualização oficial,
  com prévia, preservação do contexto e aprovação antes de aplicar. Depois, retoma `comecar`.
- **Tenho um Cérebro artesanal:** o agente verifica somente a estrutura autorizada, seja um cofre
  de Obsidian ou outra organização. O acervo pode continuar onde está, como referência, ou ter
  uma parte copiada para uma instalação INEVITA separada, depois de um plano aprovado.
- **Continuar a implantação:** o agente recupera a escolha, as evidências e a próxima tarefa,
  sem tratar uma interrupção como motivo para reinstalar.

No agente, basta dizer “prepare meu Cérebro” ou “continue de onde parei”. Ele segue
`COMECE-AQUI.md` e a skill `comecar` na conversa atual. Quem usa uma versão INEVITA anterior
deve seguir o caminho seguro de atualização de [COMECE-AQUI.md](../../COMECE-AQUI.md), usando
o planejador da versão publicada e a base da versão instalada. Não execute o updater antigo
nem aplique a atualização sobre uma pasta artesanal.

Os comandos de instalação, atualização e MCP deste percurso usam Node.js 20 ou mais recente.
O assistente pode começar a conversa e o trabalho local antes de configurar serviços externos.

## Aproveitar o que já existe

O acervo pode continuar no lugar original, como fonte autorizada. Se a pessoa preferir migrar,
`migrar-cerebro` apresenta o mapa antes da cópia: o que entra, o que fica como referência, o que
está duplicado, o que exige revisão e onde será guardado. A origem permanece intacta.

Instruções e agentes antigos são examinados separadamente do conteúdo do negócio. Um documento
encontrado não pode substituir automaticamente as regras do protocolo. CRM, banco e Drive entram
como fontes externas; a migração de arquivos não conecta esses serviços.

## Vincular a conta e conectar a comunidade

Depois de instalar ou atualizar, o agente confere o resultado da ativação pela sua conta na
plataforma. Informar um e-mail, clonar o repositório ou instalar os arquivos não comprova o vínculo
seguro necessário ao MCP. A credencial de instalação fica local e não deve ser colada na conversa.

Com o vínculo confirmado e acesso vigente à Society, siga [Conectar o MCP](community-mcp.md#conectar).
O gerador prepara a configuração para o cliente de IA; a conexão precisa ser adicionada nesse
cliente. Essa etapa não substitui a primeira entrega do Cérebro nem a configuração das fontes de
cada sistema. Sem o vínculo, o trabalho local continua disponível.

## Preparar somente as fontes necessárias

O agente começa pelo trabalho que a pessoa quer fazer. Para a fonte necessária, esclarece onde
fica o original, a finalidade, quem autoriza, os limites de leitura, quem vai usar e como conferir
se o material está atualizado. Essas escolhas formam o contrato da fonte.

Há quatro estados diferentes:

| Estado | O que foi demonstrado |
|---|---|
| Fonte identificada | Sabemos onde ela está e por que pode ser útil. |
| Contrato definido | Finalidade, autoridade e limites foram registrados. |
| Acesso testado | Uma leitura autorizada funcionou, com data e referência da prova. |
| Fonte usada | O trabalho consumiu a fonte e produziu um resultado verificável. |

Uma fonte manual pode atender ao primeiro trabalho. Atualização automática depende de conector,
rotina e evidência de execução próprios. Ter um contrato não comprova nenhuma dessas três coisas.

## Fazer o trabalho e escolher sistemas

O primeiro trabalho usa uma amostra real, recebe a revisão do dono e guarda a correção aprovada.
O segundo trabalho verifica se o Cérebro aproveitou esse contexto. A instalação dos arquivos e o
vínculo da conta continuam separados dessa prova de uso.

O arquiteto pode diagnosticar oportunidades quando solicitado. A instalação de um novo sistema
segue os requisitos do pacote e do protocolo. A recomendação distingue sistema já instalado,
release disponível para a conta, piloto acompanhado e proposta ainda sem pacote. Um card na
vitrine não é prova de disponibilidade.

## Se o processo parar

O agente recupera o ponto de retomada em `operacao/decisoes-pendentes/onboarding.md`, quando esse
registro foi autorizado, e confere os artefatos atuais antes de continuar. O registro guarda
decisões e referências, sem credenciais ou cópia do conteúdo privado. Nenhum marco de ativação é
criado só porque foi escrito nesse arquivo.

Downloads, migração, fontes ou sistemas pendentes aparecem com a próxima ação concreta. A pessoa
não precisa repetir uma escolha que já fez nem percorrer uma entrevista inteira para retomar.
