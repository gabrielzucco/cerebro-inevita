#!/usr/bin/env node
import { createPortablePanel } from '../console/painel/server/server.mjs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
const { values } = parseArgs({ options: { help: {type:'boolean',short:'h'}, root: {type:'string'}, port: {type:'string',default:'4810'}, 'no-open': {type:'boolean',default:false} } });
if (values.help) { console.log('Uso: node scripts/painel.mjs --root /pasta/do/cerebro [--port 4810] [--no-open]'); process.exit(0); }
if (!values.root) throw new Error('Use node scripts/painel.mjs --root /caminho/do/seu-cerebro');
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Porta inválida.');
const panel = createPortablePanel({ root: values.root, staticRoot: fileURLToPath(new URL('../console/painel/web/', import.meta.url)) });
panel.server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'Esta porta já está em uso. Escolha outra com --port.' : 'Não foi possível abrir o painel local.'); process.exitCode = 1; panel.collector.stop(); });
panel.server.listen(port, '127.0.0.1', () => {
 const url = 'http://127.0.0.1:' + port; console.log('Painel: ' + url);
 if (!values['no-open']) {
  const command = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd.exe', ['/d','/s','/c','start','',url]] : ['xdg-open', [url]];
  try { const child = spawn(command[0], command[1], {detached:true,stdio:'ignore',windowsHide:true,shell:false}); child.on('error',()=>console.log('Abra no navegador: ' + url)); child.unref(); } catch { console.log('Abra no navegador: ' + url); }
 }
});
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => panel.close());
