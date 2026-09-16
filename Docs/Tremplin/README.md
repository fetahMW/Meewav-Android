# Tremplin Android — reprise Web

Import du 16 septembre 2026, depuis `Meewav-Web`, commit
`32a5e5fea7f6eebb3867c22a27e8b62230bb8d21`. Le dépôt Web canonique n’est pas modifié.

## Contenu et adaptation

Le graphe de dépendances du Tremplin est conservé dans
`app/src/main/tremplin-source/vendor`. Il comprend l’accueil, la découverte,
les filtres, les fiches artistes, les explications, Mes artistes, la candidature,
le tableau de bord et les parcours de simulation de jetons. Portraits, covers,
sons et vidéos sont embarqués sans réduction de résolution. Les fichiers de
provenance enregistrent les sources de l’import avant adaptation.

L’enveloppe mobile reprend le bandeau translucide du Profil, ses matériaux et
ses CTA violet urbain. Profil et Tremplin utilisent le même composant
`shared-ui/FeatureDock.tsx` : trois destinations de chaque côté du globe central.
Le contenu défile sous les onglets, avec une réserve pour la navigation basse.
Mes artistes regroupe ses cinq rubriques dans un sélecteur déroulant.
Le lecteur audio reste au-dessus du dock ; les préécoutes s’arrêtent lorsque
l’activité quitte le premier plan.

`TremplinActivity` réutilise l’hôte local sécurisé, la session native et les
ponts médias de `MessagingActivity`. Le Tremplin est accessible depuis le
Profil et le globe. Messagerie, Profil et Globe sont raccordés ; les destinations
pas encore importées restent signalées comme indisponibles.

## Données et limites

Les fixtures investisseurs et les simulations du Web sont conservées.
Les achats/ventes de jetons restent des simulations (`demoMode`, sans API
transactionnelle). Cet import ne constitue pas une validation serveur de tous
les parcours Tremplin. Les appels existants passent par le runtime partagé avec
Profil ; les jetons de session ne sont pas persistés dans le stockage Web.

## Construction et livraison

- `node scripts/build-tremplin.mjs` construit le paquet local depuis les sources figées.
- `node scripts/build-profile.mjs` reconstruit le Profil après modification du dock partagé.
- `node scripts/build-full-globe.mjs` embarque la destination native Tremplin dans le globe.
- `./gradlew.bat :app:assembleDebug --console=plain` produit l’APK Android.

L’option `--import-web` réimporte les sources et peut écraser les adaptations
locales de `TremplinPage.tsx` : ne pas l’utiliser pour une simple compilation.
L’extra debug `com.meewav.android.OPEN_TREMPLIN=true` sur `MainActivity` ouvre
directement l’atelier Tremplin. La route de lancement habituelle reste inchangée.

Lors de l’import initial, aucun test automatique ni contrôle visuel n’était effectué,
conformément aux consignes du projet. Le rendu sur appareil reste à apprécier
par l’utilisateur ; une compilation ne vaut pas validation des interactions.

## Accueil mobile — passe visuelle demandée le 16 septembre

À la demande explicite de l’utilisateur, captures et itérations sur son Samsung.
Le premier écran importé conservait une illustration de plusieurs centaines de
pixels sous un long texte, des boutons sur plusieurs lignes et de grandes
cartes explicatives. Le premier artiste restait plusieurs écrans plus bas.

`TremplinMobileHome.tsx` compose maintenant une landing dédiée au mobile :
accroche illustrée et CTA principal, recherche distincte, sélection d’artistes
en cartes horizontales, accès suivis si disponibles, trois étapes compactes,
six badges tactiles, espace artiste et accès aux règles. Les mêmes données,
badges, extraits et callbacks de navigation Web restent utilisés. Le composant
Web original est conservé pour référence. Les explications et les grades
s’ouvrent dans des panneaux inférieurs avec fond flouté, focus modal et fermeture.

La seconde passe enlève la hauteur vide résiduelle du hero, rétablit les libellés
des quatre onglets et aligne leur hauteur. Les CTA gardent le violet urbain du
Profil. Aucun changement des autres compositions d’onglets dans cette passe.

Captures locales : `app/build/reports/tremplin/landing/` (non versionnées).
Contrôles ciblés : haut, milieu, bas, panneau explicatif, panneau de grade,
images chargées, absence de débordement horizontal, préécoute par appui réel,
recherche « luna » et ouverture du parcours Lunaé. La compilation Android réussit.
Ces contrôles ne constituent pas une recette serveur des simulations de jetons.

## Découvrir mobile — cartes compactes

Les chevrons latéraux des carrousels sont retirés ; le défilement tactile reste
inchangé. Les cartes à la une remplacent la grille Web fixe de 585 px par une
composition mobile d’environ 305 px sur le Samsung : portrait et identité,
projet, état du jeton et actions. Les informations du jeton restent dans le flux
de la carte, sans panneau superposé. Les miniatures conservent leur hauteur de
210 px ; symbole, prix et variation sur 24 h sont ajoutés pour les jetons actifs.
Les autres projets affichent leur état réel, sans prix inventé.

Les données et callbacks proviennent toujours du Tremplin Web importé. Les
captures demandées sont conservées localement sous
`app/build/reports/tremplin/discover/` (non versionnées). Cette passe concerne
la présentation mobile, sans changer les simulations ni leur câblage serveur.

## Comprendre et Mes artistes — adaptation mobile du 16 septembre

Passe demandée avec captures sur le Samsung, conservées localement dans
`app/build/reports/tremplin/final-tabs/` (non versionnées).

Comprendre conserve le contenu pédagogique Web et ses interactions : introduction
courte, sélecteur de chapitres, illustrations recadrées par CSS, cartes de
navigation horizontales, six grades tactiles, exemple chiffré et règles détaillées.
Les grilles et hauteurs fixes Web sont remplacées par du contenu à hauteur naturelle.
Les panneaux vidéo et règles restent défilables et passent devant la navigation.
Le sélecteur suit le chapitre affiché pendant le défilement.

Mes artistes garde les fixtures investisseurs et les callbacks existants. Aperçu
regroupe les indicateurs dans une seule surface et les jetons dans un rail tactile.
Les autres rubriques accèdent directement à leur contenu via le sélecteur : jetons,
artistes suivis, Rooms et activité. Les opérations sont des lignes mobiles avec
montant et statut visibles, sans tableau de 720 px. Les filtres, rappels, liens
profils et parcours de jetons sont conservés. Chaque changement de rubrique
revient au haut du contenu. Matériaux noir/gris, CTA violet urbain et bandeaux
translucides restent cohérents avec Profil et Messagerie.

La compilation Android réussit. Cette passe de présentation et d’interactions
locales ne constitue pas une validation du serveur ni des transactions de jetons.

Contrôles ciblés sur l’APK installé : les cinq rubriques de Mes artistes, les
cartes et montants des opérations, les quatre chapitres du guide, sélection du
grade 6 et mise à jour de son explication, exemple chiffré, ouverture d’une règle,
chargement local de la vidéo (readyState 4, sans erreur média), activation puis
retrait d’un rappel, filtre d’activité et retour en haut après changement de rubrique.
Les états modifiés pour la vérification ont été rétablis. Les images du guide
réutilisent les illustrations existantes, sans réduction de leur résolution.
