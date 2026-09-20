# La Loge — adaptation Android, 20 septembre 2026

## Référence canonique

Uniquement `Meewav-Web/src/features/rooms`, sans reprise iOS.
La configuration **active** de `tools/roomTools.config.ts` expose VIP, Sondage, Questions, Cadeau.
Les anciens composants Avant-première, Face-à-face et Moments restent dans le dépôt web mais ne sont plus des onglets actifs ; ils ne sont pas réintroduits.

| Web actif | Android | Parcours repris |
|---|---|---|
| `LogeDedicationPanel.tsx` | `LogeToolsPanel.kt`, `LogeRecordingPanel.kt` | Recherche, sélection d’un membre, dédicace audio/vidéo, enregistrement réel, réécoute/visionnage, refaire, historique privé ; invitation 5/10/15 min, acceptation, préparation, mise à l’antenne, fin |
| `PlacePollToolPanel.tsx` | `LogePollPanel` | Question 160 caractères, Oui/Non ou Pour/Contre, 15/30/60 s, résultats, arrêt, relance, accès chat |
| `LogeQuestionsPanel.tsx` | `LogeQuestionsPanel` | Réception ouverte/fermée, classement par soutiens, une question sélectionnée, affichage 30 s comme `RoomToolsShell`, réponse privée, passage vers VIP, réponse/archivage/restauration |
| `PlaceGiftTool.tsx` + `profileGiftCatalog.tsx` | `LogeGiftPanel.kt` | Six cadeaux Rooms (sans Wave Party), inventaire, surprise nom/image, destinataire, maintenant/date/ronde ; tirage file/room/sélection/noms, 5/7/10 s, préparation/lancement/annulation/révélation |

## Adaptation mobile

Châssis commun Chat/Mixeur/Invités/régie conservé. Quatre sous-onglets à hauteur constante, noir Hi-Fi, CTA violet commun ; or réservé à l’identité Loge et aux petits repères. Liste VIP compacte et actions fixées en bas. Cadeaux en deux colonnes, parcours en trois étapes et CTA fixe. Portraits issus des fixtures web, ouverture du pré-profil commun.

Le bouton Sondage des outils du chat ouvre l’onglet Loge pour éviter deux sondages concurrents. La question et le tirage apparaissent dans le retour vidéo normal et plein écran. Un tirage ne montre jamais les noms du pool avant le gagnant. Réservation de stock et opérations idempotentes ; annulation remboursée une seule fois ; aucune relance d’un tirage déjà commencé.

## Frontière de câblage

Comme les autres outils natifs Rooms actuels, l’écran est un **atelier local de démonstration**, sans identifiant de session Supabase/RTC réel transmis par l’Activity. L’état est conservé par atelier. Ne pas annoncer une livraison réseau : invitations, dons, inventaire, votes, soutiens et messages privés restent locaux. Les contrôles de réponse/vote simulés sont explicites. Les médias capturés sont réels et privés sur le téléphone, relisibles dans l’historique ; aucune transmission à un fan n’est prétendue.

Sur le web live, les dédicaces passent par `messagingRepository`/`messagingAttachmentsRepository`, les invitations par `RoomLiveCallProvider`, cadeaux et tirages par `usePlaceRoom`. Ces transports ne sont pas substitués par de faux appels réseau. Une prochaine connexion live devra fournir session, rôle/grade réels, identifiants de profils et synchronisation/horloge serveur ; l’inventaire local de démonstration ne doit pas être utilisé comme inventaire réel. La programmation locale est reprise à l’ouverture, pas exécutée comme une tâche serveur en arrière-plan.

Les coulisses représentent la préparation terminée. L’acceptation d’une invitation VIP ne saute pas cette étape ; la mise à l’antenne exige connexion, préparation et capacité disponible. Fin du moment : retour en coulisses. Réouverture de l’app : confirmation nécessaire avant de remettre un invité en direct.

## Vérification demandée

### Ajustement validé par l’utilisateur après la première passe

L’interface active contient désormais **VIP, Questions, Invitations**. Cadeau est conservé à part pour son futur emplacement commun dans le mixeur, sans accès depuis la Loge. Sondage est retiré de la Loge : les outils du chat conservent leur mécanique existante, sans redirection. La barre VIP réutilise exactement `ClasseTool` et sa surface noire commune. Questions concerne les invités identifiés de la Loge, sans ingestion du chat ni compteur de soutiens public.

Invitations propose Concert, Sur scène, Rencontre et Session studio, avec destinataire, détails date/lieu, historique, contact et suivi des réponses. Ce parcours est une adaptation demandée, pas une fonctionnalité prétendument copiée du web. L’acceptation ne modifie jamais la scène actuelle. Il reste local et indique explicitement l’absence d’envoi réel.

Première passe Samsung : captures des quatre anciens onglets, question vers VIP, invitation/acceptation/mise à l’antenne, capture audio 16 secondes et réécoute, préparation/tirage/révélation du gagnant. La capture vidéo complète et les transports réseau ne sont pas validés. Tests unitaires ciblés et compilation réussis ; nouvelle passe après adaptation des trois onglets.

Tests ciblés : consentement, préparation, montée/descente, question unique, arrêt des votes, idempotence, stock, date/grade/pool, tirage figé, reprise sans mise à l’antenne automatique. Compilation et parcours Samsung complètent cette vérification ; les transports serveur restent hors de la validation locale.
