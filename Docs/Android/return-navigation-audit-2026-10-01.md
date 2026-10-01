# Retours visibles des vues Android

## Corrections

- Marketplace : chevron de fermeture de l'annonce dans le panneau, fixé par `position: sticky` pendant son défilement. Il appelle la fermeture existante pour restaurer le catalogue et son focus. Le zoom garde sa propre fermeture prioritaire.
- Marketplace, Mes annonces et Mes favoris : le menu supérieur devient un chevron. Il restitue la vue visitée précédente via l'historique d'état existant ; sans historique, il ferme la vue utilitaire.
- Tremplin, artiste, collection, achat/revente et espace jeton : chevron supérieur branché sur les callbacks de retour de chaque vue, avec leur origine existante et leurs paramètres. Les pages principales conservent leur menu.
- Profil public et page de visionnage de La Scène : leur retour existant reste visible pendant le défilement. Le scrollport du profil public reste indépendant de l'essai de repli.

Le marqueur `data-feature-return` signale une page interne au shell et au détecteur de défilement. Ses changements sont observés sans boucle de rendu continue. Les commandes du shell gardent leur cible tactile existante ; le chevron du détail d'annonce mesure 44 × 44 px avec un libellé accessible.

## Audit Luna

L'audit des sources a couvert Marketplace, La Scène, Rooms, Tremplin, Profil et Messagerie. Le détail d'annonce n'avait aucun retour visible, seulement un overlay de fermeture ; les utilitaires Marketplace n'avaient pas de retour direct. Les autres vues secondaires examinées possèdent un contrôle de retour ou de fermeture : lecteur et studio de La Scène, lancement et viewer des Rooms, vues internes Tremplin, profil public, médias et espace privé, conversations et contextes de la messagerie. Aucun changement du geste de chat détaillé n'est nécessaire.

Les corrections de navigation sont commitées séparément du correctif de repli des bandeaux. L'annulation de l'essai de repli doit conserver ces corrections, puis reconstruire les bundles Android. Les versions web et Windows ne sont pas modifiées.
