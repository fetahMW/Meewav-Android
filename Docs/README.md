# Documentation Android

- [Authentification : contrat, limites, essais](Auth/README.md)
- [Ressources et droits](Provenance.md)
- [Référence mobile iOS et ordre de portage](Reference-iOS.md)
- [Globe : audit Web et arrivée en paysage](Globe/README.md)

## Repère artistique à conserver — Violet urbain Meewav

Nom retenu à la demande de l’utilisateur le 15 septembre 2026 : **Violet urbain
Meewav**. « Notre violet » désigne la finition du bouton **Explorer les artistes**,
reprise de la fenêtre d’authentification native, et non l’ancien rose du globe.

La couleur signature est `#5137A1`. Le rendu complet comprend le fond sombre
`#2B1B5C` / `#19122F` / `#0B0816` / `#080610` / `#1A1234`, ses lumières diffuses
et le contour `#BDA3E5` / `#7960B2` / `#5137A1` / `#8162B7`.
Réutiliser les variables **`--meewav-violet-urbain-*`** de
[full-globe-mobile.css](../app/src/main/globe-source/full-globe-mobile.css) pour
les surfaces concernées, au lieu de choisir un nouveau violet à chaque retouche.
Explorer les artistes, Top 10, Play/Pause et Retour au globe partagent cette
référence. La fenêtre native source est `renderIosStageWindow` dans
`app/src/main/java/com/meewav/android/features/auth/IosAvatarStage.kt`.

## Ordre de construction

1. **Authentification** : parcours mobile iOS adapté en Compose ; connexion, avatar, type de profil, inscription et ville manuelle. Compilation et essais réels sont distingués dans le guide du lot.
2. **Personnalisation** : résoudre la scène musicale, achever le profil partagé et vérifier la confidentialité effective. Les métadonnées d’avatar et de ville sont déjà envoyées.
3. **Navigation et globe** : arrivée en paysage puis scène du globe Web embarquée dans une WebView dédiée. L’authentification reste native ; les autres destinations ne sont pas encore raccordées à cette vue. Voir le guide du globe pour l’état des contrôles.
4. **Messagerie puis Rooms** : reprendre les écrans mobiles et les contrats vérifiés dans l’iOS, une fonctionnalité à la fois. Les Rooms utiliseront BytePlus ; ce choix ne valide pas encore leurs permissions ni leur fonctionnement réel.

La présence de code, une compilation réussie et un essai réel sur téléphone sont des états distincts. Les validations visuelles appartiennent à l’utilisateur. Aucun service du Web ou d’iOS n’est remplacé par ce dépôt.
