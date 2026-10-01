# Navigation tactile Android

Implémentation du 15 septembre 2026, sur le moteur Three.js 0.185.1 embarqué.
Cette adaptation concerne le globe géographique et l’exploration du vinyle.
Elle conserve les textures, les portraits, les matériaux, la géométrie,
l’anticrénelage et le ratio de pixels du rendu Web. Le petit globe de navigation
reste fixe. Aucun moteur ni gestionnaire de gestes tiers n’est ajouté.

## Gestes

| Interaction | Comportement |
| --- | --- |
| Un doigt — globe d’ensemble | Rotation continue selon les axes de l’écran, indépendamment de l’axe du disque et du point où commence le geste. Même calcul sur la terre, la silhouette et le fond. L’orientation complète de la caméra est transportée au passage des pôles. |
| Un doigt — carte rapprochée | Déplacement direct du point sous le doigt. |
| Relâchement | Inertie selon la vitesse des 80 dernières millisecondes. Une pause avant le relâchement supprime l’inertie. |
| Deux doigts | Intention reconnue depuis la position initiale des deux doigts. Le mode choisi reste verrouillé jusqu’à un changement du nombre de doigts. Les mouvements sont regroupés par image. |
| Pincement / déplacement | Une fois ce geste reconnu, zoom selon le rapport des distances et déplacement du centre, y compris pour un pincement asymétrique. Pour incliner ensuite, relâcher puis recommencer le geste vertical. |
| Rotation | Rotation volontaire au-delà de 10°, puis mouvement continu dans le sens des doigts ; les petites différences de vitesse des pouces ne déclenchent plus ce geste. |
| Inclinaison | Déplacement vertical des deux doigts : seuil de 6 pixels CSS, puis 0,22° par pixel. Verrouillage sur le seul pitch : centre géographique, orientation et hauteur restent fixes, même si les pouces dévient ou se déplacent à des instants différents. Relâcher les doigts permet de choisir un autre geste. |
| Double toucher | Zoom avant animé de 280 ms au point touché sur la géographie. Le premier toucher attend 280 ms avant de sélectionner un lieu ; les portraits ouvrent directement leur préprofil au relâchement. |
| Double toucher maintenu | Après le second appui, glissement vertical pour zoomer à une main ; descendre rapproche, monter éloigne. |
| Ajout/retrait d’un doigt | Application du dernier déplacement puis reconstruction des références depuis la caméra affichée. Le troisième doigt ne pilote pas la caméra ; son arrivée et son départ réinitialisent également les références. |
| Annulation/interruption | Annule le geste et la sélection différée. Une nouvelle pression arrête l’inertie ou le zoom depuis leur position visible. Perte de capture, changement de taille, arrière-plan et destruction sont pris en charge. |

Les doigts presque confondus (moins de 16 pixels CSS) ou qui échangent brutalement
leurs positions ne déclenchent pas de rotation de 180°. Le déplacement ambigu
est ignoré ; les références du geste sont reconstruites.

Le nettoyage d’un contrôleur tactile au repos n’annule pas un vol demandé par
la recherche. Un changement de taille ou de focus lié au clavier supprime les
gestes en attente, mais n’interrompt la caméra que si le tactile la pilotait
effectivement. Un nouvel appui sur le globe et la mise en arrière-plan conservent
leur interruption explicite.

Les limites géographiques nominales sont : hauteur 0,003–400 unités du moteur,
latitude −85° à +85° en carte rapprochée, inclinaison 0°–75°. La rotation du
globe d’ensemble peut traverser les pôles sans retour forcé à ±85° ; longitude
et bearing peuvent alors changer de représentation tout en gardant la caméra
continue. Une résistance autorise un léger
dépassement pendant le geste, puis un retour amorti de moins de 450 ms. Ces unités
de hauteur ne sont pas des mètres. La longitude et l’orientation bouclent.

Dans l’anneau, le même interpréteur utilise le plan du vinyle comme surface
d’accroche, sa position radiale, son élévation et son orientation. Les limites
normales de promenade sont 6–94 % de la largeur et 0,8–20 unités d’élévation.
Interrompre une arrivée ou un retour conserve d’abord la position et le roulis
affichés ; si cette position est hors des bandes, elle élargit la plage de cette
visite pour éviter une téléportation au premier toucher.

En carte rapprochée, si le rayon ne rencontre pas la surface (ciel, horizon),
un déplacement de repli prend le relais. L’accroche géographique est donc une
contrainte résolue au mieux, et non une garantie impossible hors surface ou au-delà
des limites. Les safe areas et gestes système Android restent inchangés.

## Architecture et fichiers

Sous `app/src/main/globe-source/` :

- `touch-navigation.mjs` conserve les pointeurs, calcule la transformation,
  reconnaît les intentions et anime inertie/zoom/retour dans la boucle existante.
- `touch-camera.mjs` écrit dans `motion.view`, l’état géographique existant.
  Il projette le centre précédent en 3D, transforme la caméra, puis replace ce
  point sous le nouveau centre pour les pincements/déplacements. En mode
  `pitchOnly`, il change uniquement l’inclinaison, sans résoudre d’ancrage sous
  les doigts. Il délègue au mode anneau quand celui-ci est actif.
- `globe-touch-rotation.mjs` transporte la position et l’orientation de la caméra
  autour du globe selon le déplacement en pixels CSS. Il utilise le seuil
  existant de vue d’ensemble (hauteur 70) et le rayon projeté pour la sensibilité.
  Aucun ancrage géographique ni axe du disque ne contraint ce geste. Les vecteurs
  et quaternions de travail sont réutilisés dans la boucle existante du moteur.
- `touch-elastic.mjs` définit résistance et retour amorti.

Les événements de déplacement ne déclenchent pas de `setState`. Les positions
sont consommées dans la boucle d’affichage du moteur ; les changements de nombre
de doigts consomment aussi le dernier déplacement avant de reconstruire les
références. Le solveur réutilise ses vecteurs de calcul par caméra.

Six copies de sources Web ont été adaptées dans
`vendor/globe-vinyle/shared/src/` : `three-engine.ts`, `camera.mjs`,
`direct-drag.mjs`, `screen-anchor.mjs`, `ring-navigation.mjs`,
`globe-interface.tsx`. Ces modifications concernent l’entrée, la caméra et
l’animation du bouton 3D. La référence Web demeure intacte.
`web-globe-provenance.json` conserve les empreintes **des originaux importés** ;
il ne prétend pas décrire les empreintes des six copies maintenant adaptées.
Les ressources et notices de provenance ne sont pas modifiées.

Dans `AuthCompletionGlobe.kt`, la WebView réserve sa séquence tactile vis-à-vis
des conteneurs parents jusqu’au relâchement ou à l’annulation. Les clics et
l’accessibilité continuent de passer par WebView, sans second clic synthétique.

Les API `engine.resetNorth()` et `engine.resetTilt(north = false)` animent le
retour du globe géographique en 350 ms. Elles sont inactives dans l’exploration
de l’anneau. Le bouton 3D existant conserve sa fonction avec une transition de
350 ms. Aucune nouvelle boussole ni nouvelle interface n’est ajoutée.

## Vérifications de ce lot

### Correction du 1er octobre 2026 — direction de la rotation du globe

Avant correction, cinq régressions avec une vraie caméra Three.js reproduisent
les défauts de la vue d’ensemble : mouvement de travers hors surface à bearing
43° (erreur de direction normalisée 0,202), mouvement différent entre centre et
fond, retour inexact autour des pôles, latitude 89° ramenée à 85° au relâchement,
et dépendance à la cadence des événements. Les 16 tests existants restent verts.

La vue d’ensemble employait l’accroche géographique prévue pour les cartes
rapprochées. Près de la silhouette, elle passait à un calcul de repli ; près des
pôles, ses limites et son ancrage empêchaient un retour continu. L’anneau était
inactif sur ce parcours : sa présence visuelle ne déclenchait pas sa navigation.

Le correctif utilise une rotation selon les directions de l’écran sur le globe
d’ensemble, en conservant inclinaison et hauteur. Il garde l’accroche locale,
le pincement, la rotation volontaire à deux doigts, l’inclinaison verrouillée,
les sélections de portraits et la promenade sur le vinyle. Les tests couvrent
portrait et paysage, bearings différents, l’alignement réel du disque, les pôles,
le passage de la longitude ±180°, les limites élastiques et les changements de
taille et de cadence. Une caméra mathématique ne valide pas le ressenti sur
un téléphone physique.

Après correction, `node scripts/test-globe-navigation.mjs` réussit : **22 tests
réussis, aucun échec**, dont les six nouvelles régressions de rotation et de
limites élastiques. Le bundle Globe (2 135 assets) et `:app:assembleDebug`
réussissent. L'annulation de ce lot consiste à revert son commit, qui contient
aussi les assets générés, puis reconstruire et réinstaller l'APK. Elle conserve
la restauration précédente de la navbar paysage. Les identifiants exacts sont
enregistrés localement dans `android-globe-touch-rotation-20261001`.

### Correction du 29 septembre 2026 — inclinaison verrouillée

`node scripts/test-globe-navigation.mjs` : **16 tests réussis**. Les régressions
couvrent deux pouces en paysage avec événements décalés et vitesses différentes,
l’absence de rotation/zoom/déplacement pendant l’inclinaison, le maintien du
pincement et de la rotation volontaire sur un nouveau geste, l’arrêt de l’inertie
et les transitions 1→2→1. Une vraie caméra Three.js vérifie que seuls les degrés
d’inclinaison changent à plusieurs altitudes et orientations, même hors centre.
La sensation du geste sur appareil reste à valider par l’utilisateur.

Le bundle Globe et `:app:assembleDebug` ont réussi. Installation ADB en parallèle
confirmée par `Success` (code 0) sur le Samsung S22 et le Redmi, sans ouvrir
l’application. APK final : SHA-256
`3F7B581BDD169EDA4DD8CB5E21DAADD8F0BD23ACA0016E7FBDD2A34081FA9C25`.

### Historique du checkpoint tactile initial

Les résultats ci-dessous concernent le checkpoint tactile `9b84f06`. Le lot
suivant sur les préprofils retire l’attente sur les portraits ; les tests ne sont
pas rejoués automatiquement pour cette retouche. Voir l’[index du globe](README.md).

- `node scripts/test-globe-navigation.mjs` : **12 tests réussis**. Ils couvrent
  transformation asymétrique, regroupement des événements, 1→2→1 et troisième
  doigt, inclinaison, croisement/annulation, vitesse récente, double toucher,
  zoom à une main, mouvement réduit, sens de rotation, résistance et reprise de
  caméra. Les tests avec une véritable caméra Three.js vérifient la reprojection
  du point sous le doigt à plusieurs échelles et lors de l’interruption d’un vol.
- `node scripts/build-full-globe.mjs` : bundle reconstruit.
- `:app:testDebugUnitTest` : **6 tests Android réussis**.
- `:app:assembleDebug` : APK produit et installé sur le Samsung S22 Ultra.
- `:app:lintDebug` : échec sur deux erreurs déjà présentes : attribut
  `windowLightNavigationBar` API 27 dans le thème de base API 26, et échappement du
  chemin SDK dans `local.properties`. Aucun de ces fichiers n’est modifié ici.
- Contrôle TypeScript ponctuel du moteur : **aucun diagnostic supplémentaire**
  par rapport à `7e2a043`, mais contrôle non entièrement vert (9 diagnostics
  identiques, dont résolution des types Three/Vite et configuration de l’outil).

La vérification tactile dans la WebView du Samsung est en attente : l’appareil
était verrouillé après installation. Les tests locaux ne valident ni la qualité
ressentie des gestes physiques ni 60 FPS constants. L’audit de performances
précédent reste distinct et ne devient pas une mesure de cette nouvelle version.

Pour la relecture sur appareil : déplacer et relâcher, retoucher pendant l’inertie,
faire un pinch asymétrique autour d’une ville, relâcher puis essayer rotation et inclinaison séparément,
passer plusieurs fois de 1 à 2 puis 1 doigt, essayer double toucher maintenu,
atteindre les limites, interrompre un vol, puis vérifier l’exploration du vinyle.
