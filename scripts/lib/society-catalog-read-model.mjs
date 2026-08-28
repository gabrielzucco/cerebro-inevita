import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { experienceManifestView, validateExperienceManifest } from './experience-manifest.mjs';
import { buildInstallationCompatibility } from './installation-compatibility.mjs';
import { releaseManifestView, validateReleaseManifest } from './release-manifest.mjs';
import { validateCapabilityContract, validateSystemContract } from './system-protocol.mjs';

const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const PRODUCT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value, max = 240) {
  return typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= max;
}

export function validateSocietyPackageManifest(value) {
  const errors = [];
  if (!object(value)) return ['manifest precisa ser objeto'];
  if (value.schema_version !== 1) errors.push('schema_version precisa ser 1');
  if (!ID_RE.test(value.system_id || '')) errors.push('system_id inválido');
  if (!text(value.name, 100)) errors.push('name inválido');
  if (!object(value.release) || !text(value.release.version, 32) || !text(value.release.channel, 32)
    || !text(value.release.minimum_brain_version, 32)) errors.push('release inválido');
  if (!object(value.validation)) errors.push('validation inválido');
  if (!object(value.publication)) errors.push('publication inválido');
  for (const key of ['result', 'setpoint', 'first_value']) if (!text(value[key])) errors.push(`${key} inválido`);
  if (!['local-first'].includes(value.privacy)) errors.push('privacy inválido');
  if (!object(value.permissions)) errors.push('permissions inválido');
  if (!object(value.requirements)) errors.push('requirements inválido');
  if (object(value.requirements)) {
    if (!text(value.requirements.real_event, 120)) errors.push('requirements.real_event inválido');
    if (!Array.isArray(value.requirements.source_roles) || !value.requirements.source_roles.length) {
      errors.push('requirements.source_roles inválido');
    } else {
      for (const source of value.requirements.source_roles) {
        if (!object(source) || !ID_RE.test(source.role || '') || !text(source.label, 100)
          || typeof source.required !== 'boolean' || !Array.isArray(source.examples)
          || source.examples.some((example) => !text(example, 80))) errors.push('requirements.source_roles contém item inválido');
      }
    }
    if (typeof value.requirements.human_approval_before_external_write !== 'boolean') {
      errors.push('requirements.human_approval_before_external_write inválido');
    }
  }
  return errors;
}

function packageFile(packagePath, ref) {
  const root = resolve(packagePath);
  const path = resolve(root, ref);
  if (!path.startsWith(`${root}${sep}`) || !existsSync(path) || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) {
    throw new Error('unsafe-package-ref');
  }
  return path;
}

function readExperience(packagePath, catalogRoot, issues, ref = 'experience.json') {
  const path = resolve(packagePath, ref);
  if (!existsSync(path)) return null;
  try {
    packageFile(packagePath, ref);
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    const errors = validateExperienceManifest(manifest);
    if (errors.length) throw new Error(errors.join(' · '));
    return experienceManifestView({
      manifest,
      manifest_ref: relative(catalogRoot, path).replaceAll('\\', '/'),
      source: 'society-package',
    });
  } catch {
    issues.push({ reason_code: 'society-experience-invalid', ref: relative(catalogRoot, path).replaceAll('\\', '/') });
    return null;
  }
}

function readStructuredPackage(packagePath, catalogRoot) {
  const releasePath = join(packagePath, 'release.json');
  if (!existsSync(releasePath)) return null;
  if (!lstatSync(releasePath).isFile() || lstatSync(releasePath).isSymbolicLink()) throw new Error('release-not-file');
  const release = JSON.parse(readFileSync(releasePath, 'utf8'));
  const releaseErrors = validateReleaseManifest(release);
  if (releaseErrors.length) throw new Error(releaseErrors.join(' · '));
  const contractPath = packageFile(packagePath, release.contracts.system_contract_ref);
  const capabilityPath = packageFile(packagePath, release.contracts.capability_contract_ref);
  const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
  const capability = JSON.parse(readFileSync(capabilityPath, 'utf8'));
  const errors = [...validateSystemContract(contract), ...validateCapabilityContract(capability)];
  if (errors.length) throw new Error(errors.join(' · '));
  if (release.system_ref !== contract.system_id || release.version !== contract.version
    || contract.capability.capability_id !== capability.capability_id
    || contract.capability.version !== capability.version) throw new Error('release-contract-mismatch');
  return {
    release,
    releaseView: releaseManifestView(release, relative(catalogRoot, releasePath).replaceAll('\\', '/')),
    contract,
  };
}

function availability(manifest) {
  if (manifest.publication.public_catalog === true && manifest.validation.listed === true) return 'validated';
  if (manifest.validation.validation_lab_visible === true) return 'validation';
  return 'hidden';
}

function validationView(value) {
  return {
    stage: value.stage,
    access_mode: value.access_mode,
    application_required: value.application_required === true,
    required_real_cycles: Number(value.required_real_cycles) || 0,
    verified_real_cycles: Number(value.verified_real_cycles) || 0,
    required_distinct_member_brains: Number(value.required_distinct_member_brains) || 0,
    verified_distinct_member_brains: Number(value.verified_distinct_member_brains) || 0,
    requires_repeat_use: value.requires_repeat_use === true,
    requires_eval_pass: value.requires_eval_pass === true,
    requires_human_approval: value.requires_human_approval === true,
  };
}

function releaseValidationView(release) {
  const value = release.validation;
  return {
    stage: release.publication.status,
    access_mode: release.publication.access_mode,
    application_required: release.publication.application_required,
    required_real_cycles: value.required_real_cycles,
    verified_real_cycles: value.verified_real_cycles,
    required_distinct_member_brains: value.required_distinct_member_brains,
    verified_distinct_member_brains: value.verified_distinct_member_brains,
    requires_repeat_use: value.requires_repeat_use,
    requires_eval_pass: value.requires_eval_pass,
    requires_human_approval: value.requires_human_approval,
  };
}

function sourceLabel(role) {
  const vocabulary = new Map([
    ['historico', 'Histórico'], ['conversas', 'Conversas'], ['oferta', 'Oferta'], ['aprovada', 'Aprovada'],
  ]);
  return String(role).split('-').map((word) => vocabulary.get(word) || word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function sourceExamples(source) {
  const access = source.access === 'manual' ? 'arquivo ou export manual'
    : source.access === 'read-only' ? 'leitura autorizada' : 'escrita com aprovação';
  return [access, source.freshness];
}

function releaseAvailability(release) {
  if (release.publication.catalog_visibility === 'validated') return 'validated';
  if (release.publication.catalog_visibility === 'validation-lab') return 'validation';
  return 'hidden';
}

function structuredPackageView(structured, packagePath, catalogRoot, installedIds, issues) {
  const { release, releaseView, contract } = structured;
  const status = releaseAvailability(release);
  const installed = installedIds.has(release.system_ref);
  const canInstall = status === 'validated' && release.publication.access_mode === 'public';
  const experienceRef = release.contracts.experience_manifest_ref;
  return {
    system_id: release.system_ref,
    name: contract.name,
    availability: status,
    installation_status: installed ? 'installed' : 'not-installed',
    install_action: installed ? 'open-installed' : canInstall ? 'install' : 'approval-required',
    release: {
      protocol_version: release.protocol_version,
      release_id: release.release_id,
      release_ref: releaseView.release_ref,
      version: release.version,
      channel: release.channel,
      minimum_brain_version: release.compatibility.minimum_brain_version,
      system_contract_ref: release.contracts.system_contract_ref,
    },
    experience: experienceRef ? readExperience(packagePath, catalogRoot, issues, experienceRef) : null,
    result: contract.result.statement,
    setpoint: contract.result.non_success,
    first_value: contract.result.definition_of_done,
    validation: releaseValidationView(release),
    requirements: {
      real_event: contract.trigger.description,
      source_roles: contract.sources.map((source) => ({
        role: source.role,
        label: sourceLabel(source.role),
        required: source.required,
        examples: sourceExamples(source),
      })),
      human_approval_before_external_write: Boolean(contract.result.human_gate),
    },
    privacy: {
      mode: release.privacy.mode,
      connects_sources_automatically: false,
      writes_external_systems_automatically: contract.permissions.external_actions,
      requires_source_by_source_consent: contract.sources.length > 0,
    },
    package_ref: relative(catalogRoot, packagePath).replaceAll('\\', '/'),
  };
}

function packageView(manifest, packagePath, catalogRoot, installedIds, issues) {
  const status = availability(manifest);
  const installed = installedIds.has(manifest.system_id);
  const canInstall = status === 'validated' && manifest.validation.access_mode !== 'approved_participants';
  return {
    system_id: manifest.system_id,
    name: manifest.name,
    availability: status,
    installation_status: installed ? 'installed' : 'not-installed',
    install_action: installed ? 'open-installed' : canInstall ? 'install' : 'approval-required',
    release: {
      version: manifest.release.version,
      channel: manifest.release.channel,
      minimum_brain_version: manifest.release.minimum_brain_version,
    },
    experience: readExperience(packagePath, catalogRoot, issues),
    result: manifest.result,
    setpoint: manifest.setpoint,
    first_value: manifest.first_value,
    validation: validationView(manifest.validation),
    requirements: {
      real_event: manifest.requirements.real_event,
      source_roles: manifest.requirements.source_roles.map((source) => ({
        role: source.role,
        label: source.label,
        required: source.required,
        examples: [...source.examples],
      })),
      human_approval_before_external_write: manifest.requirements.human_approval_before_external_write,
    },
    privacy: {
      mode: manifest.privacy,
      connects_sources_automatically: manifest.permissions.connects_sources_automatically === true,
      writes_external_systems_automatically: manifest.permissions.writes_external_systems_automatically === true,
      requires_source_by_source_consent: manifest.permissions.requires_source_by_source_consent === true,
    },
    package_ref: relative(catalogRoot, packagePath).replaceAll('\\', '/'),
  };
}

export function buildSocietyCatalogReadModel(brainRoot, {
  catalogRoot = PRODUCT_ROOT,
  installedSystems = [],
} = {}) {
  const issues = [];
  const base = resolve(catalogRoot, 'comunidade', 'inevita', 'sistemas-disponiveis');
  const installedIds = new Set(installedSystems.map((system) => system.system_id).filter((id) => ID_RE.test(id || '')));
  const systems = [];
  let entries = [];
  try { entries = readdirSync(base, { withFileTypes: true }); } catch { /* catálogo vazio é válido */ }
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))) {
    if (!entry.isDirectory() || !ID_RE.test(entry.name)) continue;
    const packagePath = join(base, entry.name);
    const manifestPath = join(packagePath, 'manifest.json');
    try {
      if (!existsSync(manifestPath) || lstatSync(packagePath).isSymbolicLink()
        || !lstatSync(manifestPath).isFile() || lstatSync(manifestPath).isSymbolicLink()) throw new Error('not-file');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const errors = validateSocietyPackageManifest(manifest);
      if (errors.length || manifest.system_id !== entry.name) throw new Error(errors.join(' · ') || 'system-id-mismatch');
      const structured = readStructuredPackage(packagePath, catalogRoot);
      if (structured && structured.release.system_ref !== entry.name) throw new Error('release-system-id-mismatch');
      const view = structured
        ? structuredPackageView(structured, packagePath, catalogRoot, installedIds, issues)
        : packageView(manifest, packagePath, catalogRoot, installedIds, issues);
      view.compatibility = structured
        ? buildInstallationCompatibility(brainRoot, structured.contract, {
          installed: installedIds.has(structured.contract.system_id),
        })
        : null;
      view.compatibility_action = structured ? 'inspect' : 'contract-upgrade-required';
      if (view.availability !== 'hidden') systems.push(view);
    } catch {
      issues.push({ reason_code: 'society-package-invalid', ref: relative(catalogRoot, manifestPath).replaceAll('\\', '/') });
    }
  }
  const counts = {
    visible: systems.length,
    validated: systems.filter((system) => system.availability === 'validated').length,
    validation: systems.filter((system) => system.availability === 'validation').length,
    installed: systems.filter((system) => system.installation_status === 'installed').length,
  };
  return {
    generated_at: new Date().toISOString(),
    counts,
    systems,
    issues,
    privacy: {
      package_body_exposed: false,
      telemetry_content_exposed: false,
      source_content_exposed: false,
      reference_only: true,
    },
  };
}
