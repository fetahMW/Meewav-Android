# Mémoire de design — Meewav Android

## Violet urbain Meewav — référence de messagerie

Le 15 septembre 2026, l’utilisateur désigne explicitement le violet du CTA
« Ajouter / Créer un groupe » comme **notre violet urbain**. Le rond d’envoi
(icône enveloppe/avion) et tous les CTA principaux de la messagerie doivent
reprendre cette finition.

Source : `.mw-chat-header__primary-action` dans
`app/src/main/messaging-source/vendor/src/features/messaging/messaging-page.css`.

- Dégradé : `linear-gradient(135deg, rgba(79,53,158,.96), rgba(76,47,169,.94))`.
- Couleurs : **#4F359E → #4C2FA9** ; conserver l’angle et les opacités.
- Bordure : `rgba(98,67,192,.34)`.
- Reflet et ombre : `inset 0 1px 0 rgba(255,255,255,.14), 0 8px 24px rgba(57,38,114,.28)`.
- Variables communes : `--meewav-violet-urbain`, `--meewav-violet-urbain-cta`,
  `--meewav-violet-urbain-rim` dans `app/src/main/messaging-source/mobile.css`.

Cette décision remplace les références précédentes **pour les CTA de messagerie**.
Ne pas réinventer un violet mat, rose ou prune à chaque modification.
Les états interactifs gardent ce dégradé ; un bouton désactivé conserve sa sémantique
et son atténuation. Les boutons secondaires restent neutres.
Les bulles conservent les formes et couleurs du site demandées séparément.
Le bandeau et le champ de saisie en verre restent inchangés.
