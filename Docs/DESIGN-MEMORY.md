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

