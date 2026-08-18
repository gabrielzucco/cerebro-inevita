# Story — Local Company Brain activation

## Context

The Founder House workshop must leave each participant with a Company Brain folder they own on
their computer. Manus Desktop, Codex, Claude or another file-based agent may operate that folder,
but no vendor project is the brain. The current `/comecar` asks for access and a generic recurring
task before it has configured the brain, while the standalone Company Brain Sprint already has the
evidence-first activation method needed for the event.

## Acceptance criteria

- [x] `cerebro-inevita` remains the canonical product repository.
- [x] `/comecar` starts from local ownership, one operating slice and the smallest real evidence
      bundle; email is optional and comes after value.
- [x] Activation persists a company map, source register, first System Brief, Context Pack, useful
      output and sanitized receipt inside the owner's folder.
- [x] The same canonical Sprint skill works in the full Portuguese brain and the English starter
      through an explicit layout manifest.
- [x] A generated English starter can be downloaded, unzipped and operated locally without the
      Portuguese corpus or entitlement machinery.
- [x] The event page presents Manus Desktop + My Computer + local folder as the primary path and
      Manus Web as a fallback.
- [x] Product validation, starter validation, targeted landing lint/build and a two-run CLI smoke
      test pass. Repository-wide landing lint remains blocked by a pre-existing `StickyCta.tsx`
      error outside this story.

## Tasks

- [x] Integrate `company-brain-sprint` into the portable skill runtime.
- [x] Replace the generic `/comecar` opening with evidence-first local activation.
- [x] Add and validate the generated English starter distribution.
- [x] Update the event implementation page and downloadable artifacts.
- [x] Run the end-to-end local-folder test and record the result.

## Validation receipt

- Product validator and all `scripts/test-*.mjs`: passed on 2026-08-17.
- Starter build/ZIP integrity: passed; 13 KB download, no full corpus or entitlement state.
- First fresh Codex CLI run: inspected four authorized fixture sources, preserved a contradiction,
  reached V2/multi-angle and wrote all six manifest outputs.
- Second fresh Codex CLI run: `raw/` was moved outside the brain root; the agent read only the
  persisted map, System Brief and Context Pack, produced `outputs/second-output.md`, kept V2 and
  used exactly one next action without broad connections.
- Landing: changed page passes targeted ESLint; Next 16 production build and HTTP/ZIP smoke test
  pass. Full-repo ESLint reports the pre-existing synchronous state update in `StickyCta.tsx`.

## File List

- `docs/stories/2026-08-17-local-company-brain-activation.md`
- `.cerebro/layout.json`
- `.claude/skills/company-brain-sprint/`
- `.agents/skills/company-brain-sprint/`
- `.claude/skills/comecar/SKILL.md`
- `.agents/skills/comecar/SKILL.md`
- `profiles/company-brain-starter-en/`
- `scripts/build-company-brain-starter.mjs`
- `scripts/test-company-brain-starter.mjs`
- `scripts/validate-product.mjs`
- `tests/fixtures/company-brain-sprint/`
- `dist/company-brain-starter-en.zip`
- `dist/founder-house-company-brain-sprint.skill`
- `docs/guides/founder-house-company-brain-sprint.md`
- `skills/_CATALOGO.md`
- `.cerebro/motor.manifest`
- `.gitignore`
- `VERSION`
- `CHANGELOG.md`
- `/Users/gabrielzucco/Desktop/Arquivos/inevita-lps/src/app/companybrain/page.tsx`
- `/Users/gabrielzucco/Desktop/Arquivos/inevita-lps/public/companybrain/company-brain-starter-en.zip`
- `/Users/gabrielzucco/Desktop/Arquivos/inevita-lps/public/companybrain/founder-house-company-brain-sprint.skill`
