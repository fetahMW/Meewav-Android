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
Après avoir vu une carte violette derrière le dock translucide, l'utilisateur
demande de garder cette teinte illuminée **en permanence, opaque**. La finition
du dock est désormais le jeton `--profile-dock-violet` :
`linear-gradient(125deg,#ffffff08,#ffffff02 48%,#ffffff05),linear-gradient(110deg,#382961,#302351 52%,#33245b)`.
Cette règle remplace la transparence du dock uniquement ; les bandeaux supérieurs
restent en verre translucide avec blur. Les icônes partagent une seule surface.
Les icônes reposent sur cette surface commune, sans pavés individuels ;
l'icône active est indiquée par un petit trait effilé lumineux.

Le bandeau reste hors de la zone défilante : seul `.profile-main` défile.
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
