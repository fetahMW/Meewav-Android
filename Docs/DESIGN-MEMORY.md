# Mémoire de design — Meewav Android

## Profil mobile — continuité avec la messagerie

Le 15 septembre 2026, l'utilisateur demande d'adapter les composants du profil
Web, en conservant leur fond et leurs matières. Les **CTA principaux du profil**
reprennent exactement la finition de messagerie décrite ci-dessous ; les menus
et sous-menus reprennent ses bandeaux translucides, son flou et son trait effilé.
La disposition iOS du dock est conservée (3 icônes + globe + 3 icônes), avec le
globe **de la navbar Android**, et non le globe iOS.
Voir [l'audit et les sources du profil](Profile/README.md).

À la demande suivante du 15 septembre, le petit globe du dock Profil tourne
lentement : un tour horizontal complet en **40 secondes**, mouvement linéaire
continu. La carte défile vers la gauche, le contour et l'éclairage restent
fixes. Une texture répétée est préparée une seule fois ; seule sa translation
CSS est animée, sans redessin du canvas à chaque image. La rotation se met
en pause quand Android quitte le profil et respecte la réduction des animations.
Le petit globe des autres écrans reste fixe par défaut.

### Accueil du profil — finition après captures Samsung

Le bandeau supérieur et la navbar inférieure reprennent la matière du champ
de saisie de messagerie : `linear-gradient(125deg,#ffffff15,#ffffff05 48%,#ffffff0b),#17191faa`,
avec `blur(22px) saturate(1.15)`. Reflets et ombre :
`inset 0 1px 0 #ffffff12,inset 0 -1px 0 #0003,0 6px 20px #0004`.
Les icônes reposent sur cette surface commune, sans pavés individuels ;
l'icône active est indiquée par un petit trait effilé lumineux.

Le bandeau reste hors de la zone défilante : seul `.profile-main` défile.
La navbar est ancrée à `bottom: 0` dans la WebView. Android réserve déjà
l'espace des barres système : ne pas ajouter un second `safe-area-inset-bottom`
ou une marge qui la ferait flotter au-dessus de la navigation Samsung.

L'accueil privilégie une identité compacte (portrait et nom côte à côte),
trois compteurs sur une ligne, puis les cartes Activité, Priorités,
Progression, Classement et Activité récente. Progression et Classement sont
séparés. Les cartes sont en verre fumé sombre neutre, avec un contour fin,
sans empilement de surfaces violettes. Les CTA conservent la référence ci-dessous.

## Violet urbain Meewav — référence de messagerie

Le 15 septembre 2026, l’utilisateur précise la référence exacte :
**Groupes → Membres → Inviter**, comme **notre violet urbain**. Le rond d’envoi
(icône enveloppe/avion) et tous les CTA principaux de la messagerie doivent
reprendre cette finition.

Source visible prioritaire : le bouton `.agw-primary-button` « Inviter » de
`ArtistGroupsWorkspace.tsx`, dans la vue Membres. Sa finition Android vient du
jeton partagé dans `app/src/main/messaging-source/mobile.css`.
Ne pas prendre une ancienne couleur de sa feuille Web avant les surcharges Android.

- Dégradé : `linear-gradient(135deg, rgba(79,53,158,.96), rgba(76,47,169,.94))`.
- Couleurs : **#4F359E → #4C2FA9** ; conserver l’angle et les opacités.
- Bordure : `rgba(98,67,192,.34)`.
- Reflet et ombre : `inset 0 1px 0 rgba(255,255,255,.14), 0 8px 24px rgba(57,38,114,.28)`.
- Variables communes : `--meewav-violet-urbain`, `--meewav-violet-urbain-cta`,
  `--meewav-violet-urbain-rim` dans `app/src/main/messaging-source/mobile.css`.

Cette décision remplace les références précédentes **pour les CTA de messagerie**.
Ne pas réinventer un violet mat, rose ou prune à chaque modification.
Les états interactifs gardent ce dégradé. Le rond d’envoi conserve **une opacité de 1**,
y compris avec un champ vide : l’ancienne opacité de 0,4 altérait son violet.
Son icône seule passe à 0,45 quand il est désactivé ; l’envoi reste réellement
désactivé, sans permettre de message vide. Les boutons secondaires restent neutres.
Les bulles conservent les formes et couleurs du site demandées séparément.
Le bandeau et le champ de saisie en verre restent inchangés.
