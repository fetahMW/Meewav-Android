# Retour vocal : comparaison iOS / Android

## Référence iOS vérifiée le 23 septembre 2026

Dans `Meewav-iOS/Meewav/Features/Rooms/Services/PlaceLocalVocalDawEngine.swift`,
`render` appelle `AudioUnitRender`, applique les effets puis écrit directement
dans la sortie du même callback RemoteIO. La session demande 48 kHz et un
buffer de 1,45 ms en mode measurement. C'est une demande, pas une mesure de
latence totale. `PlaceBytePlusVocalEffectsAudioProcessor.swift` traite séparément
la voix destinée au RTC. Le monitoring local n'attend pas le réseau.

## Écart Android constaté

Le trajet Java utilisait AudioRecord, des blocs de 10 ms, une file, puis AudioTrack.
Sur le Samsung USB-C, la capture livrait des rafales de 20 ms. Une file limitée à
un bloc de 10 ms perdait une moitié de certaines rafales : la sortie sous-alimentée
produisait le grésillement. Assembler les rafales a supprimé ces sous-alimentations,
mais la sortie accumulait encore environ 38 ms, en plus de la capture et du matériel.

## Nouveau trajet Android

`WaveNativeDuplex.cpp` utilise Oboe 1.11.0 et son FullDuplexStream :

1. Le callback de sortie lit l'entrée sans attente bloquante.
2. Il traite la voix avec Superpowered uniquement si les effets sont actifs.
3. Il écrit directement le retour casque dans cette même sortie native.
4. Une copie part dans une file bornée pour le mix programme / BytePlus.

Le RTC, le lecteur de composition et les allocations Java ne pilotent plus le
retour casque. Les blocs du callback sont demandés à 96 frames / 48 kHz (2 ms).
Les paramètres réellement négociés apparaissent dans les logs `WaveLatency`.
Le mode exclusif est demandé en entrée et sortie, avec le repli partagé du SDK
Oboe si le périphérique le refuse. Le mode réellement obtenu est journalisé.
Le monitoring est coupé sans casque filaire/USB ; le micro
peut continuer à alimenter le programme public. Les changements de périphérique
rouvrent les flux sur le thread de contrôle. Le trajet Java reste un repli si
l'ouverture native échoue au démarrage, avec un avertissement `WaveRTC`.

## Vérification

Compilation quatre ABI et 16 tests WavePerformanceBus / WaveVocalPacketQueue /
RoomsAudioPolicy réussis. Les tests de cadence vérifient que les paquets capturés
par rafales ne sont pas remplacés par des trous dans l'envoi RTC.

Le mix vocal public est cadencé par le sender RTC, indépendamment des rafales
demandées par l'AudioTrack musical. Sa file garde l'ordre et amorce une réserve
d'un paquet, limitée à quatre paquets en cas de blocage. Cette réserve
n'intervient jamais dans le retour casque. Les compteurs `RTC voice` donnent
les pertes et manques avant BytePlus, ainsi que son code de retour.

Le transport utilise les mêmes choix que `PlaceBytePlusAudioConfiguration`
côté iOS : room LowLatency, scénario GameStreaming, profil HD et ducking
désactivé. L'audio externe et la caméra gardent des publications distinctes.

Sur le Samsung, la première version native a négocié des bursts de 96 frames,
le mode LowLatency en entrée/sortie et une sortie de l'ordre de 9–13 ms.
La capture brute est désormais demandée si Android la déclare disponible,
sinon VoiceRecognition, pour éviter le preset VoicePerformance sur le signal sec.
Il reste à confirmer le résultat physique sur le casque : une latence de sortie
rapportée par Oboe n'est pas une mesure aller-retour micro → oreille.

## Mesure USB-C du 23 septembre 2026

Test isolé AAudio, sans BytePlus et sans effet, sur les périphériques USB-C
420/416 du Samsung, 48 kHz, callbacks 96 frames, sortie 192 frames.
`tools/native-audio-latency-probe.cpp` ne stocke ni ne transmet de voix.

| Route réellement négociée | Âge entrée | Sortie | Somme estimée |
| --- | --- | --- | --- |
| Partagée | 3,8–6,8 ms | 9,7–11,3 ms | 14,9–17,1 ms |
| Exclusive | 1,7–3,1 ms | 4,0–5,3 ms | 6,9–7,2 ms |

Six relevés par route. Zéro underrun de sortie ; une lecture courte en partagé,
aucune en exclusif. Ces valeurs proviennent des timestamps du pilote,
pas d'une boucle acoustique physique. La coexistence avec BytePlus, le lecteur
musical et les changements de périphérique doit être vérifiée en room réelle.
L'application a été réinstallée et laissée sur l'authentification ; cette
vérification attend la reconnexion de l'utilisateur.

Mise à jour après essai utilisateur en room : les 50 derniers relevés secs
(`effectFlags=1`) donnent 8,55 ms en moyenne, min 6,02 / max 10,12 ms.
Entrée et sortie restent exclusives (`inputSharing=0 outputSharing=0`) avec
BytePlus actif. Il s'agit toujours d'une estimation par horodatages du pilote.

Le monitoring BytePlus et son processeur d'ear-monitor sont explicitement
désactivés comme sur iOS. Le code exclut l'abonnement à sa propre publication.
Aucun second retour logiciel n'a été démontré ; le mélange de la voix naturelle
et d'un monitoring retardé reste une explication possible de l'effet de boîte.

## Correction Pro et souffle — révision du 23 septembre

Mise à jour après écoute : Signalsmith Pro a été supprimé à la demande de
l'utilisateur (48 ms trop perceptibles). Le réducteur de souffle est validé
à l'écoute et conservé sans modification. La description Signalsmith
ci-dessous documente l'essai retiré ; voir AUTOTUNE_LOW_LATENCY_RESEARCH.md.

L'ancien moteur MeeWav à double délai et son test de parité web sont retirés.
Pro utilise maintenant Signalsmith Stretch 1.3.2 (MIT), intégré avec détection
YIN et ciblage musical. Ce n'est pas un plugin Android prêt à l'emploi.
Superpowered reste le moteur Simple, comme iOS. Les deux sont exclusifs.
Signalsmith ajoute 2304 samples / 48 ms uniquement lorsqu'il est activé :
ce compromis figure dans les réglages. Il n'est pas présenté comme équivalent
au retour sec à faible latence. Désactivé par défaut, aucun mélange dry/wet
non aligné dans cet effet. Le traitement Pro natif n'est pas proposé au viewer
WebAudio : celui-ci garde ses commandes Simple existantes, sans faux moteur.

RNNoise a été évalué, puis écarté du trajet casque : son framing + overlap
ajoutaient 20 ms, contrairement à la priorité donnée par l'utilisateur.
Le DSP iOS inspecté (PlaceSuperpoweredVocalDSP.mm) n'emploie pas RNNoise ; le
noiseGateMarginDb de PlaceBytePlusSession.swift concerne le vumètre.

WaveNoiseSuppressor remplace l'expandeur fixe -50 dBFS peu efficace. Quatre
bandes IIR complémentaires, gains descendants limités à -18 dB, enveloppe
RMS causale de 3 ms, ouverture 0,25 ms et fermeture 50 ms. Zéro lookahead,
zéro mise en file du son : l'enveloppe n'est pas un retard du signal. Les
filtres IIR peuvent changer la phase lorsque les gains diffèrent ; ne pas
confondre absence de buffering avec suppression parfaite sans coloration.

« Mesurer le souffle · 1 s » calibre les puissances des bandes pendant une
seconde de silence volontaire. Aucune voix enregistrée ni transmise pour
l'analyse. Le traitement est bypassé durant cette mesure. Il réduit le bruit
stationnaire ; il ne sépare pas parfaitement la voix et le bruit superposés.
Le bouton Souffle commute le traitement avant autotune/réverb pour le casque
ET la publication ; musique non traitée. Désactivé par défaut.

Test NDK exécuté sur Samsung : tools/test-vocal-fx.cpp. Bruit blanc synthétique
calibré : -17,35 dB ; voix sinusoïdale 220 Hz + bruit : variation -0,03 dB.
Tests bypass exact, réponse dès le premier sample, parité mono/stéréo,
invariance blocs 96/480, valeurs finies, correction 228 -> 233,5 Hz
(cible 233,08), reset sans résidu. Zéro allocation C++ pendant le process Pro.
Les pics de durée murale observés dans le processus ADB peuvent inclure les
préemptions du système ; ce n'est pas une mesure de round-trip acoustique.
Dernière mesure avec CLOCK_THREAD_CPUTIME_ID : réducteur, maximum CPU 8,2 µs
par bloc de 96 samples (durée murale 61,1 µs). Pro : maximum mural 984,8 µs.
La qualité avec une vraie voix et des écouteurs reste à valider à l'écoute.

## Coupure à l'import audio

Le 23 septembre à 20:31:30, `OPEN_DOCUMENT` ouvre le sélecteur ; le callback
`ON_STOP` du mixeur arrête ensuite explicitement la session RTC et les flux
AAudio. La fermeture intervient avant le décodage du fichier.

Le deck distingue maintenant cette activité externe temporaire d'une sortie
de room, pour ses imports audio, dossier et ZIP. Sélection, annulation et échec
de lancement libèrent cet état. La sortie normale continue de stopper le live.
Un service de premier plan microphone/caméra/mediaPlayback, démarré avant la
capture, garde les permissions d'usage actives durant le sélecteur. Notification
visible avec action d'arrêt ; pas de redémarrage automatique du service.
Référence : https://developer.android.com/develop/background-work/services/fgs/service-types

Trois tests `RoomDocumentPickerStateTest` passent avec les 16 tests audio
existants. Compilation APK réussie. Le parcours complet dans une room après
installation reste à valider sur le compte connecté.
# Live cutoff investigation — 23 September 2026, evening

User confirmation after installing the lifecycle/camera-timeout correction: « tout marche là ». Commit and push requested. The new free Pro effects remain withdrawn from the active path; this confirmation concerns the installed live/audio correction.

User reports headphone audio then complete live disconnection, with the UI text `Audio live déconnecté`. Capture diagnostics from 22:33:06 to 22:34:06 show a running duplex and RTC sender, no underruns or RTC push failure. This does not establish why the user stopped hearing audio: low input peaks can also mean silence.

Confirmed lifecycle defect: `WaveMixerScreen` called `liveAudio.stop()` on every `ON_STOP`, although a microphone/camera foreground service was already running. Real live sessions now retain their capture and program playback when the activity backgrounds; demo sessions still suspend. Explicit close/disposal and the notification stop action remain effective.

The camera-publication 15-second timeout no longer tears down an already published microphone. Join/audio timeouts now report an explicit failure instead of being swallowed as coroutine cancellation. Stop requests log their origin; session failures log their reason. Full live reproduction and listening confirmation remain necessary.
