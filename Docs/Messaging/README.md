# Messagerie Android

## Référence et périmètre

À la demande utilisateur, la référence de ce portage est la **messagerie Web**
de `C:/Users/linkw/Desktop/Meewav-Web`, `main`, commit
`32a5e5fea7f6eebb3867c22a27e8b62230bb8d21`. Le dépôt Web reste intact.
Cette décision remplace le projet de réécriture initiale depuis SwiftUI pour
cette fonctionnalité ; les contrats iOS ne sont pas supposés identiques.

Les 65 fichiers sources nécessaires à `MessagingPage` sont copiés dans
`app/src/main/messaging-source/vendor/src/`. Leurs empreintes d’import sont dans
`web-provenance.json`. Les modifications Android restent identifiables dans Git.
`media-provenance.json` conserve les empreintes des ressources locales copiées ;
`assets/messaging/THIRD_PARTY_NOTICES.txt` contient les licences complètes des
17 dépendances compilées. Ces inventaires ne créent aucun droit nouveau sur les
illustrations, portraits ou sons de la référence. Les notices existantes restent
en place ; aucun média n’est téléchargé pour ce portage.

Les quatre espaces du Web sont repris : messages, collaborations, projets et
groupes. Les repositories, adaptateurs, files de pièces jointes, clés idempotentes,
erreurs, lectures paginées et souscriptions privées Realtime sont conservés.
Les limitations fonctionnelles du Web demeurent : appels directs non raccordés,
ainsi que certaines fonctions avancées de projets/groupes encore différées.

## Présentation et navigation

L’enveloppe et les interactions système sont Android ; les composants React du
Web sont exécutés dans une WebView locale dédiée, sans serveur de développement
ni page distante. Ce choix réutilise le câblage existant au lieu de maintenir un
second jeu de règles métier Kotlin.

- L’enveloppe de la messagerie est en portrait, avec noir, Violet urbain Meewav
  (`#5137A1`) et contrastes sobres. La navigation principale reste compacte.
- Une seule surface occupe la largeur : liste, puis conversation/détail. Retour
  remonte à la liste avant de revenir au globe. Les cartes de projets et groupes
  réutilisent leurs actions Web dans la même enveloppe mobile.
- La saisie flotte au bas de l’historique dans une capsule en verre fumé. Les
  messages défilent derrière son flou ; un espace calculé d’après la hauteur réelle
  du compositeur permet de lire le dernier message au-dessus de la barre. Les insets
  du clavier redimensionnent l’espace disponible ; ils ne mettent pas la fenêtre à l’échelle.
  Les brouillons texte sont conservés en mémoire par conversation pendant cette
  ouverture de la messagerie. Ils ne sont pas persistés après fermeture de l’activité.
- Les éléments tactiles principaux font 44 dp/CSS px ; les pop-ups secondaires
  restent bornées par la hauteur disponible.
- Le globe est gardé dans son activité, mis en pause par son cycle de vie. Le
  retour retrouve son contexte. Les changements d’orientation/taille sont traités
  sans reconstruire son activité et sa WebView.
- L’enveloppe du globe ouvre `/messages` par une route native strictement reconnue.
  **Contacter** dans un préprofil ouvre aussi la messagerie. Ces artistes restent
  des fixtures : la route porte explicitement leur identité de démonstration.
  Les demandes de collaboration depuis les préprofils restent à raccorder ;
  leurs boutons conservent l’information d’indisponibilité existante.
- Après une vraie connexion, l’écran de session offre aussi **Ouvrir la messagerie**.
  Le bypass de fabrication est conservé.

## Session, médias et cycle de vie

`MessagingActivity` n’est pas exportée. Elle utilise uniquement le document
`https://appassets.androidplatform.net/messaging/index.html` servi depuis l’APK.
Le manifeste de ressources contrôle les chemins ; seuls les portraits/images
du paquet globe sont également accessibles pour les contacts issus des préprofils.

En session réelle, l’instance Supabase Android possède toujours la session et son
rafraîchissement chiffré. Elle transmet à la page locale la clé publique configurée,
l’identité et le jeton d’accès de courte durée, uniquement en mémoire. Aucun jeton
de rafraîchissement, stockage WebView, cookie ou interface JavaScript vers Java
n’est ajouté. Le client Supabase JS réutilise ce jeton via `accessToken` ; les
changements de jeton sont répercutés au Realtime. Une déconnexion ou un changement
de compte ferme cette surface.

La CSP et l’intercepteur permettent les API et médias du Supabase configuré, ainsi
que son WebSocket, et refusent les autres destinations réseau. Les erreurs restent
visibles ; elles ne déclenchent jamais un remplacement par des conversations fictives.
Une ouverture de la liste ne marque plus automatiquement la première conversation
comme lue. Les lectures attendent une conversation affichée et une page visible.

En DEBUG avec le bypass, `preview=true` choisit explicitement les données Web de
démonstration. Aucun jeton n’est transmis et aucune requête serveur n’est autorisée.
Les envois restent locaux. Les routes de fixtures ne peuvent pas faire basculer
une session réelle en démo : elles y ouvrent seulement la boîte de réception.

Les pièces jointes utilisent le sélecteur de documents Android, puis la file
d’upload et les limites du Web. Le micro est demandé au premier enregistrement,
uniquement depuis la page locale, et aucune permission vidéo n’est accordée.
Quitter la conversation ou passer en arrière-plan interrompt la capture ; audio
et vidéo en lecture sont également suspendus en arrière-plan. Le téléchargement
propose **Enregistrer sous** avec le sélecteur Android ; le fichier est transmis
par blocs à l’URI choisie. Cette exportation est limitée à 64 Mio par fichier pour
borner la mémoire, sans conversion ni réduction de qualité.

## Backend : code présent, déploiement à confirmer

Les services Web appellent notamment `list_my_conversations_v2`,
`get_conversation_messages_v3`, `send_message_v1` et les contrats de collaborations,
projets, groupes, fichiers et notifications privées. Le nom exact et le payload
de chaque appel restent définis dans les fichiers `messaging.*.service.ts` importés.
Le sujet Realtime est `messaging:user:<profileId>` avec invalidation puis relecture
par RPC, et polling de reprise.

La documentation Web `docs/backend/MESSAGING_SUPABASE_SPEC.md` indique que les
migrations préparées du 18 juillet n’avaient pas été déployées lors de son audit.
Ce portage ne confirme ni n’infirme leur déploiement actuel. Les noms historiques
iOS `messaging_*_v1` ne suffisent pas à garantir leur compatibilité avec le Web.
**Aucune migration, modification de serveur ou écriture distante n’est effectuée
par ce lot.** Les échanges réels, les droits entre plusieurs comptes, les URL
signées et le Realtime restent à essayer séparément sur l’environnement voulu.

## Construction

Depuis le worktree Android :

```powershell
node scripts/build-messaging.mjs
node scripts/build-full-globe.mjs
.\gradlew.bat :app:assembleDebug
```

La construction de la messagerie lit les dépendances déjà installées dans le Web,
mais compile les copies Android. Elle ne lance ni serveur ni installation npm.
`--import-web` est réservé à une nouvelle importation volontaire : il remplace les
copies de référence et ne doit pas être utilisé pour les ajustements Android.
`--sync-assets` recopie les médias depuis la référence sans remplacer le code adapté.

Compilation et installation ne valent pas essai fonctionnel ou validation visuelle.
La relecture sur le S22, les gestes, le clavier, les fichiers, les vocaux et les
échanges entre comptes appartiennent aux essais utilisateur. Aucun scénario
automatique, capture ou envoi de message de test n’est lancé dans ce lot.

## Relecture mobile du Tchat — 15 septembre 2026

Après la V1, l’utilisateur a explicitement demandé une inspection avec captures
sur son Samsung S22 Ultra. La passe porte sur le Tchat et sa navigation commune,
sans relecture des contenus Collabs, Projets ou Groupes.

Défauts constatés et corrigés :

- Cinq colonnes CSS pour quatre onglets, libellés invisibles et indicateur calculé
  sur une largeur différente : colonnes issues du nombre réel d’onglets, libellés
  visibles et trait de 24 px centré dans le bouton sélectionné.
- Recherche et filtre de hauteurs différentes, options superposées aux aperçus et
  aux compteurs : marges régulières, commandes de même hauteur et options dans le flux.
- Codes `[[mw:…]]` bruts dans les aperçus : réutilisation du rendu des émoticônes.
- Portrait de conversation ovale, doubles contours de saisie et commandes désalignées :
  portraits carrés recadrés en cercle, une seule bordure et commandes de 44 px.
- Une simplification des bulles avait été appliquée pendant cette passe. À la demande
  de l’utilisateur, elle est annulée : couleurs, formes, reliefs et proportions des
  bulles texte/audio de la V1 sont rétablis. Les corrections de navigation et de saisie restent.
- Actions de nouvelle conversation rognées avec le clavier : liste seule défilante,
  en-tête, recherche et actions conservés dans la hauteur disponible.
- Texte d’accessibilité affiché dans la recherche des émoticônes : restauration de
  `sr-only`, champ flexible et suppression de l’autofocus qui ouvrait le clavier.

Captures et inspection effectuées dans la démo locale : liste du Tchat, conversation,
clavier ouvert/replié, sélection des contacts, émoticônes, informations et menu des
pièces jointes. Compilations et installation sur le Samsung effectuées. Cette passe
ne valide pas les échanges Supabase, les envois de fichiers ou la capture vocale.

## Accès temporaire pendant le chantier Tchat

À la demande de l’utilisateur, les lancements de la version debug ouvrent directement
la messagerie en démo locale, via `OPEN_MESSAGING_WORKSHOP` dans `MainActivity.kt`.
Passer cette constante à `false` à la fin du chantier pour rétablir l’entrée habituelle.
La version release et les liens de callback d’authentification conservent leur parcours.
Après l’essai du dégradé « Se connecter » sur les bulles, l’utilisateur a demandé
de reprendre exactement le chat Web. Les surcharges Android de couleurs, contours,
arrondis et padding des bulles texte et audio sont retirées : les trois feuilles
de style importées du chat Web portent directement leur apparence. La largeur
maximale reste adaptée à l’écran mobile. L’accès direct au Tchat reste actif.

Le chevron de l’en-tête ferme seulement l’activité Messagerie pour retrouver la
fonctionnalité précédente dans la pile Android. Lors du lancement direct de chantier,
il n’y a pas de fonctionnalité précédente : le retour quitte donc la messagerie.
La croix retire la tâche Meewav et ouvre l’accueil du téléphone. Le retour système
conserve la navigation interne (fermeture des panneaux, puis retour à la liste).

## Navigation et cartes mobiles — suite du chantier

Les quatre onglets restent visibles dans une conversation. Le chevron près du contact
revient à la liste ; le chevron de l’en-tête général conserve le retour à la fonctionnalité
précédente et la croix ferme la tâche Android. Le Track Pack réserve un emplacement de
44 px à sa fermeture, distinct du titre.

Le mur Collabs a été présenté lors d’un essai, puis retiré à la demande de l’utilisateur :
l’entrée affiche la liste des contacts. Sélectionner un contact ouvre la demande,
ses messages et la réponse dans la même conversation, comme dans le Web. La carte
et les messages partagent le défilement ; le champ de réponse reste en bas.
Les données `demoCollabs` viennent du site Web. Les portraits et quatre mixes
locaux dont les chemins sont assemblés dynamiquement sont ajoutés à la synchronisation
des médias. Les anciens liens fictifs externes des autres demandes restent fictifs ;
aucune donnée de démonstration ne remplace les réponses d’une session authentifiée.

## Harmonisation des quatre onglets

`scripts/messaging-brand.mjs` adapte les anciens accents roses/violets/cyan des styles
Web au conditionnement Android : noirs, gris et nuances du CTA de connexion. Les
opacités, gradients et géométries sont conservés ; les couleurs sémantiques rouge,
orange et verte ainsi que les illustrations restent distinctes. Les règles des
bulles Tchat et capsules audio gardent expressément leur finition Web demandée.
Cette adaptation utilise PostCSS déjà présent dans les dépendances Web de compilation.

Correction demandée ensuite : la carte de demande Collab reprend sa présentation
Web dépliée, ses espacements, arrondis, dégradés et reliefs. Elle est exclue de la
recoloration automatique et ne passe plus en variante compacte dans la conversation.
La liste de contacts, les messages sous la carte et le champ de réponse sont conservés.

Les en-têtes de Projets et Groupes ont une identité, des actions compactes et une ligne
de sous-onglets. Les panneaux utilisent la hauteur disponible sous les quatre onglets,
avec défilement de leur contenu et saisie en bas dans les conversations. La compilation
ne constitue pas une validation visuelle ou un essai des échanges entre comptes.

## Noir et graphite — accueil et Groupes

À la demande de l’utilisateur, l’accueil du Tchat et Groupes utilisent le noir comme
fond principal et le gris anthracite pour les surfaces et les commandes secondaires,
avec un relief discret inspiré du Track Pack. Le violet urbain marque les sélections
et les CTA principaux, sans grand voile prune sur la page. Ces règles locales se
trouvent à la fin de `mobile.css`, après les styles importés.

Les actions de fermeture et les commandes des panneaux de groupe partagent un seul
conteneur pour éviter leur superposition. Les membres, projets liés, titres et actions
ont des colonnes et espacements adaptés au mobile. Les cartes Collab et les bulles du
Tchat ne sont pas redessinées dans cette passe. Compilation et installation seulement ;
la validation visuelle reste à effectuer par l’utilisateur.

## Carte Collab adaptée à la capture mobile du 15 septembre

La capture utilisateur montrait une identité étirée, un portrait désaligné, des
statistiques empilées et un retour redondant rogné. La carte garde sa finition Web,
avec une composition Android explicite : portrait/nom/badge, statistiques et lien,
message, informations musicales, fichiers puis actions. Les lecteurs réservent une
ligne au nom de fichier. La largeur utilise le panneau disponible, et le retour
« Toutes les demandes » est masqué au profit du chevron contacts déjà présent.
La liste, les réponses et la lecture des pièces jointes conservent leurs handlers.

## Matière graphite et CTA mats — dernier ajustement utilisateur

La carte Collab passe explicitement en gris graphite/noir avec reflets neutres et
traits violets fins. Les anciens halos colorés de ses pseudo-éléments sont retirés.
« Voir profil » conserve une marge de carte de 18 px et reçoit 10 px de padding interne.

Pour la messagerie, l’utilisateur demande un violet légèrement plus bleu et moins vif :
`--mobile-violet-cta` devient `#484084 → #403976 → #2F2A57`, avec contour `#6B6398`.
C’est un ajustement de rendu Android à regarder, distinct des valeurs du bouton natif
de connexion. Les CTA principaux, lecteurs et états interactifs partagent ce traitement
mat ; les autres surfaces restent noires et grises. Les formes des bulles sont conservées.

## Barre de saisie en verre fumé — référence utilisateur Telegram

La bande opaque sous la conversation est retirée. La capsule gris/noir translucide
utilise un `backdrop-filter` de 22 px, un reflet neutre et un contour fin. Le flou
porte sur cette petite surface, sans filtre ni animation sur toute la messagerie.
Le bouton d’envoi rond garde le violet mat, avec des commandes de 44 px et un champ
de 16 px. Les pièces jointes, émoticônes, vocaux et envois gardent leurs handlers.

`useFloatingComposer.ts` mesure la hauteur de chaque barre, y compris les réponses,
les pièces jointes et les brouillons multilignes. Il réserve cet espace à la fin de
l’historique et conserve sa position lorsqu’on consulte d’anciens messages. La même
présentation s’applique aux conversations Tchat, Collabs, Projets et Groupes.
Un fond opaque est prévu en l’absence de flou ou si la réduction de transparence est
demandée. Compilation et installation seulement ; le rendu et le clavier restent à
regarder sur le Samsung par l’utilisateur.

## Haut de l’écran Projets / Track Packs simplifié

Les commandes générales Retour, Nouveau et Fermer conservent leurs zones tactiles
de 44 px sans blocs rectangulaires. Dans le projet, le nom et les informations de
contexte redeviennent visibles. Les quatre sous-onglets sont des libellés avec un
trait discret pour la sélection. Options et Nouveau projet ne sont plus répétés :
ils restent accessibles via Infos et le « + » général.

La barre du Track Pack tient sur une ligne : choix du mix, historique de la Take
et menu « Actions du Track Pack ». Ce menu regroupe Nouveau, Sauvegarder et Ajouter
une piste avec leurs actions existantes. Le lecteur et les pistes ne sont pas
redessinés. Les marges imbriquées et le défilement horizontal des commandes sont
retirés ; le contenu du projet garde son défilement vertical.

Projets et Groupes utilisent désormais la même classe `mw-mobile-workspace-header` :
nom puis contexte, mêmes marges, commandes sans boîtes et sous-onglets textuels de
44 px avec le même indicateur. Groupes conserve ses cinq destinations et son accès
Options ; Projets en compte quatre. Le retour redondant des sous-vues de groupe est
remplacé par l’onglet Chat déjà présent ; celui des étapes de création reste disponible.

Le bandeau de contact du Tchat et des conversations Collabs est translucide avec
un flou d’arrière-plan de 22 px. Il flotte sous les onglets, au-dessus des messages
qui défilent derrière. Un espace de 64 px et une marge de lecture sont réservés au
début de l’historique pour garder le premier message accessible. Nom, portrait,
retour, recherche et informations conservent leurs actions. Les onglets principaux
restent sur leur fond noir ; un fond opaque remplace le verre lorsque la transparence
est réduite ou que le flou n’est pas pris en charge.

## Essai du fond acoustique fourni par l’utilisateur

`app/src/main/assets/messaging/images/chat-acoustic-foam.png` est la copie intégrale
du fichier fourni `C:/Users/linkw/Downloads/ChatGPT Image 8 juin 2026, 09_37_32 1 (4).png`
(727 798 octets), sans redimensionnement ni réencodage. Cette nouvelle variante remplace
l’essai `(3).png`, conservé dans l’historique Git au commit `4075833`. Il est embarqué localement et
référencé dans le manifeste des ressources. Cette provenance est distincte des médias
importés du Web.

Le fond remplit les conversations avec un cadrage centré qui conserve les proportions.
Il reste immobile pendant le défilement des messages et se trouve derrière les surfaces
en verre. Les bulles gardent leurs couleurs et leur forme. Cet essai visuel reste à
apprécier sur le Samsung par l’utilisateur.

## Indicateurs repris du site

Le trait actif reprend les deux dégradés de
`Meewav-Web/src/components/navigation/meewav-pillar-tabs.css` : ligne de 1 px
qui s’efface aux extrémités et halo de 5 px flouté à 3 px. L’opacité du halo est
0,4 comme dans la surcharge Messagerie du site. Il reste ancré au bouton réel
sur Android et s’applique également aux sous-onglets Projets et Groupes.

Les compteurs non lus reprennent les violets du poteau Web actif dans
`MeewavPrimaryNav.tsx` (`isRoomsLandingChrome = true`) : `#4E349F`, `#5137A1`
et `#372574`, plutôt qu’une nouvelle couleur. Le bandeau de contact et le champ
de saisie translucides validés par l’utilisateur sont conservés.

## Bandeaux Projets / Groupes et outils mobiles

Les deux espaces reprennent le bandeau de contact translucide : chevron vers leur
liste, couverture ronde, nom et informations de l’entité. Le contenu passe derrière
le flou ; son premier élément garde une réserve de hauteur pour rester accessible.
Le chevron ne ferme pas l’application et ne remplace pas les outils internes.

La comparaison avec `Meewav-Web/src/features/messaging/ArtistGroupsWorkspace.tsx`
a retrouvé les cinq outils existants : Chat, Planning, Membres, Décisions et Projets
liés, ainsi que les paramètres du groupe. Ils conservent leurs données et handlers.
La contrainte Web de 56 px sur le bandeau et de 28 px sur ses boutons écrasait la
présentation mobile sur deux lignes : le bandeau fait désormais 64 + 44 px, avec
cinq zones tactiles de même largeur pour Groupes, quatre pour Projets. Les
informations membres/style restent visibles dans tous les outils du groupe.

Compilation et installation autorisées ; aucun test ou contrôle visuel automatique.
L’appréciation du rendu et les vérifications fonctionnelles restent à l’utilisateur.

## Violet urbain des CTA — référence utilisateur du 15 septembre 2026

La référence prioritaire est désormais le CTA « Créer un groupe » du Web,
`.mw-chat-header__primary-action` : dégradé à 135° `rgba(79,53,158,.96)` vers
`rgba(76,47,169,.94)`. Elle remplace l’essai mat précédent pour tous les CTA
principaux de messagerie, y compris le rond d’envoi, les confirmations dans les
modales et les labels de sélection de fichier utilisés comme boutons principaux.
Le reflet supplémentaire du bouton d’envoi est supprimé pour éviter une teinte
différente. Les bulles, les boutons secondaires et les bandeaux restent inchangés.
Voir [la mémoire de design](../DESIGN-MEMORY.md) pour la référence durable.

## Infos des projets — matière des demandes de Collab

L’onglet Infos reprend le graphite de la carte de demande de Collab :
`linear-gradient(150deg,#35373d 0%,#26282d 42%,#191b1f 100%)`, contour
`#6b639866`, reflet blanc discret. Les panneaux internes et actions de gestion
sont noirs/gris, les textes secondaires gris, et le CTA Inviter utilise le jeton
Violet urbain Meewav. Les confirmations conservent leurs CTA communs.

Résumé musical sur quatre colonnes, tonalité/livraison sur deux, puis direction,
équipe, mix et pilotage sur une colonne. Les rôles et droits sont regroupés sous
le nom du membre afin de laisser une vraie cible de 44 px au menu. Les handlers,
permissions et confirmations de gestion ne changent pas. Le bandeau translucide
et les autres onglets restent conservés. Compilation/installation uniquement ;
aucune validation visuelle ou fonctionnelle automatique.

## Groupes : quatre outils et couleur du rond d’envoi

Le sous-menu affiche Chat, Planning, Membres et Décisions sur quatre colonnes
égales. « Projets liés » est retiré de cette navigation ; les données de liaison
existantes ne sont pas effacées.

La référence explicitement précisée est Groupes > Membres > Inviter, dans son
rendu Android actuel. Le rond d’envoi partage déjà ce jeton, mais son état vide
était affiché à 40 % d’opacité, ce qui altérait la couleur. Il garde désormais
son fond à pleine opacité ; l’icône s’atténue seule à 45 % quand le bouton est
désactivé. La validation des messages vides ne change pas. Référence enregistrée
dans DESIGN-MEMORY.md. Compilation et installation seulement, sans QA automatique.

### Ajustement Infos : graphite plus sombre

À la demande de l’utilisateur, la carte Infos est assombrie :
`#202227 → #16181C → #0D0F12`, avec un reflet supérieur réduit. Les mix et
commandes secondaires suivent ce graphite sombre. Les CTA violets, textes,
dimensions et cartes Collab restent inchangés.
