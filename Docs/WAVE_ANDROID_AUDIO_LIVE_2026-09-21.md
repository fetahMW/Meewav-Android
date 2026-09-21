# Socle audio Wave Android — 21 septembre 2026

## Périmètre réalisé

Le moteur `WaveCompositionAudio` reste en place. Aucun remplacement par un deuxième moteur DSP et aucune migration serveur. Le contrat reste compatible avec iOS `sipiyou39/Meewav`, `wave/host-hardware-c97a`, commit `9907deed2998418574f80e10533aa5060fb802a7`.

Chaîne externe : `AudioRecord` mono PCM16 48 kHz → stéréo Float32 → correction vocale Superpowered → réverbération Superpowered → voix avec gain/mute → programme du moteur existant + production importée → limiteur stéréo lié → PCM16 little endian, 480 frames/10 ms → `RTCEngine.pushExternalAudioFrame` → publication RTC.

La production n'entre jamais dans la correction vocale. Les deux lecteurs existants restent indépendants : la sortie programme du deck rejoint le bus final via une petite file bornée ; ses contrôles privé/public et son volume restent indépendants du lecteur de Composition. Le cue et les candidats de préécoute n'entrent pas dans le programme. Le monitoring vocal est séparé du mute public. Les pads restent locaux dans cette phase.

## Session réelle et démo

- SDK natif ajouté : `com.byteplus:BytePlusRTC:3.60.107.200`, dépôt Maven officiel BytePlus. API vérifiées dans le `classes.jar` réellement distribué avec l'AAR, puis compilation avec cette dépendance. Jetifier est nécessaire pour ses dépendances Android Support.
- `RoomsAudioRepository` utilise la session Supabase native existante, `rooms_v2`, les participations actives et invitations actives. Le canal vient de `livekit_room_name` ; ce nom historique ne signifie pas que LiveKit transporte l'audio.
- Le jeton vient exclusivement de `byteplus-token` avec `channelName`, `identity`, `canPublish`. Aucune utilisation de `messaging-call-token`, aucun secret serveur embarqué.
- Une nouvelle participation est créée au rôle viewer, ou host si `rooms_v2.host_id` est l'utilisateur authentifié. Le client ne s'auto-promeut pas guest. Les politiques RLS restent applicables.
- Entrée réelle : route native existante avec `source=live` et UUID de room. Le mixeur affiche le choix explicite **Voix traitée + programme / Micro brut · FX non diffusés / Écoute seule**, puis **Connecter**. La permission micro n'est demandée que pour publier.
- Le viewer Wave réel possède **Écouter le live**, raccordé à la même session native en réception seule. Il ne force plus `demoRole=viewer` pour une vraie Wave.
- Sans ID live, les fixtures et le parcours investisseur sont conservés ; aucun jeton ou microphone live n'est ouvert. L'atelier de Composition réel utilise un espace de sauvegarde distinct et ne charge pas le pack démo.

## Cycle de vie et limites de réception

Le join et la publication attendent leurs callbacks. Audio et vidéo ne sont pas publiés automatiquement. L'audio distant est abonné explicitement, la vidéo n'est pas raccordée par cette nouvelle session audio.

Politique conservatrice mise en place en attendant la fin de la consigne tronquée : host autoritaire audible ; guest ready/backstage/onstage audible par le host ; guest audible par les autres uniquement onstage ; rôle ou état inconnu refusé. Identités et droits sont rechargés toutes les deux secondes. Un échec de vérification coupe la session au lieu de conserver une autorisation périmée. Renouvellement du token avant expiration et sur callbacks SDK.

Un seul propriétaire Rooms du SDK. À l'arrêt : désactivation du bus, dépublication, arrêt et attente du sender et du micro/DSP, leave/destroy de la room, destruction de l'engine. Passage en arrière-plan : arrêt explicite, reconnexion manuelle. Pas de service audio en arrière-plan dans cette phase.

File publique bornée à huit paquets ; les anciens sont abandonnés en cas de retard. Le sender cadence les paquets sans rattrapage en rafale. Erreurs répétées ou absence de production arrêtent la session avec message. Aucun fallback automatique vers le micro brut.

## DSP et plugins

Les archives Superpowered Android existantes exportent réellement `AutomaticVocalPitchCorrection` et `Reverb`. Les headers viennent du SDK présent dans le dépôt iOS ; `Superpowered.h` a le même SHA-256 dans les deux copies. Les quatre ABI lient les nouvelles fonctions JNI.

Simple AutoTune reprend les clés/gammes de l'UI : majeur, mineur via relatif majeur, chromatique ; réglage vocal intense comme la référence iOS (wet 0,98). Le toggle et le dosage de réverbération traitent les buffers vocaux réels.

**La configuration actuelle compile avec la clé d'exemple Superpowered. Une licence valide doit être configurée via `SUPERPOWERED_LICENSE_KEY` pour une livraison pérenne.** La réverbération est l'algorithme Superpowered disponible sur Android, pas une imitation annoncée comme identique à l'Audio Unit iOS. Aucun AUv3, Antares, Voloco ni téléchargement de plugin tiers. Les inserts Pro ne sont pas implémentés.

## Vérifications

- Bundle Rooms reconstruit.
- `:app:assembleDebug` réussi ; C++/JNI lié pour arm64-v8a, armeabi-v7a, x86 et x86_64.
- Dix tests ciblés passent : format/limiteur stéréo, file bornée, valeurs non finies, conversion de gamme, exclusion du cue, production importée après DSP, conditions d'abonnement/publication et distinction entre identifiant de flux RTC et identité utilisateur.
- Test natif exécuté sans UI sur le Samsung : `WaveVocalDspSmoke.cpp` lié aux mêmes archives Superpowered, 200 blocs stéréo de 480 frames traversent la correction vocale et la reverb. Résultat PASS : sortie finie, non silencieuse, modifiée (`energy=579.212`, `delta=14171.324`). Ce test synthétique ne remplace pas une écoute micro/distante et ne valide pas la licence de production.
- La suite globale exécutée auparavant a 7 échecs hors périmètre audio : 6 tests Loge avec `JSONObject` non mocké et 1 test Cage avec attente de duo différente de l'état obtenu. Ils ne sont pas masqués ni corrigés dans ce lot.
- Aucun contrôle visuel, aucun appel à d'autres utilisateurs, aucune publication live réelle effectuée. L'écoute distante, la latence, les routes casque/Bluetooth et la reconnexion réseau doivent encore être validées entre appareils. Une compilation réussie ne prouve pas l'audibilité distante.

Pour la recette : ouvrir une vraie Wave comme host ; connecter **Voix traitée + programme** ; connecter un viewer réel sur la même room via **Écouter le live** ; comparer la voix avec/sans AutoTune et reverb ; vérifier qu'une préécoute privée reste privée, puis passer la production importée en Public ; tester mute micro et arrêt/reconnexion. Utiliser un casque pour distinguer le monitoring numérique d'un retour acoustique capté par le micro.

## Références SDK

- [Intégration native officielle](https://docs.byteplus.com/en/docs/byteplus-rtc/docs-75707)
- [Capture audio personnalisée](https://docs.byteplus.com/en/docs/byteplus-rtc/docs-96197)
- [Abonnements explicites à partir de 3.60](https://docs.byteplus.com/fr/docs/byteplus-rtc/docs-129241)

Le document de mission fourni s'arrête exactement à « Pour cette phase, implémente seulement la politi ». Sa fin n'a pas été reçue au moment de cette implémentation.
