#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import {
  experienceManifestView,
  indexExperienceManifests,
  validateExperienceManifest,
} from './lib/experience-manifest.mjs';
import { listConsoleSystems } from './lib/console-read-model.mjs';

const manifest = JSON.parse(readFileSync(resolve('protocol/examples/experience-manifest.v1.json'), 'utf8'));
assert.deepEqual(validateExperienceManifest(manifest), []);

for (const forbidden of [
  ['url', 'https://example.com'],
  ['workspace_path', '/private/system'],
  ['sources', []],
  ['permissions', []],
  ['result', 'uma resposta'],
  ['judgment_owner', 'role-founder'],
  ['design_system', { font: 'Inter' }],
]) {
  const invalid = { ...manifest, [forbidden[0]]: forbidden[1] };
  assert(validateExperienceManifest(invalid).some((error) => error.includes(`${forbidden[0]} não é permitido`)));
}

const repeatedSurface = structuredClone(manifest);
repeatedSurface.surfaces.push({ ...repeatedSurface.surfaces[0] });
assert(validateExperienceManifest(repeatedSurface).some((error) => error.includes('surface_id duplicado')));

const productRoot = resolve(process.cwd());
const issues = [];
const experiences = indexExperienceManifests(productRoot, issues);
assert.equal(issues.length, 0);
const gtmExperience = experienceManifestView(experiences.get('next-best-gtm'), 'primary-web-ui');
assert.equal(gtmExperience.publisher.display_name, 'INEVITA');
assert.equal(gtmExperience.presentation.tagline, 'Quem mover. Como mover.');
assert.equal(gtmExperience.presentation.mark.accent, '#B5FF4D');
assert.equal(gtmExperience.primary_surface.launch_label, 'Abrir aplicação');

const systems = listConsoleSystems(productRoot);
const gtm = systems.find((system) => system.contract_id === 'next-best-gtm');
const calls = systems.find((system) => system.contract_id === 'calls-decisoes');
assert.equal(gtm.experience.experience_id, 'next-best-gtm-experience');
assert.equal(calls.experience, null);
assert(!Object.hasOwn(gtm.experience, 'url'));
assert(!JSON.stringify(gtm.experience).includes('localhost'));
assert(!JSON.stringify(gtm.experience).includes('workspace_path'));

const temporary = mkdtempSync(join(tmpdir(), 'experience-manifest-v1-'));
try {
  mkdirSync(join(temporary, '.cerebro', 'contracts', 'experiences'), { recursive: true });
  writeFileSync(join(temporary, '.cerebro', 'layout.json'), JSON.stringify({
    version: 3,
    experienceManifests: '.cerebro/contracts/experiences',
  }));
  writeFileSync(join(temporary, '.cerebro', 'contracts', 'experiences', 'one.json'), JSON.stringify(manifest));
  writeFileSync(join(temporary, '.cerebro', 'contracts', 'experiences', 'two.json'), JSON.stringify({
    ...manifest,
    experience_id: 'next-best-gtm-experience-two',
  }));
  const duplicateIssues = [];
  const duplicateIndex = indexExperienceManifests(temporary, duplicateIssues);
  assert(!duplicateIndex.has('next-best-gtm'));
  assert(duplicateIssues.some((issue) => issue.reason_code === 'experience-manifest-ambiguous'));
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

const app = readFileSync(resolve('console/app.js'), 'utf8');
const css = readFileSync(resolve('console/styles.css'), 'utf8');
assert.match(app, /function systemIdentity/);
assert.match(app, /Publicado por/);
assert.match(app, /experience\.primary_surface\.launch_label/);
assert.match(app, /Experience Manifest/);
assert.doesNotMatch(app, /system-accent-\$\{/);
assert.match(css, /\.system-identity\.is-published/);
assert.match(css, /personalidade publicada/);

console.log('experience-manifest-v1: ok');
