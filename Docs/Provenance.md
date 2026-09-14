# Provenance des ressources

## Identité Meewav

Les ressources suivantes proviennent de la version Web validée par l’utilisateur, au commit `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21` :

| Ressource Android | Source Web | Transformation |
| --- | --- | --- |
| `app/src/main/res/drawable-nodpi/auth_acoustic_background.png` | `public/images/auth-acoustic-background-trial.png` | Copie sans modification de l’image |
| `app/src/main/res/drawable/meewav_logo.xml` | `public/assets/meewav-logo.svg` | Conversion des tracés SVG en VectorDrawable, couleurs et géométrie conservées |

Le fond correspond au choix graphique transmis par l’utilisateur le 13 septembre 2026. La réutilisation dans son application Android est autorisée par la mission. Cette provenance ne constitue pas une nouvelle attribution d’auteur ni une licence publique du logo ou du fond.

L’icône de lancement est un tracé natif provisoire de l’onde Meewav. Elle doit faire l’objet d’une validation graphique avant diffusion publique.

## Police

Inter variable est copiée depuis le dépôt officiel [Google Fonts / Inter](https://github.com/google/fonts/tree/main/ofl/inter). La notice SIL Open Font License est conservée intégralement dans [Inter-OFL.txt](Licences/Inter-OFL.txt). Aucune modification de la police.

## Bibliothèques

Jetpack Compose et les Material Icons sont des dépendances AndroidX, sous Apache 2.0. Le SDK communautaire Supabase Kotlin est sous MIT ; Kotlin, kotlinx et Ktor suivent leurs licences distribuées. Les bibliothèques restent récupérées par Gradle. L’inventaire juridique de la distribution finale devra être généré avec les dépendances effectivement embarquées avant publication.

Aucune licence générale du produit Meewav n’est créée par ce premier lot.
