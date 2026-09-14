# Audit du globe Android — 15 septembre 2026

## Conclusion et correction

Le ralentissement principal reproduit vient du **petit globe animé de la barre de navigation**. Sa boucle Canvas2D déclenche des peintures et des lectures de pixels qui bloquent le pipeline graphique de cette WebView. Le grand globe Three.js n'a pas besoin d'être réécrit pour éliminer ce problème.

À la demande de l'utilisateur, le petit globe reste désormais **fixe**. L'adaptateur Android dessine sa carte une fois, avec la même image, les mêmes couleurs, le même masque côtier et la même densité de pixels. Il n'entretient plus de `requestAnimationFrame`. Le disque principal, ses portraits et ses animations restent actifs.

Le résultat ne constitue pas une garantie de 60 FPS permanents : les essais ont également rencontré une limitation thermique et des fréquences GPU variables. Les mesures du correctif vont d'environ 38 à 60 FPS selon les séquences. Le problème de copies répétées est corrigé ; la tenue prolongée à 60 FPS et le comportement de la fréquence GPU restent à établir.

## Périmètre et méthode

- Référence avant correction : commit Android `32333d0aa72d93f00b5e621094a95680dd6d0b0b`, après restauration complète de la qualité Web.
- Référence copiée : Meewav-Web `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21`. Aucun changement dans ce dépôt.
- Appareil physique : Samsung S22 Ultra SM-S908B, Android 16, WebView 152.0.7977.88, GPU Samsung Xclipse 920 via ANGLE/Vulkan 1.3.279.
- Paysage : surface physique 2 316 × 1 080 ; viewport du globe environ 797 × 384 CSS ; drawing buffer **1 594 × 768**, DPR moteur **2**, anticrénelage **4 échantillons**, profondeur 24 bits. Le DPR physique est 2,8125 ; le plafond 2 est celui du Web, sans réduction Android ajoutée.
- Comparaisons : même cadrage de départ, angle initial du vinyle remis à zéro, 1,2 seconde de stabilisation puis 5 secondes mesurées. Trois répétitions par variante principale, avec retours au témoin. Le parcours mobile est un vol de 5 secondes, longitude +24° et bearing +8°, depuis la même vue.
- Comptage indépendant des appels au renderer Three.js et de leur intervalle ; ce sont des **FPS de rendu soumis**, pas une mesure des images effectivement présentées par SurfaceFlinger. Le compteur interne du moteur ne couvre pas toutes les branches de rotation seule ; il n'a pas servi de référence.
- Mesures de température `SKIN`, statut thermique et résidences de fréquence GPU enregistrées autour des essais. Aucun verrouillage de fréquence, refroidissement artificiel ou changement de résolution. Les séries à températures différentes sont signalées séparément.
- Les temps JavaScript de soumission ne sont pas des durées GPU. L'extension de mesure GPU `EXT_disjoint_timer_query_webgl2` n'est pas disponible sur ce contexte. Les traces Chromium complètent ces mesures, sans prétendre isoler chaque shader en millisecondes GPU.

L'outil CDP est resté identique pour les comparaisons debug et optimisées. Aucun service métier, compte réel ou serveur distant n'a été sollicité par le scénario du globe.

## Inventaire de ce qui est réellement embarqué

Les chemins ci-dessous sont relatifs à `app/src/main/globe-source/vendor/globe-vinyle/shared/src/`, sauf mention contraire.

| Partie | Implémentation et observations |
| --- | --- |
| Moteur | `three-engine.ts`, Three 0.185.1 ; rendu direct, AA activé, ratio plafonné à 2 comme le Web. Vue de référence : 26 appels de dessin et environ 651 741 triangles, plus 3 600 points. |
| Géographie | Sphère 192 × 96 ; maillage des terres à 724 089 indices. Pays, régions, communes et quartiers locaux, chargés selon le niveau. Aucune géométrie simplifiée substituée pour Android. |
| Vinyle | `saturn-ring.mjs`, `vinyl-record-geometry.mjs`, `vinyl-record-material.mjs` : niveau `high`, 1 024 segments angulaires, huit segments de biseau ; profils de matière 8 192 × 1, profils complémentaires 1 024 × 1, bruit 2 048 × 2 048. Rotation en 72 secondes. Les lumières de studio sont fixes ; grain et portraits suivent le disque. |
| Portraits | `ring-portraits.mjs` : 60 images sources, un atlas 4 096 × 4 096, cases 512 × 512, 96 instances réutilisant cet atlas. Dimensions sources observées : 800 × 1 000, 960 × 1 200, 1 024 × 1 024 et 1 254 × 1 254. |
| Envoi des portraits | Une texture atlas GPU partagée ; remplissage initial puis mise à jour groupée lorsque les photos ont fini de charger. Version de texture stable pendant les essais. Aucun `texImage2D`, `texSubImage2D`, `texStorage2D` ou `generateMipmap` pendant les fenêtres mesurées après chargement. |
| Mipmaps | `generateMipmaps=true`, filtre `LinearMipmapLinearFilter`. Le tableau JavaScript `mipmaps` vide ne signifie pas leur absence : ils sont générés automatiquement côté GPU. |
| Mémoire des photos | Atlas RGBA : 64 Mio, environ 85,33 Mio avec la pyramide de mipmaps. Ce sont des estimations de stockage non compressé, pas une mesure de VRAM résidente. Somme théorique des images sources décodées RGBA : environ 234,8 Mio ; ne pas l'additionner comme autant de textures GPU. |
| Étoiles | `star-sky.mjs` : un buffer de 3 600 points, positions fixes. Leur projection change avec la caméra ; aucune animation autonome des étoiles. Fond CSS sombre, aucune cubemap de six grandes images. |
| Bloom | Option désactivée dans le rendu observé ; le chemin correspondant ne crée pas de passe de bloom active. |
| Petit globe de navigation | `reference/features/globe/components/NavGlobeTexture.tsx`, importé par `GlobeNavigationPole.tsx`. Image 2 048 × 1 024, canvas 107 × 107 sur ce téléphone, affiché à environ 31 CSS px. Avant correction : deux `drawImage` à chaque frame, rotation de 36 secondes. |
| JavaScript | Bundle minifié, React/ReactDOM 19.2.6 **production**. Vérifié dans les entrées du bundle : `react.production.js`, `react-dom.production.js`, `react-dom-client.production.js`, `react-jsx-runtime.production.js`. |
| Ressources locales | Manifeste de 2 077 fichiers : 1 921 données, 25 modèles, 107 ressources UI, 20 fichiers de bundles et quatre fichiers racine. Le lot est volumineux, mais le poids du paquet seul n'explique pas les blocages mesurés après chargement. |

Le mode production est constaté dans le bundle effectif. La substitution de `process.env.NODE_ENV` lors de la minification est aussi décrite par [esbuild](https://esbuild.github.io/api/#define).

La mémoire recensée par Three varie avec les lieux déjà visités : huit textures et 26 géométries dans une vue fraîche, davantage de ressources résidentes après exploration. Cette différence entre sessions ne suffit pas à diagnostiquer une fuite.

## Comparaisons des composants

Valeurs min–max des moyennes FPS sur les répétitions ; les variantes sont temporaires et restaurées après chaque mesure. Les positions, tailles des portraits, résolution du canvas et autres composants restent constants.

| Variante avant correction | Vue fixe, trois essais sauf témoin | Caméra en mouvement, essai complémentaire | Interprétation |
| --- | ---: | ---: | --- |
| Témoin complet | 11,83–19,52 | 12,98–19,79, cinq témoins | Forte variabilité déjà présente sans changer de composant. |
| Portraits masqués | 12,28–18,87 | 13,39 | Ne fait pas disparaître le ralentissement. |
| Atlas 2 048, cases 256 | 12,39–18,41 | 19,32 | Aucun gain régulier établi ; ne justifie pas une baisse permanente. |
| Atlas 1 024, cases 128 | 11,83–17,88 | 13,30 | Même conclusion. Taille et emplacement affichés inchangés. |
| Étoiles masquées | 12,37–14,91 | 13,52 | Ne résout pas le problème. Étoiles affichées « animées contre figées » : comparaison sans objet, elles sont déjà fixes. |
| Rotation du vinyle figée | 11,79–17,46 | 18,07 | Le rendu continue ; figer la rotation ne débloque pas le pipeline. |
| Matière simple du vinyle | 17,08–21,44 | 21,30 | Peut réduire une charge, mais le blocage principal subsiste. Aucun changement permanent de matière. |
| Terres et labels masqués, sphère gardée | 12,33–20,61 | 20,73 | Environ cinq appels de dessin et 119 424 triangles ; le problème reste présent malgré cette forte réduction. |
| Petit globe de navigation figé | **39,40–59,96** | **59,79**, trois répétitions | Gain répété en gardant la scène 3D complète. |

Les premières variantes fixes ont été prises principalement entre 38,6 et 39,3 °C, statut 1 ; les essais ciblant le petit globe, entre 39,5 et 40 °C. Les vols avec comparaison alternée du petit globe ont été pris entre 40,3 et 41,5 °C, statut 2. Les résultats des petites variantes se chevauchent trop pour leur attribuer un pourcentage de gain fiable.

Pour figer le petit globe pendant l'A/B, seules ses opérations `clearRect` et `drawImage` sont neutralisées. Sa callback reste planifiée, son image reste visible, et le renderer principal continue. L'amélioration ne résulte donc pas de l'arrêt de la scène 3D ni de sa boucle de rendu.

### Preuve dans les traces graphiques

Captures distinctes avec la même méthode, incluant la stabilisation puis 4,5 secondes mesurées :

| Événement Chromium | Petit globe animé | Petit globe figé temporairement | Correctif installé, petit globe fixe |
| --- | ---: | ---: | ---: |
| `RasterImplementation::ReadbackImagePixels` | 149 | 2 | **0** |
| `CommandBufferHelper::Finish` | 149 | 3 | **0** |
| `Paint` | 151 | 2 | 4 |

Avant correction, les lectures de pixels durent environ 25,58 ms à la médiane et 54,09 ms au p95. Les appels JavaScript au renderer ne durent pourtant qu'environ 2–3 ms à la médiane : une grande partie de l'attente survient ensuite dans la chaîne graphique. Les événements sont imbriqués ou concurrents ; leurs durées ne doivent pas être additionnées comme des coûts indépendants.

L'alternance répétée et la disparition des événements après correction établissent le déclencheur dans cette WebView. Elles ne suffisent pas à attribuer le détail de l'implémentation à un bug précis du pilote Samsung, de Vulkan ou de Chromium.

### Android debug contre version optimisée

Une variante locale temporaire `globeAudit` a été compilée avec `debuggable=false`, R8, réduction de ressources et `profileable shell=true`, signée localement. Le flag `DEBUGGABLE` est absent du paquet installé et `BuildConfig.DEBUG=false`. Son activité de mesure ouvre le même composant `SceneGlobeArrival`, les mêmes assets, la même résolution et le même thème, sans initialiser un vrai parcours de compte. Le canal WebView CDP reste activé pour mesurer dans les deux variantes.

Ce montage est un harnais proche d'une release, **pas une validation de l'application complète en production**, et ce n'est pas un test Macrobenchmark AndroidX. Le choix non débogable/minifié suit les [recommandations Android pour les mesures](https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview).

| Version avant correction | Vue fixe, trois essais | Vol, trois essais |
| --- | ---: | ---: |
| Optimisée, petit globe animé | 12,88–18,46 FPS | 13,02–18,99 FPS |
| Optimisée, petit globe figé temporairement | 38,40–39,00 FPS | 41,39–59,79 FPS |

Températures de cette série : 40,3–41,2 °C, statut 2. Passer en release ne suffit donc pas à corriger ce ralentissement. Il n'y avait pas de React développement caché à remplacer.

## Cache, chargement et cycle de vie

- L'ancien cache graphique expérimental avait déjà été retiré au checkpoint de restauration. Aucun cache intermédiaire de ce type n'est actif dans cette référence ; son A/B n'est pas réalisable sans réintroduire une ancienne variante. Il n'a pas été réintroduit et aucun gain ne lui est attribué.
- L'arrivée `Ta scène est prête` utilise sa WebView miniature ; la scène complète utilise un autre document local. Observation réelle : une seule page complète après entrée ; uniquement la miniature après retour ; aucun target WebView après retour à Localisation ; de nouveau une seule scène complète après rotation et entrée.
- Le loader tourne-disque est démonté à la première image prête. Aucun élément du loader ni animation de chargement active dans les relevés stabilisés.
- Avant correction, les deux callbacks récurrentes observées correspondent au moteur et au petit globe de navigation. Aucun second moteur 3D caché n'a été observé. Les workers de géographie/population/Draco ne constituent pas des moteurs dupliqués.
- `AuthCompletionGlobe.kt` suspend l'activité, appelle `onPause`, dispose les ressources puis détruit la WebView au retrait. Les aller-retour testés n'ont pas laissé l'ancienne miniature derrière le globe.

Cette observation de quelques transitions ne constitue pas un test d'endurance de fuite mémoire sur plusieurs heures.

## Correctif livré et qualité conservée

Le fichier Android `app/src/main/globe-source/full-globe-nav-texture.tsx` remplace uniquement l'import du petit globe via `scripts/build-full-globe.mjs`. La carte est calculée une fois puis conservée ; le canvas de préparation utilise `willReadFrequently` pour son unique lecture CPU. Aucun timer, listener de visibilité ou animation n'est nécessaire pour cette image fixe. Le chargement asynchrone est neutralisé au démontage.

Les fichiers copiés dans `vendor/` restent intacts. Contrôle SHA-256 des **2 166 entrées de provenance : zéro différence**. Les textures, données, modèles, licences et notices sont conservés. Le bundle inclut l'adaptateur fixe et n'inclut plus le composant animé de navigation. Le moteur, le vinyle, les portraits, les étoiles, l'anticrénelage, le chargement tourne-disque et la miniature d'arrivée restent ceux de la référence restaurée.

### Mesures de la correction effective

Ici, `baseline` signifie le vrai code corrigé, sans neutralisation temporaire du petit globe.

| Paquet corrigé | Vue fixe, trois essais | Vol, trois essais | Température observée |
| --- | ---: | ---: | --- |
| Application debug habituelle | 45,40–45,80 FPS | 44,60–45,19 FPS | 44,0–44,3 °C, statut 3 |
| Harnais optimisé | 59,80 FPS | 48,59–59,68 FPS | 41,2–44,1 °C, statut 3 |
| Application debug après une nouvelle ouverture | 38,59–38,80 FPS | 38,19–38,58 FPS | 39,8–40,4 °C, statut 2 |

Le p95 des intervalles est de 18,0–18,4 ms dans les trois séquences fixes optimisées, et de 35,3–37,2 ms dans les séquences debug à chaud. Zéro dessin du petit globe et zéro mise à jour de texture pendant toutes ces fenêtres. Le disque principal continue de tourner ; le buffer reste 1 594 × 768 et le nombre de triangles est inchangé.

Le statut 3 est `THERMAL_STATUS_SEVERE`, qui correspond à une limitation thermique affectant l'UX selon [Android](https://developer.android.com/reference/android/os/PowerManager#THERMAL_STATUS_SEVERE). Les résidences GPU descendent d'environ 903 MHz vers 605–711 MHz dans les séquences qui ralentissent. La température `SKIN` et le statut global ne sont pas interchangeables ; le statut reste élevé pendant une partie du refroidissement. Les résultats debug et optimisés à des températures différentes ne permettent pas d'attribuer leur écart au seul type de build.

La dernière série debug retrouve le même cadrage après réouverture, mais le GPU réside surtout à 500 MHz : environ 38 FPS, malgré une température inférieure au pic précédent. La chauffe seule ne suffit donc pas à expliquer toute la cadence restante. La relation avec la fréquence est observée ; le choix de cette fréquence par la chaîne système/pilote n'est pas isolé. Aucun changement de politique de puissance ni baisse de qualité n'a été appliqué pour masquer cette limite.

### Construction et limites restantes

Le bundle a été reconstruit ; `:app:assembleDebug` et la variante optimisée temporaire ont compilé. La correction a été installée sur le S22 Ultra. Une capture après correction montre le petit globe, la scène complète, le vinyle et ses portraits présents. Les mesures et les empreintes complètent cette observation ; elles ne remplacent pas le jugement esthétique de l'utilisateur.

Le paquet de mesure temporaire a été retiré du téléphone après les essais. L'application habituelle et ses données sont conservées. Aucun réglage système de puissance, configuration métier ou service distant n'a été changé.

Il reste à caractériser une longue session d'exploration, notamment les changements de lieux, les zooms rapprochés et l'échauffement. Les mesures présentes ne justifient ni une baisse de résolution des portraits, ni une simplification du vinyle, ni une réécriture native du moteur. L'intégration des autres fonctionnalités Android, les services et les lives ne sont pas validés par cet audit.

## Preuves conservées

[Mesures structurées](audit-2026-09-15/mesures.json) : 97 mesures individuelles avec temps de frame bruts, température, fréquences, état des textures, inventaire des portraits, paramètres de rendu, empreintes et synthèse des traces. Certains compteurs ont été ajoutés pendant l'investigation : un champ absent d'un ancien relevé signifie « non enregistré », pas zéro.

Les scripts d'investigation, inventaires détaillés, captures et traces Chromium brutes restent localement dans `app/build/reports/globe-audit-2026-09-15/`, ignoré par Git. Les empreintes des traces sont dans les mesures structurées. Ces fichiers temporaires ne sont pas embarqués dans l'APK ; une suppression du dossier `build` les enlèverait.

Pour reproduire : partir du checkpoint cité, utiliser les scripts locaux `scopes.mjs`, `inventory.js`, `harness.js` et `trials.mjs` sur la WebView complète via ADB/CDP ; reprendre les variantes et le protocole ci-dessus, contrôler températures et buffer, puis restaurer les méthodes originales. Ne pas lire le FPS interne du moteur comme mesure complète et ne pas comparer des situations thermiques différentes comme un A/B isolé.
