#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConsoleServer } from './console-server.mjs';

function parseArgs(argv) {
  const options = { root: '', port: null, open: true, demo: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--no-open') options.open = false;
    else if (argument === '--demo') options.demo = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else if (argument === '--root' || argument === '--port') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`valor-ausente-${argument.slice(2)}`);
      options[argument.slice(2)] = value;
      index += 1;
    } else if (argument.startsWith('--root=')) options.root = argument.slice(7);
    else if (argument.startsWith('--port=')) options.port = argument.slice(7);
    else throw new Error('argumento-invalido');
  }
  if (options.port !== null) {
    const port = Number(options.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('port-invalida');
    options.port = port;
  }
  return options;
}

function openBrowser(url, platform = process.platform, launch = spawn) {
  const command = platform === 'darwin' ? ['open', [url]]
    : platform === 'win32' ? ['cmd.exe', ['/d', '/s', '/c', 'start', '', url]]
      : ['xdg-open', [url]];
  const child = launch(command[0], command[1], { detached: true, stdio: 'ignore', windowsHide: true, shell: false });
  child.on?.('error', () => {});
  child.unref?.();
}

function listen(server, port) {
  return new Promise((resolveListen, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolveListen(server.address().port);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, '127.0.0.1');
  });
}

async function start(options) {
  const root = resolve(options.root || process.env.CEREBRO_INSTALL_ROOT || process.cwd());
  const ports = options.port ? [options.port] : Array.from({ length: 10 }, (_, index) => 4782 + index);
  let lastError;
  for (const port of ports) {
    const instance = createConsoleServer({ root, demo: options.demo });
    try {
      const selectedPort = await listen(instance.server, port);
      return { ...instance, port: selectedPort, root };
    } catch (error) {
      lastError = error;
      try { instance.server.close(); } catch {}
      if (error?.code !== 'EADDRINUSE') throw error;
    }
  }
  throw lastError || new Error('portas-indisponiveis');
}

export const cockpitInternals = Object.freeze({ parseArgs, openBrowser, listen, start });

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log('Uso: node scripts/cockpit.mjs [--demo] [--no-open] [--root CAMINHO] [--port PORTA]');
      process.exit(0);
    }
    const instance = await start(options);
    const url = `http://127.0.0.1:${instance.port}`;
    console.log(`Cockpit INEVITA · ${url}`);
    console.log(options.demo
      ? 'DEMONSTRAÇÃO · nenhuma credencial, escrita ou comando real habilitado.'
      : 'Contexto e credenciais permanecem nesta máquina.');
    if (options.open) {
      try { openBrowser(url); } catch { console.log(`Abra no navegador: ${url}`); }
    }
    const close = () => instance.server.close(() => process.exit(0));
    process.once('SIGINT', close);
    process.once('SIGTERM', close);
  } catch (error) {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
