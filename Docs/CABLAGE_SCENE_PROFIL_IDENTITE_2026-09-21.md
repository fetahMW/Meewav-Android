# Scène vidéo, profil et identité — 21 septembre 2026

Ce lot concerne la feature vidéo La Scène, pas la room Scène. Il ne constitue pas une déclaration de câblage intégral de tous les modules du produit.

## Raccordements réalisés

- Le runtime commun charge `/auth/v1/user` avec le jeton Android, puis les champs publics de son propre profil. Nom affiché, nom complet, prénom/nom présents dans les métadonnées d’inscription, photo, bio, rôle, ville et grade sont transmis aux interfaces. Le profil canonique prime sur les anciennes informations OAuth. Aucun second système de session ou de refresh JavaScript.
- Marketplace : identité du vendeur et portrait issus de cette identité ; photo de profil prioritaire sur l’avatar. Tremplin : nom/photo/rôle du membre via son résolveur existant. Les opérations financières du Tremplin restent désactivées.
- Profil : chargement et édition existants vérifiés dans le code ; nom canonique `display_name` pris en compte. Les cinq commutateurs de visibilité de l’espace privé sont désormais sauvegardés dans `profiles.public_profile_preferences` et rechargés. Fin de l’affichage du profil précédent après déconnexion.
- Scène : catalogue connecté séparé des fixtures ; erreur affichée et réessai, ouverture directe des médias plus anciens que les 48 premiers, prise en compte immédiate des préférences de masquage, styles et formats.
- Publication : description, format, liens, crédits déclarés, hashtags, confirmations de droits et référence du deuxième média enregistrés dans `media_files.metadata.scene_publication`. La seconde piste possède son propre média serveur. Ces déclarations ne constituent pas des accords juridiques signés par des tiers.
- Commentaires : lecture, publication, réponse, modification par l’auteur, suppression par l’auteur ou le propriétaire du média, likes et épinglage par le propriétaire. Vérifications côté serveur, limitation des publications rapprochées. Le Studio et la page de lecture utilisent le même composant et le même contrat.
- Signalement : création d’un dossier serveur, aucun succès en cas d’échec réseau. File `scene_media_reports_v1`, réservée au service de modération ; raccordement d’une console de modération à prévoir.
- Studio : vrais contenus du compte, rechargement des détails avant édition, modification de miniature via upload avec référence durable de stockage, statistiques réelles d’impressions/likes/commentaires et périodes. La gestion des playlists emploie le repository local existant plutôt qu’une liste parallèle.

## Déploiement serveur

La vérification des noms de contrats a révélé que la migration web des likes n’était pas déployée. Déployés :

- `20260808091000_scene_media_likes.sql`, repris du dépôt web ; mêmes signatures.
- `20260922100000_scene_interactions_v1.sql`, ajout isolé, sans suppression des contrats existants.
- `20260922110000_scene_profile_golden_bridge.sql` : `get_golden_like_state`, `give_golden_like`, agrégat public et colonne `public_profiles.golden_likes_count`. Ce champ absent faisait échouer tout le catalogue et les pré-profils. Le registre `daily_golden_likes` et son trigger iOS demeurent inchangés ; quota glissant de 24 heures conservé. Ne pas appliquer sans étude la migration web historique des Golden Likes, qui changerait ce quota en jour civil Europe/Paris.

L’inventaire des noms des RPC appelés dans le graphe source Scène ne présente plus de contrat absent après ces déploiements. Cela n’est pas une recette fonctionnelle de chaque signature ni une preuve de disponibilité des services non encore implémentés.

Contrat commun Android/web/iOS :

`scene_interaction_v1(p_action text, p_media_id uuid, p_comment_id uuid = null, p_body text = null, p_parent_id uuid = null)`.
Actions : `list`, `add`, `edit`, `delete`, `like`, `pin`, `report`. L’identité vient exclusivement de `auth.uid()`. `list` retourne les champs `SceneComment` ; les réponses utilisent `parentId`. La lecture est actuellement bornée à 1000 commentaires par média. La pagination serveur reste à compléter pour des fils plus longs.

`scene_owner_stats_v1(p_days integer = 28)` retourne `impressions`, `likes`, `comments` pour les seuls médias du compte authentifié. Impressions ≠ vues uniques ou temps de visionnage. Aucune rétention fictive n’est affichée en réel.

Tables ajoutées : `scene_comments_v1`, `scene_comment_likes_v1`, `scene_media_reports_v1`. RLS activée, aucun accès direct pour les clients ; accès par RPC contrôlé. Les comptes anonymes ne peuvent pas muter. Le service de modération doit consommer la dernière table.

## Ce qui reste effectivement non terminé

- Domaine public des liens partagés : demandé à l’utilisateur. Un lien Android `appassets.androidplatform.net` n’est plus partagé comme s’il était public.
- Scène : génération de sous-titres/transcription, workflow d’accords de droits et programmation TV : pas de service opérationnel identifié. Les faux succès du Studio sont conservés uniquement en démo, remplacés par un état indisponible en réel.
- Playlists/historique/préférences : fonctionnement local isolé par compte, pas encore de synchronisation multi-appareils.
- Publication : la reprise transactionnelle d’un upload multicam interrompu reste à renforcer ; un fichier téléversé avant une erreur peut rester dans la médiathèque privée.
- Profil : les contrats `get_profile_certif_summary_v1`, `profile_list_my_gift_inventory_v1`, `profile_set_my_certif_state_v1` et certaines tables de cadeaux sont absents de ce serveur. Déployer ces migrations exige de reprendre toute leur chaîne de dépendances et les règles de stock ; ce lot ne les active pas partiellement.
- Marketplace : les clients RPC existent mais les RPC catalogue, favoris, panier, annonces et réservations ne sont pas déployés sur le serveur vérifié. L’identité est raccordée, pas une activation complète du commerce. Tremplin : identité raccordée, transactions toujours en démonstration conformément au périmètre demandé.
- Les données de démonstration sont conservées. Elles restent séparées du compte connecté ; un échec serveur ne doit pas les faire passer pour les données réelles.

## Vérifications

- Sept tests Node d’identité/session : passés (identité canonique, stabilité, refus de réponses périmées, séparation démo et déconnexion).
- Dix-neuf tests SQL (douze interactions et sept Golden Likes) : passés dans une transaction annulée, puis repassés sur les contrats déployés. Comptes et contenus de recette temporaires annulés, aucune notification réelle envoyée.
- Six bundles compilés : messagerie, profil, scène, marketplace, tremplin et rooms.
- `:app:assembleDebug` : réussi.
- APK mis à jour sur le Samsung ; entrée authentification avec démo conservée.
- Pas de contrôle visuel ni de recette entre comptes réels ; l’utilisateur les réalise.
