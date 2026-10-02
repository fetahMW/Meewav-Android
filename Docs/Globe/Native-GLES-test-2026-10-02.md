# Globe Android — branche de test native

## Copie et annulation

- Branche : `codex/android-native-globe-test`.
- Base complète avant portage : `6961acb086c449b0fb798ef0ac4ac71c3a29357e`.
- Cette base copie aussi les modifications locales de gestes, de portraits et les assets générés présents le 2 octobre. Le checkout de travail d'origine reste sur `codex/ui-parity-chat-composer`.
- Application de test indépendante : `com.meewav.android.globetest`, nom **Meewav Globe Test**, avec un logo Meewav distinct marqué **TEST**. L'application habituelle `com.meewav.android.debug` et ses données restent disponibles, sur Redmi comme sur S22.
- Revenir immédiatement à l'ancien rendu : fermer l'application de test et ouvrir Meewav habituel. Aucun remplacement de l'APK habituel n'est requis.
- Revenir au code initial : utiliser la base ci-dessus dans un autre worktree. Ne pas réinitialiser le checkout d'origine ni retirer ses modifications locales.

## Architecture du portage

Les appels GPU de la scène principale s'exécutent en C++ avec OpenGL ES 3 dans un contexte EGL Android. Le renderer natif est présenté par une `TextureView` sous les contrôles. Le contexte WebGL2 de Chromium n'est pas créé pour ce globe.

Three.js reste le graphe de scène CPU et produit ses shaders GLSL, matrices, uniforms et commandes. Un contexte compatible encode les commandes en lots binaires ; la passerelle Java/JNI les exécute sur un thread EGL dédié. Les géométries et textures sont conservées dans des buffers GPU persistants. Les introspections de programmes et les capacités GPU passent par des requêtes synchrones au démarrage ou à la compilation d'une nouvelle matière.

Ce choix reprend les shaders exacts, y compris clearcoat et reflets personnalisés, plutôt que remplacer leur aspect par une approximation. Il conserve aussi les algorithmes et données existants : globe et territoires streamés, labels, étoiles, atmosphère, monuments GLB/DRACO, disque et bord profilé, bloom HDR, portraits instanciés, avatars terrestres, picking, fly, inertie, recherche, profils et pré-pop-ups. Les panneaux HTML et les contrôles Android restent les mêmes.

Le framebuffer principal natif utilise le même budget de pixels (DPR plafonné à 2), RGBA8 et MSAA jusqu'à quatre échantillons. Sa résolution est explicite avant les copies du bloom. Le fond radial original est composé à la présentation. Chaque frame est acquittée après `eglSwapBuffers`; l'écran de chargement et le verrou de rotation attendent aussi le layout correspondant. Le thread EGL conserve un pbuffer pour permettre nettoyage et introspection même lorsque la fenêtre est en arrière-plan.

Il s'agit du portage du **rendu GPU complet** ; la logique CPU Three/JavaScript et l'interface WebView sont conservées. Ce n'est pas une réécriture de toute l'application en C++.

## Construction et lancement

```powershell
node scripts/build-full-globe.mjs C:/Users/linkw/Desktop/Meewav-Web
.\gradlew.bat :app:assembleGlobeTest
```

APK : `app/build/outputs/apk/globeTest/app-globeTest.apk`.

Le build `debug` habituel garde `NATIVE_GLOBE=false`. Seul `globeTest` active le backend natif. Le raccourci de démo existant `OPEN_GLOBE` + `GPU_AUDIT` permet de comparer sans compte, avec tous les avatars de démonstration. Installation et lancement du test réservés au Redmi ; le S22 conserve l'ancien APK.

## Vérification et limites des mesures

- Les 59 tests de pré-profils/fly et les 23 tests de navigation existants passent sur la copie.
- Les six tests du transfert natif vérifient les slices de buffers, floats, offsets d'indices, instancing, tableaux de textures half-float, adresse uniforme zéro, capacités et texte GLSL UTF-8. Le test d'un atlas de 48 couches reconstruit et compare tous les octets après transfert par lots de quatre MiB.
- 2 055 fichiers de données, images, modèles et médias de la base sont présents avec les mêmes tailles. Le port ne réduit ni les informations ni les mécaniques.
- `window.meewavNativeGlobeStatus()` expose le backend, les numéros de frames soumises/rendues/swapées et les erreurs. `window.meewavNativeGlobeGpuInfo()` fournit le GPU natif et les nombres de buffers/textures/programmes.
- Le gain GPU n'est pas présumé. Le coût du transfert JNI/Base64, des nouvelles matières et de la composition doit être mesuré sur Redmi. Une comparaison S22/Redmi est utile pour le ressenti et le visuel, mais ne suffit pas à isoler un gain du moteur : les deux GPU sont différents.
- Les captures et gestes automatiques sur écran ne font pas partie du protocole autorisé. La parité visuelle finale et les gestes physiques sont à confirmer sur téléphone.

## État de l'essai sur Redmi

Le 2 octobre, le build complet `assembleGlobeTest` et les 88 tests ci-dessus ont réussi. SHA-256 du premier APK préparé : `CDC1BAFE9F2B936F84C272DC61C0A26DEFC453F08CC1D407ADF8C6DF3B3B9503`.

Le Redmi était connecté par ADB Wi-Fi, mais en veille (`Dozing`, non interactif). Les deux tentatives d'installation normales ont été refusées avec `INSTALL_FAILED_USER_RESTRICTED: Install canceled by user`. Le package de test n'est pas installé. Aucun contournement, réveil automatique ou lancement n'a été effectué ; le S22 n'a pas été modifié.

Après la reprise « go redmi », le Redmi était réveillé et interactif. Une nouvelle tentative normale du build corrigé (`BAFE49A86FDD2953C258BF6CDF4ED4D624F48B2521FEB554DA6A80900EC56523`) a aussi été refusée avec la même erreur. Le refus ne peut donc pas être attribué uniquement à l'écran en veille.

L'audit du démarrage a corrigé le nettoyage EGL partiel (échec avant création du contexte), la propriété de la SurfaceTexture à la fermeture et la destruction C++ si la création des framebuffers échoue. Ces chemins ont été relus ; sans injection d'échec sur un appareil, leur exécution réelle reste à vérifier.

APK recompilé après ces corrections : SHA-256 `2656F40D60B5318F9CB6DC84446BEDD80C4B99B49B77F2E67FA9508A11B38609`.

Après la demande explicite d'une deuxième application et d'un deuxième logo, l'icône de test est définie uniquement dans `app/src/globeTest/res/drawable/ic_launcher.xml`. Le logo normal de `src/main` reste intact. Le dernier APK séparé, compilé avec ce logo, porte le SHA-256 `B3AD73CAD8B9D64065E3BC83A840BBB31D639C3F4069AB16B8D06F17C4BAE001`. Aucune mise à jour de l'application habituelle n'a été installée.

Une tentative normale d'installation de ce dernier APK a encore été annulée par Android, alors que le Redmi était interactif. Le fichier a ensuite été transféré sans ouvrir l'installateur dans `/sdcard/Download/Meewav-Globe-Test.apk` (1 535 259 323 octets). Son SHA-256 calculé sur le Redmi correspond à celui de l'APK ci-dessus. L'installation peut être acceptée manuellement depuis **Fichiers → Téléchargements → Meewav-Globe-Test.apk**. Le dernier relevé confirme que le package de test n'est pas encore présent ; aucun test d'exécution n'a donc été effectué.

Après l'installation manuelle, le premier chargement a révélé un rejet **HTTP 403** de la page locale : l'URL test ajoute `renderer=native`, mais le filtre des assets ne permettait que `mode=demo` ou `mode=real`. Aucun JavaScript du globe n'avait démarré. Le filtre autorise maintenant les deux URL natives exactes uniquement lorsque `NATIVE_GLOBE=true`, sur l'index principal. Les autres paramètres et les requêtes de fichiers restent restreints. Les trois tests JVM de cette règle passent (`:app:testDebugUnitTest --tests com.meewav.android.features.auth.GlobeEntryQueryTest`) ; `assembleGlobeTest` réussit. APK corrigé : SHA-256 `4E7F553915B163AFCA0D29B9F50267BB3AD90BBCC822CCBB7A88BA5EB39D5625`.

L'APK corrigé a été installé normalement sur le Redmi. La page locale répond maintenant HTTP 200, puis `meewavFullGlobe.status` devient `ready`. Un relevé stable confirme 2 742 frames rendues et présentées, `layout=appliedLayout=13`, sans erreur native. Le pilote est `ARM Mali-G610 MC4`. Ces compteurs prouvent l'exécution du rendu natif ; ils ne prouvent pas sa parité visuelle ni un gain de fluidité.

## Essai plein écran et fluidité

L'utilisateur a signalé une image trop petite et davantage de lag que sur le S22. La gestion des tailles a été corrigée : `TextureView` réinitialise le buffer producteur à la taille physique de la vue lors de son redimensionnement. Le callback natif ignorait ce changement alors que le raster du globe conserve un DPR plafonné à 2. Il reconstruit maintenant la fenêtre EGL après ce changement et réapplique la taille raster. La présentation couvre les dimensions EGL réellement interrogées. Les tailles `rasterWidth/Height`, `surfaceWidth/Height` et `viewWidth/Height` sont exposées par le status léger pour vérifier ce contrat sur appareil.

Le transfert utilise `Uint8Array.toBase64()` lorsqu'il existe, avec le chemin précédent conservé en secours. Les uniformes déjà typés ne passent plus par deux tableaux JavaScript intermédiaires ; les octets restent copiés immédiatement dans le paquet. Les huit tests de transfert passent, notamment les offsets/mutations et l'égalité des paquets entre les deux chemins Base64. Le programme de présentation conserve sa location d'uniforme et ne reparcourt plus un batch vide au moment de présenter.

`window.meewavNativeGlobePerformance()` expose des échantillons récents d'encodage/transfert JS et de décodage/exécution/présentation/swap natifs. Ces temps sont des durées CPU ou d'attente ; ce ne sont pas des mesures GPU. `queueWaitMs` mesure uniquement l'attente du sémaphore de soumission. Cette lecture est séparée du status et du polling de première frame. Comparer les deux moteurs sur le même Redmi, dans la même vue, après chargement, avant de conclure sur un gain.

Le nouvel APK (`678135014299DA1526684CE17DE2282A1CC16014BE08A008FDF2677D389092DF`) a été compilé et installé normalement dans l'application de test. Le Redmi était ensuite en veille ; cette version n'a pas été lancée. **Le plein écran et la fluidité de ce dernier build restent à valider sur appareil réveillé.** Les parcours disque/territoires/avatars/pré-profils/fly et les gestes physiques restent aussi à confirmer. Le S22 et les applications habituelles n'ont pas été mis à jour.

Références du contrat de taille : [TextureView.onSizeChanged](https://android.googlesource.com/platform/frameworks/base/+/540e22284684/core/java/android/view/TextureView.java#403), [SurfaceTexture.setDefaultBufferSize](https://android.googlesource.com/platform/frameworks/base/+/cdf0088/graphics/java/android/graphics/SurfaceTexture.java#135). Encodage direct : [spécification TC39](https://tc39.es/proposal-arraybuffer-base64/spec/), [Chrome 140](https://developer.chrome.com/release-notes/140).

Références Android : [TextureView](https://developer.android.com/reference/android/view/TextureView), [SurfaceTexture et redimensionnement EGL](https://developer.android.com/reference/android/graphics/SurfaceTexture#setDefaultBufferSize(int,int)), [EGL14](https://developer.android.com/reference/android/opengl/EGL14).
