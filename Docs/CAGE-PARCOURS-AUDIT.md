# Cage Android — audit du 20 septembre 2026

Références lues dans Meewav-Web : `CageCompetitionWorkspace.tsx` (notamment
`CageCommandBar`), `CageOpenMicWorkspace.tsx`, `CageStageProgram.tsx`,
`CageRingDisplay.tsx` et les types de compétition.

## Écarts corrigés

- Commande principale persistante dans les quatre vues, dérivée de l’état :
  programme, verrouillage, appel, scène, passage, vote, révélation, validation,
  rencontre suivante. L’onglet suit l’action ; la pause reste une action séparée.
- Tournoi : qualifications automatiques et exemptions pour un nombre impair.
  Championnat : toutes les paires se rencontrent, sans élimination.
- Battle : le vainqueur reste sur scène, seul le perdant descend et le prochain
  challenger est appelé. Open mic : passage individuel puis évaluation.
- Vote vide : relance possible. Égalité : nouvelle manche, sans vainqueur
  arbitraire. Un verdict ne peut pas contredire les scores. Bulletins dédupliqués,
  contrôle du jury et refus des bulletins après échéance.
- Un passage ne démarre pas si les artistes ne sont plus prêts. Les actions
  impossibles de préparation sont désactivées pendant une rencontre.
- Retour vidéo propre à la Cage : uniquement les concurrents présents sur scène,
  modes face-à-face/focus/solo, participant actif, chrono, pause/incident et
  verdict. Les deux flux sont empilés en plein écran portrait. Le choix du flux
  continue à piloter le fader partagé ; le mode est conservé en plein écran.

## Vérification effectuée

14 tests JVM ciblés : tournois 2/3/4/5/8/16/32 participants, championnat 8 artistes
(28 rencontres distinctes), battle, open mic, votes vides/égalité, incidents,
préparation, déduplication, 3 rounds successifs/alternés/simultanés,
jury/hybride et échéance. Ajouts : programme vide, sélection sans déplacement,
chargement des règles et invitations en attente, capacité/jury, open mic sans vote.
Compilation debug effectuée. Pas de validation visuelle ni de test multi-appareil.

## Préparation et participants — 20 septembre 2026

- Le séquenceur prépare ou charge le programme ; la régie le pilote. Il transmet
  le titre, le format, la capacité, la sélection et le règlement au moteur natif.
- Bibliothèque locale partagée entre Profil / Mes Cages, séquenceur et régie,
  séparée par compte (ou aperçu démo). Le profil ouvre directement le séquenceur,
  sans son ancien second parcours de lancement. La bibliothèque se rafraîchit au retour.
- La sélection se fait dans Invités. Candidatures et invitations sont identifiées
  et filtrables dans Demandes. Les invitations restent en attente ; réserver une
  place ne signifie ni accepter une invitation, ni passer sur scène.
- Les boutons de réponse de démonstration sont explicitement des simulations.
  Aucun message ou invitation réseau n’est envoyé par ces nouveaux parcours.
- Les jurés sont affectés dans Invités / Jury, sans un second annuaire dans le séquenceur.
- Les réglages restent modifiables avant confirmation. Le déroulement ne modifie
  pas le modèle sauvegardé ; un enregistrement explicite le met à jour.

## Limites restantes — ne pas confondre avec la régie web complète

Le moteur reste local : ni votes publics réseau, ni commandes Supabase avec
révision/idempotence, ni reprise persistante de compétition. Les flux sont les
vidéos de démonstration existantes, pas des publications RTC. Les programmes
sont enregistrés sur ce téléphone, sans synchronisation cloud. L’open mic accepte
des bulletins locaux dédupliqués (note 1 à 5, appréciation ou aucun vote) ; le
transport des votes du public reste à brancher. La scénographie mobile reprend les états du programme mais pas toutes
les annonces animées du ring web. Les sanctions, remplacements et reports du
moteur web ne sont pas encore reproduits : l’incident permet pause/reprise.
Ces limites ne sont pas couvertes par les tests locaux et ne constituent pas
une validation d’un live multi-utilisateur.
