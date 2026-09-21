# Corrections et raccordements — 21 septembre 2026

## Livré dans cette passe
- Messagerie : couches de fond intermédiaires neutralisées, liste bornée avec un seul défilement vertical au-dessus du fond acoustique.
- Scène / Explorer : correction du véritable bandeau Explorer et des sélecteurs ; suppression du verre violet intermédiaire.
- Pré-profils partagés : transmission des callbacks contact, profil et collaboration ; destinations natives distinctes.
- Classe : envoi, lecture et réponse des messages privés raccordés aux RPC iOS existantes `rooms_classe_send_private_message_v1` et `rooms_classe_private_messages_v1`. Ces messages restent dans la Classe.
- Un échec serveur conserve le brouillon et affiche une erreur. Les messages collectifs natifs en room réelle ne sont plus annoncés comme envoyés localement.
- Données de démonstration conservées.

## Vérification
Bundles Globe, Rooms, Messaging et Scène reconstruits. Assemblage Android réussi. Deux tests de session/identité réussis. Aucun contrôle visuel et aucun échange entre comptes réels effectué.

## Limites à ne pas confondre avec un câblage complet
La sélection des rooms réelles et le lancement natif ne transmettent pas encore systématiquement leur contexte live. La Classe utilise encore une entrée viewer de démonstration : les RPC privées sont adaptées mais le parcours réel complet exige ce raccordement d’entrée. Les RPC Loge propres au client Android restent absentes du serveur ; la migration locale doit encore être validée avant déploiement. Les opérations métier Market et Tremplin, les notifications push et plusieurs fonctions du profil restent couvertes par l’audit global, pas validées par cette livraison.

Cette passe ne constitue donc pas une validation de bout en bout de toute l’application.
