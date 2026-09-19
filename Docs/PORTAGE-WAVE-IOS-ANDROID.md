# Atelier Wave Android — référence corrigée le 19 septembre 2026

Branche Android : `codex/wave-tools-ios`.

## Source de référence

La première adaptation utilisait par erreur Meewav-iOS `main` (`aea7251`).
Cette source ne contenait pas le lecteur permanent demandé. La source correcte
est `origin/wave/host-hardware-c97a`, commit `20ef578` :

- `WaveHostPersistentPlayer.swift` : lecteur, transport, rails Import / Boucle,
  sélecteur Base / Boucle / Mix, bibliothèque dans l’emplacement de la piste.
- `WaveHostWorkflowPanel.swift` : commandes extensibles des cartes de vote
  et de composition ; durées 30 / 60 / 90 secondes.
- `WaveHostWorkflowController.swift`, `WaveHostWorkflowRules.swift` : écoute,
  changements de candidat à la mesure, reprise, A–B libre ou mesures fixes.
- `WaveHostReferenceLoopRange.swift` : déplacement des régions et validation
  audio au relâchement, sans recherche répétée pendant le geste.

Les conclusions précédentes « Vote absent de l’iOS » et « lecteur à inventer »
sont donc obsolètes. Le dépôt iOS n’a pas été modifié.

## Adaptation réalisée

Disposition : barre principale de room → Propositions / Vote / Composition →
lecteur fixe → liste. Le sous-menu ne passe plus sous le lecteur.

Le lecteur reprend les emplacements du workflow iOS : disclosure à gauche,
Base / Boucle / Mix au centre, routage à droite ; forme d’onde au-dessus du
transport ; Play fixe à gauche, position musicale / reprise / import au centre,
boucle fixe à droite. En Composition, le titre de la base ouvre sa bibliothèque.
La bibliothèque remplace la zone de la piste sans agrandir le lecteur.

Les rails exclusifs Import (Base / Vote) et Boucle (Sans / A–B / 4 / 8 / 16 /
32 mesures) se déploient de droite à gauche avec la courbe iOS
`cubic-bezier(.22,1,.36,1)` sur 320 ms. Les déclencheurs et Play restent ancrés.
Le repli utilise un ressort et conserve le transport audio. L’appui des boutons
reprend la réduction à 96 % et le retour élastique.

La matière Android reste noire HiFi ; violet CTA `#5137A1`, violet doux pour les
accents. Les cartes conservent la silhouette validée de Propositions avec leurs
portraits et leurs chips de catégorie colorés ; aucun fond de carte par catégorie.

## Commandes reliées au moteur Android

- Bases importées distinctes des propositions et du vote ; bibliothèque et
  base sélectionnée sauvegardées localement avec les permissions SAF.
- Lecture / pause / reprise ; fin de base et retour au début à la prochaine lecture.
- Base, Boucle et Mix changent les gains sans relancer les sources ni la position.
- Candidat remplacé au début de la mesure suivante, ancien candidat conservé
  jusqu’au départ ; état d’attente distinct de l’état réellement en lecture.
- Sans base, la préécoute privée des propositions reste possible.
- Retour au point de reprise ; appui long pour mémoriser la position.
- A–B libre, boucle de longueur fixe, déplacement sur la grille et validation
  au relâchement ; les longueurs non disponibles sont désactivées.
- Vote : durée et volume se déploient dans la carte sélectionnée ; fader
  refermé après inactivité ; simulation locale et ajout/remplacement conservés.
- Composition : sélection d’une carte, rail de placements, mute, solo, volume,
  retrait ; épingles propres à chaque base, placement sans déplacer la lecture,
  longueur réglable et déplacement depuis la waveform, refus des chevauchements.
- Les épingles limitent effectivement les intervalles audibles de la piste.
- Packs ZIP/dossiers, prise globale préparée avant adoption, voix simultanées,
  fader général du mixeur, arrêt à la perte de focus : fonctions conservées.

## Limites restant distinctes du portage visuel

L’atelier et ses votes restent locaux. Le sélecteur de sortie reproduit l’état
Privé/Public et met en pause lors du changement ; il ne prétend pas publier :
le raccordement RTC n’est pas présent et l’interface le signale. Les messages
privés du vote sont des messages de démonstration locale. Aucun message serveur
ni notification réelle n’est émis par ces nouvelles commandes.

Le moteur Kotlin/AudioTrack mélange des PCM stéréo 48 kHz ; il n’intègre pas
AVAudioEngine. Le BPM pilote la grille sans time-stretch ni transposition.
L’export audio/stems, les versions archivées du mix, le studio spectateur et les
contrats serveur du workflow iOS ne sont pas intégralement portés. Ne pas annoncer
une parité complète iOS / Android ou une diffusion publique fonctionnelle.

Limites existantes : 5 minutes par audio, 32 fichiers / 256 Mo décompressés par
pack, 20 pistes simultanées. Décodage hors UI et cache PCM sur disque.

## Livraison

Compilation Android nécessaire à la livraison. Aucune campagne de tests,
inspection visuelle ni QA automatique : l’utilisateur effectue ces vérifications.
