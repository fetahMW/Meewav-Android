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
- La saisie occupe une ligne de grille sous l’historique. Les insets du clavier
  redimensionnent l’espace disponible ; ils ne mettent pas la fenêtre à l’échelle.
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

Collabs affiche le mur et les données `demoCollabs` du site Web en mode démo, avec
défilement dans le panneau jusqu’au bas des demandes. Les portraits et quatre mixes
locaux dont les chemins sont assemblés dynamiquement sont ajoutés à la synchronisation
des médias. Les anciens liens fictifs externes des autres demandes restent fictifs ;
aucune donnée de démonstration ne remplace les réponses d’une session authentifiée.
