export async function navigation(target, report) {
  await report.step('GLOBE-01 Ouverture', [target], 'Globe réel et navigation principale utilisables', async () => {
    await target.navigate('/globe');
    const frameSelector = 'iframe[title="Globe MeeWav et artistes légendaires"]';
    await target.page.locator(`${frameSelector}, canvas`).first().waitFor({ state: 'visible', timeout: 45000 });
    const surface = await target.page.locator(frameSelector).count() ? target.page.frameLocator(frameSelector) : target.page;
    await surface.getByRole('button', { name: 'Messagerie', exact: true }).first().waitFor({ state: 'visible', timeout: 45000 });
    const canvases = surface.locator('canvas');
    await canvases.first().waitFor({ state: 'visible', timeout: 60000 });
    const preview = await target.page.getByText('Prévisualisation locale', { exact: false }).isVisible().catch(() => false);
    if (preview) throw new Error('Prévisualisation locale inattendue.');
  });
  await report.step('ROOMS-01 Catalogue', [target], 'Catalogue Rooms réel accessible sans changement de session', async () => {
    const catalogue = target.platform !== 'android'
      ? target.page.waitForResponse(response => new URL(response.url()).pathname === '/rest/v1/rpc/rooms_live_catalog_v1'
        && response.request().method() === 'POST', { timeout: 45000 }).catch(error => error)
      : null;
    await target.navigate('/rooms/home');
    if (catalogue) {
      const response = await catalogue;
      if (response instanceof Error) throw new Error('Aucune réponse du catalogue Rooms après ouverture.');
      if (!response.ok()) throw new Error(`Catalogue Rooms : RPC rooms_live_catalog_v1 HTTP ${response.status()}`);
    }
    await target.page.getByRole('button', { name: 'Messagerie', exact: true }).first().waitFor({ state: 'visible', timeout: 60000 });
    await target.page.locator('body').filter({ hasText: /Room/i }).waitFor({ state: 'visible' });
    if (await target.page.getByText('Les directs ne peuvent pas être actualisés', { exact: false }).isVisible().catch(() => false)) throw new Error('Le catalogue signale une erreur de chargement.');
    if (await target.page.getByText('Finale des nouveaux flows', { exact: false }).isVisible().catch(() => false)) throw new Error('Catalogue de démonstration inattendu.');
  });
  if (target.platform === 'android') {
    await report.step('ROOMS-01b Préparation', [target], 'Préparation réelle ouvrable et retour au catalogue sans lancer un live', async () => {
      await target.runNative('room-wizard');
    });
  } else if (target.platform === 'web') {
    await report.step('ROOMS-01b Rôle viewer', [target], 'Le site ne propose pas de démarrer une Room host', async () => {
      if (await target.page.getByRole('button', { name: 'Ouvrir le séquenceur de lancement', exact: true }).isVisible()) {
        throw new Error('Contrôle de lancement host exposé au navigateur viewer.');
      }
    });
  }
  await report.skipped('ROOMS-02 Créer / rejoindre / quitter', [target], 'Room QA créée par un host, rejointe par deux testeurs puis quittée',
    'Scénario coordonné sur appareils réels à lancer avec la procédure Rooms ; le smoke de navigation ne démarre pas un live.');
}
