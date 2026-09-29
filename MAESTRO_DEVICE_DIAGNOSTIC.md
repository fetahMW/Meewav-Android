# Diagnostic Maestro sur les deux émulateurs QA — 24 septembre 2026

## Périmètre et résultat

Ce diagnostic porte uniquement sur l'outillage. Aucun scénario fonctionnel Globe, Messagerie ou Rooms n'a été lancé. Aucun code Meewav, compte QA, donnée Supabase, règle RLS, migration ou Edge Function n'a été modifié. Le S22 physique n'a reçu aucune commande. **État à connaître avant la reprise :** le 5570 affiche désormais le formulaire de connexion après la mise en arrière-plan et le redémarrage de son processus ; aucun identifiant n'a été saisi pendant ce diagnostic. Le 5572 reste sur le Globe. Les preuves détaillées sont sous `app/build/maestro-device-diagnostic/` (ignoré par Git).

La découverte automatique de Maestro 2.10.0 échoue parce que sa bibliothèque Dadb tente le transport `emulator-5562` hors ligne et lève `java.io.IOException: Command failed (host:transport:emulator-5562): device offline`. Maestro masque cette exception dans sa liste Android, puis `--device emulator-5570` et `--device emulator-5572` répondent « Device with id … is not connected ». La connexion directe au port `adbd` de chacun des deux émulateurs contourne cette découverte et permet à Maestro de lire leur hiérarchie. Le port `--port` utilisé ici n'est ni le port du serveur ADB (5037), ni le port console pair d'un émulateur.

## Environnement reproductible

Le relevé provient d'un **seul processus PowerShell Windows natif**. Les chemins et versions ont été vérifiés dans ce même processus :

| Composant | Valeur observée |
| --- | --- |
| Maestro | `C:\Users\linkw\.maestro\bin\maestro.bat` — 2.10.0 |
| Java invoqué par le lanceur | `C:\Program Files\Android\Android Studio\jbr\bin\java.exe` — OpenJDK 21.0.8 |
| ADB client et serveur PID 13520 | `C:\Users\linkw\AppData\Local\Android\Sdk\platform-tools\adb.exe` — 1.0.41 / 36.0.2 |
| Serveur ADB | `127.0.0.1:5037` ; aucun serveur secondaire actif |
| Émulateurs QA | `emulator-5570` et `emulator-5572` : `get-state=device`, `sys.boot_completed=1` |
| Variables pertinentes | `JAVA_HOME` = Android Studio JBR ; `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `ADB_SERVER_PORT`, `ANDROID_ADB_SERVER_PORT`, `JAVA_OPTS`, `MAESTRO_OPTS`, `JDK_JAVA_OPTIONS`, `JAVA_TOOL_OPTIONS`, `_JAVA_OPTIONS` absentes |

Le [relevé complet et expurgé](app/build/maestro-device-diagnostic/diagnostic-summary.json) est conservé localement. Ni Git Bash ni WSL n'a été utilisé pour cette reproduction. Une autre installation Java 21.0.8 existe sous `C:\Program Files\Android\openjdk\jdk-21.0.8`; aucun changement de Java n'a été nécessaire pour la voie directe qui fonctionne.

Les anciens runs Rooms du 23 septembre ont exécuté des flows Maestro 2.10.0 sous Windows et Java 21 via un serial Wi-Fi, notamment `01b-demo-mode-boundary` (17 commandes terminées) et `01c-demo-exit` (10 commandes terminées). Leur runner `.maestro/rooms/edge/run-edge.ps1` préparait l'autre JDK et `ADB_SERVER_PORT=5038`. Les anciens logs ne prouvent pas le chemin Java réellement lancé. Le run `05-feature-stack-accumulation` a fini le flow Maestro, mais son contrôle post-run a relevé 4 RoomsActivity/WebViews au lieu de 2 : il ne constitue pas un PASS fonctionnel.

## Reproduction et exception masquée

Les deux commandes ordinaires ont échoué avant toute lecture de l'UI :

```powershell
& 'C:\Users\linkw\.maestro\bin\maestro.bat' --verbose --device emulator-5570 hierarchy
& 'C:\Users\linkw\.maestro\bin\maestro.bat' --verbose --device emulator-5572 hierarchy
```

Code de sortie 1 dans les deux cas, durées respectives 2,907 s et 2,926 s. Les sorties et journaux **complets** sont [stdout 5570](app/build/maestro-device-diagnostic/emulator-5570.stdout.txt), [stderr 5570](app/build/maestro-device-diagnostic/emulator-5570.stderr.txt), [Maestro 5570](app/build/maestro-device-diagnostic/emulator-5570.maestro.log), et les [équivalents 5572](app/build/maestro-device-diagnostic/emulator-5572.maestro.log) sous le même dossier. `--verbose` n'affiche pas l'exception interne.

Un [probe Java isolé](app/build/maestro-device-diagnostic/DiscoveryProbe.java) a été compilé avec les JARs **installés**, sans remplacer Maestro. Il appelle successivement `Dadb.list("127.0.0.1")` et `AndroidDeviceConnection.Companion.list("127.0.0.1", 7001)`, et capture leurs exceptions. Les deux échouent sur le même transport `emulator-5562 offline`; la [trace complète](app/build/maestro-device-diagnostic/DiscoveryProbe.stderr.txt) est conservée. `Dadb.list` passe par `AdbServer.listDadbs`, puis `AdbServer.createDadb`, où l'ouverture du transport échoue. La méthode `DeviceService.listAndroidDevices` enveloppe sa découverte dans `runCatching(...).getOrNull() ?: emptyList()` : cela explique pourquoi la commande ordinaire ne montre qu'une liste vide.

Le transport 5562 n'est associé à aucun des processus `emulator.exe` actifs : ceux-ci utilisent `-port 5570` et `-port 5572`. Le socket local `127.0.0.1:5563` est détenu par `C:\Program Files\Common Files\Native Instruments\NTK\NTKDaemon.exe` (`NTKDaemonService`) et le serveur ADB y est connecté. Cette coïncidence de port explique vraisemblablement la réapparition du transport fantôme ; **aucun arrêt du service n'a été tenté**, donc l'effet d'un arrêt n'est pas démontré. Relevés : [transports](app/build/maestro-device-diagnostic/transport-5562-inspection.json), [propriétaire du port](app/build/maestro-device-diagnostic/transport-5562-owner.json).

Le JAR distribué `maestro-cli-2.10.0.jar` a été inspecté avec le `javap.exe` du JBR : `--host` et `--port` sont des options cachées présentes dans le binaire. Le bytecode de `MaestroSessionManager` transmet `--port` à `AndroidDeviceConnection.open(host, port, ...)`, sans passer par la liste qui échoue. Cela concorde avec les [sources de la version 2.10.0](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.10.0/maestro-client/src/main/java/maestro/android/AndroidDeviceConnection.kt) et [DeviceService](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.10.0/maestro-client/src/main/java/maestro/device/DeviceService.kt). La commande `list-devices` regroupe par modèle/OS et n'est pas un inventaire de serials ; son affichage n'est pas notre critère de reprise ([source](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.10.0/maestro-cli/src/main/java/maestro/cli/command/ListDevicesCommand.kt)).

## Voie de fonctionnement sans perturber ADB

Les ports `adbd` locaux des émulateurs sont vérifiés : console 5570 → `adbd` 5571 ; console 5572 → `adbd` 5573. Les commandes ci-dessous ont chacune lu la hiérarchie réelle et se sont terminées avec le code 0 :

```powershell
& 'C:\Users\linkw\.maestro\bin\maestro.bat' --verbose --host 127.0.0.1 --port 5571 hierarchy
& 'C:\Users\linkw\.maestro\bin\maestro.bat' --verbose --host 127.0.0.1 --port 5573 hierarchy
```

La sélection directe est une **voie de contournement** de la découverte défaillante, pas une correction du transport 5562. Aucun binaire Maestro, service Windows, serveur ADB, profil réseau, émulateur ni configuration permanente n'a été changé. Pour revenir à l'état antérieur, il suffit de cesser d'utiliser `--host/--port` ; aucun rollback système n'est requis.

Les deux premiers micro-flows non destructifs (`assertVisible: "Ma scène"` et capture) ont passé avec ces ports. Leurs captures initiales étaient identiques octet pour octet ; elles ne suffisaient donc pas à prouver la séparation. Les artefacts initiaux sont dans `hostport-results.json` et `microflow-results.json`.

Le même flow peut être rejoué tant que les comptes QA sont déjà sur « Ma scène » :

```powershell
& 'C:\Users\linkw\.maestro\bin\maestro.bat' --verbose --host 127.0.0.1 --port 5571 test --test-output-dir 'C:\Users\linkw\Desktop\Meewav-Android\app\build\maestro-device-diagnostic\emulator-5570-output' 'C:\Users\linkw\Desktop\Meewav-Android\app\build\maestro-device-diagnostic\microflow-globe-assert.yaml'
& 'C:\Users\linkw\.maestro\bin\maestro.bat' --verbose --host 127.0.0.1 --port 5573 test --test-output-dir 'C:\Users\linkw\Desktop\Meewav-Android\app\build\maestro-device-diagnostic\emulator-5572-output' 'C:\Users\linkw\Desktop\Meewav-Android\app\build\maestro-device-diagnostic\microflow-globe-assert.yaml'
```

**État actuel :** la première ligne échouerait aujourd'hui sur son assertion « Ma scène », puisque 5570 est au formulaire de connexion. Il faut sa reconnexion QA préexistante avant de rejouer cette assertion ; la commande `hierarchy` directe fonctionne néanmoins sur cet écran.

## Preuve de ciblage indépendant et limite de restauration

Un flow Maestro ciblant le **port 5571 uniquement** a exécuté `pressKey: home`. Le 5570 est passé sur `NexusLauncherActivity` ; pendant ce temps le 5572 est resté sur `MainActivity`, et Maestro ciblé sur **5573** y a encore lu et capturé « Ma scène ». Le 5570 est resté sur le launcher pendant le contrôle 5573. Cela distingue concrètement les deux ports et prouve que l'action sur 5571 n'a pas piloté 5572. Les étapes, codes retour, captures et journaux sont conservés dans [independent-targeting-results.json](app/build/maestro-device-diagnostic/independent-targeting-results.json) et les fichiers `step-01` à `step-05`.

La restauration du 5570 par `launchApp: { stopApp: false }` a démarré `MainActivity`, mais a affiché « Bienvenue / Mode démo / Application réelle » et non « Ma scène ». L'ancien PID 4190 a quitté avec `SIGNALED`, statut 9 ; le nouveau PID 7912 a démarré. Le flow de restauration a donc échoué sur son assertion, sans effacement de données demandé. Une unique sélection Maestro de « Application réelle » a montré le formulaire de connexion ; **aucun login n'a été effectué**, conformément au périmètre. La raison exacte de la mort du processus précédent n'est pas prouvée par les journaux disponibles. Preuves : [transition des processus](app/build/maestro-device-diagnostic/5570-process-transition-summary.json), [état de sortie Android](app/build/maestro-device-diagnostic/5570-activity-exit-info.txt), [résultat du flow](app/build/maestro-device-diagnostic/restore-live-choice-result.json) et [capture finale du formulaire](app/build/maestro-device-diagnostic/after-live-choice-5570-screen.png).

Le Home symétrique sur 5572 n'a pas été tenté afin de préserver sa session QA. La séparation est prouvée par l'état simultanément différent des deux appareils et le contrôle Maestro du 5572 pendant que le 5570 était sur Home. Le micro-flow de contrôle de l'outillage ne valide aucune feature Meewav.

## État de sortie

| Vérification | Statut |
| --- | --- |
| ADB 5570 | READY |
| ADB 5572 | READY |
| Maestro hierarchy 5570 via port `adbd` direct | PASS |
| Maestro hierarchy 5572 via port `adbd` direct | PASS |
| Micro-flow 5570 | PASS |
| Micro-flow 5572 | PASS |
| Ciblage indépendant | PASS — 5570 sur Home tandis que Maestro 5573 voit 5572 sur Globe |
| Cause prouvée | `Dadb.list` échoue sur `emulator-5562 offline`; exception masquée par `DeviceService` |
| S22 modifié | NON |
| Meewav modifié | NON — code et données métier inchangés ; le 5570 requiert une reconnexion QA avant l'audit métier |
| Supabase modifié | NON |

Les tests métier restent suspendus à la demande de l'utilisateur. Avant leur reprise, reconnecter uniquement le compte QA existant sur 5570 avec le mécanisme déjà validé, puis continuer à cibler les ports `adbd` directs. Ne pas interpréter la présence d'un formulaire après redémarrage du processus comme une preuve de perte de session serveur.
