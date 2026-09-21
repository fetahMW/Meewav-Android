# Parcours Viewer Android

## Entrée et sources

Les cartes de l’accueil Rooms ouvrent maintenant `RoomViewer` dans la WebView Android. Le séquenceur de création conserve sa destination native `WaveMixerActivity` et le rôle host. Le retour Android ferme d’abord une fenêtre ou le plein écran, puis revient à l’accueil Rooms. La liste reste montée pour conserver sa sélection et son défilement.

Les six expériences proviennent de `Meewav-Web`, commit `fd426f599bda416db74e908bceaecc42766ea227`. Le graphe local et ses empreintes sont conservés dans `app/src/main/rooms-source/viewer-web` et `viewer-web-provenance.json`. Les adaptations Android restent dans `RoomViewer.tsx`, `AndroidViewerPreProfile.tsx` et `mobile.css`. L’adaptateur de pré-profil reprend le composant web et ajoute son callback de navigation vers l’artiste, avec son identité de démonstration. Aucun changement dans les composants Compose host.

## Outils repris

| Room | Parcours spectateur du site |
| --- | --- |
| Cage | Combat, vote unique, résultats et bracket, profils des artistes |
| Wave | Écoute collective, atelier personnel, import et validation de la grille, préécoute et volumes indépendants, proposition, vote et couches du beat |
| Classe | Place/siège, main levée, questions, ressources et commandes personnelles |
| Scène | Programme et détails des passages, candidature, évaluation selon son ouverture et cagnotte |
| Loge | Moment avec l’artiste, questions, demandes de cadeaux/dédicaces/rencontres et suivi personnel |
| Place | Demande de parole, clash et défis selon les permissions du spectateur |

Le chat, le mixeur personnel, les invitations et la préparation avant passage proviennent également du site. Les autorisations du rôle Viewer restent appliquées. Les commandes techniques de simulation Cage ne sont pas exposées dans l’interface mobile.

La vidéo reste au-dessus du studio. Le plein écran portrait organise le duo en deux moitiés superposées. Les pré-profils sont présentés sous la vidéo, avec fermeture et accès au profil public. Le shell Profil sait désormais résoudre `/profile/view/:profileId` ; les liens de messagerie utilisent le constructeur de routes canonique (identité réelle ou démo, message ou collaboration).

## Validation

- `node scripts/build-feature.mjs rooms` et `node scripts/build-profile.mjs`.
- `gradlew.bat :app:assembleDebug` : compilation réussie.
- `node scripts/rooms-viewer-smoke.mjs` : Chrome mobile 393 × 790, captures de chaque room, des chats et des mixeurs.
- Vérifications : vote Cage unique, pré-profil et retour, duo vertical plein écran ; décodage/import Wave et soumission d’une boucle de quatre mesures au tempo de la room ; lever/baisser la main et envoyer une question Classe ; ouvrir/fermer un passage Scène ; parcours demandes Loge ; demander/retirer la parole Place ; envoyer un chat dans les six rooms et retour à l’accueil ; ouverture du profil artiste.

Les captures de recette sont écrites dans le dossier temporaire Windows. Le script utilise Playwright installé dans le dépôt frère `Meewav-Web`.

## Limites explicites

Les cartes actuelles de l’accueil sont des fixtures de démonstration, comme sur le site. Elles ouvrent donc un état `demo` et conservent les interactions locales du site. Elles ne se synchronisent pas avec une session host Compose native. Les adaptateurs Supabase et chemins live sont importés, mais ceci ne constitue pas une validation de bout en bout d’un véritable direct, d’un paiement ou d’une publication audio/vidéo. Les disponibilités et restrictions serveur du site sont conservées.

Le Samsung était absent d’ADB lors de cette livraison : APK compilé, installation et recette sur téléphone non effectuées. Les captures disponibles proviennent du navigateur mobile de test.
