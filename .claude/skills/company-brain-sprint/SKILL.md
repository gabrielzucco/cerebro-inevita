---
name: company-brain-sprint
description: Activate one evidence-backed operating slice in a Company Brain folder. Use during first installation, founder onboarding, operation mapping, source triage, or when deciding what to connect before agents and automations.
---

# Company Brain Sprint

The folder is the Company Brain. Manus, Codex, Claude, Gemini or another file-based AI is only the
current operator. Work directly in the local folder and keep all durable context there.

Deliver this chain:

`evidence → current map → first result system → Context Pack → useful output → correction`

Read `.cerebro/layout.json` and `references/output-contract.md` before writing. Do not claim to map
the whole company in one activation.

## Non-negotiables

- Use only files the owner explicitly placed in or authorized for this brain.
- Inspect the smallest useful sample. Do not browse or connect external systems unless asked.
- Raw evidence remains raw and traceable; never paste the full corpus into derived context.
- Self-report is `[DECLARED]`; inspected records are `[OBSERVED]`; reasoning is `[INFERRED]` until
  the owner confirms it. Missing facts are `unknown`, never plausible filler.
- Keep map state separate from evidence coverage.
- Require owner confirmation before persisting the map, choosing the first system or turning a
  correction into a reusable rule.
- Defer write/action integrations and automation until one manual run has proven useful.
- Ask one compact question at a time when interaction is available. Never expose run IDs,
  telemetry, internal milestones or implementation jargon during onboarding.

## 1. Establish ownership and recover the job

Confirm that the current working directory is the folder the owner wants to keep as their Company
Brain. Do not ask for email. First recover a concrete operation from the current request, handoff or
authorized files. If it is already clear, state what you understood and proceed.

Only when the operation is missing, ask:

> Which recurring piece of work should this brain make easier first — what triggers it, and what
> usable output must exist at the end?

This is an installation decision, not a generic company interview.

## 2. Find the smallest evidence bundle

Look only at filenames and technical markers before asking to open content. Ask the owner to choose
or authorize two to four small items about the same operation, ideally with distinct roles:

- business truth: offer, proposal, price or product definition;
- work trace: task, SOP, meeting or call showing what happens;
- customer voice: sales, onboarding, support or interview excerpt;
- outcome signal: CRM, delivery QA, time, rework or conversion;
- judgment trace: an approved/rejected example and the owner's literal reason.

A 90-second voice note counts as declared judgment. Missing roles do not block activation; expose
the gap. Never request a source merely because it exists.

## 3. Build the evidence ledger

For every inspected item record: label, role, raw/derived state, authority, what it supports, what
it cannot support, freshness, sensitivity and access state.

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

## 5. Select the first result system

Propose at most three ordinally ranked opportunities. For each: result, evidenced leak, first useful
output, available/missing evidence, human gate, smallest measure, why now and why not yet. Recommend
one and ask the owner to confirm or replace it.

After confirmation define the first system: result, trigger, inputs, minimal pipeline, output, human
gate, predeclared eval, permissions, capture routine if already known, manual-run boundary and stop
conditions. A system is a repeatable result contract, not an agent or a folder.

## 6. Compile context and run once

Build a narrow Context Pack containing evidence, current state, instructions, permissions, output
shape, forbidden assumptions, approval gate and an eval. Run the pipeline once and create a useful
artifact the owner can use today. If evidence is insufficient, create a precise acquisition brief
instead of generic advice.

Ask:

> Would you use this as it is? If not, what is the first change you would make?

Apply one correction and record the literal reason as a candidate judgment rule. Approval proves
activation, not V3.

## 7. Persist and continue

Write all six outputs to the paths in `.cerebro/layout.json`. End with exactly one next action: add
the highest-leverage missing role, repeat this output on the next real case, or connect one recurring
read source after the manual run proved value.

Only after the useful output is saved may you offer to link access/updates by email. It is optional,
non-blocking and must stay in `.cerebro/acesso-email`, never in business notes.

On the next real case, read the persisted map, System Brief and Context Pack first. Reuse approved
context without reopening raw evidence unless the new case or a contradiction requires it. Record
what the owner corrected so the brain can improve without pretending that one correction is a
validated rule.
