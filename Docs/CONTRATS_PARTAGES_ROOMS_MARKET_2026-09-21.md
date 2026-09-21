# Contrats partagés Android / Web / iOS — raccordements du 21 septembre 2026

Les données réelles et les démonstrations restent séparées. L’entrée native preview conserve le catalogue investisseur ; une session réelle lit `rooms_v2`. Aucune fixture n’est insérée dans le catalogue serveur.

## Entrée rooms
- Catalogue : `rooms_v2` (status live), identité depuis `public_profiles`.
- Création : `rooms_create_classe_v1` pour Classe ; insertion propriétaire dans `rooms_v2` pour les autres types, comme le repository iOS existant. Identifiant de tentative conservé pour reprise.
- Appartenance : `rooms_join_classe_v1` / `rooms_leave_classe_v1` pour Classe ; `room_participants_v2` pour les autres familles, sous RLS.
- Fermeture host : `rooms_end_room_v1`. Android attend le succès avant de quitter ; échec visible.
- Bridge Android : `/native/room-session?type=…&title=…&id=<uuid>&source=live`.

## Classe
Android adapte `rooms_classe_host_state_v1` et `rooms_classe_viewer_state_v1` au modèle de ses écrans ; aucune seconde table Classe.
Commandes adaptées : question, soutien, main ouverte, demande de parole avec consentement et vérification micro, annulation, attribution et fin de parole. Les messages privés utilisent `rooms_classe_private_messages_v1` / `rooms_classe_send_private_message_v1`.

L’adaptateur d’affichage ne transforme pas une invitation en admission et n’invente pas d’élèves. Les commandes non adaptées retournent une erreur explicite. Le module host natif doit encore intégrer complètement ces projections et commandes ; le raccordement de l’adaptateur viewer ne prouve pas la chaîne RTC bidirectionnelle.

## Loge
Contrat additif déployé : `rooms_loge_read_v1(uuid)`, `rooms_loge_action_v1(uuid,text,jsonb)`, `rooms_loge_launch_v1(text,uuid)`.
Lecture réservée au host et membres actifs non bannis. Questions/invitations privées filtrées par destinataire. Commandes réservées au host contrôlées côté serveur. Ne pas écrire directement dans `room_loge_tools_v1`.
Neuf tests transactionnels réussis, fixtures annulées.

## Marketplace
Fondation et filtres v2 du web déployés sans changer leur signature. Catalogue, état personnel, favoris, panier, brouillons vendeur, demandes non financières et filtres sont disponibles via les RPC de `market.service.ts`.
Huit tests ciblés ont vérifié favoris, reprise idempotente, refus anonyme, écriture directe interdite et isolation entre comptes. La suite web historique complète n’a pas passé : ses fixtures d’onboarding et deux mutations directes de tables doivent être adaptées au serveur actuel. Aucune recette de paiement ou commande ; ces fonctions ne font pas partie de cette fondation.

## Vérification Android
Bundles reconstruits, compilation Android réussie. Quatre tests de l’adaptateur Classe réussis. Aucun contrôle visuel, aucun envoi à un utilisateur réel.

## Restant
Audio/vidéo et outils natifs partagés des rooms hors Wave, adaptations Cage/Scène/Place à leurs états canoniques, invitations/ressources de Classe restantes, cadeaux et certification, notifications hors application, studio projets, TV/droits/sous-titres, métier Tremplin et commerce financier. Ces points ne sont pas déclarés terminés par la présence des nouvelles entrées live.

## Complément host Classe
Le host natif lit désormais `rooms_classe_host_state_v1` et remplace les élèves de démonstration dans une session réelle. Attribution/libération/refus de parole, ouverture des mains et questions, résolution des questions et bannissement sont transmis au serveur canonique avant actualisation. Les portraits distants restent à intégrer dans les vignettes natives ; une silhouette remplace les photos de démonstration. Le transfert de ressources et le sondage de compréhension ne simulent plus une réussite dans une room réelle.

## Sondages et fermeture
Le client Android utilise `rooms_poll_state_v1` et adapte `vote_counts` au rendu existant. La fermeture utilise `rooms_end_room_v1`, commun à iOS.

## Complément cadeaux — serveur et host natif
Contrats Web déployés : inventaire, livraisons, tirages, certification. L'inventaire réel est activé sans créer de crédits de démonstration. Le host natif lit les stocks, attend la confirmation serveur, réutilise l'identifiant d'envoi et recharge les livraisons/tirages. Aucun gagnant réel n'est choisi sur le téléphone. La démo locale reste disponible.

Défaut serveur corrigé : la chaîne d'installation pg_cron annulait ses deux jobs, car `1 hour` n'était pas accepté. Le worker tourne maintenant toutes les cinq secondes ; la purge utilise `0 * * * *`. Exécution réelle du worker observée avec statut `succeeded` (sans attribution à des utilisateurs réels).

Limites précises : le contrat direct existant est réservé au host ; l'offre viewer et la distribution liée à une ronde ne sont pas déclarées raccordées. Le sélecteur natif live propose l'envoi immédiat ou programmé. Les tests de stock/idempotence ne remplacent pas une recette de tous les tirages entre appareils.

Validation : 9 assertions SQL cadeaux + 2 assertions scheduler ; 18 tests Kotlin Loge/audio ; 6 tests d'adaptateur Classe. Fixtures SQL annulées après les tests. Aucun contrôle visuel.

## Complément Classe — déplacements et destinataire privé
Le module Invités natif Classe transmet admission des candidatures, montée/descente de scène, retrait et invitation aux RPC iOS. Il attend la projection serveur ; ces callbacks sont détachés à la sortie du module. Les invitations nécessitent un compte réel.

Le viewer adresse sa réponse privée au `room.host_id`, et non au premier élève de la liste. Les questions déjà soutenues conservent cet état après actualisation. Ouverture des questions et résolution sont également adaptées au contrat canonique.
