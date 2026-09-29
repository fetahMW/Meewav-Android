import { configuration, Report, identity, api } from './core.mjs';

const config = await configuration();
const report = new Report(config, 'backend-preflight');
const targets = config.accounts.map(account => ({ platform: 'Supabase', account }));
for (const target of targets) {
  await report.step('AUTH-API Identité', [target], 'Compte Auth réel, marqué QA, avec le même identifiant que le profil', async () => {
    target.token = await identity(config, target.account);
    const profiles = await api(config, `/rest/v1/profiles?id=eq.${target.account.id}&select=id,username`, target.token, undefined, 'GET');
    if (profiles.length !== 1 || profiles[0].username !== target.account.alias) throw new Error('Profil et compte Auth différents.');
  });
}
for (const target of targets.filter(t => t.token)) {
  await report.step('MSG-API Contacts', [target], 'Les deux autres testeurs sont joignables depuis la recherche réelle', async () => {
    for (const peer of targets.filter(t => t !== target)) {
      const rows = await api(config, '/rest/v1/rpc/search_messageable_profiles_v1', target.token, { p_query: peer.account.alias, p_limit: 20 });
      if (!rows.some(r => r.profile_id === peer.account.id)) throw new Error(`Contact ${peer.account.alias} introuvable`);
    }
  });
  await report.step('ROOMS-API Catalogue', [target], 'Fonction réelle du catalogue Rooms disponible avec les permissions du compte', async () => {
    const rows = await api(config, '/rest/v1/rpc/rooms_live_catalog_v1', target.token, {});
    if (!Array.isArray(rows)) throw new Error('Réponse de catalogue invalide.');
  });
}
report.data.finishedAt = new Date().toISOString();
await report.save();
console.log(`Rapport : ${report.directory}`);
if (report.data.results.some(r => r.status === 'FAIL')) process.exitCode = 1;
