# Régie vidéo Android — 19 septembre 2026

## Écran de destination

La référence Android est **WaveMixerActivity / WaveMixerScreen**, à partir du
commit `9233783` (19 septembre), dans `Meewav-Android-initialisation`, branche
`codex/marketplace-scene`. Son mixeur Compose, son chat, ses matériaux et ses
onglets restent en place. Ne pas utiliser l’ancienne `WaveRoom.tsx` comme écran
Host à présenter à l’utilisateur. Le lancement d’un Host Wave depuis le
séquenceur en aperçu ouvre maintenant cette activité native.

L’entrée de développement directe est l’extra booléen
`com.meewav.android.OPEN_WAVE_MIXER` sur MainActivity.

## Provenance et composition

`rooms-source/director-web/provenance.json` enregistre le commit et les fichiers
copiés depuis le site canonique Meewav-Web. PlaceStage, LiveActionBar, le moteur
de composition et les matériaux de la navbar sont les composants Web réels,
compilés dans un document local, embarqué dans la zone vidéo native.
Les sources du site n’ont pas été modifiées.

Les publications **desktop (16:9)** et **Short (9:16)** restent distinctes.
Les recettes du moteur et leurs grilles ne sont pas remplacées par une grille
mobile uniforme : duo desktop, galerie Short, duo mixte 70/30, mise en avant,
Solo et compositions jusqu’à quatre participants gardent les règles du site.
Le menu Sources permet de manipuler ces cas dans l’aperçu de démonstration.

Les adaptations de PlaceStage/PlaceStageLayoutTile sont limitées à l’ajout de
flux caméra locaux explicites (sans faux identifiant de publication RTC), au
bouton caméra avant/arrière et à la possibilité de masquer le partage d’écran
quand le conteneur Android ne le prend pas en charge. Les commandes tactiles et
menus reçoivent une géométrie mobile ; les médias conservent leurs dimensions.

## Mécanique et limites

- Caméra et micro : getUserMedia, autorisations Android uniquement sur action,
  refus traité, caméra avant/arrière, pistes libérées à la sortie/arrêt.
- Retour micro local : lecture du vrai flux, désactivée au départ.
- Cadrages : moteur Web, sélection de sources/participants, Ensemble / Mise en
  avant / Solo, scène élargie, plein écran paysage et restauration d’orientation.
- La WebView est persistante pendant les changements d’onglet du mixeur ; aucune
  reconstruction du mixeur ou du chat pour changer le cadrage.
- Navigation réseau interdite dans la régie embarquée ; assets HTTPS locaux
  filtrés par manifeste, CSP, lecture vidéo par plages d’octets. Aucun jeton
  d’authentification exposé au document de démonstration.

**Cette entrée reste un aperçu local**, comme le mixeur natif avant ce portage.
La caméra n’est pas publiée vers des spectateurs distants. Le contrat Web RTC
et les règles d’autorisation des sources restent conservés dans les sources,
mais le transport Room réel et la synchronisation multi-appareils ne sont pas
branchés dans cet écran Compose. Ne pas présenter cela comme une diffusion live
validée. Le partage d’écran Android nécessite MediaProjection et n’est pas
affiché comme une commande faussement fonctionnelle. Le wallet hérité du site
reste une démonstration ; aucun paiement réel.

## Livraison

`node scripts/build-feature.mjs rooms` produit les deux documents Rooms et régie.
`scripts/import-room-director.mjs` est un import explicite, pas une étape normale
de build : le relancer écraserait les adaptations des deux fichiers mentionnés.
`scripts/sync-room-director-media.mjs` copie les médias originaux sans compression.
Compilation APK autorisée pour livraison. Aucun test, capture ou contrôle visuel
automatique : validation du rendu sur appareil laissée à l’utilisateur.
