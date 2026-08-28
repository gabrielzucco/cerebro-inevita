#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import {
  applyManagedBrainUpdate,
  buildBrainUpdateCenter,
  checkLatestBrainRelease,
  compareReleaseVersions,
} from './lib/brain-update-center.mjs';

const productRoot = resolve(process.cwd());
const sandbox = mkdtempSync(join(tmpdir(), 'brain-update-center-'));

function write(path, value) {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, value);
}

function manifest(profile, distribution, versionRef) {
  return JSON.stringify({
    protocol: 'company-brain', manifest_version: 1, profile, distribution,
    version_ref: versionRef, runtime: { mode: profile === 'full' ? 'local-optional' : 'local-required' },
  });
}

try {
  const engine = join(sandbox, 'engine');
  write(join(engine, 'VERSION'), '1.32.0\n');
  write(join(engine, '.cerebro', 'manifest.json'), manifest('full', 'inevita', 'VERSION'));
  write(join(engine, '.cerebro', 'source'), 'REPO=gabrielzucco/cerebro-inevita\nBRANCH=main\n');
  mkdirSync(join(engine, '.git'), { recursive: true });

  const privateBrain = join(sandbox, 'private-brain');
  write(join(privateBrain, '.cerebro', 'manifest.json'), manifest('legacy-compatible', 'private', '.cerebro/version'));
  write(join(privateBrain, '.cerebro', 'version'), '2026.08.24\n');
  const privateCenter = buildBrainUpdateCenter(privateBrain, {
    engineRoot: engine,
    compatibilityPercent: 100,
    societyCounts: { visible: 4, validated: 1, validation: 3, installed: 3 },
  });
  assert.equal(privateCenter.installation.version, '2026.08.24');
  assert.equal(privateCenter.installation.profile, 'legacy-compatible');
  assert.equal(privateCenter.installation.update_management, 'unmanaged');
  assert.equal(privateCenter.motor.version, '1.32.0');
  assert.equal(privateCenter.motor.mode, 'development-checkout');
  assert.equal(privateCenter.motor.can_check, true);
  assert.equal(privateCenter.motor.can_apply, false);
  assert.equal(privateCenter.society.visible, 4);

  let requestedUrl = '';
  const remote = await checkLatestBrainRelease(privateCenter, {
    fetchImpl: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        json: async () => ({ tag_name: 'v1.33.0', published_at: '2026-08-28T12:00:00.000Z' }),
      };
    },
    clock: () => new Date('2026-08-28T13:00:00.000Z'),
  });
  assert.match(requestedUrl, /releases\/latest$/);
  assert.equal(remote.status, 'update-available');
  assert.equal(remote.metadata_only, true);
  assert.equal(remote.current_version, '1.32.0');

  const managedBrain = join(sandbox, 'managed-brain');
  write(join(managedBrain, 'VERSION'), '1.32.0\n');
  write(join(managedBrain, '.cerebro', 'manifest.json'), manifest('full', 'inevita', 'VERSION'));
  write(join(managedBrain, '.cerebro', 'source'), 'REPO=gabrielzucco/cerebro-inevita\nBRANCH=main\n');
  write(join(managedBrain, 'scripts', 'update.mjs'), '// fixture\n');
  const managedCenter = buildBrainUpdateCenter(managedBrain, { engineRoot: managedBrain });
  assert.equal(managedCenter.installation.update_management, 'managed-release');
  assert.equal(managedCenter.motor.can_apply, true);

  let runnerCalled = false;
  const applied = await applyManagedBrainUpdate(managedBrain, {
    status: 'update-available', tag: 'v1.33.0', latest_version: '1.33.0', current_version: '1.32.0',
  }, {
    engineRoot: managedBrain,
    runner: async (executable, args, options) => {
      runnerCalled = true;
      assert.equal(executable, process.execPath);
      assert.equal(args[0], join(managedBrain, 'scripts', 'update.mjs'));
      assert.equal(options.cwd, managedBrain);
      assert.equal(options.env.CEREBRO_UPDATE_REQUIRE_RELEASE, '1');
      write(join(managedBrain, 'VERSION'), '1.33.0\n');
    },
  });
  assert.equal(runnerCalled, true);
  assert.equal(applied.installed_version, '1.33.0');
  assert.equal(applied.restart_required, true);
  assert.equal(applied.context_uploaded, false);

  assert.equal(compareReleaseVersions('1.33.0', 'v1.33.0'), 0);
  assert.equal(compareReleaseVersions('1.32.0', '1.33.0'), -1);
  assert.equal(compareReleaseVersions('2026.08.24', '1.33.0'), 1);

  const app = readFileSync(join(productRoot, 'console', 'app.js'), 'utf8');
  const css = readFileSync(join(productRoot, 'console', 'styles.css'), 'utf8');
  const server = readFileSync(join(productRoot, 'scripts', 'console-server.mjs'), 'utf8');
  const updater = readFileSync(join(productRoot, 'scripts', 'update.mjs'), 'utf8');
  for (const contract of [
    "['updates', 'Atualizações']",
    'VERSÃO E CONTINUIDADE',
    'CÉREBRO DA EMPRESA',
    'MOTOR & CONSOLE',
    'SOCIETY',
    'data-update-check',
    'data-update-apply',
    'Motor entra. Contexto não sai.',
    'strip.scrollLeft = activeMode.offsetLeft',
  ]) assert(app.includes(contract), `interface sem contrato: ${contract}`);
  for (const endpoint of ['/api/update', '/api/update/check', '/api/update/apply']) {
    assert(server.includes(endpoint), `servidor sem endpoint: ${endpoint}`);
  }
  assert(updater.includes("CEREBRO_UPDATE_REQUIRE_RELEASE === '1'"), 'Console precisa exigir release publicada');
  for (const selector of ['.brain-mode-bar', '.brain-version-chip', '.brain-update-grid', '.brain-update-boundary']) {
    assert(css.includes(selector), `estilo ausente: ${selector}`);
  }

  console.log('company-brain-update-center-v1: ok');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
