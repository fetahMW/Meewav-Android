import { configuration, identity, api, Report } from './core.mjs';

// Use the ordinary account permissions; never modify a personal profile.
const config = await configuration();
const report = new Report(config, 'collab-qa-preparation');
for (const account of config.accounts) {
  await report.step('Enable collaboration on verified QA profile', [{ platform: 'api', account }],
    'Only this authenticated QA account becomes available for collaboration', async () => {
      const token = await identity(config, account);
      const path = `/rest/v1/profiles?id=eq.${encodeURIComponent(account.id)}&select=id,username,collab_available`;
      const before = await api(config, path, token, undefined, 'GET');
      if (before.length !== 1 || before[0].id !== account.id || before[0].username?.toLowerCase() !== account.alias) {
        throw new Error('Profil QA différent du compte attendu.');
      }
      report.event({ platform: 'api', account }, 'previous-collab-availability', String(before[0].collab_available));
      const response = await fetch(`${config.supabaseUrl}${path}`, {
        method: 'PATCH', redirect: 'error', signal: AbortSignal.timeout(20000),
        headers: { apikey: config.apiKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ collab_available: true }),
      });
      if (!response.ok) throw new Error(`Préparation du profil QA : HTTP ${response.status}`);
      const after = await response.json();
      if (after.length !== 1 || after[0].id !== account.id || after[0].collab_available !== true) {
        throw new Error('Disponibilité collab non confirmée.');
      }
    });
}
await report.save();
console.log(report.directory);
if (report.data.results.some(result => result.status !== 'PASS')) process.exitCode = 1;
