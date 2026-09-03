#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
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
    const contractPath = release ? join(availableRoot, entry.name, release.contracts.system_contract_ref) : null;
    const capabilityPath = release ? join(availableRoot, entry.name, release.contracts.capability_contract_ref) : null;
    const contract = contractPath ? JSON.parse(readFileSync(contractPath, 'utf8')) : null;
    const capability = capabilityPath ? JSON.parse(readFileSync(capabilityPath, 'utf8')) : null;
    return {
      slug: entry.name,
      name: manifest.name || entry.name,
      minimumBrain: release?.compatibility.minimum_brain_version || manifest.release?.minimum_brain_version || '',
      gated: release?.publication.access_mode === 'approved-participants' || manifest.validation?.access_mode === 'approved_participants',
      hasRelease: Boolean(release),
      hasExperimento: existsSync(join(availableRoot, entry.name, 'experimento.template.md')),
      hasSkill: existsSync(join(availableRoot, entry.name, 'skill', 'SKILL.md')),
      hasRecibo: existsSync(join(availableRoot, entry.name, 'recibo-evals.template.md')),
      contract,
      capability,
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

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function preparePackageSources(sandbox, system) {
  const sourceExample = JSON.parse(readFileSync(join(source, 'protocol/examples/source-contract.v1.json'), 'utf8'));
  const sources = system.sources.filter((item) => item.required === true).map((item, index) => [
    item.role,
    `test-source-${index + 1}`,
    `Fonte de teste ${index + 1}`,
  ]);
  for (const [, sourceId, name] of sources) {
    writeJson(join(sandbox, '.cerebro', 'contracts', 'sources', `${sourceId}.json`), {
      ...sourceExample,
      source_id: sourceId,
      name,
      authorized_consumers: [],
      freshness: { ...sourceExample.freshness, observed_at: '2026-08-27T17:00:00.000Z' },
    });
  }
  const grantId = `grant-${system.system_id}-install-test`;
  writeJson(join(sandbox, '.cerebro', 'contracts', 'access-grants', `${grantId}.json`), {
    protocol_version: 1,
    grant_id: grantId,
    subject: { type: 'system', ref: system.system_id },
    scope: {
      company_ref: 'company-local', unit_ref: 'sales', system_refs: [system.system_id],
      source_refs: sources.map(([, sourceId]) => sourceId), actions: ['read-source'],
    },
    mode: 'read', assurance: 'runtime-enforced', custody: 'runtime-exclusive',
    reason: 'validar instalação com Fontes sintéticas aprovadas para o pacote',
    issued_at: '2026-01-01T12:00:00.000Z', expires_at: '2099-01-01T12:00:00.000Z', revoked_at: null,
    approved_by: 'role-test-owner', credential_ref: 'os-keychain:package-install-test',
    receipts: { use_refs: [], revocation_ref: null },
  });
  for (const [role, sourceId] of sources) {
    const access = system.sources.find((item) => item.role === role).access;
    writeJson(join(sandbox, '.cerebro', 'runtime', 'system-source-bindings', `binding-${system.system_id}-${role}.json`), {
      protocol_version: 1,
      binding_id: `binding-${system.system_id}-${role}`,
      system_ref: system.system_id,
      system_version: system.version,
      role,
      source_ref: sourceId,
      requested_access: access,
      status: 'ready',
      grant_ref: grantId,
      checked_at: '2026-08-27T18:00:00.000Z',
      reason_codes: ['role-source-compatible', 'grant-active'],
      approval: { approved_by: 'role-test-owner', approved_at: '2026-08-27T17:30:00.000Z' },
      privacy: { content_copied: false, credential_stored: false, shared_with_inevita: false },
    });
  }
}

const MEMBER_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const OTHER_MEMBER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

function testCase({ slug, name, minimumBrain, gated, hasRelease, hasExperimento, hasSkill, hasRecibo, contract, capability }) {
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
    if (initialState.capability?.capability_id !== capability?.capability_id) {
      throw new Error('capability compartilhável não foi ligada ao estado local');
    }
    const requiredSourceRoles = contract?.sources.filter((item) => item.required === true).length || 0;
    const entityArgs = (contract?.entities || [])
      .filter((item) => item.required === true)
      .map((item) => `--entity=${item.role}:test-${item.role}`);
    if (hasRelease && (initialState.source_bindings?.status !== 'unbound'
      || initialState.source_bindings.required_roles !== requiredSourceRoles
      || initialState.source_bindings.ready_roles !== 0)) {
      throw new Error('pacote foi instalado sem preservar o preflight de Source Bindings');
    }
    run('system-state.mjs', [slug, 'configuring'], sandbox);
    if (JSON.parse(readFileSync(statePath, 'utf8')).status !== 'configuring') throw new Error('transição não persistiu');
    if (hasRelease) {
      run('system-run.mjs', [slug, 'start', ...entityArgs], sandbox, true);
      const installedContract = JSON.parse(readFileSync(join(sandbox, 'sistemas', 'outros-instalados', slug, 'contract.json'), 'utf8'));
      preparePackageSources(sandbox, installedContract);
      run('install-system.mjs', [slug, '--confirm'], sandbox);
      const readyState = JSON.parse(readFileSync(statePath, 'utf8'));
      if (readyState.source_bindings?.status !== 'ready' || readyState.source_bindings.ready_roles !== requiredSourceRoles) {
        throw new Error('reinstalação não reconheceu bindings pré-aprovados');
      }
    }
    run('system-run.mjs', [slug, 'start', ...entityArgs], sandbox);
    const startedState = JSON.parse(readFileSync(statePath, 'utf8'));
    if (startedState.status !== 'first_run') throw new Error('run não iniciou');
    if (hasRelease && startedState.current_run.source_refs.length !== requiredSourceRoles) {
      throw new Error('run não herdou as Fontes dos bindings aprovados');
    }

    // Sistema com recibo E0–E7 declarado não fecha eval=pass sem recibo VÁLIDO:
    // sem recibo falha; o próprio template falha; só recibo preenchido com o run atual passa.
    const runId = JSON.parse(readFileSync(statePath, 'utf8')).current_run.id;
    mkdirSync(join(sandbox, 'operacao', 'execucoes'), { recursive: true });
    writeFileSync(join(sandbox, 'operacao', 'execucoes', `${runId}-briefing.md`), '# Briefing aprovado\n');
    const completeArgs = ['complete', '--eval=pass', '--decision=approved', '--duration-ms=1000',
      `--output=operacao/execucoes/${runId}-briefing.md`];
    if (hasRecibo) {
      run('system-run.mjs', [slug, ...completeArgs], sandbox, true);
      run('system-run.mjs', [slug, ...completeArgs,
        `--receipt=sistemas/outros-instalados/${slug}/recibo-evals.template.md`], sandbox, true);
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
