> Document historique : pour les statuts consolidés après les corrections, utiliser [la liste maîtresse du câblage](SUIVI_CABLAGE_COMPLET.md).

# Audit transversal du câblage — Android, 21 septembre 2026

## Conclusion

**Non, toute l’application n’est pas câblée.** La finition des interfaces et la démo investisseur sont nettement plus avancées que plusieurs parcours réels. Une identité connectée ou un SDK installé ne suffit pas à rendre les actions d’un écran opérationnelles entre deux comptes.

Périmètre : répertoire de travail actuel Meewav-Android, modifications non commitées incluses. Authentification, Globe, Messagerie, Profil, Scène vidéo, Marketplace, Tremplin et les six rooms. Vérification en lecture seule du catalogue de fonctions/tables du projet Supabase commun `dqabekaqpznjsagoxzwc`, renouvelée pendant cet audit. Les rapports antérieurs ne servent pas de preuve du déploiement actuel.

Méthode : inspection des entrées, modes démo/live, handlers/repositories et appels RPC littéraux ; comparaison de leurs noms avec le serveur. **Pas de recette entre deux comptes, pas de test visuel, pas d’appel, cadeau, invitation ou paiement envoyé.** La présence d’un nom RPC ne prouve ni sa signature correcte, ni ses droits, ni le succès du parcours. Les copies vendor peuvent contenir du code non atteint ; les chiffres de l’annexe sont un inventaire technique, pas un pourcentage de fonctionnalités opérationnelles. Les appels dynamiques, tables, buckets, fonctions externes et notifications nécessitent une recette complémentaire.

## Priorités

| Priorité | Rupture confirmée | Conséquence | Travail nécessaire |
|---|---|---|---|
| P0 | Accueil des rooms basé sur `ROOMS_HOME_CATALOG` de fixtures | La liste ne représente pas les lives réellement créés | Brancher catalogue, lancement serveur, UUID, présence et fermeture ; conserver un catalogue démo séparé |
| P0 | Viewer live activé explicitement seulement pour la Wave | Les cinq autres rooms conservent un rôle démo dans le wrapper | Terminer les chemins host/viewer et les droits pour chaque type |
| P0 | API Market absentes | Compte connecté ≠ catalogue/panier/annonces/réservations fonctionnels | Reprendre migrations web, dépendances et droits ; recette de chaque mutation |
| P0 | Outils Rooms et API Loge manquants | Une action locale ne se propage pas nécessairement aux autres participants | Contrats communs web/iOS/Android et synchronisation métier |
| P1 | Cadeaux/certification profil incomplets | Offrir et consulter le stock ne constituent pas encore une chaîne réelle fiable | Stock, attribution, droits, idempotence, réception et historique |
| P1 | Globe encore démonstratif | Artistes/Top 10 et certains CTA ne correspondent pas à un compte réel | Identité canonique, population distante, routes profil/contact/collab |
| P1 | Projets de messagerie : studio non connecté | Takes, mix et retours non sauvegardés à distance | Upload privé, versions, partage et droits du projet |
| P1 | Scène : plusieurs services et synchronisations manquants | Catalogue connecté, mais pas l’ensemble du produit vidéo | TV, sous-titres, droits, synchronisation des listes et lien public |
| P1 | Tremplin métier en démo | Statistiques, portefeuille et opérations fictifs | Définir/brancher les services ; ne pas activer des transactions fictives |
| P1 | Notifications système hors app non établies | Réception d’un appel/invitation lorsque l’app est fermée non garantie | Transport push, tokens d’appareil, notification entrante et navigation |

## Matrice par feature

### Authentification et identité — partiel, socle réel

`core/auth/MeewavAuthRepository.kt` appelle réellement Supabase pour connexion, inscription, mise à jour et récupération. Le runtime hybride relit l’utilisateur et son profil. Le bypass debug demandé est conservé (`MainActivity.kt`, option `LIVE_AUTH`). Ce bypass n’est pas une validation d’authentification réelle. OAuth, retour de mail, expiration, révocation et reprise hors réseau restent à recetter sur les parcours réels. Ne pas supprimer le mode investisseur.

### Messagerie — noyau connecté, outils incomplets

`MessagingPage.tsx:176` active les hooks live pour un utilisateur réel ; messages, conversations, pièces jointes, groupes et collaborations disposent de services. Les appels audio/vidéo utilisent BytePlus et le serveur de jetons. La vérification précédente a confirmé les secrets RTC identiques au fichier fourni et les deux fonctions de jetons actives ; cela ne certifie pas un appel reçu en arrière-plan.

Manques confirmés : RPC `rooms_get_or_create_classe_direct_conversation_v1` absent (message privé depuis la Classe). `ProjectsWorkspace.tsx:2867` déclare explicitement que stockage, takes, mix et retours ne sont pas câblés à Supabase. Distinguer les fonctions basiques de projet déjà servies de ce studio non connecté. Les formats non pris en charge sont refusés dans `MessageWorkspace.tsx`, et non réellement envoyés.

### Profil — identité et médias connectés, pas tout l’espace privé

Lecture/édition du profil et visibilité persistée ont été raccordées. Restent absentes : `get_profile_certif_summary_v1`, `profile_set_my_certif_state_v1`, `profile_list_my_gift_inventory_v1`. Il faut vérifier toute la chaîne de cadeaux et certification, pas uniquement le CTA. Les éléments financiers/privés de démonstration ne doivent pas être présentés comme un solde réel.

### Globe — partiellement câblé

`RingArtistPreProfile.tsx:109` utilise des identités `ring-demo-*`, `demoFollow` et un CTA profil complet qui affiche « bientôt disponible » à la ligne 126. Population et Top 10 restent à raccorder aux profils et au classement serveur. Aucun RPC littéral dans le bundle Globe ne signifie pas que tout fonctionne : le rendu et la navigation sont locaux et peuvent passer par des bridges.

### Scène vidéo — partiellement câblée, progrès réels conservés

Catalogue, publication de médias, commentaires, likes, Golden Likes, signalements et statistiques propriétaire possèdent désormais les contrats de l’implémentation inspectée. Aucun nom RPC littéral absent dans ce sous-arbre : **cela ne valide pas chaque parcours**.

Restent : programmation TV réellement pilotée, génération de sous-titres, workflow des accords de droits ; playlists/historique/préférences encore locaux par compte ; domaine de partage public à définir ; pagination au-delà de 1000 commentaires ; nettoyage/reprise des uploads multiples interrompus ; console traitant les signalements. Détails du lot précédent dans `CABLAGE_SCENE_PROFIL_IDENTITE_2026-09-21.md`.

### Marketplace — identité raccordée, commerce non opérationnel

`market.flags.ts` sépare le mode preview de Supabase. Le client `market.service.ts` existe, mais 18 des 19 noms RPC trouvés dans le sous-arbre sont absents ; le nom présent peut appartenir à une dépendance de profil. Manquent catalogue/capacités, état utilisateur, favoris, panier, vendeur, création/édition d’annonce, réservation/location/services et intentions. La refonte visuelle récente n’a pas déployé ces services. Paiement, commande, remboursement et stock ne sont pas certifiés et ne doivent pas être activés à partir du panier démo.

### Tremplin — identité raccordée, métier démo

`TremplinStatistics.tsx:22` affiche explicitement des données fictives ; le classement vient de `tremplinStatisticsRanking`. `TremplinPage.tsx` utilise fixtures de portefeuille, transactions mock, rappels et suivi locaux. Les quelques RPC présents sont des dépendances communes, pas la preuve d’un backend Tremplin. Statistiques, dossiers d’émission, opérations de jetons, reçus, portefeuille et droits économiques restent à raccorder/valider. Maintenir les transactions réelles verrouillées tant que cette chaîne manque.

## Rooms : état réel de chaque famille

- **Entrée commune** : `RoomsHome.tsx:28` importe le catalogue fixture. `RoomsPage.tsx` ouvre le host via `openSession(..., undefined, program)` ; pas d’UUID réel transmis par ce parcours de lancement. Le bridge accepte par ailleurs un `liveRoomId` dans un parcours live explicite : c’est une capacité distincte d’un lancement complet depuis l’accueil.
- **Wave** : `WaveMixerScreen.kt:192` crée une session audio réelle seulement avec le type Wave et un `liveRoomId`. L’audio BytePlus/Superpowered existe ; ne pas le déclarer absent. Le wrapper viewer retire le rôle démo pour une Wave live. Mais `rooms_wave_viewer_snapshot_v6` est absent, et la composition/votes/boucles nécessitent encore un raccordement métier et une recette distincts de l’audio.
- **Cage** : simulations de tournoi/battle/championnat opérationnelles localement ; `rooms_cage_launch_v1` et `rooms_get_cage_state_v1` absents. Bracket, passages, résultats, vote public et régie ne sont pas certifiés entre comptes.
- **Classe** : vignettes, parole, questions et ressources existent côté UI ; outils spécialisés serveur manquants dans le contrat viewer. Message privé Classe également bloqué par RPC absent. Donner la parole localement n’atteste pas le droit RTC distant, ni l’achat d’une place.
- **Scène room** : programme, passages, prompteur, vote et cagnotte à distinguer de la feature vidéo. Les outils spécialisés/du vote serveur attendus sont absents. Démo locale ≠ spectacle partagé synchronisé.
- **Loge** : `LogeRemoteRepository.kt:32–33` appelle `rooms_loge_read_v1` / `rooms_loge_action_v1` : **les deux sont absents du serveur vérifié**. `LogeViewerStore.kt` est explicitement un transport de démo sur le même appareil. VIP, questions, invitations et cadeaux réels restent incomplets malgré cet adaptateur.
- **Place** : `rooms_get_place_tools_v1` / `rooms_apply_place_tools_v1` absents ; file, parole, outils et états partagés restent à raccorder.
- **Commun** : API manquantes pour stage public/audio, invitations, entrée/sortie, sondages, gains micro/musique, caméra, cadeaux/tirages et Switch Room. `RoomViewer.tsx` passe aussi `source="demo"` au pré-profil : résoudre la vraie identité et le mode lors d’un parcours live.

## Notifications, sécurité et exploitation

Aucun service Android FirebaseMessagingService / déclaration POST_NOTIFICATIONS / intégration FCM n’a été repéré dans le manifest et la couche native inspectés. Cela ne prouve pas l’absence de toute notification in-app ; cela laisse la réception système en arrière-plan non établie. Ajouter la recette app fermée, compte déconnecté, réseau perdu et multi-appareils.

Les contrôles RLS, signatures et autorisations ne sont **pas** certifiés par cet inventaire. Avant d’ouvrir une feature réelle : utilisateur A ne peut pas modifier les données de B, viewer ne peut pas agir comme host, notifications non doublonnées, opérations idempotentes, aucun succès affiché après refus serveur. Les migrations web/iOS existantes doivent être comparées avant tout déploiement ; ne pas créer des contrats concurrents Android. Les clés privées BytePlus restent serveur.

## Ordre de raccordement proposé

1. Entrée live commune : création/liste/rejoindre/quitter, identité et rôles réels ; démo conservée à côté.
2. État partagé des invités, audio/vidéo et permissions ; terminer la Wave puis les autres rooms avec mêmes contrats iOS.
3. Cadeaux, stock, notifications et invitations ; Loge et messages Classe.
4. Market : catalogue → vendeur/annonces → favoris/panier → intentions ; paiement séparé après validation.
5. Globe/profil et studio projets ; compléments Scène et liens publics.
6. Tremplin métier, sans assimiler simulations et transactions réelles.

Aucun code produit ni configuration serveur modifié pendant cet audit. Aucun build/install requis pour ce rapport.

## Annexe : contrats littéraux absents (déduplication par feature)

Les copies vendor ne sont pas toutes des chemins actifs. Cette liste est une base de traçage, pas une liste automatique de migrations à déployer.

### messaging

- `rooms_get_or_create_classe_direct_conversation_v1` — `app\src\main\messaging-source\vendor\src\features\messaging\messaging.service.ts:125`

### profile

- `get_profile_certif_summary_v1` — `app\src\main\profile-source\vendor\src\features\profile\gifts\profileCertifEndorsements.service.ts:144`
- `profile_set_my_certif_state_v1` — `app\src\main\profile-source\vendor\src\features\profile\gifts\profileCertifEndorsements.service.ts:226`
- `profile_list_my_gift_inventory_v1` — `app\src\main\profile-source\vendor\src\features\profile\gifts\profileGiftInventory.service.ts:146`

### market

- `set_my_marketplace_seller_kind_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1006`
- `list_marketplace_catalog_v2` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1023`
- `get_marketplace_catalog_capabilities_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1036`
- `get_my_marketplace_state_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1048`
- `get_my_marketplace_seller_kind_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1054`
- `set_marketplace_favorite_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1066`
- `set_marketplace_cart_item_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1079`
- `create_marketplace_listing_draft_v2` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1094`
- `create_marketplace_listing_draft_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1099`
- `list_my_marketplace_listing_drafts_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1111`
- `update_marketplace_listing_draft_v2` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1130`
- `update_marketplace_listing_draft_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1137`
- `create_marketplace_rental_request_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1156`
- `create_marketplace_service_booking_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1173`
- `join_marketplace_collective_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1187`
- `list_my_marketplace_intents_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1203`
- `update_marketplace_intent_status_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1220`
- `cancel_marketplace_intent_v1` — `app\src\main\market-source\vendor\src\features\market\market.service.ts:1232`

### rooms

- `rooms_get_or_create_classe_direct_conversation_v1` — `app\src\main\rooms-source\viewer-web\src\features\messaging\messaging.service.ts:125`
- `profile_list_my_gift_inventory_v1` — `app\src\main\rooms-source\viewer-web\src\features\profile\gifts\profileGiftInventory.service.ts:145`
- `rooms_cage_launch_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\launch\cageLaunch.service.ts:8`
- `rooms_list_live_call_contacts_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\live-call\roomLiveCall.service.ts:405`
- `rooms_list_my_live_call_invitations_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\live-call\roomLiveCall.service.ts:417`
- `rooms_invite_live_call_contact_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\live-call\roomLiveCall.service.ts:432`
- `rooms_respond_live_call_invitation_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\live-call\roomLiveCall.service.ts:444`
- `rooms_set_live_call_route_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\live-call\roomLiveCall.service.ts:460`
- `rooms_set_live_call_on_air_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\live-call\roomLiveCall.service.ts:474`
- `rooms_end_live_call_invitation_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\live-call\roomLiveCall.service.ts:485`
- `rooms_public_stage_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:782`
- `rooms_public_audio_channels_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:783`
- `rooms_poll_state_v3` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:840`
- `rooms_enter_room_v2` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:936`
- `rooms_leave_room_v2` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:941`
- `rooms_set_own_music_muted_v3` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:956`
- `rooms_set_own_camera_enabled_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:966`
- `rooms_set_host_camera_forced_off_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:974`
- `rooms_set_host_guest_mic_gain_v3` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:992`
- `rooms_set_host_guest_music_gain_v3` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:1001`
- `rooms_commit_host_audio_state_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:1039`
- `rooms_create_gift_draw_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:1140`
- `rooms_submit_gift_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:1155`
- `rooms_start_gift_draw_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:1170`
- `rooms_reveal_gift_draw_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:1176`
- `rooms_cancel_gift_draw_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:1182`
- `rooms_end_place_v3` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:1216`
- `rooms_set_queue_open_v3` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:1221`
- `rooms_invite_profile_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:1241`
- `rooms_end_guest_passage_v3` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\place.service.ts:1264`
- `rooms_get_place_tools_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\placeConversationTools.store.ts:37`
- `rooms_apply_place_tools_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\placeConversationTools.store.ts:84`
- `rooms_set_program_layout_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\place\placeProgramLayout.repository.ts:166`
- `rooms_get_experience_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\switch-room\switchRoom.service.ts:15`
- `rooms_switch_experience_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\switch-room\switchRoom.service.ts:52`
- `rooms_accept_experience_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\switch-room\switchRoom.service.ts:56`
- `rooms_prepare_wave_switch_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\switch-room\switchRoom.wave.ts:10`
- `rooms_complete_wave_switch_base_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\switch-room\switchRoom.wave.ts:28`
- `rooms_get_cage_state_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\tools\roomTools.supabase.ts:66`
- `rooms_get_specialized_state_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\tools\roomTools.supabase.ts:71`
- `rooms_initialize_specialized_state_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\tools\roomTools.supabase.ts:145`
- `rooms_commit_specialized_state_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\tools\roomTools.supabase.ts:211`
- `rooms_get_voting_policy_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\voting\roomVoting.service.ts:26`
- `rooms_set_voting_policy_v1` — `app\src\main\rooms-source\viewer-web\src\features\rooms\voting\roomVoting.service.ts:37`
- `rooms_wave_viewer_snapshot_v6` — `app\src\main\rooms-source\viewer-web\src\features\rooms\wave-viewer\waveViewer.service.ts:32`

### Appels natifs Loge

- `rooms_loge_read_v1` — absent.
- `rooms_loge_action_v1` — absent.
