# Meewav — trois testeurs réels

Suite commune aux dépôts Android, Windows et Web viewer. Elle utilise le backend
déjà configuré, trois identités dédiées et l'authentification ordinaire. Aucune
session fictive. Les réparations de déploiement nécessaires sont consignées
séparément ; la suite ne déploie jamais de migration automatiquement.

## Outillage réutilisé

| Existant | Réutilisation / limite |
|---|---|
| Playwright Windows/Web (`@playwright/test`) | Contextes Chromium isolés, Electron et WebViews Android ; pas de nouveau framework |
| Tests E2E Tremplin et smoke Web | Conservés ; le serveur QA distinct démarre les parcours LIVE |
| Maestro 2.10.0 déjà installé | Flows conservés ; connexion aux transports Wi-Fi refusée dans cet environnement, donc non validés ici |
| ADB et hiérarchie Android existants | Repli pour les contrôles natifs réels ; aucun framework ou APK de pilotage ajouté |
| `.maestro/rooms/edge/` | Référence des libellés et parcours Rooms ; wrappers historiques spécialisés |
| `scripts/messaging-dual-agent/` | Réutilisation des sélecteurs et des RPC de vérification ; son lanceur AVD avec remise à zéro n'est jamais appelé |
| Tests unitaires Kotlin et Node Electron | Vérification du refus des raccourcis de test en production |

Les nouveaux fichiers sont ici et dans `.maestro/qa-three-users/`. `core.mjs`
centralise comptes, assertions backend et rapport ; `desktop.mjs` démarre les
serveurs et les sessions isolées ; `mobile.mjs` associe les contrôles natifs au WebView existant ;
`native.mjs` pilote les libellés visibles avec ADB (configuration physique par défaut) ;
`messaging.mjs` pilote les contrôles réels ; `navigation.mjs` teste Globe/Rooms.
Les changements du provisionneur et des lecteurs de configuration QA ne changent
pas les règles métier. Voir aussi `Docs/test-accounts.md`.

## Lancer depuis le dossier Meewav-Android

Prérequis : dépendances déjà installées dans les dépôts Windows et Web viewer,
Node, Chromium Playwright, Electron local et configuration Supabase existante.
Le provisionneur est idempotent ; il ne crée pas de nouvelles identités à chaque run.

```powershell
node scripts/test-accounts/provision.mjs
node scripts/qa-three-users/preflight.mjs
node scripts/qa-three-users/check-room-deployment.mjs
node scripts/qa-three-users/run.mjs --suite messaging
node scripts/qa-three-users/run.mjs --suite navigation
```

La configuration exemple ouvre **trois navigateurs contextuels headless**, sans
Chrome externe visible. Les ports dédiés sont 5281/5282. Si un port est déjà
occupé, la suite s'arrête au lieu de se raccorder à un serveur inconnu.

`check-room-deployment.mjs` lit seulement les dépendances SQL et l'historique
des quatre migrations liées au catalogue/lancement. Il utilise la connexion
PostgreSQL locale existante, sous transaction en lecture seule. Il n'applique
aucune migration et ne remplace pas le test réel du catalogue.

### Samsung + Redmi + Windows

Les deux téléphones doivent être déverrouillés, visibles dans ADB et équipés de
`com.meewav.android.debug`. Aucun APK n'est réinstallé par le runner. Les serials
Wi-Fi changent parfois : les reprendre dans `adb devices -l`.

```powershell
node scripts/qa-three-users/configure-physical.mjs "<serial Samsung>" "<serial Redmi>" electron
node scripts/qa-three-users/run.mjs --config .local/qa-three-users/physical-electron.json --suite messaging
```

Si les téléphones sont **déjà connectés aux bons comptes** et affichent le Globe
ou la Messagerie, préserver ces sessions :

```powershell
node scripts/qa-three-users/run.mjs --config .local/qa-three-users/physical-electron.json --suite messaging --reuse-android-sessions
```

Ce mode ne relance pas les applications mobiles et n'utilise pas d'événements
ADB pour cliquer. Il pilote les boutons WebView de la messagerie avec Playwright.
Sur Android, l'envoi attend l'état prêt du bouton visible et activé, puis déclenche
son événement DOM `click`. Les appuis par coordonnées se sont révélés instables
dans la WebView attachée, notamment pendant l'ouverture du clavier. Le handler
du produit, sa session réelle et ses RPC sont ainsi testés ; ce contrôle ne valide
pas la zone tactile native ou l'ergonomie du clavier. Aucun envoi API ne remplace
l'action de l'interface.
Avant le premier message, la session réellement utilisée par une recherche de
contacts est vérifiée auprès d'Auth : elle doit correspondre au testeur attendu.
Le jeton reste en mémoire, sans export dans les rapports. Le mode est limité au
parcours Messagerie depuis le Globe ; il n'automatise pas la connexion initiale
ni le changement de compte pour une rotation.

Sans `--reuse-android-sessions`, le lancement de test redémarre l'application debug et utilise **Application
réelle**, qui déconnecte uniquement la session locale, puis remplit e-mail et mot
de passe. Il n'efface ni données, ni cache, ni trousseau. L'instance Windows de
test a son propre userData ; la fenêtre Windows personnelle n'est pas relancée.
Si le formulaire normal reste inaccessible, le test échoue sans vider l'app.
Certains réglages HyperOS refusent les événements ADB (`INJECT_EVENTS`) même avec
le débogage Wi-Fi actif. Ce refus doit apparaître comme blocage du pilote ; il ne
prouve pas un échec d'authentification. Les accès du seul Redmi sont dans la fiche
privée `.local/test-accounts/Redmi-connexion-privee.txt` lorsqu'elle a été préparée.

Pour remplacer le PC Windows par le site :

```powershell
node scripts/qa-three-users/configure-physical.mjs "<serial Samsung>" "<serial Redmi>" web
node scripts/qa-three-users/run.mjs --config .local/qa-three-users/physical-web.json --suite messaging
```

Après un passage Windows réussi, vérifier les échanges Android ↔ Web sans répéter
la paire Android ↔ Android et sans reconnecter les téléphones :

```powershell
node scripts/qa-three-users/run.mjs --config .local/qa-three-users/physical-web.json --suite messaging --reuse-android-sessions --pc-pairs-only
```

### Rotation des identités

```powershell
node scripts/qa-three-users/run.mjs --config .local/qa-three-users/physical-electron.json --rotation 1 --suite messaging
node scripts/qa-three-users/run.mjs --config .local/qa-three-users/physical-electron.json --rotation 2 --suite messaging
```

| Rotation | Samsung | Redmi | PC |
|---|---|---|---|
| 0 | testeur1 | testeur2 | testeur3 |
| 1 | testeur2 | testeur3 | testeur1 |
| 2 | testeur3 | testeur1 | testeur2 |

Trois profils restent simultanément connectés. Pour chaque paire, le premier
crée/ouvre la discussion par la recherche de contacts, l'autre la reçoit, puis
deux textes uniques sont échangés. Le script vérifie l'affichage et le même message
persisté côté serveur sous les permissions des deux comptes. Il ne conclut pas
au succès à partir d'une simple bulle d'envoi optimiste.

## Catalogue des cas

| Cas | Préconditions / utilisateurs | Actions | Attendu | Automatisation |
|---|---|---|---|---|
| AUTH-API | Trois comptes provisionnés | Auth réelle, lecture profil | Auth et profil correspondent | Oui, preflight |
| AUTH-01 | App/page accessible, trois comptes | Saisie normale puis connexion | Trois sessions distinctes LIVE | Oui |
| AUTH-02 | Contrôle de déconnexion exposé | Clic, retour au formulaire | Session locale terminée | Conditionnelle ; NOT_RUN si UI absente |
| MSG-API | Trois comptes connectables | Recherche de chaque autre testeur | Six résultats corrects | Oui, preflight |
| MSG-01 | testeur1 + testeur2 | Création/réception, envoi puis réponse | Texte vu et stocké des deux côtés | Oui |
| MSG-02 | testeur2 + testeur3 | Même parcours | Même résultat | Oui |
| MSG-03 | testeur3 + testeur1 | Même parcours | Même résultat | Oui |
| GLOBE-01 | Chaque compte connecté | Ouvrir Globe, contrôler scène et navigation | Canvas visible, boutons utilisables | Oui ; qualité visuelle manuelle |
| ROOMS-API | Chaque compte connecté | Lire catalogue avec sa session | Lecture autorisée | Oui, ne valide pas le média |
| ROOMS-01 | Chaque compte connecté | Ouvrir catalogue | Catalogue réel, aucune bascule démo | Oui |
| ROOMS-01b | Android ou Web connecté | Ouvrir/refermer préparation Android ; contrôler rôle Web | Aucun live lancé ; Web reste viewer | Oui |
| ROOMS-02 | Trois appareils, host Android/Windows | Créer, ouvrir, inviter, rejoindre, quitter | Même Room et participants cohérents | Procédure coordonnée manuelle pour le live |
| ROOMS-03 | Room active, trois appareils | Mic/mute, vidéo, effets, messages pendant live | Son/image/effets réels, confidentialité | Non, manuel |
| ROOMS-04 | Room active | Couper/rétablir Wi-Fi, sortie/rentrée | Reconnexion sans doublon ni diffusion résiduelle | Non, manuel |

L'automatisation n'évalue ni le rendu subjectif, ni la latence ressentie, ni la
qualité des appels. [ROOMS-MANUAL.md](ROOMS-MANUAL.md) donne les étapes et rotations
hôte Samsung → Windows → Redmi. Le site Web reste viewer et ne doit pas devenir host.

## Rapports, échecs et confidentialité

Chaque lancement écrit `.local/qa-three-users/<run>/report.md` et `report.json` :
scénario, plateforme, compte, attendu, observé, PASS/FAIL/NOT_RUN et événements
horodatés. Les échecs après authentification produisent des captures. Les erreurs
HTTP gardent uniquement origine/chemin/statut, jamais requêtes, headers ou jetons.
Pas de HAR, pas d'export de session, pas de mot de passe dans les arguments CLI.

Les profils Chromium sont temporaires. Le userData Electron isolé reste dans
`.local/qa-three-users-private/`, hors des rapports ; ne jamais partager ce
dossier, qui peut contenir une session comme tout profil d'application.

Comptes et nouveaux rapports sont dans `.local/`, ignoré par Git et distinct des
sorties Gradle. Les anciens comptes de `app/build/test-accounts/` sont copiés
automatiquement une seule fois, sans écraser les fichiers existants. Les anciens
rapports restent à leur emplacement d'origine dans `app/build/qa-three-users/`.

Le pilote ADB transmet les identifiants à l'entrée standard du shell, sans les
mettre dans les arguments du processus ni les diagnostics. Il trouve les
contrôles dans la hiérarchie visible, sans coordonnées fixes propres à un écran.
Maestro reçoit les secrets via variables `MAESTRO_` héritées. Ses journaux textuels
sont expurgés après exécution. Tous les artefacts restent locaux et ignorés par
Git ; vérifier une capture avant de la partager (elle peut contenir un nom ou un
e-mail). Les comptes et leurs accès ne figurent jamais dans le rapport public.

Un FAIL signifie que ce scénario n'est pas validé, même si le backend répond.
NOT_RUN signifie non exécuté, jamais succès. Les messages QA volontairement envoyés
restent dans les seules conversations entre les trois comptes dédiés.

Le runner ferme uniquement les contextes et processus qu'il a créés. Il détache
le débogage Android sans désinstaller ou vider l'application. Aucun émulateur
existant n'est lancé, réinitialisé ou effacé.

## Références des outils

Les API de pilotage [Electron](https://playwright.dev/docs/api/class-electron) et
[Android](https://playwright.dev/docs/api/class-androiddevice) de Playwright sont
expérimentales : les résultats des scénarios exécutés restent la référence.
Maestro permet les variables d'environnement préfixées `MAESTRO_`
([documentation](https://docs.maestro.dev/maestro-flows/flow-control-and-logic/parameters-and-constants)).
