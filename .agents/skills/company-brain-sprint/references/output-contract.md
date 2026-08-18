# Output contract

Read `.cerebro/layout.json` from the brain root and write to the paths it declares. If the
manifest is absent, use these fallback paths under `company-brain-seed/`:

1. `01-company-map.md`
2. `02-source-register.md`
3. `03-first-system-brief.md`
4. `04-context-pack.md`
5. `05-first-output.md`
6. `06-activation-receipt.md`
7. `07-system-contract.json`
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

## First System Brief

Include status (`proposed` or `confirmed`), result and reason for priority, trigger, inputs, minimal
pipeline, output, human gate, predeclared eval, baseline, source permissions, read integrations that
may later help, action integrations deferred, manual-run boundary and stop conditions.

## System Contract

Write valid JSON using protocol version 1 and the shape in `protocol/system-contract.schema.json`.
The envelope contains the confirmed result, trigger, capability reference, entity roles, source
roles/bindings, pipeline states, permissions, eval and candidate-first learning policy. Do not put
raw excerpts, strategy prose, personal data, secrets or absolute paths in this file. `status` is
`confirmed` only after the owner selects the System.

## Context Pack

Use this order: job and definition of done; current state; short evidence excerpts and labels;
approved rules; examples; constraints and forbidden assumptions; output shape; tools and permissions;
human approval gate; eval and baseline. Link to the map/register. Do not reproduce raw files.

## First output

Create the actual business artifact, not a method explanation. At the top state intended user and
moment, sources used, unresolved unknowns and status (`draft`, `corrected` or `owner-approved`).

## Activation receipt

Keep it sanitized: operating slice, map state, coverage, evidence roles (never filenames), first
system result, output type, correction received, would-use answer, highest-leverage missing role,
next real run and date, V3 measure and an optional owner-approved win. Never include PII,
confidential metrics or raw excerpts.

## Run Record

After the owner evaluates the first output, append one compact JSON object as a single line to
`runLedger`. Follow `protocol/run-record.schema.json`: stable `run_id`, System/capability versions,
completed status and timestamps, opaque `entity_refs` and `source_refs`, relative `output_refs`,
eval result, human decision, optional relative `correction_ref`, observed outcomes and
`content_shared_with_inevita: false`. References are enough; never copy the referenced content into
the ledger.
