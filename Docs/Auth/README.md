# Authentification Android — premier lot

## Sources de référence

- Meewav-Web, référence applicative locale `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21` : `src/pages/AuthPage.tsx`, `src/styles/auth.css`, `src/features/auth/signupCredentialValidation.ts`, `src/features/auth/auth.service.ts` et `AuthRecoveryPage.tsx`.
- Référence mobile prioritaire : `sipiyou39/Meewav`, iOS `main`, commit `aea7251a60a2b61d775901fcf39a62036fd108c4`. Voir [les éléments repris et leurs limites](../Reference-iOS.md).
- [Configuration du SDK Supabase Kotlin](https://supabase.com/docs/reference/kotlin/initializing).
- [SDK supabase-kt 3.2.6](https://github.com/supabase-community/supabase-kt/releases/tag/3.2.6), avec Ktor 3.3.1 et Kotlin 2.2.21.
- [Jetpack Compose](https://developer.android.com/develop/ui/compose/setup).

## Structure

- `app/.../app/` : composition de l’application, activité et réception des liens.
- `app/.../core/auth/` : client Supabase, règles d’entrée et stockage de session.
- `app/.../core/design/` : couleurs et typographie communes.
- `app/.../features/auth/` : interface Compose et état du parcours.

L’identité visuelle reprend le fond acoustique, le logo, la typographie Inter, les surfaces noires et les accents violets. La disposition est native, défilable, compatible avec le clavier et les marges système. Le panneau de connexion mobile remplace l’introduction et les six tuiles Web du premier essai. L’inscription suit les étapes avatar, compte et localisation, avec navigation retour et conservation du brouillon en mémoire.

## Services et sécurité

Le SDK Auth gère la connexion, l’inscription, le renouvellement de session et la déconnexion. Un identifiant sans `@` est résolu par `resolve_profile_email_for_username(p_username)`, comme dans l’iOS ; l’adresse résolue n’est jamais présentée. La disponibilité du nom d’utilisateur est lue via `is_profile_username_available(p_username)` ; la contrainte du serveur reste l’autorité en cas de concurrence. Le formulaire exige au moins trois caractères comme l’iOS et conserve le plafond serveur de vingt caractères.

La configuration publique est injectée au build depuis un fichier local ignoré ou les variables `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY`. Aucune clé privée, service-role, clé BytePlus ou information d’administration n’appartient à l’application.

Les mots de passe restent uniquement dans la mémoire du ViewModel, jamais dans l’état sauvegardé Android. La session du SDK est chiffrée avec AES-GCM et une clé Android Keystore non exportable. La sauvegarde et le transfert des données de l’application sont exclus. Une session corrompue est supprimée et impose une nouvelle connexion. Les erreurs présentées sont traduites et ne reproduisent pas les réponses brutes du fournisseur.

La déconnexion demande uniquement la clôture de la session courante (`LOCAL`) ; elle ne déconnecte pas volontairement les autres appareils.

## Inscription et lots suivants

Le compte est créé à la dernière étape, après le choix d’avatar, les identifiants et la ville. À la demande de l’utilisateur, l’écran Compte ne collecte plus la date de naissance. Le contrat de données conserve son champ facultatif, laissé vide par ce parcours. Le formulaire ne modifie pas les espaces du mot de passe. Les métadonnées reprennent `AuthSignUpPayload` iOS : `username`, `artist_type` (`REEL`/`IA`), `avatar_url` (nom d’asset), `avatar_name`, ville, code postal facultatif et pays. Le client ajoute `onboarding_completed=false`, demande `is_ghost_mode=true` et `show_on_public_profile=false`, ne fabrique aucune coordonnée et n’appelle pas encore `complete_onboarding`.

Le choix d’une ville est manuel ; aucun bouton ne prétend activer un GPS non raccordé. Les conditions sont le texte `demoTerms` iOS affiché comme démonstration, avec une acceptation locale nécessaire pour cette version de test. Il reste à faire valider les conditions publiques et leur éventuelle traçabilité serveur avant diffusion. En absence de session après inscription, l’Android affiche la confirmation e-mail ; il ne reproduit pas la tentative de connexion immédiate du service iOS.

Le futur lot doit achever le profil avec les véritables contrats déployés avant d’ouvrir le globe public. L’écran actuel après connexion est un état d’attente explicite, pas un faux globe fonctionnel. Les boutons Google/Apple ne sont pas proposés dans ce premier lot.

## Liens d’e-mail

Le client utilise PKCE. Seuls les codes reçus sur les deux adresses suivantes sont acceptés :

- `meewav-android://auth-callback/signup`
- `meewav-android://auth-callback/recovery`

Ces deux valeurs doivent figurer dans la liste autorisée des redirections Supabase. Cette autorisation distante n’est pas configurée ni supposée acquise par ce commit. La connexion e-mail/mot de passe ne dépend pas de ces redirections. Sans leur activation, Supabase peut utiliser sa redirection Web par défaut pour les e-mails ; ne pas annoncer le retour natif comme validé.

Les fragments contenant directement des jetons, les hôtes ressemblants, les ports, les chemins différents et les codes dupliqués sont refusés. Un lien PKCE est destiné au téléphone qui a initié le parcours.

## Essais à réaliser sur le S22 Ultra

- Lisibilité du panneau mobile, des 28 avatars, du clavier et du défilement ; grande police système.
- Connexion e-mail et nom d’utilisateur avec un compte existant, mauvais mot de passe, absence de réseau.
- Parcours avatar → compte → ville, retours sans perte du brouillon ; données de profil et confidentialité effectives côté serveur après inscription.
- Inscription avec un compte de test autorisé, nom indisponible et confirmation e-mail.
- Récupération du mot de passe, ouverture du lien sur ce téléphone, nouveau mot de passe.
- Fermeture/réouverture, renouvellement de session et déconnexion locale.

Aucun compte réel n’est créé automatiquement pour ces vérifications. Le résultat de compilation et l’état de l’installation sont consignés dans le rapport de livraison.

## Vérification du premier lot — 14 septembre 2026

Historique du premier essai, avant l’adaptation mobile iOS :

- `:app:assembleDebug` : réussi, APK de développement produit.
- `:app:testDebugUnitTest` : trois tests réussis (configuration publique/HTTPS, filtrage des redirections PKCE, validation des identifiants).
- Le Samsung S22 Ultra est la cible explicitement désignée ; aucun appareil n’était détecté par ADB lors de la compilation. Installation et rendu sur téléphone non vérifiés.
- Aucun test d’inscription, de connexion réelle, d’e-mail ou de session restaurée sur un appareil n’a été exécuté. Aucun changement distant dans Supabase, aucune intégration BytePlus et aucun déploiement public.

## Adaptation iOS — 14 septembre 2026

- `:app:assembleDebug` et `:app:testDebugUnitTest` réussis ; six tests unitaires, aucun échec. Les trois tests ajoutés portent sur les métadonnées compatibles iOS, la confidentialité et l’absence de coordonnées inventées, ainsi que les dates de naissance.
- Compilation effectuée avec les réglages Gradle déjà modifiés dans la copie de travail avant cette passe : AGP 9.0.1 et Gradle 9.1.0. Ces trois fichiers de configuration préexistants sont conservés hors du commit d’adaptation mobile ; leurs options de compatibilité produisent des avertissements de dépréciation.
- Les tests unitaires ne se connectent pas à Supabase. Aucune inscription ni connexion réelle, aucun e-mail envoyé, aucun live ouvert et aucune modification de service distant pendant cette adaptation.
- Rendu, clavier, navigation, fluidité à 60 images/s et résultat sur le S22 Ultra restent à vérifier sur l’appareil. Le parcours d’authentification compilé ne constitue pas encore une messagerie, un globe ou des Rooms Android utilisables.

## Correction de l’habillage et relance — 14 septembre 2026

Le premier portage avait conservé le fond Web et un panneau arrondi générique. Un essai a ensuite repris le fond iOS, les courbes et couleurs de sa fenêtre, ainsi qu’une adaptation du socle. La couleur du contenu est explicitement fournie au thème pour éviter les titres noirs sur fond sombre. `:app:assembleDebug` réussit ; aucun nouveau test fonctionnel n’est lancé pour cette retouche visuelle.

Le cadre Samsung est un habillage de l’émulateur local, séparé des ressources de l’application. Il ne change ni le backend ni le système Android en firmware Samsung.

Installation de l’APK et démarrage de `MainActivity` réussis sur l’émulateur déjà ouvert `Medium_Phone_API_36.1` et sur `Meewav_Galaxy_S22_Ultra` (1440 × 3088, cadre externe). Le téléphone physique n’est pas concerné. Aucune navigation automatisée dans le parcours d’authentification après lancement.

## Fenêtre Web adaptée au téléphone — 14 septembre 2026

L’utilisateur a écarté la fenêtre iOS et demandé celle du site. Le panneau reprend donc les coordonnées SVG et les dégradés de `AuthPanelChrome.tsx` : sommet arrondi, côtés bombés, verre noir, contour violet fin et arc inférieur lumineux. Le socle est retiré. La signature, les séparateurs et le bouton reprennent également la référence Web. Le fond iOS et les contrats du parcours mobile sont conservés.

Le panneau s’adapte à la largeur disponible et laisse grandir le formulaire pour la police système, les messages et les étapes longues ; le défilement et les marges clavier restent natifs. Aucun nouvel essai fonctionnel ou contrôle visuel automatique n’est demandé pour cette retouche.

`:app:assembleDebug` réussi. APK installé et `MainActivity` relancée sur les deux émulateurs ouverts, `Medium_Phone_API_36.1` et `Meewav_Galaxy_S22_Ultra`. Le rendu est laissé à l’appréciation de l’utilisateur.

## Cadre fixe, avatar compact et aperçu sans compte — 14 septembre 2026

Après retour utilisateur, la hauteur du cadre est désormais calculée une fois selon l’espace de l’écran (maximum 640 dp), sans dépendre de l’étape, des messages, du contenu ou du clavier. Les formulaires longs défilent à l’intérieur. Le carrousel a d’abord été ramené à 112–160 dp selon la place disponible, avec avatars entièrement opaques et socle limité à 112 × 22 dp. Les marges de l’étape avatar sont resserrées ; le tracé et les couleurs Web du cadre sont conservés.

À la demande suivante, le résumé du rôle (première ligne du descriptif source, par exemple « Club, Festival, Radio ») passe sur une seule ligne au-dessus de l’avatar. Le bloc de trois lignes sous ses pieds est retiré, libérant une zone de 136–192 dp pour un avatar légèrement agrandi et placé plus bas. La hauteur du cadre et la taille maximale du socle restent inchangées ; les descriptions complètes sont conservées dans le catalogue.

Le bouton **Explorer sans compte** est réservé aux builds de développement (`BuildConfig.DEBUG`). Il active un aperçu en mémoire du parcours avatar → compte → localisation → fin d’aperçu. Les champs peuvent rester vides ; aucune inscription, résolution de nom, récupération de mot de passe ou session fictive n’est envoyée au backend par ce parcours. Les identifiants saisis avant l’entrée sont effacés de l’état local. Les événements de session et les liens d’authentification ne remplacent pas l’aperçu tant qu’il est actif. Quitter ou relancer l’application rétablit le comportement normal ; aucune préférence de contournement n’est persistée.

La dernière étape d’aperçu annonce explicitement qu’aucun compte n’a été créé. Elle ne présente pas la messagerie, le globe ou les Rooms Android comme déjà implémentés. L’authentification réelle et ses validations restent actives hors aperçu.

Compilation `:app:assembleDebug`, installation et relance réussies sur les deux émulateurs de la session. Aucun scénario d’interface, test applicatif ou contrôle visuel automatique exécuté ; aucun compte créé pour ce lot.

## Étape Compte lisible — 14 septembre 2026

Le champ naissance est retiré ; restent l’e-mail, le nom d’utilisateur, le mot de passe et sa confirmation. Le récapitulatif de l’avatar et les marges de l’étape sont compactés. Le bouton **Suivant** occupe un pied fixe dans la fenêtre, séparé de la zone de formulaire défilante, afin de rester accessible avec des textes longs ou agrandis. La hauteur du cadre, le parcours réel et le mode aperçu sans compte sont conservés.

Le contour est ensuite ajusté sur demande : relief supérieur réduit de moitié et courbe douce sur toute la largeur du bas, sans segment plat. L’arc inférieur conserve la forme Web avec une profondeur de 18 au lieu de 50 dans le repère SVG 413 × 600. L’essai intermédiaire de fond plat à coins arrondis a été écarté par l’utilisateur. Le trait lumineux suit la courbe ; la hauteur de mise en page reste inchangée.

## Avatars sources et étapes sans défilement — 14 septembre 2026

Les miniatures de 180 pixels sont remplacées par les 28 sources PNG correspondantes du Web, copiées sans transformation. Voir la correspondance et les limites de résolution dans [la provenance](../Provenance.md#avatars-en-résolution-source--14-septembre-2026).

La phrase sous le titre de l’étape Compte est retirée. Compte et Avatar n’utilisent plus de conteneur de défilement vertical, ni dans le cadre ni autour. La zone du carrousel prend l’espace restant après les textes et les commandes, avec une hauteur d’image plafonnée ; le glissement horizontal et le sélecteur d’avatars restent disponibles. Le cadre garde la même hauteur. Le comportement de Localisation n’est pas changé. Le clavier peut recouvrir une partie de ces écrans fixes ; sa touche de validation permet de poursuivre sans introduire de défilement.

Compilation réussie, APK installé et application relancée par Wi-Fi sur le S22 Ultra physique désigné. Les dimensions des images sources et quelques correspondances de personnages ont été examinées à la demande de l’utilisateur ; aucun scénario applicatif ni capture automatique du téléphone n’a été exécuté.

## Avatar posé sur le champ et sélecteur fixe — 14 septembre 2026

Dans Compte, le récapitulatif encadré, les libellés de profil et le crayon sont retirés. Seul l’avatar apparaît debout au-dessus du champ e-mail, aligné sur son contour supérieur. Le séparateur situé au-dessus de ce bloc est supprimé pour remonter le formulaire ; le bouton retour conserve son rôle de retour au choix d’avatar et Suivant reste fixé dans le pied.

Avatar et Compte restent dépourvus de défilement vertical. Le sélecteur d’avatars, qui utilisait encore un panneau coulissant et une grille verticale, devient une fenêtre fixe de six choix par page avec boutons précédent/suivant. Le carrousel conserve uniquement son mouvement horizontal, sans effet de dépassement. Localisation conserve le défilement de son formulaire et les marges du clavier.

## Retour au plateau supérieur de l’iOS — 14 septembre 2026

Nouvelle direction demandée après ces ajustements : reprendre le modèle actuellement présent dans le `main` iOS, avec la vitre sous le plateau, le carrousel d’avatars au-dessus et les petits projecteurs. La [référence précise et les adaptations Android](../Reference-iOS.md#plateau-supérieur-et-carrousel-ios--14-septembre-2026) distinguent ce portage des animations encore absentes.

L’enveloppe de l’étape conserve la hauteur disponible ; le plateau et la vitre se partagent désormais cet espace. Le carrousel est circulaire, avec interpolation de taille, position et inclinaison pendant le geste. Les trois avatars centraux restent opaques et les PNG HD ne sont pas remplacés par les miniatures iOS. Les faisceaux baissent pendant le défilement puis se rallument à l’arrêt. Le rôle, son compteur et le sélecteur sont dans la vitre, avec le type de profil et Suivant. Aucun défilement vertical n’est ajouté à Avatar ou Compte ; les corrections de Compte, Localisation et l’aperçu sans compte sont conservés.

Compilation `:app:assembleDebug` réussie. Installation non effectuée : le S22 Ultra physique désigné est absent de la liste ADB et de la découverte mDNS au moment de la livraison. Aucun autre appareil n’a été choisi à sa place. Aucun scénario applicatif ni contrôle visuel automatique exécuté ; le rendu reste à apprécier sur le téléphone après reconnexion.

## Composition précisée par les deux captures iOS — 14 septembre 2026

Connexion et Avatar utilisent désormais le même calcul de hauteur, le même contour iOS et le même placement du plateau. Le grand logo remplace l’en-tête compact sur ces deux écrans ; les barres d’étapes et le retour extérieur sont retirés de l’étape Avatar. La vitre Avatar commence par le sélecteur noir et le descriptif sur deux lignes, puis l’explication du profil, les choix Créateur IA / Artiste réel, le séparateur sonore et les boutons Retour / Suivant côte à côte. Le titre supplémentaire « Choisis ton avatar » n’y est plus répété.

La connexion reprend les champs noirs, la signature, Bienvenue, le bouton de connexion et le lien Créer un compte sous le séparateur. La récupération de mot de passe et le mode aperçu de développement restent accessibles. Les contrats d’authentification ne changent pas. La compilation a réussi ; aucun test applicatif ni contrôle visuel automatique n’a été exécuté. Le S22 physique étant toujours absent d’ADB/mDNS, cette mise à jour n’y est pas encore installée.
