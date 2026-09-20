# La Classe — adaptation native Android, 20 septembre 2026

Référence lue : `Meewav-iOS`, `origin/main`, `aea7251` (référence distante actualisée avant lecture). Aucun fichier iOS modifié.

Sources : `ClasseHostRoomView`, `ClasseClassroomPanel`, `ClasseClassroomResourcesView`, `ClasseSessionViewModel`, `ClasseModels`, `ClasseReviewFixtures`, `ClasseRepository` et `ClasseStageView`.

## Périmètre validé dans la conversation

La demande initiale porte sur les outils et mécaniques iOS de La Classe dans la direction artistique Android. L’utilisateur a ensuite explicitement exclu **le carnet de cours et les pages éditables**. Aucun éditeur, sommaire ou carnet n’est livré. Les ressources sont indépendantes des pages.

## Intégration Android

- La route `classe` ouvre directement les outils Classe ; chip bleu `#438FFF` de la présentation officielle du site, icône école dans la barre principale, titre de session conservé lorsqu’il vient du lanceur.
- Chat, Mixeur, Invités, régie de scène, drag aller/retour, volume sélectionné, messages et pré-profils restent les composants communs. Aucune copie de ces modules dans La Classe.
- Salle : 24 élèves admis maximum, portraits sélectionnables, mains et questions sur les élèves concernés, parole en cours avec durée, actions contextuelles message/profil/exclusion. Les demandes et les invitations en attente restent dans Invités.
- Parole : ordre des mains, raison, invitation à parler, attribution à un élève disponible, fin de parole, baisse individuelle ou collective des mains en attente ; libérer la parole conserve les autres demandes. L’attribution utilise la scène existante et respecte ses trois places.
- Questions : ouverture/fermeture, ordre par nombre de soutiens puis par date décroissante, soutien réversible, répondre/écarter et filtre par élève. Les questions déjà reçues restent accessibles quand les nouvelles sont fermées.
- Compréhension : session démarrable/arrêtable, états compris/partiellement/pas compris par élève et totaux. Les réponses de démonstration sont limitées au build DEBUG, comme les fixtures iOS.
- Ressources : import multiple via sélecteur Android (images, vidéos, PDF), permissions de lecture persistantes, stockage local des références, liens HTTP(S) validés, aperçu image avec zoom, vidéo avec transport, PDF paginé rendu hors thread UI, copie via sélecteur de destination, partage Android, retrait confirmé sans suppression du fichier source.
- Pas de nouvelle dépendance. Matériau noir HiFi et violet des contrôles existants ; bleu réservé à l’identité de La Classe.

## Limites de câblage à ne pas confondre avec le portage UI

L’entrée native `WaveMixerActivity` est actuellement une démonstration de room sans identifiant de room serveur ni rôle viewer, également utilisée par les autres rooms. Ce portage utilise cette même frontière. Il ne prétend pas transmettre les mains, questions, réponses, invitations, ressources ou audio aux autres appareils.

L’iOS dispose en plus de `ClasseRepository`, `SupabaseClasseRepository`, coordination RTC, hydratation des assets, contrôles de révision du cours et notifications serveur. Ces transports **ne sont pas raccordés dans cette entrée Android**. Les commandes sociales de démonstration emploient le stockage local commun et les médias de démonstration existants. Le partage de fichiers passe par la feuille Android et requiert le choix explicite de l’utilisateur.

Le raccordement live nécessitera une entrée contenant la vraie room et le rôle, la projection des participations Supabase dans les invités, les RPC Classe et leur gestion d’erreurs/reconnexion. Les interfaces de démonstration ne doivent pas être considérées comme une validation du fonctionnement multi-utilisateur.

## Livraison

Compilation autorisée pour installation sur Samsung. Aucun test ni contrôle visuel automatique exécuté, conformément à la consigne de travail.

## Ajustements sièges et modération
- Démo initiale : 22 élèves sur 24, deux places libres en cercles sombres, conservées dans la pagination de deux pages de 12. Les autres rooms conservent leurs effectifs.
- Main levée sans fond : 16 dp en haut à gauche.
- Bannir remplace Annuler dans la barre de sélection ; confirmation nominative avant retrait. Un second appui sur le portrait désélectionne toujours.
- Le bannissement de cette session locale retire aussi la parole, les questions, la sélection du fader et empêche une nouvelle invitation du même identifiant. Les admissions depuis Invités respectent la capacité de 24.
- Les sièges libres ne déclenchent aucun paiement côté host. Achat et bannissement serveur restent à raccorder à la future session viewer/backend.
