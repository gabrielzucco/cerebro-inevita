# Usar os sistemas da comunidade com a sua IA

O MCP da comunidade permite pedir à IA: “Encontre o sistema de funil, mostre a versão disponível e confira como instalar no meu Cérebro”. Depois da sua aprovação, a IA usa o instalador do produto. Os seus arquivos continuam no seu computador.

Esta versão é uma candidata local. O serviço de distribuição precisa estar atualizado e a instalação precisa ter acesso vigente na plataforma. Conectar o MCP não ativa uma assinatura nem publica sistemas.

## Conectar

Você precisa de Node.js 18 ou mais recente e de uma instalação do Cérebro vinculada à sua conta. O cliente usa o vínculo existente, guardado em `.cerebro/id` e `.cerebro/install-credential`. Não copie a credencial para o chat ou para os argumentos das ferramentas.

Na pasta do Cérebro, gere a configuração:

```sh
node scripts/community-mcp-config.mjs --root="/caminho/completo/do/seu/cerebro"
```

O comando apenas imprime a configuração. Em clientes que usam a chave JSON `mcpServers`, acrescente a entrada `inevita-comunidade` à configuração existente. Conserve os outros servidores. Em um cliente com formulário de configuração, use o `command` e cada item de `args` impressos pelo comando. Não é necessário preencher variável de credencial.

O cliente inicia `scripts/community-mcp.mjs` como processo local. Não use o endereço do MCP empresarial da INEVITA: esta conexão usa os serviços da sua conta na plataforma. Não há servidor HTTP local nem configuração global alterada pelo gerador.

Em instalações em outro computador, gere a configuração naquele computador para obter os caminhos corretos. A pasta pode conter espaços e acentos.

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

## Se algo não funcionar

- **Instalação sem vínculo:** abra o Cérebro pela sua conta na plataforma e recupere a ativação. Não envie a credencial à IA.
- **Acesso negado:** confira seu acesso atual na plataforma. Uma listagem anterior não garante autorização para baixar agora.
- **Hash diferente:** peça outra prévia ou revise o candidato novamente. Autorize a versão que você acabou de conferir.
- **Conteúdo privado encontrado:** remova a informação do arquivo selecionado e prepare outro candidato.
- **Falha de rede:** consulte o estado antes de repetir. O envio usa o mesmo candidato para evitar uma contribuição duplicada.

## Para quem integra clientes MCP

O transporte segue o [stdio do MCP 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports): uma mensagem JSON-RPC UTF-8 por linha. `stdout` contém somente protocolo; falha de inicialização usa `stderr` sem detalhes privados. O cliente envia `initialize` e depois `notifications/initialized`, conforme o [ciclo de conexão](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle).

As dez ferramentas expostas cobrem catálogo, detalhes, prévia, instalação, preparo, revisão local, autorização local, envio e acompanhamento. Os serviços são os mesmos usados pelo CLI, e a plataforma revalida o acesso nas operações remotas. O processo não oferece leitura arbitrária de arquivos, shell, ferramentas empresariais nem publicação de curador.

O limite é de 256 KiB por mensagem recebida e 512 KiB por resposta. Arquivos são transferidos pelos serviços de distribuição; o MCP retorna metadados e referências, sem pacote bruto ou credenciais. Endpoints de teste em HTTP local exigem a variável explícita `CEREBRO_COMMUNITY_ALLOW_LOCALHOST=true` no processo de teste. Essa opção não deve ser usada na configuração normal.
