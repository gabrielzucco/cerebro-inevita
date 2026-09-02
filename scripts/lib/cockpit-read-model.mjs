import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const MILESTONES = Object.freeze([
  ['T0', 'Começou', 'Primeira conversa de trabalho iniciada.'],
  ['T1', 'Fonte pronta', 'Uma fonte real foi autorizada e ficou legível.'],
  ['T2', 'Primeira entrega', 'O cérebro apresentou um artefato útil.'],
  ['T3', 'Aprovado', 'A pessoa aprovou a entrega e o contexto correspondente.'],
  ['T4', 'Reutilizado', 'O contexto aprovado voltou em uma segunda tarefa.'],
]);

function safeJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function regularFiles(directory, extension) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension) && !entry.name.startsWith('_'))
    .map((entry) => join(directory, entry.name));
}

function activation(root) {
  const directory = join(root, '.cerebro', 'concierge-runs');
  const runs = regularFiles(directory, '.json').map((path) => ({ path, value: safeJson(path) }))
    .filter(({ value }) => value?.schemaVersion === 1 && typeof value.runId === 'string')
    .sort((left, right) => {
      const leftAt = Date.parse(left.value.milestones?.T0 || 0);
      const rightAt = Date.parse(right.value.milestones?.T0 || 0);
      return rightAt - leftAt;
    });
  const latest = runs[0]?.value || null;
  const stages = MILESTONES.map(([key, label, description], index) => ({
    key,
    label,
    description,
    completed: Boolean(latest?.milestones?.[key]),
    completed_at: latest?.milestones?.[key] || null,
    current: Boolean(latest) && !latest?.milestones?.[key]
      && MILESTONES.slice(0, index).every(([previous]) => latest?.milestones?.[previous]),
  }));
  const completed = stages.filter((stage) => stage.completed).length;
  return {
    run_id: latest?.runId || null,
    system_id: latest?.systemId || 'cerebro-base',
    completed,
    total: MILESTONES.length,
    percent: completed * 20,
    complete: completed === MILESTONES.length,
    stages,
  };
}

function titleOf(path) {
  try {
    const title = readFileSync(path, 'utf8').match(/^#\s+(.+)$/m)?.[1]?.trim();
    return title || path.split(/[\\/]/).pop().replace(/\.md$/, '').replaceAll('-', ' ');
  } catch {
    return path.split(/[\\/]/).pop();
  }
}

function decisions(root) {
  return regularFiles(join(root, 'operacao', 'decisoes-pendentes'), '.md').map((path) => ({
    title: titleOf(path),
    status: 'pending',
    ref: relative(root, path).replaceAll('\\', '/'),
  }));
}

function experiments(root) {
  const locks = regularFiles(join(root, '.cerebro', 'sistemas'), '.lock.json')
    .map((path) => safeJson(path))
    .filter((value) => value?.experiment_id && value?.system_id);
  const byId = new Map(locks.map((value) => [value.experiment_id, {
    experiment_id: value.experiment_id,
    title: `${value.experiment_id} · ${value.system_id}`,
    status: 'pre-registered',
    system_ref: value.system_id,
    decision_due_at: null,
  }]));
  const installedRoot = join(root, 'sistemas', 'outros-instalados');
  if (existsSync(installedRoot)) {
    for (const system of readdirSync(installedRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
      const systemRoot = join(installedRoot, system.name);
      const candidates = [
        ...regularFiles(systemRoot, '.md').filter((path) => /experimento/i.test(path)),
        ...regularFiles(join(systemRoot, 'experimentos'), '.md'),
      ];
      for (const path of candidates) {
        let content = '';
        try { content = readFileSync(path, 'utf8'); } catch { continue; }
        const id = content.match(/^##\s+(EXP-[A-Za-z0-9_-]+)/m)?.[1];
        if (!id || byId.has(id)) continue;
        byId.set(id, {
          experiment_id: id,
          title: `${id} · ${system.name}`,
          status: 'draft',
          system_ref: system.name,
          decision_due_at: null,
        });
      }
    }
  }
  return [...byId.values()];
}

function stripMarkdown(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/^[-–—\s🔒]+/, '')
    .trim();
}

function catalogItems(path, { kind }) {
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  let section = '';
  const items = [];
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)/);
    if (heading) {
      section = heading[1].toLowerCase();
      continue;
    }
    const bullet = line.match(/^\s*-\s+(.+)/);
    if (!bullet) continue;
    const raw = bullet[1];
    const locked = raw.includes('🔒');
    const future = /constru|futuro|roadmap/.test(section);
    items.push({
      name: stripMarkdown(raw).replace(/:\s.*$/, '').trim(),
      description: stripMarkdown(raw),
      status: locked ? 'locked' : future ? 'future' : /beta/i.test(raw) ? 'beta' : 'available',
      kind,
    });
  }
  return items;
}

function connections(root) {
  const configuredRoot = join(root, 'conexoes', 'configuradas');
  const configured = regularFiles(configuredRoot, '.md').map((path) => ({
    name: titleOf(path),
    description: relative(root, path).replaceAll('\\', '/'),
    status: 'configured',
    kind: 'connection',
  }));
  const registry = safeJson(join(configuredRoot, 'fontes.json'));
  for (const source of Array.isArray(registry?.sources) ? registry.sources : []) {
    configured.push({
      name: source.name || source.source_id || source.type || 'Fonte local',
      description: source.purpose || source.type || 'Referência privada configurada',
      status: 'configured',
      kind: 'connection',
    });
  }
  const catalogPath = join(root, 'conexoes', '_CATALOGO.md');
  const catalog = catalogItems(catalogPath, { kind: 'connection' });
  if (existsSync(catalogPath)) {
    for (const line of readFileSync(catalogPath, 'utf8').split(/\r?\n/)) {
      if (!/^\|[^-]/.test(line) || /Origem|Estado inicial/.test(line)) continue;
      const [name, rawStatus, description] = line.split('|').slice(1, 4).map(stripMarkdown);
      if (!name || !rawStatus) continue;
      const status = /ativa/i.test(rawStatus) ? 'configured'
        : /disponível/i.test(rawStatus) ? 'available' : 'future';
      catalog.push({ name, description, status, kind: 'connection' });
    }
  }
  return [...configured, ...catalog.filter((item) => !configured.some((entry) => entry.name === item.name))];
}

function community(root) {
  return {
    items: catalogItems(join(root, 'comunidade', 'inevita', '_CATALOGO.md'), { kind: 'community' }),
    cta_url: 'https://inevitasociety.com',
  };
}

export function buildCockpitReadModel(root) {
  const model = {
    activation: activation(root),
    decisions: decisions(root),
    experiments: experiments(root),
    connections: connections(root),
    community: community(root),
  };
  return {
    ...model,
    counts: {
      decisions: model.decisions.length,
      experiments: model.experiments.length,
      connections: model.connections.filter((item) => item.status === 'configured').length,
      community: model.community.items.filter((item) => ['available', 'beta'].includes(item.status)).length,
    },
  };
}

export function demoCockpitReadModel() {
  return {
    activation: {
      run_id: 'demo-primeiro-loop', system_id: 'cerebro-base', completed: 4, total: 5,
      percent: 80, complete: false,
      stages: MILESTONES.map(([key, label, description], index) => ({
        key, label, description, completed: index < 4,
        completed_at: index < 4 ? `2026-08-28T1${index}:00:00.000Z` : null,
        current: index === 4,
      })),
    },
    decisions: [{ title: 'Aprovar a primeira entrega', status: 'pending', ref: 'demo:decisao-001' }],
    experiments: [{ experiment_id: 'exp-demo-001', title: 'Reutilização do contexto aprovado', status: 'pre-registered', system_ref: 'cerebro-base', decision_due_at: null }],
    connections: [
      { name: 'Pasta de calls', description: 'Fonte local autorizada', status: 'configured', kind: 'connection' },
      { name: 'Google Drive', description: 'Disponível para configurar', status: 'available', kind: 'connection' },
    ],
    community: {
      cta_url: 'https://inevitasociety.com',
      items: [
        { name: 'Calls em Decisões', description: 'Sistema beta disponível', status: 'beta', kind: 'community' },
        { name: 'Briefing Comercial Inteligente', description: 'Pacote instalável', status: 'available', kind: 'community' },
        { name: 'Geração de Demanda', description: 'Piloto do Laboratório', status: 'locked', kind: 'community' },
      ],
    },
    counts: { decisions: 1, experiments: 1, connections: 1, community: 2 },
  };
}
