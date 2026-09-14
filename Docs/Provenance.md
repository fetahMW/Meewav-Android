# Provenance des ressources

## Identité Meewav

Les ressources suivantes proviennent de la version Web validée par l’utilisateur, au commit `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21` :

| Ressource Android | Source Web | Transformation |
| --- | --- | --- |
| `app/src/main/res/drawable-nodpi/auth_acoustic_background.png` | `public/images/auth-acoustic-background-trial.png` | Copie sans modification de l’image |
| `app/src/main/res/drawable/meewav_logo.xml` | `public/assets/meewav-logo.svg` | Conversion des tracés SVG en VectorDrawable, couleurs et géométrie conservées |
| `app/src/main/res/drawable/auth_web_signature.xml` | Signature SVG de `src/pages/AuthPage.tsx` | Tracé et couleur conservés en VectorDrawable |

Sur demande de l’utilisateur, la fenêtre Android reprend maintenant le tracé SVG, les dégradés et les couches de contour de `src/components/auth/AuthPanelChrome.tsx`, dans `AuthWindowPanel.kt`. Les effets sont dessinés et mis en cache à la résolution d’affichage. Les styles du bouton et des séparateurs viennent de `src/styles/auth.css` et `src/components/auth/auth-panel.css`. La largeur est adaptée au téléphone ; la hauteur reste identique entre les étapes et les contenus longs défilent à l’intérieur. Les champs et actions restent des composants Android.

Le fond correspond au choix graphique transmis par l’utilisateur le 13 septembre 2026. La réutilisation dans son application Android est autorisée par la mission. Cette provenance ne constitue pas une nouvelle attribution d’auteur ni une licence publique du logo ou du fond.

L’icône de lancement est un tracé natif provisoire de l’onde Meewav. Elle doit faire l’objet d’une validation graphique avant diffusion publique.

## Police

Inter variable est copiée depuis le dépôt officiel [Google Fonts / Inter](https://github.com/google/fonts/tree/main/ofl/inter). La notice SIL Open Font License est conservée intégralement dans [Inter-OFL.txt](Licences/Inter-OFL.txt). Aucune modification de la police.

## Bibliothèques

Jetpack Compose et les Material Icons sont des dépendances AndroidX, sous Apache 2.0. Le SDK communautaire Supabase Kotlin est sous MIT ; Kotlin, kotlinx et Ktor suivent leurs licences distribuées. Les bibliothèques restent récupérées par Gradle. L’inventaire juridique de la distribution finale devra être généré avec les dépendances effectivement embarquées avant publication.

Aucune licence générale du produit Meewav n’est créée par ce premier lot.

## Ressources du parcours iOS

Le fond actif de l’authentification est désormais `app/src/main/res/drawable-nodpi/auth_ios_background.png`, copie sans transformation de `Meewav/Assets.xcassets/AuthBackground.imageset/auth_background.png` au commit iOS ci-dessous. Le fond Web du premier essai est conservé dans les ressources mais n’est plus utilisé par cet écran.

La fenêtre iOS et son socle ont été essayés puis retirés à la demande de l’utilisateur, au profit de la fenêtre du site Web décrite ci-dessus. Le fond et le parcours d’inscription restent issus de la référence iOS.

Source : dépôt `sipiyou39/Meewav`, commit `aea7251a60a2b61d775901fcf39a62036fd108c4`. Les 28 avatars PNG sont copiés sans modification depuis les imagesets ci-dessous ; libellés, descriptions et ordre viennent de `Meewav/Features/Auth/Models/AvatarProfile.swift`. La réutilisation dans Android est demandée par l’utilisateur. Cette copie ne vaut pas attribution d’auteur ni nouvelle licence publique.

| Ressource Android dans `drawable-nodpi/` | Source iOS |
| --- | --- |
| `avatar_user_f.png` | `Meewav/Assets.xcassets/UserFIcon.imageset/UserFIcon@3x.png` |
| `avatar_accordeon.png` | `Meewav/Assets.xcassets/AccordeonIcon.imageset/AccordeonIcon@3x.png` |
| `avatar_micro.png` | `Meewav/Assets.xcassets/MicroIcon.imageset/MicroIcon@3x.png` |
| `avatar_inge_son.png` | `Meewav/Assets.xcassets/IngeSonIcon.imageset/IngeSonIcon@3x.png` |
| `avatar_bassiste.png` | `Meewav/Assets.xcassets/BassisteIcon.imageset/BassisteIcon@3x.png` |
| `avatar_beatboxer.png` | `Meewav/Assets.xcassets/BeatboxerIcon.imageset/BeatboxerIcon@3x.png` |
| `avatar_beatmaker.png` | `Meewav/Assets.xcassets/BeatmakerIcon.imageset/BeatmakerIcon@3x.png` |
| `avatar_instr_cuivre.png` | `Meewav/Assets.xcassets/InstrCuivreIcon.imageset/InstrCuivreIcon@3x.png` |
| `avatar_compositeur.png` | `Meewav/Assets.xcassets/CompositeurIcon.imageset/CompositeurIcon@3x.png` |
| `avatar_dansseur.png` | `Meewav/Assets.xcassets/DansseurIcon.imageset/DansseurIcon@3x.png` |
| `avatar_dansseuse2.png` | `Meewav/Assets.xcassets/Dansseuse2Icon.imageset/Dansseuse2Icon@3x.png` |
| `avatar_dj.png` | `Meewav/Assets.xcassets/DjIcon.imageset/DjIcon@3x.png` |
| `avatar_batteur.png` | `Meewav/Assets.xcassets/BatteurIcon.imageset/BatteurIcon@3x.png` |
| `avatar_guitare_elec.png` | `Meewav/Assets.xcassets/GuitareElecIcon.imageset/GuitareElecIcon@3x.png` |
| `avatar_orga_event.png` | `Meewav/Assets.xcassets/OrgaEventIcon.imageset/OrgaEventIcon@3x.png` |
| `avatar_guitare.png` | `Meewav/Assets.xcassets/GuitareIcon.imageset/GuitareIcon@3x.png` |
| `avatar_manager.png` | `Meewav/Assets.xcassets/ManagerIcon.imageset/ManagerIcon@3x.png` |
| `avatar_user.png` | `Meewav/Assets.xcassets/UserIcon.imageset/UserIcon@3x.png` |
| `avatar_percussion.png` | `Meewav/Assets.xcassets/PercussionIcon.imageset/PercussionIcon@3x.png` |
| `avatar_pianiste.png` | `Meewav/Assets.xcassets/PianisteIcon.imageset/PianisteIcon@3x.png` |
| `avatar_label.png` | `Meewav/Assets.xcassets/LabelIcon.imageset/LabelIcon@3x.png` |
| `avatar_studio.png` | `Meewav/Assets.xcassets/StudioIcon.imageset/StudioIcon@3x.png` |
| `avatar_instr_cordes.png` | `Meewav/Assets.xcassets/InstrCordesIcon.imageset/InstrCordesIcon@3x.png` |
| `avatar_synthetiseur.png` | `Meewav/Assets.xcassets/SynthetiseurIcon.imageset/SynthetiseurIcon@3x.png` |
| `avatar_proffesseur.png` | `Meewav/Assets.xcassets/ProffesseurIcon.imageset/ProffesseurIcon@3x.png` |
| `avatar_violon.png` | `Meewav/Assets.xcassets/ViolonIcon.imageset/ViolonIcon@3x.png` |
| `avatar_clippeur.png` | `Meewav/Assets.xcassets/ClippeurIcon.imageset/ClippeurIcon@3x.png` |
| `avatar_instr_vent.png` | `Meewav/Assets.xcassets/InstrVentIcon.imageset/InstrVentIcon@3x.png` |

`PreviewTerms.kt` reprend intégralement `TermsDetailsView.demoTerms`, identifié comme texte de démonstration dans le code iOS. Il est présenté comme tel et ne vaut pas validation juridique des conditions publiques.
