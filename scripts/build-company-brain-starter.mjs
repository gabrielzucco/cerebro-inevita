#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE = join(ROOT, 'profiles', 'company-brain-starter-en');
const version = readFileSync(join(ROOT, 'VERSION'), 'utf8').trim();
const outputArg = process.argv.indexOf('--output');
const output = outputArg >= 0 ? resolve(process.argv[outputArg + 1]) : join(ROOT, 'dist', 'company-brain-starter-en');
const zipArg = process.argv.indexOf('--zip');
const zipPath = zipArg >= 0
  ? resolve(process.argv[zipArg + 1])
  : `${output}.zip`;

if (!existsSync(PROFILE)) throw new Error(`Starter profile not found: ${PROFILE}`);
if (output === ROOT || !output.includes('company-brain-starter-en')) {
  throw new Error('Refusing to build into an unsafe output path');
}

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(PROFILE, output, { recursive: true });
cpSync(join(ROOT, '.claude', 'skills', 'company-brain-sprint'), join(output, 'skills', 'company-brain-sprint'), { recursive: true });
cpSync(join(ROOT, 'protocol'), join(output, 'protocol'), { recursive: true });
cpSync(join(ROOT, 'templates', 'sistema', 'contract.json'), join(output, 'systems', 'first-system', 'contract.template.json'));
cpSync(join(ROOT, 'templates', 'sistema', 'capability.json'), join(output, 'systems', 'first-system', 'capability.template.json'));
writeFileSync(join(output, 'VERSION'), `${version}\n`);

rmSync(zipPath, { force: true });
mkdirSync(dirname(zipPath), { recursive: true });
const archive = process.platform === 'win32'
  ? { command: 'tar.exe', args: ['-a', '-c', '-f', zipPath, 'company-brain-starter-en'] }
  : { command: 'zip', args: ['-qr', zipPath, 'company-brain-starter-en'] };
const zipped = spawnSync(archive.command, archive.args, {
  cwd: dirname(output),
  encoding: 'utf8',
});
if (zipped.status !== 0) throw new Error(`zip failed: ${zipped.stderr || zipped.stdout}`);

console.log(`✓ starter folder: ${output}`);
console.log(`✓ starter zip: ${zipPath}`);
