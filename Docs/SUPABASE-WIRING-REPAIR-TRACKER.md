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
| S01 | Accès utilisateur/MFA Android compatibles avec session native | Corrigé, façade commune Web/native | Bundle Profil reconstruit ; APK pas encore installé | 5 tests ciblés passent ; recette authentifiée à faire |
| A01 | Création/connexion réelle → globe → retours des features | À faire | Non | Non |
| A02 | Finalisation identité, rôle IA/réel/métier, avatar/scène commune | À faire | Non | Non |
| A03 | Brouillon Google, callbacks et disponibilité Apple | À faire | Non | Non |
| P01 | Colonnes/projections profil compatibles Web/Android | À faire | Non | Non |
| P02 | Confidentialité PII et droits sur champs d’autorité | À faire | Non | Non |
| P03 | Connexion username sans exposition d’e-mail, compatibilité legacy | À faire | Non | Non |
| P04 | Profil propriétaire/public, visibilité et préférences | À faire | Non | Non |
| P05 | Médias privés : lecture, upload, publication, archivage | À faire | Non | Non |
| P06 | Métriques, classement, grades et notifications | À faire | Non | Non |
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
