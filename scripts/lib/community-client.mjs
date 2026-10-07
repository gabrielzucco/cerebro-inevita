import { readCommunityFile, communityAssert, communityHash, hashCommunityPackage, validateCommunityPackage, COMMUNITY_LIMITS, COMMUNITY_SHA_RE } from './community-package.mjs';
import { MEMBER_SURFACE_ACTION_SCHEMAS, validateMemberSurfaceRequest } from './community-member-surface.mjs';

export const DEFAULT_COMMUNITY_ENDPOINT = 'https://inevitasociety.com/supabase/functions/v1/cerebro-system-distribution';
const ACTIONS = new Set(['list_releases', 'get_release', 'issue_grant', 'redeem_grant', 'installation_receipt', 'submit_contribution', 'list_contributions', 'get_contribution', 'review_contribution', 'publish_contribution', ...Object.keys(MEMBER_SURFACE_ACTION_SCHEMAS)]);
const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function readCommunityIdentity(root) {
  let install_id, install_credential;
  try {
    install_id = readCommunityFile(root, '.cerebro/id', 256).toString().trim();
    install_credential = readCommunityFile(root, '.cerebro/install-credential', 256).toString().trim();
  } catch { throw new Error('installation_credentials_required'); }
  communityAssert(UUID_RE.test(install_id) && /^[A-Za-z0-9_-]{43}$/.test(install_credential), 'installation_credentials_invalid');
  return { install_id, install_credential };
}
function checkedUrl(value, allowLocalhost) {
  let url; try { url = new URL(value); } catch { throw new Error('invalid_community_url'); }
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  communityAssert(!url.username && !url.password && !url.hash && (!local || allowLocalhost) && (url.protocol === 'https:' || (allowLocalhost && local && url.protocol === 'http:')), 'insecure_community_url');
  return url.href;
}
async function boundedBytes(response, maximum) {
  const length = Number(response.headers?.get?.('content-length'));
  communityAssert(!length || length <= maximum, 'response_too_large');
  if (response.body?.getReader) {
    const reader = response.body.getReader(); let total = 0; const chunks = [];
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        total += value.length; communityAssert(total <= maximum, 'response_too_large'); chunks.push(Buffer.from(value));
      }
    } finally { await reader.cancel().catch(() => {}); }
    return Buffer.concat(chunks);
  }
  const bytes = response.arrayBuffer ? Buffer.from(await response.arrayBuffer()) : Buffer.from(JSON.stringify(await response.json()));
  communityAssert(bytes.length <= maximum, 'response_too_large'); return bytes;
}
export function createCommunityClient({ root, endpoint = DEFAULT_COMMUNITY_ENDPOINT, fetchImpl = globalThis.fetch, allowLocalhost = false, timeoutMs = 15000 }) {
  const url = checkedUrl(endpoint, allowLocalhost);
  async function request(action, payload = {}) {
    communityAssert(ACTIONS.has(action), 'invalid_community_action');
    validateMemberSurfaceRequest(action, payload);
    const identity = readCommunityIdentity(root);
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // Authority comes only from the existing installation credential, never caller member IDs.
      const { install_id: _id, install_credential: _credential, member_id: _member, action: _action, ...fields } = payload;
      const raw = JSON.stringify({ ...fields, action, ...identity });
      communityAssert(Buffer.byteLength(raw) <= COMMUNITY_LIMITS.jsonBytes + 8192, 'request_too_large');
      const response = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw, redirect: 'error', signal: controller.signal });
      let result; try { result = JSON.parse((await boundedBytes(response, COMMUNITY_LIMITS.jsonBytes + 8192)).toString()); } catch { throw new Error('invalid_community_response'); }
      communityAssert(![identity.install_credential, payload.grant_token].filter(Boolean).some((secret) => JSON.stringify(result).includes(secret)), 'invalid_community_response');
      if (!response.ok) {
        const code = /^[a-z][a-z0-9_]{0,63}$/.test(result?.error || '') ? result.error : `http_${response.status}`;
        const error = new Error(`community_${code}`); error.status = response.status; error.code = code; throw error;
      }
      return result;
    } catch (error) {
      if (error.code || ['invalid_community_response', 'request_too_large'].includes(error.message)) throw error;
      throw new Error('community_network_error');
    } finally { clearTimeout(timer); }
  }
  async function resolvePackage(result) {
    communityAssert(COMMUNITY_SHA_RE.test(result?.package_sha256 || ''), 'invalid_package_hash');
    let bundle = result.package;
    if (!bundle) {
      const artifact = result.artifact;
      communityAssert(artifact && COMMUNITY_SHA_RE.test(artifact.sha256 || '') && Number.isInteger(artifact.bytes) && artifact.bytes > 0 && artifact.bytes <= COMMUNITY_LIMITS.jsonBytes, 'invalid_artifact');
      const artifactUrl = checkedUrl(artifact.url, allowLocalhost);
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        // The signed URL itself authorizes this download. No installation identity is forwarded.
        const response = await fetchImpl(artifactUrl, { redirect: 'error', signal: controller.signal });
        communityAssert(response.ok, 'artifact_unavailable');
        const bytes = await boundedBytes(response, artifact.bytes);
        communityAssert(bytes.length === artifact.bytes && communityHash(bytes) === artifact.sha256, 'artifact_hash_mismatch');
        bundle = JSON.parse(bytes.toString());
      } catch (error) {
        if (['artifact_unavailable', 'artifact_hash_mismatch', 'response_too_large'].includes(error.message)) throw error;
        throw new Error('artifact_download_failed');
      } finally { clearTimeout(timer); }
    }
    if (bundle.schema_version === 2) validateCommunityPackage(bundle);
    communityAssert(hashCommunityPackage(bundle) === result.package_sha256, 'package_hash_mismatch');
    return { package: bundle, package_sha256: result.package_sha256 };
  }
  return {
    request, resolvePackage,
    listReleases: (args = {}) => request('list_releases', args),
    getRelease: (args) => request('get_release', args),
    issueGrant: (args) => request('issue_grant', args),
    redeemGrant: (args) => request('redeem_grant', args),
    installationReceipt: (args) => request('installation_receipt', args),
    submitContribution: (args) => request('submit_contribution', args),
    listContributions: (args = {}) => request('list_contributions', args),
    getContribution: (args) => request('get_contribution', args),
    reviewContribution: (args) => request('review_contribution', args),
    publishContribution: (args) => request('publish_contribution', args),
    searchLibrary: (args = {}) => request('search_library', args),
    getLibraryItem: (args) => request('get_library_item', args),
    getMyProfile: () => request('get_my_profile'),
    previewProfileUpdate: (args) => request('preview_profile_update', args),
    updateMyProfile: (args) => request('update_my_profile', args),
    publishMyProfile: (args) => request('publish_my_profile', args),
  };
}
