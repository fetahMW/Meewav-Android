# Meewav Android

Application Android native de Meewav, en Kotlin et Jetpack Compose. Premier lot : authentification par e-mail. La référence graphique est le site Meewav validé ; Supabase reste le backend partagé. BytePlus est le transport retenu pour les futurs lives, pas encore intégré dans ce lot.

## Ouvrir et compiler

Ouvrir ce dossier dans Android Studio. Le projet utilise AGP 8.13.1, Gradle 8.14.3, Kotlin 2.2.21, le SDK Android 36 et un JDK 17 ou plus récent. Android 8.0 (API 26) minimum.

1. Copier `meewav.local.properties.example` en `meewav.local.properties` et y renseigner **uniquement** l’URL du projet Supabase et sa clé publique publishable. Le fichier local est ignoré par Git. Le client refuse les clés serveur.
2. Laisser Android Studio renseigner `local.properties` avec l’emplacement du SDK.
3. Compiler : `./gradlew :app:assembleDebug` (`gradlew.bat` sur Windows).
4. Brancher le Samsung S22 Ultra désigné par l’utilisateur, autoriser son débogage USB, puis choisir ce téléphone comme cible dans Android Studio. Aucun émulateur n’est requis.

Sans configuration Supabase, les écrans s’affichent mais les demandes de connexion sont refusées explicitement. Aucun compte de démonstration ne simule une authentification.

## Périmètre

Accueil, six tuiles de présentation, connexion, création d’un compte incomplet, confirmation par e-mail, récupération et changement de mot de passe, restauration chiffrée de session et déconnexion de cet appareil.

L’avatar, la scène musicale, la localisation et le globe seront adaptés dans les lots suivants. Une nouvelle inscription porte `onboarding_completed=false` et demande la confidentialité dans ses métadonnées ; le client n’invente aucune position géographique. L’effet final des règles du serveur sur le profil reste à vérifier lors des essais. L’écran après connexion indique que la suite Android est en préparation.

Les redirections d’authentification Android doivent être autorisées dans Supabase avant un essai complet de confirmation/récupération. Aucune configuration serveur n’est modifiée automatiquement. Voir [le contrat d’authentification](Docs/Auth/README.md).

[Documentation et suivi](Docs/README.md) · [Provenance des ressources](Docs/Provenance.md)
