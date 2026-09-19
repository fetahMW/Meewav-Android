# Analyse des fichiers importés

Référence lue sur `Meewav-iOS/main` : `Meewav/Core/Audio/MWAudioAnalysis.swift`
et `Meewav/Features/Rooms/Services/PlaceSuperpoweredTrackAnalyzer.mm`.

Android utilise Superpowered Analyzer, comme iOS. Le SDK officiel Android est
fourni sous forme de binaires distincts des binaires iOS ; les bibliothèques de ce dépôt proviennent du
dépôt public superpoweredSDK/Low-Latency-Android-iOS-Linux-Windows-tvOS-macOS-Interactive-Audio-Platform.
La révision exacte et les textes de licence accompagnent les binaires dans
`app/src/main/cpp/superpowered`. La configuration reprend la clé d'exemple
utilisée par iOS ; une clé enregistrée peut être fournie via
`SUPERPOWERED_LICENSE_KEY` dans l'environnement ou `meewav.local.properties`.

Un seul décodage MediaCodec alimente la waveform progressive et l'analyse
Superpowered en stéréo flottante (mono dupliqué, deux premiers canaux sinon).
Les paramètres sont identiques à iOS : 60–200 BPM, sans grille ni waveform SDK,
tonalité activée, résultat non publié sous 8 secondes ou pour le silence.
L'analyse est locale, sans accès au microphone ni serveur. Les résultats sont
des estimations musicales ; « Non détecté » remplace une absence de résultat.

Le calcul reste hors du thread UI et indépendant du lecteur MediaPlayer.
La waveform complète est publiée avant la finalisation BPM/clé. Changer de
fichier annule l'ancien travail et libère son moteur. Les informations figurent
près du titre du deck commun à toutes les rooms, sans régler l'autotune automatiquement.
