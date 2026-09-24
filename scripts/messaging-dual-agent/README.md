# Recette messagerie à deux émulateurs

Ce banc de test utilise deux comptes de recette distincts dans l'application Android **LIVE**. Il ouvre la messagerie sur deux émulateurs, cherche le second contact depuis le premier, échange un DM dans chaque sens, envoie un fichier audio du premier au second, puis vérifie que les deux comptes voient la même conversation et les mêmes messages côté serveur. Les captures et rapports restent dans `app/build/messaging-dual-agent/` (ignoré par Git).

Depuis la racine du dépôt, avec le SDK Android et Node installés :

```powershell
powershell -ExecutionPolicy Bypass -File scripts/messaging-dual-agent/run.ps1
```

Le script démarre les AVD `Medium_Phone_API_36.1` et `Meewav_Galaxy_S22_Ultra` si nécessaire, installe l'APK debug existant et crée deux comptes QA. Il efface uniquement les données de l'application sur **ces deux émulateurs** avant la connexion LIVE ; il ne touche pas au téléphone. Pour reprendre deux émulateurs déjà authentifiés et ouverts dans la messagerie :

```powershell
powershell -ExecutionPolicy Bypass -File scripts/messaging-dual-agent/run.ps1 -SkipLogin -SkipInstall
```

`provision.mjs` crée les comptes de manière idempotente. Leurs identifiants secrets sont enregistrés uniquement dans `app/build/messaging-dual-agent/accounts.json` et ne doivent pas être copiés dans un ticket ou un rapport. `conversation.mjs` pilote les deux WebViews via le débogage Chrome, sans injecter de jeton de connexion. `verify.mjs` lit les conversations sous **les deux identités utilisateur** et contrôle l'accès au fichier audio ; il n'utilise aucune clé de service privilégiée.

Le rapport de la conversation indique chaque étape validée, la panne exacte le cas échéant et les fonctionnalités non encore couvertes. Un échec de connexion, d'envoi ou de vérification serveur arrête le script avec un code non nul. Les notes vocales enregistrées au micro, appels, groupes, notifications et accusés de lecture restent à couvrir ; ils ne sont pas déclarés réussis par cette recette.

`backend-audit.mjs` vérifie séparément la présence des fonctions et du schéma pgcrypto réellement déployés, sans afficher les identifiants de connexion. Les deux migrations `20260924110000` et `20260924120000` corrigent le chemin de recherche de pgcrypto pour les RPC concernés ; leurs tests SQL ont été exécutés en transaction annulée avant déploiement. Voir `RESULTS-2026-09-24.md` pour les preuves du parcours LIVE.

Les deux agents IA Luna de cette session surveillent respectivement les émulateurs A et B et remontent leurs observations à l'orchestrateur. Le pilote réutilisable est volontairement déterministe : un nouveau lancement du script n'a pas besoin d'un modèle IA ni d'un accès au téléphone.
