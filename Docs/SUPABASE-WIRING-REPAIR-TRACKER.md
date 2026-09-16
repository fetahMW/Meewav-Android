# Raccordement réel — suivi d’exécution

Mission autorisée le 16 septembre 2026 après l’audit. Périmètre actualisé : **Web, Android, Supabase commun uniquement** ; aucune modification iOS. Préserver ses contrats déployés, les données existantes, le design et toutes les démos investisseurs.

Référence : [audit et constats](SUPABASE-WIRING-AUDIT-2026-09-16.md). Un contrat préparé n’est pas un déploiement ; un déploiement n’est pas une recette de bout en bout.

## Espaces de travail

- Android : `Meewav-Android-initialisation`, `codex/profil`, base `7084959`. Trois changements Gradle préexistants exclus.
- Web : `Meewav-Web-supabase-wiring`, `codex/supabase-shared-wiring`, base distante `8e07a1071` récupérée au démarrage. Aperçu canonique 5182 inchangé.
- Supabase : Meewav Dev `dqabekaqpznjsagoxzwc` ; migrations ciblées, revue et recette avant/après, pas de replay global des anciennes migrations Web.
- La préparation d’une copie iOS a précédé la restriction de périmètre ; aucune source iOS modifiée et aucune suite de travail iOS prévue.

## Matrice exhaustive de suivi

| ID | Constat / résultat attendu | Préparation | Déploiement | Vérification |
|---|---|---|---|---|
| S01 | Accès utilisateur/MFA Android compatibles avec session native | Corrigé, façade commune Web/native | Bundles Profil/Messagerie et APK reconstruits, installés | 5 tests session + 1 test React passent ; profil réel affiché sur Samsung, requêtes stabilisées à 6 |
| A01 | Création/connexion réelle → globe → retours des features | Route réelle ajoutée ; atelier démo conservé, entrée recette LIVE_AUTH | APK installé Samsung | Compilation + tests unitaires passent ; connexion réelle A → globe prêt → profil A et restauration de session vérifiées |
| A02 | Finalisation identité, rôle IA/réel/métier, avatar/scène commune | Mapping explicite des 28 avatars ; RPC communs puis marqueur de complétion | APK installé ; RPC Dev disponibles | Tests métadonnées + API réelles ; formulaire Android à vérifier |
| A03 | Brouillon Google, callbacks et disponibilité Apple | Choix avatar IA/réel conservé après retour navigateur ; compte connecté finit ses choix sans recréer un compte | APK installé | Retour Google réel non testé ; Apple toujours désactivé côté service |
| P01 | Colonnes/projections profil compatibles Web/Android | Migration identité revue, métier séparé du statut IA/réel | Dev : 20260916120000 | RPC réels + édition/relecture dans deux sessions Auth ; interfaces encore à vérifier |
| P02 | Confidentialité PII et droits sur champs d’autorité | Projections publiques étroites, RPC propriétaire, droits par colonne | Dev : 20260916120000 | Tests SQL rollback + API avec deux comptes : PII/grade/écriture tierce refusés. Ancien RPC e-mail reste ouvert en P03 |
| P03 | Connexion username sans exposition d’e-mail, compatibilité legacy | À faire | Non | Non |
| P04 | Profil propriétaire/public, visibilité et préférences | À faire | Non | Non |
| P05 | Médias privés : lecture, upload, publication, archivage | Schéma et retry idempotent corrigés, compatibilité legacy préservée | Dev : 20260916123000 | 9 tests service ; recette réelle A/B : import, publication, lecture publique, archivage, privé refusé au tiers |
| P06 | Métriques, classement, grades et notifications | Métriques/grades/classement raccordés ; notifications restent à recetter | Dev : 20260916130000, 131000 et 132000 ; cron quotidien actif | SQL propriétaire/tiers/idempotence/grade refusé ; API réelle ; aucun état erreur sur Samsung |
| P07 | Espace privé/sécurité, cadeaux/attestations et outils locaux | À faire | Non | Non |
| M01 | Tchat commun Web/Android et conversation réelle existante | À faire | Non | Non |
| M02 | Citations, réactions, épingles, transfert/suppression/préférences | À faire | Non | Non |
| M03 | Invitations, blocage/signalement et permissions | À faire | Non | Non |
| M04 | Collabs : requêtes, pièces jointes, discussion, réponses | À faire | Non | Non |
| M05 | Projets : membres, tâches, outils et discussion | À faire | Non | Non |
| M06 | Groupes : membres, planning/décisions, discussion | À faire | Non | Non |
| M07 | Vocaux : limites, retries, stockage privé et lecture distante | À faire | Non | Non |
| M08 | Vidéo Web/Android, jetons, signalisation et cycle de vie | À faire | Non | Non |
| G01 | Population publique réelle, recherche, Top 10, profils/actions | À faire | Non | Non |
| G02 | Pont session/arrivée Android, démo distincte du réel | À faire | Non | Non |
| R01 | Recette A/B/C : propriétaire/tiers/bloqué, reconnexion, réseau | À faire | Non | Non |

Les paiements, signatures juridiques et quatre prochains piliers ne sont pas à développer dans cette mission. Toute commande qui dépend d’un tel service doit garder un état honnête, sans simuler une mutation réelle.

## Journal

- 16 septembre : audit conservé, comparaison backend déjà disponible ; préparation des espaces isolés. Aucun changement distant à cette étape.
- S01 : lecture Auth REST avec le jeton natif, contrôle d’identité et invalidation après déconnexion/changement de compte ; suppression des appels `supabase.auth` incompatibles dans les cinq services importés. Aucun second refresh token ni session Web créée. Tests `node --test scripts/session-identity.test.mjs` : 5/5. Build du bundle Profil effectué, pas de validation de bout en bout revendiquée.
- Identité : migration dérivée revue de la fondation Web, testée sous rôles anon/authenticated dans une transaction annulée, puis appliquée à Dev (SHA-256 `1b5764348dfe897b41ffdeaaa2dcc5b7b2cc4b6a13f876e4b619a72627094cc1`). Comptes/profils/messages existants : cardinalités inchangées. Les lectures publiques nommées et écritures d’onboarding Swift actuelles restent permises ; aucune modification iOS. Le RPC historique username → e-mail reste explicitement ouvert, sans prétention de résolution P03.
- Recette réelle `node scripts/shared-identity-live.mjs` : deux comptes dédiés privés, inscription Auth, onboarding/scène, édition de profil, nouvelle session/relecture, refus PII/champs d’autorité/écriture tierce et invisibilité du profil privé. Succès le 16 septembre à 05:57 UTC. Il s’agit de tests API, pas d’une recette des interfaces. Les secrets de recette restent dans `app/build/shared-recipe` ignoré ; aucun compte tiers utilisé.
- Android Auth : `assembleDebug` et `testDebugUnitTest` réussis. APK installé sur le Samsung connu, entrée réelle lancée avec `com.meewav.android.LIVE_AUTH=true`. Téléphone verrouillé : aucune validation visuelle revendiquée. Le globe reste à raccorder à sa population réelle (G01/G02) même si la navigation authentifiée est maintenant préparée.

- Samsung déverrouillé : compte de recette A connecté par le formulaire Android, globe `ready`, navigation vers le profil avec identité/bio réelles ; relance LIVE_AUTH restaure la session native. Aucune nouvelle inscription complète ni OAuth encore vérifié par interface.
- S01 complément : identité React native stabilisée avec useSyncExternalStore. Une nouvelle référence utilisateur à chaque rendu provoquait auparavant des requêtes répétées. Test rerender/refresh/logout/changement de compte : 1/1. Sur Samsung, deux observations successives restent à 6 requêtes REST, chargement terminé.
- P05 : migration média SHA-256 `9d3090beba6f6f3b512e9071b433980eeea42f36a9756ef7a66e047fbaf511c3` testée en rollback puis déployée à 06:08 UTC. Recette API par le service client réel à 06:13 UTC : un seul média au retry, lecture tierce privée refusée, publication téléchargeable, archivage interdit les nouvelles URL signées. Une URL signée déjà émise reste valide jusqu’à son expiration. Objet de recette nettoyé.
- Profil : chiffres/activité et actions de démonstration limités au mode démo explicite ; compte réel présente ses valeurs et ses états vides. Démonstration investisseurs conservée. Statistiques et classement encore indisponibles, prochain lot.

- P06 : contrats analytiques testés en rollback puis déployés. Visites rejouées sans doublon, 2 visites d’un même compte donnent 2 vues/1 visiteur ; événements d’autorité refusés au client ; chiffres privés propriétaires seulement ; suivi réel émet un événement serveur. Grades existants conservés avec plancher de points du niveau, ancien RPC iOS de tier inchangé.
- Classement : quatre échelles testées et population privée exclue. Premier calcul réalisé ; pg_cron disponible mais absent a été activé puis job quotidien 03:17 UTC installé. API réelle du compte A privé renvoie zéro classement, aucune fausse position. Deux erreurs visibles du profil Samsung ont disparu après relecture. Les producteurs d’événements Globe/Messagerie restent à recetter dans leurs lots.
