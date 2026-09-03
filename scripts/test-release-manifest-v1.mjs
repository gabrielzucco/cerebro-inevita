#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { validateSystemContract, validateCapabilityContract } from './lib/system-protocol.mjs';
import { releaseManifestView, validateReleaseManifest } from './lib/release-manifest.mjs';

const root = resolve(process.cwd());
const packageRoot = join(root, 'comunidade/inevita/sistemas-disponiveis/briefing-comercial-inteligente');
const release = JSON.parse(readFileSync(join(packageRoot, 'release.json'), 'utf8'));
const contract = JSON.parse(readFileSync(join(packageRoot, 'contract.json'), 'utf8'));
const capability = JSON.parse(readFileSync(join(packageRoot, 'capability.json'), 'utf8'));

assert.deepEqual(validateReleaseManifest(release), []);
assert.deepEqual(validateSystemContract(contract), []);
assert.deepEqual(validateCapabilityContract(capability), []);
assert.equal(release.system_ref, contract.system_id);
assert.equal(release.version, contract.version);
assert.equal(release.contracts.system_contract_ref, 'contract.json');
assert.equal(release.contracts.capability_contract_ref, 'capability.json');
assert.equal(contract.capability.capability_id, capability.capability_id);
assert.equal(contract.capability.version, capability.version);

const view = releaseManifestView(release, 'release.json');
assert.equal(view.release_ref, 'release.json');
assert.equal(view.publication.catalog_visibility, 'validation-lab');
assert.equal(view.privacy.telemetry_content, false);

const unexpected = structuredClone(release);
unexpected.runtime = { url: 'http://localhost:3000' };
assert(validateReleaseManifest(unexpected).some((error) => error.includes('runtime não é permitido')));

const leakedExperience = structuredClone(release);
leakedExperience.presentation = { accent: '#ff00ff' };
assert(validateReleaseManifest(leakedExperience).some((error) => error.includes('presentation não é permitido')));

const unsafeRef = structuredClone(release);
unsafeRef.contracts.system_contract_ref = '../contract.json';
assert(validateReleaseManifest(unsafeRef).some((error) => error.includes('system_contract_ref inválido')));

const fakeValidated = structuredClone(release);
fakeValidated.publication.catalog_visibility = 'validated';
fakeValidated.publication.status = 'published';
fakeValidated.publication.access_mode = 'public';
assert(validateReleaseManifest(fakeValidated).some((error) => error.includes('ciclos reais cumpridos')));
assert(validateReleaseManifest(fakeValidated).some((error) => error.includes('Cérebros distintos cumpridos')));

const actuallyValidated = structuredClone(fakeValidated);
actuallyValidated.channel = 'stable';
actuallyValidated.validation.verified_real_cycles = 3;
actuallyValidated.validation.verified_distinct_member_brains = 2;
assert.deepEqual(validateReleaseManifest(actuallyValidated), []);

console.log('release-manifest-v1: ok');
