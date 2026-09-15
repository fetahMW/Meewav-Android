# Profil Android — reprise du site

## Sources et périmètre

Le profil est importé depuis `Meewav-Web`, commit
`32a5e5fea7f6eebb3867c22a27e8b62230bb8d21` : `ProfilePage.tsx`, ses vues Accueil,
Statistiques, Créations et Espace privé, ses dialogues, son aperçu public, ses
services et leurs dépendances. Le dépôt Web n'est pas modifié.

Les composants sont conservés dans `app/src/main/profile-source/vendor`.
`web-provenance.json` consigne les fichiers et leurs empreintes au moment de
l'import. Le build ordinaire utilise cette copie, sans réimporter le site.
Les adaptations Android sont dans `main.tsx`, `runtime.ts`, `localPreview.ts`
et `mobile.css`. `localPreview.ts` reprend les helpers du site en remplaçant
uniquement l'activation de l'aperçu par le drapeau transmis par Android.

Le fond est celui du profil Web :
`/images/profile-acoustic-background-trial.png`. Les médias locaux sont copiés
sans redimensionnement. Les notices des bibliothèques sont livrées avec le paquet.

## Audit des matières et des couleurs

| Élément | Référence retenue | Adaptation |
| --- | --- | --- |
| Fond, portraits, badges, cartes et graphiques | Profil Web, `profile.css` et `profile-smoked-glass.css` | Ressources et matières conservées ; colonnes et espacements adaptés au portrait mobile |
| Cartes principales | Verre fumé Web, gris `rgba(20,22,27,.96)` vers noir `rgba(7,8,11,.96)`, bordure argent discrète | Pas de recoloration générale des cartes ni des couleurs sémantiques |
| Bandeaux de menus et sous-menus | Messagerie Android livrée | Base `#12151c99`, reflets blancs légers, `blur(22px) saturate(1.12)` |
| Onglet actif | Trait effilé du site déjà repris en messagerie | Même trait de 1 px, halo flouté léger ; pas de pavé lumineux |
| CTA principaux | Messagerie : Groupes → Membres → Inviter | Dégradé 135° `rgba(79,53,158,.96)` → `rgba(76,47,169,.94)`, bordure `rgba(98,67,192,.34)` |
| Barre du bas | iOS `Meewav/CustomNavBar.swift`, ordre de `MainTabView.swift` | Trois icônes à gauche, trois à droite, globe central dans une encoche circulaire |
| Petit globe | Navbar du globe Android | Même carte et palette ; tour horizontal en 40 s dans le dock Profil ; résolution du canvas adaptée à ses 56 px et à la densité de l'écran |

Référence iOS lue sur `sipiyou39/Meewav`, `main`, commit
`aea7251a60a2b61d775901fcf39a62036fd108c4`. Le globe SwiftUI n'est pas repris.
La disposition du dock est adaptée au DOM du profil : encoche de rayon 34 px,
globe de diamètre 56 px, icônes sans boîtes empilées et zones tactiles de 48 px
en hauteur. Le contenu conserve une marge inférieure pour passer au-dessus.

## Navigation et intégration native

`ProfileActivity` réutilise le document local, le sélecteur de fichiers, les
sessions et la lecture média de `MessagingActivity`. Le paquet est livré dans
l'APK, à l'origine locale `appassets.androidplatform.net/profile/`.
Les restrictions réseau et le passage du jeton en mémoire sont conservés.
Le mode aperçu n'est disponible que dans le build Debug ; il utilise les données
de démonstration du site et ne contacte pas le serveur.

- L'entrée Profil de la navbar du globe ouvre le profil en portrait.
- Le globe central revient au globe ; l'enveloppe ouvre la messagerie.
- Les six entrées reprennent l'ordre iOS : Messagerie, Profil, Rooms ; puis
  La Scène, Marketplace, Tremplin. Les quatre piliers non intégrés affichent
  explicitement leur indisponibilité dans cette version Android.
- La croix ferme l'application. Le retour Android ferme d'abord un dialogue
  quand son bouton de fermeture est disponible, sinon revient à l'accueil
  du profil ou au globe.
- Pour l'atelier, l'ouverture directe du Profil remplace celle de la Messagerie
  dans `MainActivity`, uniquement en Debug. `OPEN_PROFILE_WORKSHOP = false`
  rétablit l'entrée d'authentification.

Les cinq outils de Créations et les six modules privés du site sont conservés.
Leur navigation devient horizontale et défilable si nécessaire. Les contenus
et formulaires gardent leur défilement vertical ; les CTA d'enregistrement,
d'import et de modification reprennent la finition de la messagerie.

## Compilation et limites

Depuis la racine Android :

```powershell
node scripts/build-profile.mjs
node scripts/build-full-globe.mjs
.\gradlew.bat :app:assembleDebug --console=plain
```

`--import-web` sert uniquement à une reprise explicite du graphe Web ;
`--sync-assets` actualise explicitement les médias publics.

Lors du port initial, la compilation du paquet et de l'APK avait abouti sans
test, capture ou contrôle visuel automatique, conformément à la préférence
de l'utilisateur. La reprise ci-dessous comprend les captures qu'il a
ensuite explicitement demandées. Les sous-vues et les opérations avec une
session réelle ne sont pas validées par ces captures ni par la compilation.

## Reprise de l'accueil — 15 septembre 2026

Les captures initiales sur le Samsung connecté montraient un bandeau qui
partait avec le contenu, un portrait occupant une ligne entière, des
compteurs répartis sur deux lignes et une navbar détachée des contrôles
système. La hiérarchie de l'accueil est adaptée dans `mobile.css`, avec
quelques ajustements ciblés dans `ProfilePage.tsx` et `ProfileHomeView.tsx`.

- Une seule zone défilante, `.profile-main`, sous le bandeau permanent.
  Les quatre onglets affichent chacun leur icône et leur libellé.
- Bandeau et dock : matière du champ de saisie de messagerie, base
  `#17191faa`, reflets blancs et `blur(22px) saturate(1.15)`.
  Cette finition remplace celle du tableau d'audit initial pour ces éléments.
- Dock collé au bord inférieur de la WebView, qui est déjà ajustée aux
  barres système par Android. Plus de second retrait CSS. Encoche et globe
  fixe conservés ; icônes sur une surface commune et indicateur actif effilé.
- Identité : portrait de 72 px à côté du nom, biographie sur deux lignes,
  deux actions de 44 px minimum, trois compteurs sur une ligne et grade compact.
- Activité : titre court, graphique de 104 px, quatre indicateurs sur une
  ligne. Priorités compactes, puis cartes Progression et Classement séparées.
  Le classement garde ses quatre territoires en grille de deux colonnes.
- Cartes : gris fumé sombre, contours fins et espacements réguliers.
  Ressources, portraits, badges, fond acoustique et données Web conservés ;
  aucun média n'est redimensionné. Les actions existantes restent câblées.

Le paquet Profil et l'APK Debug ont été compilés, puis installés sur le
Samsung. Les captures du haut, du milieu et du bas de l'accueil ont permis
de contrôler le bandeau fixe, le raccord du dock à la navigation système,
les alignements et les retours à la ligne des cartes. Les captures locales
sont dans `app/build/profile-review/` (dossier non livré).
Ce contrôle concerne uniquement l'accueil ; les autres onglets attendent
leur propre passe demandée par l'utilisateur.

### Rotation lente du globe du dock

Sur demande suivante, le dock Profil active `rotationSeconds={40}` sur
`AndroidNavGlobeTexture`. Deux copies jointives de la carte sont préparées
une seule fois, à la densité de l'écran, puis une translation CSS linéaire
fait défiler un tour complet sans rupture. L'éclairage et la coque circulaire
ne bougent pas. Aucun redessin Canvas2D ni rendu React par image n'est ajouté.
La rotation est suspendue par le cycle de vie Android, puis reprend à la même
position ; la préférence de réduction des animations conserve le rendu fixe.
Cette option reste désactivée pour les autres usages du composant.

## Statistique et transparence du dock — 15 septembre 2026

À la demande suivante, l'ordre de l'accueil devient Activité, Progression,
Classement, À faire maintenant, Activité récente.

Statistique conserve ses dépôts de données Web, les périodes, le classement,
l'acquisition, les objectifs et le conseil de publication. Les quatre anciens
boutons qui pilotaient un graphe distant deviennent des composants
`MetricDropdown` indépendants dans `ProfileStatsView.tsx`. Chacun contient
son graphe, ses valeurs et ses points sélectionnés. Le panneau se déplie dans
le flux, sans pop-up ni défilement interne. Les en-têtes indiquent leur état
par `aria-expanded` ; le contenu replié est inerte et masqué à l'accessibilité.
Les transitions respectent la réduction des animations.

Les valeurs retenues sont affichées sous la courbe pour rester dans les
marges du téléphone. Changer de période actualise toutes les données et
réinitialise ces valeurs ; fermer et rouvrir un panneau les conserve.
Les autres cartes sont adaptées au portrait : classement à quatre territoires
sur deux colonnes, acquisition lisible avec cibles tactiles, objectifs courts,
progression compacte et planification qui s'ouvre dans son propre bloc.
Les CTA conservent le violet urbain de messagerie ; les contrôles secondaires
et les surfaces sont neutres. L'aperçu utilise toujours les données de démo,
sans nouvelles requêtes serveur.

Le dock garde la famille de reflets et le `blur(22px) saturate(1.15)` du champ de
messagerie. Ses reflets sont atténués (`#ffffff08`, `#ffffff02`, `#ffffff05`).
Son voile passe de `#17191faa` à `#17191f33` pour laisser voir
le fond et le contenu ; l'isolation du dock est retirée et les icônes sont
placées au-dessus de la surface. Le bandeau supérieur garde sa finition.
Le changement d'onglet réinitialise maintenant la zone défilante interne,
en plus du document.

Contrôles demandés sur le Samsung : captures de l'entrée, d'un graphe ouvert,
du classement, de l'acquisition et du bas de page ; ouverture et fermeture
des quatre panneaux ; données différentes pour les trois périodes ; maintien
des points retenus après fermeture et remise à zéro au changement de période.
Les panneaux fermés ont une hauteur nulle et sont inertes. Les points restent
dans les marges du graphe ; la largeur défilante reste égale aux 384 px CSS
du viewport. L'ordre Progression → Classement → À faire maintenant est
contrôlé dans l'accueil. Le toast de changement de période est supprimé :
l'actualisation des données et leurs états de chargement suffisent.
Ces contrôles concernent le rendu et les interactions en aperçu local,
pas les mesures ou opérations avec une session de production.
