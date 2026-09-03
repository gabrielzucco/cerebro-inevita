const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const VERSION_RE = /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/;
const LOCAL_REF_RE = /^[A-Za-z0-9][A-Za-z0-9_./-]{0,127}$/;

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function closed(errors, value, path, allowed) {
  if (!object(value)) {
    errors.push(`${path} precisa ser objeto`);
    return;
  }
  const keys = new Set(allowed);
  for (const key of Object.keys(value)) if (!keys.has(key)) errors.push(`${path}.${key} não é permitido`);
}

function localRef(errors, value, path) {
  if (!LOCAL_REF_RE.test(value || '') || value.startsWith('/') || value.includes('..') || value.includes('\\')) {
    errors.push(`${path} inválido`);
  }
}

function integer(errors, value, path, minimum) {
  if (!Number.isInteger(value) || value < minimum) errors.push(`${path} precisa ser inteiro >= ${minimum}`);
}

export function validateReleaseManifest(value) {
  const errors = [];
  closed(errors, value, 'release_manifest', [
    'protocol_version', 'release_id', 'system_ref', 'version', 'channel',
    'compatibility', 'contracts', 'publication', 'validation', 'privacy',
  ]);
  if (!object(value)) return errors;
  if (value.protocol_version !== 1) errors.push('protocol_version precisa ser 1');
  if (!ID_RE.test(value.release_id || '')) errors.push('release_id inválido');
  if (!ID_RE.test(value.system_ref || '')) errors.push('system_ref inválido');
  if (!VERSION_RE.test(value.version || '')) errors.push('version inválida');
  if (!['pilot', 'stable'].includes(value.channel)) errors.push('channel inválido');

  closed(errors, value.compatibility, 'compatibility', ['minimum_brain_version']);
  if (object(value.compatibility) && !VERSION_RE.test(value.compatibility.minimum_brain_version || '')) {
    errors.push('compatibility.minimum_brain_version inválido');
  }

  closed(errors, value.contracts, 'contracts', [
    'system_contract_ref', 'capability_contract_ref', 'experience_manifest_ref',
  ]);
  if (object(value.contracts)) {
    localRef(errors, value.contracts.system_contract_ref, 'contracts.system_contract_ref');
    localRef(errors, value.contracts.capability_contract_ref, 'contracts.capability_contract_ref');
    if (value.contracts.experience_manifest_ref !== undefined) {
      localRef(errors, value.contracts.experience_manifest_ref, 'contracts.experience_manifest_ref');
    }
  }

  closed(errors, value.publication, 'publication', [
    'status', 'catalog_visibility', 'access_mode', 'application_required',
  ]);
  if (object(value.publication)) {
    if (!['pilot', 'published', 'withdrawn'].includes(value.publication.status)) errors.push('publication.status inválido');
    if (!['validation-lab', 'validated', 'hidden'].includes(value.publication.catalog_visibility)) errors.push('publication.catalog_visibility inválido');
    if (!['approved-participants', 'public'].includes(value.publication.access_mode)) errors.push('publication.access_mode inválido');
    if (typeof value.publication.application_required !== 'boolean') errors.push('publication.application_required inválido');
  }

  closed(errors, value.validation, 'validation', [
    'program_key', 'required_real_cycles', 'verified_real_cycles',
    'required_distinct_member_brains', 'verified_distinct_member_brains',
    'requires_repeat_use', 'requires_eval_pass', 'requires_human_approval',
  ]);
  if (object(value.validation)) {
    if (!ID_RE.test(value.validation.program_key || '')) errors.push('validation.program_key inválido');
    integer(errors, value.validation.required_real_cycles, 'validation.required_real_cycles', 1);
    integer(errors, value.validation.verified_real_cycles, 'validation.verified_real_cycles', 0);
    integer(errors, value.validation.required_distinct_member_brains, 'validation.required_distinct_member_brains', 1);
    integer(errors, value.validation.verified_distinct_member_brains, 'validation.verified_distinct_member_brains', 0);
    for (const key of ['requires_repeat_use', 'requires_eval_pass', 'requires_human_approval']) {
      if (typeof value.validation[key] !== 'boolean') errors.push(`validation.${key} inválido`);
    }
  }

  closed(errors, value.privacy, 'privacy', ['mode', 'telemetry_content']);
  if (object(value.privacy)) {
    if (value.privacy.mode !== 'local-first') errors.push('privacy.mode precisa ser local-first');
    if (value.privacy.telemetry_content !== false) errors.push('privacy.telemetry_content precisa ser false');
  }

  if (object(value.publication) && object(value.validation)) {
    const validated = value.publication.catalog_visibility === 'validated';
    if (validated && value.publication.status !== 'published') errors.push('validated exige publication.status published');
    if (validated && value.publication.access_mode !== 'public') errors.push('validated exige access_mode public');
    if (validated && value.validation.verified_real_cycles < value.validation.required_real_cycles) errors.push('validated exige ciclos reais cumpridos');
    if (validated && value.validation.verified_distinct_member_brains < value.validation.required_distinct_member_brains) errors.push('validated exige Cérebros distintos cumpridos');
    if (validated && (!value.validation.requires_repeat_use || !value.validation.requires_eval_pass || !value.validation.requires_human_approval)) {
      errors.push('validated exige repetição, eval e julgamento humano');
    }
    if (value.publication.status === 'pilot' && value.publication.catalog_visibility === 'validated') {
      errors.push('pilot não pode aparecer como validated');
    }
  }
  return errors;
}

export function releaseManifestView(manifest, manifestRef = null) {
  return {
    protocol_version: manifest.protocol_version,
    release_id: manifest.release_id,
    release_ref: manifestRef,
    system_ref: manifest.system_ref,
    version: manifest.version,
    channel: manifest.channel,
    minimum_brain_version: manifest.compatibility.minimum_brain_version,
    contracts: { ...manifest.contracts },
    publication: { ...manifest.publication },
    validation: { ...manifest.validation },
    privacy: { ...manifest.privacy },
  };
}
