# Profil Android — passe Médias et Espace privé, 15 septembre 2026

## Changements

- Médias : cinq destinations dans un bandeau fixe translucide avec blur, commandes
  tactiles, cartes plus courtes, titres de studio condensés, badges et progression
  réorganisés. Les images et fichiers gardent leur qualité d’origine.
- Espace privé : six destinations visibles, cartes graphite, CTA violet urbain,
  transactions présentées en lignes mobiles, sélection d’une fiche avec accès
  direct et retour à la liste. Les doublons de commandes sont réduits.
- Lecteur : les fichiers `/media/` manquaient au paquet Android. Ils sont maintenant
  copiés depuis le Web et inscrits dans le manifeste local. Les commandes de
  lecture ont leur espace sous l’aperçu et ne recouvrent plus Play/Pause.

## Contrôles réalisés à la demande de l’utilisateur

Samsung connecté, viewport WebView de 384 × 748,8 CSS px : captures avant/après de
Médiathèque, La Cage, Setlist, Cadeaux, Badges, Portefeuille, Transactions, Contrats,
Matériel, Sécurité et Organisation. Les captures Android sont dans
`app/build/profile-review/` (dossier local ignoré par Git).

Les contrôles ciblés ont couvert les filtres de médias, la sélection puis son
annulation, l’ouverture d’un éditeur Cage, d’une setlist et de fiches privées,
ainsi que le retour à la liste. Les écrans contrôlés n’ont plus de débordement
horizontal du contenu. Les six modules privés restent accessibles lors du scroll.

La lecture a été déclenchée par des taps ADB sur le téléphone :
`hazy-after-hours.mp3` atteint 2,63 s et `dj-turntable.mp4` 2,72 s,
avec `paused=false`, `readyState=4` et aucune erreur média. Les deux autres
MP3/MP4 de la médiathèque chargent aussi leurs métadonnées sans erreur.

Ces contrôles portent sur la présentation et les interactions locales en démo.
Aucun retrait, signature, invitation, changement de sécurité ou autre opération
serveur réelle n’a été exécuté. Ils ne constituent pas une validation de ces services.
