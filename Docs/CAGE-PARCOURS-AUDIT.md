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
  challenger est appelé. Open mic : duels successifs, deux nouveaux artistes
  après chaque duel (correction explicitement confirmée le 20 septembre).
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

21 tests JVM ciblés : tournois 2/3/4/5/8/16/32 participants, championnat 8 artistes
(28 rencontres distinctes), battle, open mic, votes vides/égalité, incidents,
préparation, déduplication, 3 rounds successifs/alternés/simultanés,
jury/hybride et échéance. Ajouts : programme vide, sélection sans déplacement,
chargement des règles et invitations en attente, capacité/jury, Open Mic en duels,
attente résoluble, sélection automatique des artistes prêts, couronnes de victoires
et remplacement des deux artistes en Open Mic / conservation du gagnant en Battle.
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

### Open Mic et Open Mic Battle — parcours corrigés

- Les deux routes Android sont des face-à-face, minimum deux artistes et vote A/B.
  Open Mic forme des paires successives ; Open Mic Battle conserve le gagnant.
  Les anciens paramètres de retour individuel sont conservés à la lecture des
  modèles mais ne désactivent plus le vote du duel. Ce changement Android est
  explicite ; le contrat Web de l’ancien Open Mic individuel n’a pas été modifié.
- La sélection automatique exclut les caméras/micros coupés et les connexions
  perdues. Une sélection manuelle reste possible ; le bouton de progression
  expose le motif et ouvre la fiche de l’artiste à préparer, au lieu de se désactiver.
- Le plein écran portrait impose deux moitiés égales, haut/bas, même si Focus
  ou Solo était choisi dans le petit retour. Recadrage centré sans bandes latérales.
- Chaque victoire validée attribue une couronne numérotée sur la vidéo, les
  cartes de programme et les vignettes/fiches Invités. Les BYE n’ajoutent pas de
  victoire. Le résultat reste visible avant l’appel suivant ; un reset efface les compteurs.

### Simulation accélérée et micro — 20 septembre 2026

- À la demande de l’utilisateur, le build debug force temporairement chaque
  passage à **2 secondes**, dans `WaveMixerScreen` (`simulationPassageSeconds`).
  La durée du programme sauvegardé et le chronomètre des votes restent inchangés.
  Retirer cet argument pour rétablir les durées configurées dans l’atelier.
- L’audio suit le passage actif : A puis B, silence en pause, incident, vote ou
  temps écoulé. Le mode Simultané reste une exception explicitement choisie.
  Cette porte audio ne modifie pas l’état de préparation du micro du participant.
- Le retour normal, le plein écran et l’état muet du mixeur utilisent cette même règle.
- 13 clips du pool `BattleVideoManager` de LinkWave Flutter ont été repris pour
  les démonstrations Cage uniquement. Origines dans `cage-demo/sources.json` ;
  import reproductible via `scripts/import-cage-demo.ps1`.
- Trois tests ciblés supplémentaires couvrent le tour de parole, les pauses,
  le mode simultané et l’override 2 secondes sans modifier les programmes.

Le moteur reste local : ni votes publics réseau, ni commandes Supabase avec
révision/idempotence, ni reprise persistante de compétition. Les flux sont les
vidéos de démonstration existantes, pas des publications RTC. Les programmes
sont enregistrés sur ce téléphone, sans synchronisation cloud. Les duels acceptent
des bulletins A/B locaux dédupliqués ; le transport des votes du public reste à
brancher. La scénographie mobile reprend les états du programme mais pas toutes
les annonces animées du ring web. Les sanctions, remplacements et reports du
moteur web ne sont pas encore reproduits : l’incident permet pause/reprise.
Ces limites ne sont pas couvertes par les tests locaux et ne constituent pas
une validation d’un live multi-utilisateur.
