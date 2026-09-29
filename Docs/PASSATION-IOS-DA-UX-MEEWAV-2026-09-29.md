# MeeWav — Passation design et UX pour iOS

**État de référence : 29 septembre 2026.**

Ce document permet de reproduire sur iOS les corrections d’interface réalisées sur Android, Windows et le site web. Il rassemble les décisions produit actuelles, les recettes de dessin et les comportements à conserver. Il peut être transmis directement à un développeur ou à une autre IA.

Il décrit les éléments vérifiés dans le code actuel et les consignes de portage. Il ne certifie ni un rendu iOS déjà réalisé, ni une parité de moteur audio, de latence ou de fonctionnement réseau.

## 1. Bloc de contexte à donner à une IA

> Tu travailles sur la version iOS de MeeWav. Reproduis la direction artistique et les interactions décrites dans ce document en consultant les composants sources indiqués. Le résultat attendu est une interface musicale noire, précise et lisible, avec des commandes en verre poli sombre, un léger relief métallique et des accents violets maîtrisés.
>
> La référence des actions principales est l’onglet **Pads actif** du panneau Pads / Chronomètre. Sa face est un dégradé vertical **#2B2341 → #1D1531 → #5137A1**, avec un reflet diagonal discret, une lumière basse et un contour fin argent-violet. Les commandes secondaires reprennent la même construction en graphite **#29292F → #151519 → #09090C**. Les accents secondaires déjà violets — chevrons, compteurs, liens et petites icônes — utilisent **#A98EF0**.
>
> Préserve la hiérarchie : texte principal blanc, texte secondaire neutre, violet pour les actions et états concernés. Les couleurs fonctionnelles des pads, Rooms, grades, alertes et indicateurs audio restent distinctes. Les contrôles Plugin, Pads, Pro et Retour constituent la référence des petits boutons. Les navigations supérieures du profil et les étapes d’authentification utilisent un petit trait actif sous le libellé.
>
> Les champs d’authentification sont noirs avec un relief très discret, un bord fin et un focus violet clair. Les grandes fenêtres conservent leur forme spécifique. Leur contour est composé d’un biseau sombre, d’un liseré argent-violet net et d’un reflet fin. Le flou et la transparence sont réservés aux surfaces qui le demandent : badges des Rooms, contact sélectionné, certains bandeaux.
>
> Reproduis aussi les comportements, pas seulement l’apparence : Pro actif reste actif quand son panneau se ferme ; un second appui sur Pro revient à l’autotune simple tout en gardant l’autotune allumé. Le bouton power coupe réellement l’effet. Les messages vocaux s’enregistrent pendant l’appui et s’envoient au relâchement, avec annulation vers la corbeille. Fermer le panneau Pads / Chronomètre ne doit pas arrêter ses outils.
>
> Construis des composants partagés iOS à partir des recettes ci-dessous. Préserve les états, les tailles tactiles, les permissions, le clavier, l’accessibilité et les connexions réelles aux actions. Pour toute différence de plateforme, identifie l’écart explicitement. Une conversion syntaxique du code ne suffit pas à garantir le même rendu.

## 2. Quelle version prendre comme référence ?

Les fichiers de cette passation proviennent des espaces de travail suivants :

| Repère utilisé ici | Dossier de travail | Branche / HEAD au relevé |
|---|---|---|
| Android | `Meewav-Android` | `main` / `1021ff4` |
| Windows | `Meewav-Windows` | `codex/desktop-studio-polish` / `10634a55` |
| Web | `Meewav-Web-viewer-parity` | `codex/web-viewer-parity` / `61d9d6f5c` |

**Attention à la version récupérée sur GitHub :** les trois espaces de travail ont des changements locaux. Les commits ci-dessus ne représentent donc pas à eux seuls toutes les dernières corrections décrites ici. Vérifier que les fichiers reçus contiennent notamment `SecondaryAccent = #A98EF0`, `authBlackSurface`, `NavigationIndicator`, `RegistrationEntryLayout` et `navigation-indicator.css`. Transmettre les modifications locales correspondantes, ou leur futur commit, avec cette passation.

Ce document est un contrat de reproduction de l’état courant. Les anciennes demandes ont parfois été remplacées par de nouvelles décisions : utiliser les règles finales ci-dessous, puis les sources correspondantes. Les anciens journaux de travail servent à comprendre l’historique.

### Trois niveaux à distinguer

- **Recette vérifiée :** valeurs et structure présentes dans les composants cités.
- **Comportement vérifié dans le code :** gestion des états et actions identifiée ; cela ne vaut pas test de bout en bout sur tous les appareils.
- **Consigne iOS :** recommandation de réalisation pour retrouver cette recette et ce comportement sur iPhone.

## 3. Direction artistique et hiérarchie

### Matière

- Fond et consoles : noir / graphite profond, avec suffisamment de contraste pour lire les commandes.
- Commandes : verre poli sombre, reflet blanc diagonal doux, bord métallique fin, lumière basse mesurée.
- Action principale ou sélection concernée : violet profond avec éclairage clair sur le bas.
- Contenu : blanc et gris neutres. La couleur aide à identifier une action ou un état.
- Relief : obtenu par plusieurs couches faibles et nettes. Éviter le gros contour saturé, le halo violet étalé et les grandes surfaces gris clair.
- Densité : grouper les informations utiles ; dimensionner les panneaux selon leur contenu, sans grands vides décoratifs.

### Tokens

| Usage | Valeur |
|---|---|
| Face violette, haut | `#2B2341` |
| Face violette, milieu | `#1D1531` |
| Face violette, bas | `#5137A1` |
| Accent secondaire commun | `#A98EF0` — RGB 169, 142, 240 |
| Reflet métallique clair | `#D3C7F5` |
| Reflet métallique intermédiaire | `#8871C6` |
| Face graphite, haut / milieu / bas | `#29292F / #151519 / #09090C` |
| Champ noir, haut / milieu / bas | `#161619 / #0D0D10 / #08080A` |
| Texte auth principal | `#F0EDF5` |
| Texte secondaire natif, token Muted | `#B5B1C2` |

Le thème Android conserve aussi un ancien token primaire `Violet = #9B6AFF`. Il ne faut pas l’utiliser automatiquement pour dessiner toutes les nouvelles surfaces. Les recettes partagées et `SecondaryAccent` fixent les usages présentés ici.

### Où appliquer chaque famille

| Élément | Finition |
|---|---|
| CTA principal déjà violet : Suivant, Vérifier, Explorer les artistes… | Face violette polie |
| Bouton + des Rooms, envoi de message, pastille de non-lus | Face violette, adaptée à la forme du contrôle |
| Plugin, Pads, Retour, commandes secondaires | Graphite poli ; état sélectionné violet lorsqu’il existe |
| Onglet actif du mixeur Host ou Viewer | Même face violette polie |
| Petit chevron / compteur / icône secondaire déjà violet | `#A98EF0` en premier plan |
| Navigation supérieure du profil | Libellé + petit trait actif |
| Champ de saisie auth | Noir légèrement creusé ; focus discret |
| Contact sélectionné dans la liste | Verre violet translucide, blur 16 |
| Badge de type de Room sur sa vignette | Fond transparent, contour et texte colorés, blur 10 |
| Pads musicaux, grades, erreurs, palette de repères | Couleurs sémantiques conservées |

Ne pas transformer les titres, les illustrations ou tous les SVG en violet. Ne pas déduire le matériau d’une simple classe globale « actif » : chaque famille a son rôle.

## 4. Recette exacte des boutons polis

**Sources Android :** `core/design/PolishedPrimarySurface.kt`, sous `app/src/main/java/com/meewav/android/`.

**Sources CSS :** `app/src/main/shared-ui/primary-cta-material.css` et `compact-control-material.css` ; équivalents Windows / Web dans `src/styles/`.

### Empilement natif, de l’arrière vers l’avant

1. Ombre externe de 2 dp.
2. Face verticale opaque, positions 0 %, 50 %, 100 % :
   - sélectionnée : `#2B2341 → #1D1531 → #5137A1` ;
   - au repos : `#29292F → #151519 → #09090C`.
3. Reflet diagonal du coin haut gauche au coin bas droit :
   - 0 % : blanc à 16 % ;
   - 26 % : blanc à 3 % ;
   - 48 % : transparent.
4. Lumière basse : transparente jusqu’à 76 %, puis `#A98EF0` à 16 % si sélectionné ; blanc à 2,5 % au repos.
5. Contour diagonal intérieur de 0,7 dp, décalé de 0,5 dp :
   - sélection ou focus : `#D3C7F5 / 50 % → #8871C6 / 42 % → noir / 40 % → #A98EF0 / 48 %` ;
   - repos : blanc 20 % → blanc 6 % → noir 40 % → blanc 7 %.
6. Icône et texte, au-dessus de la matière.

Le rayon reste celui du composant : la recette accepte une capsule, un rectangle arrondi ou un cercle. Rayon compact par défaut : 12 dp ; il est limité à la moitié du petit côté. État désactivé natif : opacité 45 %. Le focus colore le bord sans imposer la face sélectionnée.

Les fonds automatiques des boutons Material sont transparents pour ne pas recouvrir le dessin. En iOS, neutraliser de même le fond automatique du style système, tout en conservant les interactions et l’accessibilité.

### Recette CSS de référence

```css
/* Couches CSS : la première est dessinée au-dessus des suivantes. */
--mw-primary-face:
  linear-gradient(180deg, transparent 76%, #a98ef029) padding-box,
  linear-gradient(135deg, #ffffff29, #ffffff08 26%, transparent 48%) padding-box,
  linear-gradient(180deg, #2b2341, #1d1531 50%, #5137a1) padding-box,
  linear-gradient(135deg, #d3c7f580, #8871c66b 33%, #0006 67%, #a98ef07a) border-box;
--mw-primary-shadow:
  inset 0 1px #d3c7f540,
  inset 0 -1px #a98ef052,
  0 2px 3px #0005;

--mw-control-face:
  linear-gradient(180deg, transparent 76%, #ffffff06) padding-box,
  linear-gradient(135deg, #ffffff29, #ffffff08 26%, transparent 48%) padding-box,
  linear-gradient(180deg, #29292f, #151519 50%, #09090c) padding-box,
  linear-gradient(135deg, #ffffff33, #ffffff0f 33%, #0006 67%, #ffffff12) border-box;
--mw-control-shadow:
  inset 0 1px #ffffff20,
  inset 0 -1px #0006,
  0 2px 3px #0005;
```

Les classes explicites sont `mw-primary-action` et `mw-compact-control`. Conserver les attributs `aria-pressed`, `aria-selected`, `aria-current`, etc. Le registre partagé cible les bons composants ; il ne remplace pas tous les boutons de l’application.

**Particularité de conversion :** le gradient diagonal natif relie deux coins. Un angle CSS fixe de 135° n’a pas exactement la même géométrie sur tous les rapports largeur/hauteur. Pour iOS natif, reprendre les points de départ et d’arrivée du composant Compose ; pour une vue web embarquée, conserver sa recette CSS.

## 5. Authentification et inscription

### Champs de connexion / création de compte

Source : `features/auth/AuthBlackSurface.kt` et `AuthScreen.kt:AuthField`.

- Hauteur minimale native : **56 dp** ; rayon **14 dp**.
- Face : `#161619 → #0D0D10 → #08080A`.
- Reflet diagonal : blanc 4,5 % au départ, 1,5 % à 28 %, transparent à 55 %.
- Pas d’ombre externe sur les champs creusés.
- Contour intérieur 1 dp : blanc 17 % → blanc 5,5 % → blanc 9 %.
- Au focus : premier reflet blanc 22 %, fin de bord `#A98EF0` à 55 %.
- Lumière de focus en bas : trait 1 dp, transparent → `#A98EF0` à 80 % → transparent.
- Texte saisi 13 sp, interligne 18 sp ; label flottant 12 sp.
- Icône 19 dp ; œil 20 dp dans une cible tactile plus grande.
- Curseur, label et icône au focus : `SecondaryAccent`.
- Indicateurs et fond Material habituels neutralisés pour laisser visible cette surface.

Le formulaire conserve l’affichage/masquage du mot de passe, l’ordre de focus, Suivant / Terminé du clavier et la mise en visibilité du champ actif. Le champ de connexion réutilise le composant commun.

La version web utilise des champs de 52 px et une cible œil de 44 × 44 px. Cette différence de plateforme est existante : ne pas déformer le formulaire natif pour imposer une seule hauteur à toutes les versions.

### Choix de scène et localisation

Source : `MusicSceneLocation.kt`.

Les contrôles noirs de sélection ont une face un peu plus éclairée que les champs : `#1B1B1F → #101013 → #070709`, reflet initial blanc 9 %, ombre 2 dp. Même rayon 14 dp. La demande récente était de les rendre **un peu plus noirs**, en conservant leur relief.

Les sélections actives, dont Créateur IA / Artiste réel, suivent la matière des contrôles. Les boutons Apple / Google, l’avatar et le CTA Suivant conservent leurs fonctions et leur composition.

### Petit indicateur des étapes

Sources : `AuthScreen.kt:RegistrationSteps`, `core/design/NavigationIndicator.kt` ; Android `shared-ui/navigation-indicator.css`, Windows / Web `src/styles/navigation-indicator.css`.

- Trois labels visibles dès le choix de l’avatar : **1 · Avatar, 2 · Compte, 3 · Localisation**.
- **Seule l’étape actuelle porte un trait.**
- Trait net **1 dp / px**, largeur maximale **56 dp / px** sur téléphone ; extrémités transparentes et rayon arrondi.
- Gradient du trait : transparent → `#9274D8` à 18 % → `#D7C6FF` à 50 % → `#9274D8` à 82 % → transparent.
- Lueur séparée de 5 dp / px, flou 3, opacité 40 % : transparent → `#8060CC` à 24 % → `#B39AEF` à 50 % → `#8060CC` à 76 % → transparent.
- Le **trait net est à 6 dp / px sous la boîte du libellé**. En Compose : espace 4 dp puis conteneur lumineux 5 dp dont le trait est centré à +2 dp.
- Label actuel blanc et accentué ; les autres restent secondaires.
- Les longs rails de progression et les pavés autour des labels ont été retirés de cette présentation.

**Logo stable :** les trois étapes utilisent maintenant `RegistrationEntryLayout` dans `AccountEntryLayout.kt`. La rangée logo / retour mesure 48 dp, suivie de 12 dp puis d’une réserve de 38 dp pour les étapes. La position de repos est commune, calculée dans les zones sûres ; l’avatar ne possède plus une géométrie d’en-tête différente. Le clavier peut masquer l’en-tête du formulaire et déplacer son contenu, mais changer d’étape au repos ne déplace plus le logo. Sur une petite hauteur, faire défiler le contenu sous cet en-tête, sans écraser la scène avatar.

### Même trait dans les navigations

La référence est **Profil → Médias**. `MeewavPillarTabs` mesure le bas du libellé visible et déplace un seul indicateur ; cela évite les écarts dus à des icônes au-dessus du texte, des textes sur une ligne ou au défilement horizontal. Les variantes desktop conservent leur largeur proportionnelle (72 % de la touche) ; la version mobile la limite à 56 px.

Les sous-menus natifs Wave, Cage, Scène, Loge, Place et Invités utilisent le même composant. Les sous-menus texte Viewer partagent les mêmes tokens CSS, avec une ligne de texte à hauteur 1,2 et une réserve basse de 9 px pour maintenir le même écart. Le dock ne comporte qu’une icône : son trait garde une largeur de 20 px. Les touches de console Host / Viewer, les pills en surface polie, les barres de progression et les repères verticaux du profil gardent leur fonction et leur finition propres.

### Espace autour du « ou »

Source : `RegistrationPanels.kt:AccountSocialOptions`.

Le séparateur entre Apple / Google et les champs possède maintenant **8 dp de marge intérieure verticale** en plus de sa ligne de contenu de 12 dp. Les champs descendent légèrement ; le CTA conserve sa place.

Équivalent web : `.quick-auth-divider`, marges haute 11 px et basse 13 px. Préserver cet espace au lieu de coller le premier champ au séparateur.

### Contour de la grande fenêtre

Sources : `AuthWindowPanel.kt:renderWebPanel`, `IosAvatarStage.kt:renderIosStageWindow` ; Windows / Web `src/components/auth/AuthPanelChrome.tsx`.

La dernière correction conserve les tracés et le fond existants. Elle affine leur éclairage :

| Couche du contour compte / localisation | Réglage du renderer Android |
|---|---|
| Biseau sombre | Noir, largeur 2,6 ; opacité 46 % ; flou 1,2 |
| Reflet violet extérieur | `#A98EF0`, largeur 2,2 ; opacité 10 % ; flou 3 |
| Bord principal net | Largeur 1 ; opacité 72 % |
| Filament de lumière | Largeur 0,4 ; opacité 60 % |
| Arc inférieur diffus | Largeur 2 ; opacité 18 % ; flou 3 |
| Arc inférieur net | Largeur 0,65 ; opacité 45 % |

Palette du bord principal : `#D3C7F5 → #A98EF0 → #514A62 → #292431 → #807394 → #A98EF0`, aux positions 0 / 16 / 38 / 64 / 84 / 100 %.

Le filament utilise des blancs argent-violet avec des portions presque transparentes : ce n’est pas une deuxième bordure pleine. Reprendre ses stops dans la source.

**Unités importantes :** ces largeurs appartiennent au dessin dans son repère, ensuite mis à l’échelle. Le renderer compte / localisation utilise 413 × 600 ; la scène avatar utilise 337 × 489. Elles ne doivent pas être recopiées comme autant de points iOS indépendants de l’échelle. La scène avatar a sa propre forme et sa propre animation.

Conserver les tracés des fenêtres et leur séparation contour / remplissage / scène. Une simple carte rectangulaire arrondie ne reproduit pas ce rendu.

### Clavier et petits écrans

Sources : `AccountEntryLayout.kt` et `KeyboardField.kt`.

Le code distingue la fenêtre fixe du contenu qui peut défiler lorsqu’un clavier masque les champs. Il tient compte des insets et de la hauteur réellement disponible. Sur iOS, utiliser les zones sûres et le clavier réels ; éviter les hauteurs calculées pour un seul téléphone.

## 6. Rooms : navigation, badges et lancement

### Tabs Host / Viewer

Les deux rôles doivent présenter la même finition. La barre Android Wave native utilise :

- châssis de 49 dp, rayon 17 dp ;
- marge intérieure 3 dp, intervalle entre touches 4 dp ;
- touches de même largeur, rayon 12 dp ;
- icônes 14 dp, labels 10,5 sp ;
- matière graphite au repos, violet poli en sélection.

Sources : `WaveMixerScreen.kt:WaveTabBar`, `WaveMixerMaterials.kt:consoleTabSurface`.

Le Viewer utilise aussi des composants **DOM dans une WebView**, même quand des commandes du mixeur sont natives. Source : `rooms-source/viewer-web/src/features/rooms/place/PlaceStudioPanel.tsx`. Sa grille accepte le nombre réel d’onglets, trois ou quatre. Une correction du composant natif seul ne suffit pas à corriger cet écran.

Les navigations supérieures du profil restent à indicateur fin. Elles ne reprennent pas ces touches de console.

### Badges Wave / Cage / Classe / Place sur les vignettes

Sélecteur : `.rooms-home-card__room-type`.

- Fond **transparent**, flou d’arrière-plan **10 px**.
- Contour 1 px : couleur de Room à 56 %.
- Texte : mélange 84 % couleur de Room / 16 % blanc.
- Rayon capsule ; hauteur minimale 24 px, marges internes 4 × 9 px.
- Police .64 rem, graisse 650, espacement .025 em ; texte sur une ligne.
- Pas de grande lueur ni d’ombre de texte.
- Variante verticale Android : min. 22 px, marges 3 × 7 px, police .6 rem.

Les couleurs de type de Room sont conservées : Loge `#F6D978`, Cage `#FF5B73`, Place `#F7F5FF`, Scène `#C56CFF`, Classe `#5B7CFF`, Wave `#27C2D1`.

### Séquenceur de lancement

Référence mobile Android : `LaunchRoomSheet.tsx`, `LaunchStudio.tsx` et `rooms-source/launch-premium.css`.

- Quatre étapes : **Identité → Studio → Vérification → Lancement**.
- Une console graphite structurée ; l’aperçu vidéo est une zone utile de cette console.
- Éviter l’effet d’une image encadrée à l’intérieur d’une autre image encadrée.
- Sur petit écran, aperçu et réglages se placent en une colonne.
- Les dispositions à deux sources dépendent réellement de la source secondaire activée.
- Le bas du panneau reste compact : retour 44 × 44 px, action principale 44 px de haut, espace inférieur tenant compte de la zone sûre.
- Les CTA Continuer / Vérifier / Accéder à la room utilisent la face violette commune.
- Les permissions, choix de sources, progression et appels de création de Room restent raccordés.

Windows et Web ont leur propre orchestration `RoomLaunchDialog`. Ne pas mélanger leurs index d’étape ou leurs appels de création avec le composant mobile au moment du portage.

## 7. Mixeur, Autotune et outils

### Composition du mixeur

Conserver les faders, le lecteur et les effets lisibles dans la hauteur disponible. Les modules Autotune / Réverb occupent leur espace utile, les petites commandes sont équilibrées, et les boutons power restent faciles à toucher. Éviter qu’un fader extensible prenne toute la hauteur et écrase le lecteur sur un téléphone plus haut.

Les petits contrôles **Pro / Retour / Plugin / Pads** reprennent la famille graphite polie. Plugin conserve son icône colorée ; le contour lumineux permanent qui lui donnait trop d’importance a été retiré. Pads ouvre le panneau des outils.

### Contrat d’état de Pro

Source : `WaveAutotuneState.kt`, avec les raccordements dans `WaveMixerScreen.kt` et `RoomViewerNativeControls.kt`.

Il existe un état audio explicite : **OFF / SIMPLE / PRO**. La visibilité du panneau est un autre état.

| Action | Mode après action | Autotune | Panneau |
|---|---|---|---|
| Appuyer sur Pro depuis OFF | PRO | Allumé | Ouvert |
| Appuyer sur Pro depuis SIMPLE | PRO | Allumé | Ouvert |
| Fermer le panneau Pro | Inchangé : PRO | Allumé | Fermé |
| Appuyer sur Pro quand il est déjà actif | SIMPLE | Reste allumé | Fermé |
| Couper l’autotune avec son power | OFF | Éteint | Selon navigation |
| Allumer avec le petit power simple depuis OFF | SIMPLE | Allumé | Inchangé |

- Le voyant Pro indique l’utilisation des paramètres avancés.
- Le voyant Autotune indique que la correction est effectivement activée.
- Les réglages Pro sont conservés quand on passe en Simple ou OFF.
- Simple fournit les paramètres de correction par défaut ; Pro fournit les valeurs avancées conservées.
- La réverb est indépendante.
- La dernière mécanique n’affiche plus de bouton Simple séparé.

**Piège repéré pour la synchronisation :** `fromRemote` reconstruit aujourd’hui le mode depuis « activé » et les valeurs de correction. Des valeurs Pro identiques aux valeurs par défaut peuvent être interprétées comme SIMPLE. Pour une future parité réseau stricte, ne pas supposer que ce format transmet un indicateur Pro explicite.

La conservation actuelle des valeurs dans ce composant couvre les recompositions et la fermeture du panneau. Elle ne prouve pas une restauration après destruction du processus.

### Pro et Plugins sont deux entrées distinctes

- Pro : correction et réglages avancés ; retune speed et humanisation font partie de la demande produit.
- Plugins : gestion des plugins réellement disponibles pour la plateforme.
- Conserver l’interface compacte et les faders des effets dans la famille du mixeur.
- L’existence d’une commande graphique ne prouve pas que son traitement DSP est implémenté. Consulter aussi le moteur et ses capacités avant d’exposer un contrôle actif.
- Ne pas présenter un VST Windows ou Antares comme disponible sur iOS sans intégration effective compatible avec la plateforme.

### Pads / Chronomètre

Sources : `WaveMixerToolsPanel.kt`, `WaveMixerToolsState.kt`, `WaveMixerDeckState.kt`.

- Le bouton Pads ouvre un panneau avec deux onglets : **Pads / Chronomètre**.
- Hauteur cible native du panneau : 88 % ; tabs 42 dp.
- Quinze emplacements de pads ; six sons initiaux.
- Trois colonnes, ou deux si la largeur utile est inférieure à 310 dp.
- Appui : lecture ; appui long : édition / remplacement / restauration.
- Les pads gardent leurs couleurs : battement rose, horn ambre, applause violet, huées bleu-violet, roulement cyan, countdown vert.
- Volume initial 20 %, conservé ensuite avec les réglages locaux.
- Sons utilisateur et noms sont mémorisés ; restauration possible.
- Fermer le panneau laisse les outils fonctionner. Leur état appartient au mixeur, pas à la vue du panneau.
- Les anciens CTA Pads / Chronomètre du lecteur déplié ne constituent plus le point d’entrée de référence.

**Chronomètre :** durée de 00:01 à 99:59, valeur initiale 03:00, pause / reprise / réinitialisation ; calcul sur une horloge monotone.

**Signaux :** départ avec `countdown-10-seconds.wav` ; fin avec `air-horn-trimmed.wav`. Les emplacements correspondants peuvent être remplacés. Les options de départ et de fin sont indépendantes.

**Comportement réel du départ :** le code attend la position du média et libère le départ du beat lorsqu’il reste au plus une seconde de countdown. Il prévoit donc un chevauchement d’une seconde ; il n’utilise pas un délai fixe égal au nom du fichier. La fin de lecture du pad sert aussi de repli pour libérer le départ.

Le lecteur de pads courant est unique : jouer un pad interrompt le précédent. Annuler un départ, rencontrer une erreur ou quitter le propriétaire audio doit libérer les ressources correctement. La fermeture du simple panneau ne doit pas être confondue avec cette sortie.

Ne pas inventer une matrice de déclencheurs à trois modes sur la seule base d’anciennes demandes orales : reprendre les options et les raccordements actuellement présents dans le transport cible.

## 8. Wave : gestes et quarantaine

Sources : `WaveProposalGesture.kt`, `WaveProposalSwipe.kt`, `WaveWorkshopChrome.kt`, `WaveCompositionState.kt`.

- **Glisser à gauche : supprimer.**
- **Glisser à droite : envoyer au vote.**
- L’entrée de mise en quarantaine et le téléchargement depuis la quarantaine ont des fonctions distinctes.
- Dans la quarantaine : remplacer la boucle en gardant son identité / nom prévu, télécharger, envoyer au vote.
- Le remplacement est décodé et validé avant de remplacer une source valide.
- Sous-menu Propositions / Quarantaine / Vote / Composition : distribution cohérente de l’espace disponible.
- Pas de bandeau de confirmation encombrant ajouté sous le lecteur pour une action courante.

Le résolveur natif accepte un déplacement de 72 dp, ou un mouvement rapide d’au moins 36 dp dont la projection atteint 144 dp avec un facteur de 0,12. L’animation de sortie dure 260 ms. Le seuil et le sens du geste sont complétés par des actions d’accessibilité explicites.

Pour iOS, conserver aussi une alternative VoiceOver aux gestes. Les contrôles de vote visibles ne prouvent pas à eux seuls un vote serveur public : le guide Wave signale encore des chemins locaux. Vérifier le raccordement du parcours porté séparément.

## 9. Messagerie

### Champ du chat des Rooms : même famille que la messagerie

Le chat public des Rooms reprend maintenant la capsule de saisie de la messagerie, avec **texte, emoji, envoi uniquement**. Il n’expose ni micro, ni fichier joint. Les autorisations de conversation et les handlers d’envoi restent ceux du chat.

- Capsule de 56 dp / px, rayon 28 ; contrôles de 44 × 44.
- Fond graphite translucide : `#17191FAA`, reflet diagonal à 125° blanc 8,2 % → 2 % à 48 % → 4,3 %.
- Contour neutre `#C5CBD335`, reflet supérieur `#EDF0F34D` ; le focus éclaire ce bord sans créer un rectangle à l’intérieur du champ.
- Texte 16 sp / px, couleur `#F3F4F7`, indication `#B4B8C3`.
- Envoi : cercle violet utilisant **la même matière partagée que les CTA principaux**, avion en contour de 21 dp / px. Avec un champ vide, le cercle conserve sa finition ; l’icône passe à 45 % et l’action reste désactivée.
- Emoji : icône neutre, cible de 44, sans séparateur vertical ajouté.
- Version DOM : blur d’arrière-plan 22 px, saturation 1,15 ; la version native dessine la face translucide et son reflet, sans flouter le texte ni toute la capsule avec un blur de contenu.

Sources Android : `WaveChatPanel.kt:WaveChatComposer`, `WaveChatMaterials.kt`, `ChatSendIcon.kt`, `WaveEmojiInput.kt`. Host et Viewer utilisent ce même composant. Le Viewer superpose le champ natif au rectangle du composeur DOM : **les deux hauteurs restent à 56**, sinon le champ est rogné. Côté Windows / Web : `PlaceStudioPanel.tsx` et `place-chat-composer-glass.css`. Ne pas importer les contrôles vocaux ou pièces jointes de `MessageWorkspace` dans cette barre.

### Structure et bandeaux

- Sur la liste des contacts : navigation Tchat / Collabs / Projets / Groupes.
- Dans une conversation : un seul bandeau avec retour, identité et actions utiles.
- L’ancien titre « Messagerie » et le deuxième bandeau d’identité ne doivent pas s’empiler au-dessus du chat.
- Les tabs de la liste ont une matière sombre et un flou d’arrière-plan suffisamment présent pour rester lisibles.
- Envoi, lecteurs vocaux et pastilles de non-lus utilisent la famille violette commune, à leur taille respective.

Sources : `MessageWorkspace.tsx`, `messaging-premium.css`, et pour Android `messaging-source/mobile.css`.

### Contact sélectionné : verre translucide

Sélecteur exact : `.messaging-page .mw-workspace .mw-conversation-list > article.is-active`.

```css
background:
  linear-gradient(180deg, transparent 74%, #a98ef01f),
  linear-gradient(135deg, #ffffff14, #ffffff03 28%, transparent 52%),
  linear-gradient(180deg, #2b234145, #1d153122 50%, #5137a142);
border: 1px solid #bca5ed42;
box-shadow:
  inset 0 1px #f0eaff1a,
  inset 0 -1px #a98ef040,
  0 2px 6px #00000014;
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
```

La géométrie de la ligne est conservée. Le contenu reste net et opaque. Il faut appliquer la transparence aux couches de fond, pas à toute la ligne. Le gros aplat gris de la variante mobile a été retiré.

### Enregistrement vocal : geste et permissions

Référence : `messaging-source/voiceHoldGesture.ts`, raccordée par `MessageWorkspace.tsx`, `NativeVoiceCapture.kt` et `MessagingActivity.kt`.

1. Appuyer sur le micro démarre la capture, sous réserve de permission.
2. Garder le doigt appuyé enregistre.
3. Relâcher envoie si l’enregistrement a réellement démarré.
4. Glisser à gauche d’au moins 72 px ou atteindre la corbeille annule.
5. Annuler le pointeur ou perdre la capture ne doit pas envoyer.
6. Relâcher avant l’obtention tardive de la permission annule l’intention.

Le contrat courant exige un maintien d’au moins 250 ms pour envoyer. Un seul pointeur pilote une session. La capture du pointeur est portée par un parent stable car le bouton est remplacé pendant l’enregistrement.

Pour iOS, conserver cette petite machine d’état et le nettoyage des ressources. Une simple alternance « un tap démarre / un tap arrête » ne correspond pas au comportement demandé.

### Audio et cartes de collaboration

Les bulles audio sont compactes : commande de lecture, forme d’onde et durée restent groupées. Les pièces jointes d’une collab ne doivent pas devenir chacune une grande carte occupant la moitié de l’écran.

La carte de collaboration rassemble identité, message court, pièces jointes et actions dans une présentation compacte. Éviter de remettre un grand bandeau décoratif, de répéter l’identité à plusieurs endroits ou de rétablir des espaces verticaux sans contenu.

Sources à reproduire : `CollabsWorkspace.tsx:renderRequestCard`, `messaging-premium.css`, ainsi que les surcharges mobiles. Les actions accepter / refuser / profil / lecture conservent leurs raccordements et leurs états.

Repères CSS actuels :

| Élément | Mesure relevée |
|---|---|
| Audio standard, variante desktop | Hauteur minimale 100 px ; lecture 44 px ; forme d’onde 43 px |
| Audio standard à largeur ≤ 760 px | Grille 36 px / espace disponible / 32 px ; lecture 34 px ; espacements réduits |
| Avatar de la carte collab compacte | 64 px |
| Aperçu du texte de collab | Deux lignes, zone de 42 px |
| Chips de collab | 28 px |
| Pièce jointe de collab | Min. 72 px ; lecture 44 px ; forme d’onde 28 px |

Les surcharges Android dans `messaging-source/mobile.css` restent à prendre en compte : les dimensions desktop ne sont pas des hauteurs à imposer sur iPhone. La carte se réorganise quand son conteneur passe sous 520 px.

**Limites réelles à conserver ou à faire évoluer explicitement :** la demande de collaboration est limitée à **500 caractères et 3 pièces jointes**. Cette limite est présente dans le formulaire et revalidée dans son bridge. L’aperçu en deux lignes ne limite pas le message à deux phrases. Le compositeur de DM ordinaire a actuellement une limite distincte de **4 000 caractères**.

### Préprofils et collaboration vers la messagerie

Références Windows / Web : `HoverPreProfileContent.tsx`, `pre-profile-black-glass.css`, `CollaborationComposer.tsx`, `collaborationRequestBridge.ts`.

- Les préprofils Rooms, Top 10, Globe et propriétaire partagent la direction de console sombre. Leur hauteur doit correspondre aux sections présentes ; le bloc d’épinglage du Globe ne justifie pas un vide dans une fenêtre qui n’a pas cette fonction.
- Portrait avec un contour discret ; retirer l’effet de stroke fluorescent.
- La demande de collab, le suivi et l’onglet Aperçu reprennent les recettes violettes communes. L’ancienne direction verte de la demande de collab a été remplacée.
- Le compte réel envoie par `submitGlobeCollaborationWithAttachments`, puis `requestProfileCollaboration`, et ouvre la messagerie avec l’identifiant persistant de la demande.
- « Gérer mes collabs » ouvre l’espace collaborations de la messagerie.
- Le parcours de démonstration reste identifié séparément. Une carte affichée dans une démo ne prouve pas l’envoi d’une vraie demande.

## 10. Tremplin : accueil Windows porté sur Android

La home Android rend maintenant `TremplinPublicHome` issu du travail Windows. L’ancienne page d’explication reste disponible sur `/tremplin/comprendre`. Le portage conserve le routeur Android, ses ponts natifs, la session et les identifiants des profils. Il ne copie pas tout le dépôt Windows.

### Intention produit à conserver

- Les pochettes gardent leur image et leur lecteur centré. Le vinyle sort progressivement vers la droite depuis la pochette et reste partiellement derrière elle, à environ 50 % de sortie.
- La rotation est douce, pendant la lecture ; les reflets doivent suivre le disque. Au repos, l’ensemble est stable.
- Le gros assemblage de pochettes peut s’ouvrir légèrement pendant la lecture, avec le badge « Les premiers comptent » qui accompagne doucement le mouvement.
- Les six grades gardent leurs belles cartes noires, cadres métalliques, accents propres et SVG. Le grand panneau englobant avait été retiré.
- La progression possède un escalier sur grand écran, un éclairage cumulatif et des labels qui restent affichés : 2 secondes par niveau de 1 à 5, puis 5 secondes au niveau 6 avec une pulsation et des ondes mesurées. Sur mobile, les cartes reviennent à une grille lisible à deux colonnes, puis une sous 300 px de largeur utile.
- La mention fixe « Parcours confirmé » du niveau 3 avait été demandée retirée ; ce niveau ne doit pas sembler sélectionné avant la progression.

Ces comportements sont présents dans les sources Windows et dans le port Android décrit ici. Le rendu sur appareil reste à valider par l’utilisateur ; ce document ne certifie pas la version iOS ni une publication distante.

### Ce que le relevé de code confirme

- `TremplinPublicHome.tsx` et `TremplinPage.tsx` possèdent un vrai contrôle lecture / pause relié à un élément audio.
- Les données définissent bien six grades, dont « Légendaire » au niveau 6.
- Le composant `vendor/meewav-vinyl/src/components/Vinyl.jsx` suspend sa rotation hors lecture, en réduction des animations ou quand le document est caché.
- L’option `rotateReflections` anime la surface entière ; le Tremplin la transmet.
- La home transmet **`rpm={5}`**, soit une révolution en **12 secondes**, au gros disque et aux quatre vinyles. La vitesse générique par défaut du composant n’est pas la vitesse finale de la home.
- Le Tremplin prend en compte `prefers-reduced-motion`.
- Avec réduction des animations, les six notes au-dessus des cartes restent visibles en permanence ; aucun timer n’est nécessaire pour lire leur explication.
- `TremplinGradeProgression.tsx` attend 700 ms, puis active les niveaux 1 à 5 pendant 2 s chacun, le niveau 6 pendant 5 s, et recommence. `showcaseLevel >= level` maintient les cartes et leurs labels éclairés. La sixième pulse deux fois et produit trois ondes décalées de 350 ms. Les tracés des badges restent intacts. La visibilité du document, de la section et de la surface Android suspend l’animation décorative.
- Petit disque : largeur 82 % de la zone de pochette, translation X de −5 % au repos à 35,3659 % en lecture, derrière la pochette ; déplacement en 1 800 ms, courbe `cubic-bezier(.22,.61,.36,1)`. La portion visible dépend aussi de la largeur de la pochette : conserver la structure et ses proportions ensemble.
- Gros disque : sortie en 2 000 ms ; pochettes et badge bougent en 1 800 ms. Ne pas animer un SVG de reflet séparément avec une vitesse différente.
- Audio : Lunaé → `fille-1.mp3`, Sama K → `rapeur-1.mp3`, Mina Roze → `fille-2.mp3`, Yuna Vox → `fille-3.mp3`. La composition principale utilise `003-king.mp3`. Ce sont des MP3 déjà préparés, pas les WAV lourds.
- Le lecteur Android arrête et nettoie l’élément audio lorsqu’on quitte la surface. Le bouton pause de la mini-barre arrête aussi la source spéciale du grand vinyle.

Sources du port Android : `tremplin-source/vendor/src/features/tremplin/TremplinPublicHome.tsx`, `TremplinGradeProgression.tsx`, `tremplin-home-editorial.css`, `tremplin-grades-open.css`, et `tremplin-source/mobile.css`. Les fichiers sélectionnés et leurs empreintes d’origine sont consignés dans `windows-home-provenance.json`. Les médias du port vivent dans `editorial-assets` et sont copiés par `scripts/build-tremplin.mjs`. Cette provenance décrit les fichiers importés avant les adaptations Android, pas leur empreinte finale.

## 11. Portage iOS : points qui changent vraiment le résultat

### Couleurs et transparence

- Utiliser les valeurs sRGB du document. Éviter une conversion implicite en couleurs plus saturées.
- **Android écrit souvent AARRGGBB ; CSS écrit RRGGBBAA.** Exemple : Android `0x1AA98EF0` correspond à CSS `#A98EF01A`, soit violet à environ 10 %. Copier les huit chiffres dans le mauvais ordre change toute la couleur.
- Définir la couleur opaque, puis son alpha, dans les helpers iOS pour réduire ce risque.
- Conserver séparément l’opacité de la face, du reflet, du contour et du contenu.

### Couches et clipping

- Dessiner la face, le reflet, la lumière basse et le bord séparément.
- Limiter les reflets à la forme du contrôle ; garder l’ombre externe à l’extérieur.
- Utiliser un contour intérieur cohérent avec l’inset de référence.
- Les décorations ne doivent pas intercepter les touches.
- Le style système d’un bouton ne doit pas ajouter une deuxième teinte ou un deuxième fond.

### Flou

Un blur de fond laisse le contenu net et floute ce qui se trouve derrière. Un blur appliqué à toute la vue flouterait aussi le texte.

Les matériaux système iOS peuvent ajouter leur propre teinte et leur propre saturation. Choisir et régler le composant de flou pour retrouver la recette ; ne pas supposer qu’un matériau prédéfini reproduit automatiquement le verre MeeWav. Garder un fond lisible lorsque la réduction de transparence est activée.

### Dimensions et typographie

- Prendre les dp natifs et les px CSS comme dimensions logiques de départ, puis adapter au layout iOS. Ne pas multiplier manuellement les points par le facteur Retina.
- Pour les formes dessinées dans un repère, mettre à l’échelle le tracé et ses effets ensemble.
- Réutiliser les familles et graisses de police livrées pour le composant ; vérifier les métriques avant de substituer une police système.
- Un petit bouton visuel conserve une cible tactile confortable ; viser au moins 44 × 44 points lorsque nécessaire sans agrandir sa face.
- Préserver la lecture avec Dynamic Type, VoiceOver, clavier, orientation et zones sûres. La densité ne doit pas provoquer de texte coupé ou de boutons superposés.

### État et cycle de vie

- La présentation d’un panneau est indépendante de l’activation audio.
- Le propriétaire des outils audio survit à la fermeture de son panneau.
- Une permission asynchrone n’autorise pas à envoyer un message après que l’utilisateur a annulé son geste.
- Conserver les actions d’accessibilité et les états sélectionné / désactivé / en cours.
- Respecter la réduction des animations. Une décoration animée ne doit pas devenir essentielle à la compréhension.

### Composants iOS conseillés

Créer une petite base partagée, avec des noms au choix :

- `MeewavPolishedSurface` : état graphite / violet, focus et disabled.
- `MeewavPrimaryButton` et `MeewavCompactButton` : sémantique et zones tactiles autour de la matière.
- `MeewavAuthField` : champ noir, label, mot de passe et focus.
- `MeewavStepIndicator` : petit trait actif.
- `MeewavGlassSelection` : contact translucide avec blur.
- `MeewavRoomTypeBadge` : texte et stroke sémantiques, fond transparent.
- `MeewavAuthFrame` : tracé spécifique et couches de contour.
- Un état vocal séparant `audioMode`, paramètres et visibilité des panneaux.

Ces noms sont une proposition d’organisation iOS ; ils ne désignent pas des composants déjà livrés dans le dépôt iOS.

## 12. Carte des sources à consulter

Les chemins natifs ci-dessous sont relatifs à `Android/app/src/main/java/com/meewav/android/`.

| Sujet | Source |
|---|---|
| Tokens | `core/design/MeewavTheme.kt` |
| Boutons polis | `core/design/PolishedPrimarySurface.kt` |
| Accents Rooms | `features/rooms/wave/WaveMixerTheme.kt` |
| Champ / stepper auth | `features/auth/AuthScreen.kt` |
| Surface noire auth | `features/auth/AuthBlackSurface.kt` |
| Séparateur social | `features/auth/RegistrationPanels.kt` |
| Localisation | `features/auth/MusicSceneLocation.kt` |
| Contour / scène avatar | `features/auth/AuthWindowPanel.kt`, `IosAvatarStage.kt` |
| Clavier et viewport | `features/auth/AccountEntryLayout.kt`, `KeyboardField.kt` |
| Mixeur / matière / mode Pro | `features/rooms/wave/WaveMixerScreen.kt`, `WaveMixerMaterials.kt`, `WaveAutotuneState.kt` |
| Outils | `features/rooms/wave/WaveMixerToolsPanel.kt`, `WaveMixerToolsState.kt`, `WaveMixerDeckState.kt` |
| Gestes / quarantaine | `features/rooms/wave/WaveProposalGesture.kt`, `WaveProposalSwipe.kt`, `WaveWorkshopChrome.kt`, `WaveCompositionState.kt` |

Sources DOM et styles :

| Sujet | Android | Windows / Web |
|---|---|---|
| Matières partagées | `app/src/main/shared-ui/*-material.css` | `src/styles/*-material.css` |
| Viewer intégré | `app/src/main/rooms-source/viewer-web/src/features/rooms/place/` | `src/features/rooms/place/` |
| Rooms, badges, lancement | `app/src/main/rooms-source/vendor/src/features/rooms/` + `rooms-source/mobile.css` et `launch-premium.css` sous `app/src/main/` | `src/features/rooms/` |
| Messagerie | `app/src/main/messaging-source/vendor/src/features/messaging/` + `messaging-source/mobile.css` sous `app/src/main/` | `src/features/messaging/` |
| Geste vocal | `app/src/main/messaging-source/voiceHoldGesture.ts` | Vérifier le raccordement propre à la version cible |
| Auth SVG / CSS | Référence native indiquée au-dessus | `src/components/auth/AuthPanelChrome.tsx`, `src/styles/auth.css`, `avatar-selection.css` |

Les copies Android sous `*-source/vendor` sont des sources embarquées, pas une synchronisation automatique de toute modification Windows / Web. Les bundles générés et les APK servent à distribuer ; modifier d’abord les sources, puis reconstruire la cible.

Documents complémentaires :

- `docs/CTA-PRINCIPAUX.md` : contrat partagé des matériaux.
- `Docs/DESIGN-MEMORY.md` : historique ; certaines décisions ont été remplacées.
- `Docs/PORTAGE-WAVE-IOS-ANDROID.md` : provenance et limites du portage Wave.
- `Docs/Messaging/Media-and-calls.md` : médias / appels, distincts de la seule présentation.
- `Docs/WAVE_ANDROID_AUDIO_LIVE_2026-09-21.md` : état technique audio ; les commandes UI ne suffisent pas à établir la couverture DSP.

## 13. Recette de validation pour le portage

Cette liste est destinée au développeur iOS et à la validation produit ; elle ne signifie pas que ces vérifications ont déjà été exécutées sur iOS.

- [ ] Comparer un CTA principal, une commande graphite et un état désactivé, sur le même fond.
- [ ] Vérifier le reflet diagonal, le contour fin et la lumière basse sans rendre toute la face rose ou gris clair.
- [ ] Contrôler que les petits accents violets utilisent `#A98EF0` et que les couleurs sémantiques restent distinctes.
- [ ] Parcourir connexion et les trois étapes d’inscription : un seul petit trait actif, champs noirs, espace autour du « ou », contour fidèle.
- [ ] Ouvrir le clavier sur chaque champ, notamment le dernier mot de passe, sur un écran compact.
- [ ] Vérifier les tabs Host et Viewer, puis le profil à simple trait.
- [ ] Vérifier les badges de Rooms et la sélection de contact : arrière-plan flouté, contenu net.
- [ ] Dans Pro : activer → fermer → constater Pro et Autotune allumés → appuyer à nouveau → Simple toujours allumé → couper avec power.
- [ ] Fermer puis rouvrir Pads / Chronomètre : état conservé ; tester un son remplacé, le départ et son annulation.
- [ ] Tester les deux directions Wave et un remplacement invalide en quarantaine.
- [ ] Enregistrer un vocal, relâcher pour envoyer, puis essayer annulation, appui bref et permission tardive.
- [ ] Vérifier une collab avec plusieurs pièces jointes et une conversation sans bandeaux en double.
- [ ] Parcourir le lancement de Room jusqu’au véritable appel de création, sans confondre présence du CTA et réussite réseau.

### Niveau de preuve au moment de cette passation

Les recettes et transitions ci-dessus ont été relevées dans les sources actuelles avec des audits ciblés Luna. Les dernières corrections Android ont été compilées et installées sur Samsung et Redmi ; Windows et Web ont été compilés localement. Ces opérations ne constituent pas une nouvelle publication de toutes les plateformes.

À la demande de l’utilisateur, la validation visuelle des dernières retouches lui est laissée. Aucun contrôle visuel iOS ni mesure de latence iOS n’est revendiqué ici. L’utilisateur a signalé que le son, l’autotune et la réverb passaient d’Android vers iOS ; cette observation ne remplace pas un test instrumenté du portage.
