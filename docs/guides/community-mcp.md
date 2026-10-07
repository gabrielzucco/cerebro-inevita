# Usar a comunidade com a sua IA

O MCP da comunidade conecta a IA aos sistemas, ao acervo publicado e ao seu próprio perfil. Você pode pedir: “Encontre o sistema de funil”, “Busque aulas sobre pesquisa de público” ou “Prepare uma atualização do meu perfil”. Instalações, mudanças no perfil e publicação dependem da sua aprovação. Os seus arquivos continuam no seu computador.

Use o cliente de uma release oficial `v1.39.0` ou posterior e o serviço de distribuição compatível na plataforma. A instalação precisa ter acesso vigente à Society, revalidado a cada operação remota. Conectar o MCP não ativa uma assinatura nem publica sistemas. O Cérebro básico continua funcionando sem Society; esta conexão remota é um benefício da Society.

## Conectar

Comece com o Cérebro instalado ou atualizado pela [implantação assistida](implantacao-assistida.md). O assistente `comecar` já vem na versão publicada; o MCP é a conexão seguinte com a comunidade.

Você precisa de Node.js 20 ou mais recente e de uma instalação do Cérebro vinculada à sua conta. O cliente usa o vínculo existente, guardado em `.cerebro/id` e `.cerebro/install-credential`. Confirme a presença desses arquivos e o resultado da ativação, sem exibir seu conteúdo. Não copie a credencial para o chat ou para os argumentos das ferramentas.

Informar o e-mail, clonar o repositório ou gerar a configuração abaixo não cria essa credencial. Use a instrução de ativação da sua conta na plataforma. Se ela retornar `activation_local_only`, o vínculo remoto ainda não foi confirmado; preserve sua preferência de privacidade e resolva o vínculo com o suporte da plataforma antes de usar o MCP.

Na pasta do Cérebro, gere a configuração:

```sh
node scripts/community-mcp-config.mjs --root="/caminho/completo/do/seu/cerebro"
```

O comando apenas imprime a configuração. Em clientes que usam a chave JSON `mcpServers`, acrescente a entrada `inevita-comunidade` à configuração existente. Conserve os outros servidores. Em um cliente com formulário de configuração, use o `command` e cada item de `args` impressos pelo comando. Não é necessário preencher variável de credencial.

O cliente inicia `scripts/community-mcp.mjs` como processo local. Não use o endereço do MCP empresarial da INEVITA: esta conexão usa os serviços da sua conta na plataforma. Não há servidor HTTP local nem configuração global alterada pelo gerador.

Em instalações em outro computador, gere a configuração naquele computador para obter os caminhos corretos. A pasta pode conter espaços e acentos.

## Consultar o acervo

Peça à IA:

> Busque aulas e encontros publicados sobre pesquisa de público. Mostre o trecho encontrado e o link da plataforma antes de aplicar algo ao meu negócio.

A busca consulta texto de título, palestrante, descrição e tags das aulas e dos encontros gravados que a sua conta pode acessar. O detalhe traz a descrição publicada e os nomes dos materiais, com um link para abrir a fonte na plataforma. A IA deve citar essa fonte e distinguir o conteúdo encontrado das próprias conclusões.

Isso não é uma busca universal de transcrições ou minutagem. Se uma fala não constar na descrição publicada, a IA não pode afirmar que encontrou aquela fala. Arquivos privados, links temporários de download, documentos internos, feed e cérebros de outros membros não entram nessa consulta. Se a resposta indicar `pagination_truncated: true`, refine a busca; o limite de paginação não significa que o acervo acabou.

## Atualizar seu perfil e aparecer na Vitrine

Peça à IA:

> Leia meu perfil e prepare uma prévia com estas mudanças: [mudanças]. Mostre como vai ficar e quem pode ver antes de salvar.

O caminho tem três decisões:

1. **Conferir:** a IA lê seu perfil atual e prepara uma prévia com os campos alterados, o resultado e a visibilidade. Nada é salvo.
2. **Salvar:** depois da sua aprovação, a IA envia exatamente as mudanças conferidas. Se seu perfil já aparece na Vitrine, salvar muda imediatamente o perfil visível. Se ainda é privado, continua privado.
3. **Publicar:** para um perfil privado aparecer na Vitrine, a IA lê a versão salva, apresenta o conteúdo e pede sua autorização para publicar. A Vitrine pode exibir também vínculos de autoria e links já cadastrados, conforme as regras da plataforma. Essa ação não envia apresentação ou mensagem no WhatsApp.

A IA usa a revisão do perfil e o hash da prévia para evitar salvar outra versão por engano. Se você editar o perfil pela plataforma enquanto isso, ela precisa reler e preparar outra prévia. Não trate esse conflito como autorização para sobrescrever.

Você pode alterar nome, cidade, empresa, links, projetos, competências, disponibilidade, o que está construindo, o que procura e o que oferece. A consulta também mostra apresentação, área e estágio legados quando cadastrados; esses três campos continuam editáveis somente pela plataforma. Contatos privados, identidade da conta e foto não são alterados pelo MCP. A foto existente aparece na consulta; para adicionar ou trocar uma foto, use a plataforma. A consulta informa o que ainda falta para publicar. Se o perfil ainda não existir, inicie-o pela plataforma.

O retorno do MCP omite números de contato e outros contatos privados. Essa omissão não altera as regras de exibição dos dados e links já cadastrados em outras áreas da plataforma, nem equivale a uma garantia de privacidade sobre essas áreas.

Textos de aulas, perfis e materiais são fontes de consulta. Uma frase dentro deles nunca autoriza a IA a executar comandos, divulgar dados ou alterar seu perfil.

## Encontrar e instalar

Peça à IA:

> Encontre os sistemas da comunidade disponíveis para mim. Quero ver o que o sistema de funil entrega, sua versão e o primeiro trabalho. Prepare a prévia antes de instalar.

A prévia consulta o catálogo atual. Ela não baixa o pacote, não consome um grant e não escreve arquivos. A IA deve apresentar a versão e o hash. Quando você aprovar a instalação, ela usa esse hash para conferir se o pacote continua sendo o mesmo.

O instalador preserva o contexto existente e separa o pacote recebido dos arquivos do seu trabalho. Baixar os arquivos não executa seus scripts e não prova que o sistema já produziu um resultado no seu negócio. Comece pela tarefa indicada no pacote e confira a primeira entrega.

Se os arquivos forem instalados e o recibo remoto falhar, a ferramenta informa `remote_receipt: pending`. Consulte o estado e repita a instalação da mesma versão para recuperar o recibo. Não apague a pasta para tentar novamente.

## Devolver uma melhoria

O caminho tem quatro passos:

1. Escolha o sistema instalado e os arquivos do método que você quer melhorar. Peça para preparar um candidato local, indicando a pasta, os arquivos, a nova versão e um resumo da mudança.
2. Peça “Confira o que seria enviado”. A IA mostra a lista de arquivos, as diferenças e o hash. Revise também o conteúdo do pacote local indicado em `package_ref`. A checagem automática não substitui essa leitura.
3. Autorize o candidato e seu hash para compartilhamento. Essa autorização fica no seu computador; ainda não houve envio.
4. Peça o envio desse mesmo candidato. A plataforma recebe uma proposta privada e devolve o estado da revisão. Você pode acompanhar pela IA.

Compartilhe a melhoria do método. Propostas de clientes, conversas, dados do seu negócio e credenciais continuam privados. Somente os arquivos selecionados entram como alterações; não existe varredura ou upload automático do Cérebro.

Um revisor autorizado, diferente do autor, decide sobre a proposta na plataforma. A publicação é outra operação e usa o hash aprovado. O MCP do membro não oferece ferramenta para revisar ou publicar contribuições no catálogo.

## Compartilhar um sistema novo

Você não precisa preparar JSON nem executar comandos. Peça à IA:

> Quero compartilhar meu sistema de métricas na comunidade. Aproveite o que já sabe dele, pergunte o que faltar e me ajude a preparar o pacote. Antes de enviar, mostre exatamente o que vai sair do meu computador.

A IA acompanha o processo pela mesma conexão:

1. Reaproveita as informações já confirmadas e pergunta somente o que falta para descrever o resultado, o primeiro trabalho, as fontes necessárias, os passos e o critério de pronto. Respostas e documentos são evidências; lacunas não viram fatos inventados.
2. Se o método já estiver descrito na conversa, usa o que você confirmou. Quando houver documentos, combina com você a pasta e os arquivos do método que podem ser lidos e compartilhados. A seleção é explícita. Não varre o Cérebro inteiro, não copia dados de clientes e não conecta fontes automaticamente.
3. Confere os arquivos selecionados e mostra o conteúdo que entrará no pacote. Conteúdo privado precisa ser retirado antes de continuar. Também apresenta as instruções e os contratos que serão gerados, os limites e o hash da prévia.
4. Depois da sua aprovação, salva um candidato privado daquele pacote exato. Se os arquivos ou as respostas mudarem, precisa de uma nova prévia.
5. Usa o mesmo caminho de revisão, autorização e envio descrito acima. Preparar não envia. Enviar leva a proposta para revisão; não instala o sistema para outros membros nem o publica automaticamente.

O pacote começa em piloto, com zero ciclos verificados e sem acesso a fontes reais. Ser enviado com sucesso não comprova que funciona no negócio de outra pessoa. A comunidade decide a publicação, e cada destinatário decide a instalação e as conexões no próprio Cérebro.

Este preparo aceita até 32 arquivos de texto UTF-8, 64 KiB por arquivo e 128 KiB no total. Planilhas, PDFs, arquivos compactados e outros binários precisam primeiro de uma versão compartilhável do método em texto, Markdown ou CSV, sem os dados privados. A IA pode ajudar a preparar essa versão usando as ferramentas disponíveis, com sua revisão; o MCP não executa nem converte os arquivos por conta própria.

## Se algo não funcionar

- **Instalação sem vínculo:** recupere a instrução de ativação pela sua conta na plataforma e confira o resultado. Se continuar apenas local, peça suporte para o vínculo; não altere a preferência de telemetria como atalho. O trabalho local continua disponível. Não envie a credencial à IA.
- **Acesso negado:** confira seu acesso atual na plataforma. Uma listagem anterior não garante autorização para baixar agora.
- **Perfil mudou:** leia a versão atual e prepare outra prévia. Aprove somente o conteúdo que acabou de conferir.
- **Perfil incompleto:** consulte as pendências. A foto é adicionada pela plataforma.
- **Hash diferente:** peça outra prévia ou revise o candidato novamente. Autorize a versão que você acabou de conferir.
- **Conteúdo privado encontrado:** remova a informação do arquivo selecionado e prepare outro candidato.
- **Falha de rede:** consulte o estado antes de repetir. O envio usa o mesmo candidato para evitar uma contribuição duplicada.

## Para quem integra clientes MCP

O transporte segue o [stdio do MCP 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports): uma mensagem JSON-RPC UTF-8 por linha. `stdout` contém somente protocolo; falha de inicialização usa `stderr` sem detalhes privados. O cliente envia `initialize` e depois `notifications/initialized`, conforme o [ciclo de conexão](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle).

As vinte ferramentas expostas cobrem sistemas e contribuições, consulta do acervo e seu próprio perfil. As seis ferramentas novas são `buscar_acervo_comunidade`, `detalhar_item_acervo`, `meu_perfil_comunidade`, `preparar_atualizacao_perfil`, `salvar_meu_perfil` e `publicar_meu_perfil`. Para sistemas originais, a IA usa `orientar_novo_sistema`, `inspecionar_arquivos_sistema`, `planejar_novo_sistema` e `preparar_novo_sistema`, seguidas das ferramentas de revisão, autorização e envio existentes. A plataforma revalida o acesso nas operações remotas. O processo não oferece leitura arbitrária de arquivos, shell, ferramentas empresariais nem publicação de curador. Publicar no feed, comentar, consultar outros membros, agenda e notificações ainda não fazem parte desta versão.

Perfil: a prévia retorna `changes` normalizado, `revision`, `preview_hash` e `audience`. Para salvar, use esse mesmo `changes`, passe a `revision` em `expected_revision` e informe `confirmar: true` apenas após a aprovação do dono. Para publicar, use a revisão da leitura do perfil salvo e uma autorização separada. Os hashes são controles de concorrência e integridade da prévia; não substituem autenticação ou consentimento.

O limite é de 256 KiB por mensagem recebida e 512 KiB por resposta. Na instalação e no acompanhamento, o MCP retorna metadados e referências, sem pacote bruto ou credenciais. Na autoria, a prévia contém integralmente o texto selecionado e os arquivos e contratos gerados em `structuredContent`; `content` aponta para essa revisão, evitando duplicar textos grandes. Uma prévia acima do limite é recusada em vez de truncada. Endpoints de teste em HTTP local exigem a variável explícita `CEREBRO_COMMUNITY_ALLOW_LOCALHOST=true` no processo de teste. Essa opção não deve ser usada na configuração normal.
