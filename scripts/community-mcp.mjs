#!/usr/bin/env node
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMMUNITY_TOOLS, createCommunityToolHandler } from './lib/community-mcp.mjs';
import { createMcpSession, serveMcpStdio } from './lib/community-mcp-protocol.mjs';

export function parseCommunityMcpArguments(argv) {
  const values = {};
  for (const arg of argv) {
    const match = /^--(root|endpoint)=(.+)$/.exec(arg);
    if (!match || Object.hasOwn(values, match[1])) throw new Error('community-mcp-arguments-invalid');
    values[match[1]] = match[2];
  }
  if (!values.root) throw new Error('community-mcp-root-required');
  return { root: resolve(values.root), endpoint: values.endpoint,
    // Only a process owner/test harness can permit a localhost fixture. Tool arguments cannot.
    allowLocalhost: process.env.CEREBRO_COMMUNITY_ALLOW_LOCALHOST === 'true' };
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseCommunityMcpArguments(argv);
  const callTool = createCommunityToolHandler(options);
  await serveMcpStdio({ input: process.stdin, output: process.stdout,
    handle: createMcpSession({ tools: COMMUNITY_TOOLS, callTool }) });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    process.stderr.write('O MCP da comunidade não iniciou ou a conexão foi encerrada. Confira o caminho do Cérebro e a configuração.\n');
    process.exitCode = 1;
  });
}
