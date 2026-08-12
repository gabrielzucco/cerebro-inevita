#!/usr/bin/env node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const source = resolve(process.cwd());
const sandbox = mkdtempSync(join(tmpdir(), 'cerebro-experiment-'));
const slug = 'geracao-demanda';

function experimentDoc(id, { regra = 'manter se Y >= 12', vazio = false } = {}) {
  const value = (text) => (vazio ? '' : ` ${text}`);
  return [
    '## Experimento atual', '', `- id: ${id}`, '- estado: pré-registrado', '', '---', '',
    `## ${id}`, '',
    '### Pré-registro (região selada — congela antes da mudança)', '',
    `- data do pré-registro:${value('2026-07-30')}`,
    `- dono da leitura (quem julga na data):${value('Gabriel')}`,
    `- gargalo alvo (link pra seção da configuração + evidência):${value('retenção da VSL [config]')}`,
    `- baseline (número, período e fonte):${value('10 leads/dia (CRM, jul/2026)')}`,
    `- hipótese (uma frase falsificável — se X, então Y move Z):${value('se VSL v2, leads sobem')}`,
    `- mudança única a executar (e o que fica intocado):${value('trocar VSL; página intocada')}`,
    `- métrica primária (o que conta, janela, deduplicação):${value('leads/dia, 14d, por e-mail')}`,
    `- guardrail (o que não pode piorar e quanto):${value('CPL até +20%')}`,
    `- janela de leitura (início → data de leitura combinada):${value('01/08 → 14/08')}`,
    `- regra de decisão (manter se… / corrigir se… / descartar se… / inconclusivo se…):${vazio ? '' : ` ${regra}`}`,
    `- quem executa a mudança:${value('operador da empresa')}`,
    `- consentimento do payload agregado (sim/não):${value('sim')}`,
    '',
    '### Emendas (append-only, numeradas — fora da região selada)', '',
    '- A1 (data): —', '',
    '### Decisão', '', '- decisão:', '',
  ].join('\n');
}

function run(args, expectFailure = false) {
  try {
    execFileSync(process.execPath, [join(source, 'scripts', 'system-experiment.mjs'), ...args], {
      cwd: source,
      env: { ...process.env, CEREBRO_INSTALL_ROOT: sandbox, CEREBRO_TELEMETRY: 'off' },
      stdio: 'pipe',
    });
    if (expectFailure) throw new Error(`esperava falha em: ${args.join(' ')}`);
  } catch (error) {
    if (!expectFailure) throw error;
  }
}

try {
  const dir = join(sandbox, 'sistemas', 'outros-instalados', slug);
  mkdirSync(join(dir, 'experimentos'), { recursive: true });
  const mainPath = join(dir, 'experimento.md');

  // O template publicado é o mesmo contrato aceito pelo motor: vazio falha; preenchido congela.
  const templateSlug = 'template-system';
  const templateDir = join(sandbox, 'sistemas', 'outros-instalados', templateSlug, 'experimentos');
  mkdirSync(templateDir, { recursive: true });
  const templatePath = join(templateDir, 'EXP-TEMPLATE.md');
  const publishedTemplate = readFileSync(join(source, 'templates', 'experimento.md'), 'utf8')
    .replaceAll('EXP-001', 'EXP-TEMPLATE');
  writeFileSync(templatePath, publishedTemplate);
  run([templateSlug, 'freeze', '--file=experimentos/EXP-TEMPLATE.md'], true);
  const completedTemplate = publishedTemplate
    .replace('- dono da leitura:', '- dono da leitura: responsável da operação')
    .replace('- baseline:', '- baseline: 10 conversões, últimos 14 dias, CRM')
    .replace('- hipótese:', '- hipótese: se X mudar, Y melhora porque Z')
    .replace('- mudança única:', '- mudança única: trocar X; todo o restante permanece igual')
    .replace('- métrica primária:', '- métrica primária: conversão em 14 dias, deduplicada por ID')
    .replace('- guardrail:', '- guardrail: custo não pode subir mais de 20%')
    .replace('- janela de leitura:', '- janela de leitura: 01/08 → 14/08')
    .replace('- regra de decisão:', '- regra de decisão: manter se Y >= 12; inconclusivo sem entrega mínima');
  writeFileSync(templatePath, completedTemplate);
  run([templateSlug, 'freeze', '--file=experimentos/EXP-TEMPLATE.md']);
  run([templateSlug, 'verify', '--file=experimentos/EXP-TEMPLATE.md']);

  // Template vazio não congela.
  writeFileSync(mainPath, experimentDoc('EXP-001', { vazio: true }));
  run([slug, 'freeze'], true);

  writeFileSync(mainPath, experimentDoc('EXP-001'));
  run([slug, 'verify'], true);   // verify antes do freeze falha
  run([slug, 'freeze']);
  run([slug, 'verify']);
  run([slug, 'freeze'], true);   // recongelar EXP-001 é proibido

  // Estado operacional e emendas ficam FORA da região selada.
  let doc = readFileSync(mainPath, 'utf8')
    .replace('- estado: pré-registrado', '- estado: no ar')
    .replace('- A1 (data): —', '- A1 (2026-08-02): fonte do CRM trocou de aba; leitura preservada');
  writeFileSync(mainPath, doc);
  run([slug, 'verify']);

  // EXP-002 congela em arquivo próprio, sem conflitar com o lock do EXP-001.
  const secondPath = join(dir, 'experimentos', 'EXP-002.md');
  writeFileSync(secondPath, experimentDoc('EXP-002', { regra: 'manter se CPL <= 40' }));
  run([slug, 'freeze', '--file=experimentos/EXP-002.md']);
  run([slug, 'verify', '--file=experimentos/EXP-002.md']);

  // Edição retroativa do critério é denunciada.
  writeFileSync(mainPath, readFileSync(mainPath, 'utf8').replace('manter se Y >= 12', 'manter se Y >= 8'));
  run([slug, 'verify'], true);
  run([slug, 'verify', '--file=experimentos/EXP-002.md']); // EXP-002 segue íntegro

  console.log('✓ região selada por experimento: vazio recusado, estado/emendas livres, retro-edição denunciada');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
