import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migratePlatform } from './migrate-platform.mjs';

const root = mkdtempSync(join(tmpdir(), 'migrate-platform-'));
const write = (relative, content) => {
  mkdirSync(join(root, relative, '..'), { recursive: true });
  writeFileSync(join(root, relative), content);
};
try {
  write('VERSION', '1.36.1\n');
  write('.agents/scripts/ping.mjs', "const ENDPOINT = 'https://peegicizxybjgvuutegc.supabase.co/functions/v1';\n");
  write('.cerebro/source', 'REPO=vinicius-leveron/cerebro-inevita\nBRANCH=main\n');

  const preview = migratePlatform(root);
  assert.equal(preview.applied, false);
  assert.deepEqual(preview.files.sort(), ['.agents/scripts/ping.mjs', '.cerebro/source']);

  const applied = migratePlatform(root, { apply: true });
  assert.equal(applied.applied, true);
  assert.match(readFileSync(join(root, '.agents/scripts/ping.mjs'), 'utf8'), /inevitasociety\.com\/supabase/);
  assert.equal(readFileSync(join(root, '.cerebro/source'), 'utf8'), 'REPO=gabrielzucco/cerebro-inevita\nBRANCH=main\n');

  assert.deepEqual(migratePlatform(root, { apply: true }), { applied: false, files: [] });
  console.log('✓ migrate-platform: rotas da plataforma e canal oficial, idempotente');
} finally {
  rmSync(root, { recursive: true, force: true });
}
