// SETA bundle loader v1
//
// Loader-only read path for dashboard-ready SETA equal/mcap bundles.
// This intentionally does not render UI, alter chart-store schemas, or change
// public/member behavior. It provides a small, testable contract for future
// dashboard surfaces to load `seta_bundles/latest/manifest.json` and then fetch
// an explicitly selected bundle CSV.

(function attachSetaBundleLoader(globalScope) {
  'use strict';

  const SETA_BUNDLE_SCHEMA_VERSION = 'seta_dashboard_bundle_v1';
  const SETA_BUNDLE_MANIFEST_URL = 'seta_bundles/latest/manifest.json';
  const SETA_BUNDLE_REQUIRED_UNIVERSES = ['all', 'crypto', 'stocks'];
  const SETA_BUNDLE_REQUIRED_WEIGHTINGS = ['equal', 'mcap'];
  const SETA_BUNDLE_REQUIRED_ROLES = ['ecosystem', 'sector', 'asset', 'multi_level'];

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function asObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  }

  function hasAllValues(values, requiredValues) {
    const found = new Set(asArray(values).map((item) => String(item).trim()).filter(Boolean));
    return requiredValues.every((item) => found.has(item));
  }

  function assertFetchAvailable(fetchImpl) {
    if (typeof fetchImpl !== 'function') {
      throw new Error('SETA bundle loader requires a fetch implementation.');
    }
  }

  function assertSafeRelativePath(path) {
    if (typeof path !== 'string' || !path.trim()) {
      throw new Error('SETA bundle file path is blank.');
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('/') || path.includes('..')) {
      throw new Error(`Unsafe SETA bundle file path: ${path}`);
    }
    return path;
  }

  function manifestBaseUrl(manifestUrl) {
    const normalized = String(manifestUrl || SETA_BUNDLE_MANIFEST_URL);
    const slash = normalized.lastIndexOf('/');
    if (slash < 0) return '';
    return normalized.slice(0, slash + 1);
  }

  function resolveManifestRelativePath(manifestUrl, relativePath) {
    const safePath = assertSafeRelativePath(relativePath);
    return `${manifestBaseUrl(manifestUrl)}${safePath}`;
  }

  function validateSetaBundleManifest(manifest) {
    const payload = asObject(manifest);
    if (!payload) {
      throw new Error('SETA bundle manifest root must be an object.');
    }
    if (payload.schema_version !== SETA_BUNDLE_SCHEMA_VERSION) {
      throw new Error(`Unsupported SETA bundle schema_version: ${payload.schema_version}`);
    }
    if (!payload.generated_at) {
      throw new Error('SETA bundle manifest missing generated_at.');
    }
    if (!payload.latest_date) {
      throw new Error('SETA bundle manifest missing latest_date.');
    }
    if (!hasAllValues(payload.universes, SETA_BUNDLE_REQUIRED_UNIVERSES)) {
      throw new Error('SETA bundle manifest missing required universes.');
    }
    if (!hasAllValues(payload.weightings, SETA_BUNDLE_REQUIRED_WEIGHTINGS)) {
      throw new Error('SETA bundle manifest missing required weightings.');
    }

    const files = asObject(payload.files);
    if (!files) {
      throw new Error('SETA bundle manifest missing files object.');
    }

    SETA_BUNDLE_REQUIRED_UNIVERSES.forEach((universe) => {
      const universeFiles = asObject(files[universe]);
      if (!universeFiles) {
        throw new Error(`SETA bundle manifest missing files.${universe}.`);
      }
      SETA_BUNDLE_REQUIRED_WEIGHTINGS.forEach((weighting) => {
        const weightingFiles = asObject(universeFiles[weighting]);
        if (!weightingFiles) {
          throw new Error(`SETA bundle manifest missing files.${universe}.${weighting}.`);
        }
        SETA_BUNDLE_REQUIRED_ROLES.forEach((role) => {
          assertSafeRelativePath(weightingFiles[role]);
        });
      });
    });

    return payload;
  }

  function bundleFileFor(manifest, universe, weighting, role) {
    const payload = validateSetaBundleManifest(manifest);
    const requestedUniverse = String(universe || '').trim();
    const requestedWeighting = String(weighting || '').trim();
    const requestedRole = String(role || '').trim();

    if (!SETA_BUNDLE_REQUIRED_UNIVERSES.includes(requestedUniverse)) {
      throw new Error(`Unsupported SETA bundle universe: ${requestedUniverse}`);
    }
    if (!SETA_BUNDLE_REQUIRED_WEIGHTINGS.includes(requestedWeighting)) {
      throw new Error(`Unsupported SETA bundle weighting: ${requestedWeighting}`);
    }
    if (!SETA_BUNDLE_REQUIRED_ROLES.includes(requestedRole)) {
      throw new Error(`Unsupported SETA bundle role: ${requestedRole}`);
    }

    const relativePath = payload.files[requestedUniverse][requestedWeighting][requestedRole];
    return assertSafeRelativePath(relativePath);
  }

  async function fetchJson(url, fetchImpl) {
    assertFetchAvailable(fetchImpl);
    const response = await fetchImpl(url, { cache: 'no-store' });
    if (!response || !response.ok) {
      const status = response && typeof response.status !== 'undefined' ? response.status : 'unknown';
      throw new Error(`Failed to fetch SETA bundle JSON ${url}: ${status}`);
    }
    return response.json();
  }

  async function fetchText(url, fetchImpl) {
    assertFetchAvailable(fetchImpl);
    const response = await fetchImpl(url, { cache: 'no-store' });
    if (!response || !response.ok) {
      const status = response && typeof response.status !== 'undefined' ? response.status : 'unknown';
      throw new Error(`Failed to fetch SETA bundle CSV ${url}: ${status}`);
    }
    return response.text();
  }

  async function loadSetaBundleManifest(options) {
    const opts = options || {};
    const manifestUrl = opts.manifestUrl || SETA_BUNDLE_MANIFEST_URL;
    const fetchImpl = opts.fetchImpl || globalScope.fetch;
    const manifest = validateSetaBundleManifest(await fetchJson(manifestUrl, fetchImpl));
    return { manifest, manifestUrl };
  }

  async function loadSetaBundleCsv(options) {
    const opts = options || {};
    const manifestUrl = opts.manifestUrl || SETA_BUNDLE_MANIFEST_URL;
    const fetchImpl = opts.fetchImpl || globalScope.fetch;
    const manifest = opts.manifest || (await loadSetaBundleManifest({ manifestUrl, fetchImpl })).manifest;
    const relativePath = bundleFileFor(manifest, opts.universe, opts.weighting, opts.role);
    const csvUrl = resolveManifestRelativePath(manifestUrl, relativePath);
    const csvText = await fetchText(csvUrl, fetchImpl);
    return {
      csvText,
      csvUrl,
      relativePath,
      universe: opts.universe,
      weighting: opts.weighting,
      role: opts.role,
    };
  }

  const api = {
    SETA_BUNDLE_SCHEMA_VERSION,
    SETA_BUNDLE_MANIFEST_URL,
    SETA_BUNDLE_REQUIRED_UNIVERSES,
    SETA_BUNDLE_REQUIRED_WEIGHTINGS,
    SETA_BUNDLE_REQUIRED_ROLES,
    bundleFileFor,
    loadSetaBundleCsv,
    loadSetaBundleManifest,
    resolveManifestRelativePath,
    validateSetaBundleManifest,
  };

  globalScope.SETA_BUNDLE_LOADER = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
