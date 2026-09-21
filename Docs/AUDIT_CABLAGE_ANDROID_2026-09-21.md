# Audit du câblage Android — 21 septembre 2026

## RÉSUMÉ

**Conclusion : la Messagerie dispose d’un noyau connecté ; le Globe Android est encore largement une démonstration ; la Scène est hybride ; les Rooms Android sont surtout des outils locaux et des simulations, malgré la présence de nombreux services serveur.**

Audit du **répertoire de travail actuel**, incluant les modifications non commitées, base Git `7c2de43`. Ne pas lire ce rapport comme un audit du seul commit. Projet : `C:/Users/linkw/Desktop/Meewav-Android`.

### Globe

**PARTIELLEMENT CÂBLÉ.** Affichage/navigation fonctionnels ; portraits/population et Top 10 de démo. Les CTA profil complet et collaboration des pré-profils inspectés n’aboutissent pas. Le contact ouvre explicitement une identité mock. Je ne confirme donc pas l’hypothèse « Globe déjà entièrement câblé ».

### Messagerie

**CÂBLÉ pour le noyau des conversations connectées**, avec exceptions. Chargement, ouverture, envoi, pagination, lecture, événements realtime et principales actions passent par les hooks puis RPC. Authentification native relayée au client. Les appels possèdent un vrai transport BytePlus dans le code, mais leur réussite actuelle côté service n’est pas attestée. Plusieurs outils de groupes/projets restent partiels.

### Scène — feature vidéo, distincte de la room Scène

**28 groupes de fonctions recensés : 13 câblés, 8 partiels, 6 non câblés, 1 volontairement verrouillable/statique.** Les 13 câblés incluent des fonctions légitimement locales (lecture, historique, playlists). Ce n’est pas « 13 fonctionnalités synchronisées avec le serveur ».

### Rooms — six rooms, host natif et viewer

**51 groupes de fonctions recensés : 11 câblés localement, 35 partiels, 5 non câblés.** Les fonctions serveur déjà présentes derrière une entrée démo sont classées partielles, pas supprimées de l’inventaire.

**Blocage commun précis :** [RoomViewer.tsx:66](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/RoomViewer.tsx:66>) passe toujours `demoRole="viewer"`. [usePlaceRoom.ts:309](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/place/usePlaceRoom.ts:309>) interrompt alors le chargement serveur. Même fournir `source="live"` au premier composant ne suffit donc pas. Le lancement host ouvre pour sa part une activité sans création de room distante.

### Ce que les chiffres signifient

Un groupe regroupe les actions d’une même chaîne (par exemple commentaires : lire/répondre/modifier/supprimer). Les mêmes commandes partagées par six rooms ne sont pas comptées six fois. **Câblé** signifie que le chemin nécessaire existe dans le code actif ; cela ne certifie pas le déploiement actuel de chaque RPC. **Partiel** signifie notamment UI/mécanique locale + maillon distant manquant. **Non câblé** signifie que l’effet produit attendu n’est pas exécuté par le parcours inspecté.

**Aucun code modifié pendant cet audit, aucun build, aucun test global, aucune écriture serveur, aucun contrôle visuel.** Inspection des entrées, handlers, états, repositories et contrats ; arrêt de chaque trace une fois la rupture identifiée. Les anciens comptes rendus de tests ne sont pas utilisés comme preuve d’une réussite actuelle.

## Contraintes à conserver

- **Mock data investisseur conservées.** Une démonstration fonctionnelle est utile et voulue ; le problème est son utilisation implicite à la place du parcours connecté. Garder un mode démo explicite, reproductible, isolé des opérations réelles.
- **Porte d’entrée iOS conservée.** Le futur client iOS doit utiliser les mêmes identités, sessions, droits, API, événements et médias que web/Android. Ne pas construire la couche métier autour des SharedPreferences ou des événements DOM Android.
- **Marketplace et Tremplin hors audit interne**, conformément à la mission.
- Les validations visuelles et les essais réels avec utilisateurs restent à l’utilisateur. Aucun contact, invitation ou paiement réel envoyé.

## Architecture réellement suivie

| Zone | Entrée active | Suite du chemin |
|---|---|---|
| Globe | [full-globe.tsx:3](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/globe-source/full-globe.tsx:3>) | App du globe embarqué → population/portraits → bridge de navigation natif. |
| Messagerie | [MessagingPage.tsx:176](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/MessagingPage.tsx:176>) | liveEnabled → hooks de conversations/collabs/projets/groupes → repositories Supabase + realtime. |
| Scène feature | [main.tsx:2](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/main.tsx:2>) | ShortsPage → lecteur, interactions, studio, profileMediaRepository et repositories locaux. |
| Rooms accueil | [RoomsPage.tsx:43](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/RoomsPage.tsx:43>) | RoomsHome fixtures → RoomViewer ; LaunchRoomSheet → activité Kotlin. |
| Rooms host | [WaveMixerScreen.kt:107](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveMixerScreen.kt:107>) | Socle commun + six états Kotlin ; fichiers et préférences locales. Exception Loge : adaptateur RPC conditionnel. |
| Rooms viewer | [RoomViewer.tsx:66](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/RoomViewer.tsx:66>) | PlaceRoomExperience → usePlaceRoom / useRoomTools, démo forcée actuellement. |
| Outils serveur viewer | [useRoomTools.ts:15](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/tools/useRoomTools.ts:15>) | Repository choisi selon source ; Supabase spécialisé, Cage dédiée et Wave normalisée. |
| Pont viewer natif | [NativeViewerSurfaces.tsx:8](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/NativeViewerSurfaces.tsx:8>) | Géométrie native ; événements vers les modèles Web. Le pont n’accorde pas une autorité host. |

## ÉLÉMENTS RESTANT À CÂBLER

### Globe — vérification ciblée

| Fonction / statut | Point d’entrée et preuve | Déjà présent | Chaînon manquant, destination et action future |
|---|---|---|---|
| **G01 — Population, recherche géographique et Top 10** · PARTIELLEMENT CÂBLÉ | [ground-avatars.mjs:277](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/globe-source/vendor/globe-vinyle/shared/src/ground-avatars.mjs:277>) | Globe rendu, worker de population, filtres géographiques et classement éditorial fonctionnels. | Population générée par paris-avatar-population ; NationalTopTen annonce un ordre de démo. Raccorder profils/localisation/classement serveur au même moteur de rendu. |
| **G02 — Pré-profils du Globe** · PARTIELLEMENT CÂBLÉ | [RingArtistPreProfile.tsx:109](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/globe-source/vendor/globe-vinyle/shared/src/RingArtistPreProfile.tsx:109>) | Portraits et cartes construits à partir des sélections/données démo. | Identité et compteurs générés, pas de résolution canonique dans ce parcours. Charger le profil public par UUID ; conserver les sélections mock. |
| **G03 — Contacter depuis le Globe** · PARTIELLEMENT CÂBLÉ | [messaging-navigation.ts:1](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/globe-source/messaging-navigation.ts:1>) | Navigation effective vers Messagerie. | Le helper force mode=demo et mockArtistId. Pour un artiste réel, fournir profileId et ouvrir sa conversation réelle ; garder le chemin mock. |
| **G04 — Voir le profil complet depuis les portraits** · NON CÂBLÉ | [RingArtistPreProfile.tsx:126](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/globe-source/vendor/globe-vinyle/shared/src/RingArtistPreProfile.tsx:126>) | CTA visible. | Il affiche « bientôt disponible ». Relier la route profil canonique. Même rupture dans GroundArtistPreProfile:142. |
| **G05 — Demande de collaboration depuis ces pré-profils** · NON CÂBLÉ | [RingArtistPreProfile.tsx:128](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/globe-source/vendor/globe-vinyle/shared/src/RingArtistPreProfile.tsx:128>) | CTA visible. | Il affiche « bientôt disponible ». Réutiliser formulaire et service de collaboration déjà utilisés par la Scène. |

### Messagerie — exceptions au noyau connecté

| Fonction / statut | Point d’entrée et preuve | Déjà présent | Chaînon manquant, destination et action future |
|---|---|---|---|
| **M01 — Appels audio/vidéo BytePlus** · PARTIELLEMENT CÂBLÉ | [byteplus.ts:5](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/calls/byteplus.ts:5>) | UI → signaling → messaging-call-token → création moteur, capture, joinRoom et renouvellement présents. | Ce n'est pas un stub. La disponibilité actuelle des credentials/Edge Function et un appel intercompte réussi ne sont pas vérifiés. Le dossier de suivi antérieur mentionne token_error : anomalie historique, pas résultat d'un nouveau test. Valider le service déployé avec la recette utilisateur. |
| **M02 — Réception d'appel lorsque l'application est fermée** · NON CÂBLÉ | [VideoCalls.tsx:1](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/calls/VideoCalls.tsx:1>) | Écoute des appels dans la surface active. | Pas de parcours push/réveil natif établi par la vérification ciblée ; ne pas promettre une réception hors application. Relier notifications d'appel si cette portée est requise. |
| **M03 — Planning et décisions de groupes** · PARTIELLEMENT CÂBLÉ | [ArtistGroupsWorkspace.tsx:1084](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/ArtistGroupsWorkspace.tsx:1084>) | Formulaires et états démo ; services de groupes existants. | addSession et addDecision s'arrêtent explicitement en liveMode ; formulaires toujours reliés à ces handlers. Connecter les contrats de planning/vote plutôt qu'afficher une simple notification. |
| **M04 — Lier groupe et projet / thème du groupe** · PARTIELLEMENT CÂBLÉ | [ArtistGroupsWorkspace.tsx:1120](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/ArtistGroupsWorkspace.tsx:1120>) | UI et modifications démo. | submitProject refuse le mode réel ; thème annoncé non enregistré à la ligne 1392. Brancher les mutations appropriées et leur relecture. |
| **M05 — Pièces jointes et vocaux dans les projets** · NON CÂBLÉ | [ProjectsWorkspace.tsx:1559](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/ProjectsWorkspace.tsx:1559>) | Commandes présentes dans l'UI. | Boutons désactivés lorsque live existe, contrairement aux messages ordinaires. Raccorder le pipeline de pièces jointes au contexte projet et à ses droits. |
| **M06 — Stems / takes / mix de projet** · NON CÂBLÉ | [ProjectsWorkspace.tsx:2866](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/ProjectsWorkspace.tsx:2866>) | Espace prévu avec explication d'indisponibilité. | Stockage, takes, mix et retours explicitement non câblés à Supabase. Définir et relier ce contrat spécialisé. |

### Scène — feature vidéo

| Fonction / statut | Point d’entrée et preuve | Déjà présent | Chaînon manquant, destination et action future |
|---|---|---|---|
| **S01 — Catalogue public** · PARTIELLEMENT CÂBLÉ | [ShortsPage.tsx:2141](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/shorts/ShortsPage.tsx:2141>) | Chargement de published_media_files/public_profiles et URLs signées ; résultats réels affichés. | Le flux mélange les résultats serveur et ALL_VIDEOS ; une erreur de chargement est silencieuse. Séparer explicitement catalogue connecté et catalogue démo, conserver ce dernier. |
| **S13 — Partager une vidéo** · PARTIELLEMENT CÂBLÉ | [ShortsPage.tsx:3017](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/shorts/ShortsPage.tsx:3017>) | Bouton → partage système ou copie du lien ; retour d'erreur. | URL construite avec window.location.origin : sur Android, origine appassets.androidplatform.net. Utiliser l'URL publique canonique / App Link, conserver le handler. |
| **S14 — Commentaires publics, réponses, likes, édition/suppression** · NON CÂBLÉ | [SceneCommentsSection.tsx:36](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/comments/SceneCommentsSection.tsx:36>) | UI et repository local de commentaires, brouillons, tri et gestion d'erreur. | Refresh et submit réservés à demo ; pas de chargement/mutation serveur pour le public. Raccorder identité, API commentaires, droits et rafraîchissement. |
| **S15 — Signaler une vidéo** · NON CÂBLÉ | [ShortsPage.tsx:3146](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/shorts/ShortsPage.tsx:3146>) | Le menu stocke un identifiant local et affiche « enregistré pour vérification ». | Aucun envoi à la modération dans ce handler. Relier au service de signalement, ne confirmer qu'après acceptation. |
| **S16 — Pas intéressé / masquer cet artiste** · PARTIELLEMENT CÂBLÉ | [ShortsPage.tsx:3135](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/shorts/ShortsPage.tsx:3135>) | Préférences ajoutées à not-interested et muted-artists. | Aucun consommateur de ces deux clés retrouvé dans la Scène inspectée. Appliquer les exclusions au flux et aux recommandations. |
| **S17 — Réglages de recommandation** · PARTIELLEMENT CÂBLÉ | [sceneRecommendationPreferences.ts:64](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/recommendations/sceneRecommendationPreferences.ts:64>) | Stockage local ; historyEnabled effectivement lu lors de l'enregistrement de progression. | Les autres réglages (styles, artistes masqués, formats, personnalisation) ne sont pas reliés au flux dans ShortsPage. Raccorder le moteur de sélection ; synchro serveur à décider. |
| **S18 — Publier un média et ses métadonnées** · PARTIELLEMENT CÂBLÉ | [ShortsCreatorDrawer.tsx:447](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/shorts/ShortsCreatorDrawer.tsx:447>) | Fichier principal → uploadOwnerMedia → renommage → visibilité serveur → ajout UI. | Description, crédits, liens, hashtags, format/multicam et second média sont ajoutés au résultat local sans persistance correspondante dans ce chemin. Compléter le contrat de publication et la reprise après rechargement. |
| **S20 — Studio : statistiques et état de traitement** · NON CÂBLÉ | [sceneCreatorStudio.model.ts:151](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/studio/sceneCreatorStudio.model.ts:151>) | Chiffres et états de démonstration ; tableau de bord et vues d'analyses. | Pas de source analytique réelle raccordée à ces tableaux. Relier agrégats, périodes et états de traitement ; garder le jeu investisseur. |
| **S21 — Studio : répondre/modérer les commentaires** · NON CÂBLÉ | [SceneCreatorStudio.tsx:258](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/studio/SceneCreatorStudio.tsx:258>) | Boutons et modifications d'état sur commentaires de démonstration. | Pas de mutation du fil public ni de réponse serveur. Utiliser le même contrat que S14. |
| **S22 — Studio : gérer les playlists** · PARTIELLEMENT CÂBLÉ | [SceneCreatorStudio.tsx:265](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/studio/SceneCreatorStudio.tsx:265>) | Ajout en mémoire ; bouton Gérer affiche une notification. | Écran séparé du repository de playlists réellement utilisé dans S06. Raccorder la gestion à ce repository, puis décider du partage serveur. |
| **S23 — Crédits, droits, accords et replays** · PARTIELLEMENT CÂBLÉ | [ShortsCreatorDrawer.tsx:526](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/shorts/ShortsCreatorDrawer.tsx:526>) | Prévalidation locale des droits et crédits ; types/services de gouvernance présents. | Preuves, accords collaborateurs et traitement serveur non soumis par ce parcours. Relier le contrat de gouvernance/publication ; un validateur local ne vaut pas accord serveur. |
| **S24 — Studio : sous-titres / transcription** · NON CÂBLÉ | [SceneCreatorStudio.tsx:309](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/studio/SceneCreatorStudio.tsx:309>) | Langues statiques, notification de génération, boutons Gérer sans action. | Relier génération, fichiers de sous-titres et édition/publication ; actuellement aucune transcription n'est lancée. |
| **S27 — Studio : changer la miniature** · NON CÂBLÉ | [SceneCreatorStudio.tsx:306](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/studio/SceneCreatorStudio.tsx:306>) | Bouton affichant « Sélecteur de miniature ouvert ». | Le handler ne lance pas de sélection/upload. Brancher un picker puis la mise à jour du média. |
| **S28 — Studio : planification, droits et diffusion TV** · PARTIELLEMENT CÂBLÉ | [SceneCreatorStudio.tsx:272](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/studio/SceneCreatorStudio.tsx:272>) | Vues et CTA de relance/gestion, données de démo ; vraie édition limitée à S19. | Les notifications de relance ne sont pas des commandes serveur. Raccorder invitations/droits/planification aux contrats correspondants ; ne pas annoncer un envoi inexistant. |

### Rooms — socle commun

| Fonction / statut | Point d’entrée et preuve | Déjà présent | Chaînon manquant, destination et action future |
|---|---|---|---|
| **R01 — Accueil Rooms et ouverture viewer** · PARTIELLEMENT CÂBLÉ | [RoomViewer.tsx:66](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/RoomViewer.tsx:66>) | Catalogue fixtures ; viewer, identité et services live déjà prévus. | demoRole="viewer" est toujours transmis ; usePlaceRoom:309 court-circuite le chargement réel dès qu'il est présent. Brancher le catalogue réel et séparer explicitement l'entrée démo de l'entrée live. |
| **R02 — Séquenceur : création / lancement d'une room** · PARTIELLEMENT CÂBLÉ | [RoomsPage.tsx:43](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/RoomsPage.tsx:43>) | Configuration et ouverture de l'activité host ; programme Cage transmis. | Pas de création de session serveur ni source=live dans openSession. Appeler le contrat de lancement et transmettre l'UUID/les droits avant d'ouvrir le host. |
| **R03 — Entrée, sortie, rôles et présence** · PARTIELLEMENT CÂBLÉ | [usePlaceRoom.ts:309](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/place/usePlaceRoom.ts:309>) | Repository live, enter/leave, droits de participation et abonnement présents. | Inaccessibles dans le parcours viewer actuel R01 ; host natif séparé. Relier la session et les rôles vérifiés, puis consommer la présence serveur. |
| **R04 — Diffusion audiovisuelle du host Android** · NON CÂBLÉ | [RoomScreenCaptureService.kt:17](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/RoomScreenCaptureService.kt:17>) | Vidéos de démonstration, prévisualisations et compositions natives. | Aucune publication RTC de la room native dans le parcours audité. Relier capture, tokens, pistes et rôles à un transport compatible avec web/iOS. |
| **R05 — Caméra locale** · PARTIELLEMENT CÂBLÉ | [RoomCameraPreview.kt:1](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/RoomCameraPreview.kt:1>) | Preview caméra et autorisations Android. | Le retour local ne fournit pas la piste aux autres comptes. Relier au transport R04 sans supprimer les vidéos démo. |
| **R06 — Partage d'écran** · PARTIELLEMENT CÂBLÉ | [RoomScreenCaptureService.kt:58](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/RoomScreenCaptureService.kt:58>) | MediaProjection, service de premier plan et écran local. | Le fichier précise qu'il ne publie pas de piste. Brancher la publication et la libération de piste RTC. |
| **R07 — Régie : solo, ensemble, mise en avant, scène Cage** · PARTIELLEMENT CÂBLÉ | [WaveMixerScreen.kt:231](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveMixerScreen.kt:231>) | Disposition locale, sélection des participants, host de retour et miniature. | Pas de programme audiovisuel commun publié par le host natif. Relier composition et changements à la session et au transport, avec préférences viewer distinctes. |
| **R10 — Chat host : envoyer et recevoir** · PARTIELLEMENT CÂBLÉ | [WaveChatPanel.kt:244](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveChatPanel.kt:244>) | Composer, emojis, liste, retour au direct ; messages locaux et génération périodique. | Envoi à une liste Compose, pas à rooms_send_message_v2 ; réception simulée. Raccorder chat natif au repository de room et à ses événements. |
| **R11 — Sondages, épinglage et actions sur messages** · PARTIELLEMENT CÂBLÉ | [WaveChatTools.kt:24](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveChatTools.kt:24>) | Création de sondage, mise en avant et menu des messages en état local. | Pas de mutation partagée avec les viewers natifs/web/iOS. Utiliser poll/pinned/modération de la session ; permissions serveur. |
| **R12 — Notifications, dons et compteurs sociaux** · PARTIELLEMENT CÂBLÉ | [WaveNotificationsSheet.kt:1](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveNotificationsSheet.kt:1>) | Cloche, état lu et exemples de notifications ; likes et compteurs affichés. | Pas de source d'événements distante reliée au host natif. Brancher événements de room/transactions, lecture et compteurs autoritaires. |
| **R13 — Demandes : ouvert/fermé, invitations et filtres** · PARTIELLEMENT CÂBLÉ | [WaveGuestState.kt:59](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveGuestState.kt:59>) | Tri, filtres, sélection 8/16/32, invitations et refus locaux. | Invitations ajoutées à la démo (ligne 266), pas livrées à des comptes. Relier la file et les invitations serveur, préserver les filtres locaux. |
| **R14 — Coulisses, montée/descente, drag, jury** · PARTIELLEMENT CÂBLÉ | [WaveGuestState.kt:177](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveGuestState.kt:177>) | Transitions locales, sélection multiple, capacités de scène et limite de six jurés. | Pas de commande d'admission/rôle/RTC partagée. Relier les transitions validées par le serveur ; Greenhouse backend, pas nouvel écran. |
| **R15 — Messages privés depuis invités / outils** · PARTIELLEMENT CÂBLÉ | [WaveGuestState.kt:249](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveGuestState.kt:249>) | Destinataires et message ajoutés à une conversation de démo. | Pas d'envoi au compte réel. Passer les UUID au service Messagerie / conversation privée de classe. |
| **R16 — Pré-profil commun et ses CTA** · PARTIELLEMENT CÂBLÉ | [RoomArtistProfileContent.tsx:8](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/RoomArtistProfileContent.tsx:8>) | Bottom sheet commun affiché, médias de démonstration, bouton Offrir ajouté. | onOpenProfile/onContact reçus mais non transmis ; ArtistProfileCard réutilise les callbacks démo du Globe. Relier identité réelle, profil, suivi, contact et collab au modèle partagé. |
| **R18 — Gain/mute du host et des invités** · PARTIELLEMENT CÂBLÉ | [WaveMixerScreen.kt:319](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveMixerScreen.kt:319>) | Fader relié au participant sélectionné ; volume des retours démo. | Pas de contrôle d'une piste distante autorisée. Raccorder gain et mute à l'identité de piste RTC et aux permissions de room. |
| **R19 — Autotune, réverbération et monitoring micro natifs** · NON CÂBLÉ | [WaveMixerScreen.kt:182](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveMixerScreen.kt:182>) | Switchs, tonalité, échelle et curseurs en remember/mutableState. | État UI transmis aux contrôles, pas de chaîne DSP micro appliquée ici. Relier capture et traitements ; conserver les valeurs de démonstration sans prétendre traiter le micro. |
| **R20 — Sortie publique du lecteur/pads du host** · NON CÂBLÉ | [WaveMixerDeckState.kt:39](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveMixerDeckState.kt:39>) | Sélecteur privé/public, moteur local et arrêt/reprise. | public bascule un booléen ; pas d'injection audio room identifiée. Brancher le bus mixé au transport, indépendant du lecteur Wave. |
| **R23 — Mur de cadeaux, Offrir, stock et tirage** · PARTIELLEMENT CÂBLÉ | [LogeToolsState.kt:153](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/LogeToolsState.kt:153>) | Sélection du destinataire, stock, annulation, tirage et remise en état local persisté. | Pas de délivrance intercompte depuis ce chemin natif. Relier transaction de cadeau, éligibilité, stock et réception ; ne pas convertir une démo en achat réel. |
| **R24 — Cagnottes et versements réels** · NON CÂBLÉ | [CageFundraiser.kt:13](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/CageFundraiser.kt:13>) | Présentation et dons simulés ; formulaire viewer avec état d'indisponibilité du checkout. | Pas de paiement réel dans le chemin audité. Relier checkout, confirmation serveur, remboursement/versement et événements ; pas seulement incrémenter le total. |
| **R25 — Switch Room communautaire** · PARTIELLEMENT CÂBLÉ | [RoomSwitch.kt:47](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/RoomSwitch.kt:47>) | Configuration, garde-fous, version et changement de module locaux. | Le natif ne commande pas rooms_switch_experience_v1 ni les acknowledgements viewers. Adapter le service partagé existant, conserver l'identité de session. |

### Rooms — outils spécifiques et raccords transversaux

| Fonction / statut | Point d’entrée et preuve | Déjà présent | Chaînon manquant, destination et action future |
|---|---|---|---|
| **R27 — Wave : dépôt, réception et filtrage des propositions** · PARTIELLEMENT CÂBLÉ | [WaveViewerPanel.tsx:30](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/wave-viewer/WaveViewerPanel.tsx:30>) | Atelier viewer démo ; branche live avec tickets d'upload/confirmation. Host conserve ses propres propositions locales. | La session live n'est pas atteinte et le host natif ne consomme pas ces dépôts. Relier waveId, pipeline privé et projection host ; garder les packs démo. |
| **R28 — Wave : vote, duel de remplacement, validation et clôture** · PARTIELLEMENT CÂBLÉ | [WaveCompositionState.kt:647](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveCompositionState.kt:647>) | Vote local, résultat et intégration composition ; viewer live dispose de castVote/castClosingVote. | Pas de vote officiel commun au host natif et au viewer actuel. Relier rounds normalisés, droits de jury, échéances et événements. |
| **R30 — Wave : message à l'auteur** · PARTIELLEMENT CÂBLÉ | [WaveCompositionState.kt:171](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveCompositionState.kt:171>) | Action et conservation locale du message. | Pas de livraison à l'auteur réel. Utiliser son UUID et la Messagerie. |
| **R32 — Cage : tournoi, championnat, Open Mic / Battle** · PARTIELLEMENT CÂBLÉ | [CageToolsState.kt:182](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/CageToolsState.kt:182>) | CTA algorithmique, tirage, matchs, monter duo, transitions, incidents et host intermatchs. | Machine native locale distincte de la machine viewer. Relier une compétition serveur unique et appliquer ses projections aux deux côtés. |
| **R33 — Cage : votes public/jury, verdict, podium et bracket** · PARTIELLEMENT CÂBLÉ | [CageToolsState.kt:314](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/CageToolsState.kt:314>) | Bulletins locaux/simulés, calcul des scores, verdict et progression. | Pas de réception du vote public réel par ce host. Relier rooms_get_cage_state_v1 et commandes de compétition/échéances ; conserver le film démo. |
| **R35 — Classe : sièges, élèves et bannissement** · PARTIELLEMENT CÂBLÉ | [ClasseToolsState.kt:71](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/ClasseToolsState.kt:71>) | Roster, places libres, sélection et exclusion locale. | Pas de réservation/bannissement serveur depuis le host natif. Relier roster et droits communs ; ne pas inventer de places occupées en live. |
| **R36 — Classe : mains et prise de parole** · PARTIELLEMENT CÂBLÉ | [ClasseToolsState.kt:48](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/ClasseToolsState.kt:48>) | Demande, invitation, grantAudioFloor et restitution, sans montée vidéo forcée. | Autorisation audio locale ; elle n'ouvre pas le micro d'un autre compte. Relier file, événement d'autorisation et transport audio. |
| **R37 — Classe : questions, soutien, compréhension** · PARTIELLEMENT CÂBLÉ | [ClasseToolsState.kt:81](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/ClasseToolsState.kt:81>) | Une question en attente, résolution, likes et réponses de compréhension. | État natif local distinct de roomTools viewer. Raccorder les commandes et leurs projections autorisées. |
| **R38 — Classe : ressources et téléchargement** · PARTIELLEMENT CÂBLÉ | [ClasseToolsState.kt:42](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/ClasseToolsState.kt:42>) | Sélection/stockage local de ressources ; service viewer de stockage/download privé présent. | Le fichier host local n'est pas publié pour l'élève distant. Uploader via le contrat de ressource, stocker son identifiant puis signer les téléchargements. |
| **R39 — Classe : achat d'une place** · NON CÂBLÉ | [RoomAudienceInteractions.tsx:457](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/tools/audience/RoomAudienceInteractions.tsx:457>) | Ticket, choix de siège et simulation d'achat. | Action réelle explicitement désactivée hors démo. Ajouter réservation atomique, checkout et confirmation du siège ; préserver la simulation. |
| **R40 — Scène room : programme, groupes d'artistes et montée** · PARTIELLEMENT CÂBLÉ | [SceneToolsState.kt:91](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/SceneToolsState.kt:91>) | Préparation, ordre, readiness, montage/démontage reliés aux invités locaux. | Pas de programme live commun ni contrôle de scène serveur. Relier participants validés et transition officielle de passage. |
| **R42 — Scène room : évaluation et résultats** · PARTIELLEMENT CÂBLÉ | [SceneToolsState.kt:155](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/SceneToolsState.kt:155>) | Configuration d'évaluation, réponses démo ; viewer a une commande scene.evaluation.cast. | Le host natif ne récupère pas les avis viewers. Relier passage/évaluation au repository partagé et à sa clôture. |
| **R44 — Loge : VIP, invitations/expériences et questions réelles** · PARTIELLEMENT CÂBLÉ | [LogeRemoteRepository.kt:32](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/LogeRemoteRepository.kt:32>) | Client Kotlin + AndroidLogeViewer appellent rooms_loge_read_v1/action_v1 ; migration locale présente. | Pas d'entrée live atteignable ; lancement absent du parcours. Déploiement de la migration non attesté. Aligner ce contrat avec web/iOS avant raccordement. |
| **R45 — Loge : dédicaces audio/vidéo et historique** · PARTIELLEMENT CÂBLÉ | [LogeToolsState.kt:139](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/LogeToolsState.kt:139>) | Enregistrement/fichier local, historique et lecture démo contrôlée. | Pas d'upload ni de remise privée à un autre compte. Relier stockage privé, metadata, destinataire et lien signé. |
| **R46 — Place : tour de parole et chronomètre** · PARTIELLEMENT CÂBLÉ | [PlaceToolsState.kt:52](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/PlaceToolsState.kt:52>) | File, ouverture, passage suivant, pause/fin et gain locaux. | Aucune file partagée commandée par ce host. Relier les commandes à l'état de la session et au transport. |
| **R47 — Place : clash, invitation et défi** · PARTIELLEMENT CÂBLÉ | [PlaceToolsState.kt:76](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/PlaceToolsState.kt:76>) | Invitation, réponse, manches, chronomètre et fin dans l'archive locale. | Aucun événement transmis à l'invité distant. Raccorder invitation/réponse et échéances serveur. |
| **R48 — Viewer : chat, mixeur et pont natif** · PARTIELLEMENT CÂBLÉ | [PlaceMixer.tsx:1046](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/place/PlaceMixer.tsx:1046>) | Événements meewav:native-viewer-action reçus ; modèles Web pilotés, lecteur natif local. | Le pont existe : ce n'est pas un bouton mort. Son modèle reste démo via R01 ; vérifier autorité et pistes en le raccordant au live. |
| **R49 — Viewer : engagement, sondages, gifts, queue** · PARTIELLEMENT CÂBLÉ | [place.service.ts:931](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/place/place.service.ts:931>) | Services réels send/enter/leave, gains, likes, Golden Like, polls et cadeaux ; mutations UI existent. | Source démo imposée à l'entrée. Réutiliser les repositories sans assimiler leur présence à une session déjà opérationnelle. |
| **R50 — Partage du lien d'une room** · PARTIELLEMENT CÂBLÉ | [WaveChatPanel.kt:663](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveChatPanel.kt:663>) | ACTION_SEND Android existe, mais partage uniquement le texte fixe « Meewav · La Wave — Freestyle session · Luma invite ». | Le texte partagé ne contient aucun lien ni identité de session et reste Wave quelle que soit la room. Remplacer ce texte fixe par le titre réel et une URL publique résoluble après R02. |
| **R51 — Persistance et reprise communes host/viewer** · PARTIELLEMENT CÂBLÉ | [roomTools.service.ts:2139](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/tools/roomTools.service.ts:2139>) | Native : SharedPreferences ; viewer démo : repository en mémoire/localStorage ; exception Loge locale R43. | Pas d'état autoritaire partagé pour la majorité des outils. Raccorder snapshots versionnés/événements sans effacer les stores de démonstration. |

## ÉLÉMENTS CÂBLÉS

### Globe

- Rendu du Globe, portraits et population de démonstration → câblés localement → [ground-avatars.mjs:277](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/globe-source/vendor/globe-vinyle/shared/src/ground-avatars.mjs:277>).
- Ouverture de la carte artiste, fermeture et navigation vers les autres features → câblées localement → [full-globe-bridge.ts:41](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/globe-source/full-globe-bridge.ts:41>).
- Cela ne couvre pas une population Supabase réelle ni les CTA qui affichent « bientôt disponible ».

### Messagerie

| Fonction vérifiée | Chaîne retrouvée |
|---|---|
| Conversations, ouverture, messages, pagination | [useMessagingLive.ts:203](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/useMessagingLive.ts:203>) → listConversations / listMessages → [messaging.service.ts:81](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:81>) (list_my_conversations_v2, get_conversation_messages_v3). |
| Envoi de texte, état pending/erreur et lecture | [useMessagingLive.ts:395](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/useMessagingLive.ts:395>) → sendTextMessage ; markConversationRead à la ligne 262 → RPC. |
| Réception / rafraîchissement realtime | [MessagingPage.tsx:277](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/MessagingPage.tsx:277>) utilise [useMessagingRealtime.ts:100](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/useMessagingRealtime.ts:100>) : canal privé, événement messaging_change, abonnement et nettoyage. |
| Création de DM, recherche et invitations de conversation | [useMessagingLive.ts:801](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/useMessagingLive.ts:801>) → recherche, conversation directe et création de groupe ; invitation/réponse dans le même hook. |
| Réactions, épinglage, suppression, transfert, blocage, signalement | [useMessagingLive.ts:571](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/useMessagingLive.ts:571>) puis méthodes du repository jusqu’à reportContent. Ce signalement est réel dans le code, contrairement à celui de la Scène. |
| Pièces jointes des conversations ordinaires | [messaging.attachments.service.ts:230](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/messaging.attachments.service.ts:230>) : réservation → Storage → validation/attachement ; hook activé par MessagingPage. |
| Collabs | [MessagingPage.tsx:183](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/MessagingPage.tsx:183>) : hook live et service de demandes/discussion/pièces jointes. |
| Projets : socle projet/membres/tâches | [MessagingPage.tsx:194](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/MessagingPage.tsx:194>) : hook projets live ; les médias/stems ont les exceptions M05/M06. |
| Groupes : création, détail, invitations, rôles, départ/archivage | [useMessagingGroupsLive.ts:190](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/vendor/src/features/messaging/useMessagingGroupsLive.ts:190>) : mutations repository et relecture. Planning/décisions/liens ont les exceptions M03/M04. |
| Auth native → client/realtime | [runtime.ts:32](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/runtime.ts:32>) : token fourni par le natif, identité et mise à jour de session ; pas d’auth simulée pour faire réussir un appel réel. |

**Limite de cette vérification ciblée :** ce n’est pas une recette exhaustive de tous les sous-écrans de la Messagerie. Les principales chaînes demandées ont été tracées ; les exceptions évidentes rencontrées sont nommées plutôt que cachées derrière un statut global.

### Scène

| Fonction | Preuve principale | Portée réellement câblée |
|---|---|---|
| **S02 — Navigation, recherche, filtres et tri** | [sceneDiscoveryModel.ts:364](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/sceneDiscoveryModel.ts:364>) | Recherche et filtres appliqués au catalogue chargé, paramètres de navigation, tri et retour visibles. Fonctionnement local complet ; recherche globale serveur au-delà des 48 médias du catalogue non établie. |
| **S03 — Lecture vidéo/audio et formats** | [SceneVideoPlayback.tsx:20](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/SceneVideoPlayback.tsx:20>) | Lecteur média, lecture/pause et présentation du contenu reliés aux sources. Câblage local ; disponibilité des médias distants dépend des URLs et des autorisations. |
| **S04 — File de lecture, suivant, répétition, autoplay** | [ShortsPage.tsx:3480](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/shorts/ShortsPage.tsx:3480>) | Politique de lecture et useScenePlaybackQueue consommés par le lecteur. Pas de serveur nécessaire à ces commandes locales. |
| **S05 — Historique et reprise** | [sceneWatchHistory.ts:328](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/sceneWatchHistory.ts:328>) | Progression et fin de lecture enregistrées ; repository isolé par compte. Persistance sur cet appareil seulement ; aucune synchronisation iOS/web revendiquée. |
| **S06 — Playlists personnelles et À regarder plus tard** | [scenePlaylists.ts:425](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/scenePlaylists.ts:425>) | Création/gestion et ajout/retrait reliés au repository local par compte. Câblé localement. Partage et synchronisation multiappareils à confirmer. |
| **S07 — Likes de médias réels** | [useShortsEngagement.ts:315](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/shorts/useShortsEngagement.ts:315>) | UUID canonique → toggleSceneMediaLike → RPC toggle_scene_media_like → mise à jour/erreur. Le mode démo conserve son état séparé. |
| **S08 — Golden Like et quota** | [useShortsEngagement.ts:410](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/shorts/useShortsEngagement.ts:410>) | État serveur, confirmation giveGoldenLike et gestion du quota ; démo séparée. Contrat appelé depuis l'UI ; disponibilité serveur non retestée. |
| **S09 — Suivre / ne plus suivre** | [ShortsPage.tsx:3472](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/shorts/ShortsPage.tsx:3472>) | Profil canonique → setFollowState, mise à jour et restauration en cas d'erreur. Chemin réel présent ; fixtures traitées séparément. |
| **S10 — Ouvrir le profil** | [ShortsPage.tsx:3036](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/shorts/ShortsPage.tsx:3036>) | Identité canonique ou référence démo → route profile/view → navigation native partagée. Pas de remplacement des UUID réels par les identités de démonstration dans ce handler. |
| **S11 — Contacter un artiste** | [ShortsPage.tsx:3068](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/shorts/ShortsPage.tsx:3068>) | buildMessagingRoute avec identité réelle/démo → Messagerie. Le destinataire réel passe par le parcours de conversation existant. |
| **S12 — Demande de collaboration** | [ShortsCollaborationDialog.tsx:83](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/shorts/ShortsCollaborationDialog.tsx:83>) | Formulaire → requestProfileCollaboration et pièces jointes → requestId → onglet Collabs. Chaîne réelle présente pour UUID ; simulation conservée pour les artistes démo. |
| **S19 — Studio : mes médias et édition des détails** | [SceneCreatorStudio.tsx:326](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/studio/SceneCreatorStudio.tsx:326>) | listOwnerMedia ; updateOwnerMediaDetails pour un média réellement possédé ; succès/erreur. Ne pas confondre ce chemin réel avec les cartes de démonstration du Studio. |
| **S26 — Émission d'événements analytiques** | [sceneAnalytics.ts:49](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/scene-source/vendor/src/features/scene/sceneAnalytics.ts:49>) | Interactions → trackSceneAnalytics → RPC track_analytics_event. Émission raccordée ; ne prouve ni ingestion déployée ni tableau de bord S20. |

### Rooms

| Fonction | Preuve principale | Portée réellement câblée |
|---|---|---|
| **R08 — Barre vidéo, plein écran et commandes d'affichage** | [RoomVideoControls.kt:1](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/RoomVideoControls.kt:1>) | Interactions d'affichage et masquage local ; surfaces viewer et host existantes. Fonctions locales ; elles ne démontrent pas une diffusion serveur. |
| **R09 — Miniature du host déplaçable / vidéos démo** | [CageVideoStage.kt:1](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/CageVideoStage.kt:1>) | Déplacements et rendu des clips de simulation raccordés. Simulation et préférence visuelle locales à conserver. |
| **R17 — Mixeur : import et lecture locale** | [WaveMixerDeckState.kt:63](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveMixerDeckState.kt:63>) | Import de fichiers/packs, waveform/analyse, moteur PCM, lecture, seek, loop, mute/solo. Chaîne locale réelle ; ne pas confondre avec son en direct. |
| **R21 — Pads et sons personnalisés** | [WaveMixerToolsState.kt:111](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveMixerToolsState.kt:111>) | MediaPlayer, déclenchement/pause, choix du fichier, gain, restauration et préférences. Câblé pour écoute locale ; diffusion relève de R20. |
| **R22 — Chronomètre et Countdown / son de fin** | [WaveMixerToolsState.kt:82](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveMixerToolsState.kt:82>) | Horloge, pause/reset, actions avant passage et son de fin, annulation. Mécanique locale reliée au lecteur/Cage ; horloge partagée de compétition relève de R33. |
| **R26 — Wave : séquenceur et composition locale** | [WaveCompositionState.kt:418](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveCompositionState.kt:418>) | Snap par quatre mesures, loop, Base/Boucle/Mix, pins, gain, mute/solo, composition et moteur audio. Atelier local fonctionnel ; les commandes musicales partagées nécessitent le raccord R28. |
| **R29 — Wave : import DAW, export et téléchargement local** | [WaveCompositionState.kt:53](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/WaveCompositionState.kt:53>) | Import/packs, rendu/export vers URI, téléchargement de la source locale. Fichiers réellement manipulés sur l'appareil ; droits d'accès aux versions serveur relèvent de R27. |
| **R31 — Cage : créer, sauvegarder et recharger un programme local** | [CageProgramStore.kt:10](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/CageProgramStore.kt:10>) | Programmes sérialisés, configuration, ordre, formats et remplacement préparés. Persistance locale. Bibliothèque partagée profil/web/iOS non raccordée à ce store. |
| **R34 — Cage : film de simulation et consultation du tableau** | [CageViewerShowcase.tsx:1](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/tools/audience/CageViewerShowcase.tsx:1>) | Parcours de simulation, vidéos, tours, tableau et portraits consultables. Câblé en démo locale. Ne vaut pas résultat d'une compétition distante. |
| **R41 — Scène room : prompteur** | [SceneToolsState.kt:140](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/SceneToolsState.kt:140>) | Textes, sélection, réglages de vitesse/taille, seek et persistance locale. Outil host local. Diffusion du texte aux artistes n'est pas prouvée et doit être explicitée si souhaitée. |
| **R43 — Loge : échange démo host ↔ viewer sur cet appareil** | [LogeViewerStore.kt:17](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/LogeViewerStore.kt:17>) | Pont /native/loge-viewer, SharedPreferences communs, demandes/questions/réponses et polling. Câblé pour le personnage loge-a et le scope démo par titre, pas pour deux comptes distants. |

## Fonctions présentes derrière les entrées, à réutiliser

Elles ne sont **pas** comptées comme live opérationnel dans le parcours Android normal.

| Destination existante | Contrat / preuve | Limite actuelle |
|---|---|---|
| Socle de room Web | [place.service.ts:931](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/place/place.service.ts:931>) : chat, présence, gains, mute, likes, Golden Like, sondages et cadeaux. | Viewer arrêté par R01 ; natif ne consomme pas ce repository. |
| Outils spécialisés | [roomTools.supabase.ts:64](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/tools/roomTools.supabase.ts:64>) : rooms_get_cage_state_v1 / rooms_get_specialized_state_v1. | Une interface de repository n’atteste pas la présence du RPC déployé. Aucun remplacement silencieux par fixtures en production n’est à introduire. |
| Wave normalisée | [waveViewer.service.ts:32](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/wave-viewer/waveViewer.service.ts:32>) ; [WaveViewerPanel.tsx:83](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/wave-viewer/WaveViewerPanel.tsx:83>). | Snapshot v6, URLs autorisées, tickets d’upload, votes et abonnement sont présents ; entrée live et host natif non raccordés. |
| Ancien upload Wave | [waveAudienceUpload.service.ts:24](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/tools/audience/waveAudienceUpload.service.ts:24>). | Il lève volontairement une erreur et exige le pipeline privé. **Ne pas le “réparer” en remettant un upload direct** : employer le service normalisé précédent. Ce helper n’est pas une preuve que le nouveau pipeline est absent. |
| Ressources Classe | [classroomResourceMedia.service.ts:81](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/tools/classroom/classroomResourceMedia.service.ts:81>). | Upload et téléchargement autorisé présents ; publication par le host Kotlin manquante. |
| Switch Room | [switchRoom.service.ts:52](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/switch-room/switchRoom.service.ts:52>). | Contrats get/switch/accept existants ; le host natif ne change que son module local. |
| Loge spécifique Android | [LogeRemoteRepository.kt:32](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/java/com/meewav/android/features/rooms/wave/LogeRemoteRepository.kt:32>) et [20260921170000_loge_host_viewer_tools.sql:11](<C:/Users/linkw/Desktop/Meewav-Android/supabase/migrations/20260921170000_loge_host_viewer_tools.sql:11>). | Migration locale non attestée déployée ; interface différente du repository spécialisé Web. Ne pas la déclarer “production prête”. |

## À CONFIRMER

Ces questions ne bloquent pas cet audit ; elles évitent d’inventer la portée produit.

1. **Historique/playlists Scène** — stockage local par compte fonctionnel (S05/S06). Doivent-ils se retrouver à l’identique sur web et iOS ? Si oui, une synchronisation supplémentaire manque ; ce n’est pas nécessaire à leur usage local.
2. **TV et Studio avancé** — vues de démonstration, garde d’accès et plusieurs CTA sans mutation. Quels outils doivent faire partie du premier lancement connecté ? Les conserver pour la démonstration ne signifie pas les publier comme outils opérationnels.
3. **Micro et effets** — la DA et les réglages natifs existent. Quel transport/DSP devient la référence commune ? Les effets doivent être appliqués à la capture, pas uniquement à un retour vidéo de démo.
4. **Contrat Loge** — aligner le RPC Android rooms_loge_* avec l’état spécialisé Web et le client iOS en cours. Il faut un seul modèle métier autoritaire ou des projections explicitement compatibles.
5. **Services déployés** — l’audit est fondé sur le code. Disponibilité actuelle des RPC, migrations, Edge Functions, Storage/RLS et secrets RTC à confirmer en recette ciblée, sans déduire leur absence d’un fichier client.
6. **Partage de rooms** — le bouton natif existe ; fixer le domaine public et la résolution App Link de l’UUID de session après R02.
7. **Fonctions de démonstration visibles sans compte** — conserver un accès simple pour l’investisseur ; décider de son libellé/emplacement sans faire basculer automatiquement une erreur réseau réelle sur de fausses données.

## Porte d’entrée iOS : état et exigences du raccord

Le dépôt iOS local est une référence, pas une certification de la version actuellement terminée par ton fils. Son [SupabaseRoomsRepository.swift](<C:/Users/linkw/Desktop/Meewav-iOS/Meewav/Features/Rooms/Services/SupabaseRoomsRepository.swift:110>) contient encore `unsupportedRoomFormat` pour Scène/Loge à cet endroit. Les autres contrats Rooms/Cage sont déjà présents. Il ne faut donc ni écraser son travail ni supposer que cette copie locale reflète son dernier état.

Autre divergence à traiter : le client de rooms Web embarqué appelle **livekit-token** ([placeLiveKit.service.ts:188](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/rooms-source/viewer-web/src/features/rooms/place/placeLiveKit.service.ts:188>)), tandis que la Messagerie Android utilise **messaging-call-token / BytePlus** ([byteplus.ts:5](<C:/Users/linkw/Desktop/Meewav-Android/app/src/main/messaging-source/calls/byteplus.ts:5>)) et qu’iOS possède ses services BytePlus. Cela peut être volontaire selon la fonctionnalité ; **la compatibilité audiovisuelle entre clients n’est pas prouvée par le seul partage de Supabase**.

Pour garder la porte iOS ouverte lors du futur câblage :

- identité canonique commune : profileId, roomId, session/waveId, compétition, rôle et participant ;
- commandes métier versionnées, validées côté serveur, avec idempotence et erreurs stables ;
- snapshots et événements consommables par Swift autant que Kotlin/TypeScript ;
- autorisations de médias/token côté serveur, jamais dépendantes d’un état UI ou d’un titre de room ;
- transport média compatible entre clients, ou pont explicitement prévu ;
- séparation `demo` / `live` au niveau de l’adaptateur, avec les fixtures actuelles conservées ;
- données propres à l’appareil (scroll, position de miniature, lecture locale) gardées locales, distinctes des résultats/votes/droits.

Ce sont des exigences de raccord, pas des changements effectués par cet audit.

## Regroupement des travaux par dépendances

### Frontend local / navigation

- R01/R02 : deux entrées explicites démo/live ; transmettre session/identité réelles.
- G03–G05, R15/R16/R30 : identités canoniques et navigation profil/Messagerie/collab.
- S13/R50 : liens publics partageables.
- S16/S17/S22/S27 : connecter les préférences, gestion de playlists et picker aux mécanismes déjà visibles.

### APIs et repositories déjà présents

- Messagerie : réutiliser conversations, pièces jointes et collaboration au lieu de stores de messages démo.
- Rooms : brancher les états Kotlin au socle et aux contrats spécialisés ; ne pas refaire six fois les mêmes mutations.
- Wave : utiliser la production normalisée, tickets privés et votes officiels.
- Classe : brancher publication et accès des ressources.
- Switch : utiliser la mutation versionnée et l’acceptation des changements.

### Backend / contrats à compléter ou à confirmer

- S14/S15/S20/S21/S23/S24/S28 : commentaires, modération, analyses Studio, droits, transcription, programmation.
- R24/R39 : paiements et attribution réelle ; UI de simulation à conserver.
- R44/R45 : modèle Loge partagé et fichiers privés de dédicace.
- M05/M06 : médias/stems de projets.
- L’absence de raccord Android ne permet pas, à elle seule, d’affirmer que le backend Web correspondant n’existe pas : vérifier le contrat avant d’en créer un nouveau.

### Realtime et média

- R03/R04/R06/R07/R18/R20 : présence, pistes, partage d’écran, autorisations, gains et bus audio.
- R11–R14/R28/R32–R38/R40/R42/R46/R47 : événements métier, votes, admission, tour de parole et questions.
- Horloges/échéances officielles côté session, pas une simulation indépendante sur chaque téléphone.
- M01/M02 : service de token/RTC et éventuel réveil natif des appels.

### Persistance et reprise

- R31/R51 : distinguer modèle de programme local et session partagée, reprise de connexion et versions.
- S18/S23 : persister toute la publication, pas seulement son fichier principal.
- S05/S06 : synchronisation à ajouter seulement si confirmée.
- Données démo toujours séparées ; ne pas migrer automatiquement loge-a, mockArtistId ou une contribution simulée vers un compte réel.

## Lecture finale

Le travail visuel et les mécaniques locales sont largement réutilisables. Le chantier principal est le **raccord aux identités et sessions communes**, puis la **diffusion des commandes/états et des médias**. Il ne faut ni repartir de zéro, ni déclarer les Rooms connectées parce que leurs simulations sont convaincantes.

Les mock data sont un livrable investisseur à conserver. Le raccord iOS doit rester possible par les contrats partagés, sans dépendre du téléphone Android.

