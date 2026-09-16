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
| M01 | Tchat commun Web/Android et conversation réelle existante | Contrat canonique et projection legacy bidirectionnelle ; adaptateur Android commun | Dev : 20260916140000 ; APK installé | 104 assertions SQL ; API A/B simultanée ; conversation réelle et messages visibles Samsung |
| M02 | Citations, réactions, épingles, transfert/suppression/préférences | RPC actions et réactions actuelles ; Android lit v3 | Dev : 20260916152000, 153000 | 18 assertions + pin/réaction/suppression intercontrats ; UI actions à recetter |
| M03 | Invitations, blocage/signalement et permissions | Fondation commune et Realtime privé raccordés ; appels à durcir | Dev : 20260916140000, 151000 | Suites SQL ; vraie souscription native : canal tiers refusé, notification reçue 406 ms |
| M04 | Collabs : requêtes, pièces jointes, discussion, réponses | Workflow, fichiers et discussion dédiée distincte du DM | Dev : 20260916143000, 145000, 153000 | 50 + 88 assertions SQL, isolation/retry discussion collab ; UI à recetter |
| M05 | Projets : membres, tâches, outils et discussion | Socle projets/membres/tâches raccordé ; outils locaux à terminer | Dev : 20260916144000 | 83 assertions SQL ; UI et Track Pack persistants à recetter |
| M06 | Groupes : membres, planning/décisions, discussion | Socle groupes et membres raccordé ; planning/décisions à examiner | Dev : 20260916150000 | 58 assertions SQL ; UI/outils restent à recetter |
| M07 | Vocaux : limites, retries, stockage privé et lecture distante | AAC legacy exposé au lecteur commun ; autres conversations par attachments ; réservation vocale corrigée | Dev : 20260916154000 ; APK 08:55 installé, dernier correctif client à installer | Contrat natif + projection SQL + 7 tests service ; micro et lecture physique restent à recetter |
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

- M01 : migration partagée SHA `0d9ae3600d6e5231bec854187d031402de0eca12b2f04d734f11afae687985a8` appliquée après recette rollback. Anciennes conversations/messages/accusés préservés ; les nouveaux directs Web sont visibles dans la projection legacy. API réelle A/B à 06:38 UTC : envois simultanés opposés, mêmes identifiants, retry sans doublon. Aucun destinataire humain.
- Recherche contacts : ajout des tables de reconnaissances serveur manquantes, sans attribuer de badge. Attribution client refusée, progression idempotente, profil privé absent de la projection publique. La suite existante messagerie (104 assertions) passe en rollback, avec uniquement l’appel de fixture onboarding adapté au nom réellement déployé. Les fonctionnalités avancées et appels vidéo restent en cours.

- Lot messagerie avancée : migrations 143000→154000 effectivement déployées, preuves SHA et recettes dans app/build/shared-schema. Suites : 50 collabs, 83 projets, 88 attachments, 58 groupes, 35 realtime, 18 actions plus exercices intercontrats. Quatre dernières migrations et correction réservation vocale enregistrées Web 872d97a1f.
- Recette réseau 07:03 UTC : client identique au pont natif (accessToken sans Auth JS), canal privé propriétaire souscrit, canal étranger refusé, signal de message reçu en 406 ms ; uniquement identifiants dans le payload.
- Recette Storage 07:04 UTC via repository Web réel : réservations/envois idempotents, brouillon non lisible par le destinataire, pièce jointe envoyée téléchargeable, anonyme refusé, suppression interdit nouvelles URL signées, abandon supprime le blob par Storage API. Le worker de rétention des pièces jointes supprimées reste à déployer/vérifier. Anciennes URL signées : expiration normale.
- Samsung : conversation A/B ouverte, messages distants et suppression reçus dans la conversation, aucune erreur affichée. Pas encore de validation physique audio/vidéo.

- Appels vidéo : Edge `messaging-call-token` confirmée ACTIVE par CLI Supabase 2.117.0, puis redéployée avec CORS Web/Android et validation JWT dans le handler. Le CLI possède bien un accès authentifié ; limitation Management initiale levée. Recette API 07:18 UTC : appel reçu/accepté, deux jetons RTC pour la même room et bons participants. Cela ne prouve pas encore le transport vidéo.
- Web : client vidéo direct branché sur le même contrat ; SDK BytePlus 4.68.5 identique, chargé à la demande. 2 tests propriété d’appel/réception passent, build Web réussi. Aperçu isolé : http://127.0.0.1:5186/messages ; 5182 intact. Dépendances du worktree maintenant indépendantes (ancienne jonction retirée sans toucher la cible).
- Recette vocale : capture AAC native de 9,066 s depuis le Samsung, envoi privé A→B, lecture Android jusqu’au terme sans erreur ; lecture Web par B confirmée (durée identique, progression réelle, pas d’erreur codec). La première sonde par clic JS sans activation avait affiché un refus de lecture ; un tap réel fonctionne.
- Protection supplémentaire déployée : 20260916160000, SHA 181d111fc943b6faea8e4c520611a8cda4a46d9742bb8f266a783e2ec103b115. Blocage/membres actifs appliqués aux appels ; un vocal en brouillon ou supprimé ne délivre plus d’URL au destinataire ; points de grade propriétaires seulement. Recette rollback positive/négative, signature legacy conservée.
- Vidéo UI : Web appelle, Samsung reçoit et accepte, mais import du SDK Android échouait (`localStorage` null). DOM storage activé pour Messaging uniquement, Auth persistSession=false et stockage chiffré natif inchangés. Nouvelle compilation réussie, installation et recette RTC suivantes en cours. Un client secondaire n’adopte plus un appel sortant lancé ailleurs.
- A02 Web nouveau défaut observé : RequireAuth redirige un compte incomplet vers `resume_onboarding=1`, mais AuthPage ne reprend pas cette étape ; correction à faire. Compte B de recette finalisé par RPC pour poursuivre l’essai messagerie, pas de prétention de validation UI de cet onboarding.

- Vidéo : après installation du correctif DOM storage, le SDK Android démarre. La jonction RTC échoue sur le Web avec token_error ; room/user/horloge et TTL vérifiés. Le fournisseur BytePlus reste à diagnostiquer et aucun échange média vidéo n'est déclaré validé. L'utilisateur demande explicitement le 16 septembre de remettre BytePlus à plus tard. La mission Supabase continue sur les autres lots.
