# Phase de test réelle — 28 septembre 2026

## Périmètre et comptes

Trois profils Auth réels dédiés, avec les mêmes identifiants qu'avant cette phase :
`testeur1` (Samsung), `testeur2` (Redmi), `testeur3` (PC). Le profil personnel n'est
pas modifié. Les accès restent uniquement dans les fichiers privés ignorés par
Git. Les connexions des tests passent par l'authentification ordinaire. Le mot de
passe du seul `testeur2` a été raccourci à la demande de l'utilisateur, puis sa
connexion réelle vérifiée. La fiche privée Redmi a été actualisée dans `.local/`
et dans son ancien emplacement `app/build/`.

Environnements effectivement utilisés : APK Android **debug déjà installé**,
sources Windows `Meewav-Windows` dans une instance Electron isolée, et site local
`Meewav-Web-viewer-parity` dans des contextes Chromium invisibles. Ces résultats
ne valident pas un installeur Windows distribué ni un déploiement Web public.
L'application Windows personnelle reste ouverte et n'a pas été réinitialisée.

## Résultats prouvés

| Parcours | Résultat | Preuve |
|---|---|---|
| Trois comptes, 2 Web + Electron, authentification normale | 3 réussites | `app/build/qa-three-users/three-users-r0-2026-09-28T12-41-46-035Z/report.json` |
| Messagerie entre les trois paires, aller et retour | 6 messages visibles, mêmes messages persistés sous les permissions des deux comptes | Même rapport |
| Auth et recherche mutuelle des profils | 3 authentifications et 6 recherches réussies | `.local/qa-three-users/backend-preflight-2026-09-28T13-27-18-939Z/report.json` |
| Globe Web et Electron | Canvas et navigation affichés | `.local/qa-three-users/three-users-r0-2026-09-28T13-26-29-706Z/report.json` |
| Site Web viewer | Contrôle de lancement host absent | Même rapport |
| Connexion native Samsung | Réussie via le formulaire normal | `app/build/qa-three-users/three-users-r0-2026-09-28T13-08-58-398Z/report.json` |
| Sessions réelles Samsung et Redmi + connexion Electron | 3 identités vérifiées ; les sessions mobiles existantes sont conservées | `.local/qa-three-users/three-users-r0-2026-09-28T14-44-23-290Z/report.json` |
| Samsung ↔ Redmi, Redmi ↔ Electron, Electron ↔ Samsung | **3 paires réussies, 6 messages** visibles et persistés sous les permissions des deux comptes | `.local/qa-three-users/three-users-r0-2026-09-28T15-12-12-906Z/report.json` |
| Samsung ↔ Web viewer, Redmi ↔ Web viewer | **2 paires réussies, 4 messages** visibles et persistés sous les permissions des deux comptes | `.local/qa-three-users/three-users-r0-2026-09-28T15-12-57-124Z/report.json` |
| Catalogue Rooms, premier passage | Échec HTTP 404, corrigé par le déploiement décrit ci-dessous | Rapport de navigation et preflight ci-dessus |
| Déconnexion depuis l'interface courante | Non exécutée : contrôle non exposé sur la surface testée | Rapports |

Les dix messages des deux dernières suites ont été échangés sur les deux
téléphones physiques connectés en Wi-Fi, avec `testeur1` sur Samsung, `testeur2`
sur Redmi et `testeur3` sur le PC. La session du PC utilise successivement Electron
et le Web local. Les deux téléphones sont restés connectés après les tests.

Les premières erreurs de sélecteurs du pilote ont été corrigées. Elles ne sont
pas attribuées au produit ; les preuves ci-dessus correspondent aux parcours
effectivement terminés. Les messages QA restent entre les seuls comptes dédiés.

## Déploiement Supabase corrigé

Le projet commun répond à Auth et Messagerie. Le premier inventaire avait trouvé
absents `rooms_live_catalog_v1`, `rooms_create_desktop_v1`,
`rooms_complete_desktop_wave_v1`, `rooms_v2.launch_status`, `wave_sessions_v3` et
`rooms_launch_wave_production_v5`. Les migrations correspondantes existent dans
le dépôt Windows. Les six migrations suivantes ont maintenant été appliquées ensemble :

- `20260822220000_wave_production_core_v3.sql`
- `20260822224500_wave_asset_pipeline_v4.sql`
- `20260822233000_wave_production_runtime_v5.sql`
- `20260926122000_rooms_atomic_desktop_launch.sql`
- `20260926130000_messaging_calls_cross_client.sql`
- `20260926131000_rooms_live_catalog.sql`

Inventaire initial :
`.local/qa-three-users/rooms-deployment-2026-09-28T13-27-39-583Z/deployment.json`.

Une première tentative de la seule migration catalogue avait été annulée. La
chaîne complète a ensuite été vérifiée dans une transaction annulée, puis
appliquée atomiquement au projet commun. La déclaration manquante de `v_room`
dans `rooms_initialize_wave_production_v3` a été corrigée dans la migration source.
Le script `deploy-rooms.mjs` reste en dry-run par défaut ; seul `--apply` valide
la transaction. `check-room-deployment.mjs` demeure en lecture seule.

Preuves du déploiement :

- `.local/qa-three-users/rooms-deploy-dry-run-2026-09-28T17-14-49-463Z/deployment.json`
- `.local/qa-three-users/rooms-deploy-2026-09-28T17-15-58-837Z/deployment.json` (`committed=true`)
- `.local/qa-three-users/rooms-deployment-2026-09-28T17-18-22-136Z/deployment.json`

Après application, le catalogue répond HTTP 200 pour les trois testeurs et
`messaging_video_call_v1` accepte `peek` (HTTP 200, aucune communication en cours).
Cela corrige l'erreur de polling ; aucun appel audio ou vidéo n'est validé ici.

Un cycle réel **API avec JWT de chaque testeur** a réussi : testeur3 crée une
Room Place ; testeur1 et testeur2 la lisent puis la rejoignent ; testeur3 invite
testeur1, qui accepte ; testeur3 ferme la Room. Toutes les opérations répondent
HTTP 200. La Room `6752995f-cd7b-4a4b-a1e0-d8ee9c65cfa4` est désormais `ended`.
Ces appels ont été observés par Luna, sans rapport JSON de cycle persistant.
Ils prouvent le circuit serveur, pas les écrans ni le transport des médias.

Autre défaut reproduit : la connexion par **nom d'utilisateur** `testeur2` via
l'Edge Function `username-sign-in` retourne HTTP 401, même après renouvellement
du mot de passe. La connexion directe **par e-mail** avec ce même compte et son
nouveau mot de passe réussit. Utiliser l'e-mail de la fiche privée pour cette
phase ; ne pas présenter le raccourci par nom comme validé. Aucun changement de
l'Edge Function n'a été fait.

## Raccordement du Globe Web

Windows et Android possédaient déjà le mode réel du Globe. Le Web local affichait
encore les avatars de démonstration après authentification : son iframe n'avait
ni le mode réel, ni le bridge des marqueurs publics. Le port ciblé dans
`Meewav-Web-viewer-parity` raccorde maintenant ce mode à la session Auth, charge
`globe_public_markers_v1`, ouvre les préprofils réels et conserve la démo pour
les visiteurs. Les messages iframe sont limités à l'origine et à la frame
attendues ; aucun jeton n'est transmis à l'iframe. Une erreur serveur ne remplace
pas les vrais profils par des avatars de démonstration.

Compilation Web réussie et 9 tests ciblés réussis (bridge, visiteurs, sélection
de profil public, erreur de rafraîchissement, pagination et parsing). Le dossier
stable `Meewav-Web` et tout site publié restent inchangés par cette correction.

Le contrôle Web après correction confirme l'iframe `mode=real`, la fin du
chargement, l'API HTTP 200 avec 16 marqueurs dont les trois QA, et le résultat
de recherche `testeur2 · DJ · Paris`. Son premier essai de clic par locator
canvas a expiré ; il ne valide pas encore le préprofil ni la collaboration.
Preuve : `.local/qa-three-users/globe-collab-headless-2026-09-28T18-02-42-540Z/report.json`.
Un dernier essai avec pointeur direct s'est arrêté sans trace exploitable :
aucun succès supplémentaire n'est compté. Le serveur QA du port 5281 est arrêté.
Le parcours Web préprofil → Contacter → collab reste donc à confirmer dans l'interface.

Les trois profils QA sont désormais disponibles pour recevoir des collaborations,
via leur propre authentification et après contrôle de leur identité QA. Aucun
profil personnel n'a été modifié. Preuve :
`.local/qa-three-users/collab-qa-preparation-2026-09-28T17-37-20-380Z/report.json`.

## Actions Globe réellement exécutées

Dans Electron de développement isolé, testeur3 s'est authentifié normalement,
a recherché testeur1, sélectionné le résultat puis cliqué l'avatar sur le canvas.
Le préprofil réel s'est ouvert. « Contacter » a ouvert `/messages` avec
`mode=real`, le `profileId` exact de testeur1 et son nom visible.

Une demande de collaboration courte a ensuite été envoyée depuis le même
préprofil : `request_profile_collaboration` HTTP 200. Les listes de l'émetteur et
du destinataire confirment la même demande
`3be86022-7ce4-48ce-bfb4-844bb7134031`, le message exact, `source=globe`, les bons
profils et le statut `pending`. Un premier faux négatif du pilote utilisait les
mauvais noms de champs ; le contrôle corrigé utilise `request_id` et
`other_profile_id`. Une seule demande a été créée.

Preuve : `.local/qa-three-users/globe-live-win-testeur3-2026-09-28T17-54-36-653Z/report.json`.
L'instance Electron isolée et son serveur QA (port 5282) ont été arrêtés après
validation, sans fermer l'application Windows personnelle.

Sur Redmi, la recherche a retrouvé l'unique testeur1 et centré la caméra ; le
survol affichait son nom. L'ouverture du préprofil n'a pas été confirmée après
l'appui. En fin de passe, aucun socket WebView n'était attachable sur Samsung ni
Redmi. La réception de la carte collab dans leur interface n'est donc pas validée.
Un helper avait tenté le parcours de login faute du flag de réutilisation :
HyperOS l'a refusé. Les reprises doivent conserver `reuseAndroidSessions=true`.
Aucun remplacement de session ou nouvelle saisie d'identifiants n'a été forcé.
La capture finale du Redmi confirme le sélecteur « Mode démo / Application réelle ».
Celle du Samsung est noire, donc son écran exact est indéterminé. Captures :
`.local/qa-three-users/device-state-final/`. La réouverture des applications a été
demandée à l'utilisateur pour reprendre uniquement les contrôles téléphones restants.

## Téléphones et validations restantes

Sur Redmi, HyperOS a refusé `input tap` avec `INJECT_EVENTS`. Les premières
tentatives n'ont donc pas soumis les identifiants. Ce blocage de pilotage ne
constitue pas un refus du compte par Supabase. Maestro a également refusé les
transports Wi-Fi identifiés ; ses flows sont préparés mais non validés ici.
Le composant Android officiel de Playwright v1001 a été téléchargé localement ;
ce téléchargement seul ne valide aucune action sur le Redmi. Une seule tentative
`device.info` sur ce téléphone a ensuite expiré après 45 secondes. Aucun clic ni
remplissage n'a eu lieu ; le processus du probe a été arrêté. L'état d'installation
du pilote sur le téléphone n'a pas été confirmé.

Après connexion manuelle du Redmi, les deux WebViews de messagerie ont pu être
pilotées via le canal de débogage déjà présent, sans saisie native ni nouvelle
installation. Chaque identité mobile a été confirmée avec le jeton réellement
utilisé par sa requête de recherche de contacts, puis le service Auth. Les jetons
restent en mémoire et ne sont pas ajoutés aux rapports.

Les premiers essais d'envoi physique sont restés dans le brouillon du Samsung.
Un appui tactile sur le brouillon déjà posé a ensuite produit `send_message_v1`
HTTP 200, vidé la saisie et affiché le message sur les deux téléphones. Le
diagnostic a mesuré le déplacement du bouton de `y=689,09` à `y=378,69` dans les
300 ms après la saisie, pendant l'ouverture du clavier. L'attente de stabilité
n'a pas suffi à fiabiliser les appuis par coordonnées. Le pilote déclenche donc
l'événement DOM `click` du vrai bouton visible, activé et prêt ; deux essais
aller-retour ont alors réussi, avec HTTP 200, brouillons vidés et messages dans
les deux timelines. Cette méthode valide le handler et le circuit réel de
messagerie, pas la zone tactile native. Les essais antérieurs échoués ne sont
pas comptés comme échanges validés.

La messagerie Android ↔ Android, Android ↔ Windows et Android ↔ Web a finalement
réussi dans les deux directions avec vérification serveur (rapports ci-dessus).
Restent à valider les rotations 1 et 2, les écrans de création/entrée/sortie et d'invitation des Rooms,
micro, vidéo, effets, qualité et retard audio, coupure Wi-Fi et reconnexion.
Les rotations nécessitent encore de changer les comptes dans les formulaires
natifs ; leur pilotage sur Redmi est bloqué par la permission `INJECT_EVENTS`.
La connexion manuelle existante n'a pas été supprimée pour tenter ces rotations.
Le déploiement Rooms et le cycle serveur sont maintenant vérifiés comme indiqué
plus haut ; ils ne remplacent pas les essais de live et de médias sur les appareils.

## Existant réutilisé et ajouts

Playwright déjà présent côté Windows, son support Electron/WebView Android,
Maestro et ADB existants, ainsi que les RPC de messagerie ont été réutilisés.
Les scénarios historiques, émulateurs et données des applications sont préservés.

Ajouts : runner à trois utilisateurs, assertions UI et serveur, rotation des
identités, connexions normales, isolation Electron, captures d'échec hors saisie
des mots de passe, rapports expurgés, preflight API, inventaire SQL en lecture
seule et procédure manuelle des Rooms. Aucun second framework mobile ajouté.

Fichiers concernés par cette phase :

- Android : `scripts/qa-three-users/`, `.maestro/qa-three-users/`,
  `scripts/test-accounts/provision.mjs`, `install-local.mjs`, `local-state.mjs`,
  `rotate-password.mjs`, `Docs/test-accounts.md`, `.gitignore`.
- Android : `core/auth/LocalTestAccounts.kt` et son test unitaire, limités aux
  trois alias QA ; le garde `BuildConfig.DEBUG` reste obligatoire.
- Windows : `apps/meewav-studio/main.cjs`, `test-accounts.cjs`,
  `test-accounts.test.cjs`, `TEST-ACCOUNTS.md`. Le raccourci QA exige un lancement
  non packagé et le flag explicite. Il est refusé dans une application packagée.
- Web viewer local : configuration Supabase ajoutée à `.env.local` ignoré, à partir
  du même projet que les deux autres clients. Aucune clé n'est placée dans Git.

Tests unitaires ciblés des comptes Android et compilation Kotlin debug réussis ;
6/6 tests Node du garde Windows réussis. Les modifications QA du code source n'ont
pas été présentées comme un nouvel installeur publié.
Les 14 scripts `.mjs` de QA et des comptes passent la vérification de syntaxe Node.
Une recherche ciblée n'a trouvé aucun secret littéral dans ces scripts ; Git
ignore les accès privés, les profils Electron et les rapports de cette phase.

## Relancer

Depuis `C:\Users\linkw\Desktop\Meewav-Android` :

```powershell
node scripts/qa-three-users/preflight.mjs
node scripts/qa-three-users/check-room-deployment.mjs
node scripts/qa-three-users/run.mjs --suite messaging
```

Pour les deux téléphones et Windows, reprendre leurs serials ADB actuels :

```powershell
node scripts/qa-three-users/configure-physical.mjs "<Samsung>" "<Redmi>" electron
node scripts/qa-three-users/run.mjs --config .local/qa-three-users/physical-electron.json --suite messaging --reuse-android-sessions
```

Voir [README.md](README.md) pour les rotations et tous les cas, et
[ROOMS-MANUAL.md](ROOMS-MANUAL.md) pour la procédure sur Samsung, Redmi et PC.

**Aucun commit ni push pendant cette phase.**
