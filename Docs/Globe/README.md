# Globe Android — audit Web et intégration

## Parcours

Dans l’aperçu DEBUG, **Terminer** quitte Localisation et ouvre **Ta scène est prête** directement en paysage, avec le fond acoustique, la miniature animée et **Touche le globe pour entrer**. Le clic ouvre la scène complète du globe, toujours en paysage, avec son décor spatial. Retour ramène à l’arrivée en paysage, puis à Localisation en portrait. Le bypass reste actif et ne crée aucun compte.

La miniature et le globe d’exploration sont deux documents locaux distincts. L’authentification et la navigation Android restent en Compose ; le site distant n’est pas chargé.

## Audit de la référence

Source : `Meewav-Web`, branche `main`, commit `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21`. Le dépôt Web n’est pas modifié.

| Élément | Source dans le Web | Reprise Android |
| --- | --- | --- |
| Miniature | `src/components/auth/HolographicOrbCTA.tsx` | Limitée à l’arrivée ; carte gris/noir et reflets solidaires du vinyle. |
| Vrai globe | `src/features/globe/VinylGlobe.tsx`, `vendor/globe-vinyle/shared/src/App.tsx` | Scène React/Three indépendante déjà intégrée par iframe dans le Web ; reprise complète locale. |
| Cadrage | `saturn-ring.mjs`, `navigation-presets.mjs`, `orbit-camera.mjs` | Alignement autour de Paris, bearing 15° et cadrage calculé selon le viewport ; aucun OrbitControls de miniature pour l’exploration. |
| Vinyle | `saturn-ring.mjs`, `vinyl-record-geometry.mjs`, `vinyl-record-material.mjs` | Géométrie, relief, éclairage et finition du Web. Disque et portraits tournent ensemble en 72 s ; arrêt durant l’exploration de l’anneau. |
| Couleurs | `globe-palette.mjs`, `three-engine.ts` | Océan gris, terres étrangères noires, palette territoriale et éclairages physiques du moteur complet. |
| Décor spatial (« skybox ») | `star-sky.mjs`, `style.css` | La scène active utilise 3 600 étoiles procédurales orientées avec la caméra sur un fond sombre dégradé ; elle ne charge pas une cubemap de six images. Aucun ancien essai spatial réactivé. |
| Gestes | `three-engine.ts`, `direct-drag.mjs`, `wheel-zoom.mjs`, `ring-navigation.mjs` | Navigation tactile Android adaptée : [gestes, architecture et vérifications](Navigation-tactile.md). |
| Géographie | `data/`, `border-worker.mjs`, `quarter-stream.mjs` | Pays, régions, communes, quartiers et workers embarqués. Chargement local à la demande des données fines. |
| Artistes et monuments | `ring-portraits.mjs`, `ground-avatars.mjs`, `eiffel-landmark.mjs`, `NationalTopTen.tsx` | Ressources, modèles et Draco locaux. Les profils et le classement de démonstration ne deviennent pas des données Supabase réelles. |
| Interface | `globe-interface.tsx`, `GlobeNavigationPole.tsx` | Recherche, filtres, modes, exploration et préprofils ; feuille Android pour leur encombrement en paysage. |
| Chargement | `vendor/meewav-vinyl/src/GlobeLoading.jsx`, `components/Vinyl.jsx` | Même animation du tourne-disque que sur le Web, affichée jusqu’à la première image du moteur. |

Les destinations Messagerie, Rooms, La Scène, Marketplace, Tremplin et Profil sont raccordées au parent de l’iframe dans le Web. Ce lot ne les raccorde pas à Android. Le dialogue existant annonce les destinations encore non reliées.

## Sources, construction et droits

Les sources copiées sont sous `app/src/main/globe-source/vendor/`. L’inventaire `app/src/main/globe-source/web-globe-provenance.json` conserve les chemins et SHA-256 des 2 166 fichiers repris. Les adaptateurs hôtes sont séparés : `full-globe.tsx`, `full-globe-bridge.ts`, `full-globe-mobile.css`, `full-globe-nav-texture.tsx`. Ce dernier conserve le petit globe de navigation fixe, selon la demande utilisateur. Le lot de [navigation tactile](Navigation-tactile.md) adapte également six copies de sources du moteur ; le manifeste conserve les empreintes des originaux importés. Le document et les ressources livrés sont dans `app/src/main/assets/globe-vinyle/`.

Le moteur complet est compilé sans substitution de rendu : ratio de pixels `Math.min(devicePixelRatio, 2)`, anticrénelage activé, sphère à 192 × 96 segments et géographie complète de `land.bin`. Le vinyle conserve le niveau `high` du Web, soit 1 024 segments angulaires, huit segments de biseau et les profils de matière à 8 192 échantillons. Les portraits gardent leurs images sources et l’atlas Web à 512 pixels par case, sans réduction Android supplémentaire.

Le 15 septembre 2026, à la demande de l’utilisateur, les essais de résolution réduite, de géométrie simplifiée, de modification des matériaux et de cache GPU intermédiaire ont été retirés. Le rendu utilise de nouveau directement le moteur Web. La miniature d’arrivée possédait déjà les réglages de sa référence Web et reste inchangée. Ce rétablissement ne constitue pas une validation de la fluidité ou des 60 images par seconde.

Reconstruction depuis Android : `node scripts/build-full-globe.mjs`. Le chemin Web peut être passé en premier argument. Le script utilise les dépendances déjà installées de `Meewav-Web/vendor/globe-vinyle`, en lecture seule : Three 0.185.1, React/ReactDOM 19.2.6 et esbuild 0.25.12. Il ne lance ni serveur ni installation. Les bundles livrés suffisent à Gradle et au téléphone.

Les données et médias sont embarqués pour cette reprise autonome ; le poids de l’APK de travail augmente en conséquence. La distribution différée des ressources n’est pas traitée ici. Les notices de données, la provenance des modèles et le manifeste de licence des médias accompagnent les copies sans modification. Les licences des 11 dépendances compilées sont dans `app/src/main/assets/globe-vinyle/THIRD_PARTY_NOTICES.txt`, en plus des en-têtes générés. Aucune licence publique Meewav ou nouvelle attribution d’auteur n’est créée.

## Chargement et cycle de vie

Le document `https://appassets.androidplatform.net/globe-vinyle/index.html` est servi depuis l’APK. Un manifeste limite l’intercepteur aux fichiers embarqués ; les autres origines, les requêtes non GET et les traversées de chemin sont refusées. La CSP permet les modules, styles, images, médias et workers locaux nécessaires, dont Draco/WASM. Les accès réseau, fichiers arbitraires, géolocalisation Web et permissions WebView restent désactivés.

Aucun secret, cookie Supabase, jeton ou pont JavaScript vers Android n’est exposé. L’adaptateur natif vers JavaScript transmet uniquement l’activité et des commandes fixes. Démonter React libère le moteur et ses workers. La WebView utilise `MATCH_PARENT` et le document une hauteur explicite pour éviter le canvas de hauteur nulle. Le statut prêt vient de `App.tsx` après `engine.firstFrame`.

Les changements de taille liés au clavier sont regroupés au début de la boucle
d’affichage : le tampon du canvas est redimensionné puis redessiné dans la même
image. Le `ResizeObserver` ne l’efface plus entre deux rendus. Une notification
à dimensions identiques ne réinitialise pas le tampon. La résolution et le ratio
de pixels restent inchangés ; le cadrage initial est toujours calculé avant que
le moteur soit exposé à l’interface.

## État des vérifications

### Panneaux artistes et filtres Android — 15 septembre 2026

Les composants `RingArtistPreProfile` et `GroundArtistPreProfile` sont désormais
importés dès le démarrage du globe, au lieu d’un import différé au premier clic
avec `Suspense fallback={null}`. Les portraits tactiles sont sélectionnés dès le
relâchement, sans attendre les 280 ms de reconnaissance du double toucher sur la
géographie. Ces deux attentes identifiées dans le code sont retirées ; leur part
exacte dans le délai ressenti de 1–2 secondes n’a pas été chronométrée.

En paysage mobile, le Top 10 déplié et les préprofils partagent les mêmes limites :
288 pixels CSS de largeur, 10 pixels depuis le haut, 10 depuis le bas et 12 depuis
la droite. `mobile-artist-panel.ts` utilise les variables de `full-globe-mobile.css`.
Le préprofil du classement recouvre sa liste, qui reste montée, non interactive
et à la même position de défilement jusqu’à la fermeture. Les préprofils du
vinyle et des avatars au sol reprennent exactement ce même format.

Le contenu utilise désormais des dimensions mobiles réelles, sans réduire toute
la carte desktop par une transformation. Le cartouche « MEEWAV · PRÉ-PROFIL »
est retiré, le contenu commence à 12 pixels du haut et le badge reste à côté du
nom. L’ordre est identité, Suivre / Voir profil, Aperçu / Vidéo / Audio, puis
épinglage et bio. L’épinglage tient dans une ligne compacte :
la palette se déplie à la demande et conserve cinq cibles de 36 pixels.
Le corps de la fiche défile si nécessaire ; fermer, contacter et demander une
collaboration restent accessibles dans les zones fixes. Le logo au-dessus du
Top 10 s’efface lorsque la liste se déplie pour lui laisser toute cette hauteur.

Le panneau Top 10 et le bouton « Explorer les artistes » reprennent les couleurs
de la fenêtre d’authentification native (`renderIosStageWindow` dans
`IosAvatarStage.kt`) : dégradé sombre `#2B1B5C` / `#19122F` / `#0B0816` /
`#080610` / `#1A1234`, lumière violette `#5137A1` et même palette de contour.
Les boutons Play/Pause et Retour au globe reprennent également ce traitement.
Cette référence est nommée **Violet urbain Meewav** et conservée dans
[l’index documentaire](../README.md#repère-artistique-à-conserver--violet-urbain-meewav),
avec les variables CSS communes `--meewav-violet-urbain-*`.
Ces variables remplacent également les anciens accents roses du préprofil :
suivi, collaboration (bouton et pictogramme), contour du portrait et trait des
onglets, y compris les états de survol et de focus. Les couleurs de grades et
les couleurs de repère choisies par l’utilisateur gardent leur signification.

Lors d’une sélection au sol, la représentation agrandie vient à 12 pixels de la
fiche. Un repère et un trait discret conservent le lien avec sa position réelle
dans le quartier ; ni les coordonnées de l’avatar ni la caméra ne sont déplacées.
Les avatars consultés non épinglés restent atténués et sont aussi désaturés dans
le shader du lot de sprites. « Rétablir l’avatar » retire ce statut et restitue
couleur et opacité, y compris après fermeture de la fiche restaurée.

Les filtres paysage ont un en-tête réduit, trois catégories (Avatars, Niveaux,
Top 10), des choix compacts dans une zone défilante, et les actions de pied de
panneau fixes. Top 10 remplace les villes favorites : sa visibilité est mémorisée
localement et un bouton ouvre le classement dans la vue d’ensemble. Le classement
reste une démonstration, indépendante des filtres d’avatars et de niveaux.
Les filtres d’artistes continuent de s’appliquer immédiatement.
« Masquer les profils déjà visités » est placé dans une barre fixe, accessible
dans les trois catégories et pendant leur défilement. Toute sa ligne active
l’interrupteur ; les profils épinglés gardent leur exemption.

Le filtre mobile utilise des surfaces noires, des séparateurs discrets et le
**Violet urbain Meewav** pour les commandes et sélections. Les anciens dégradés
bleus et les halos de couleurs différentes sont remplacés jusque dans les états
actifs, survolés et de focus. Les illustrations et les badges conservent leurs
ressources d’origine. Avatars, Niveaux, Top 10 et le masquage des profils visités
gardent leur fonctionnement.

Le repère permanent du host est vert (`#22C55E`), prioritaire sur une éventuelle
couleur d’épinglage sauvegardée. Dans son préprofil mobile, le nom ne s’étire plus
pour remplir la ligne : le badge le suit avec le même espacement de 4 pixels que
sur les autres fiches, en conservant la place réservée au bouton de fermeture.

Les six villes rapides et les commandes 3D / zoom sont retirées de l’interface
Android. Les gestes de zoom et d’inclinaison restent disponibles. Ville, Pays et
Ma position occupent trois boutons carrés à droite, avec des icônes et des libellés
d’accessibilité. Ils s’effacent quand le Top 10 est déplié pour laisser sa liste
accessible. Ma position conserve sa destination de démonstration (Charonne) ;
ce déplacement des commandes n’ajoute pas de géolocalisation réelle. La recherche
est limitée à 264 × 36 pixels CSS en paysage. Dans le globe complet, le chevron
vers l’inscription et le logo supérieur sont retirés. Le Top 10 et la navigation
commencent à 10 pixels du haut. Une croix native en haut à droite ferme la tâche
Android sans effacer les données ; le retour système depuis le globe fait de même.
Une bande de 76 pixels à droite des fiches réserve sa cible tactile, avec
26 pixels d’écart entre le Top 10 et la zone d’appui de fermeture. Le bouton
« Retour au globe » de l’exploration du vinyle reste disponible.
Le conteneur de navigation a un contour continu et accueille son petit globe
fixe sans effet de creux. Tous les boutons, du globe au profil, partagent une
distribution verticale unique avec des intervalles égaux et des marges haute et
basse identiques. Les groupes intermédiaires n’ajoutent plus d’espace propre.
Les résolutions, les textures sources et la géométrie
du globe ne sont pas réduites par ces adaptations.

La recherche place les villes avant les autres lieux et les artistes. Les noms
exacts et débuts de noms restent prioritaires à l’intérieur de la catégorie ;
la recherche d’artistes porte sur leur nom/alias, et non leur ville ou quartier.
Les accents et tirets sont normalisés. L’activation d’une suggestion appelle
directement la même navigation que la loupe, via le clic natif tactile, souris
ou clavier. Le navigateur distingue ce clic d’un défilement de liste. Le champ
et le clavier sont refermés avant de démarrer le vol. Le nettoyage tactile au
redimensionnement ou à la perte de focus n’interrompt la caméra que si un geste,
une inertie, un zoom tactile ou un retour amorti était actif. Auparavant,
`cancelTouch()` appelait indirectement `motion.interrupt()` même au repos :
la fermeture du clavier pouvait donc annuler le vol qui venait de démarrer,
malgré la protection ajoutée au gestionnaire de focus. La mise en arrière-plan
réelle garde sa suspension via `setActive(false)`. La perte de focus du champ
vers la liste ne la démonte plus. Le clavier et l’accessibilité gardent leur
activation habituelle. Les destinations d’avatars utilisent aussi l’index des
quartiers et le code de leur ville, au lieu de supposer systématiquement Paris.

Le bundle et l’APK debug sont reconstruits pour livraison sur le S22 Ultra.
Aucun test ni contrôle visuel automatique n’est lancé pour cette retouche ; la
validation du rendu et de la réactivité sur appareil reste à l’utilisateur.

Les pré-profils du Top 10 forment des pages verticales : glisser la fiche elle-même
vers le haut fait entrer la suivante depuis le bas, et inversement. Le déplacement
suit le doigt, puis se cale sur une fiche au relâchement ; un geste trop court
revient sur la fiche courante. Une barre à droite indique le rang et permet aussi
un accès direct. Les clics sur les boutons restent possibles ; un glissement ne
déclenche pas un clic. Les lecteurs et curseurs conservent leurs gestes propres.
Trois fiches au maximum sont montées, et les lecteurs sont réinitialisés lors du
changement de fiche active. La liste reste montée derrière. La molette et le
clavier de la barre restent utilisables ; le contenu débordant conserve son
défilement interne à la molette/barre, le glissement tactile vertical parcourant
les fiches. « Suivre » est noir au repos ; seul l’état « Suivi » est lumineux.
Le conteneur interne déclare lui aussi `touch-action: pan-x` : la WebView tranche
les gestes au premier conteneur défilant, donc le réglage du parent seul ne suffit
pas. Cela réserve le geste vertical au déplacement de la fiche et supprime le
rebond vertical interne. La direction tolère une légère dérive horizontale ; une
perte de capture provenant d’un contrôle enfant n’annule pas la capture de la fiche.

### Lecture du vinyle en exploration

À l’arrivée depuis « Explorer les artistes », la caméra regarde à contre-sens du
défilement : les portraits en lecture viennent de face, quel que soit le côté
d’entrée. Le vol conserve son point d’arrivée et intègre cette orientation dans
son approche ; le sens de rotation du disque et les gestes manuels sont conservés.

L’aide textuelle et son pictogramme de main sont remplacés par un lecteur unique
de 320 × 46 pixels au maximum, centré horizontalement en haut de l’écran. Il réunit
Play/Pause, le portrait, une pastille « Top 1 Meewav France » avec couronne, le nom à côté du portrait, le titre et
Muet dans la même surface Violet urbain Meewav. Les zones d’appui font 44 pixels.
À côté du portrait, la pastille occupe la première ligne ; le nom et le titre
partagent la seconde, séparés par un point médian, avec 5 pixels entre les lignes.
Son bord haut et sa hauteur sont alignés avec Retour au globe. Pendant l’ouverture
d’un préprofil, il se compacte en deux commandes à gauche de la fiche pour garder
Play/Pause et Muet accessibles sans couvrir son contenu.
La manipulation manuelle reste disponible. Play entraîne
le disque et ses portraits à raison d’un tour en quatre minutes ; la caméra ne
tourne pas automatiquement. Pause garde exactement l’angle courant sans arrêter
la musique. Toucher ou manipuler le vinyle laisse tourner le disque et les
portraits. Sélectionner un portrait suspend uniquement la rotation à l’ouverture
du préprofil ; un nouveau Play la reprend. Sortir de l’exploration ou mettre
l’application en arrière-plan suspend encore les deux pour libérer la lecture.

Le disque et les portraits partageaient déjà le groupe tournant. Les reflets
étaient compensés pour rester fixes dans l’espace, ce qui pouvait donner une
impression de surface immobile. En lecture d’exploration, les reflets suivent
désormais la surface, avec la compensation de vue déjà utilisée par la miniature.
La phase lumineuse est conservée à la pause et au retour, sans saut ni réduction
de qualité. Le rythme de quatre minutes par tour reste identique.

`ring-playback.ts` commande une lecture audio locale : démarrage dans le geste
utilisateur au premier Play, puis rotation et bande-son indépendantes. La musique
boucle aussi pendant les pauses de rotation et l’ouverture ou la lecture d’un
préprofil. Seul Muet coupe son volume pendant l’exploration, sans arrêter sa
progression. Une erreur audio est affichée sans figer la rotation. Les ressources
sont libérées au démontage. `ring-audio.ts` référence `audio/ring-exploration.m4a`, copie sans
transcodage du fichier utilisateur `Untitled (2).m4a`. Son MIME est `audio/mp4`.
Après des erreurs `PIPELINE_ERROR_READ` observées dans le journal du Samsung,
le morceau (2,25 Mo) est préchargé une fois via fetch puis fourni au lecteur comme
Blob local. Le décodeur peut chercher dans ce Blob sans requêtes Range vers la
WebView. Play attend la fin du préchargement et démarre toujours la lecture dans
le geste utilisateur. Le fichier AAC original reste intact ; le Blob est libéré
au démontage. `LocalMediaAsset.kt` reste disponible pour les autres médias.

Le bouton muet à droite du lecteur coupe ou rétablit le son
sans arrêter la rotation, sans changer la position de lecture et sans démarrer
une lecture en pause. Le choix reste dans le contrôleur de session ; sa sauvegarde
locale est facultative et dépend de la disponibilité du stockage WebView.
Dans le lecteur, « Top 1 », le portrait et le nom viennent directement du premier
artiste de la liste Top 10. Le titre « Minuit sur orbite » est fictif et accompagne
le morceau utilisateur existant dans cette démonstration. La règle produit est de
diffuser le morceau du premier du classement ; le classement actuel reste une
fixture, sans service de classement ni catalogue musical réel raccordé.
Compilation et installation ne constituent pas un essai audio ou visuel :
la validation du son, de la reprise et des reflets sur appareil reste à l’utilisateur.

### Historique des contrôles du rendu

Avant le rétablissement des réglages Web, le bundle avait été construit, `assembleDebug` avait réussi et l’APK avait été installé sur le S22 Ultra. L’arrivée paysage sur fond acoustique et le moteur complet avec étoiles, vinyle, portraits et palette territoriale avaient été observés sur le téléphone. Canvas 797 × 384 CSS ; aucune ressource distante ni erreur HTTP relevée, contexte WebGL actif sans erreur. Ces premières observations ne validaient pas la fluidité après restauration. L’inscription réelle, les services, les Rooms et les lives ne sont pas validés ici.

Au checkpoint de restauration `32333d0` : bundle reconstruit, `:app:assembleDebug` réussi, APK installé et application relancée sur le S22 Ultra, sans relevé FPS supplémentaire à ce stade.

À la demande suivante de l’utilisateur, l’[audit de performances du 15 septembre](Audit-performance-2026-09-15.md) a ensuite comparé les composants sur le téléphone. Il a identifié les peintures répétées du petit globe de navigation comme cause du ralentissement principal. L’adaptateur Android le dessine désormais une seule fois. La trace après correction ne présente plus les lectures de pixels répétées ; au checkpoint `7e2a043`, le moteur et les 2 166 ressources de provenance étaient encore identiques aux originaux importés. Le lot tactile suivant adapte six sources, comme décrit ci-dessus. Les mesures vont d’environ 38 à 60 FPS selon les séquences, avec des fréquences GPU variables et une limitation thermique pendant les essais prolongés : ce résultat ne garantit pas 60 FPS constants. Le rapport distingue les mesures debug, optimisées et à chaud.
