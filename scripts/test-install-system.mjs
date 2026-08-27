#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const source = resolve(process.cwd());
const brainVersion = readFileSync(join(source, 'VERSION'), 'utf8').trim();

// Testa TODO pacote presente em sistemas-disponiveis — inclusive pacotes entregues fora do
// catálogo público quando estiverem dropados na árvore (comissionamento/validação de RC).
const availableRoot = join(source, 'comunidade', 'inevita', 'sistemas-disponiveis');
const CASES = readdirSync(availableRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(availableRoot, entry.name, 'manifest.json')))
  .map((entry) => {
    const manifest = JSON.parse(readFileSync(join(availableRoot, entry.name, 'manifest.json'), 'utf8'));
    const releasePath = join(availableRoot, entry.name, 'release.json');
    const release = existsSync(releasePath) ? JSON.parse(readFileSync(releasePath, 'utf8')) : null;
    return {
      slug: entry.name,
      name: manifest.name || entry.name,
      minimumBrain: release?.compatibility.minimum_brain_version || manifest.release?.minimum_brain_version || '',
      gated: release?.publication.access_mode === 'approved-participants' || manifest.validation?.access_mode === 'approved_participants',
      hasRelease: Boolean(release),
      hasExperimento: existsSync(join(availableRoot, entry.name, 'experimento.template.md')),
      hasSkill: existsSync(join(availableRoot, entry.name, 'skill', 'SKILL.md')),
      hasRecibo: existsSync(join(availableRoot, entry.name, 'recibo-evals.template.md')),
    };
  });
if (CASES.length === 0) throw new Error('nenhum pacote encontrado em sistemas-disponiveis');

function run(script, args, sandbox, expectFailure = false) {
  try {
    execFileSync(process.execPath, [join(source, 'scripts', script), ...args], {
      cwd: source,
      env: { ...process.env, CEREBRO_INSTALL_ROOT: sandbox, CEREBRO_TELEMETRY: 'off' },
      stdio: 'pipe',
    });
    if (expectFailure) throw new Error(`esperava falha em: ${script} ${args.join(' ')}`);
  } catch (error) {
    if (!expectFailure) throw error;
  }
}

const MEMBER_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const OTHER_MEMBER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

function testCase({ slug, name, minimumBrain, gated, hasRelease, hasExperimento, hasSkill, hasRecibo }) {
  const sandbox = mkdtempSync(join(tmpdir(), 'cerebro-system-install-'));
  try {
    writeFileSync(join(sandbox, 'COMECE-AQUI.md'), '# teste\n');

    // Cérebro abaixo da versão mínima não recebe o pacote.
    if (minimumBrain) {
      writeFileSync(join(sandbox, 'VERSION'), '0.0.0\n');
      run('install-system.mjs', [slug, '--confirm'], sandbox, true);
    }

    writeFileSync(join(sandbox, 'VERSION'), `${brainVersion}\n`);
    mkdirSync(join(sandbox, 'sistemas', 'outros-instalados', slug), { recursive: true });
    const feedback = join(sandbox, 'sistemas', 'outros-instalados', slug, 'feedback.md');
    writeFileSync(feedback, 'FEEDBACK-PRIVADO\n');

    // Costura de identidade: pacote gated não instala em Cérebro sem member-id;
    // member-id malformado é recusado; o comissionamento grava a atribuição no destino.
    const installArgs = [slug, '--confirm'];
    if (gated) {
      run('install-system.mjs', installArgs, sandbox, true);
      run('install-system.mjs', [...installArgs, '--member-id=nao-e-uuid'], sandbox, true);
      installArgs.push(`--member-id=${MEMBER_ID}`);
    }
    run('install-system.mjs', installArgs, sandbox);
    if (gated) {
      const memberIdPath = join(sandbox, '.cerebro', 'member-id');
      if (readFileSync(memberIdPath, 'utf8').trim() !== MEMBER_ID) {
        throw new Error('member-id do participante não foi costurado na instalação');
      }
      // Instalação já atribuída nunca é reatribuída a outro participante.
      run('install-system.mjs', [slug, '--confirm', `--member-id=${OTHER_MEMBER_ID}`], sandbox, true);
      if (readFileSync(memberIdPath, 'utf8').trim() !== MEMBER_ID) {
        throw new Error('reatribuição recusada mas member-id foi alterado');
      }
    }
    if (readFileSync(feedback, 'utf8') !== 'FEEDBACK-PRIVADO\n') throw new Error('feedback foi sobrescrito');
    const expectedFiles = ['manifest.json', 'manifest.md', 'pipeline.md', 'rotinas.md', 'evals.md', 'changelog.md', 'configuracao.md', 'capability.json'];
    if (hasRelease) expectedFiles.push('release.json', 'contract.json');
    if (hasExperimento) expectedFiles.push('experimento.md');
    if (hasRecibo) expectedFiles.push('recibo-evals.template.md');
    for (const file of expectedFiles) {
      if (!existsSync(join(sandbox, 'sistemas', 'outros-instalados', slug, file))) throw new Error(`faltando ${file}`);
    }
    if (hasSkill) {
      for (const runtime of ['.claude', '.agents']) {
        if (!existsSync(join(sandbox, runtime, 'skills', slug, 'SKILL.md'))) throw new Error(`skill não instalada em ${runtime}`);
      }
    }
    const statePath = join(sandbox, '.cerebro', 'sistemas', `${slug}.json`);
    const initialState = JSON.parse(readFileSync(statePath, 'utf8'));
    if (initialState.status !== 'package_added') throw new Error('estado inicial incorreto');
    if (initialState.validation_stage !== 'pilot') throw new Error('piloto perdeu o gate de validação');
    if (initialState.capability?.capability_id !== 'preparar-briefing-comercial') {
      throw new Error('capability compartilhável não foi ligada ao estado local');
    }
    run('system-state.mjs', [slug, 'configuring'], sandbox);
    if (JSON.parse(readFileSync(statePath, 'utf8')).status !== 'configuring') throw new Error('transição não persistiu');
    run('system-run.mjs', [slug, 'start'], sandbox);
    if (JSON.parse(readFileSync(statePath, 'utf8')).status !== 'first_run') throw new Error('run não iniciou');

    // Sistema com recibo E0–E7 declarado não fecha eval=pass sem recibo VÁLIDO:
    // sem recibo falha; o próprio template falha; só recibo preenchido com o run atual passa.
    const completeArgs = ['complete', '--eval=pass', '--decision=approved', '--duration-ms=1000'];
    if (hasRecibo) {
      run('system-run.mjs', [slug, ...completeArgs], sandbox, true);
      run('system-run.mjs', [slug, ...completeArgs,
        `--receipt=sistemas/outros-instalados/${slug}/recibo-evals.template.md`], sandbox, true);
      const runId = JSON.parse(readFileSync(statePath, 'utf8')).current_run.id;
      mkdirSync(join(sandbox, 'operacao', 'execucoes'), { recursive: true });
      writeFileSync(join(sandbox, 'operacao', 'execucoes', `${runId}-evals.md`), [
        `# Recibo E0–E7 — run ${runId}`,
        '| E0 preflight | passou | fontes autorizadas conferidas |',
        '| E1 groundedness | passou | cobertura de citação 100% |',
        '| E2 completude | passou | 0 omissões críticas |',
        '| E3 diagnóstico | não se aplica | run de configuração |',
        '| E4 experimento | não se aplica | sem experimento neste run |',
        '| E5 segurança e fronteira | passou | writes externos 0, telemetria sem conteúdo |',
        '| E6 valor | registrado | aguarda confirmação do responsável |',
        '| E7 aprendizado | registrado | feedback com run-id gravado |',
        '- decisão humana do run: approved',
      ].join('\n'));
      completeArgs.push(`--receipt=operacao/execucoes/${runId}-evals.md`);
    }
    run('system-run.mjs', [slug, ...completeArgs], sandbox);
    const validatedState = JSON.parse(readFileSync(statePath, 'utf8'));
    if (validatedState.status !== 'active') throw new Error('run aprovado não ativou a instalação');
    if (validatedState.run_count !== 1 || validatedState.approved_run_count !== 1) throw new Error('contadores do run incorretos');

    // Run aprovado NÃO é first value: valor exige confirmação explícita do responsável.
    if (validatedState.first_value_confirmed) throw new Error('run aprovado falseou first value');
    run('system-run.mjs', [slug, 'confirm-value'], sandbox);
    if (!JSON.parse(readFileSync(statePath, 'utf8')).first_value_confirmed) {
      throw new Error('confirm-value não registrou o primeiro valor');
    }

    const configuration = join(sandbox, 'sistemas', 'outros-instalados', slug, 'configuracao.md');
    writeFileSync(configuration, 'CONFIGURACAO-PRIVADA\n');
    if (hasExperimento) {
      writeFileSync(join(sandbox, 'sistemas', 'outros-instalados', slug, 'experimento.md'), 'EXPERIMENTO-PRIVADO\n');
    }
    run('install-system.mjs', [slug, '--confirm'], sandbox);
    if (readFileSync(configuration, 'utf8') !== 'CONFIGURACAO-PRIVADA\n') throw new Error('configuração foi sobrescrita');
    if (hasExperimento) {
      const experimento = readFileSync(join(sandbox, 'sistemas', 'outros-instalados', slug, 'experimento.md'), 'utf8');
      if (experimento !== 'EXPERIMENTO-PRIVADO\n') throw new Error('experimento foi sobrescrito na reinstalação');
    }
    if (JSON.parse(readFileSync(statePath, 'utf8')).status !== 'active') throw new Error('reinstalação regrediu o estado');
    const catalog = readFileSync(join(sandbox, 'sistemas', 'outros-instalados', '_CATALOGO.md'), 'utf8');
    if ((catalog.match(new RegExp(`system:${slug}:start`, 'g')) ?? []).length !== 1) throw new Error('catálogo duplicou a entrada');
    if (!catalog.includes(`[${name}](${slug}/manifest.md)`)) throw new Error('catálogo não usou o nome do manifest');
    console.log(`✓ ${slug}: instalação, versão mínima, recibo, first value explícito e privados preservados`);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
}

for (const c of CASES) testCase(c);
