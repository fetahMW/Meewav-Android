# Audit des mécaniques Wave Android — 19 septembre 2026

## Conclusion et périmètre

Le portage est **partiel**. Le lecteur, le décodage audio, certaines transitions, les régions et plusieurs commandes existent réellement. En revanche, leur présence à l'écran ne garantit pas la reproduction du contrat iOS : les bus d'écoute, les votes, les épingles et le multipiste présentent des écarts fonctionnels importants.

Audit par lecture du code Android au commit `26075c6`, branche `codex/wave-tools-ios`, comparé au guide fourni par l'utilisateur. Aucune recette sur téléphone, mesure de performance, compilation ou écoute n'a été exécutée pour cet audit. Les constats « présent » ci-dessous décrivent le câblage dans le code, pas une validation en conditions réelles.

Référence : `C:/Users/linkw/Downloads/Telegram Desktop/GUIDE_ANDROID_KOTLIN_MECANIQUES_WAVE.md`.
SHA-256 : `4458A0CC235EFE036E705DC68C3ACBA63595D46DF226CE96BEE36961B5AA06EF`.
Le guide couvre le worktree iOS `c97a`, HEAD `20ef57820`, **avec des modifications non commitées**. Le commit iOS seul ne suffisait donc pas à reproduire cet état. Ce rapport remplace toute interprétation de parité complète du document `PORTAGE-WAVE-IOS-ANDROID.md`.

Les sections 1 à 14 du guide constituent le contrat comparé. La section 15 reste une recette à exécuter séparément ; la section 16 fournit les références iOS. Le guide n'est pas une spécification réseau de production : conserver les données de démonstration est compatible avec le travail demandé.

## Sources Android et notation

Tous les fichiers cités sont dans `app/src/main/java/com/meewav/android/features/rooms/wave/`. Les numéros de ligne renvoient au commit audité.

| Abréviation | Fichier |
|---|---|
| S | `WaveCompositionState.kt` |
| A | `WaveCompositionAudio.kt` |
| P | `WaveCompositionPanel.kt` |
| H | `WavePersistentPlayer.kt` |
| C | `WaveCardControls.kt` |
| W | `WaveWorkshopChrome.kt` |
| M | `WaveMixerScreen.kt` |

Statuts : **Présent** = câblage identifié ; **Partiel** = une partie existe ; **Divergent** = comportement différent ; **Absent** = pas de mécanisme correspondant dans ce parcours ; **Adaptation voulue** = choix explicite de l'utilisateur à conserver.

## 1. Couleur, disposition et géométrie — guide §§2–3, 7, 13

| Point | Constat Android | Statut / preuve |
|---|---|---|
| Violet Base / Boucle / Mix | Le segment sélectionné appelle exactement `roomsStudioCapsule`, comme Simple / Pro. Pas une nouvelle couleur prune à inventer. | Présent : H:83, M:884 ; matériau dans `WaveMixerMaterials.kt:383`. |
| Matériau partagé | Accent `capsuleAccent` violet, remplissage translucide et contour partagés ; rayon 7 dp dans le lecteur et forme propre au chip Simple / Pro. | Couleur commune dans le code ; rendu sur les fonds non comparé visuellement dans cet audit. |
| Ordre du haut | Barre principale → Propositions / Vote / Composition → lecteur fixe → liste. | Adaptation voulue : P:79, P:90. Ne pas remplacer par le dock inférieur du guide. |
| Cartes et catégories | Cartes noires HiFi et chips de catégories vifs. | Adaptation voulue ; garder la DA Android. |
| Repli | Grand chevron, suppression de l'icône waveform décorative. | Adaptation voulue : H:61. |
| Import | Icône de téléchargement standard. | Adaptation voulue : H:163. |
| Rail sans base | S'ouvre avec explication et choix indisponibles. | Adaptation voulue : H:122, H:185 ; ne pas réintroduire un bouton sans réponse. |
| Lecteur initial | Ouvert par défaut au lieu de fermé. | Divergent : H:46. |
| Dimensions | Header 48 dp, waveform 60 dp avec padding, transport 48 dp ; guide 52 / 72 / 44 dp. | Divergent : H:61, H:128, H:131. Recomposer avec l'espace Android, sans copier aveuglément toutes les dimensions iOS. |
| Bibliothèque ouverte | Remplace seulement la waveform, conserve le transport. | Divergent : H:100 ; guide remplace tout l'emplacement waveform + transport. |
| Informations de piste | Titre/BPM/temps affichés alors que la configuration du lecteur décrite dans le guide désactive cette ligne. | Différence de présentation : H:114 ; à arbitrer sans supprimer les informations utiles déjà demandées. |

## 2. État partagé, écoute et préécoute — guide §4

| Contrat | Constat et conséquence | Statut / preuve |
|---|---|---|
| Contrôleur partagé et horloge commune | Un état Wave par room et un moteur audio dédié existent ; les pages utilisent ce contrôleur. | Présent : S:35, M:135, A:199. |
| Identités distinctes | Clips, candidats et attente existent, mais pas le modèle complet soumission/version, couche indépendante, tour de vote et base versionnée. | Partiel : S:16–29. |
| Gains séparés | Guide : candidat 0,75 et couche 0,82. Android : gain de clip commun à 0,65, préécoute rapide à 0,8. | Divergent : S:16–29, A:195, A:282. |
| Mode Mix hors Composition | Doit faire entendre les couches collectives. Le moteur ne les rend audibles qu'en Composition ou sans référence. | Divergent majeur : A:341. |
| Candidat en mode Base | Le guide conserve l'audition privée selon ses règles. Android met son gain à zéro en mode Base. | Divergent majeur : A:351. |
| Mode Boucle | Doit couper le gain de la base sans arrêter sa tête ni retirer sa région. Android désactive la région via `canLoop` et la masque. | Divergent majeur : S:76, S:268–274, H:125. |
| Mode d'écoute sans réordonnancement | `listen` change les gains mais rappelle aussi la configuration de boucle. Ce n'est pas une commutation strictement limitée aux gains. | Partiel : S:268–274. |
| Base mute/solo et candidat déjà collectif | Les règles de réutilisation d'une voix collective et de solo/mute de la base ne sont pas reproduites intégralement. | Partiel : A:329–351. |
| Départ à la prochaine mesure | Candidat préparé puis programmé sur la grille ; l'ancien reste audible jusque-là. | Présent : S:298–310, A:237. |
| Annuler seulement le candidat en attente | `clearCandidate` supprime aussi le candidat déjà audible. | Divergent : A:248, S:298–310. |
| Échec de préparation | Décodage asynchrone et garde de génération présents, mais l'identité sélectionnée n'est pas restaurée comme l'ancien candidat audible en cas d'échec. | Partiel : S:204–230, S:298–310. |
| Préécoute rapide | Le second appui détruit la préécoute au lieu de la mettre en pause avec reprise. | Divergent : A:282. |
| Navigation | Le contrôleur reçoit un booléen Composition ; il ne distingue pas toutes les transitions Propositions ↔ Vote. Sélection d'épingle non mémorisée par couche. | Partiel : S:167, S:269–274 ; H:60. |
| Privé / public | L'atelier met en pause, mais ne publie pas réellement vers RTC et peut garder une préparation en attente. L'interface indique la limite RTC. | Partiel : S:277–281, P:216. Ne pas présenter le routage local comme une diffusion effective. |

## 3. Propositions, gestes et consignes — guide §5

| Contrat | Android | Statut / preuve |
|---|---|---|
| File équilibrée par catégorie | Liste filtrée par statut dans son ordre courant, sans round-robin Basses / Drums / Mélodies / Accords / Nappes / Acapella / FX. | Absent : P:137, S:99. |
| Catégories acceptées à l'entrée | Filtres de statut et bouton ouvert/fermé, pas le contrat complet des catégories autorisées à soumettre. | Partiel : P:118, S:372. |
| Fermer les demandes | État enregistré, mais pas utilisé comme garde complète des imports/entrées de la file. | Partiel : S:372–403. |
| Swipe droit vers Vote | Aucun swipe droit de qualification ; le composant est limité aux offsets négatifs. | Absent : W:124, P:152. |
| Swipe gauche puis motif | Ouvre trois actions « De côté / Passer / Vote », pas une sortie animée suivie d'une plaque de raisons. | Divergent : P:152, P:303, W:124. |
| Arbitrage direction et vitesse | Pas les ratios 1,4 / 1,2, seuil 72 dp, flick projeté, résistance sans droits et rotation ±7° du guide. Rail actuel 162 dp et seuil 28 %. | Divergent : W:124. |
| Transition et sécurité | Pas de machine d'état avec sortie 260 ms, retour sur erreur, motif accessible après animation et ticket de transition. | Absent dans ce parcours : W:124. |
| Motifs | Le dialogue générique ne reproduit pas Hors consignes / Choix artistique / Autre et annulation par retour droit. | Divergent : P:303. |
| Actions de carte | Portrait/catégorie/lecture existent ; badge de grade et téléchargement réel de la boucle ne sont pas les commandes décrites. | Partiel : W:159–192. |
| Tap et appui long | Ouvrent un détail hérité ; pas toutes les distinctions du guide entre qualification, sélection et actions contextuelles. | Divergent : P:157, W:173. |
| Paramètres superposés à deux pages | Bottom sheet BPM/clé, pas panneau Filtres / Règles superposé à la liste. | Partiel : P:329. |
| Règles musicales | BPM entier 40–240, clé texte limitée ; manque BPM décimal jusqu'à 260, mesure 4/8/16, gamme, chromatique et direction éditoriale. | Partiel : S:368–370, P:336. |
| Édition transactionnelle / clavier | Pas le contrat complet brouillon, annulation extérieure, champ flottant IME et tickets des callbacks. | Partiel : P:329. |

## 4. Vote et extensions des cartes — guide §6

| Contrat | Android | Statut / preuve |
|---|---|---|
| Une seule carte développée | Tour ouvert prioritaire puis sélection ou première carte. | Présent : P:165–186. |
| Sélection reliée au candidat audio | La sélection visuelle modifie `selectedVote`, sans reproduire à elle seule la sélection du candidat du contrôleur. | Partiel : P:174. |
| Durées 30/60/90 | Options présentes. | Présent : C:42. |
| Rails durée / volume | Changement de contenu animé, mais pas agrandissement de la surface avec les ancrages et dimensions prescrits. | Partiel : C:33–55. |
| Temporisation volume | 2 200 ms au lieu de 3 000 ms ; interaction détectée à la modification de valeur plutôt qu'au contact initial. | Divergent : C:31, C:68. Risque de fermeture pendant un maintien avant mouvement. |
| Volume | Gain commun 0,65, slider continu, affichage tronqué ; pas candidat 0,75, pas de pas explicite 0,01. | Divergent : C:48–49, S:16–29. |
| Verrouillage | Actions bloquées pendant un vote, pas toutes pendant le chargement ; bouton de préécoute reste actif. | Partiel : C:32, P:182. |
| Message | Bottom sheet et stockage local par nom d'artiste ; pas ouverture de la vraie conversation de room. | Divergent : P:222, S:66–69. |
| Vote de démonstration | Android lance un vote minuté local. Le guide distingue une acceptation simulée immédiate et un vrai parcours de vote minuté. | Divergent : P:188–194, S:459. |
| Résultat | Android accepte si oui > non, donc majorité simple. Guide : seuil 60 % avec électorat valide et résultat sans vote à traiter. | Divergent majeur : S:470–481. |
| Identité et suivi | Pas de tour versionné complet ni de feuille de suivi indépendante avec « Suivre ». Résultat conservé comme texte. | Absent / partiel : S:28, S:459–481, P:194. |
| Remplacement | Un candidat de remplacement existe et l'ancienne couche reste jusqu'au succès. Déclenchement via sélecteur dans Vote, pas le parcours de duel contextuel complet. | Partiel : P:202, S:471–481. |
| Passage en Composition | L'action directe accepte une boucle sans preuve d'un vote positif versionné. | Divergent : S:333–343, P:103. Les mocks peuvent rester, mais le modèle doit représenter leur historique. |

## 5. Lecteur, import et sélection musicale — guide §§7–8

### Aimantation : le défaut signalé est confirmé

`S:254` arrondit le départ à **une mesure**, quelle que soit la longueur choisie. Pendant le glissement, `H:236` déplace visuellement la région de manière continue. Les épingles utilisent également un arrondi à une mesure (`S:185`).

Le guide exige un pas égal à **N mesures** pour une région fixe de N mesures. Avec une origine à zéro, une région de 4 mesures doit commencer aux mesures affichées **1, 5, 9, 13…**, et une région de 8 aux mesures **1, 9, 17…**. La quantification est relative à l'origine de la grille : `origine + floor((position-origine)/pas + 0,5) × pas`. Il faut borner aux blocs valides, sans casser la grille avec un dernier clamp arbitraire en fin de fichier.

La correction devra aimanter l'aperçu pendant le geste et envoyer une seule modification au moteur au relâchement si la région a changé. A–B libre doit rester continu.

| Contrat | Android | Statut / preuve |
|---|---|---|
| Repli sans recréer le moteur | Le moteur est extérieur au contenu animé. | Présent : M:135, H:95. |
| Lecture réelle / préparation | Décodage, cache PCM et commande audio réels, chargement différé. | Présent : S:204–248, A. |
| Rails exclusifs | Import et boucle partagent un état exclusif ; courbe 320 ms proche du contrat. | Présent : H:48, H:200. |
| Fermeture des rails | Pas systématique au changement de référence ou de mode ; effet limité au booléen Composition. | Partiel : H:60. Garder l'ouverture sans base demandée par l'utilisateur. |
| Import Base | Installe une référence audio. | Présent : S:435–457. |
| Import Vote | Crée une boucle ordinaire au statut Vote ; ne crée pas une proposition de nouvelle base. | Divergent majeur : S:435–457. |
| Choix Sans / A–B / 4/8/16/32 | Présents avec gardes de durée ; début basé sur une ancienne région même si inactive, plutôt que position courante dans tous les cas requis. | Partiel : H:167, S:259–266. |
| Retour de lecture | Retourne au cue mémorisé, pas en priorité au début de la région active. | Divergent : S:275–276. |
| Fin de fichier musicale | Position calculée sans clamp empêchant l'affichage d'une mesure fictive en fin exacte. | Divergent : H:138. |
| Scrubbing | Seek direct sans transaction pause / déplacement / reprise, annulation-restauration et garde de référence. | Divergent : H:212–241, S:292. |
| Seek hors région | Pas de clamp au début de la région active conforme au guide. | Divergent : S:292. |
| Préécoute rapide et waveform | Peaks de la préécoute affichés, mais le seek utilise la durée et le transport de base/Composition. | Divergent : H:241, S:292. |
| Geste vertical | Détecteur de drag générique qui consomme le geste ; pas un arbitrage horizontal préservant le scroll vertical. | Divergent : H:223–229. |
| Édition de région | Aperçu local puis commit final présent ; commit même inchangé. Toute la surface peut démarrer un déplacement de région. | Partiel : H:234–239. |
| Poignées proches | Zone horizontale 22 dp, mais pas partage haut A / bas B ni choix de la poignée la plus proche dans tous les cas. | Partiel : H:225. |
| A–B minimum | Minimum visuel en fraction 0,002 puis minimum audio 0,1 s ; les deux ne sont pas la même règle selon la durée. | Divergent : H:234, S:251–256. |
| Dessin musical | Huit subdivisions fixes ; pas grille de mesures BPM ni labels A/B, poignée centrale et bande de sélection des épingles complète. | Partiel : H:242–249. |
| Fréquence d'actualisation | Polling contrôleur 50 ms, soit 20 Hz ; guide position 30 Hz et dessin 60 Hz. | Divergent : S:100–116. Fluidité réelle à mesurer, pas déduire un FPS de l'écran de ce seul intervalle. |

## 6. Composition et épingles — guide §9

| Contrat | Android | Statut / preuve |
|---|---|---|
| Couches provenant des votes | Filtre `inComposition`, pas résultat positif fermé + version de soumission. | Divergent : P:103. |
| Carte Mix sans Play | Play reste présent et swipe de commandes hérité également. | Divergent : W:187, P:107. |
| Mute / Solo / Volume / retrait | Commandes reliées au moteur et exclusion mute/solo présentes. | Présent : S:344–350, C:70–102. |
| Gain et temporisation | Gain commun au candidat, défaut 0,65, délai 2,2 s au lieu de couche 0,82 et 3 s. | Divergent : S:16–29, C:68. |
| Identité musicale d'épingle | ID clip/base et mesure entière, pas base versionnée + startBeat/lengthBeats. | Partiel : S:29. |
| Première épingle | Part de la position, pas systématiquement du début de région ; rejette les bases trop courtes au lieu de tronquer la première. | Divergent : S:170–181. |
| Doublon exact | Cherche une autre place au lieu de sélectionner l'épingle existante. | Divergent : S:170–181. |
| Ajouter la suivante | Recherche mesure par mesure, vers l'avant uniquement ; pas blocs de longueur N avec retour au début. | Divergent : S:170–181. |
| Plus sans place libre | Reste activé si base prête ; échec signalé seulement à l'action. | Divergent : C:87. |
| Déplacement | Arrondi à une mesure, tous chevauchements rejetés. Guide : aimantation N et chevauchement manuel autorisé sauf doublon exact. | Divergent : S:183–196. |
| Déplacement sans seek | Mise à jour des placements moteur, pas de recherche de transport à chaque déplacement. | Présent : S:183–202. |
| Suppression / mémoire | Efface la sélection sans choisir la suivante/précédente ; pas mémoire par couche. | Divergent : S:167, S:198. |
| Rail d'épingles | Pas d'autocentrage, fades de bord et cibles 44 dp complets. | Partiel : C:82. |
| Sélection sur waveform | Pas de bande dédiée 20 dp ni cycle des épingles superposées. | Absent : H:249. |
| Rendu audio | Placements effectivement appliqués aux voix ; le modèle actuel de chevauchement empêche de reproduire tous les cas du guide. | Partiel : A:339. |

## 7. Bibliothèque, exports et routes — guide §§10–11

| Contrat | Android | Statut / preuve |
|---|---|---|
| Bibliothèque des bases | Liste verticale, pas carrousel horizontal récent d'abord avec focus séparé de la base active. | Partiel : H:100–110. |
| Activation protégée | Pas de verrouillage complet pendant vote/chargement ; sélectionner la même base réinitialise aussi. | Divergent : H:102, S:283–290. |
| Transition de base | Pause, cue et grille réinitialisés ; route publique non remise au privé, pas restauration d'arrangement versionné. | Partiel : S:283–290. |
| Partager base / exporter arrangement | Pas les deux parcours distincts avec progression et annulation. | Absent du parcours bibliothèque : H:100–110. |
| Retour DAW | Pas export multipiste/retour avec revue des crédits conservés, retravaillés, retirés et protection contre le double rendu. | Absent dans le modèle S et la bibliothèque H. |
| Restaurer les couches retirées | Pas le parcours complet de restauration décrit. | Absent du parcours bibliothèque. |
| Routes secondaires | Présence de fenêtres héritées de détail et de réglages ; elles ne remplacent pas les fenêtres de suivi/duel/conversation du guide. | Partiel : P:222–329. |
| Routes iOS déclarées inactives | Leur existence dans les sources n'oblige pas à créer de nouveaux boutons Android. | À conserver comme exclusion du périmètre, conformément au guide. |

## 8. Multipiste du Mixeur — guide §12

Ce lecteur est distinct du lecteur permanent de l'onglet Wave. Sa piste principale lit réellement un audio ; ses pistes supplémentaires ne reproduisent pas encore le multipiste du guide.

| Contrat | Android | Statut / preuve |
|---|---|---|
| Ordre transport | Actuel : Privé, Répéter, Précédent, Play, Suivant, Importer, Pistes. Guide : Privé, Importer, Précédent, Play, Suivant, Répéter, Déplier. | Divergent : M:1057–1065. |
| Précédent / Suivant | Activés avec une piste, callbacks vides. | Défaut fonctionnel : M:1058, M:1060. Désactiver tant qu'aucune navigation réelle n'existe. |
| Privé/public | Change le booléen sans pause du lecteur. | Divergent : M:307–321. |
| Repli couplé à la géométrie | Deux instances de deck, compact et overlay développé, plutôt qu'un seul état de progression et géométrie couplée. | Divergent : M:709–746. |
| Pistes indépendantes | Compteur `extraLaneCount`, une seule URI audio principale ; une piste supplémentaire appelle le même import principal. | Absent mécaniquement : M:118, M:145, M:1106. |
| Suppression ciblée | Callback reçoit un index mais décrémente seulement le nombre de pistes. | Divergent : M:307–321. |
| Import dossier / ZIP | Bouton câblé sur l'import audio simple. Ne pas le confondre avec les imports dossier/ZIP existants dans Propositions. | Divergent : M:321, M:1118 ; comparer S:373–403. |
| Swipe de piste M/S/Retirer | Pas le rail stationnaire, waveform translatée, sélection par ID, vitesse/projection et fermeture exclusive prescrits. | Absent : M:1223–1257. |
| Remplacement de sa propre piste | Impossible avec le modèle actuel à URI unique. | Absent : M:145, M:1106. |
| Waveform principale | Affichage présent ; pas de geste de seek câblé sur la piste déjà chargée dans ce composant. | Partiel : M:1147–1151. |

## 9. Animations, accessibilité, tâches asynchrones — guide §§13–14

| Point | Constat | Preuve / statut |
|---|---|---|
| Rail du lecteur | Courbe Bézier et durée 320 ms présentes. | H:200, présent. |
| Rails des cartes | Tween 220 ms et translation relative à la largeur ; pas déplacement ±16 dp et ressort décrit. | C:38, divergent. |
| Ressorts | Des ressorts Compose existent ; leurs paramètres ne constituent pas à eux seuls une équivalence démontrée aux ressorts SwiftUI. | H:49, W ; partiel. |
| Réduire les animations | Pas de branche explicite remplaçant translation/rotation par fondu 150 ms. | H/C/W, absent dans ces composants. |
| Contenus en sortie | Composés pendant les transitions ; pas de verrouillage explicite complet des actions et de l'accessibilité des anciens rails. | H:95, H:200, C:38 ; risque à contrôler sur appareil. |
| Cibles tactiles | Plusieurs commandes à 36/38 dp au lieu de 44 dp minimum, notamment cartes et épingles. | C:110, W ; divergent. |
| Accessibilité | Des descriptions d'icônes existent, mais pas toutes les descriptions de valeur/état des sliders et commandes M/S. | C/W, partiel. |
| Cache waveform | Cache PCM/peaks par source présent ; mélange des peaks recalculé par getter plutôt que cache d'arrangement. | A, S:77–90 ; partiel. |
| État d'import | Une tâche d'import appelle une autre tâche asynchrone ; le drapeau global peut retomber avant la fin du décodage. | S:373–403, S:435–457 ; divergence de cycle de vie. |
| Tickets | Protection de préécoute présente, mais pas généralisation aux imports, tours, gestes de référence et transitions de qualification. | S:204–230, S:298–310, S:459 ; partiel. |
| Arrêt de lifecycle | Arrêt de lecture au passage en arrière-plan et libération du contrôleur présents. | M:135 ; présent. |

## 10. Ordre recommandé des corrections

1. **Sélection musicale** : une grille partagée avec origine, pas N pour régions et épingles, aperçu aimanté, limites valides, commit unique ; scrub transactionnel et arbitrage horizontal/vertical.
2. **Écoute** : règles exactes Base/Boucle/Mix, continuité de la référence, ancien candidat préservé lors de l'annulation du prochain, gains séparés.
3. **Modèle métier** : identité soumission/version/couche/tour/base ; import Vote comme proposition de base ; distinction démo instantanée et vote minuté ; règles 60 %, suivi et remplacement.
4. **Propositions** : qualification droite/gauche, motifs et transitions protégées ; catégories d'entrée, règles musicales complètes et édition transactionnelle.
5. **Composition** : épingles, recherche circulaire par blocs, doublons, chevauchement manuel, sélection et mémoire ; commandes correctement verrouillées.
6. **Bibliothèque et exports** : focus/activation, transitions de base, exports distincts et retour DAW.
7. **Multipiste Mixeur** : pistes identifiées et audio indépendant, import/remplacement/retrait par piste, vrai rail M/S, repli unique ; retirer l'état actif des boutons sans mécanique.
8. **Finition transversale** : timers 3 s, dimensions, animations, accessibilité et gestion des contenus masqués en conservant la DA et les adaptations Android demandées.

La recette du guide devra ensuite être exécutée explicitement sur Android : plusieurs longueurs de bases, régions 4/8/16/32, changement de référence pendant les gestes/imports, candidat en attente, modes d'écoute, votes, épingles superposées, pistes multiples, réduction des animations et clavier. Elle n'a pas été exécutée dans cet audit.

## Livraison de cette passe

Audit uniquement, sans correction fonctionnelle ni changement de la DA. La couleur du sélecteur est déjà reliée au matériau Simple / Pro depuis `26075c6`. Le point d'aimantation signalé par l'utilisateur est un défaut confirmé du code, pas une simple impression visuelle.
