#!/usr/bin/env node
/**
 * Offline export of the canonical Web onboarding catalogue for Android.
 * Usage: node scripts/export-music-scenes.mjs [--web-root C:/path/Meewav-Web]
 * Requires Node 24+. Reads the Web checkout without modifying it or using the
 * network. The actual Web parser and interior-centre algorithm are executed;
 * geometries, identifiers and names are preserved without simplification.
 */
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';

const androidRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webRootArgument = process.argv.indexOf('--web-root');
const webRoot = path.resolve(webRootArgument >= 0
  ? process.argv[webRootArgument + 1]
  : path.join(androidRoot, '..', 'Meewav-Web'));
const dataRoot = path.join(webRoot, 'vendor', 'globe-vinyle', 'data');
const outputRoot = path.join(androidRoot, 'app', 'src', 'main', 'assets', 'music-scenes');
const geographyVersion = 'vinyl-v1';
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const writeJson = async (file, payload) => writeFile(file, `${JSON.stringify(payload)}\n`, 'utf8');
const asModuleUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;

async function readWebModule(relativePath) {
  const source = await readFile(path.join(webRoot, relativePath), 'utf8');
  return stripTypeScriptTypes(source, { mode: 'transform' });
}

// These modules have no DOM dependency. Their fetch calls are redirected only
// to the corresponding local source files, preserving the Web enrichments.
const centerModuleUrl = asModuleUrl(await readWebModule('src/features/auth/musicSceneVisualCenter.ts'));
const searchModuleUrl = asModuleUrl(`
  import { readFile } from 'node:fs/promises';
  import path from 'node:path';
  const fetch = async (assetPath) => ({
    ok: true,
    json: async () => JSON.parse(await readFile(path.join(${JSON.stringify(webRoot)}, 'public', assetPath.replace(/^\\//, '')), 'utf8')),
  });
  ${await readWebModule('src/features/globe/maplibre/search-france/loadFranceCommunesIndex.ts')}
`);
const selectionCode = (await readWebModule('src/features/auth/musicSceneSelection.ts'))
  .replace(/^import[\s\S]*?;\s*/gm, '');
const selectionModule = await import(asModuleUrl(`
  import { readFile } from 'node:fs/promises';
  import path from 'node:path';
  import { findInteriorVisualCenter } from ${JSON.stringify(centerModuleUrl)};
  import { loadFranceCommunesIndex } from ${JSON.stringify(searchModuleUrl)};
  const loadGlobeData = async (assetPath) => JSON.parse(await readFile(path.join(${JSON.stringify(dataRoot)}, assetPath), 'utf8'));
  ${selectionCode}
  export { parseSceneCollection };
`));

function geometryBbox(geometry) {
  const bbox = [Infinity, Infinity, -Infinity, -Infinity];
  const visit = (coordinates) => {
    if (!Array.isArray(coordinates)) return;
    if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
      bbox[0] = Math.min(bbox[0], coordinates[0]);
      bbox[1] = Math.min(bbox[1], coordinates[1]);
      bbox[2] = Math.max(bbox[2], coordinates[0]);
      bbox[3] = Math.max(bbox[3], coordinates[1]);
    } else coordinates.forEach(visit);
  };
  visit(geometry?.coordinates);
  return bbox.every(Number.isFinite) ? bbox : null;
}

function featureZoneId(feature) {
  return String(feature.properties?.zoneId ?? feature.properties?.zone_id
    ?? feature.id ?? feature.properties?.id ?? '').trim();
}

await mkdir(path.join(outputRoot, 'scenes'), { recursive: true });
const [cities, quarterIndex, communeIndex, sectors] = await Promise.all([
  selectionModule.loadMusicSceneCityIndex(),
  readJson(path.join(dataRoot, 'quarters', 'index.json')),
  readJson(path.join(dataRoot, 'communes', 'index.json')),
  readJson(path.join(dataRoot, 'sectors.geojson')),
]);
const quarterByCode = new Map(quarterIndex.assets.map((asset) => [asset.cityCode, asset]));
const catalogCities = cities.map(({ communeCode, result }) => ({
  communeCode,
  id: result.id,
  label: result.label,
  subtitle: result.subtitle,
  departmentCode: result.departmentCode,
  departmentName: result.departmentName,
  regionName: result.regionName,
  population: result.population ?? 0,
  center: result.center,
  postalCodes: result.postalCodes ?? [],
  aliases: result.aliases ?? [],
  source: result.source,
}));
const catalogByCode = new Map(catalogCities.map((city) => [city.communeCode, city]));
const byDepartment = new Map();
for (const city of cities) {
  const code = city.result.departmentCode;
  if (!byDepartment.has(code)) byDepartment.set(code, []);
  byDepartment.get(code).push(city);
}

let sceneCount = 0;
let departmentCount = 0;
for (const asset of communeIndex.assets) {
  const departmentCities = byDepartment.get(asset.department) ?? [];
  const communes = await readJson(path.join(dataRoot, asset.path));
  const communeByCode = new Map(communes.features.map((feature) => [String(feature.properties.code), feature]));
  const departmentScenes = {};
  for (const city of departmentCities) {
    const commune = communeByCode.get(city.communeCode);
    catalogByCode.get(city.communeCode).bbox = geometryBbox(commune?.geometry);
    let features;
    if (city.communeCode === '75056') {
      features = sectors.features.filter((feature) => feature.properties.kind === 'quartier'
        && String(feature.id).startsWith('fr-paris-'));
    } else if (quarterByCode.has(city.communeCode)) {
      features = (await readJson(path.join(dataRoot, quarterByCode.get(city.communeCode).path))).features;
    } else {
      features = communes.features.filter((feature) => String(feature.properties.code) === city.communeCode);
    }
    const sourceFeatures = new Map(features.map((feature) => [featureZoneId(feature), feature]));
    const scenes = selectionModule.parseSceneCollection({ features }, city).map((scene) => {
      const feature = sourceFeatures.get(scene.zoneId);
      return {
        ...scene,
        geometry: feature.geometry,
        ...(feature.properties?.sourceIds ? { sourceIds: feature.properties.sourceIds } : {}),
        ...(feature.properties?.sourceCode ? { sourceCode: feature.properties.sourceCode } : {}),
      };
    });
    if (!scenes.length) throw new Error(`No canonical Web scene available for ${city.communeCode}.`);
    departmentScenes[city.communeCode] = scenes;
    sceneCount += scenes.length;
  }
  await writeJson(path.join(outputRoot, 'scenes', `${asset.department}.json`), {
    version: 1, geographyVersion, cities: departmentScenes,
  });
  departmentCount += 1;
  if (departmentCount % 10 === 0) process.stdout.write(`Exported ${departmentCount} departments.\n`);
}

await writeJson(path.join(outputRoot, 'catalog.json'), {
  version: 1,
  geographyVersion,
  cities: catalogCities,
  departments: communeIndex.assets.map((asset) => ({ departmentCode: asset.department, bbox: asset.bounds })),
});

// Keep original attribution with the derived database. This file's historical
// counts describe source snapshots; they are not the Android catalogue count.
await copyFile(path.join(dataRoot, 'SOURCES.md'), path.join(outputRoot, 'SOURCES.md'));
await writeJson(path.join(outputRoot, 'provenance.json'), {
  version: 1,
  geographyVersion,
  sourceRepository: 'Meewav-Web',
  sourcePaths: [
    'vendor/globe-vinyle/data/cities.json',
    'vendor/globe-vinyle/data/quarters/index.json',
    'vendor/globe-vinyle/data/quarters/*.geojson',
    'vendor/globe-vinyle/data/communes/index.json',
    'vendor/globe-vinyle/data/communes/*.geojson',
    'vendor/globe-vinyle/data/sectors.geojson',
    'public/search/france-communes-index.json',
  ],
  logicPaths: [
    'src/features/auth/musicSceneSelection.ts',
    'src/features/auth/musicSceneVisualCenter.ts',
    'src/features/globe/maplibre/search-france/loadFranceCommunesIndex.ts',
  ],
  coordinateOrder: '[longitude, latitude]',
  centerMethod: 'Exact canonical Web findInteriorVisualCenter; original parser fallbacks preserved.',
  geometryMethod: 'Original scene Polygon/MultiPolygon including interior rings; no simplification.',
  geographicScope: 'Canonical vinyl-v1 city and scene catalogue; scene.source preserves the Web category even where source geometry is a Paris administrative quartier.',
  licenseNotice: 'See SOURCES.md for ODbL 1.0, Licence Ouverte / Open Licence 2.0, and source attribution details.',
  regeneration: 'node scripts/export-music-scenes.mjs --web-root <canonical Meewav-Web checkout>',
  cityCount: catalogCities.length,
  sceneCount,
  departmentCount,
});
process.stdout.write(`Exported ${catalogCities.length} cities and ${sceneCount} scenes to ${outputRoot}.\n`);
