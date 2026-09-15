# Profil Android — passe Médias et Espace privé, 15 septembre 2026

## Reprise après audit du site — navigation, médias, cadeaux et statistiques

Référence relue avant les corrections : `Meewav-Web/src/features/profile/views/`
(`ProfileStatsView`, `ProfileMediaView`, `ProfileGiftsWorkspace`), `profile.data.ts`,
`profile.css` et `src/features/grades/MeewavGradeBadge.tsx` / `gradeBadges.ts`.

Constats : les quatre métriques avaient été uniformisées en violet dans la copie
Android ; les valeurs de courbe avaient été déplacées sous le graphe. Une surcharge
CSS écrasait aussi les accents des reconnaissances métier. Les cadeaux exigeaient
un stock actif jusque pour préparer un brouillon local ; en aperçu sans compte,
aucune carte ne pouvait donc être sélectionnée. Les covers audio n'étaient pas
définies dans les fixtures du profil, alors que le site possède des covers dans
`public/images/messaging/covers/`.

Corrections :

- Un sélecteur de destination sur une ligne remplace les cinq/six sous-onglets ;
  son bandeau reste fixe, translucide et flouté. La liste se déplie sous le contrôle.
- Un filtre déroulant remplace les séries de chips de Médiathèque, Cage, Setlist et
  Cadeaux. La médiathèque présente recherche/import, filtre/sélection, puis des
  lignes avec covers. Les deux covers audio viennent de `cover_1.png` et `cover_2.png`
  du site, sans transformation des fichiers.
- Le dock inférieur utilise une finition violette opaque constante ; les bandeaux
  supérieurs conservent la transparence avec blur.
- Couleurs exactes des métriques du site rétablies : Portée `#8b5cff`, Engagement
  `#d946ef`, Revenus `#34d399`, Progression `#19b8ff`, avec leurs dégradés d'origine.
  Un tap affiche date et valeur dans un panneau superposé à la courbe ; il ne crée
  plus de rangée de chips. Les données restent celles du repository, ou les fixtures
  clairement identifiées « Aperçu » dans le mode de développement.
- Les SVG officiels de grades sont conservés et les accents originaux des
  reconnaissances sont rétablis ; aucun badge n'est redessiné.
- La sélection et l'enregistrement d'un brouillon cadeau ne débitent aucun stock.
  L'inventaire affiché demeure celui du service ; la distribution reste contrôlée
  côté Room. Les brouillons d'aperçu utilisent une clé locale séparée du compte.

Contrôles ciblés sur le Samsung, terminés le 16 septembre : captures de la
médiathèque, du sélecteur, des cadeaux, des reconnaissances, de l'espace privé et
des statistiques. Les six cadeaux sont sélectionnables ; « Distinction Live »
est sélectionné puis ouvre l'étape Destinataire via Préparer. Aucun cadeau envoyé.
Le filtre Audio affiche deux pistes avec covers chargées ; sélection puis
annulation d'un média vérifiées. Les six destinations privées sont accessibles
et Transactions s'ouvre depuis le sélecteur.

Les quatre courbes affichent bien leur date et valeur au tap (sur le point
« 28 juin » de l'aperçu : 88 k, 12,1 %, 680 €, +5,2 %), avec leurs quatre couleurs
distinctes et aucune rangée de readouts sous le graphe. Fermeture des panneaux
et repli des courbes vérifiés. Les interfaces capturées ne débordent pas en largeur.
Les sources de données réelles et les opérations serveur ne sont pas validées
par ces essais locaux. Compilation et installation de l'APK effectuées.

## Changements

- Médias : cinq destinations dans un bandeau fixe translucide avec blur, commandes
  tactiles, cartes plus courtes, titres de studio condensés, badges et progression
  réorganisés. Les images et fichiers gardent leur qualité d’origine.
- Espace privé : six destinations visibles, cartes graphite, CTA violet urbain,
  transactions présentées en lignes mobiles, sélection d’une fiche avec accès
  direct et retour à la liste. Les doublons de commandes sont réduits.
- Lecteur : les fichiers `/media/` manquaient au paquet Android. Ils sont maintenant
  copiés depuis le Web et inscrits dans le manifeste local. Les commandes de
  lecture ont leur espace sous l’aperçu et ne recouvrent plus Play/Pause.

## Contrôles réalisés à la demande de l’utilisateur

Samsung connecté, viewport WebView de 384 × 748,8 CSS px : captures avant/après de
Médiathèque, La Cage, Setlist, Cadeaux, Badges, Portefeuille, Transactions, Contrats,
Matériel, Sécurité et Organisation. Les captures Android sont dans
`app/build/profile-review/` (dossier local ignoré par Git).

Les contrôles ciblés ont couvert les filtres de médias, la sélection puis son
annulation, l’ouverture d’un éditeur Cage, d’une setlist et de fiches privées,
ainsi que le retour à la liste. Les écrans contrôlés n’ont plus de débordement
horizontal du contenu. Les six modules privés restent accessibles lors du scroll.

La lecture a été déclenchée par des taps ADB sur le téléphone :
`hazy-after-hours.mp3` atteint 2,63 s et `dj-turntable.mp4` 2,72 s,
avec `paused=false`, `readyState=4` et aucune erreur média. Les deux autres
MP3/MP4 de la médiathèque chargent aussi leurs métadonnées sans erreur.

Ces contrôles portent sur la présentation et les interactions locales en démo.
Aucun retrait, signature, invitation, changement de sécurité ou autre opération
serveur réelle n’a été exécuté. Ils ne constituent pas une validation de ces services.

## Dernière passe de contenu — 16 septembre 2026

Demande : conserver les bandeaux validés, revoir les contenus de chaque onglet,
puis commiter et pousser la branche profil.

- Accueil, Statistique, Médias et Espace privé partagent une surface de contenu
  noir fumé, avec un reflet discret #4F359E dans l'angle supérieur. Les grands
  aplats gris et les reflets blancs sont atténués ; les contours restent fins.
  Aucun filtre de flou supplémentaire par carte.
- Les compteurs de reconnaissances sont centrés, valeur et libellé compris.
  La catégorie rejoint la description : suppression d'une rangée de chips
  isolés dans chaque carte, tout en conservant l'information.
- Les descriptions et dates des badges, ainsi que plusieurs libellés privés,
  gagnent en contraste. Les trois valeurs du portefeuille sont mieux alignées.
- Suppression du filet superflu au-dessus du titre des médias. Les couleurs
  propres aux graphes, aux cadeaux et aux badges restent conservées.
- Bandeau, sélecteurs, dock, CTA, ordre des sections et fonctionnement restent
  inchangés. Les fichiers médias conservent leur résolution.

Contrôle visuel réalisé après déverrouillage du Samsung : 17 nouvelles captures
sur Accueil (haut et progression/classement), Statistique (fermé, ouvert et
 audience), les cinq outils Médias et les six modules privés. Captures locales
`app/build/profile-review/polish-*.png`, avec relevés de géométrie associés.

La revue a révélé une grille Web à deux zones dans Matériel : une colonne
implicite comprimait la liste à 29 px et la fiche la recouvrait. La grille
mobile définit maintenant explicitement toolbar, list, detail dans une seule
colonne. Les actions de fiche héritaient aussi d'un flex-basis vertical de
120 px ; leur conteneur est une grille à rangées automatiques, boutons de 44 px
minimum. Sélection d'Apollo Twin X, défilement jusqu'aux deux actions et retour
à la liste vérifiés et recapturés. Aucune modification de matériel effectuée.

Dernières retouches recapturées sur le Samsung : suppression du vrai filet du
bloc titre des médias, suppression des marges cumulées avant le catalogue
cadeaux, contraste des descriptions cadeaux et alignement des trois chiffres
de Transactions. La nouvelle hiérarchie des reconnaissances est également
vérifiée sur les badges obtenus et en progression. Les surfaces de navigation
sont conservées ; le contenu reste coupé sous le bandeau principal et passe
uniquement derrière le sélecteur. Pas de débordement horizontal relevé dans
les vues examinées. La compilation Android et le paquet local sont reconstruits.

Ces contrôles portent sur le rendu mobile et la navigation locale en aperçu.
Aucune opération financière, signature, invitation ou changement de sécurité
n'a été effectué. Ils ne valident pas les services réels.
