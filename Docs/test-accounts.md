# Trois comptes de test réels

Noms publics : **testeur1**, **testeur2**, **testeur3**. Ils utilisent Supabase Auth,
les profils, les permissions et les services ordinaires. Le compte personnel `puf`
est préservé. Les anciennes identités QA `s22`, `redmi`, `windows` sont renommées
avec les mêmes identifiants, pas recréées.

## Provisionnement reproductible

Depuis Meewav-Android :

```powershell
node scripts/test-accounts/provision.mjs
```

Le script lit `meewav.local.properties`, génère des mots de passe aléatoires,
conserve son état dans `.local/test-accounts/`, authentifie chaque compte,
vérifie son identité QA, complète son profil et les six recherches entre testeurs.
Un compte personnel ou un nom occupé n'est jamais récupéré. La confirmation
d'e-mail, si activée, peut bloquer une nouvelle création.

Les accès restent dans `.local/test-accounts/provision-state.json`, ignoré par
Git. **Ne pas publier ce fichier, le mettre dans des assets ou un rapport.**
Les tests remplissent le formulaire normal avec ces accès. Pour une connexion
manuelle, consulter localement l'e-mail et le mot de passe du testeur dans ce
fichier. Aucun alias sans mot de passe ne fonctionne en production.

## Raccourcis optionnels, exclusivement en développement

Les tests privilégient la connexion normale et ne dépendent pas des raccourcis.

- Android : uniquement `BuildConfig.DEBUG`, avec un fichier privé explicitement
  installé. Une version Release l'ignore toujours.
- Electron : uniquement une exécution **non empaquetée**, avec
  `MEEWAV_TEST_MODE=1` et un fichier privé. Une version installée refuse le raccourci,
  même si la variable et le fichier sont présents.
- Web : aucun raccourci.

Installation facultative :

```powershell
node scripts/test-accounts/install-local.mjs s22 "<serial Samsung>"
node scripts/test-accounts/install-local.mjs redmi "<serial Redmi>"
node scripts/test-accounts/install-local.mjs windows "<dossier userData QA isolé>"
```

Ces commandes ne relancent, ne réinstallent et n'effacent aucune application.
Le fichier contient les trois testeurs pour permettre les rotations. Les
raccourcis échangent de vrais identifiants contre une session Supabase et
vérifient l'ID. Ils ne fabriquent ni session ni autorisation. Les anciens APK
peuvent ignorer les nouveaux noms : employer la connexion normale ou construire
une version debug compatible. Pour désactiver, retirer uniquement
`qa-test-accounts.json` du stockage privé concerné puis relancer la version de test.

La validation des profils et de leur recherche ne prouve pas la réception de
messages, les Rooms, les appels ou les effets. Voir `scripts/qa-three-users/`
et son compte rendu pour les scénarios réellement exécutés.
