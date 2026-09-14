# Documentation Android

- [Authentification : contrat, limites, essais](Auth/README.md)
- [Ressources et droits](Provenance.md)

## Ordre de construction

1. **Authentification** : écran d’entrée et comptes Supabase partagés. Lot en cours.
2. **Personnalisation** : avatar, rôle, scène musicale et confidentialité ; raccorder les contrats actuels après comparaison Web/iOS/base déployée.
3. **Navigation et globe** : définir l’intégration Android du globe existant sans remplacer l’application par une WebView complète.
4. **Fonctionnalités**, une à la fois, avec priorité produit à confirmer. Les Rooms utiliseront BytePlus ; ce choix ne valide pas encore leurs permissions ni leur fonctionnement réel.

La présence de code, une compilation réussie et un essai réel sur téléphone sont des états distincts. Les validations visuelles appartiennent à l’utilisateur. Aucun service du Web ou d’iOS n’est remplacé par ce dépôt.
