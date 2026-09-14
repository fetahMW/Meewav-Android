# Documentation Android

- [Authentification : contrat, limites, essais](Auth/README.md)
- [Ressources et droits](Provenance.md)
- [Référence mobile iOS et ordre de portage](Reference-iOS.md)
- [Globe : audit Web et arrivée en paysage](Globe/README.md)

## Ordre de construction

1. **Authentification** : parcours mobile iOS adapté en Compose ; connexion, avatar, type de profil, inscription et ville manuelle. Compilation et essais réels sont distingués dans le guide du lot.
2. **Personnalisation** : résoudre la scène musicale, achever le profil partagé et vérifier la confidentialité effective. Les métadonnées d’avatar et de ville sont déjà envoyées.
3. **Navigation et globe** : arrivée en paysage puis scène du globe Web embarquée dans une WebView dédiée. L’authentification reste native ; les autres destinations ne sont pas encore raccordées à cette vue. Voir le guide du globe pour l’état des contrôles.
4. **Messagerie puis Rooms** : reprendre les écrans mobiles et les contrats vérifiés dans l’iOS, une fonctionnalité à la fois. Les Rooms utiliseront BytePlus ; ce choix ne valide pas encore leurs permissions ni leur fonctionnement réel.

La présence de code, une compilation réussie et un essai réel sur téléphone sont des états distincts. Les validations visuelles appartiennent à l’utilisateur. Aucun service du Web ou d’iOS n’est remplacé par ce dépôt.
