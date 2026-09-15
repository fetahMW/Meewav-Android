# Documentation Android

- [Authentification : contrat, limites, essais](Auth/README.md)
- [Ressources et droits](Provenance.md)
- [Référence mobile iOS et ordre de portage](Reference-iOS.md)
- [Globe : audit Web et arrivée en paysage](Globe/README.md)
- [Messagerie : reprise Web, interface Android et limites serveur](Messaging/README.md)

## Repère artistique à conserver — Violet urbain Meewav

Nom retenu à la demande de l’utilisateur le 15 septembre 2026 : **Violet urbain
Meewav**. « Notre violet » désigne la finition du bouton **Explorer les artistes**,
reprise de la fenêtre d’authentification native, et non l’ancien rose du globe.

Pour les CTA et les accents du Tchat, la référence explicite est le bouton **Se connecter**
de la page Bienvenue : `IosAuthAction` dans `features/auth/IosLoginScene.kt`.
Reprendre son dégradé vertical **`#5137A1 → #4E349F → #372574`** (arrêts 0 %, 50 %, 100 %),
avec bordure `#7960B2` : la première couleur seule ne reproduit pas son rendu.
La messagerie l’expose par `--mobile-violet-cta`. Conserver les formes et reliefs des bulles.

La couleur signature est `#5137A1`. Le rendu complet comprend le fond sombre
`#2B1B5C` / `#19122F` / `#0B0816` / `#080610` / `#1A1234`, ses lumières diffuses
et le contour `#BDA3E5` / `#7960B2` / `#5137A1` / `#8162B7`.
Réutiliser les variables **`--meewav-violet-urbain-*`** de
[full-globe-mobile.css](../app/src/main/globe-source/full-globe-mobile.css) pour
les surfaces concernées, au lieu de choisir un nouveau violet à chaque retouche.
Explorer les artistes, Top 10, filtres artistes, Play/Pause, bouton muet, Retour au globe et les accents du
préprofil (suivi, collaboration, contour du portrait, trait des onglets) partagent
cette référence, y compris leurs états interactifs. La fenêtre native source est `renderIosStageWindow` dans
`app/src/main/java/com/meewav/android/features/auth/IosAvatarStage.kt`.

## Ordre de construction

1. **Authentification** : parcours mobile iOS adapté en Compose ; connexion, avatar, type de profil, inscription et ville manuelle. Compilation et essais réels sont distingués dans le guide du lot.
2. **Personnalisation** : résoudre la scène musicale, achever le profil partagé et vérifier la confidentialité effective. Les métadonnées d’avatar et de ville sont déjà envoyées.
3. **Navigation et globe** : arrivée en paysage puis scène du globe Web embarquée dans une WebView dédiée. L’authentification reste native ; la messagerie est raccordée, les autres destinations restent à intégrer. Voir le guide du globe pour l’état des contrôles.
4. **Messagerie** : reprise du code Web à la demande utilisateur, avec enveloppe Android en portrait, fichiers/vocaux et session native. Le bypass reste une démo locale ; la disponibilité des contrats serveur reste à confirmer. Voir le [guide du portage](Messaging/README.md).
5. **Rooms** : prochain portage. Elles utiliseront BytePlus ; ce choix ne valide pas encore leurs permissions ni leur fonctionnement réel.

La présence de code, une compilation réussie et un essai réel sur téléphone sont des états distincts. Les validations visuelles appartiennent à l’utilisateur. Aucun service du Web ou d’iOS n’est remplacé par ce dépôt.
