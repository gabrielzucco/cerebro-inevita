#!/usr/bin/env node
// CI/local entrypoint: node scripts/test-community-all.mjs [--funil=/absolute/RC]
// No production services: all network calls use isolated local/mocked fixtures.
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const optionalFunil = process.argv.filter((arg) => arg.startsWith('--funil='));
const suites = ['test-community-package.mjs', 'test-community-install.mjs', 'test-community-mcp.mjs', 'test-community-member-surface.mjs', 'test-community-member-interaction.mjs', 'test-community-authoring.mjs', 'test-community-authoring-mcp.mjs', 'test-community-release.mjs', 'test-community-release-staging.mjs', 'test-install-system.mjs', 'test-install-system-grant.mjs'];
for (const suite of suites) {
  const run = spawnSync(process.execPath, [resolve(root, 'scripts', suite), ...(['test-community-package.mjs', 'test-community-release-staging.mjs'].includes(suite) ? optionalFunil : [])], { cwd: root, stdio: 'inherit', env: { ...process.env, CEREBRO_TELEMETRY: 'off' } });
  if (run.status !== 0) process.exit(run.status || 1);
}
console.log('✓ community-all: V2, CLI, MCP e compatibilidade schema1');
