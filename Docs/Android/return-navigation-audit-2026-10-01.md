# Retours visibles des vues Android

## Corrections

- Marketplace : chevron de fermeture de l'annonce dans le panneau, fixé par `position: sticky` pendant son défilement. Il appelle la fermeture existante pour restaurer le catalogue et son focus. Le zoom garde sa propre fermeture prioritaire.
- Marketplace, Mes annonces et Mes favoris : le menu supérieur devient un chevron. Il restitue la vue visitée précédente via l'historique d'état existant ; sans historique, il ferme la vue utilitaire.
- Tremplin, artiste, collection, achat/revente et espace jeton : chevron supérieur branché sur les callbacks de retour de chaque vue, avec leur origine existante et leurs paramètres. Les pages principales conservent leur menu.
- Profil public et page de visionnage de La Scène : leur retour existant reste visible pendant le défilement. Le scrollport du profil public reste indépendant de l'essai de repli.

Le marqueur `data-feature-return` signale une page interne au shell et au détecteur de défilement. Ses changements sont observés sans boucle de rendu continue. Les commandes du shell gardent leur cible tactile existante ; le chevron du détail d'annonce mesure 44 × 44 px avec un libellé accessible.

## Audit Luna

L'audit des sources a couvert Marketplace, La Scène, Rooms, Tremplin, Profil et Messagerie. Le détail d'annonce n'avait aucun retour visible, seulement un overlay de fermeture ; les utilitaires Marketplace n'avaient pas de retour direct. Les autres vues secondaires examinées possèdent un contrôle de retour ou de fermeture : lecteur et studio de La Scène, lancement et viewer des Rooms, vues internes Tremplin, profil public, médias et espace privé, conversations et contextes de la messagerie. Aucun changement du geste de chat détaillé n'est nécessaire.

L'audit natif complémentaire a vérifié l'authentification/globe (`AuthScreen.kt`, `SceneGlobeArrival.kt`), les sélecteurs ville/quartier (`MusicSceneLocation.kt`) et la console Wave (`WaveMixerScreen.kt`). Leurs vues internes possèdent un chevron, une fermeture ou un retour système cohérent. Aucun détail captif supplémentaire n'a été identifié ; les réglages système restent gérés par Android.

## Vérification sur appareils

L'APK SHA256 `1D1032F870D9D5E97A088355586E119FA561A8862C179E088A2C7A917D7BB730` a été installé par Wi-Fi sur Redmi et S22 ; les deux `base.apk` distants correspondent à ce hash. Les six bundles passent la vérification : 4 852 assets, 193 imports, aucun fichier manquant ni taille incohérente.

Sur le S22, les sondes DOM de l'application installée confirment :

- Messagerie : les deux bandes passent de y=0/62 à y=-120/-58 lors de la sonde d'état masqué, avec transition de 180 ms.
- Rooms : première barre haute de 56 px, contrôles à y=56 ; aucun espace entre les deux. La réserve totale du contenu correspond à leur hauteur mesurée.
- Annonce Marketplace : après défilement programmatique jusqu'au bas, le chevron reste visible et mesure 44 × 44 px. Son clic ferme le panneau et restaure le catalogue et le focus de la fiche d'origine.
- Mes favoris : retour supérieur de 44 × 44 px ; le clic revient à l'accueil et restaure le focus.

Les sondes d'état et de défilement sont synthétiques. Elles ne confirment pas le ressenti d'un geste rapide réel dans La Scène. La vérification visuelle du Redmi était masquée par le volet système de notifications, qui n'a pas été manipulé. Les tests isolés couvrent le chargement des cartes, les variations d'offset pendant l'inertie, le changement de direction confirmé et la sauvegarde sans travail de mesure/stockage à chaque événement.

Les corrections de navigation sont commitées séparément du correctif de repli des bandeaux. L'annulation de l'essai de repli doit conserver ces corrections, puis reconstruire les bundles Android. Les versions web et Windows ne sont pas modifiées.
