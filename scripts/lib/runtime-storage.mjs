import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

function privatePaths(root) {
  const brain = resolve(root, '.cerebro');
  return {
    brain,
    runtimeStorage: join(brain, 'runtime'),
    operatorRuntime: join(brain, 'operator-runtime'),
  };
}

function isPlainFile(path) {
  if (!existsSync(path)) return false;
  const stat = lstatSync(path);
  return stat.isFile() && !stat.isSymbolicLink();
}

function backupPath(operatorRuntime) {
  let index = 1;
  let candidate = `${operatorRuntime}.legacy-${index}`;
  while (existsSync(candidate)) {
    index += 1;
    candidate = `${operatorRuntime}.legacy-${index}`;
  }
  return candidate;
}

/**
 * Separa o marcador legado do agente (`.cerebro/runtime`, arquivo) do diretório
 * de estado privado introduzido pelos protocolos novos. Nunca descarta o valor
 * antigo: migra para o marcador canônico ou preserva uma cópia privada.
 */
export function migrateLegacyRuntimeStorage(root) {
  const { brain, runtimeStorage, operatorRuntime } = privatePaths(root);
  mkdirSync(brain, { recursive: true, mode: 0o700 });

  if (!existsSync(runtimeStorage)) {
    mkdirSync(runtimeStorage, { recursive: true, mode: 0o700 });
    chmodSync(runtimeStorage, 0o700);
    return { migrated: false, runtime_created: true, backup_ref: null };
  }

  const runtimeStat = lstatSync(runtimeStorage);
  if (runtimeStat.isSymbolicLink()) throw new Error('runtime-storage-symlink');
  if (runtimeStat.isDirectory()) {
    chmodSync(runtimeStorage, 0o700);
    return { migrated: false, runtime_created: false, backup_ref: null };
  }
  if (!runtimeStat.isFile()) throw new Error('runtime-storage-invalid');

  let backupRef = null;
  if (!existsSync(operatorRuntime)) {
    renameSync(runtimeStorage, operatorRuntime);
    chmodSync(operatorRuntime, 0o600);
  } else {
    if (!isPlainFile(operatorRuntime)) throw new Error('operator-runtime-invalid');
    const legacyValue = readFileSync(runtimeStorage);
    const canonicalValue = readFileSync(operatorRuntime);
    if (legacyValue.equals(canonicalValue)) {
      unlinkSync(runtimeStorage);
    } else {
      const backup = backupPath(operatorRuntime);
      renameSync(runtimeStorage, backup);
      chmodSync(backup, 0o600);
      backupRef = backup.slice(brain.length + 1);
    }
  }

  mkdirSync(runtimeStorage, { recursive: true, mode: 0o700 });
  chmodSync(runtimeStorage, 0o700);
  return { migrated: true, runtime_created: true, backup_ref: backupRef };
}

export function readOperatorRuntime(root) {
  const { runtimeStorage, operatorRuntime } = privatePaths(root);
  if (isPlainFile(operatorRuntime)) return readFileSync(operatorRuntime, 'utf8').trim();
  // Compatibilidade de leitura antes do próximo post-update.
  if (isPlainFile(runtimeStorage)) return readFileSync(runtimeStorage, 'utf8').trim();
  return '';
}
