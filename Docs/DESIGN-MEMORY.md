# Mémoire de design — Meewav Android

## Profil mobile — continuité avec la messagerie

Le 15 septembre 2026, l'utilisateur demande d'adapter les composants du profil
Web, en conservant leur fond et leurs matières. Les **CTA principaux du profil**
reprennent exactement la finition de messagerie décrite ci-dessous ; les menus
et sous-menus reprennent ses bandeaux translucides, son flou et son trait effilé.
La disposition iOS du dock est conservée (3 icônes + globe + 3 icônes), avec le
globe **de la navbar Android**, et non le globe iOS.
Voir [l'audit et les sources du profil](Profile/README.md).

À la demande suivante du 15 septembre, le petit globe du dock Profil tourne
lentement : un tour horizontal complet en **40 secondes**, mouvement linéaire
continu. La carte défile vers la gauche, la silhouette et l'éclairage restent
fixes. Une texture répétée est préparée une seule fois ; seule sa translation
CSS est animée, sans redessin du canvas à chaque image. La rotation se met
en pause quand Android quitte le profil et respecte la réduction des animations.
Le petit globe des autres écrans reste fixe par défaut.
Le globe du dock Profil n'a **aucun stroke blanc ni ombre extérieure**.
L'encoche est concentrique au globe et réserve environ 6 px transparents
autour de sa partie encastrée : on voit le fond, sans anneau ajouté.

### Accueil du profil — finition après captures Samsung

Le bandeau supérieur reprend la matière du champ de saisie de messagerie.
Le 16 septembre, l'utilisateur demande une transparence plus visible : le titre
Profil et ses quatre onglets utilisent `--profile-header-glass`, soit
`linear-gradient(125deg,#ffffff08,#ffffff02 48%,#ffffff05),#17191f40`,
avec `blur(24px) saturate(1.15)`. Seul le fond est translucide, les textes et icônes
restent à pleine opacité. Les autres bandeaux gardent `--profile-mobile-glass`.
Reflets et ombre :
`inset 0 1px 0 #ffffff12,inset 0 -1px 0 #0003,0 6px 20px #0004`.
Le 16 septembre, l'utilisateur demande de réessayer le dock **transparent avec
blur**, après la version violette opaque. Le jeton actif est `--profile-dock-glass` :
`linear-gradient(125deg,#ffffff08,#ffffff02 48%,#ffffff05),#281a4a47`, avec blur 22 px.
Il garde une légère teinte violette et laisse voir le contenu derrière. Les icônes
partagent une seule surface. La version opaque précédente reste un repère historique
(`#382961 → #302351 → #33245b`), pas le réglage actif.
Les icônes reposent sur cette surface commune, sans pavés individuels ;
l'icône active est indiquée par un petit trait effilé lumineux.

Le bandeau reste hors de la zone défilante : seul `.profile-main` défile.
La zone de scroll commence **sous le bandeau Profil et ses onglets**, à 100 px :
aucune carte ne doit passer derrière ce bandeau transparent. Dans Médias et Espace
privé, le contenu passe uniquement derrière le sélecteur de destination de 48 px.
Les positions de scroll internes réservent 60 px pour ce sélecteur, pas 160 px.
Le bandeau du sélecteur et les filtres déroulants utilisent un verre noir à légère
teinte violette (`--profile-selector-glass`), pour supprimer leur dominante grise.
La navbar est ancrée à `bottom: 0` dans la WebView. Android réserve déjà
l'espace des barres système : ne pas ajouter un second `safe-area-inset-bottom`
ou une marge qui la ferait flotter au-dessus de la navigation Samsung.

L'accueil privilégie une identité compacte (portrait et nom côte à côte),
trois compteurs sur une ligne, puis les cartes Activité, Progression,
Classement, À faire maintenant et Activité récente. Progression et Classement sont
séparés. Les cartes sont en verre fumé sombre neutre, avec un contour fin,
sans empilement de surfaces violettes. Les CTA conservent la référence ci-dessous.

### Statistique — panneaux dépliables

Portée, Engagement, Revenus et Progression sont quatre panneaux indépendants.
Chaque en-tête affiche sa valeur, sa variation et un chevron ; le graphe se
déplie vers le bas dans sa propre carte et se replie au même endroit. Les quatre
panneaux sont initialement fermés, peuvent rester ouverts ensemble et conservent
leurs points sélectionnés pendant la fermeture. La période reste commune.
À la demande suivante, les courbes et accents retrouvent exactement les couleurs
du site : Portée violet `#8b5cff`, Engagement magenta `#d946ef`, Revenus vert
`#34d399`, Progression bleu `#19b8ff`. Cette exception s'applique aux métriques,
pas aux CTA principaux. Un tap affiche date et valeur dans un panneau superposé
à la courbe, sans chips supplémentaires sous le graphe. Une valeur active par
graphe évite les chevauchements sur mobile. La couleur ne remplace jamais le libellé.

### Profil mobile — Médias

Médiathèque, La Cage, Setlist, Cadeaux et Badges sont accessibles via un seul
sélecteur déroulant dans un bandeau fixe en verre de 48 px sous les quatre onglets
principaux. Les filtres secondaires utilisent aussi un sélecteur, sans rangées
de chips. La médiathèque affiche une liste compacte avec covers. Un seul défilement
vertical porte le contenu ; le sous-menu ne doit jamais recouvrir les commandes.
Icônes neutres, texte blanc à la sélection et trait effilé lumineux, sans
deuxième soulignement droit ni code couleur rose/orange/bleu par outil.
Les listes et cartes sont en graphite fumé, avec des cibles tactiles de 44 px
pour les commandes principales et les menus. Les CTA de création gardent le
violet urbain ; les actions répétées sur les cartes restent secondaires.
Les images, badges officiels, fichiers et services importés du Web sont conservés.
Les titres introductifs sont condensés pour laisser voir les contenus sur mobile.

### Profil mobile — Espace privé

Les six modules sont accessibles via un seul sélecteur déroulant, sans double
rangée, dans un second bandeau de 48 px fixe à 100 px du haut. Il utilise
exactement `--profile-mobile-glass`, comme les bandeaux de la messagerie,
et laisse défiler le fond et les cartes derrière lui. Aucun panneau opaque ajouté.
Les anciens tableaux de portefeuille et de transactions deviennent des lignes
mobiles sans déplacement horizontal. Référence, date, type, statut et montant
restent présents dans Transactions. Les fiches de contrats, matériel et membres
sont accessibles au tap avec défilement vers la fiche et retour à la liste.
Les actions en double sont retirées du contenu quand elles existent déjà en haut.
Les services, garde-fous d’authentification et confirmations restent inchangés.

### Médias locaux du profil Android

La copie des chemins publics doit inclure `/media/`, en plus de `/audio/`.
Sans ce répertoire, les cartes sont visibles mais leurs MP3/MP4 échouent au Play.
`node scripts/build-profile.mjs --sync-media` synchronise uniquement les médias
référencés depuis le Web, sans réimporter les sources ni remplacer les autres assets.
Les fichiers sont empaquetés avec leur qualité d’origine et servis par le lecteur
local Android existant, qui gère les requêtes Range.

## Violet urbain Meewav — référence de messagerie

Le 15 septembre 2026, l’utilisateur précise la référence exacte :
**Groupes → Membres → Inviter**, comme **notre violet urbain**. Le rond d’envoi
(icône enveloppe/avion) et tous les CTA principaux de la messagerie doivent
reprendre cette finition.

Source visible prioritaire : le bouton `.agw-primary-button` « Inviter » de
`ArtistGroupsWorkspace.tsx`, dans la vue Membres. Sa finition Android vient du
jeton partagé dans `app/src/main/messaging-source/mobile.css`.
Ne pas prendre une ancienne couleur de sa feuille Web avant les surcharges Android.

- Dégradé : `linear-gradient(135deg, rgba(79,53,158,.96), rgba(76,47,169,.94))`.
- Couleurs : **#4F359E → #4C2FA9** ; conserver l’angle et les opacités.
- Bordure : `rgba(98,67,192,.34)`.
- Reflet et ombre : `inset 0 1px 0 rgba(255,255,255,.14), 0 8px 24px rgba(57,38,114,.28)`.
- Variables communes : `--meewav-violet-urbain`, `--meewav-violet-urbain-cta`,
  `--meewav-violet-urbain-rim` dans `app/src/main/messaging-source/mobile.css`.

Cette décision remplace les références précédentes **pour les CTA de messagerie**.
Ne pas réinventer un violet mat, rose ou prune à chaque modification.
Les états interactifs gardent ce dégradé. Le rond d’envoi conserve **une opacité de 1**,
y compris avec un champ vide : l’ancienne opacité de 0,4 altérait son violet.
Son icône seule passe à 0,45 quand il est désactivé ; l’envoi reste réellement
désactivé, sans permettre de message vide. Les boutons secondaires restent neutres.
Les bulles conservent les formes et couleurs du site demandées séparément.
Le bandeau et le champ de saisie en verre restent inchangés.

## Profil — finition des cartes de contenu, 16 septembre 2026

Les bandeaux ont été validés par l'utilisateur ; la dernière demande vise les
contenus trop gris. Le jeton `--profile-content-surface` de `profile-source/mobile.css`
est distinct du verre de navigation : base noir fumé #181920 vers #0A0B10, reflet
discret #4F359E à faible opacité dans l'angle supérieur. Il alimente les cartes
Accueil, Statistique, Médias et Espace privé. Ne pas le propager aux bandeaux,
au sélecteur, au dock ni aux CTA. Les couleurs sémantiques des graphes et badges
restent celles du Web. La revue visuelle sur le Samsung a été effectuée sur chaque destination du profil.
Cette finition de contenu reste distincte du violet de CTA validé par l'utilisateur.

## Navigation commune et retour — 16 septembre 2026

Le chevron supérieur ferme d’abord la fiche ou revient à la page précédente dans
la feature ; à sa racine il appelle `/native/back`, qui termine uniquement
l’activité courante. Android retrouve ainsi la feature d’origine avec son scroll
et son état. Seul le globe de la navbar utilise explicitement `/native/globe`.
Le Marketplace conserve une pile de ses rubriques pilotées par état React,
avec filtres, recherche et position. Les retours inter-features utilisent la pile
Android existante ; aucune remise à zéro forcée sur le globe.

FeatureDock est partagé entre Profil, Tremplin, Marketplace, Scène et Messagerie.
Son portail le place hors des conteneurs qui coupent le contenu. Matière et encoche
restent celles du Profil, six icônes et globe central, au contact de la barre système.
Une poignée replie / déplie la navigation. Hors conversation, un déplacement tactile
vers le bas de 56 px la replie, une remontée de 28 px la révèle ; les scrolls
programmatiques et les carrousels horizontaux ne déclenchent pas ce comportement.
Les gestes courts ont un seuil pour éviter les oscillations. Une action manuelle
suspend brièvement l’automatisme. La réduction des animations est respectée.
La poignée n’a plus de conteneur visible : seul le chevron flotte au-dessus
du dock, avec une ombre portée discrète ; la zone tactile de 64 × 28 px est
conservée. Bundles des cinq features reconstruits.

Dans une conversation la navbar commence repliée et reste manuelle, afin que
la lecture ne fasse pas bouger le champ de message. Le champ et son contenu sont
réservés au-dessus de la navbar ; à la saisie elle disparaît pour le clavier.
Les fenêtres de détail masquent la navbar et gardent leurs boutons accessibles.
Rooms conserve son message de disponibilité, sans route fictive.

Le fond Marketplace en essai utilise désormais la variante utilisateur (4),
`ChatGPT Image 12 sept. 2026, 23_51_01 1 (4).png`, sans changement des autres fonds.
Compilation de livraison ; pas de tests ni de nouvelle inspection visuelle automatique.

## Fond Marketplace — nouvelle variante, 16 septembre 2026

L’essai utilise maintenant la même image que le Tremplin, `/images/meewav-acoustic-violet-background.png`, déjà présente dans les assets Market et trackée par le manifeste ; la surcharge `mobile.css` pointe vers ce fichier. Le périmètre reste le Marketplace uniquement ; le fond initial et `background-mobile-trial.png` restent disponibles pour revenir en arrière.

## Accents Marketplace et chargement vinyle — 16 septembre 2026

À la demande de l’utilisateur, les accents par pilier du site sont rétablis
en palette choisie : Neuf saphir `#5D7FF2`, Occasion orange ambré `#E08F45`,
Location lagon `#35C2C4`, Services améthyste `#B07CE8`, billetterie/Rooms
framboise `#E56B8C`, Achat groupé émeraude `#34B78F`. Les badges des cartes,
le bouton panier de la navbar (icône, badge, halo) et l’icône d’action des
miniatures suivent l’accent du pilier — la miniature hérite de la couleur
de sa propre carte, la navbar de l’onglet actif. Vérifié par captures
Samsung : Neuf bleu et Occasion orange sur panier, miniatures et chips.
Le fond Marketplace revient à l’image acoustique violette du Tremplin après
l’essai utilisateur refusé ; `background-mobile-trial.png` reste en réserve.
Le chargement entre features affiche le même disque vinyle que le globe :
`scripts/feature-loading.mjs` injecte le markup statique (rotation par
keyframes CSS, sans JS) dans chaque `index.html` généré ; React le remplace
au montage. Les cinq bundles et l’APK sont reconstruits.
L’icône de l’onglet actif de la topbar (`market-pillar-tabs`) reprend
également la couleur de sa chip via `--meewav-pillar-tab-accent` — accent
défini par onglet dans `MARKET_NAV_ITEMS`, donc Accueil reste blanc
`#f7f5ff` quand il est actif.
Le catalogue des onglets passe en **une seule colonne de cartes
horizontales** (demande utilisateur, validé par captures sur les 5
piliers) : vignette carrée ~122 px en `cover` à gauche, fondu du bord
droit vers le corps, cœur flottant sur la vignette, eyebrow et badge à
l’accent du pilier, prix fort + disque d’action accentué en bas à droite.
Les media queries ≥600 px gardent `1fr`. Les rails de l’accueil
(`market-mini`, `market-home-hero`) ne sont pas touchés.
Pour gagner de la place, la rangée de chips de filtres
(`market-filter-chips`) et le portrait (`market-brand__portrait`) sont
masqués en mobile — les filtres restent accessibles via l’icône
réglages de la recherche.
La fiche produit gagne un **zoom photo plein écran** : bouton expand
`Maximize2` empilé sous le bouton fermer en haut à droite de la media,
overlay `fixed inset: 0` (au-dessus de la status bar en edge-to-edge)
au z-index 52010, image en `contain`, fermeture au tap, au bouton X ou
à Échap, focus restauré sur le bouton expand ; le bouton de l’overlay
dégage `env(safe-area-inset-top)`. Le CTA location hors-live passe de
« Réserver ces dates » à « Réserver ». Bundle Market reconstruit ;
l’APK n’a pas pu être recompilé ici (`JAVA_HOME` absent), à refaire en
local pour tester sur appareil.


## Wave native — matière noire Hi-Fi, 19 septembre 2026

L'ajout de régie vidéo du commit d8d239c a été annulé (eae6971). La référence
reste le retour vidéo, le mixeur et le chat natifs de 9233783. Ne pas réintroduire
le retour vidéo à hauteur variable qui poussait le mixeur.

La navbar du mixeur, les cartes Autotune/Réverb, leur sélecteur et le lecteur
partagent maintenant `hifiBlackSurface` / `HiFiBlackCard` : noir neutre, bombé
peu profond, reflet supérieur large et faible, un seul liseré discret. Aucun
métal brossé en image, aucune gorge ou succession de strokes blancs sur ces
conteneurs. Les cartes FX gardent leur matière noire même éteintes ; le texte,
les icônes et les contrôles portent l'état. Les dimensions, le retour vidéo,
les gestes et le moteur audio restent ceux de la référence native.
Compilation de livraison uniquement ; rendu à valider par l'utilisateur.

### Chat Wave Android — champ web, 19 septembre 2026
- Suppression de l'encart de démonstration épinglé « Envoie ta boucle ».
- Champ natif adapté de Meewav-Web/src/features/rooms/place/place-chat-composer-glass.css : capsule noire, champ creusé, reflets statiques, touche d'envoi éclairée pendant la saisie, emojis conservés.
- Rail d'indicateurs conservé ; cadeau remplacé par une roue crantée ouvrant les émoticônes ou le retour au direct.
- Compilation de livraison uniquement ; appréciation visuelle laissée à l'utilisateur.

### Essai Autotune lumineux — 19 septembre 2026
- Autotune/Réverb désactivés : titres, icônes, valeurs et curseur atténués en gris, châssis noir conservé.
- Halo violet discret uniquement autour de l'Autotune activé, transition 200 ms. Essai utilisateur avant éventuelle extension à Réverb ; ne pas généraliser sans son retour.

### Ajustement chat Wave — capsule unique, 19 septembre 2026
- Remplace le double conteneur du composer web par une seule capsule gris translucide et une touche d'envoi distincte.
- Envoi violet basé sur capsuleAccent (#7E44E3), suppression du dégradé bleu électrique.
- Rail d'indicateurs affiné, indicateurs répartis régulièrement en hauteur sans séparateurs superflus.

### Saisie chat et clavier Samsung — 19 septembre 2026
- Capsule de saisie étendue sur toute la largeur ; enveloppe violette intégrée, sans bouton carré externe.
- La Wave consomme les insets du clavier avec imePadding, après ceux de navigation, sans seconde animation.
- En Chat, le retour vidéo reste monté à sa taille d'origine mais sa fenêtre se réduit si nécessaire pour laisser place aux messages et au champ. Retour au cadrage normal à la fermeture du clavier.
- Rail défilable quand la hauteur disponible diminue ; quitter Chat replie le clavier.
- Compilation de livraison ; comportement visuel à apprécier sur Samsung par l'utilisateur.

### Rail Hi-Fi et outils du chat — 19 septembre 2026
- Rail natif : matériau hifiBlackSurface partagé avec la navbar, largeur utile 44 dp, hauteur maximale 332 dp, sept emplacements réguliers ; défilement si clavier ouvert.
- Remplacement de la roue crantée par la clé d'outils. Suppression du doublon d'accès aux emojis et du retour au direct dans ce menu.
- Référence consultée : Meewav-iOS/Meewav/Features/Rooms/Components/Classe/ClasseSocialChrome.swift, CageHostToolsButton, ClasseHostToolsPalette et ClasseHostPollToolEditor. Palette iOS trouvée : Sondage.
- Adaptation native de l'éditeur (Oui/Non, multiple 2–6 réponses, notes sur 5/10, durées 30/60/120s), annonce dans le chat, arrêt/expiration/nouveau sondage. Démo locale explicite ; aucun vote inventé ni connexion serveur ajoutée.
- Compilation de livraison uniquement, pas de QA automatique.

### Fin de l'essai glow Autotune — 19 septembre 2026
- Retour utilisateur : mieux sans halo. Halo, contour violet et animation associés retirés ; ne pas les étendre à Réverb.
- Conservation du châssis noir Hi-Fi et des textes/commandes grisés lorsque les effets sont désactivés.

### Émojis dans la saisie Wave — 19 septembre 2026
- Croix explicite dans le mur d'émoticônes ; hauteur adaptée à l'espace restant quand le clavier Samsung est ouvert.
- Saisie native EditText avec ImageSpan : les assets Meewav remplacent visuellement les références [[mw:...]], un caractère éditable par image, insertion à la sélection et envoi sérialisé compatible avec les messages existants.
- Conservation de la composition IME quand le brouillon ne change pas, limite de 1000 caractères sérialisés. Aucun remplacement du brouillon pendant une simple recomposition Compose.
- Compilation de livraison, sans QA automatique.

### Outils Wave : mise en avant et formats binaires — 19 septembre 2026
- Ajout de Mise en avant : choix parmi les messages du host, snapshot fixé hors du flux défilant, sans expiration, conservé au niveau de l'écran lors des changements d'onglets. Retrait/remplacement explicite ; suppression du message épinglé le retire aussi du bandeau.
- Émojis rendus dans le bandeau et dans la liste de sélection. Message long résumé sur deux lignes ; intégralité disponible dans Mise en avant.
- Sondages : exactement Oui/Non, Pour/Contre, Pouce vers le haut/Pouce vers le bas (icônes bleues). Suppression du choix multiple et des notes 5/10. Démo locale inchangée, pas de vote serveur.

### Chat Wave : portraits et icônes — 19 septembre 2026
- Avion en papier pour envoyer ; trois points horizontaux pour ouvrir les outils du chat.
- Dix portraits locaux repris de la banque Tremplin/Scène (sceneArtistPortraits.ts), artistes ajoutés au flux de démonstration.
- Avatars existants conservés. Les participants sans image ont un portrait stable ; suppression du fallback avec une lettre.

### Panneaux du chat Wave — 19 septembre 2026
- Icône Dashboard retirée sous les trois points ; rail recalibré à six emplacements (286 dp max).
- Cloche reliée à un bottom sheet natif avec notifications de démonstration, portraits, fermeture et défilement. Badge calculé depuis les données ; lecture conservée dans l'écran au changement d'onglet.
- Appui long : bottom sheet noir Hi-Fi, portrait et aperçu riche du message, sections d'actions espacées, suppression distincte, croix/fermeture par geste. Mise en avant du host et suppression locale conservées.
- Actions de modération préexistantes toujours sans câblage serveur ; cette passe modifie leur présentation, pas leur mécanique.
- Compilation de livraison uniquement.

### Invités Wave natifs — 19 septembre 2026
- Audit source iOS documenté dans Docs/ANDROID-WAVE-GUESTS-IOS-AUDIT.md.
- Nouveau parcours natif : candidatures/invitations, coulisses, scène ; aperçu au tap, sélection longue, glisser vers la vidéo pour monter et retour vers le panneau pour redescendre.
- Capacité trois invités, géométrie duo/trio/quatre, état conservé entre onglets, matériau Hi-Fi existant. Ne pas remplacer l'écran par l'ancienne régie WebView.
- Démo locale avec portraits, contrôles micro/caméra locaux. Aucun raccordement RTC/Supabase à cette room native fictive ; BytePlus différé par l'utilisateur.

### Rail du chat Wave — partage et centrage
- Rail noir Hi-Fi centré verticalement entre la navbar principale et la barre de messages ; hauteur compacte bornée à l'espace disponible.
- Fins séparateurs gris entre actions, indicateurs et partage. Partage Android natif du descriptif de la session de démonstration, sans inventer de lien de room.


### Chat live compact
- Texte rapproché du nom, intermessages réduit, heures supprimées.
- Suivi automatique actif à l'ouverture ; le défilement manuel le suspend et révèle Revenir au direct. Les nouveaux messages restent reçus.
- Exemple de don de KÉO (10 euros) dans la cloche ; notifications toujours de démonstration locale.


### Navigation secondaire des invités
- Demandes à gauche, Coulisses au centre, Scène à droite. Coulisses reste l'ouverture par défaut.
- Libellés et compteurs discrets sans châssis ni capsules, fin repère violet fondu ; cibles tactiles 44 dp conservées.


### Régie vidéo native — adaptation des compositions web
- Menu compact sur la vidéo : Ensemble, Mise en avant, Solo, choix de la personne principale. Repli sur le host si la personne quitte la scène.
- Formats des sources séparés du viewport : duo mixte 70/30, colonnes Short, grille à trois/quatre et focus adapté au viewport. Média contenu sans déformation.
- Plein écran natif séparé : ne redimensionne pas le mixeur. Fermeture par croix ou retour Android. Libération de la vidéo à la sortie.
- Sources toujours locales (boucle host et portraits démo). Ni RTC, ni synchronisation Supabase, ni auto-director audio ne sont annoncés comme raccordés. BytePlus reste différé.
- Référence : Meewav-Web PlaceStage.tsx, placeStageLayoutEngine.ts, placeStageLayout.css. Compilation de livraison uniquement, aucune QA automatique.


### Plein écran mobile à deux
- En portrait, deux personnes occupent chacune une moitié pleine largeur : haut/bas, indépendamment du format des sources. Ensemble et Mise en avant suivent cette règle ; Solo conserve une personne.


### Filtre invités repris des Rooms web
- Bouton filtre après Inviter, badge du nombre de critères. Panneau natif noir Hi-Fi à trois sections repliables : 28 styles illustrés du catalogue web, niveaux 1 à 6, préparation micro/caméra, latence <=80 ms et Green House.
- Brouillon avant application, compteur de résultats, Tout effacer. OU au sein d'une catégorie, ET entre catégories, comme sur le web. Filtres sur Demandes/Coulisses/Scène ; ils ne retirent personne de la vidéo.
- Niveaux et latences du roster sont explicitement des données de démonstration.


### Coulisses peuplées et filtres mobiles
- 24 profils en coulisses et plus de 32 demandes en démo. États illustrés connexion perdue, signal faible, latence, micro/caméra coupés ; une connexion perdue bloque la montée sur scène.
- Filtre en LazyColumn, décodage de miniatures hors du fil UI avec cache, images originales conservées. CTA violet assourdi #453677.
- Six vrais badges exportés directement du composant SVG React canonique via scripts/export-wave-grade-badges.cjs.
- Sélection des 8/16/32 premières demandes correspondant aux filtres, uniquement dans Demandes, appliquée au bouton inférieur sans accepter automatiquement.


### Demandes : sélection et barre d'actions
- Multi-select à côté d'Ouvrir/Fermer les demandes. Tap sur une demande ou appui long active la sélection ; cases visibles et sélection des lots 8/16/32 compatible.
- Bandeau noir Hi-Fi inférieur : compteur, Annuler, Passer en coulisses, Refuser. Actions désactivées sans sélection. Refuser retire uniquement les demandes sélectionnées ; passage direct en coulisses, sans mise sur scène.
- Actions locales de démonstration, pas de notification distante envoyée.


### Mixeur et deux rails invités
- Entête des deux faders mutualisée : nom avec ellipse, plus de libellé Audio, note centrée sur son fader et petit séparateur vertical.
- Invités sur deux rangées en LazyHorizontalGrid. Reconnaissance du drag vertical uniquement pour laisser le geste horizontal au rail.
- Barre d'actions noire Hi-Fi fixe : Message, Aperçu, Scène/Demandes/Coulisses selon la section, Retirer/Refuser. Commandes désactivées sans sélection ; capacité et connexion vérifiées avant montée.
- Composer privé avec clavier et historique local par invité pour la démo. Aucune livraison serveur annoncée.


### Invités : tap, appui long et Greenhouse
- Tap simple : sélection unique et fiche d'actions. Appui long : multi-sélection sans fiche ; les taps suivants modifient la sélection.
- Demandes REQUESTED -> Greenhouse INVITED -> Coulisses BACKSTAGE -> Scène STAGE. Pas de caméra ni de commandes média dans la fiche d'une demande.
- Fiche avec vrai badge, message privé démo et pré-profil natif compact (portrait, rôle, grade). Greenhouse est désormais un onglet distinct.


### Correction explicite : Greenhouse invisible
- Greenhouse est une étape interne, jamais un onglet ni un libellé utilisateur. Interface : Demandes / Coulisses / Scène. Cette règle remplace l'entrée précédente.
- Préparation interne conservée ; bouton visible Passer en coulisses. Aucun aperçu caméra pour les profils de la liste Demandes, y compris ceux en préparation.
- Le module actuel reste une démo locale ; ne pas prétendre avoir raccordé la préparation serveur.


## Wave — source du lecteur, 19 septembre 2026
Le lecteur permanent Wave demandé se trouve sur Meewav-iOS origin/wave/host-hardware-c97a (20ef578), et non sur main aea7251. Garder : barre principale > sous-menu Propositions / Vote / Composition > lecteur fixe repliable. Référence des cartes : les conteneurs noirs déjà validés dans Propositions ; portrait, Play, seul le chip de catégorie porte sa couleur. Importer les rails animés et la mécanique du workflow de cette branche, ne pas inventer un transport différent. Voir Docs/PORTAGE-WAVE-IOS-ANDROID.md pour les capacités et limites.

Wave : les chips de catégorie (Drums, Basse, Mélodie, Accords, Nappe, Acapella, FX) doivent être vifs et saturés, uniquement les chips. Garder les cartes noires et les CTA dans le violet urbain. Le bouton du sélecteur de boucle doit toujours pouvoir ouvrir son rail animé, même sans base ; seuls les choix audio non disponibles sont désactivés. Import lecteur : icône classique de téléchargement, flèche vers le bas sur un trait.

Wave : l’état sélectionné Base / Boucle / Mix utilise exactement roomsStudioCapsule, le matériau violet du sélecteur Simple / Pro (capsuleAccent #7E44E3, fond 22 %, contour 38 %). Ne pas remettre de fond prune ou de violet approchant.

## Wave — décision utilisateur du 19 septembre 2026

Base / Boucle / Mix doit reprendre le noir HiFi des boutons microphone et haut-parleur placés sous les faders : hardwareSurface(6.dp, raised = true, reflection = 0.085f). Cette consigne remplace le matériau violet Simple / Pro précédemment demandé pour ce sélecteur.
Le lecteur Wave possède son propre bouton haut-parleur animé et son propre volume, avec le même cap de fader perle strié que le Mixeur. Le fader audio du Mixeur ne doit jamais modifier le volume du lecteur Wave. Les deux lecteurs restent des instances indépendantes.

## Wave — ajustement des commandes (19 septembre 2026)

- Base / Boucle / Mix : conserver le noir HiFi, ajouter uniquement un halo violet doux derrière le segment actif.
- Nouvelle règle utilisateur, prioritaire sur le guide : déplacement des régions et des épingles fixes par pas de 4 mesures, même avec une longueur 8, 16 ou 32. A–B libre reste continu.
- Propositions utilise le composant Ouvert/Fermé des demandes invités (WaveIntakeChip), point vert/rouge adouci.
- Vote : surfaces de commande 34 dp, Message/Vote/Duel en boutons carrés à icône. Le duel sélectionne une boucle validée de Composition ; elle ne disparaît qu'en cas de victoire du remplacement. Ce parcours demeure un vote local de démonstration, pas un vote public serveur.
- Composition : Mute/Solo toujours visibles et centrés ; tap sur la carte déplie volume/épingles. Plus de menu trois-points ni de bottom sheet de détails pour ces cartes. Croix en haut à droite avec confirmation explicite avant retrait d'une boucle validée.

### Wave propositions
- Bulle Message directe vers la conversation de l'auteur ; espacement 4 dp et padding vertical 6 dp.
- Plus de bottom sheet au toucher des cartes ; Composition conserve son dépliage intégré.

### Wave — densité, filtres et commandes
- Supprimer la hauteur minimale de 92 dp du conteneur swipe : les propositions suivent leur contenu, avec un intervalle de 3 dp.
- Ouvert/Fermé à gauche ; filtre à droite avec les chips de catégories existants, multi-sélection et statut dans le filtre.
- Composition compacte : chip au-dessus des commandes Mute/Solo, volume avec le curseur du mixeur.
- Duel en épées croisées ; catégories alignées à gauche dans une colonne fixe dans le choix du duel. Vote explicitement nommé. Halo actif Base/Boucle/Mix renforcé.

### Filtre Propositions
- Grille 3 x 3 : sept catégories existantes et commandes Tout/Aucun. Chips agrandis, colorés si actifs et gris si éteints, sans cases ni statuts.
- Sélection liée aux catégories acceptées mémorisées. Intervalle des propositions à 7 dp ; indication gauche supprimer / droite vote entre Ouvert et filtre.

### Wave — cartes Vote et pré-profils
- Vote en texte sans icône, accessible sur les miniatures et à côté du chip des propositions.
- Toucher une carte de Vote alterne dépliée/repliée, sans sélection automatique de la première carte.
- Portraits Propositions/Vote/Composition raccordés au bottom sheet pré-profil partagé des invités.

### Correction bouton Vote
- Aucun bouton Vote dans Propositions. Dans Vote, un seul bouton texte carré noir hifi de 40 dp à côté du chip, visible replié/déplié. Aucun doublon dans les commandes dépliées.

### Composition — espacement et alignements
- Intervalle de 8 dp entre boucles. Mute/Solo centrés dans leurs boutons. Chip de catégorie à droite, au-dessus de la croix, séparé des commandes Mute/Solo.

- Guide gestuel Propositions : icône Swipe et titre Glisser la boucle, puis flèche gauche Supprimer / flèche droite Vote, sur deux lignes compactes sans conteneur supplémentaire.

### Propositions — défilement et double filtre
- Bandeau Ouvert/gestes/filtre/import dans la liste défilante, y compris liste vide.
- Bottom sheet : Afficher filtre uniquement la liste ; Autoriser l’envoi modifie les catégories acceptées persistantes sans masquer les anciennes boucles. Restriction encore locale, envois publics non raccordés.
- Propositions : catégorie au lieu du titre, identité/grade/BPM/gamme conservés. Vote : chips de largeur commune 68 dp.

- Chips des boucles : taille commune 68 x 22 dp dans Propositions, Vote et Composition ; couleurs lumineuses, bordure renforcée, texte centré. Chips désactivés du filtre restent gris.
