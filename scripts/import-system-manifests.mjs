#!/usr/bin/env node

import { resolve } from 'node:path';
import { importLegacySystemManifests } from './lib/legacy-system-import.mjs';

const args = process.argv.slice(2);
const value = (name, fallback) => {
  const prefix = `--${name}=`;
  const found = args.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

try {
  const result = importLegacySystemManifests(resolve(value('brain', process.cwd())), {
    configPath: value('config', '.cerebro/migration/system-map.v1.json'),
    confirm: args.includes('--confirm'),
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.status === 'preview-only') {
    console.log('Preview concluído. Use --confirm para escrever somente os contratos planejados.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
