# Story — Founder House Company Brain Sprint

## Contexto

No breakfast da Founder House de 18/08/2026, a apresentação explica Company Brain e o hands-on de
Gabriel precisa fazer cada founder implementar algo real em aproximadamente 30 minutos, em inglês e
usando Manus.

O produto atual prova valor a partir de uma fonte e depois abre o `/arquiteto`. Isso é suficiente
para observar um caso, mas não para dizer que a empresa foi mapeada nem que os dados já estão prontos
para agentes. O workshop precisa separar quatro objetos: evidência bruta, mapa atual, Context Pack do
trabalho e sistema por resultado. A skill nasce como pacote standalone do piloto; só deve entrar no
runtime do produto depois que os runs presenciais e o ciclo D1/D3/D7 provarem o fluxo.

> **Decisão posterior (17/08):** o teste ponta a ponta local provou a ativação e o founder aprovou a
> integração antes do evento. A story `2026-08-17-local-company-brain-activation.md` substitui a
> decisão de manter a skill apenas standalone: a skill agora é canônica no produto e gera também um
> starter EN mínimo.

## Critérios de aceitação

- [x] O hands-on promete um recorte observado e não a instalação completa do cérebro.
- [x] O participante pode começar por upload, sem depender de configurar conectores ao vivo.
- [x] A skill diferencia estado do mapa de cobertura das evidências.
- [x] Uma fonte permite V1 parcial, mas não autoriza chamar o mapa de completo.
- [x] O fluxo cruza pelo menos mapa atual, primeiro System Brief, Context Pack e output útil.
- [x] O raw permanece disponível para prova e reprocessamento, sem ser despejado no Context Pack.
- [x] Ferramentas de escrita/ação e automações ficam depois da escolha e do primeiro run manual.
- [x] A correção humana aparece como aprendizado candidato, sem inflar o estado para V3.
- [x] O recibo de ativação é sanitizado e não coleta fontes brutas dos participantes.
- [x] Existe roteiro de facilitação em inglês, plano de QR, contingências e follow-up de sete dias.
- [x] A skill é validada e empacotada em formato importável pelo Manus.

## Tarefas

- [x] Implementar a skill portátil `company-brain-sprint`.
- [x] Definir o contrato dos seis outputs da ativação.
- [x] Escrever o run of show e a fala de palco.
- [x] Definir preparo, coleta sanitizada e follow-up assíncrono.
- [x] Validar e empacotar a skill.

## File List

- `docs/stories/2026-08-17-founder-house-company-brain-sprint.md`
- `docs/guides/founder-house-company-brain-sprint.md`
- `dist/founder-house-company-brain-sprint.skill`
