# Connexion locale aux comptes de test réels

Deux profils dédiés : `redmi` et `windows`. Le compte `puf` du S22 reste inchangé.
Ces raccourcis utilisent une authentification Supabase par mot de passe aléatoire,
puis la session habituelle. Ils ne modifient ni les permissions, ni les RLS, ni les
contrats de messagerie, d’appels et de Rooms. Aucun accès ne fonctionne hors ligne.

## Préparer les profils

Depuis ce dépôt : `node scripts/test-accounts/provision.mjs`.
Le script utilise `meewav.local.properties`, crée uniquement les deux identités
dédiées, complète leurs profils et vérifie leur recherche mutuelle. Une relance
reprend les mêmes identifiants. Un nom déjà occupé bloque la création ; aucun
compte existant n’est récupéré. La confirmation e-mail peut nécessiter un accès
administrateur au projet. Les comptes ne sont annoncés prêts qu’après validation.

Les mots de passe restent dans `app/build/test-accounts/`, ignoré par Git. Ne pas
partager ces fichiers ni les embarquer dans un APK, des assets Web ou un installateur.

## Activer sur les appareils de test

- Windows : `node scripts/test-accounts/install-local.mjs windows "<dossier userData Electron>"`.
  Le dossier habituel est `%APPDATA%/Meewav Studio Dev` en développement,
  `%APPDATA%/Meewav Studio` pour la version installée.
- Redmi : `node scripts/test-accounts/install-local.mjs redmi "<numéro de série ADB>"`.
  Il faut une version debug compatible. Le fichier est écrit dans le stockage
  privé de l’application ; aucune donnée n’est effacée et aucune app n’est relancée.

Au prochain lancement à froid, la version compatible ouvre l’authentification réelle.
Saisir le nom configuré puis **Se connecter** ; aucun mot de passe à retaper.
Le fichier local doit correspondre au même projet Supabase que l’application.
Sans ce fichier, le parcours normal reste actif. Android Release ignore ces
raccourcis. La version Web ne dispose pas du pont Electron et reste inchangée.

Pour désactiver, retirer uniquement `qa-test-accounts.json` du stockage privé de
l’appareil concerné, puis relancer. Cela ne supprime aucun profil Supabase.

## Livraison du 28 septembre 2026

Le backend configuré ne répond pas. La création des profils et leur connexion
réelle restent bloquées. Aucune communication à trois appareils n’est validée
par les tests unitaires du mécanisme de connexion. Le script d’installation
locale ne doit être exécuté qu’après provisioning réussi et build compatible.
