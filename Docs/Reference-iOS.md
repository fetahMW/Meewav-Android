# Référence mobile iOS

Décision utilisateur du 14 septembre 2026 : utiliser les parcours mobiles déjà construits dans l’iOS pour l’authentification, la messagerie et les Rooms. Référence lue dans `sipiyou39/Meewav`, branche `main`, commit `aea7251a60a2b61d775901fcf39a62036fd108c4`. Une lecture du dépôt n’atteste ni son déploiement ni le résultat des lives réalisés par les utilisateurs.

SwiftUI reste spécifique à Apple. Android reprend les règles métier, identifiants et contrats de services, avec une interface native Kotlin/Compose. Le backend commun n’est ni remplacé ni migré par ce lot.

## Authentification adaptée dans Android

Sources : `Meewav/Features/Auth/State/AuthState.swift`, `Views/SignInPanelView.swift`, `Views/AvatarSelectionPanelView.swift`, `Views/SignUpFormView.swift`, `ViewModels/AuthViewModel+SignUp.swift`, `Services/SupabaseAuthService.swift` et `Models/AvatarProfile.swift`.

- Entrée centrée sur la connexion ; création de compte en trois étapes : avatar, identifiants, localisation.
- Les 28 avatars, leur ordre, leurs descriptions et leurs identifiants iOS sont conservés. Le rail tactile utilise Compose et les PNG HD ; les personnages centraux et les voisins restent opaques, seuls les éléments quittant les bords s'effacent. Le plateau, les projecteurs et leur variation d'intensité sont désormais adaptés de l'iOS (voir ci-dessous). La chute de confirmation SwiftUI n'est pas portée.
- Connexion e-mail ou nom via `resolve_profile_email_for_username(p_username)`, puis Supabase Auth. Le résultat de la résolution n’est pas affiché dans l’interface.
- Métadonnées communes : `username`, `artist_type` (`REEL`/`IA`), `avatar_url` (identifiant d’asset historique), `avatar_name`, naissance facultative, ville, code postal facultatif, pays et confidentialité par défaut.
- L’Android conserve la confirmation e-mail explicite, la récupération du mot de passe, PKCE et le stockage chiffré de la session. Contrairement au service iOS lu, il ne tente pas une connexion immédiate lorsqu’une inscription ne fournit pas de session.

Limites constatées dans la référence et traitement Android :

- `AuthViewModel+Location.toggleLocationEnabled` change un booléen ; le payload de cette inscription transmet des coordonnées nulles. Android propose donc une ville manuelle, sans prétendre avoir obtenu une position GPS.
- `TermsDetailsView.demoTerms` contient un texte de démonstration. Il est repris intégralement et signalé dans la fenêtre Android ; une acceptation locale ne constitue pas un enregistrement serveur d’un consentement versionné.
- Google iOS possède une intégration propre à Apple ; ses identifiants OAuth ne sont pas réutilisés comme configuration Android. Aucun bouton Google ou Apple inactif n’est ajouté.
- `onboarding_completed=false` reste explicite tant que la scène musicale et l’achèvement du profil partagé ne sont pas raccordés. Ni `complete_onboarding` ni l’ouverture du globe ne sont simulés.

## Plateau supérieur et carrousel iOS — 14 septembre 2026

À la demande de l’utilisateur, `origin/main` a été récupéré à nouveau : la référence reste `aea7251a60a2b61d775901fcf39a62036fd108c4`. Le modèle recherché est la composition de `AuthView.swift`, `Components/AuthStagePlatformOverlayView.swift`, `StagePlatformRenderer.swift`, `AvatarStageOverlayView.swift`, `SaturnCarouselLayout.swift`, `SaturnCarouselView.swift` et `LoginWindowChromeView.swift`.

Les étapes Connexion et Avatar Android partagent la même fenêtre sous un plateau elliptique. Dans Avatar, le rail circulaire au-dessus reprend les écarts et réductions progressives des personnages, les projecteurs arrière et les petits spots du plateau. À la connexion, le plateau reste vide et faiblement éclairé. Le contour de ces deux fenêtres reprend les courbes iOS ; les étapes suivantes gardent leur cadre Web ajusté. Les proportions verticales sont adaptées à l’espace disponible sur Android : l’enveloppe complète reste de hauteur fixe, le plateau occupe sa partie supérieure et la vitre sa partie inférieure. Cela remplace la disposition antérieure avec le carrousel à l’intérieur du formulaire.

L’intensité descend à 0,14 pendant le geste, remonte à l’arrêt puis se stabilise, selon la mécanique iOS. Le rendu des surfaces et faisceaux est mis en cache à la résolution de l’écran ; l’animation ne reconstruit pas ces textures à chaque image. Ce mécanisme n’est pas une mesure de fréquence d’affichage. Le sélecteur paginé sans défilement vertical, les identifiants backend et l’aperçu sans compte Android sont conservés. Ni la chute de confirmation, ni l’authentification sociale iOS, ni de nouvelles fonctions backend ne sont ajoutées par ce portage visuel.

## Messagerie : prochain portage

Sources : `Meewav/Features/Messaging/MessagingRootView.swift`, `Services/SupabaseMessagingRepository.swift` et `Docs/Messaging/README.md`, recoupés avec le code.

Le repository contient la liste des conversations directes, la résolution du destinataire, l’envoi de texte et de vocaux, les lectures et les souscriptions Realtime. Contrats à conserver :

- `messaging_list_direct_conversations_v1`, `messaging_find_contact_by_username_v1`, `messaging_resolve_direct_conversation_v1` ;
- `messaging_send_text_message_v1`, `messaging_send_voice_message_v1`, `messaging_mark_direct_conversation_read_v1` ;
- tables `messaging_messages_v1`, `messaging_conversation_participants_v1`, bucket privé `messaging-voice` et URL signées.

Le portage devra conserver l’identité serveur, les permissions, la pagination, les clés idempotentes des envois, la reconnexion et les erreurs visibles. `MessagingRootView` initialise encore collaborations, projets et groupes depuis `MessagingDemoData` : ne pas les présenter comme des espaces déjà persistés. Aucun écran ni transport de messagerie Android n’est ajouté par le lot d’authentification.

## Rooms : portage après la messagerie

Sources : `Meewav/Features/Rooms/Services/SupabaseRoomsRepository.swift`, `BytePlusTokenProvider.swift`, `ClasseCoreRTCClient.swift`, `ClasseMediaSession.swift`.

Le repository charge Place, Classe, Cage et Wave depuis `rooms_v2`. La création de Place/Cage/Wave suit le contrat existant ; Classe utilise notamment `rooms_create_classe_v1`. Scène et Loge sont explicitement refusées par la méthode de création lue. Cela décrit cette révision iOS, pas toutes les interfaces du Web.

BytePlus est le transport à reprendre. Pour le parcours direct, `byteplus-token` reçoit le canal, l’identité Supabase et l’intention de publier ; la clé de signature reste côté serveur. Le nom historique `livekit_room_name` ne justifie pas l’ajout du SDK LiveKit. La Classe possède un contrat d’autorisations RTC via Core, distinct des notifications : ne pas le contourner en copiant seulement le parcours Place.

Ce lot n’ajoute ni SDK RTC Android, ni token, ni serveur, ni migration. Le fonctionnement réel doit être éprouvé ultérieurement sur le S22 Ultra avec un autre participant autorisé, notamment l’iOS.
