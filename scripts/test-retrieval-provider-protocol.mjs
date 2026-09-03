#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateRetrievalProviderContract } from './lib/retrieval-provider-protocol.mjs';

const fixture = JSON.parse(readFileSync(
  new URL('../protocol/examples/retrieval-provider-contract.v1.json', import.meta.url),
  'utf8',
));

assert.deepEqual(validateRetrievalProviderContract(fixture), []);

const clone = (value) => structuredClone(value);
const withSecret = clone(fixture);
withSecret.driver.profile_ref = 'Bearer abcdefghijklmnopqrstuvwxyz123456';
assert(validateRetrievalProviderContract(withSecret).some((error) => error.includes('segredo')));

const withoutHealth = clone(fixture);
withoutHealth.interface.operations = ['retrieve', 'resolve-context'];
assert(validateRetrievalProviderContract(withoutHealth).some((error) => error.includes('retrieve e health')));

const openFailure = clone(fixture);
openFailure.interface.fail_mode = 'fallback';
assert(validateRetrievalProviderContract(openFailure).some((error) => error.includes('closed')));

const unsafeCatalog = clone(fixture);
unsafeCatalog.corpus.catalog_ref = '../outside.json';
assert(validateRetrievalProviderContract(unsafeCatalog).some((error) => error.includes('referência local segura')));

const ingestsThirdParties = clone(fixture);
ingestsThirdParties.privacy.third_party_zone_indexed = true;
assert(validateRetrievalProviderContract(ingestsThirdParties).some((error) => error.includes('precisa ser false')));

console.log('✓ Retrieval Provider Contract separa interface INEVITA de implementação substituível');
