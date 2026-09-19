# Corrections Wave après comparaison au guide — 19 septembre 2026

Cette passe fait suite à `AUDIT-WAVE-GUIDE-ANDROID-2026-09-19.md`. L'audit décrit le commit antérieur `26075c6` ; il ne décrit donc plus l'ensemble du code courant.

## Contrat produit à conserver

- Le lecteur Wave (Propositions / Vote / Composition) et le lecteur multipiste du Mixeur sont deux lecteurs distincts, avec deux moteurs et deux volumes indépendants.
- Le fader audio sous les effets du Mixeur ne commande jamais le lecteur Wave.
- Le lecteur Wave dispose d'un bouton haut-parleur animé, d'un volet de volume et d'un cap perle strié reprenant le fader du Mixeur.
- Base / Boucle / Mix reprend maintenant `hardwareSurface(6.dp, raised = true, reflection = .085f)`, comme les boutons micro/haut-parleur sous les faders. Cette demande remplace la précédente consigne de matériau Simple / Pro.
- Ordre Android maintenu : navbar de room → Propositions / Vote / Composition → lecteur. Cartes noires HiFi, chips de catégorie colorés.

## Modifications du code

### Audio et grille

- Sortie Wave indépendante ; suppression du lien `audioGain/audioMuted → composition.audio.masterGain`.
- Modes d'écoute : couches collectives dans Mix, audition privée conservée en Base, boucle de la référence conservée quand son gain est coupé en mode Boucle.
- Annuler un candidat en attente préserve le candidat audible ; échec de préparation restaure son identité.
- Gains d'audition et de couche séparés, valeurs initiales 0,75 et 0,82.
- Régions fixes et déplacements d'épingles aimantés par blocs de N mesures, aperçu aimanté et commit au relâchement.
- Mode libre continu, début de nouvelle région pris depuis la position courante, retour au début de région active.
- Scrub avec pause/reprise et restauration à l'annulation ; seek de préécoute appliqué à sa propre source.
- BPM décimal 40–260 ; waveform dessinée sur la grille musicale, labels A/B, poignée centrale et bande de sélection des épingles.

### Propositions et Vote

- Les 19 enregistrements de `WaveHostLegacyDemoPack.swift` sont exposés depuis les assets Android existants, notamment les trois acapellas. Ajout par ID sans écrasement des imports ni des décisions enregistrées.
- Présentation alternée par catégorie.
- Qualification droite vers Vote ; gauche vers Hors consignes / Choix artistique / Autre après animation de sortie. Ce geste est distinct du rail d'actions des pistes du Mixeur.
- Badges et téléchargement des fichiers de propositions.
- Filtres et règles en panneau superposé à la liste, brouillon annulable, longueur demandée, gamme et direction artistique.
- Import Vote crée une proposition de base, préécoutée séparément de la base active.
- Le parcours de démonstration accepte dans une transaction sans faux décompte. Le contrôleur conserve une branche de vote chronométré, un suivi séparé, un bulletin par identité et le seuil de 60 %.
- Historique des tours et identités de couches enregistrés ; les ajouts directs sans tour favorable retournent vers Vote. Les données initiales de démonstration possèdent leurs tours fictifs explicites.
- Messages de démonstration présentés en plein écran dans le contexte de la room.
- Volumes à pas de 1 %, temporisation 3 secondes suspendue pendant l'interaction ; boutons Message et Vote partagent l'espace.

### Composition, bases et DAW

- Suppression du Play individuel et du swipe de qualification sur les cartes de Composition.
- Épingles : recherche de place par blocs avec retour au début, sélection d'un doublon exact, chevauchement manuel autorisé, sélection suivante/précédente à la suppression, mémoire par couche et centrage du rail.
- Bibliothèque à carrousel ; focus distinct de l'activation. Elle remplace la waveform et le transport.
- Changement de base : pause, retour privé, restauration des couches associées et exclusion des sources intégrées.
- Export WAV de la base focalisée avec ouverture du partage ; rendu de l'arrangement actif ; archive WAV multipiste et crédits JSON, progression et annulation.
- Historique des archives DAW ; réimport avec revue Conservée / Retravaillée / Retirée, activation ou proposition au vote ; décodage avant validation, erreur conservant la revue ouverte.

### Lecteur du Mixeur

- Ancien lecteur à URI unique et duplication compact/overlay retirés du montage.
- Un deck dont la hauteur varie avec les faders, un moteur distinct de Wave et des pistes identifiées individuellement.
- Import, remplacement, suppression, mute et solo ciblent la piste choisie ; imports dossier et ZIP câblés séparément du sélecteur audio simple.
- Ordre des commandes rétabli ; Précédent/Suivant désactivés tant qu'aucune navigation de playlist n'est définie.
- Métadonnées musicales et chrono occupent des emplacements de largeur fixe.

## Portée et limites de validation

La compilation `:app:assembleDebug` a réussi. Aucun test automatisé, écoute de contrôle, capture ou QA visuelle n'a été exécuté, conformément aux consignes du projet.

Ce document ne certifie pas une reproduction visuelle ou gestuelle au pixel près du guide SwiftUI. Les ressorts Compose et la géométrie mobile restent des adaptations. Le contrôle tactile sur Samsung reste à effectuer par l'utilisateur, notamment les gestes concurrents, les longues prises, le clavier, les changements de référence et les exports volumineux.

Les votes et messages de cette route restent des démonstrations locales. La diffusion RTC publique n'a pas été raccordée par cette passe ; le guide décrit lui-même une route de démonstration, pas le contrat serveur de production.
