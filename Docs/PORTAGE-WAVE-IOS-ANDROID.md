# Atelier Wave Android — 19 septembre 2026

Branche : `codex/wave-tools-ios`.

## Source et adaptation

Les règles viennent de `WaveHostLiveSetController.swift`, `WaveLiveAudioEngine.swift`
et `WaveHostLiveSetPanel.swift` dans Meewav-iOS : horloge commune, lancement à la
mesure suivante, boucles / prises longues / one-shots, répétitions, mute, solo
exclusif et écoute privée. Le moteur AVAudioEngine est adapté en Kotlin avec une
sortie AudioTrack stéréo 48 kHz qui mélange les pistes sur une horloge commune.
Il ne s’agit pas d’une intégration binaire du moteur Apple.

L’onglet Wave remplace le placeholder par Composition, Propositions et Vote.
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

## Limites explicites

L’atelier est local et non diffusé au public. Le vote est étiqueté simulation ;
les boutons Pour / Contre alimentent uniquement cette simulation. L’état
ouvert / fermé et les motifs restent locaux. Aucune notification n’est envoyée.
Le raccordement aux contributions distantes, au vote multiutilisateur et au mix
RTC reste à réaliser avec un contrat serveur commun ; l’audit décrit les différences
entre le contrat iOS v1 et le contrat normalisé web. Le studio d’enregistrement
spectateur et l’export de mix / stems ne sont pas portés dans cette étape host.

Le tempo pilote la grille de lancement, sans time-stretch ni transposition.
Les imports sont limités à 5 minutes par fichier et sont décodés avant lecture
dans le séquenceur. Le cache PCM utilise le stockage cache Android.

## Livraison

Compilation `:app:assembleDebug` réussie. Aucune campagne de tests ni inspection
visuelle automatique effectuée, conformément aux consignes du projet.
