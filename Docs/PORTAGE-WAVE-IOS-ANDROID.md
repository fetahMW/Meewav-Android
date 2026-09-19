# Atelier Wave Android — 19 septembre 2026

Branche : `codex/wave-tools-ios`.

## Source et adaptation

Les règles viennent de `WaveHostLiveSetController.swift`, `WaveLiveAudioEngine.swift`
et `WaveHostLiveSetPanel.swift` dans Meewav-iOS : horloge commune, lancement à la
mesure suivante, boucles / prises longues / one-shots, répétitions, mute, solo
exclusif et écoute privée. Le moteur AVAudioEngine est adapté en Kotlin avec une
sortie AudioTrack stéréo 48 kHz qui mélange les pistes sur une horloge commune.
Il ne s’agit pas d’une intégration binaire du moteur Apple.

L’onglet Wave présente Propositions, Vote puis Composition, dans cet ordre.
Le lecteur principal est fixé au-dessus des listes des trois sections. Il reste
accessible lorsque l’on défile ; sa forme d’onde et ses commandes secondaires
se replient sans interrompre le son. Les cartes reprennent les conteneurs noirs
de Propositions validés par l’utilisateur, avec portrait, lecture circulaire et
chip de catégorie coloré. La carte elle-même n’est pas teintée par sa catégorie.
Il conserve le retour vidéo, les modules communs et les matériaux HiFi noirs,
avec le violet principal Android `#5137A1`. Les options détaillées utilisent un
bottom sheet. Les autres types de rooms ne reçoivent pas les outils propres à Wave.

## Fonctions présentes

- Import multiple via le sélecteur Android, permission persistante de lecture.
- Décodage hors thread UI et cache PCM sur disque ; formes d’onde issues du son.
- Analyse BPM / tonalité avec le module Android existant, sans bloquer le décodage.
- Jusqu’à 20 pistes ; départ quantifié, arrêt, 1× / 2× / 4× / infini selon le type.
- Volume individuel, mute, solo exclusif, ordre et catégorie des pistes.
- Écoute privée d’une proposition en atténuant la composition, dont l’horloge continue.
- Classement des propositions, prise dans la composition, archives et motif local.
- Sauvegarde locale de l’atelier et de ses réglages.
- Pack House existant avec de vrais fichiers audio locaux.
- Simulation de vote 30 / 45 / 60 secondes, verdict et ajout ou remplacement.
- Volume général relié au fader Audio du mixeur ; arrêt à la perte de focus / sortie.
- Lecteur fixe : lecture / pause / reprise, arrêt avec remise à zéro, déplacement
  par mesure, recherche dans la forme d’onde et boucle A–B redimensionnable.
- Indicateurs stéréo calculés sur la sortie audio, progression des pistes et
  compte à rebours visuel du lancement à la mesure.
- Glissement horizontal des cartes pour accéder aux actions ; fermeture par tap,
  retour animé et transitions de liste. Le défilement vertical conserve son geste.
- Packs ZIP et dossiers : écoute globale, écoute de chaque élément, prise de
  toute la composition après préparation complète, ou prise piste par piste.

## Audit des commandes iOS et correspondance Android

Référence lue : dépôt Meewav-iOS, branche main, commit `aea7251`.
L’audit couvre l’atelier Host, son lecteur et les composants de propositions.
Le studio d’enregistrement spectateur appartient à un autre parcours.

Point de structure : dans cette référence, `WaveHostLiveSetPanel` contient deux
sections (Composition / Propositions) et un transport dans Composition.
`WaveMixerDeckPlayer` porte séparément la forme d’onde, la boucle et le multipiste.
Le lecteur permanent et repliable sur trois sections est donc leur adaptation
demandée pour Android, et non une copie à l’identique d’un unique écran iOS.

| Commande / état | Source iOS | Réalisation Android |
|---|---|---|
| Horloge commune, mesure / temps, BPM / clé | WaveLiveTransportHeader, WaveHostLiveSetController | Lecteur fixe ; horloge commune aux pistes |
| Play / arrêt général iOS | toggleClock, stopAll | Play / pause / reprise et bouton Stop distinct ; le Play principal lance les pistes préparées |
| Play individuel | toggleClip, queueLaunch | Départ à la prochaine mesure ; second tap annule l’attente ou arrête la piste |
| Chargement / indisponible | WaveLiveClipLane | Progression circulaire et erreur avec possibilité de relancer la préparation |
| Attente / lecture | WaveLiveClipLane.playbackButtonContent | Icône d’attente puis Stop, anneau de progression ; carte toujours noire |
| Boucles et répétitions | cycleRepeatPolicy | 1× / 2× / 4× / ∞ ; les prises longues n’ont pas ∞, les one-shots jouent une fois |
| Refus de raccourcir une répétition active | cycleRepeatPolicy | Même règle, avec explication dans l’interface |
| Appui long répétition | WaveLiveClipLane.contextMenu | Appui long fait cycler la répétition ; également disponible dans les options |
| Mute | toggleMute | Coupe la piste, enlève son solo et atténue sa carte |
| Solo exclusif | toggleSolo | Désactive les autres solos et réactive la piste si elle était muette |
| Glissement composition | WaveClipLaneSwipeRow | Mute / Solo / Retirer, une rangée ouverte, ressort de retour, tap pour refermer |
| Retrait | removeFromLive | Arrêt et retrait du séquenceur, proposition conservée |
| Écoute privée | togglePrivatePreview, WavePrivateCueBanner | Un seul aperçu à la fois ; la composition est atténuée et garde sa position |
| Arrêt de l’aperçu | stopPrivatePreview | Arrête également les demandes de lecture différées |
| Prendre une proposition | takeOrAdd | Ajout sans démarrage automatique ; indicateur de prise |
| Filtrer les propositions | WaveInboxScopeBar | Sélecteur À écouter / Prises / Archives, avec compte |
| Mettre de côté / passer | WaveProposalSwipeRow | Actions par glissement ; confirmation pour passer et note privée dans les options |
| Détail d’une proposition composée | WaveProposalDetailSheet | En-tête du pack et cartes de ses éléments ; écoute et prise globale / individuelle |
| Adoption complète | prepareCompositionAdoption / commitCompositionAdoption | Préparation de tous les médias avant ajout ; limite de 20 pistes, pas d’ajout partiel en cas d’échec |
| Import son / pack / dossier | WaveMixerView, WaveMixerDeckPlayer | Sélecteurs Android audio multiple, ZIP et dossier avec autorisation persistante |
| Recherche dans l’audio | updateWaveformInteraction | Tap / glissement sur la forme d’onde du lecteur |
| Sélection de boucle | loopButton, updateWaveformInteraction | Bouton boucle puis sélection A–B sur la forme d’onde ; poignées déplaçables |
| Expansion / réduction du deck | isStudioMultitrackExpanded | Lecteur dépliable, transport conservé à l’écran |
| Retour tactile des commandes | PlaceTactileButtonStyle | Pression avec réduction et ressort, transitions de couleur et d’état |
| Réorganisation et erreurs | états du controller | Ordre / volume / catégorie dans les options, erreurs visibles |
| Pistes serveur verrouillées | WaveLockedServerTracksCard | Aucun faux raccordement : pas de pistes serveur injectées dans cet atelier local |
| Vote | Absent de l’atelier Host iOS audité | Section Android conservée, simulation locale explicitement indiquée |

Les ajouts Android propres au lecteur sont les boutons de saut d’une mesure,
les indicateurs stéréo et la séparation Pause / Stop. Les limites serveur ci-dessous
restent applicables : importer les interactions ne branche pas un mix au RTC.

## Limites explicites

L’atelier est local et non diffusé au public. Le vote est étiqueté simulation ;
les boutons Pour / Contre alimentent uniquement cette simulation. L’état
ouvert / fermé et les motifs restent locaux. Aucune notification n’est envoyée.
Le raccordement aux contributions distantes, au vote multiutilisateur et au mix
RTC reste à réaliser avec un contrat serveur commun ; l’audit décrit les différences
entre le contrat iOS v1 et le contrat normalisé web. Le studio d’enregistrement
spectateur et l’export de mix / stems ne sont pas portés dans cette étape host.

Le tempo pilote la grille de lancement, sans time-stretch ni transposition.
Les imports sont limités à 5 minutes par fichier, les packs à 32 fichiers et
256 Mo décompressés (20 pistes simultanées), et sont décodés avant lecture
dans le séquenceur. Le cache PCM utilise le stockage cache Android.

## Livraison

Compilation `:app:assembleDebug` réussie. Aucune campagne de tests ni inspection
visuelle automatique effectuée, conformément aux consignes du projet.
