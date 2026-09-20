# Barre vidéo commune Android

## Références
- iOS : Meewav/Features/Rooms/Components/Place/PlaceVideoComponents.swift, PlaceCameraControlsOverlay et revealHostControls.
- Web : src/features/rooms/place/PlaceStage.tsx et live-action-bar.css.
- iOS : boutons circulaires 34 points, espacement 8 points, affichage 160 ms, disparition 220 ms après 3 secondes.
- Android : boutons visibles 34 dp, cibles indépendantes 48 dp, capsule noire satinée avec reflet violet discret issue du web.

## Intégration
RoomVideoControls est créé une seule fois dans WaveMixerScreen pour Wave, Cage, Place, Classe, Loge et Scène. La même instance commande les présentations normale et plein écran. Les réglages survivent au changement d’onglet et au passage plein écran.

Ordre : régie, changement de caméra, caméra, micro host, son du retour vidéo, capture d’écran, plein écran. La régie existante reste accessible à gauche et conserve les compositions propres à Cage. Les anciens boutons de régie/plein écran sont remplacés, pas doublés. Le contrôle Masquer le podium de Cage reste dans sa régie.

Le conteneur vidéo observe les pressions sans consommer les événements : sélection de fader invité, glisser-déposer et déplacement de la miniature du host conservent leurs gestes. La barre disparaît après trois secondes d’inactivité, avec prolongation selon les réglages d’accessibilité. Une pression maintenue, un focus clavier ou la demande système de capture suspendent le délai.

## Fonctions locales et limites de transport
- Caméra : le bouton de changement demande l’autorisation Android et ouvre une vraie caméra Camera2. Les appuis suivants alternent avant/arrière. La vidéo de démonstration initiale est conservée tant que l’utilisateur ne demande pas la caméra. Arrêt/libération en arrière-plan, à la fermeture, caméra coupée, et lors du passage entre fenêtres.
- Micro : même état host que le mixeur, distinct du micro de l’invité sélectionné. Dans Cage, il coupe aussi le son de la vidéo host. Ce n’est pas encore un microphone RTC publié.
- Retour vidéo : coupe/rétablit les pistes audibles des vidéos host/invités ; ne modifie pas les gains des invités ni les lecteurs du mixeur/Wave.
- Capture d’écran : consentement MediaProjection natif, service de premier plan mediaProjection, notification Arrêter, aperçu local limité à 720 px / 5 images par seconde. Arrêt depuis la barre, la notification ou à la sortie de room ; arrêt système pris en compte ; refus sans changement de source. Redimensionnement du contenu capturé sans réutiliser un jeton de consentement.
- Les rooms natives actuelles n’ont pas de session RTC de publication. L’interface indique donc aperçu local avant de demander la capture et sur le retour écran. Aucun flux n’est annoncé comme transmis au public. Le futur transport devra consommer les sources caméra/écran et raccorder le micro.

Compilation : assembleDebug. Aucun test ni inspection visuelle automatique exécuté, conformément aux consignes.
