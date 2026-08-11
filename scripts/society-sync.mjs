#!/usr/bin/env node
// Sincroniza o acervo exclusivo da INEVITA Society pra dentro deste Cérebro.
// O servidor decide o acesso (identidade forte + pagamento ativo); este script
// só pergunta e baixa. Conteúdo pago mora em comunidade/society/ — fora do Git
// da sua cópia (gitignore), como toda configuração pessoal.
// Nunca quebra o trabalho local: qualquer falha vira mensagem, não erro.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = join(ROOT, 'comunidade', 'society');
const URL = 'https://peegicizxybjgvuutegc.supabase.co/functions/v1/cerebro-society-sync';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function read(relative) {
  try { return readFileSync(join(ROOT, relative), 'utf8').trim(); } catch { return ''; }
}

async function main() {
  const installId = read('.cerebro/id').toLowerCase();
  if (!UUID_RE.test(installId)) {
    console.log('society: esta instalação ainda não tem id — rode /comecar primeiro.');
    return;
  }

  let resp;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const r = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ install_id: installId }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    resp = await r.json();
  } catch {
    console.log('society: servidor indisponível agora — tenta de novo mais tarde.');
    return;
  }

  if (!resp?.access) {
    if (resp?.reason === 'entitlement') {
      console.log('society: não encontramos uma assinatura ativa da INEVITA Society pra este acesso.');
      console.log('  Se você acabou de entrar, o pagamento pode levar alguns minutos pra refletir.');
      console.log('  Ainda não é membro? O convite está no grupo — ou fala com a gente.');
    } else {
      console.log('society: teu acesso ainda não está vinculado como membro.');
      console.log('  O vínculo forte é feito no comissionamento ou pela equipe — fala com a gente no grupo.');
      console.log('  (Informar o e-mail no /comecar liga a telemetria, mas conteúdo pago exige o vínculo.)');
    }
    return;
  }

  const items = Array.isArray(resp.items) ? resp.items : [];
  if (!items.length) {
    console.log('society: acesso OK — o acervo ainda não tem itens publicados.');
    return;
  }

  mkdirSync(DEST, { recursive: true });
  let novos = 0, atualizados = 0, iguais = 0;
  for (const item of items) {
    const rel = normalize(String(item.path ?? ''));
    if (!rel || rel.startsWith('..') || rel.startsWith('/') || rel.includes('\\')) continue;
    let corpo;
    try {
      const r = await fetch(String(item.url ?? ''), { signal: AbortSignal.timeout(15000) });
      if (!r.ok) continue;
      corpo = Buffer.from(await r.arrayBuffer());
    } catch { continue; }
    const alvo = join(DEST, rel);
    if (!resolve(alvo).startsWith(DEST)) continue;
    mkdirSync(dirname(alvo), { recursive: true });
    const existia = existsSync(alvo) ? readFileSync(alvo) : null;
    if (existia && existia.equals(corpo)) { iguais += 1; continue; }
    writeFileSync(alvo, corpo);
    if (existia) atualizados += 1; else novos += 1;
    console.log(`  ${existia ? 'atualizado' : 'novo'}: comunidade/society/${rel}`);
  }
  console.log(`society: sincronizado — ${novos} novo(s) · ${atualizados} atualizado(s) · ${iguais} sem mudança.`);

  // Telemetria mínima do uso (mesmas regras do ping: nunca interrompe, opt-out respeitado).
  spawnSync(process.execPath, [join(ROOT, '.agents', 'scripts', 'ping.mjs'), 'operou', 'society'], {
    stdio: 'ignore', timeout: 5000,
  });
}

await main();
