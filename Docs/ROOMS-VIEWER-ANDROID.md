# Parcours Viewer Android

## Entrée et sources

Les cartes de l’accueil Rooms ouvrent maintenant `RoomViewer` dans la WebView Android. Le séquenceur de création conserve sa destination native `WaveMixerActivity` et le rôle host. Le retour Android ferme d’abord une fenêtre ou le plein écran, puis revient à l’accueil Rooms. La liste reste montée pour conserver sa sélection et son défilement.

Les six expériences proviennent de `Meewav-Web`, commit `fd426f599bda416db74e908bceaecc42766ea227`. Le graphe local et ses empreintes sont conservés dans `app/src/main/rooms-source/viewer-web` et `viewer-web-provenance.json`. Les adaptations Android restent dans `RoomViewer.tsx`, `AndroidViewerPreProfile.tsx` et `mobile.css`. L’adaptateur de pré-profil reprend le composant web et ajoute son callback de navigation vers l’artiste, avec son identité de démonstration. Aucun changement dans les composants Compose host. Le fichier importé `PlaceRoomExperience.tsx` comporte une adaptation locale explicite : le paramètre optionnel `initialPanelCollapsed` permet à Android de garder le studio ouvert sur les écrans tactiles. Les empreintes de provenance décrivent la source web avant ce correctif.

## Outils repris

| Room | Parcours spectateur du site |
| --- | --- |
| Cage | Combat, vote unique, résultats et bracket, profils des artistes |
| Wave | Écoute collective, atelier personnel, import et validation de la grille, préécoute et volumes indépendants, proposition, vote et couches du beat |
| Classe | Place/siège, main levée, questions, ressources et commandes personnelles |
| Scène | Programme et détails des passages, candidature, évaluation selon son ouverture et cagnotte |
| Loge | Moment avec l’artiste, questions, demandes de cadeaux/dédicaces/rencontres et suivi personnel |
| Place | Demande de parole, clash et défis selon les permissions du spectateur |

Le modèle du chat, du mixeur personnel, des invitations et de la préparation avant passage provient du site. Sur Android, le mixeur et le champ de saisie utilisent maintenant les composants Compose du host (`MixerBody`, `WaveChatComposer`, `MwEmojiWall`). Les autorisations du rôle Viewer restent appliquées. Les commandes techniques de simulation Cage ne sont pas exposées dans l’interface mobile.

La vidéo reste au-dessus du studio. Le plein écran portrait organise le duo en deux moitiés superposées. Les pré-profils sont présentés sous la vidéo, avec fermeture et accès au profil public. Le shell Profil sait désormais résoudre `/profile/view/:profileId` ; les liens de messagerie utilisent le constructeur de routes canonique (identité réelle ou démo, message ou collaboration).

## Validation

- `node scripts/build-feature.mjs rooms` et `node scripts/build-profile.mjs`.
- `gradlew.bat :app:assembleDebug` : compilation réussie.
- `node scripts/rooms-viewer-smoke.mjs` : Chrome mobile 393 × 790, captures de chaque room, des chats et des mixeurs.
- Vérifications : vote Cage unique, pré-profil et retour, duo vertical plein écran ; décodage/import Wave et soumission d’une boucle de quatre mesures au tempo de la room ; lever/baisser la main et envoyer une question Classe ; ouvrir/fermer un passage Scène ; parcours demandes Loge ; demander/retirer la parole Place ; envoyer un chat dans les six rooms et retour à l’accueil ; ouverture du profil artiste.

Les captures de recette sont écrites dans le dossier temporaire Windows. Le script utilise Playwright installé dans le dépôt frère `Meewav-Web`.

## Limites explicites

Les cartes actuelles de l’accueil sont des fixtures de démonstration, comme sur le site. Elles ouvrent donc un état `demo` et conservent les interactions locales du site. Elles ne se synchronisent pas avec une session host Compose native. Les adaptateurs Supabase et chemins live sont importés, mais ceci ne constitue pas une validation de bout en bout d’un véritable direct, d’un paiement ou d’une publication audio/vidéo. Les disponibilités et restrictions serveur du site sont conservées.

Le premier APK n’avait pas été installé, le Samsung étant déconnecté. Après reconnexion le 21 septembre, son ancienne version a été remplacée. Le contrôle sur téléphone a révélé le repli par défaut du studio sur écran tactile ; le correctif impose son ouverture initiale sur Android. Le scénario navigateur utilise désormais `isMobile: true` et `hasTouch: true` pour couvrir ce comportement.

Recette Samsung après réinstallation : une carte ouvre `RoomsActivity`, panneau `is-viewer-panel`, sans panneau host et sans état replié. Le chat, le mixeur personnel et l’onglet spécifique sont visibles. Capture : `viewer-device-fixed.png` dans le dossier temporaire.

## Composants natifs partagés avec le host

`RoomViewerNativeControls` place les composants Compose dans les rectangles du Viewer fournis par `NativeViewerSurfaces`. Le canal est limité à la page locale Rooms et aux navigations principales de confiance. Le contrôle disparaît pendant les dialogues web, en plein écran et à la sortie de la room. Les insets système et clavier restent gérés par `MessagingActivity`.

Le chat conserve son gestionnaire d’envoi web et ses permissions. Le brouillon n’est effacé qu’après confirmation ; un échec ou une absence de confirmation conserve le texte. Les emojis partagent le format `[[mw:…]]`. La voix et les effets sont reliés au mixeur personnel du Viewer. Le deck utilise le moteur natif, ses imports, pads et chronomètre, en lecture privée : il ne publie pas vers la scène et son bouton Public est désactivé. Cela ne valide pas une transmission RTC réelle.

`node scripts/rooms-viewer-native-smoke.mjs` vérifie les rectangles natifs, l’envoi avec emoji et son accusé de réception, le passage mixeur/outils et le retrait des contrôles à la sortie dans les six rooms. Les composants host gardent leur comportement d’origine.

La barre du retour vidéo reprend `live-action-bar.css`, source du matériau natif `RoomVideoMaterial.kt`, dans `viewer-video-controls.css`. Son sélecteur est adapté au conteneur Viewer (qui n’a pas l’ancêtre web `.rooms-page`). Dimensions Android : coque de 52 px, touches optiques de 34 px, liseré irisé et fond noir. Les actions Viewer et leurs compteurs restent conservés. Le test mobile capture la barre dans chaque room et vérifie son masquage après inactivité.

Correctifs Samsung : compteurs compacts (`12K`), suppression des coins vidéo et du châssis de fenêtre autour du mixeur. La vidéo occupe toute la largeur ; le corps du mixeur commence immédiatement sous la barre avec 12 dp de marge latérale, comme chez le host. Capture de recette : `viewer-mixer-fixed.png`.

Le relâchement tactile ne masque plus immédiatement les contrôles : ils restent visibles pendant l’appui, puis trois secondes après la dernière interaction. Le test couvre aussi `pointerleave` après un toucher. Le plein écran WebView est autorisé pour Rooms, avec `SCREEN_ORIENTATION_FULL_SENSOR`, puis restauration du portrait à la fermeture. Vérifié sur Samsung : entrée en plein écran, orientation demandée FULL_SENSOR, fermeture et retour au studio ; la rotation physique du téléphone reste à confirmer par l’utilisateur.

La perte de focus (`blur`) relance elle aussi le délai : elle ne masque plus la barre entre l’appui et le relâchement. Le bandeau « Revenir à la réalisation » a été supprimé. Les portraits vidéo ouvrent le pré-profil partagé ; les portraits du chat sont maintenant des boutons ouvrant cette même feuille. Le bouton explicite « Voir profil » reste l’accès à la page complète. Depuis le plein écran, l’ouverture du pré-profil revient d’abord au studio.

Les cartes Programme/participation/cagnotte de la Scène reprennent le noir et le relief discret des éléments du mixeur. Le chat utilise le dégradé du corps du mixeur sans couche web violette : portraits 28 px, gouttière 8 px, nom 11 px, message 12 px/interligne 17 px, séparation nom-message 1 px, padding vertical 5 px. Le scénario mobile teste l’ouverture des pré-profils vidéo/chat dans les six rooms, et conserve les captures de chaque onglet.

## Finalisation du socle Viewer

Les six types utilisent `RoomViewer`, `NativeViewerSurfaces` et les mêmes composants natifs chat/mixeur. Les styles et corrections vidéo sont partagés, avec la composition de battle spécifique à la Cage conservée. Portrait host en haut à gauche, chrono centré, identité de room en haut à droite, commandes centrées et régie discrète. Le bandeau épinglé est retiré du chat Viewer. La Scène ne superpose plus de fond noir à la surface grise du studio.

Le toucher Viewer ne modifie plus la composition. Les transitions documentaires `startViewTransition` sont désactivées dans le conteneur Android pour ne pas masquer les superpositions vidéo. `rooms-viewer-transition-check.mjs` contrôle ce contrat sans capture. Le splash système utilise un rendu du vinyle existant généré par `build-launch-vinyl.mjs`.

À la demande de l’utilisateur, la validation visuelle finale lui appartient ; seules les compilations et vérifications mécaniques sont exécutées.
