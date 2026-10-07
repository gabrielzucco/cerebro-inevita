#!/usr/bin/env node
import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function communityMcpConfiguration({ root, node = process.execPath }) {
  const target = realpathSync(resolve(root));
  if (!isAbsolute(node) || !lstatSync(node).isFile()) throw new Error('node-path-invalid');
  const script = join(target, 'scripts', 'community-mcp.mjs');
  if (!lstatSync(script).isFile()) throw new Error('community-mcp-script-missing');
  return { mcpServers: { 'inevita-comunidade': { command: node, args: [script, `--root=${target}`] } } };
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1 || !args[0].startsWith('--root=') || !args[0].slice(7)) throw new Error('root-required');
    process.stdout.write(`${JSON.stringify(communityMcpConfiguration({ root: args[0].slice(7) }), null, 2)}\n`);
  } catch {
    process.stderr.write('Informe --root=/caminho/do/cerebro com o MCP instalado. A configuração global não foi alterada.\n');
    process.exitCode = 1;
  }
}
