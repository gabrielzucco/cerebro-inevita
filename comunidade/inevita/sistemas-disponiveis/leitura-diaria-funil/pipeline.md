# Pipeline — Leitura Diária do Funil

| Estado | Entrada | Saída | Gate |
|---|---|---|---|
| coletado | fontes autorizadas | snapshot determinístico | frescor e definições passaram |
| comparado | snapshot + histórico | taxas e mudanças | mesmas janelas e denominadores |
| diagnosticado | comparação | um gargalo prioritário | lacunas e contradições explícitas |
| julgado | leitura do dia | confirmação, correção ou rejeição | humano decide a próxima ação |

Fonte ausente degrada a leitura com uma lacuna declarada. Fonte obrigatória inconsistente bloqueia o
diagnóstico.
