# Audit du câblage Android et Meewav Windows — 26 septembre 2026

> **État initial, avant corrections.** Les constats ci-dessous sont conservés comme historique. Ils ne décrivent plus le code corrigé : le transport Windows a été porté vers BytePlus et l’autotune propriétaire a été raccordé. Consulter le [bilan et contexte de reprise](C:/Users/linkw/Desktop/Meewav-Windows/REPRISE_APRES_SUPABASE_2026-09-26.md) pour l’état courant, les validations et les opérations serveur encore à faire.

Périmètre : application Android et studio intégré à Meewav Windows (« OBS Meewav »). Le site web autonome et iOS ne font pas partie de cet audit. Les composants React embarqués dans ces deux applications font partie du périmètre, car ils commandent leurs rooms.

Cet audit porte sur les fichiers locaux actuels, y compris les modifications en cours. Il ne constitue pas une validation de l'APK installé ni d'un installateur Windows distribué. Aucun code produit, réglage, compte, room ou processus Electron n'a été modifié volontairement pendant l'audit. Les tests ont généré leurs sorties habituelles. Ce rapport est le seul livrable ajouté par l'audit.

Le dépôt Windows était sur `codex/desktop-studio-polish`. Son arbre a évolué pendant les vérifications, notamment sur Cage et son dialogue de lancement. Les constats ont été ajustés lors du dernier contrôle ; les résultats de tests décrivent les exécutions effectuées pendant l'audit et ne certifient pas chaque modification simultanée du dépôt.

## Conclusion

**Le studio Windows possède un véritable chemin micro → effets → publication dans une room, mais sa parité complète avec Android n'est pas validée.** L'écart prioritaire est le transport média : le studio Android natif utilise BytePlus ; le studio Windows utilise LiveKit. Le catalogue Supabase commun et un nom de canal identique ne raccordent pas ces deux réseaux audio/vidéo.

L'autotune Meewav Windows est réellement raccordé au flux envoyé. Il utilise Superpowered WASM dans WebAudio. Le moteur Windows natif WASAPI/VST3 est un chantier distinct et ne publie actuellement pas son audio dans les rooms.

Il reste également des écarts dans les permissions et la sortie du studio Android, des prérequis de configuration pour l'autotune en production, et des vérifications qui échouent. Les preuves ci-dessous distinguent le câblage lu dans les sources, les tests exécutés et les comportements non vérifiés à l'exécution.

## Constats prioritaires

### 1. Transport média différent entre les deux studios — priorité haute

**Confirmé dans les clients.** Windows importe `livekit-client`, appelle `livekit-token` avec `{ roomId }`, construit une `Room` LiveKit et se connecte à l'URL/au jeton renvoyés. Android utilise `BytePlusRTC`, appelle `byteplus-token` avec le nom de canal, l'identité et l'intention de publication, puis rejoint BytePlus.

Les configurations locales Android et Windows visent le même projet Supabase. Cela raccorde les données métier, pas les flux média. Aucune passerelle ni double publication entre les deux transports n'a été établie dans les sources accessibles. L'interopérabilité hôte natif Android ↔ studio Windows ne doit donc pas être considérée comme acquise.

Le viewer Android a également été retracé : pour les rooms live hors Classe, la WebView monte `WaveLiveAudio`, appelle le pont natif, puis démarre `RoomsAudioSession` en mode `LISTEN`, donc sur BytePlus. Il ne bascule pas vers LiveKit pour recevoir un hôte Windows. L'écart touche donc bien le parcours Windows hôte → Android spectateur, et pas seulement deux implémentations d'hôte. Android hôte → Android spectateur utilise en revanche le même transport BytePlus des deux côtés.

Preuves :

- [SDK et jeton Windows](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/placeLiveKit.service.ts:17), [requête de jeton](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/placeLiveKit.service.ts:182), [connexion](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/placeLiveKit.service.ts:1033).
- [SDK Android](C:/Users/linkw/Desktop/Meewav-Android/app/build.gradle.kts:58), [requête BytePlus](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/RoomsAudioRepository.kt:85), [session Android](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/RoomsAudioSession.kt:152).
- [Viewer Android](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/RoomViewer.tsx:73), [session native d'écoute](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/RoomViewerNativeControls.kt:93).

Résolution attendue : un transport compatible pour les clients qui doivent communiquer, ou une passerelle explicitement implémentée et validée. Le test d'acceptation doit vérifier les deux sens de diffusion, les changements de rôle et les effets, pas uniquement l'apparition de la room dans la liste.

### 2. Tous les types de rooms ne sont pas raccordés au lancement LIVE Windows

**Limite explicite du code actuel.** Le sélecteur standard Windows autorise la création LIVE de Place. Cage est orientée vers son dialogue spécialisé. Wave, Classe, Loge et Scène n'ont pas ce chemin de création LIVE dans ce sélecteur ; leur préparation en mode DEMO ne constitue pas une room diffusée.

Cage possède un dialogue spécialisé qui appelle `rooms_cage_launch_v1`, puis utilise `PlaceRoomExperience`. Cette voie LIVE existe bien et ne doit pas être confondue avec les types non pris en charge par le sélecteur standard.

Références : [choix des créations LIVE](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/launch/RoomLaunchDialog.tsx:104), [refus des autres types](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/launch/RoomLaunchDialog.tsx:115), [montage du studio](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/RoomsPage.tsx:236).

La parité « tous les types de rooms » ne peut donc pas être annoncée à partir du seul fonctionnement de Place ou de la Cage spécialisée.

**Contrat Cage vérifié en dernier contrôle :** `simpleCage` vaut `false` dans l'état relu, et `CageLaunchDialog` utilise la RPC spécialisée. Celle-ci crée une room de type `place` avec sa configuration Cage séparée ; cette représentation est acceptée par le filtre `place`/`wave` de `livekit-token`. Le helper générique `createLiveCage` pourrait écrire `type='cage'`, refusé par ce filtre, mais il n'est pas activé par le parcours actuel. Ce n'est donc pas un bug effectif de lancement retenu dans cet audit ; son contrat devra être aligné s'il est réactivé.

Références : [branche désactivée](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/launch/RoomLaunchDialog.tsx:41), [helper générique](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/launch/createLiveRoom.ts:31), [filtre du jeton](C:/Users/linkw/Desktop/Meewav-Windows/supabase/functions/livekit-token/index.ts:182), [représentation Cage spécialisée](C:/Users/linkw/Desktop/Meewav-Windows/supabase/migrations/20260906180000_rooms_cage_competition_v1.sql:113).

### 3. Permissions Android : entrée possible dans un studio sans session — priorité haute sur première utilisation

**Chemin conditionnel confirmé dans les sources.** Le studio démarre automatiquement sa session seulement si les autorisations micro et caméra sont déjà accordées. Si elles manquent, ce chemin ne demande pas les permissions et ne lance pas la session. Le composant `WaveLiveAudioControl` sait les demander, mais aucun appelant n'a été trouvé.

Une demande préalable de capture dans la WebView peut avoir accordé ces autorisations pour toute l'application. Cela explique pourquoi un appareil déjà utilisé peut fonctionner et ne contredit pas le problème de première ouverture ou d'autorisation révoquée.

Preuves : [condition de démarrage](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveMixerScreen.kt:307), [composant de permission sans appelant trouvé](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveLiveAudioControl.kt:17), [demande depuis la WebView](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/messaging/MessagingActivity.kt:201).

Résolution attendue : gérer demande, refus, révocation et reprise des permissions sur la route du studio elle-même, avec un état visible pour l'utilisateur. Valider sur une installation sans autorisation préalable.

### 4. Autotune Windows natif : publication dans les rooms indisponible

**Limite fonctionnelle confirmée.** L'autotune Meewav actif passe par Superpowered WASM. Le moteur C++ Windows principal sélectionne des backends audio/contrôle indisponibles. Le bridge décrit son plan audio et sa publication Room comme `unavailable`. Le POC WASAPI/VST3 est destiné au trajet local micro/casque, sans publication Room/WebRTC intégrée.

La présence de candidats VST3 ou d'un POC de monitoring ne démontre donc pas que l'audio d'un plugin natif est diffusé aux participants. Le frontend conserve à juste titre sa capture navigateur tant que le moteur natif n'annonce pas un état `room_ready` et une publication native.

Preuves : [backends du moteur](C:/Users/linkw/Desktop/Meewav-Windows/apps/meewav-audio-engine/src/main.cpp:12), [état du bridge](C:/Users/linkw/Desktop/Meewav-Windows/apps/meewav-audio-engine/src/bridge/LocalControlApi.cpp:186), [garde du frontend](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/PlaceRoomExperience.tsx:421).

Ce point ne signifie pas que l'autotune Meewav Windows est factice : son propre trajet WASM est raccordé et testé. Il distingue deux moteurs différents.

### 5. Configuration Superpowered à finaliser pour la livraison Windows

**Configuration locale constatée ; configuration de publication non vérifiée.** Aucune clé Superpowered dédiée n'est définie dans l'environnement du processus d'audit ni dans les paramètres locaux examinés. L'adapter Windows permet sa valeur d'exemple en développement, mais lève une erreur lorsqu'une clé manque en production.

Le build Android prévoit aussi une valeur d'exemple si son paramètre manque. Cela ne prouve pas que l'APK installé par l'utilisateur utilise cette valeur ni que son autotune échoue aujourd'hui ; cela ne fournit simplement pas une configuration de livraison durable et attestée.

Preuves : [configuration Windows](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/placeSuperpoweredAdapter.ts:12), [configuration Android](C:/Users/linkw/Desktop/Meewav-Android/app/build.gradle.kts:13), [valeur de repli Android](C:/Users/linkw/Desktop/Meewav-Android/app/build.gradle.kts:35).

Résolution attendue : fournir les paramètres appropriés dans l'environnement de build/livraison et vérifier le chargement de l'effet dans un artefact de production. Aucun secret n'est reproduit dans cet audit.

### 6. Sortie du studio Android : quitter et terminer ne sont pas explicitement séparés

**Comportement client confirmé ; conséquences serveur à vérifier.** Le bouton de sortie d'un studio live appelle `rooms_end_room_v1`, puis ferme l'écran. Le code de cet écran ne choisit pas une simple sortie en fonction du rôle. Le teardown RTC quitte bien BytePlus, mais aucun appel à `rooms_leave_room_v2` n'a été trouvé dans ce cycle natif.

Cela peut convenir au parcours réservé à l'hôte. Cela ne suffit pas à garantir une sortie correcte d'un invité, ni le nettoyage de sa participation métier après une fermeture directe. Une autorisation côté serveur peut refuser l'action de fin pour un non-hôte ; cette protection n'a pas été vérifiée dans la fonction déployée.

Les migrations locales Windows définissent l'entrée et la sortie de room, mais la définition de `rooms_end_room_v1` n'a pas été retrouvée dans les migrations inspectées. Son absence locale n'est pas une preuve de son absence en production.

Preuves : [action de fin](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveMixerScreen.kt:481), [arrêt RTC](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/RoomsAudioSession.kt:372), [entrée/sortie métier Windows](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/place.service.ts:935).

## Chaînes réellement raccordées

### Android

1. L'interface Rooms embarquée récupère l'utilisateur authentifié, crée une ligne `rooms_v2`, puis inscrit l'hôte dans `room_participants_v2`. Elle conserve l'identifiant de création lors d'une reprise.
2. La navigation vers la route native transmet l'UUID d'une room live à `WaveMixerActivity`.
3. `RoomsAudioRepository` lit la room, les participants et les invitations. Il appelle l'entrée métier si l'utilisateur n'est pas encore participant, puis demande le jeton BytePlus.
4. La session applique les droits de publication et de souscription, suit les flux, réévalue l'état métier et renouvelle les jetons.
5. Le micro capturé par le moteur natif est traité par Superpowered. Le PCM traité est envoyé au SDK BytePlus ; le retour casque est un trajet associé. L'effet ne se limite pas au monitoring.
6. Le teardown arrête la publication et détruit la session RTC. Les limites de permissions et de sortie métier sont détaillées plus haut.

Références : [création](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/liveRooms.ts:23), [lancement](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/RoomsPage.tsx:94), [route native](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/messaging/MessagingActivity.kt:250), [droits/entrée](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/RoomsAudioRepository.kt:59), [réglages vocaux](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveMixerScreen.kt:251), [DSP](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/cpp/WaveNativeDuplex.cpp:94), [envoi RTC](C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/RoomsAudioSession.kt:240).

### Windows : autotune Meewav et publication

1. Le lancement de room crée les données métier et navigue vers le studio.
2. `PlaceRoomExperience` sélectionne l'adapter Superpowered sur desktop pour le fournisseur Meewav.
3. `placeLocalAudioEngine` ouvre le micro avec `getUserMedia`, construit le graphe WebAudio/AudioWorklet et récupère une sortie `MediaStreamDestination`.
4. La piste traitée est transmise au service de room et publiée dans LiveKit sous `meewav.voice`, comme source micro.
5. Activation, tonalité et gamme atteignent le moteur. Les paramètres avancés `amount`, `speed`, `humanize` ne sont pas appliqués par ce moteur simple ; cette limite est documentée.
6. Une panne de worklet est remontée dans l'état de santé ; le moteur peut retirer l'effet et rétablir le trajet sec. Une room toujours audible ne prouve donc pas, à elle seule, que l'effet est actif.

Références : [création/lancement](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/launch/RoomLaunchDialog.tsx:104), [création métier](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/launch/createLiveRoom.ts:24), [sélection de l'effet](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/PlaceRoomExperience.tsx:447), [capture et graphe](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/placeLocalAudioEngine.ts:473), [préparation de piste](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/PlaceRoomExperience.tsx:800), [publication](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/placeLiveKit.service.ts:584), [propagation des réglages](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/placeLocalAudioEngine.ts:686), [repli après erreur](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/placeLocalAudioEngine.ts:252).

### Windows : authentification, droits et cycle de vie

- Le mode desktop LIVE protège les routes par l'authentification. La création récupère aussi l'utilisateur côté Supabase ; le mode DEMO est explicitement distinct.
- L'entrée et le cleanup métier appellent respectivement `rooms_enter_room_v2` et `rooms_leave_room_v2`. Le hook média connecte et déconnecte le client en fonction de la room.
- Pour l'hôte desktop, l'activation média est conditionnée par l'état `desktopOnAir` : la préparation locale et le passage en direct sont distincts.
- Le jeton LiveKit autorise la publication de l'invité actif sur scène, avec sources caméra/micro ; l'hôte possède aussi les droits de partage d'écran. Les permissions serveur restent nécessaires pour publier.
- Les jetons LiveKit sont émis avec une durée de cinq minutes. Le SDK installé gère le renouvellement via son protocole de signalisation ; l'absence d'un timer applicatif équivalent à celui d'Android n'est pas, en elle-même, un oubli de câblage.
- Le service prévoit la republication des pistes lors d'une reconnexion. Le renouvellement et la reprise n'ont pas été validés dans une vraie session réseau pendant cet audit.

Références : [barrières d'authentification](C:/Users/linkw/Desktop/Meewav-Windows/src/App.tsx:312), [entrée et sortie métier](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/usePlaceRoom.ts:428), [cycle média](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/usePlaceLiveKitRoom.ts:20), [condition du direct](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/PlaceRoomExperience.tsx:330), [droits des invités](C:/Users/linkw/Desktop/Meewav-Windows/supabase/functions/livekit-token/index.ts:261), [durée du jeton](C:/Users/linkw/Desktop/Meewav-Windows/supabase/functions/livekit-token/index.ts:12), [republication](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/placeLiveKit.service.ts:1392).

### État du lancement Windows

Le shell Electron local charge le renderer Vite sur `http://127.0.0.1:5197`. Les commandes identifiées sont des commandes de développement ; aucun chemin de packaging/installateur Windows autonome n'a été établi dans ce dépôt. L'application ouverte et le code audité correspondent donc au studio local, sans preuve d'un artefact distribué équivalent.

Référence : [chargement Electron](C:/Users/linkw/Desktop/Meewav-Windows/apps/meewav-studio/main.cjs:160).

### Autres entrées et sorties du studio Windows

| Fonction | Raccordement trouvé | Limite à connaître |
| --- | --- | --- |
| Micro et effets | Capture → gain d'entrée → DSP → piste voix LiveKit ; gate de publication et arrêt présents. | Un incident DSP peut laisser passer une voix sèche avec une erreur d'effet. |
| Musique | Lecteur ou source audio sélectionnée → gain → sortie MediaStream → piste musique ; préécoute et diffusion séparées. | La préécoute d'un fichier ne signifie pas qu'il est diffusé. |
| Faders et Master | Gains appliqués à la musique diffusée ; trim micro sur le signal envoyé ; volumes voix/musique/master calculés côté réception. | Il ne s'agit pas d'un unique mix master stéréo regroupant toutes les pistes avant RTC. |
| Retour casque | Monitoring de la voix locale avec ses effets. | Ce contrôle n'est pas un retour du programme master complet. |
| Vidéo Program | Capture préparée puis piste Program publiée comme source caméra. | Le rendu/choix de source doit encore être validé dans Electron et sur un spectateur réel. |
| Partage écran et son système | Pistes vidéo et audio dédiées publiées dans LiveKit, avec gates et cleanup. | Le son système est distinct de la piste musique ; présence du code ne prouve pas la capture matérielle sur cette machine. |
| Wave : base, boucles, couches | Bus programme et couches acceptées distincts du bus privé de préécoute. | Ce routage local ne résout pas l'absence de lancement LIVE Wave dans le sélecteur Windows. |
| Wave : candidat et import | Candidat privé ; diffusion soumise aux règles de vote ; import destiné à la base ou à une soumission. | Aucun synthétiseur/sampler MIDI temps réel n'a été identifié dans ce trajet de fichiers audio. |
| Enregistrement | Une capture locale micro/caméra vers Blob existe dans la Loge. | Aucun enregistrement du master complet d'une Room n'a été établi dans les chemins inspectés. |
| Arrêt studio | Suppression des bindings du direct, arrêt du partage d'écran et de la capture, fermeture des gates, unpublish/stop/detach/disconnect. | La libération réelle des périphériques après erreur ou fermeture brutale reste à vérifier à l'exécution. |

Références principales : [trim micro](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/PlaceRoomExperience.tsx:318), [gain et publication de la musique](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/PlaceRoomExperience.tsx:337), [lecture et volumes distants](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/PlaceStage.tsx:375), [monitoring](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/PlaceRoomExperience.tsx:1253), [vidéo Program](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/placeLiveKit.service.ts:293), [écran et audio](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/placeLiveKit.service.ts:869), [arrêt du studio](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/PlaceRoomExperience.tsx:1521), [teardown RTC](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/placeLiveKit.service.ts:2031).

Preuves supplémentaires : [source musique Windows](C:/Users/linkw/Desktop/Meewav-Windows/src/runtime/DesktopMusicSource.ts:12), [sortie publique et préécoute du lecteur](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/place/PlaceMixerAudioPlayer.tsx:470), [bus Wave](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/wave-transport/WaveAudioTransport.ts:65), [candidat privé et vote](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/wave-transport/WaveAudioTransport.ts:456), [import de fichiers](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/tools/WaveRoomTransportController.tsx:58), [enregistrement local](C:/Users/linkw/Desktop/Meewav-Windows/src/features/rooms/tools/panels/LogeMomentsPanel.tsx:137).

Une note de validation Windows indique encore que le son système n'est pas intégré. Le code actuel le publie comme piste séparée : cette documentation doit être précisée, sans assimiler cette publication à un mixage dans la piste musique ([note](C:/Users/linkw/Desktop/Meewav-Windows/apps/meewav-studio/DESKTOP-VALIDATION.md:49)).

## Backend et configuration

- Les deux configurations locales ciblent le même projet Supabase, sans que ses identifiants ou clés soient reproduits ici.
- Le code local de `livekit-token` valide l'utilisateur, la room, le statut, les participations/invitations et les droits avant de signer les permissions média.
- Le handler Rooms `byteplus-token` demandé par Android n'est pas présent dans les sources de fonctions Android/Windows inspectées. Sa validation serveur des rôles, son déploiement et une éventuelle passerelle média restent non vérifiés. Le handler BytePlus de messagerie trouvé localement traite les appels de messagerie ; il ne prouve pas le contrat des rooms.
- Le script de contrôle backend qui effectue des écritures dans une transaction annulée n'a pas été exécuté. Aucune mutation de production n'a été utilisée pour cet audit.

Référence : [authentification dans la fonction LiveKit](C:/Users/linkw/Desktop/Meewav-Windows/supabase/functions/livekit-token/index.ts:170).

## Vérifications exécutées

### Android

Commande : `./gradlew.bat :app:testDebugUnitTest --no-daemon`.

Résultat : **82 tests exécutés, 80 réussis, 2 en échec**.

- `RegistrationProfileTest` : `avatar_url` attendu `ViolonIcon`, reçu `null` ([test](C:/Users/linkw/Desktop/Meewav-Android/app/src/test/java/com/meewav/android/core/auth/RegistrationProfileTest.kt:14)).
- `CageToolsStateTest` : participants attendus `[naya, keo]`, résultat `[]` ([test](C:/Users/linkw/Desktop/Meewav-Android/app/src/test/java/com/meewav/android/features/rooms/wave/CageToolsStateTest.kt:70)).

Ces deux échecs ne démontrent pas une panne du transport RTC. Ils empêchent néanmoins de présenter la suite Android comme entièrement verte. Les tests de politique audio et de gamme présents passent ; ils ne sont pas des tests réseau entre appareils.

Lors de l'audit initial, les assets Rooms locaux contenaient un marqueur de diagnostic. Pour la publication GitHub, les assets ont été reconstruits à partir des sources corrigées, sans cette instrumentation locale : les marqueurs de diagnostic sont absents et les références du point d'entrée Rooms résolvent vers les chunks publiés. Cette vérification ne démontre pas que l'APK actuellement installé provient de ce build.

### Windows

- `npx vitest run src/features/rooms/place/placeLiveKit.access.test.ts src/features/rooms/place/placeLiveKit.callProgram.test.ts src/features/rooms/place/PlaceMixer.voiceCorrection.test.tsx src/runtime/DesktopMediaDevices.test.ts src/runtime/DesktopMusicSource.test.ts` : **5 fichiers, 45 tests réussis**.
- `npm exec vitest -- run src/features/rooms/place/PlaceMixer.voiceCorrection.test.tsx src/features/rooms/place/placeLocalAudioEngine.test.ts` : **2 fichiers, 45 tests réussis**. Le test du mixeur est commun aux deux commandes ; les totaux ne doivent pas être additionnés comme des tests uniques.
- `node --test scripts/test-superpowered-voice.mjs` : **4 tests réussis sur le vrai WASM**, dont la correction d'un signal synthétique de 450 Hz vers environ 440 Hz, le bypass et la réverbération.
- Un second lot couvre huit fichiers : `placeLiveKit.access`, `placeLiveKit.callProgram`, `DesktopMediaDevices`, `DesktopMusicSource`, `createLiveRoom`, `PlaceRoomExperience.audio`, `RoomProductionPreparation.stress`, `roomProductionSetup` : **37 tests réussis**. Quatre fichiers recoupent le premier lot.
- Le lot `WaveAudioTransport.test.ts` + `PlaceRoomExperience.audio.test.tsx` passe **70 tests** : respectivement 59 et 11. Le second fichier est déjà compris dans le lot précédent.
- Total dédupliqué : **11 fichiers Vitest, 141 tests réussis**, plus **4 tests WASM réussis**. Les reprises d'une même suite ne sont pas recomptées.
- `npm run typecheck` : **échec avec 61 diagnostics**. Ils concernent notamment les types Node, la bibliothèque ES, les options Testing Library et des contrats/types Wave/Cage/Classe/invitations, dans les tests et certains fichiers applicatifs. Ils ne constituent pas, à eux seuls, une preuve de panne de la piste audio desktop. Certains fichiers Cage évoluaient en parallèle ; ces diagnostics ne sont pas attribués à une modification de l'audit.

Les avertissements JSDOM sur `HTMLMediaElement.load()` n'ont pas fait échouer les suites ciblées. Aucun build Windows n'a été lancé pour écraser les sorties utilisées par le travail en cours. Les processus Electron déjà ouverts n'ont pas été arrêtés ou relancés.

## Limites de preuve et critères de validation finale

Les tests exécutés prouvent des comportements de code et un traitement audio synthétique. Ils ne prouvent pas encore la capture du micro matériel, la latence de bout en bout, la réception par un autre appareil, la reprise après perte réseau ni le fonctionnement d'un installateur de production.

Pour déclarer la parité Android/Windows validée, il faut réussir au minimum :

1. Windows hôte → Android auditeur, puis Android hôte → Windows auditeur, avec réception audio et vidéo.
2. Invitation, montée sur scène, changement de rôle et retrait, avec application effective des droits de publication.
3. Comparaison écoute distante effet désactivé/activé et changement de tonalité/gamme, sur les deux plateformes.
4. Mute, choix du micro, perte/reconnexion du périphérique et séparation retour casque/sortie diffusée.
5. Autorisations refusées puis accordées, sans rester bloqué dans un studio muet.
6. Déconnexion réseau, renouvellement de jeton, reconnexion et absence de double piste.
7. Sortie d'un invité sans terminer la room ; fin de room par l'hôte et nettoyage RTC/métier.
8. Chargement des assets et de la configuration d'effet dans les artefacts effectivement distribués.

Le code accessible donne une base réelle pour ces parcours. La différence de transport média doit être résolue ou expliquée par une passerelle vérifiable avant de considérer l'expérience commune comme raccordée de bout en bout.
