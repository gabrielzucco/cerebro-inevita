# De/para — Cérebro gratuito × Operacional Society

Auditoria de 07/09/2026. Evidência não é sinônimo de disponibilidade: release publicada,
`main`, branch de trabalho e operação interna são estados diferentes.

## Referências observadas

| Referência | Evidência | Interpretação |
|---|---|---|
| release pública | `v1.34.2`, publicada em 28/08 | o que uma atualização pública pode entregar hoje |
| `gabrielzucco/cerebro-inevita@main` | commit `920ef296`, versão `1.36.0` | código integrado, ainda sem release equivalente |
| branch do Cockpit | commit `2a26fe0c`, versão `1.37.0` | implementação do Hermes/Telegram e correções ainda não integradas |
| Console interno | commit observado `30c03e62` | referência de produto; não é componente certificado para distribuição |

## Matriz

| Capacidade | Estado no gratuito | Destino |
|---|---|---|
| instalação e primeira missão T0→T4 | distribuída até `v1.34.2`; evoluções na `main` | gratuito |
| Fonte → output → julgamento → correção → reuso | motor existente; prova visual reforçada nesta branch | gratuito |
| resultado e origens no mesmo enquadramento | existiam em telas separadas | corrigido no gratuito |
| Cérebro Base | capacidade nativa, não Sistema de negócio | gratuito |
| Calls em Decisões | beta instalado | gratuito, preservado |
| Canvas e Cockpit | integrado na `main`; correções posteriores na branch | gratuito |
| Hermes + Telegram individual | implementado na branch, não na última release | gratuito após CI e piloto limpo |
| atualização sem perda | protegia casas do dono, mas podia apagar adições dentro de diretórios do motor | corrigido com preflight de conflito |
| Society/acervo curado | catálogo e sincronização separados do contexto | ambos, conforme acesso |
| identidade e permissões de equipe | não existe no gratuito | operacional pago |
| memória/workspace isolados por pessoa | não comprovado no pacote público nem pelo Console interno | operacional pago; exige teste de runtime |
| VPS, backup e auditoria organizacional | não existe no gratuito | operacional pago |
| conectores da operação INEVITA | específicos e parcialmente ativos | exclusivamente interno; não copiar |
| sistemas internos da INEVITA | contêm owners, fontes e regras da casa | exclusivamente interno; não copiar |

## Fronteira de produto

O gratuito continua útil sozinho: contexto individual, Cockpit, primeiro loop e Hermes pessoal.
O pago começa com infraestrutura multiusuário governada e catálogo de Sistemas de negócio vazio.
Conhecimento comunitário é uma distribuição autorizada; nunca é licença para ler a empresa do
membro ou instalar código executável silenciosamente.

## Ainda não comprovado

- Instalação limpa do fluxo Hermes nos três sistemas da CI.
- Dois Runs reais e comparáveis demonstrando correção e reuso no roteiro da aula.
- Piloto do operacional pago com quatro identidades e isolamento de runtime.
- Restauração real de backup da VPS.

Esses itens continuam bloqueando release/claim, mesmo quando o código correspondente existe.
