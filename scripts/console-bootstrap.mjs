#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LEGACY_MARKER = Object.freeze({
  protocol: 'company-brain',
  compatibility: 'legacy-vault',
  protocol_version: 1,
});

const LEGACY_LAYOUT = Object.freeze({
  version: 3,
  systemContracts: '.cerebro/contracts/systems',
  sourceContracts: '.cerebro/contracts/sources',
  accessGrants: '.cerebro/contracts/access-grants',
  accessReceipts: '.cerebro/runtime/receipts/access',
  routineContracts: '.cerebro/contracts/routines',
  executorBindings: '.cerebro/runtime/executors',
  collectorBindings: '.cerebro/runtime/collectors',
  routineReceipts: '.cerebro/runtime/receipts/routines',
  routineState: '.cerebro/runtime/routines',
  routineOutputs: '.cerebro/runtime/outputs/routines',
  routineJudgments: '.cerebro/runtime/judgments',
  routineCorrections: '.cerebro/runtime/corrections',
  learningCandidates: '.cerebro/runtime/learning-candidates',
  routineMigrations: '.cerebro/runtime/migrations/routines',
  runLedger: '.cerebro/runtime/ledger/runs.jsonl',
});

const PRIVATE_MANIFEST = '.cerebro/runtime\n.cerebro/contracts/\n';
const LOCAL_EXCLUDE = '# Company Brain Console local state\n.cerebro/runtime/\n.cerebro/contracts/\n';

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function entrypointExists(root) {
  return ['AGENTS.md', 'CLAUDE.md', '_START.md'].some((name) => existsSync(join(root, name)));
}

function plannedFile(root, relativePath, content) {
  const path = join(root, relativePath);
  if (!existsSync(path)) return { relative_path: relativePath, status: 'create', content };
  const current = readFileSync(path, 'utf8');
  return { relative_path: relativePath, status: current === content ? 'no-change' : 'conflict', content };
}

export function previewLegacyConsoleBootstrap(root) {
  const brainRoot = resolve(root);
  if (!entrypointExists(brainRoot)) throw new Error('legacy-brain-entrypoint-missing');
  if (!existsSync(join(brainRoot, '.git'))) throw new Error('legacy-brain-git-root-required');
  const files = [
    plannedFile(brainRoot, '.cerebro/legacy-brain.json', json(LEGACY_MARKER)),
    plannedFile(brainRoot, '.cerebro/layout.json', json(LEGACY_LAYOUT)),
    plannedFile(brainRoot, '.cerebro/private-ignore.manifest', PRIVATE_MANIFEST),
  ];
  const excludePath = join(brainRoot, '.git', 'info', 'exclude');
  const currentExclude = existsSync(excludePath) ? readFileSync(excludePath, 'utf8') : '';
  files.push({
    relative_path: '.git/info/exclude',
    status: currentExclude.includes('.cerebro/runtime/') && currentExclude.includes('.cerebro/contracts/') ? 'no-change' : 'append',
    content: LOCAL_EXCLUDE,
  });
  return {
    status: files.some((file) => file.status === 'conflict') ? 'conflict'
      : files.every((file) => file.status === 'no-change') ? 'no-change' : 'ready',
    compatibility: 'legacy-vault',
    files: files.map(({ content: _content, ...file }) => file),
    guarantees: {
      duplicate_brain_created: false,
      source_moved_or_copied: false,
      private_runtime_ignored_locally: true,
    },
  };
}

export function bootstrapLegacyConsole(root, { confirm = false } = {}) {
  const brainRoot = resolve(root);
  const preview = previewLegacyConsoleBootstrap(brainRoot);
  if (!confirm || preview.status === 'no-change') return preview;
  if (preview.status === 'conflict') throw new Error('legacy-bootstrap-conflict');
  for (const [relativePath, content] of [
    ['.cerebro/legacy-brain.json', json(LEGACY_MARKER)],
    ['.cerebro/layout.json', json(LEGACY_LAYOUT)],
    ['.cerebro/private-ignore.manifest', PRIVATE_MANIFEST],
  ]) {
    const path = join(brainRoot, relativePath);
    if (!existsSync(path)) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content, { mode: 0o600 });
    }
  }
  const excludePath = join(brainRoot, '.git', 'info', 'exclude');
  mkdirSync(dirname(excludePath), { recursive: true });
  const currentExclude = existsSync(excludePath) ? readFileSync(excludePath, 'utf8') : '';
  if (!currentExclude.includes('.cerebro/runtime/') || !currentExclude.includes('.cerebro/contracts/')) {
    const separator = currentExclude && !currentExclude.endsWith('\n') ? '\n' : '';
    writeFileSync(excludePath, `${currentExclude}${separator}${LOCAL_EXCLUDE}`, { mode: 0o600 });
  }
  return { ...previewLegacyConsoleBootstrap(brainRoot), status: 'created' };
}

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) || '';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = bootstrapLegacyConsole(option('root') || process.cwd(), { confirm: process.argv.includes('--confirm') });
    console.log(JSON.stringify(result, null, 2));
    if (result.status === 'conflict') process.exitCode = 2;
  } catch (error) {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
