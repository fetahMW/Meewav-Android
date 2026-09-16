# Audit de câblage Web / iOS / Android — 16 septembre 2026

## Verdict

**Non, les quatre piliers ne sont pas encore raccordés de bout en bout au backend commun. Le câblage est partiel.** Il existe de vrais services Supabase et un tchat direct partagé iOS/Android ; plusieurs autres services appellent un schéma Web préparé mais absent du serveur utilisé. Des incompatibilités supplémentaires sont propres à l’adaptation Android.

**Les mocks investisseurs doivent rester.** Leur présence n’est ni une anomalie ni une preuve d’absence de câblage. Le critère retenu ici est : existe-t-il, à côté de la démo, un parcours réel dont l’interface, la session, les paramètres, les objets serveur et les permissions concordent ? Un service importé ou une compilation ne suffit pas.

Aucune interface, donnée de démonstration, configuration serveur ou donnée utilisateur n’a été modifiée pendant cet audit. Aucune migration appliquée, aucun compte créé, aucun message envoyé, aucun appel lancé.

## Périmètre et preuves

- Android : `Meewav-Android-initialisation`, branche `codex/profil`, code audité `ca1e0c8`. Les modifications préexistantes des trois fichiers Gradle restent hors audit et hors commit.
- Web : dépôt canonique `Meewav-Web`, `main`, `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21`. Lecture du code actif et de ses services, pas seulement des documents historiques.
- iOS : dépôt Swift **`sipiyou39/Meewav`**, `main` vérifié via GitHub : `aea7251a60a2b61d775901fcf39a62036fd108c4`. L’ancien dépôt Flutter `LinkWave-IOS` n’est pas utilisé comme référence.
- Serveur : projet **Meewav Dev `dqabekaqpznjsagoxzwc`**, même URL dans les configurations des trois clients. L’existence des clés locales n’atteste pas la configuration d’une future release.
- Inspection distante PostgreSQL dans une transaction **`BEGIN READ ONLY`**, terminée par `ROLLBACK` : fonctions/signatures/grants, colonnes, tables/vues, RLS, policies Storage/Realtime, triggers Auth, publications Realtime et buckets. Pas de lecture du contenu des comptes, conversations ou fichiers privés.
- Lecture du endpoint public Auth `/auth/v1/settings` : e-mail et Google activés, **Apple désactivé**, inscriptions autorisées, confirmation e-mail automatique activée sur ce projet Dev.
- Aucun essai authentifié multi-compte ni essai physique Web/iPhone/Samsung dans ce lot. Les mentions « raccordé » ci-dessous signifient **chaîne de code et contrat serveur cohérents**, pas réussite d’un scénario utilisateur mesurée.
- Pas d’accès Management API disponible dans l’environnement utilisé : allowlist des callbacks et déploiement courant de l’Edge Function vidéo non confirmés indépendamment.

L’[inventaire RPC](SUPABASE-RPC-INVENTORY-2026-09-16.md) liste les noms trouvés dans les services et leur présence distante. Il inclut des méthodes Web remplacées par l’adaptateur Android et ne doit pas être interprété comme un pourcentage de fonctionnalités opérationnelles.

## Matrice comparative des quatre piliers

| Domaine | Web actuel | iOS `main` | Android actuel | Conclusion |
|---|---|---|---|---|
| Connexion e-mail/session | SDK Supabase et provider Auth | SDK Supabase natif | SDK Kotlin, persistance chiffrée, token court transmis aux WebViews | Socle réel existant ; essais de session à mener |
| Inscription/identité/scène | Auth réelle, puis RPC de finalisation absentes | Métadonnées Auth et triggers ; identité historique, localisation manuelle | Métadonnées Auth avec scène ; `onboarding_completed=false` | Contrat d’onboarding non unifié |
| Google/Apple | Parcours OAuth dans les sources à recetter | Google ID token + finalisation dédiée | Google/Apple PKCE ; brouillon d’inscription non finalisé après OAuth | Google activé serveur ; Apple désactivé ; callback Android non vérifié |
| Globe visible et Top 10 | Globe vinyle embarqué, profils/Top 10 de démo ; arrivée liée au compte dans le host Web | Carte Mapbox et service Geo ; pas de repository social injecté dans `GlobeRootView` | Globe local avec CSP sans Supabase et portraits de démo | Géographie/rendu et population sociale réelle ne sont pas raccordés ensemble |
| Tchat direct texte/vocal | Ancien contrat Web, RPC absentes | Contrat `messaging_*_v1` déployé | Adaptateur vers ce même contrat | Base réutilisable iOS/Android ; Web à aligner |
| Réactions, épingles, transfert, modération | Services vers RPC absentes | Actions avancées non persistées / refusées en mode réel | Méthodes Web héritées non adaptées | Non terminé |
| Collabs / Projets / Groupes | Hooks/services présents, RPC absentes | Collections `MessagingDemoData` | Interfaces Web + hooks, mêmes RPC absentes | Démo conservable ; persistance réelle à terminer |
| Appels directs vidéo | Pas de contrat direct commun démontré dans cet audit | RTC direct non raccordé selon le code/documentation messagerie | UI + BytePlus + RPC vidéo + Edge Function attendue | Chaîne Android partielle, pas interopérabilité trois clients validée |
| Profil propriétaire | Requête incompatible avec le schéma actif | `ProfileMockService` injecté sans repository Supabase | Même requête Web incompatible | Profil live bloqué avant les finitions secondaires |
| Stats / classement / grades | Fonctions/table nouvelles absentes | Données du service mock | Services Web importés, même manque serveur | Non opérationnel en réel |
| Médiathèque | Lecture legacy possible ; nouveau stockage non déployé | Données du service mock | Même service + restrictions réseau natives | Lecture ancienne partielle ; upload/publication/archivage à finaliser |
| Espace privé / cadeaux / setlists | Lectures privées existantes ; autres sous-domaines locaux ou contrats absents | Mock | Lectures privées bloquées par le pont Auth ; contrats cadeaux absents ; setlists locales | Pas une persistance commune complète |

## 1. Authentification et navigation

### Ce qui existe réellement

Android `MeewavAuthRepository.kt:23–78` crée le client Supabase, résout le username, connecte, inscrit, récupère le mot de passe et ouvre Google/Apple. Les RPC `resolve_profile_email_for_username(p_username)` et `is_profile_username_available(p_username)` existent avec les signatures attendues.

Les triggers distants `handle_new_user()` et `sync_profile_from_auth_metadata()` existent sur `auth.users`. Ils copient notamment username, avatar, ville, scène, zone, coordonnées et visibilité dans `profiles`. **L’inscription Android n’est donc pas simplement un formulaire local : son chemin non-démo sait réellement créer le compte et le profil historique.** Le maintien du flag d’onboarding à `false` ne signifie pas absence de cette écriture.

iOS utilise le même socle. Google y passe par `signInWithIdToken`, puis `completeGoogleOnboarding` met à jour les métadonnées et `profiles`. Android utilise un navigateur avec PKCE ; ce chemin requiert sa propre configuration de retour.

### Écarts bloquants

1. **Le vrai parcours Android n’ouvre pas le globe après connexion.** `AuthViewModel.kt:63–73` envoie une session authentifiée vers `SignedIn`. `navigate()` interdit `Preview` et `Globe` hors `DEBUG && localPreview` (`:107–112`). `AuthScreen.kt:255–266` propose alors « Ouvrir la messagerie ». Le bouton retour au globe de `MessagingActivity.kt:224–231` transmet également un extra limité à DEBUG. Le parcours investisseurs fonctionne séparément ; il faut créer son équivalent authentifié.
2. **Onboarding divergent.** Android transmet `onboarding_completed=false` (`RegistrationProfile.kt:50`) et ne termine pas le contrat partagé. Web appelle `complete_onboarding`, `update_my_public_discovery_profile` et `get_my_private_profile`, absents de la base. `musicSceneProfilePersistence.ts:109–147` ne récupère pas un échec de RPC manquante : il le remonte. Les commentaires « terminé » de la matrice historique Web décrivent une cible après migration.
3. **Google Android abandonne la suite métier.** Le retour OAuth passe directement à `SignedIn`, sans enregistrer le choix d’avatar/scène effectué avant l’OAuth. L’iOS a une finalisation dédiée ; elle n’a pas d’équivalent complet dans Android.
4. **Apple désactivé sur le serveur.** Un bouton câblé côté client ne suffit pas. Google est activé, mais son fonctionnement Android et les URI `meewav-android://auth-callback/...` restent à vérifier dans la configuration et sur un compte de recette.
5. **Sémantique du rôle non commune.** iOS/Android écrivent `artist_type=REEL|IA`. Le Web utilise également `artist_type` pour un métier/libellé et attend `primary_role_key`. Cette dernière colonne n’existe pas actuellement. Le statut créateur IA/réel, le métier et l’avatar doivent avoir des champs distincts et une correspondance versionnée.

La route atelier DEBUG et le bypass restent volontairement présents, conformément à la demande. Ils ne sont pas à supprimer pour raccorder le mode réel.

## 2. Globe : rendu intégré, données sociales séparées

Le Web actif utilise `MonGlobe.tsx` → `VinylGlobe.tsx` → iframe `globe-vinyle/index.html`. Le host gère l’identité de persistance et une arrivée géographique (`scene-arrival`). Ce pont **ne fournit pas un chargement des vrais artistes Supabase** au moteur.

Dans le moteur importé, `NationalTopTen.tsx:9` décrit un ordre éditorial de démonstration ; `RingArtistPreProfile.tsx` utilise `getPreProfileArtistForSeed` et `demoFollow`. Le service plus ancien `src/features/globe/api/preProfile.api.ts` contient du vrai code Supabase, mais sa présence dans le dépôt ne signifie pas que les portraits du nouveau moteur l’appellent. Ses projections `public_profiles`, `published_media_files` et plusieurs RPC sociales n’existent d’ailleurs pas dans ce serveur.

Android :

- `scripts/build-full-globe.mjs:54` produit une CSP `connect-src 'self'` et des assets locaux ; pas d’URL Supabase autorisée dans ce document.
- `full-globe-bridge.ts` gère le cycle de vie et la navigation, sans injection de session ni repository social.
- `messaging-navigation.ts:2–8` construit explicitement `mode=demo` et `mockArtistId`, pour ne pas envoyer un message à un faux UUID serveur.
- Une session réelle est protégée contre ce raccourci fictif : le host messagerie retire la route démo. Cela évite une fausse conversation, **mais ne raccorde pas le portrait à une personne réelle**.

iOS : `GlobeRootView.swift:25–60` charge la géographie via les clients France/Paris/Mapbox. C’est un raccordement cartographique distinct de Supabase ; aucun repository de population sociale n’est injecté dans cette composition. `MainTabView.swift:45–53` ouvre bien ce globe et le profil, mais les autres indices tombent encore sur un fond noir ; la route dédiée Messagerie de `AppRootView` possède, elle, son repository réel.

**À réaliser :** conserver le moteur/les fixtures et ajouter un fournisseur de données réelles avec identité publique, avatar, visibilité, zone, Top 10 et actions sociales. Le pont doit transmettre identité et arrivée de façon contrôlée. Un seul contrat serveur public doit alimenter les trois clients, indépendamment de Three.js ou Mapbox.

## 3. Messagerie

### Tchat direct iOS/Android : fondation commune présente

`iosDirectMessaging.ts:25–67` remplace certaines méthodes du repository Web :

- liste : `messaging_list_direct_conversations_v1` ;
- contact : `messaging_find_contact_by_username_v1` ;
- ouverture : `messaging_resolve_direct_conversation_v1` ;
- texte : `messaging_send_text_message_v1` ;
- lu : `messaging_mark_direct_conversation_read_v1` ;
- vocal : `messaging_send_voice_message_v1`, bucket privé `messaging-voice`, URL signée.

Ces six RPC, leurs signatures et les tables sont présents. Les messages sont limités aux participants par RLS ; le stockage vocal possède des policies dédiées. Les RPC d’envoi vérifient l’utilisateur et les identifiants idempotents. Les tables messages/participants appartiennent à `supabase_realtime`.

Android reçoit les INSERT de messages et rattrape toutes les 10 secondes (`useMessagingLive.ts:954–969`). L’iOS utilise aussi ces tables. Cette correspondance autorise la réutilisation du travail existant ; un test réel aller-retour texte/vocal et reconnexion reste nécessaire.

### Ce qui manque derrière les autres commandes

L’adaptateur commence par `...messagingRepository` : il **ne convertit pas tout le contrat Web**. Les préférences, archivage, blocage, signalement, réactions, épingles, suppression et transfert continuent à viser des RPC absentes. Les invitations de conversation retournent même `[]` dans l’adaptateur (`:40`).

Les réponses citées constituent un autre écart : le contrôleur transporte `replyToMessageId`, mais l’adaptateur d’envoi ne le transmet pas et la lecture impose `reply_to_message_id:null`. Une citation affichée localement ne constitue donc pas une citation persistée.

Collabs, Projets, Groupes et pièces jointes hors vocal appellent toujours le contrat Web : `list_my_collaboration_requests_v2`, `list_my_creative_projects_v1`, `list_my_artist_groups_v1`, `prepare_messaging_upload_v1`, etc. **Aucune de ces familles de RPC n’est déployée.** Les canaux privés `messaging:user:<id>` n’ont pas non plus la policy de broadcast attendue ; la policy messagerie trouvée concerne les appels (`messaging:calls:<id>`).

La version iOS ne fournit pas ces domaines persistés : `MessagingRootView.swift:12–14` initialise les trois collections depuis `MessagingDemoData`. Le Web a davantage de contrats préparés, mais pas un serveur complet derrière ces écrans.

Même après déploiement du socle Web, certains outils nécessitent encore une implémentation : planning/décisions de groupe explicitement indisponibles en mode live (`ArtistGroupsWorkspace.tsx:1426–1428`), Track Packs/stems/takes/mixes et plusieurs interactions locales décrites dans la spécification messagerie. Ne pas considérer le déploiement SQL comme suffisant pour terminer tous les sous-menus.

### Vocaux et appels : limites distinctes

- Le vocal Android accepte jusqu’à 15 minutes à 128 kbit/s ; le serveur/bucket impose 10 Mio et une durée de 600 à 900 000 ms. `sendIosVoice` ne vérifie que fichier non vide/durée positive jusqu’à 15 minutes. Aligner les contrôles client sur ces limites : un long vocal peut dépasser 10 Mio, un très court vocal peut être rejeté.
- La RPC Android `messaging_video_call_v1` et sa policy Realtime privée existent. Le code invoque `messaging-call-token`, puis BytePlus. Le déploiement de cette fonction est documenté au 15 septembre, **mais non revérifié via Management API dans cet audit**. Pas d’appel lancé pour le prouver.
- Aucun équivalent de signalisation vidéo directe raccordé au même contrat dans l’iOS audité ; la documentation iOS classe les appels RTC directs hors périmètre. Les Rooms BytePlus constituent une autre mécanique.
- Pas de réception d’appel Android en arrière-plan via push/service dédié dans ce lot. Il ne faut pas annoncer un appel interplateforme complet sur la seule base de l’icône vidéo.

## 4. Profil : problèmes communs et problème Android spécifique

### Chargement du propriétaire

Web et Android partagent `profile.service.ts`. `PROFILE_SELECT` contient **`primary_role_key`** (`:50`) alors que cette colonne est absente de `public.profiles`. Le chargement échoue donc au contrat de lecture, avant la qualité du contenu. L’écriture utilise la même colonne ; le retry prévu pour `display_name` n’élimine pas cette incompatibilité.

`profile_grade_state` est absent, mais son échec est volontairement toléré pour revenir au grade historique. Ce n’est pas la cause principale de l’échec de chargement.

iOS : `ProfileViewModel.swift:14–50` construit systématiquement `ProfileMockService`. Il n’y a pas de chemin parallèle réel dans cette composition. Garder ce service pour la démo et introduire un repository réel avec les mêmes modèles de présentation.

### Session Android incompatible avec plusieurs services importés

Le pont natif garde la session chiffrée et fournit un `accessToken` court au client JavaScript (`messaging-source/runtime.ts:15–24`). C’est un socle utilisable pour PostgREST, Storage et Realtime, sans persister un deuxième refresh token.

**Mais le SDK JavaScript installé interdit l’accès à `supabase.auth` lorsqu’il est configuré avec `accessToken`.** Le proxy lève une exception (`@supabase/supabase-js/src/SupabaseClient.ts:346–355`). Or ces services importés y accèdent :

- `profile.private.service.ts:178,193` : `auth.getUser()` et `auth.mfa.listFactors()` ;
- `profileGiftInventory.service.ts:130` ;
- `profileRoomGiftAwards.service.ts:139` ;
- `profileCertifEndorsements.service.ts:159` ;
- `preProfile.api.ts:251` pour certaines actions sociales.

**C’est un défaut concret de portage Android**, indépendant des mocks et du déploiement SQL. Fournir une façade de session native et des opérations Auth owner ciblées ; ne pas résoudre cela en stockant une seconde session Web non coordonnée.

### Par sous-onglet

| Sous-ensemble | État réellement observé |
|---|---|
| Identité, rôle, visibilité, préférences | Services présents ; blocage `primary_role_key` ; sémantique du rôle à unifier |
| Notifications | Table et requêtes lecture/marquage présentes ; pas de preuve de tous les producteurs métier ni de push Profil |
| Accueil / Statistiques | `get_my_profile_metrics` absent ; graphiques démo distincts du chemin réel |
| Classement | `get_my_profile_rankings_v1` absent |
| Médiathèque | Table legacy `media_files` présente et fallback de lecture prévu ; colonnes nouvelles absentes ; bucket `profile-media` absent ; `archive_media_file` absent |
| Upload / publication média | Ne peut pas aboutir avec le contrat actuel ; ne pas remplacer le bucket privé attendu par le bucket public `media` pour masquer le problème |
| Transactions / contrats / matériel / invitations | Tables existantes avec RLS ; lecture Web prévue ; Android bloqué par `auth.getUser()` ; paiements/signatures/mutations sensibles ne sont pas implémentés par ces lectures |
| Sécurité du compte | Lecture Web utilisateur/MFA prévue ; adaptation native Android manquante |
| Cadeaux / attestations | RPC `profile_list_my_gift_inventory_v1`, `get_profile_certif_summary_v1`, `profile_set_my_certif_state_v1` absentes ; tables d’attributions Rooms et d’attestations attendues absentes |
| Setlists / préparations Cage | Stockage local dans ces workspaces ; ne constitue pas une synchronisation de compte entre appareils |

## 5. Confidentialité du contrat existant

Ces points proviennent du schéma et des droits effectivement lus, sans extraire de données personnelles :

1. **Résolution publique username → e-mail.** `resolve_profile_email_for_username` est `SECURITY DEFINER`, exécutable par `anon` et `authenticated`, et retourne `profiles.email` sans contrôle interne d’identité. Cacher l’adresse dans l’interface Android/iOS ne protège pas cette API. Remplacer ce mécanisme par un flux de connexion médié, avec erreurs non révélatrices et limitation des tentatives, puis coordonner la migration des deux clients.
2. **Projection publique trop large.** La policy de lecture `profiles` autorise la ligne propriétaire ou un profil visible/non fantôme, et les rôles API possèdent SELECT sur la table qui contient e-mail, téléphone, naissance, adresse et coordonnées. Une RLS sur la ligne ne sépare pas ses colonnes privées. Les projections publiques étroites préparées côté Web sont absentes. Le problème existe au niveau serveur, même si les UI sélectionnent peu de champs.
3. **Champs d’autorité et grants à resserrer.** Les rôles API ont UPDATE de table, avec une policy propriétaire, alors que `grade`, `is_verified`, compteurs et autres champs d’autorité sont dans la même ligne. La revue des droits ne démontre pas leur protection colonne par colonne. Prévoir une liste de champs modifiables/RPC owner étroites et vérifier les autres contraintes/triggers avant promotion. Des grants historiques très larges existent aussi ; ne pas assimiler leur présence à une opération distante exécutée pendant cet audit.

Les policies de participants du tchat et le bucket vocal privé constituent en revanche une base déjà isolée à conserver. Les migrations Web de confidentialité ne doivent pas être appliquées en bloc sans adapter les lectures/écritures iOS et Android encore dépendantes de `profiles`.

## 6. Ce qu’il faut faire, dans l’ordre

**Aucune réécriture des interfaces ni du moteur graphique n’est justifiée par ces constats.** Le travail porte sur les contrats, adaptateurs et quelques routes.

1. **Figer les deux sources de données.** Conserver toutes les fixtures investisseurs et un mode démo explicitement sélectionnable ; ajouter/terminer le mode compte réel. Ne jamais injecter un faux profil ou message en secours d’un échec serveur.
2. **Définir le contrat commun et sa compatibilité.** Partir des tables et RPC iOS déjà déployées pour préserver utilisateurs/conversations/Rooms ; reprendre les capacités utiles des migrations Web, après revue et migration additive coordonnée. Ne pas créer un backend divergent par plateforme.
3. **Traiter identité et confidentialité.** Unifier username, nom affiché, métier, IA/réel, avatar, scène et visibilité ; projections publiques sans données privées ; finalisation commune de l’onboarding ; remplacement sécurisé de la résolution d’e-mail. Google/Apple et redirections à configurer/recetter.
4. **Terminer le pont Android et les routes réelles.** Fournir les lectures Auth/MFA attendues via le natif ; ouvrir le globe en session authentifiée et transmettre la scène. Conserver la route atelier investisseurs.
5. **Raccorder le Profil propriétaire puis les médias.** Colonnes/projections compatibles, lecture/écriture propriétaire, stockage privé, publication/archivage, notifications, métriques/classement. Brancher aussi le repository réel iOS ; conserver son `ProfileMockService`.
6. **Achever le tchat commun, puis Collabs/Projets/Groupes.** Réutiliser le tchat direct iOS/Android, adapter Web, traiter les méthodes encore héritées et les citations, ajouter les contrats manquants et leurs policies/Realtime. Spécifier séparément les outils encore locaux. Aligner vocaux et signalisation vidéo entre clients.
7. **Brancher la population du globe.** Séparer géographie, démo et profils réels ; charger le catalogue public autorisé, relier profils/Top 10/actions/messages par identifiants serveur. Garder rendu, vinyle et démos.
8. **Recette interplateforme avant de déclarer les quatre piliers câblés.** Comptes de recette A/B/C, propriétaire/tiers/bloqué, création puis relecture sur un autre client, refresh/reconnexion, visibilité, médias privés, erreurs réseau, texte/vocal/citations et permissions. Les appels demandent deux appareils et une mesure réelle, pas seulement un schéma présent.

Pour Tremplin, Marketplace, Scène et Rooms : ne pas supprimer les interfaces de présentation ni retarder leur design pour cette raison. Mais stabiliser d’abord identité, profil public, médias et contrats de conversation évitera de réimporter les mêmes incompatibilités. La présence de nombreuses tables Rooms v2 dans la base ne vaut pas audit complet de ces quatre futures features ; elles sont hors périmètre détaillé de ce rapport.

## Limites explicites

- Présence SQL et lecture des policies ne prouvent pas tous les résultats RLS avec trois JWT distincts. Pas de test d’écriture ou d’exploitation réalisé.
- Pas de login Google/Apple, de récupération d’e-mail ou d’inscription exécuté ; Apple désactivé est toutefois confirmé par le serveur.
- Pas de vérification du déploiement d’un site public, d’un binaire TestFlight ou d’une future release Android : audit des sources nommées et du backend Dev configuré.
- Les jeux de données investisseurs sont conservés. Aucun nettoyage, remplacement ou réensemencement de données n’est requis par les conclusions.
