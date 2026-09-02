---
name: company-brain-sprint
description: Activate the Base Brain in a local Company Brain folder: orient the company map, register sources without connecting them, use one real source, and prove approved context can be reused. Use before the first business System.
---

# Company Brain Sprint

The folder is the Company Brain. Manus, Codex, Claude, Gemini or another file-based AI is only the
current operator. Work directly in the local folder and keep all durable context there.

Deliver this chain:

`orientation → source register → evidence → observed slice → CONFIGURATION → use → correction → reuse`

Read `.cerebro/layout.json`, `references/output-contract.md` and
`protocol/system-contract.schema.json` when that path exists before writing. Do not claim to map the
whole company in one activation.

## Non-negotiables

- Use only files the owner explicitly placed in or authorized for this brain.
- Inspect the smallest useful sample. Do not browse or connect external systems unless asked.
- Raw evidence remains raw and traceable; never paste the full corpus into derived context.
- Self-report is `[DECLARED]`; inspected records are `[OBSERVED]`; reasoning is `[INFERRED]` until
  the owner confirms it. Missing facts are `unknown`, never plausible filler.
- Keep map state separate from evidence coverage. V0→V3 measures evidence; T0→T4 measures Base
  Brain activation. Never promote one from the other.
- Registering a source records its location, purpose, authority and access state. It is not a
  connection, ingestion, index or synchronization.
- Require owner confirmation before persisting the map, approving the activation use or turning a
  correction into a reusable rule.
- Defer write/action integrations and automation until one manual run has proven useful.
- Ask one compact question at a time when interaction is available. Never expose run IDs,
  telemetry, internal milestones or implementation jargon during onboarding.

## 1. Establish ownership and recover the job

Confirm that the current working directory is the folder the owner wants to keep as their Company
Brain. Do not ask for email. First recover a concrete operation from the current request, handoff or
authorized files. If it is already clear, state what you understood and proceed.

Only when the activation seed is missing, ask:

> Which real piece of work should this brain understand first — do you already know the output you
> want to improve, or would you rather show me a recent trace that came back to you?

This chooses an activation seed, not the first business System. If the owner knows the output, use
the result-first route. Otherwise use the source-first route: ask for one recent trace of work that
took time, came back for correction or depended on their judgment. Never replace uncertainty with
“connect all your sources”.

## 2. Orient broadly, then find the smallest evidence bundle

Look only at filenames and technical markers before asking to open content. Ask the owner to choose
or authorize two to four small items about the same operation, ideally with distinct roles:

- business truth: offer, proposal, price or product definition;
- work trace: task, SOP, meeting or call showing what happens;
- customer voice: sales, onboarding, support or interview excerpt;
- outcome signal: CRM, delivery QA, time, rework or conversion;
- judgment trace: an approved/rejected example and the owner's literal reason.

A 90-second voice note counts as declared judgment. Missing roles do not block activation; expose
the gap. Never request a source merely because it exists.

Before inspecting any item, create a broad, shallow V0 orientation from the owner's statements and
known source topology: what the company says it does, which sources exist, where they live, what
they may support, who authorizes them and what remains unknown. Register pointers without opening
or connecting them. Only the chosen evidence bundle becomes the narrow, observed slice.

## 3. Build the evidence ledger

For every inspected item assign an opaque `source-id` and record: label, role, raw/derived state,
authority, what it supports, what it cannot support, freshness, sensitivity and access state.

Map state:

- V0 declared: only self-report was organized.
- V1 partially observed: at least one real source was inspected; claims stay inside its scope.
- V2 owner verified: owner confirmed/corrected the map and selected priority.
- V3 outcome validated: the system later ran against a predeclared measure and an observed delta.

Evidence coverage: declared, single-angle, multi-angle, triangulated, live. File volume never
upgrades either state.

## 4. Map one current operating slice

Map desired result, trigger, real steps, roles/tools, sources per step, decisions, hidden judgment,
handoffs, waits, rework, failure points, measure/baseline, evidence, contradictions and unknowns.
Show the map before finalizing it and ask:

> What is wrong, missing, or out of order in this map of how the work happens today?

Apply the correction in the owner's words. Only then mark V2.

## 5. Define the Base Brain activation run

Propose at most three useful outputs for the observed slice. For each: intended user and moment,
evidenced need, available/missing evidence, human gate and why it can be useful now. Recommend one
and ask the owner to confirm or replace it.

After confirmation define the Activation Brief: use, trigger, inputs, minimal transformation,
output, human gate, permissions, reuse test and stop conditions. Write the same decision as the
machine-readable Activation Contract for `cerebro-base`, using `activationContract` from
`.cerebro/layout.json` or legacy alias `systemContract`. The envelope follows the System Contract
schema because the Base Brain is itself a metassystem; it does not install the first business
System. Preserve the stable metassystem identity in every activation, regardless of the selected
use: `system_id: cerebro-base`, `capability.capability_id: ativar-recorte-operacional` and
`result.output_type: cerebro-base-ativado`. The use-specific output belongs in the Activation
Brief, trigger, pipeline, eval and Run Record; it must not rename the Base Brain or its capability.
Keep strategy, excerpts and private judgments out of the JSON envelope.

## 6. Compile context and run once

Build a narrow **CONFIGURATION** containing evidence, current state, instructions, permissions,
output shape, forbidden assumptions, approval gate and an eval. Use `configuration` from the layout
or legacy alias `contextPack`. Run the pipeline once and create a useful artifact the owner can use
today. If evidence is insufficient, create a precise acquisition brief instead of generic advice.

Ask:

> Would you use this as it is? If not, what is the first change you would make?

Apply one correction and record the literal reason as a candidate judgment rule. Approval proves
first use (T3), not full activation and not V3.

## 7. Persist and continue

Write the six human-facing outputs plus the Activation Contract and one completed Run Record to the
canonical paths or legacy aliases in `.cerebro/layout.json`. The Run Record references opaque
entities, source IDs, relative output paths and the correction path; it never copies raw evidence,
output content or the literal correction. Append it as one JSON line to `runLedger`. If shell is
available after value, validate or register with `system-contract.mjs`; without shell, the files
themselves remain canonical.

End with exactly one next action: add the highest-leverage missing role or reuse the approved
context on the next real task. Do not connect a recurring source before reuse proves it matters.

The access link is settled before this sprint runs (the `comecar` gate): the install carries
`.cerebro/install-credential` or `.cerebro/acesso-email`. Never re-ask here; the e-mail stays in
`.cerebro/acesso-email`, never in business notes.

On the next real task, read the persisted map, Activation Brief and CONFIGURATION first. Reuse
approved context without reopening raw evidence unless the new case or a contradiction requires it.
If the owner confirms that no company context had to be re-explained, T4 closes and the Base Brain
is activated. Only then recommend Architect to choose the first business System. Record what the
owner corrected without pretending that one correction is a validated rule. A correction stays
candidate until three comparable runs, replay, explicit human approval, target version and rollback
exist.
