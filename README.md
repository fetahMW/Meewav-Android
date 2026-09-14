# Meewav Android

Application Android native de Meewav, en Kotlin et Jetpack Compose. Le parcours mobile reprend désormais l’authentification du dépôt iOS `sipiyou39/Meewav`, adapté en Kotlin, avec l’identité graphique Meewav. Supabase reste le backend partagé. BytePlus est le transport retenu pour les futurs lives, pas encore intégré dans ce lot.

## Ouvrir et compiler

Ouvrir ce dossier dans Android Studio. Les versions AGP et Gradle sont fixées dans `build.gradle.kts` et `gradle/wrapper/gradle-wrapper.properties`. Le projet utilise Kotlin 2.2.21, le SDK Android 36 et un JDK 17 ou plus récent. Android 8.0 (API 26) minimum.

1. Copier `meewav.local.properties.example` en `meewav.local.properties` et y renseigner **uniquement** l’URL du projet Supabase et sa clé publique publishable. Le fichier local est ignoré par Git. Le client refuse les clés serveur.
2. Laisser Android Studio renseigner `local.properties` avec l’emplacement du SDK.
3. Compiler : `./gradlew :app:assembleDebug` (`gradlew.bat` sur Windows).
4. Brancher le Samsung S22 Ultra désigné par l’utilisateur, autoriser son débogage USB, puis choisir ce téléphone comme cible dans Android Studio. Aucun émulateur n’est requis.

Sans configuration Supabase, les écrans s’affichent mais les demandes de connexion sont refusées explicitement. Aucun compte de démonstration ne simule une authentification.

## Périmètre

Connexion par e-mail ou nom d’utilisateur, choix parmi les 28 avatars iOS, type de profil réel/IA, formulaire d’inscription, ville et pays saisis manuellement, conditions de la version de test. Confirmation par e-mail, récupération et changement de mot de passe, restauration chiffrée de session et déconnexion de cet appareil restent disponibles. L’entrée présente directement le panneau mobile de connexion, sans les six tuiles de la page Web.

Les données d’avatar et de ville utilisent le vocabulaire iOS. La scène musicale résolue et le globe restent à adapter. Une nouvelle inscription porte `onboarding_completed=false` et demande la confidentialité dans ses métadonnées ; le client n’invente aucune position géographique. L’effet final des règles du serveur sur le profil reste à vérifier lors des essais. L’écran après connexion indique que la suite Android est en préparation. Les conditions reprises de l’iOS sont explicitement un texte de démonstration, pas des conditions publiques validées.

Les redirections d’authentification Android doivent être autorisées dans Supabase avant un essai complet de confirmation/récupération. Aucune configuration serveur n’est modifiée automatiquement. Voir [le contrat d’authentification](Docs/Auth/README.md).

[Documentation et suivi](Docs/README.md) · [Provenance des ressources](Docs/Provenance.md)
