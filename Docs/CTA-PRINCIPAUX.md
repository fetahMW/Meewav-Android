# Finition des CTA principaux MeeWav

Référence validée : **l’onglet Pads actif du bottom sheet Pads / Chronomètre Android**.

- Face opaque, verre violet sombre : `#2B2341 → #1D1531 → #5137A1`.
- Reflet blanc diagonal discret, lumière violette sur le bord inférieur.
- Contour métallique fin : argent violet `#D3C7F5`, `#8871C6`, noir, `#A98EF0`.
- Texte blanc lisible. La finition conserve la forme, les dimensions et la fonction du contrôle.

Android natif : `core/design/PolishedPrimarySurface.kt`. Utiliser
`Modifier.polishedPrimarySurface(rayon, enabled)` et, pour un bouton Material,
`polishedPrimaryButtonColors()` afin de ne pas recouvrir la matière.
L’onglet Pads sélectionné utilise lui-même ce matériau partagé.

Écrans web intégrés : `app/src/main/shared-ui/primary-cta-material.css`.
Les scripts de build chargent cette feuille dans chaque document, y compris
le préprofil isolé du Globe. Windows et Web disposent de la même recette dans
`src/styles/primary-cta-material.css`.

La liste des sélecteurs cible les actions principales déjà violettes. Pour un
nouveau CTA de cette famille, employer la classe `mw-primary-action`. Ne pas
appliquer ce matériau à tous les boutons : les secondaires graphite, les
actions vertes/rouges, les pads musicaux multicolores et les accents des icônes
gardent leur rôle. Le focus clavier et les états désactivés restent visibles.

## Petits contrôles et compteurs

### Couleur des accents secondaires

Le violet clair commun est **`#A98EF0`**, issu du reflet inférieur du CTA
« Suivant ». Il colore les chevrons déjà violets, les petits compteurs comme
`1/28`, les icônes et les liens secondaires. Utiliser `SecondaryAccent` en
Compose et `var(--mw-accent-secondary)` en CSS (`--mw-accent-secondary-rgb`
pour conserver une opacité existante). Les alias Rooms `capsuleAccentSoft`
et `fxAccent` pointent vers ce même token.

Ce token concerne le premier plan. Les dégradés des boutons, les textes
neutres, les couleurs des Rooms, des grades, des pads et des alertes conservent
leurs recettes. Ne pas recolorer globalement tous les SVG ou tous les titres.

Les petits boutons Plugin / Pads / Pro / Retour définissent aussi la matière
des contrôles secondaires : graphite `#29292F → #151519 → #09090C`, reflet
diagonal discret, bord métallique fin. Un choix actif prend la face violette
ci-dessus. Les pastilles de messages non lus, le bouton Explorer les artistes
et le + des Rooms utilisent également la face violette.

- Compose : `Modifier.polishedControlSurface(selected, focused, cornerRadius, enabled)`.
- Web : classe `mw-compact-control`, feuille `compact-control-material.css`.
- Sélection : `aria-pressed`, `aria-selected`, `aria-checked`, `aria-current`
  ou la classe d’état du composant. Ne pas retirer ces attributs pour styliser.
- Les dimensions, les gestes, les couleurs des pads et les états de danger
  restent sous la responsabilité du composant. Ne pas recolorer les palettes
  de choix de couleur ni transformer les badges de statut en boutons.
- La navigation supérieure du profil et les navigations de piliers gardent
  leur simple indicateur sous le libellé : aucun pavé ni fond de bouton.
  Ne pas ajouter `.profile-top-tabs > button` au registre des contrôles.
- Dans le séquenceur, l’action de progression (`Continuer`, `Vérifier`,
  `Accéder à la room`) est un CTA principal explicite `mw-primary-action`.

Les deux feuilles sont chargées par les sept bundles Android, par le document
Globe isolé, et par les entrées principales Windows / Web. Leur registre est
explicite : ne pas remplacer les sélecteurs par une règle globale `button`.

La barre Chat / Mixeur / Room du Viewer est en DOM WebView, même quand son
mixeur est natif. Ses boutons `.place-studio-panel__tabs > button[data-surface]`
doivent partager la finition Host. Ne pas limiter cette règle à `.is-host-panel`
ou à `.rooms-page`, absent du conteneur Viewer Android. La grille doit accepter
le nombre réel d’onglets. Le bandeau principal du profil reste exclu.

L’authentification comprend aussi des contrôles secondaires : choix du rôle,
Créateur IA / Artiste réel, Apple / Google, création du compte et localisation.
Ils emploient le graphite poli au repos et la face violette pour une sélection,
sans ajouter un halo ou un gros contour violet à une face noire. Les champs
de saisie et les liens textuels gardent leurs propres styles et leur focus.

## Lancement d’une Room

Android possède quatre étapes dans `LaunchRoomSheet` : identité, studio,
vérification, lancement. Une seule console graphite, un aperçu de cadrage,
des sections espacées et une navigation fixe. Les dispositions à deux sources
restent des choix de composition fonctionnels, pas des cadres décoratifs.
Les styles sont dans `rooms-source/launch-premium.css` et sont assemblés après
les anciens styles mobiles. Windows / Web utilisent leur propre orchestration
`RoomLaunchDialog` et leur feuille `launch-console.css`.

Les contrôles techniques se font par compilation et contrôle statique. Le rendu
est laissé à l’utilisateur, conformément à sa demande.
