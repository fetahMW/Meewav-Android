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

Le futur lot doit achever le profil avec les véritables contrats déployés avant d’ouvrir le globe public. L’écran actuel après connexion est un état d’attente explicite, pas un faux globe fonctionnel. Les boutons Google/Apple, absents du premier lot, sont désormais raccordés côté client au parcours OAuth décrit ci-dessous.

## Liens d’e-mail et retour OAuth

Le client utilise PKCE. Seuls les codes reçus sur les trois adresses suivantes sont acceptés :

- `meewav-android://auth-callback/signup`
- `meewav-android://auth-callback/recovery`
- `meewav-android://auth-callback/oauth`

Ces trois valeurs doivent figurer dans la liste autorisée des redirections Supabase. Cette autorisation distante n’est pas configurée ni supposée acquise par ce commit. La connexion e-mail/mot de passe ne dépend pas de ces redirections. Sans leur activation, Supabase peut utiliser sa redirection Web par défaut ; ne pas annoncer le retour natif comme validé.

### Google et Apple — 14 septembre 2026

La connexion propose deux boutons ronds de 48 dp dans la même ligne que Créer un compte, sans ajouter de hauteur ni réduire les 20 dp réservés sous cette ligne. Le bouton Google utilise l’image officielle et Apple le symbole déjà présent dans le Web ; les deux possèdent un libellé accessible.

`MeewavAuthRepository.signInSocial` appelle `auth.signInWith(Google/Apple, redirectUrl = AuthPolicy.OAUTH_REDIRECT)` dans le SDK 3.2.6 déjà installé. Le fournisseur s’ouvre dans le navigateur via le SDK ; le code PKCE revient par le lien Android existant puis passe par `exchangeCodeForSession`. Aucun jeton de session dans un fragment n’est accepté, aucune session n’est simulée et les boutons ne sont pas utilisés dans l’aperçu sans compte. Le succès suit l’état connecté existant, sans prétendre achever un profil ou ouvrir le globe. Une création via fournisseur ne collecte pas les métadonnées du formulaire manuel : sa finalisation de profil reste un travail distinct.

Prérequis non vérifiés et non modifiés par ce lot : activation des fournisseurs Google/Apple dans Supabase, configuration de leurs applications OAuth et autorisation de la redirection Android. Aucun secret fournisseur n’est embarqué. La compilation est réussie ; aucun compte ni connexion sociale n’a été créé pendant ce travail. L’annulation du navigateur, le retour PKCE sur téléphone et la connexion avec chacun des deux fournisseurs restent à essayer par l’utilisateur. Référence : [OAuth Kotlin Supabase](https://supabase.com/docs/reference/kotlin/auth-signinwithoauth).

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

Correction utilisateur suivante : le grand logo des captures est écarté. Connexion et Avatar retrouvent la taille précédente, 40 dp de haut dans un emplacement de 48 dp, avec la même largeur utile qu’avant. Les dimensions de la fenêtre et du plateau ne changent pas.

## Connexion fixe et violet du poteau Web — 14 septembre 2026

Sur retour du S22, le défilement est retiré de Connexion, à la fois dans la vitre et autour de l’écran. Connexion et Avatar sont prolongés de 28 dp vers le bas ; leur sommet reste au même emplacement. La marge intérieure basse est resserrée de 8 dp. Créer un compte redevient un bouton capsule sombre à contour violet, sous Nouveau ici et le séparateur. Le logo reste compact. La gestion du clavier des écrans fixes reste identique à Compte ; Localisation conserve son défilement.

Le plateau et les avatars sont descendus ensemble de 22 dp pour que l’ellipse repose sur le bord supérieur de la fenêtre. Le plateau reçoit un remplissage noir, un reflet fin et un contour moins lumineux ; le voile violet couvrant sa surface est retiré. Le CTA utilise `#5137A1`, `#4E349F`, `#372574`, issus du remplissage du châssis Rooms dans `Meewav-Web/src/features/globe/components/MeewavPrimaryNav.tsx`. La vitre reprend cette famille avec `#2B1B5C` et un intérieur sombre. Il s’agit d’une adaptation native de cette palette, pas d’un rendu CSS ou d’une mesure de couleur sur capture.

Sur Connexion, le séparateur sonore est ensuite remplacé par un trait de 0,5 dp. Les 20 dp libérés sont réservés sous la capsule Créer un compte : le bloc Nouveau ici / Créer un compte remonte, sans réduire sa zone tactile ni modifier la hauteur de la fenêtre.

La même retouche s’applique ensuite à Avatar : séparateur fin partagé, Suivant sur toute la largeur et 20 dp d’espace supplémentaire en dessous. Le retour devient un chevron dans une cible tactile de 48 dp à gauche du logo, dont la taille et le centrage restent conservés. Le choix de type de profil garde un fond noir dans les deux états ; seul le contour violet et son léger halo indiquent la sélection. Les choix sont désactivés pendant une opération en cours.

## Rail libre, confirmation et panneau de sélection — 14 septembre 2026

Les images ne sont plus découpées par le viewport du pager : celui-ci reçoit le geste horizontal, tandis que les personnages sont dessinés séparément au-dessus de la vitre. L’abaissement progresse jusqu’à 6 dp pour les avatars des extrémités. Les quatre spots et les origines de leurs faisceaux sont sur le disque.

Suivant déclenche une impulsion lumineuse puis la chute des personnages latéraux, d’après le code iOS ; le personnage central reste visible. Le passage à Compte attend la fin de l’animation. Le carrousel, le choix du rôle et le sélecteur sont neutralisés pendant cette confirmation ; une sortie de l’écran annule son animation.

Sur nouvelle demande utilisateur, le sélecteur paginé est remplacé par un grand panneau inférieur à grille défilante de 28 vignettes HD. Fond noir, coins arrondis, contour violet sur le choix courant, fermeture par croix ou geste natif. Connexion et Avatar restent sans défilement vertical en dehors de ce panneau. Compilation réussie ; aucun scénario applicatif ni contrôle visuel automatique exécuté.

## Hiérarchie du choix de profil — 14 septembre 2026

Les choix Créateur IA / Artiste réel ont une surface de 36 dp dans une cible tactile de 48 dp, avec un texte de 12 sp, un contour sélectionné de 0,75 dp et un halo atténué. Leur intérieur reste noir. Les espaces extensibles au milieu sont remplacés par des intervalles fixes ; l’explication est raccourcie et le bouton Suivant suit directement les choix et le séparateur fin. L’espace restant se trouve sous l’action, dans la fenêtre de hauteur inchangée. Le sélecteur conserve sa hauteur minimale et accepte deux lignes. Aucun défilement vertical n’est ajouté à l’étape ; le rendu reste à apprécier par l’utilisateur.


## Fournisseurs à l’étape Compte — 14 septembre 2026

Google et Apple sont retirés de Connexion et proposés uniquement après Avatar, à l’étape Compte. L’avatar réduit accompagne le titre sur une même ligne ; deux boutons sombres de 48 dp présentent « Continuer avec » puis le fournisseur. Un séparateur fin « ou » précède les champs existants. La fenêtre reste fixe et sans défilement, et la connexion retrouve sa capsule Créer un compte seule. Le lien extérieur Explorer sans compte est retiré, sans déplacer la fenêtre. Le mode aperçu existant reste dans le code, mais cette entrée visible ne le lance plus.

Les boutons réutilisent le démarrage OAuth existant, désormais autorisé depuis Compte. L’activation des fournisseurs, les redirections distantes et la finalisation du profil choisi après OAuth restent à vérifier/raccorder ; cette retouche de composition ne les valide pas et ne modifie aucun service distant.


## Signature sur le podium de connexion — 14 septembre 2026

La signature MW quitte l’intérieur de la vitre pour flotter au-dessus du plateau : rotation horaire dans le plan de l’écran en 32 secondes et oscillation verticale de 3 dp. Quatre lumières parcourent l’ellipse en 16 secondes, avec leurs faisceaux dirigés vers la signature. Les spots fixes sont remplacés uniquement dans cette composition de connexion ; le plateau Avatar conserve son comportement. Les animations sont lues dans les phases de dessin/composition des calques et les textures du plateau restent en cache. Les 20 dp retirés au-dessus de Bienvenue sont réaffectés sous la capsule Créer un compte. Aucun défilement ajouté ; le rendu est laissé à l’appréciation de l’utilisateur.

Correction suivante : le MW pivote désormais horizontalement autour de son axe vertical (rotation Y avec perspective), toujours en 32 secondes. Les cônes s’ouvrent et convergent selon un mouvement sinusoïdal de 8 secondes, légèrement déphasé entre les quatre lumières ; leurs origines restent sur le disque. Cette correction remplace la rotation dans le plan de l’écran décrite ci-dessus.


## Saisie avec clavier Samsung — 14 septembre 2026

Connexion et Compte utilisent une composition dédiée quand les insets du clavier sont présents : la vitre occupe la hauteur utile au-dessus du clavier, l’en-tête extérieur et l’espace de pied sont temporairement retirés. Sur Connexion, le podium et le bloc Nouveau ici / Créer un compte sont masqués pendant la saisie. Les champs conservent leurs dimensions et la zone de formulaire devient défilante uniquement pendant cette saisie ; le champ actif est ramené dans la zone visible après le redimensionnement du clavier. Le bouton Suivant de Compte reste dans le pied de la vitre. À la fermeture du clavier, les compositions fixes sans défilement de Connexion et Compte sont rétablies. Avatar est inchangé. Le retour applicatif ne capture plus Retour pendant que le clavier est ouvert. Cette correction n’est pas une validation visuelle ou un essai du clavier Samsung ; ces essais restent à effectuer sur le téléphone.


## Projecteurs fixes et espacement Avatar — 14 septembre 2026

Les quatre corps de projecteurs restent désormais aux emplacements fixes du plateau sur Connexion et Avatar. Seule la direction et l’ouverture des faisceaux oscillent ; Avatar reprend ce mouvement en conservant la modulation lumineuse du carrousel. La signature MW descend de 12 dp, avec sa rotation Y et sa lévitation conservées. Sur Avatar, Suivant revient dans le pied réservé de la vitre, avec le même composant de 48 dp que Se connecter et une marge basse supplémentaire de 20 dp. Deux espaces extensibles répartissent l’air entre les blocs du formulaire ; ils ne compriment plus le CTA. Aucun défilement ajouté à Avatar, ni changement au comportement du clavier. Le rendu reste à apprécier sur le téléphone.


Dernier ajustement de la signature : la rotation est retirée. Le MW reste de face et conserve uniquement son oscillation verticale douce de ±3 dp. Les faisceaux et le placement du plateau sont inchangés.
