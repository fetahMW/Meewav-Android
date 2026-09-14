# Authentification Android — premier lot

## Sources de référence

- Meewav-Web, référence applicative locale `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21` : `src/pages/AuthPage.tsx`, `src/styles/auth.css`, `src/features/auth/signupCredentialValidation.ts`, `src/features/auth/auth.service.ts` et `AuthRecoveryPage.tsx`.
- [Configuration du SDK Supabase Kotlin](https://supabase.com/docs/reference/kotlin/initializing).
- [SDK supabase-kt 3.2.6](https://github.com/supabase-community/supabase-kt/releases/tag/3.2.6), avec Ktor 3.3.1 et Kotlin 2.2.21.
- [Jetpack Compose](https://developer.android.com/develop/ui/compose/setup).

## Structure

- `app/.../app/` : composition de l’application, activité et réception des liens.
- `app/.../core/auth/` : client Supabase, règles d’entrée et stockage de session.
- `app/.../core/design/` : couleurs et typographie communes.
- `app/.../features/auth/` : interface Compose et état du parcours.

L’identité visuelle reprend le fond acoustique, le logo, la typographie Inter, les surfaces noires et les accents violets. La disposition est native, défilable, compatible avec le clavier et les marges système. Les six tuiles présentent les fonctionnalités ; elles ne promettent pas de navigation vers des écrans non construits.

## Services et sécurité

Le SDK Auth gère la connexion, l’inscription, le renouvellement de session et la déconnexion. La disponibilité du nom d’utilisateur est lue via `is_profile_username_available(p_username)` ; la contrainte du serveur reste l’autorité en cas de concurrence.

La configuration publique est injectée au build depuis un fichier local ignoré ou les variables `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY`. Aucune clé privée, service-role, clé BytePlus ou information d’administration n’appartient à l’application.

Les mots de passe restent uniquement dans la mémoire du ViewModel, jamais dans l’état sauvegardé Android. La session du SDK est chiffrée avec AES-GCM et une clé Android Keystore non exportable. La sauvegarde et le transfert des données de l’application sont exclus. Une session corrompue est supprimée et impose une nouvelle connexion. Les erreurs présentées sont traduites et ne reproduisent pas les réponses brutes du fournisseur.

La déconnexion demande uniquement la clôture de la session courante (`LOCAL`) ; elle ne déconnecte pas volontairement les autres appareils.

## Inscription et lots suivants

Ce lot crée les identifiants de connexion avant la future personnalisation native. Il envoie `username`, `onboarding_completed=false`, `is_ghost_mode=true` et `show_on_public_profile=false`. Il ne remplit pas de faux avatar ou de coordonnées fictives et n’appelle pas encore `complete_onboarding`.

Le futur lot doit achever le profil avec les véritables contrats déployés avant d’ouvrir le globe public. L’écran actuel après connexion est un état d’attente explicite, pas un faux globe fonctionnel. Les boutons Google/Apple ne sont pas proposés dans ce premier lot.

## Liens d’e-mail

Le client utilise PKCE. Seuls les codes reçus sur les deux adresses suivantes sont acceptés :

- `meewav-android://auth-callback/signup`
- `meewav-android://auth-callback/recovery`

Ces deux valeurs doivent figurer dans la liste autorisée des redirections Supabase. Cette autorisation distante n’est pas configurée ni supposée acquise par ce commit. La connexion e-mail/mot de passe ne dépend pas de ces redirections. Sans leur activation, Supabase peut utiliser sa redirection Web par défaut pour les e-mails ; ne pas annoncer le retour natif comme validé.

Les fragments contenant directement des jetons, les hôtes ressemblants, les ports, les chemins différents et les codes dupliqués sont refusés. Un lien PKCE est destiné au téléphone qui a initié le parcours.

## Essais à réaliser sur le S22 Ultra

- Lisibilité du premier écran, tuiles, clavier et défilement ; grande police système.
- Connexion avec un compte existant, mauvais mot de passe, absence de réseau.
- Inscription avec un compte de test autorisé, nom indisponible et confirmation e-mail.
- Récupération du mot de passe, ouverture du lien sur ce téléphone, nouveau mot de passe.
- Fermeture/réouverture, renouvellement de session et déconnexion locale.

Aucun compte réel n’est créé automatiquement pour ces vérifications. Le résultat de compilation et l’état de l’installation sont consignés dans le rapport de livraison.

## Vérification du premier lot — 14 septembre 2026

- `:app:assembleDebug` : réussi, APK de développement produit.
- `:app:testDebugUnitTest` : trois tests réussis (configuration publique/HTTPS, filtrage des redirections PKCE, validation des identifiants).
- Le Samsung S22 Ultra est la cible explicitement désignée ; aucun appareil n’était détecté par ADB lors de la compilation. Installation et rendu sur téléphone non vérifiés.
- Aucun test d’inscription, de connexion réelle, d’e-mail ou de session restaurée sur un appareil n’a été exécuté. Aucun changement distant dans Supabase, aucune intégration BytePlus et aucun déploiement public.
