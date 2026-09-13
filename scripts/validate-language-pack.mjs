import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] ?? process.cwd();
const errors = [];
const fail = (msg) => {
  errors.push(msg);
  console.error('error: ' + msg);
};

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const ENGINE = /^>=\d+\.\d+\.\d+$/;
const LOCALE = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const PROTO = new Set(['__proto__', 'prototype', 'constructor']);

// Orca forbids language packs from overriding these plugin-management strings.
const B = 'auto.components.settings.';
const ALLOWED = new Set(
  'auto.components.settings.PluginsSettingsSection.title,auto.components.settings.PluginsSettingsSection.systemLabel,auto.components.settings.PluginsSettingsSection.install,auto.components.settings.PluginsSettingsSection.loading,auto.components.settings.PluginsSettingsSection.empty,auto.components.settings.PluginsSettingsSection.emptyTitle,auto.components.settings.PluginsSettingsSection.noInstalledResults,auto.components.settings.PluginsSettingsSection.noInstalledResultsTitle,auto.components.settings.PluginMarketplaceBrowser.manageSources,auto.components.settings.PluginMarketplaceBrowser.addSource,auto.components.settings.PluginMarketplaceBrowser.refresh,auto.components.settings.PluginMarketplaceBrowser.refreshing,auto.components.settings.PluginMarketplaceBrowser.loading,auto.components.settings.PluginMarketplaceBrowser.tryAgain,auto.components.settings.PluginMarketplaceBrowser.clearSearch,auto.components.settings.PluginMarketplaceBrowser.empty,auto.components.settings.PluginMarketplaceBrowser.emptyTitle,auto.components.settings.PluginMarketplaceBrowser.noInstalled,auto.components.settings.PluginMarketplaceBrowser.noInstalledTitle,auto.components.settings.PluginMarketplaceBrowser.noResults,auto.components.settings.PluginMarketplaceBrowser.noResultsTitle,auto.components.settings.PluginMarketplaceBrowser.noSourcesTitle,auto.components.settings.PluginDevelopmentSection.title,auto.components.settings.PluginDevelopmentSection.add,auto.components.settings.PluginDevelopmentSection.remove,auto.components.settings.PluginDevelopmentSection.pathLabel,auto.components.settings.PluginDevelopmentSection.pathRequired,auto.components.settings.PluginDevelopmentSection.placeholder,auto.components.settings.plugins.search.title,auto.components.settings.plugins.search.description,auto.components.settings.plugins.search.install,auto.components.settings.plugins.search.permissions,auto.components.settings.plugins.search.logs,auto.components.settings.plugins.search.development'.split(','),
);
const isProtected = (i) => i.startsWith(B) && !ALLOWED.has(i) && /^plugin/i.test(i.slice(B.length));
const allowedPrefix = (i) => {
  for (const k of ALLOWED) if (k.startsWith(i + '.')) return true;
  return false;
};

const isPlainObject = (v) =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

function validateManifest(m) {
  if (!isPlainObject(m)) return fail('orca-plugin.json: root must be an object');
  if (m.manifestVersion !== 1) fail('orca-plugin.json: manifestVersion must be 1');
  if (m.pluginApi !== 1) fail('orca-plugin.json: pluginApi must be 1');
  for (const f of ['id', 'publisher']) {
    if (typeof m[f] !== 'string' || !KEBAB.test(m[f]) || m[f].length > 64 || PROTO.has(m[f]))
      fail(`orca-plugin.json: ${f} must be kebab-case (a-z, 0-9, dashes), <=64 chars`);
  }
  if (m.publisher === 'stablyai' || (typeof m.id === 'string' && m.id.startsWith('orca-')))
    fail('orca-plugin.json: id/publisher is a reserved stablyai identity');
  if (typeof m.name !== 'string' || m.name.length < 1 || m.name.length > 256)
    fail('orca-plugin.json: name must be a string 1..256');
  if (typeof m.version !== 'string' || !SEMVER.test(m.version)) fail('orca-plugin.json: version must be semver x.y.z');
  if (!isPlainObject(m.engines) || typeof m.engines.orca !== 'string' || !ENGINE.test(m.engines.orca))
    fail('orca-plugin.json: engines.orca must be ">=x.y.z"');
  const packs = m.contributes?.languagePacks;
  if (!Array.isArray(packs) || packs.length === 0) fail('orca-plugin.json: contributes.languagePacks must be a non-empty array');
  else
    for (const [idx, p] of packs.entries()) {
      if (!isPlainObject(p)) { fail(`orca-plugin.json: languagePacks[${idx}] must be an object`); continue; }
      if (typeof p.locale !== 'string' || !LOCALE.test(p.locale))
        fail(`orca-plugin.json: languagePacks[${idx}].locale is not a portable locale identifier`);
      const rp = p.path;
      if (typeof rp !== 'string' || rp.length === 0 || path.isAbsolute(rp) || rp.includes('\\') || rp.split('/').includes('..'))
        fail(`orca-plugin.json: languagePacks[${idx}].path must be a portable relative path`);
    }
}

function validateCatalog(catalogPath, label) {
  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  } catch (e) {
    return fail(`${label}: must contain one JSON object (${e.message})`);
  }
  if (!isPlainObject(catalog)) return fail(`${label}: root must be an object`);
  const seen = new WeakSet([catalog]);
  const stack = [{ node: catalog, path: '', depth: 0 }];
  let entries = 0;
  while (stack.length) {
    const s = stack.pop();
    if (s.depth > 16) return fail(`${label}: catalog exceeds depth 16`);
    for (const key of Object.keys(s.node)) {
      const val = s.node[key];
      entries += 1;
      if (entries > 20000) return fail(`${label}: catalog exceeds 20000 entries`);
      if (key.length === 0 || key.length > 128 || PROTO.has(key) || key.includes('.') || [...key].some((c) => c.charCodeAt(0) <= 31))
        return fail(`${label}: catalog key "${key || '(empty)'}" is not safe`);
      const p = s.path ? `${s.path}.${key}` : key;
      if (isProtected(p) && !(isPlainObject(val) && allowedPrefix(p)))
        return fail(`${label}: cannot replace protected security copy at ${p}`);
      if (typeof val === 'string') {
        if (val.length > 8192) return fail(`${label}: translation at ${p} exceeds 8192 characters`);
        continue;
      }
      if (!isPlainObject(val)) return fail(`${label}: translation at ${p} must be a string or object`);
      if (seen.has(val)) return fail(`${label}: catalog contains a repeated or cyclic object at ${p}`);
      seen.add(val);
      stack.push({ node: val, path: p, depth: s.depth + 1 });
    }
  }
  console.log(`ok: ${label} (${entries} entries)`);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(path.join(root, 'orca-plugin.json'), 'utf8'));
  validateManifest(manifest);
} catch (e) {
  fail('orca-plugin.json: ' + e.message);
}

if (manifest?.contributes?.languagePacks) {
  for (const p of manifest.contributes.languagePacks) {
    if (typeof p?.path !== 'string') continue;
    validateCatalog(path.join(root, p.path), p.path);
  }
}

if (errors.length) {
  console.error(`\n${errors.length} error(s)`);
  process.exit(1);
}
console.log('\nlanguage pack is valid');
