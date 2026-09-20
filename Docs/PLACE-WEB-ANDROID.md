# La Place — adaptation Android du web

Source canonique : `Meewav-Web/src/features/rooms/place/PlaceConversationTools.tsx`, `placeConversationTools.domain.ts`, `placeConversationTools.store.ts`, routage dans `PlaceStudioPanel.tsx`, identité dans `roomPresentation.tsx`. Aucun outil iOS utilisé.

## Périmètre actif

- **Parole** : question facultative, durées 30/60/90/120/180/300 secondes, file limitée à 50, ouverture/fermeture des demandes, ajout de personnes prêtes en coulisses, retrait, passage suivant, pause/reprise, fin. Réglages verrouillés pendant un tour. Les personnes devenues indisponibles sont ignorées au passage suivant.
- **Clash** : deux participants distincts, sujet 160 caractères, 1/3/5 manches, même durée par personne, deux consentements obligatoires. Un refus annule. Alternance gauche/droite puis manche suivante, pause/reprise, arrêt. Le host peut participer lui-même. Les réponses de tiers sont explicitement simulées dans la démo.
- **Défis** : individuel ou collectif, 160 caractères, six actifs maximum et historique limité, inscriptions uniques, lancement après acceptation, déclaration de fin par un participant puis validation du host. Annulation et historique. Le host peut relever un défi.

À zéro, le chronomètre attend une commande du host, comme sur le web. Aucun effet automatique sur les micros, les volumes ou la scène : le moteur web indique explicitement que ces outils sociaux n’accordent aucune autorité média. Chat, mixeur, invités et régie restent les composants communs. Messages et portraits ouvrent les mécanismes communs. Cadeau reste à part en attente de son futur emplacement dans le mixeur demandé par l’utilisateur ; sondage reste dans le chat.

## Présentation

Trois onglets de 44 dp et indicateur commun. Blocs noir Hi-Fi, violet commun pour les actions, menus noirs sans teinte prune, champs compacts sans grosse bordure au focus. Identité Place blanc doux, conformément au thème web. Sélection des deux personnes côte à côte avec VS ; actions principales à portée de main. La correction Loge VIP retire recherche et icône historique ; un seul sélecteur reste en haut.

## Câblage et limites

Implémentation native **host / atelier local de démonstration**, conservée par room. Ne pas la présenter comme un raccordement serveur effectif. Le web utilise `rooms_get_place_tools_v1`, `rooms_apply_place_tools_v1` avec révision attendue et abonnement à `room_place_tools_v1`. L’Activity Android actuelle ne fournit pas la session live et l’identité nécessaires ; ces transports ne sont pas simulés comme une réussite réseau. Les réponses de tiers ne sont pas des consentements réels. Une intégration live devra imposer les rôles au serveur et gérer les conflits de révision.

## Vérifications

Huit tests ciblés réussis : admissibilité/dédoublonnage de file, pause/expiration sans avancée automatique, participants retirés, deux accords, alternance complète, refus/indisponibilité, cycle des défis, plafond et restauration. Compilation debug réussie. Première capture Samsung de Parole et lecture de la hiérarchie Clash réalisées ; inspection complète de chaque écran et parcours live réseau non revendiqués.
