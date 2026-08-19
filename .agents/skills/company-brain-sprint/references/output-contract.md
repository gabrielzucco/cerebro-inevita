# Output contract

Read `.cerebro/layout.json` from the brain root and write to the paths it declares. Prefer
`activationBrief`, `configuration` and `activationContract`; accept `firstSystemBrief`,
`contextPack` and `systemContract` as compatibility aliases. If the manifest is absent, use these
fallback paths under `company-brain-seed/`:

1. `01-company-map.md`
2. `02-source-register.md`
3. `03-activation-brief.md`
4. `04-configuration.md`
5. `05-first-output.md`
6. `06-activation-receipt.md`
7. `07-activation-contract.json`
8. `08-run-ledger.jsonl`

Create missing parent directories. Never write outside the current brain root. Use relative source
labels, not absolute device paths.

## Company map

Include the selected operating slice and boundary; map state and evidence coverage; result, trigger,
real steps, roles, tools and final output; decisions and approvals; handoffs, waits and rework;
measure or `unknown`; `[DECLARED]`, `[OBSERVED]` and `[INFERRED]` labels; contradictions, unknowns
and the owner's correction. Never call one slice the whole company map.

## Source register

Use one row per source:

| source-id | source | role | raw/derived | authority | supports | does not support | freshness | sensitivity | access |
|---|---|---|---|---|---|---|---|---|---|

Then rank missing evidence roles and state which decision each would change.

## Activation Brief

Include status (`proposed` or `confirmed`), current use and reason for priority, trigger, inputs,
minimal transformation, output, human gate, reuse test, source permissions, integrations deferred,
manual-run boundary and stop conditions. This brief activates the Base Brain; it is not the first
business System Brief.

## Activation Contract

Write valid JSON using protocol version 1 and the shape in `protocol/system-contract.schema.json`.
Freeze the Base Brain identity across every use:

- `system_id`: `cerebro-base`
- `capability.capability_id`: `ativar-recorte-operacional`
- `capability.origin`: `inevita`
- `result.output_type`: `cerebro-base-ativado`
- `result.statement`: one real source becomes approved context that works again without company
  re-explanation
- `result.definition_of_done`: the owner would use the first output and a second task reuses the
  saved context without reopening raw evidence or requiring company re-explanation

The selected use and its business artifact belong in the trigger, entities, source bindings,
pipeline, eval and extensions; never rename the capability or output type after that use. The
envelope also contains permissions and the candidate-first learning policy. Do not put raw
excerpts, strategy prose, personal data, secrets or absolute paths in this file. `status` is
`confirmed` only after the owner selects the activation use and becomes `active` only after T4.

## CONFIGURATION

Use this order: job and definition of done; current state; short evidence excerpts and labels;
approved rules; examples; constraints and forbidden assumptions; output shape; tools and permissions;
human approval gate; eval and baseline. Link to the map/register. Do not reproduce raw files.

## First use output

Create the actual business artifact, not a method explanation. At the top state intended user and
moment, sources used, unresolved unknowns and status (`draft`, `corrected` or `owner-approved`).

## Activation receipt

Keep it sanitized: operating slice, map state, coverage, evidence roles (never filenames), first
activation result, use-specific output type, correction received, would-use answer, highest-leverage missing role,
next real run and date, V3 measure and an optional owner-approved win. Never include PII,
confidential metrics or raw excerpts.

## Run Record

After the owner evaluates the first output, append one compact JSON object as a single line to
`runLedger`. Follow `protocol/run-record.schema.json`: stable `run_id`, System/capability versions,
completed status and timestamps, opaque `entity_refs` and `source_refs`, relative `output_refs`,
eval result, human decision, optional relative `correction_ref`, observed outcomes and
`content_shared_with_inevita: false`. References are enough; never copy the referenced content into
the ledger.

The first approved Run Record closes T3. A second Run Record that uses the saved map, Activation
Brief and CONFIGURATION without reopening raw evidence can close T4. T4 activates the Base Brain;
it does not promote the evidence state to V3 and does not install a business System.
